import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import Anthropic from '@anthropic-ai/sdk';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const app  = express();
const port = process.env.PORT || 3001;

// Trust Vercel's proxy so rate limiting reads the real client IP
app.set('trust proxy', 1);

// ── CORS ───────────────────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  'https://contractshield-backend.vercel.app',
  'http://localhost:8081',
  'http://localhost:19006',
  'http://localhost:3000',
];
app.use(cors({
  origin: (origin, cb) => {
    // Native mobile apps send no Origin header — allow them
    if (!origin) return cb(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    cb(new Error('Not allowed by CORS'));
  },
}));

// ── Rate limiting ──────────────────────────────────────────────────────────────
const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please slow down.' },
});
const analyzeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { error: 'Analysis rate limit reached. Please wait a moment.' },
});
const checkoutLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'Too many requests.' },
});

app.use(generalLimiter);

// ── Stripe webhook — MUST be raw bytes, registered BEFORE express.json() ───────
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'] as string;
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    console.error('Webhook signature error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Idempotency — skip if already processed
  const eventId = event.id;
  const { data: existing } = await supabase.from('processed_webhook_events').select('id').eq('event_id', eventId).single();
  if (existing) return res.json({ received: true });

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId  = session.metadata?.userId;
    if (userId) {
      await supabase.from('profiles').update({
        is_pro: true,
        stripe_customer_id: session.customer,
      }).eq('id', userId);
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object as Stripe.Subscription;
    const { data: profile } = await supabase.from('profiles').select('id').eq('stripe_customer_id', sub.customer).single();
    if (profile) await supabase.from('profiles').update({ is_pro: false }).eq('id', profile.id);
  }

  // Mark event as processed
  await supabase.from('processed_webhook_events').insert({ event_id: eventId });

  res.json({ received: true });
});

app.use(express.json({ limit: '10mb' }));

// ── Clients ────────────────────────────────────────────────────────────────────
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
const stripe    = new Stripe(process.env.STRIPE_SECRET_KEY!);
const supabase  = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);

// ── Whitelisted price IDs ──────────────────────────────────────────────────────
const VALID_PRICE_IDS = new Set([
  'price_1TY8noPwwT0D6amwKPNvzhTO', // monthly
  'price_1TY8npPwwT0D6amwuwTPZRm4', // yearly
]);

const VALID_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);

const FREE_LIMIT = 3;

// ── Auth middleware ────────────────────────────────────────────────────────────
const requireAuth = async (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return res.status(401).json({ error: 'Invalid token' });
  req.user = user;
  next();
};

// ── Analyze document ───────────────────────────────────────────────────────────
app.post('/api/analyze', analyzeLimiter, requireAuth, async (req: any, res) => {
  let { text, imageBase64, imageType, pdfBase64 } = req.body;

  // Input validation
  if (text !== undefined && typeof text !== 'string') return res.status(400).json({ error: 'Invalid input' });
  if (imageBase64 !== undefined && typeof imageBase64 !== 'string') return res.status(400).json({ error: 'Invalid input' });
  if (pdfBase64 !== undefined && typeof pdfBase64 !== 'string') return res.status(400).json({ error: 'Invalid input' });
  if (!text && !imageBase64 && !pdfBase64) return res.status(400).json({ error: 'No document provided' });
  if (imageBase64 && imageBase64.length > 6 * 1024 * 1024) return res.status(400).json({ error: 'Image too large. Please use a smaller photo.' });
  if (imageBase64 && imageType && !VALID_IMAGE_TYPES.has(imageType)) return res.status(400).json({ error: 'Unsupported image type.' });

  const userId = req.user.id;

  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_pro, free_analyses_used')
      .eq('id', userId)
      .single();

    const isPro = profile?.is_pro || false;
    const used  = profile?.free_analyses_used || 0;

    // If profile row missing (shouldn't happen, but guard anyway)
    if (!profile) {
      await supabase.from('profiles').upsert({ id: userId, is_pro: false, free_analyses_used: 0 });
    }

    if (!isPro && used >= FREE_LIMIT) {
      return res.status(402).json({ error: 'Free limit reached', upgradeRequired: true });
    }

    const prompt = buildPrompt(text, isPro);
    const content = pdfBase64
      ? [
          { type: 'document' as const, source: { type: 'base64' as const, media_type: 'application/pdf' as const, data: pdfBase64 } },
          { type: 'text' as const, text: prompt }
        ]
      : imageBase64
      ? [
          { type: 'image' as const, source: { type: 'base64' as const, media_type: (imageType || 'image/jpeg') as any, data: imageBase64 } },
          { type: 'text' as const, text: prompt + ' The document is in the image.' }
        ]
      : prompt;

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2000,
      system: 'You are a legal document analyst. Output only raw JSON. Start with { and end with }. Never include personal identifiers, names, SSNs, emails, or addresses in your response.',
      messages: [{ role: 'user', content }],
    });

    const raw    = (message.content[0] as any).text;
    const result = parseJSON(raw);
    if (!result) return res.status(500).json({ error: 'Analysis failed. Please try again.' });

    if (!isPro) {
      await supabase.from('profiles').update({ free_analyses_used: used + 1 }).eq('id', userId);
    }

    await supabase.from('analyses').insert({ user_id: userId, result, created_at: new Date().toISOString() });

    res.json(result);

  } catch (e: any) {
    console.error('Analyze error:', e?.constructor?.name, e?.message, e?.status);
    res.status(500).json({ error: 'Analysis failed. Please try again.' });
  }
});

// ── Usage ──────────────────────────────────────────────────────────────────────
app.get('/api/usage', requireAuth, async (req: any, res) => {
  try {
    const { data } = await supabase
      .from('profiles')
      .select('is_pro, free_analyses_used')
      .eq('id', req.user.id)
      .single();
    res.json({ isPro: data?.is_pro || false, used: data?.free_analyses_used || 0, limit: FREE_LIMIT });
  } catch (e: any) {
    console.error('Usage error:', e?.message);
    res.status(500).json({ error: 'Could not load usage.' });
  }
});

// ── Stripe: create checkout ────────────────────────────────────────────────────
app.post('/api/stripe/checkout', checkoutLimiter, requireAuth, async (req: any, res) => {
  const { priceId } = req.body;

  if (!priceId || !VALID_PRICE_IDS.has(priceId)) {
    return res.status(400).json({ error: 'Invalid plan selected.' });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: { trial_period_days: 7 },
      success_url: 'https://contractshield-backend.vercel.app/payment-success',
      cancel_url:  'https://contractshield-backend.vercel.app/payment-cancel',
      metadata:    { userId: req.user.id },
    });
    res.json({ url: session.url });
  } catch (e: any) {
    console.error('Checkout error:', e);
    res.status(500).json({ error: 'Could not create checkout session.' });
  }
});

// ── Stripe: customer portal ────────────────────────────────────────────────────
app.post('/api/stripe/portal', checkoutLimiter, requireAuth, async (req: any, res) => {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', req.user.id)
      .single();

    if (!profile?.stripe_customer_id) {
      return res.status(400).json({ error: 'No active subscription found' });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer:   profile.stripe_customer_id as string,
      return_url: 'https://contractshield-backend.vercel.app/payment-cancel',
    });
    res.json({ url: session.url });
  } catch (e: any) {
    console.error('Portal error:', e);
    res.status(500).json({ error: 'Could not open billing portal.' });
  }
});

// ── Analysis history ───────────────────────────────────────────────────────────
app.get('/api/history', requireAuth, async (req: any, res) => {
  const { data, error } = await supabase
    .from('analyses')
    .select('id, result, created_at')
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false })
    .limit(20);
  if (error) return res.status(500).json({ error: 'Could not load history.' });
  res.json(data || []);
});

// ── Delete account ─────────────────────────────────────────────────────────────
app.delete('/api/account', requireAuth, async (req: any, res) => {
  const userId = req.user.id;
  try {
    // Cancel any active Stripe subscriptions before deleting
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single();

    if (profile?.stripe_customer_id) {
      const subs = await stripe.subscriptions.list({
        customer: profile.stripe_customer_id as string,
        status: 'active',
      });
      await Promise.all(subs.data.map(sub => stripe.subscriptions.cancel(sub.id)));
    }

    await supabase.from('analyses').delete().eq('user_id', userId);
    await supabase.from('profiles').delete().eq('id', userId);
    const { error } = await supabase.auth.admin.deleteUser(userId);
    if (error) throw error;
    res.json({ success: true });
  } catch (e: any) {
    console.error('Delete account error:', e);
    res.status(500).json({ error: 'Could not delete account. Please contact support.' });
  }
});

// ── Payment redirect pages ────────────────────────────────────────────────────
app.get('/payment-success', (_req, res) => {
  res.send(`<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Payment Successful</title><style>body{margin:0;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#0b0d12;font-family:-apple-system,sans-serif;color:#fff}div{text-align:center;padding:32px}.icon{font-size:64px;margin-bottom:16px}.title{font-size:24px;font-weight:700;margin-bottom:8px;color:#4caf7d}.sub{font-size:14px;color:rgba(255,255,255,0.5)}</style></head><body><div><div class="icon">✅</div><div class="title">You're now Pro!</div><div class="sub">Switch back to the ContractShield app — your Pro access is ready.</div></div></body></html>`);
});

app.get('/payment-cancel', (_req, res) => {
  res.send(`<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Cancelled</title><style>body{margin:0;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#0b0d12;font-family:-apple-system,sans-serif;color:#fff}div{text-align:center;padding:32px}.icon{font-size:64px;margin-bottom:16px}.title{font-size:24px;font-weight:700;margin-bottom:8px;color:rgba(255,255,255,0.88)}.sub{font-size:14px;color:rgba(255,255,255,0.5)}</style></head><body><div><div class="icon">↩</div><div class="title">No problem!</div><div class="sub">Close this window to return to ContractShield.</div></div></body></html>`);
});

// ── Helpers ────────────────────────────────────────────────────────────────────
export const buildPrompt = (text?: string, isPro = false) => {
  const charLimit = isPro ? 20000 : 6000;
  const clean = (text || '')
    .replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[SSN]')
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL]')
    .replace(/\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g, '[PHONE]')
    .trim()
    .slice(0, charLimit);

  return 'Analyze this legal document. Return ONLY JSON with: score(1-10), type, verdict, summary, '
    + 'clauses(3-5 items: title/risk[high|medium|low]/plain/excerpt/standard/benchmark/script/action), '
    + 'dates(label/date/urgency[high|medium|low]/action), positives(string[]). Document: ' + clean;
};

export const parseJSON = (str: string) => {
  const candidates = [
    str.trim(),
    (str.match(/```(?:json)?\s*([\s\S]*?)```/) || [])[1],
    (str.match(/\{[\s\S]*\}/) || [])[0],
  ];
  for (const v of candidates) {
    if (!v) continue;
    try { const p = JSON.parse(v.trim()); if (p && typeof p === 'object') return p; } catch {}
  }
  return null;
};

if (process.env.VERCEL !== '1') {
  app.listen(port, () => console.log('ContractShield backend running on port ' + port));
}

export default app;

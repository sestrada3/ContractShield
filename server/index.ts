import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import Anthropic from '@anthropic-ai/sdk';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const https = require('https') as typeof import('https');

const app  = express();
const port = process.env.PORT || 3001;

app.set('trust proxy', 1);

// ── CORS ────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true); // native mobile apps
    return cb(null, true);              // allow all for now; tighten per domain in prod
  },
}));

// ── Rate limiting ────────────────────────────────────────────────────────────
app.use(rateLimit({ windowMs: 60_000, max: 30, standardHeaders: true, legacyHeaders: false }));

// ── Stripe webhook — must receive raw bytes BEFORE express.json() ────────────
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'] as string;
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    console.error('Webhook sig error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId  = session.metadata?.userId;
        if (!userId) break;

        if (session.mode === 'subscription') {
          // Also persist the Stripe customer ID so the billing portal can look it up
          await supabase.from('profiles').update({
            is_pro: true,
            stripe_customer_id: session.customer,
          }).eq('id', userId);
        }

        if (session.mode === 'payment') {
          const paid = session.amount_total || 0;
          const creditsToAdd = paid === 299 ? 1 : paid === 1499 ? 10 : 0;
          if (creditsToAdd > 0) {
            const { data: p } = await supabase.from('profiles').select('credits').eq('id', userId).single();
            await supabase.from('profiles').update({ credits: (p?.credits || 0) + creditsToAdd }).eq('id', userId);
          }
        }
        break;
      }
      case 'customer.subscription.deleted': {
        // Subscription objects carry metadata.userId set at checkout time
        const sub    = event.data.object as any;
        const userId = sub.metadata?.userId;
        if (userId) await supabase.from('profiles').update({ is_pro: false }).eq('id', userId);
        break;
      }
      case 'invoice.payment_failed': {
        // Invoice objects don't carry metadata.userId — look up the user by stripe_customer_id
        const invoice    = event.data.object as any;
        const customerId = invoice.customer as string;
        if (customerId) {
          await supabase.from('profiles').update({ is_pro: false }).eq('stripe_customer_id', customerId);
        }
        break;
      }
    }
  } catch (err: any) {
    console.error('Webhook handler error:', err.message);
  }

  res.json({ received: true });
});

app.use(express.json({ limit: '10mb' }));

app.get('/health', (_req, res) => res.json({ ok: true, build: 'v7-early-health' }));

// ── Clients ──────────────────────────────────────────────────────────────────
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
const stripe    = new Stripe(process.env.STRIPE_SECRET_KEY!);
const supabase  = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);

const FREE_LIMIT = 3;

const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);

const VALID_SUB_PRICES = new Set([
  process.env.STRIPE_PRICE_MONTHLY,
  process.env.STRIPE_PRICE_YEARLY,
].filter(Boolean) as string[]);

const VALID_ONETIME_PRICES = new Set([
  process.env.STRIPE_PRICE_CREDIT_1,
  process.env.STRIPE_PRICE_CREDIT_10,
].filter(Boolean) as string[]);

// ── Auth middleware ──────────────────────────────────────────────────────────
const requireAuth = async (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return res.status(401).json({ error: 'Invalid token' });
  req.user = user;
  next();
};

// ── Analyze contract ─────────────────────────────────────────────────────────
app.post('/api/analyze', rateLimit({ windowMs: 60_000, max: 5 }), requireAuth, async (req: any, res) => {
  const { text, imageBase64, imageType, pdfBase64 } = req.body;

  if (!text && !imageBase64 && !pdfBase64)
    return res.status(400).json({ error: 'No document provided' });
  if (text !== undefined && typeof text !== 'string')
    return res.status(400).json({ error: 'Invalid input: text must be a string' });
  if (imageBase64 && imageBase64.length > 6 * 1024 * 1024)
    return res.status(400).json({ error: 'Image too large. Please use an image under 4 MB.' });
  if (imageBase64 && imageType && !ALLOWED_IMAGE_TYPES.has(imageType))
    return res.status(400).json({ error: `Unsupported image type: ${imageType}` });
  if (pdfBase64 && pdfBase64.length > 6 * 1024 * 1024)
    return res.status(400).json({ error: 'PDF too large. Please use a PDF under 4 MB.' });

  const userId = req.user.id;

  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_pro, free_analyses_used, credits')
      .eq('id', userId)
      .single();

    const isPro   = profile?.is_pro || false;
    const used    = profile?.free_analyses_used || 0;
    const credits = profile?.credits || 0;

    if (!isPro && credits <= 0 && used >= FREE_LIMIT)
      return res.status(402).json({ error: 'Free limit reached', upgradeRequired: true });

    const prompt = buildPrompt(text, isPro);

    const content: any = pdfBase64
      ? [
          { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: pdfBase64 } },
          { type: 'text', text: prompt },
        ]
      : imageBase64
      ? [
          { type: 'image', source: { type: 'base64', media_type: imageType || 'image/jpeg', data: imageBase64 } },
          { type: 'text', text: prompt + ' The document is in the image.' },
        ]
      : prompt;

    const system = 'You are a legal document analyst. Output only raw JSON. Start with { and end with }. Never include personal identifiers, names, SSNs, emails, or addresses in your response.';

    let raw: string;

    if (pdfBase64) {
      raw = await callAnthropicPDF(process.env.ANTHROPIC_API_KEY!, system, content);
    } else {
      const message = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2000,
        system,
        messages: [{ role: 'user' as const, content }],
      });
      raw = (message.content[0] as any).text;
    }

    const result = parseJSON(raw);
    if (!result) return res.status(500).json({ error: 'Analysis failed. Please try again.' });

    // Deduct usage — upsert so a missing profile row doesn't silently skip tracking
    if (!isPro) {
      if (credits > 0) {
        await supabase.from('profiles')
          .upsert({ id: userId, credits: credits - 1 }, { onConflict: 'id' });
      } else {
        await supabase.from('profiles')
          .upsert({ id: userId, free_analyses_used: used + 1 }, { onConflict: 'id' });
      }
    }

    await supabase.from('analyses').insert({ user_id: userId, result, created_at: new Date().toISOString() });

    res.json(result);
  } catch (e: any) {
    console.error('Analyze error:', e?.status, e?.message);
    res.status(500).json({ error: e?.message || 'Analysis failed. Please try again.' });
  }
});

// ── Apple IAP receipt verification ──────────────────────────────────────────
const APPLE_CREDIT_PRODUCTS: Record<string, number> = {
  'com.contractshield.app.credit.single': 1,
  'com.contractshield.app.credit.pack10': 10,
};
const APPLE_SUB_PRODUCTS = new Set([
  'com.contractshield.app.pro.monthly',
  'com.contractshield.app.pro.yearly',
]);

async function verifyAppleReceipt(receiptData: string): Promise<boolean> {
  const body = JSON.stringify({
    'receipt-data': receiptData,
    'password': process.env.APPLE_SHARED_SECRET!,
    'exclude-old-transactions': true,
  });
  // Try production first; fall back to sandbox for dev/TestFlight builds
  for (const url of [
    'https://buy.itunes.apple.com/verifyReceipt',
    'https://sandbox.itunes.apple.com/verifyReceipt',
  ]) {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });
    const data = await r.json() as { status: number };
    if (data.status === 21007) continue; // sandbox receipt sent to production — retry sandbox
    return data.status === 0;
  }
  return false;
}

app.post('/api/apple/verify', requireAuth, async (req: any, res) => {
  const { receipt, productId } = req.body;
  if (!receipt || typeof receipt !== 'string')
    return res.status(400).json({ error: 'Missing receipt' });
  if (!productId || typeof productId !== 'string')
    return res.status(400).json({ error: 'Missing productId' });
  if (!APPLE_CREDIT_PRODUCTS[productId] && !APPLE_SUB_PRODUCTS.has(productId))
    return res.status(400).json({ error: 'Unknown productId' });

  const valid = await verifyAppleReceipt(receipt);
  if (!valid) return res.status(400).json({ error: 'Invalid or expired receipt' });

  const userId = req.user.id;
  try {
    if (APPLE_SUB_PRODUCTS.has(productId)) {
      await supabase.from('profiles').upsert({ id: userId, is_pro: true }, { onConflict: 'id' });
    } else {
      const creditsToAdd = APPLE_CREDIT_PRODUCTS[productId];
      const { data: p } = await supabase.from('profiles').select('credits').eq('id', userId).single();
      await supabase.from('profiles').upsert(
        { id: userId, credits: (p?.credits || 0) + creditsToAdd },
        { onConflict: 'id' }
      );
    }
    res.json({ success: true });
  } catch (e: any) {
    console.error('Apple verify error:', e.message);
    res.status(500).json({ error: 'Could not update account. Please contact support.' });
  }
});

// ── Usage ────────────────────────────────────────────────────────────────────
app.get('/api/usage', requireAuth, async (req: any, res) => {
  const { data } = await supabase
    .from('profiles')
    .select('is_pro, free_analyses_used, credits')
    .eq('id', req.user.id)
    .single();
  res.json({
    isPro:   data?.is_pro || false,
    used:    data?.free_analyses_used || 0,
    credits: data?.credits || 0,
    limit:   FREE_LIMIT,
  });
});

// ── History ──────────────────────────────────────────────────────────────────
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

// ── Stripe: subscription checkout ────────────────────────────────────────────
app.post('/api/stripe/checkout', requireAuth, async (req: any, res) => {
  const { priceId } = req.body;
  if (!priceId || typeof priceId !== 'string' || !priceId.startsWith('price_'))
    return res.status(400).json({ error: 'Invalid plan' });
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
    res.status(500).json({ error: 'Could not create checkout session.' });
  }
});

// ── Stripe: one-time checkout ────────────────────────────────────────────────
app.post('/api/stripe/checkout-onetime', requireAuth, async (req: any, res) => {
  const { priceId } = req.body;
  if (!priceId || typeof priceId !== 'string' || !priceId.startsWith('price_'))
    return res.status(400).json({ error: 'Invalid plan' });
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: 'https://contractshield-backend.vercel.app/payment-success',
      cancel_url:  'https://contractshield-backend.vercel.app/payment-cancel',
      metadata:    { userId: req.user.id },
    });
    res.json({ url: session.url });
  } catch (e: any) {
    res.status(500).json({ error: 'Could not create one-time checkout.' });
  }
});

// ── Stripe: billing portal ───────────────────────────────────────────────────
app.post('/api/stripe/portal', requireAuth, async (req: any, res) => {
  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', req.user.id)
    .single();
  if (!profile?.stripe_customer_id)
    return res.status(400).json({ error: 'No active subscription found' });
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer:   profile.stripe_customer_id as string,
      return_url: 'https://contractshield-backend.vercel.app/payment-cancel',
    });
    res.json({ url: session.url });
  } catch (e: any) {
    res.status(500).json({ error: 'Could not open billing portal.' });
  }
});

// ── Admin middleware ─────────────────────────────────────────────────────────
const requireAdmin = (req: any, res: any, next: any) => {
  const secret = req.headers['x-admin-secret'];
  if (!secret || secret !== process.env.ADMIN_SECRET)
    return res.status(403).json({ error: 'Forbidden' });
  next();
};

// ── Admin: list users ────────────────────────────────────────────────────────
app.get('/api/admin/users', requireAdmin, async (_req, res) => {
  try {
    const { data: authUsers } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    const { data: profiles }  = await supabase.from('profiles').select('id, is_pro, free_analyses_used, credits, stripe_customer_id, created_at');
    const { data: analyses }  = await supabase.from('analyses').select('user_id');

    const profileMap = Object.fromEntries((profiles || []).map(p => [p.id, p]));
    const analysisCounts = (analyses || []).reduce((acc: any, a) => {
      acc[a.user_id] = (acc[a.user_id] || 0) + 1;
      return acc;
    }, {});

    const users = (authUsers?.users || []).map(u => ({
      id:              u.id,
      email:           u.email,
      created_at:      u.created_at,
      last_sign_in_at: u.last_sign_in_at,
      is_pro:          profileMap[u.id]?.is_pro || false,
      credits:         profileMap[u.id]?.credits || 0,
      free_analyses_used: profileMap[u.id]?.free_analyses_used || 0,
      total_analyses:  analysisCounts[u.id] || 0,
      stripe_customer_id: profileMap[u.id]?.stripe_customer_id || null,
    }));

    res.json({ users, total: users.length });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ── Admin: toggle pro ────────────────────────────────────────────────────────
app.post('/api/admin/users/:id/toggle-pro', requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const { data: profile } = await supabase.from('profiles').select('is_pro').eq('id', id).single();
    const newVal = !profile?.is_pro;
    await supabase.from('profiles').update({ is_pro: newVal }).eq('id', id);
    res.json({ is_pro: newVal });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ── Admin: set credits ───────────────────────────────────────────────────────
app.post('/api/admin/users/:id/credits', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { credits } = req.body;
  if (typeof credits !== 'number' || credits < 0)
    return res.status(400).json({ error: 'Invalid credits value' });
  try {
    await supabase.from('profiles').update({ credits }).eq('id', id);
    res.json({ credits });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ── Admin: delete user ───────────────────────────────────────────────────────
app.delete('/api/admin/users/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const { data: profile } = await supabase.from('profiles').select('stripe_customer_id').eq('id', id).single();
    if (profile?.stripe_customer_id) {
      const subs = await stripe.subscriptions.list({ customer: profile.stripe_customer_id as string, status: 'active' });
      await Promise.all(subs.data.map(sub => stripe.subscriptions.cancel(sub.id)));
    }
    await supabase.from('analyses').delete().eq('user_id', id);
    await supabase.from('profiles').delete().eq('id', id);
    await supabase.auth.admin.deleteUser(id);
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ── Delete account ───────────────────────────────────────────────────────────
app.delete('/api/account', requireAuth, async (req: any, res) => {
  const userId = req.user.id;
  try {
    const { data: profile } = await supabase.from('profiles').select('stripe_customer_id').eq('id', userId).single();
    if (profile?.stripe_customer_id) {
      const subs = await stripe.subscriptions.list({ customer: profile.stripe_customer_id as string, status: 'active' });
      await Promise.all(subs.data.map(sub => stripe.subscriptions.cancel(sub.id)));
    }
    await supabase.from('analyses').delete().eq('user_id', userId);
    await supabase.from('profiles').delete().eq('id', userId);
    const { error } = await supabase.auth.admin.deleteUser(userId);
    if (error) throw error;
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: 'Could not delete account. Please contact support.' });
  }
});

// ── Payment redirect pages ───────────────────────────────────────────────────
app.get('/payment-success', (_req, res) => {
  res.send(`<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Payment Successful</title><style>body{margin:0;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#0b0d12;font-family:-apple-system,sans-serif;color:#fff}div{text-align:center;padding:32px}.icon{font-size:64px;margin-bottom:16px}.title{font-size:24px;font-weight:700;margin-bottom:8px;color:#4caf7d}.sub{font-size:14px;color:rgba(255,255,255,0.5)}</style></head><body><div><div class="icon">✅</div><div class="title">You're now Pro!</div><div class="sub">Switch back to the ContractShield app — your access is ready.</div></div></body></html>`);
});

app.get('/payment-cancel', (_req, res) => {
  res.send(`<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Cancelled</title><style>body{margin:0;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#0b0d12;font-family:-apple-system,sans-serif;color:#fff}div{text-align:center;padding:32px}.icon{font-size:64px;margin-bottom:16px}.title{font-size:24px;font-weight:700;margin-bottom:8px}.sub{font-size:14px;color:rgba(255,255,255,0.5)}</style></head><body><div><div class="icon">↩</div><div class="title">No problem!</div><div class="sub">Close this window to return to ContractShield.</div></div></body></html>`);
});

// ── Helpers ──────────────────────────────────────────────────────────────────

function callAnthropicPDF(apiKey: string, system: string, content: any): Promise<string> {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      system,
      messages: [{ role: 'user', content }],
    });

    const req = https.request({
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'content-length': Buffer.byteLength(body),
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'pdfs-2024-09-25',
      },
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (res.statusCode !== 200) {
            return reject(new Error(json?.error?.message || `API error ${res.statusCode}: ${data.slice(0, 200)}`));
          }
          resolve(json.content[0].text);
        } catch (e) {
          reject(new Error('Failed to parse Anthropic response: ' + data.slice(0, 200)));
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

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

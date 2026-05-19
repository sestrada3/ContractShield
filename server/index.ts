// ContractShield Backend — server/index.ts
// Deploy to Vercel or Railway
// Handles both recurring subscriptions AND one-time payments securely.

import express from 'express';
import cors from 'cors';
import Anthropic from '@anthropic-ai/sdk';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const app  = express();
const port = process.env.PORT || 3001;

// ── Raw body parser for Stripe webhook MUST come before json() ──────────────
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));
app.use(cors({ origin: '*' })); // Restrict to your domain in production
app.use(express.json({ limit: '10mb' }));

// ── Clients ─────────────────────────────────────────────────────────────────
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
const stripe    = new Stripe(process.env.STRIPE_SECRET_KEY!);
const supabase  = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// ── Auth middleware ──────────────────────────────────────────────────────────
async function requireAuth(req: any, res: any, next: any) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return res.status(401).json({ error: 'Invalid token' });

  req.user = user;
  next();
}

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ ok: true }));

// ── Analyze contract ─────────────────────────────────────────────────────────
app.post('/api/analyze', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.id;

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_pro, free_analyses_used, credits')
      .eq('id', userId)
      .single();

    const isPro    = profile?.is_pro || false;
    const used     = profile?.free_analyses_used || 0;
    const credits  = profile?.credits || 0;

    // Access check: Pro > Credits > Free tier
    if (!isPro && credits <= 0 && used >= 3) {
      return res.status(402).json({
        error: 'limit_reached',
        message: 'Free analyses used. Please upgrade or purchase credits.',
      });
    }

    const { text, imageBase64, imageType } = req.body;
    if (!text && !imageBase64) {
      return res.status(400).json({ error: 'No content provided' });
    }

    // Build message
    const prompt = `Analyze this contract and return a JSON object with:
    - riskScore: number 0–100
    - riskLabel: "Low" | "Medium" | "High" | "Critical"
    - clauses: array of { title, risk, summary, negotiationScript }
    - keyDates: array of { description, date }
    - summary: brief plain-English overview`;

    const content: any = imageBase64
      ? [
          { type: 'image', source: { type: 'base64', media_type: imageType || 'image/jpeg', data: imageBase64 } },
          { type: 'text', text: prompt + ' The document is in the image.' },
        ]
      : prompt + '\n\n' + text;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: 'Output only raw JSON. Start with { end with }. Never include personal identifiers.',
      messages: [{ role: 'user', content }],
    });

    const raw = (message.content[0] as any).text;
    let result: any;
    try {
      result = JSON.parse(raw);
    } catch {
      return res.status(500).json({ error: 'Model returned invalid JSON', raw: raw.slice(0, 200) });
    }

    // Deduct usage (Pro: no deduction | Credits: deduct 1 | Free: increment used)
    if (!isPro) {
      if (credits > 0) {
        await supabase.from('profiles').update({ credits: credits - 1 }).eq('id', userId);
      } else {
        await supabase.from('profiles').update({ free_analyses_used: used + 1 }).eq('id', userId);
      }
    }

    // Save to history
    await supabase.from('analyses').insert({
      user_id: userId,
      result,
      created_at: new Date().toISOString(),
    });

    res.json(result);
  } catch (e: any) {
    console.error('Analyze error:', e);
    res.status(500).json({ error: e.message });
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
    limit:   3,
  });
});

// ── Stripe: subscription checkout ────────────────────────────────────────────
app.post('/api/stripe/checkout', requireAuth, async (req: any, res) => {
  const { priceId } = req.body;
  if (!priceId) return res.status(400).json({ error: 'priceId required' });

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: 'contractshield://payment-success',
    cancel_url:  'contractshield://payment-cancel',
    metadata:    { userId: req.user.id },
    subscription_data: {
      metadata: { userId: req.user.id },
    },
  });

  res.json({ url: session.url });
});

// ── Stripe: one-time checkout (pay-per-use or credit packs) ──────────────────
app.post('/api/stripe/checkout-onetime', requireAuth, async (req: any, res) => {
  const { priceId } = req.body;
  if (!priceId) return res.status(400).json({ error: 'priceId required' });

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',                    // ← key difference from subscription
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: 'contractshield://payment-success',
    cancel_url:  'contractshield://payment-cancel',
    metadata:    { userId: req.user.id },
  });

  res.json({ url: session.url });
});

// ── Stripe: webhook (handles BOTH subscription and one-time events) ───────────
app.post('/api/stripe/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'] as string;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error('Webhook signature failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {

      // ── Subscription activated ─────────────────────────────────
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId  = session.metadata?.userId;
        if (!userId) break;

        if (session.mode === 'subscription') {
          // Mark user as Pro
          await supabase.from('profiles')
            .update({ is_pro: true })
            .eq('id', userId);
        }

        if (session.mode === 'payment') {
          // Determine credits to grant based on amount paid
          const amountPaid = session.amount_total || 0;
          let creditsToAdd = 0;

          if (amountPaid === 299)  creditsToAdd = 1;   // $2.99 single
          if (amountPaid === 1499) creditsToAdd = 10;  // $14.99 pack

          if (creditsToAdd > 0) {
            // Increment credits safely
            const { data: profile } = await supabase
              .from('profiles')
              .select('credits')
              .eq('id', userId)
              .single();

            const current = profile?.credits || 0;
            await supabase.from('profiles')
              .update({ credits: current + creditsToAdd })
              .eq('id', userId);
          }
        }
        break;
      }

      // ── Subscription cancelled / payment failed ────────────────
      case 'customer.subscription.deleted':
      case 'invoice.payment_failed': {
        const obj    = event.data.object as any;
        const userId = obj.metadata?.userId;
        if (!userId) break;

        await supabase.from('profiles')
          .update({ is_pro: false })
          .eq('id', userId);
        break;
      }

      default:
        break;
    }
  } catch (err: any) {
    console.error('Webhook handler error:', err.message);
    return res.status(500).json({ error: 'Webhook handler failed' });
  }

  res.json({ received: true });
});

app.listen(port, () => console.log(`ContractShield backend running on :${port}`));
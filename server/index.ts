import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

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

app.use(express.json({ limit: '10mb' }));

app.get('/health', (_req, res) => res.json({ ok: true, build: 'v10' }));

app.get('/api/diag/pdf', async (_req, res) => {
  const TINY_PDF = 'JVBERi0xLjQKMSAwIG9iago8PCAvVHlwZSAvQ2F0YWxvZyAvUGFnZXMgMiAwIFIgPj4KZW5kb2JqCjIgMCBvYmoKPDwgL1R5cGUgL1BhZ2VzIC9LaWRzIFszIDAgUl0gL0NvdW50IDEgPj4KZW5kb2JqCjMgMCBvYmoKPDwgL1R5cGUgL1BhZ2UgL1BhcmVudCAyIDAgUiAvTWVkaWFCb3ggWzAgMCA2MTIgNzkyXSAvQ29udGVudHMgNCAwIFIgL1Jlc291cmNlcyA8PCAvRm9udCA8PCAvRjEgPDwgL1R5cGUgL0ZvbnQgL1N1YnR5cGUgL1R5cGUxIC9CYXNlRm9udCAvSGVsdmV0aWNhID4+ID4+ID4+ID4+CmVuZG9iago0IDAgb2JqCjw8IC9MZW5ndGggNjcgPj4Kc3RyZWFtCkJUIC9GMSAxMiBUZiAxMDAgNzAwIFRkIChUaGlzIGlzIGEgdGVzdCBlbXBsb3ltZW50IGNvbnRyYWN0LikgVGogRVQKZW5kc3RyZWFtCmVuZG9iagp4cmVmCjAgNQowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMDkgMDAwMDAgbiAKMDAwMDAwMDA1OCAwMDAwMCBuIAowMDAwMDAwMTE1IDAwMDAwIG4gCjAwMDAwMDAyOTAgMDAwMDAgbiAKdHJhaWxlcgo8PCAvU2l6ZSA1IC9Sb290IDEgMCBSID4+CnN0YXJ0eHJlZgo0MDcKJSVFT0YK';
  try {
    const msg = await anthropic.messages.create(
      {
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 50,
        messages: [{
          role: 'user',
          content: [
            { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: TINY_PDF } } as any,
            { type: 'text', text: 'What does this document say? One sentence.' },
          ],
        }],
      },
      { headers: { 'anthropic-beta': 'pdfs-2024-09-25' } },
    );
    res.json({ ok: true, content: msg.content });
  } catch (e: any) {
    res.json({ ok: false, status: e?.status, message: e?.message, detail: e?.error?.error });
  }
});

// ── Clients ──────────────────────────────────────────────────────────────────
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
const supabase  = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);

const FREE_LIMIT = 3;

const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);

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

    {
      const model = pdfBase64 ? 'claude-sonnet-4-6' : 'claude-haiku-4-5-20251001';
      const maxTokens = pdfBase64 ? 4000 : 2000;
      const reqOpts = pdfBase64 ? { headers: { 'anthropic-beta': 'pdfs-2024-09-25' } } : {};
      const message = await anthropic.messages.create(
        { model, max_tokens: maxTokens, system, messages: [{ role: 'user' as const, content }] },
        reqOpts,
      );
      const block = message.content[0] as any;
      if (!block || block.type !== 'text') {
        console.error('Unexpected content block:', JSON.stringify(message.content).slice(0, 300));
        return res.status(500).json({ error: 'Analysis failed. Please try again.' });
      }
      raw = block.text;
      console.log('Anthropic stop_reason:', message.stop_reason, 'raw length:', raw.length);
    }

    const result = parseJSON(raw);
    if (!result) {
      console.error('parseJSON failed, raw preview:', raw?.slice(0, 500));
      return res.status(500).json({ error: 'Analysis failed — could not parse response. Please try again.' });
    }

    // Deduct usage — re-read profile first so we use the latest credits value.
    // The LLM call above can take 10-30s, during which addCredits may have updated
    // the DB. Using the stale value from the top of the handler would clobber it.
    if (!isPro) {
      const { data: freshProfile } = await supabase
        .from('profiles')
        .select('credits, free_analyses_used')
        .eq('id', userId)
        .single();
      const freshCredits = freshProfile?.credits || 0;
      const freshUsed    = freshProfile?.free_analyses_used || 0;
      if (freshCredits > 0) {
        await supabase.from('profiles')
          .upsert({ id: userId, credits: freshCredits - 1 }, { onConflict: 'id' });
      } else {
        await supabase.from('profiles')
          .upsert({ id: userId, free_analyses_used: freshUsed + 1 }, { onConflict: 'id' });
      }
    }

    await supabase.from('analyses').insert({ user_id: userId, result, created_at: new Date().toISOString() });

    res.json(result);
  } catch (e: any) {
    const detail = e?.error?.error?.message || e?.message || String(e);
    console.error('Analyze error:', e?.status, detail, e?.stack?.slice(0, 300));
    res.status(500).json({ error: detail || 'Analysis failed. Please try again.' });
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

// ── RevenueCat: webhook ──────────────────────────────────────────────────────
// Receives subscription lifecycle events from RevenueCat.
// Secured via a shared secret in the Authorization header.
app.post('/api/revenuecat/webhook', async (req, res) => {
  const auth = req.headers.authorization;
  const secret = process.env.REVENUECAT_WEBHOOK_SECRET;
  // RevenueCat sends the Authorization header as the raw secret value (no Bearer prefix)
  const receivedSecret = auth?.startsWith('Bearer ') ? auth.slice(7) : auth;
  if (!receivedSecret || receivedSecret !== secret) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const event     = req.body?.event;
  const appUserId = event?.app_user_id; // This is the Supabase user ID

  if (!appUserId) return res.status(400).json({ error: 'Missing app_user_id' });

  try {
    switch (event.type) {
      case 'INITIAL_PURCHASE':
      case 'RENEWAL': {
        // Only subscriptions fire INITIAL_PURCHASE/RENEWAL — set pro status only.
        // Consumables (NON_RENEWING_PURCHASE) are handled below with idempotency.
        const entitlements: string[] = event.entitlement_ids || [];
        if (entitlements.includes('ContractShield AI Pro')) {
          await supabase.from('profiles').update({ is_pro: true }).eq('id', appUserId);
        }
        break;
      }
      case 'NON_SUBSCRIPTION_PURCHASE':
      case 'NON_RENEWING_PURCHASE':
        // Credits are written immediately by the client via /api/credits/add.
        // The webhook txId (store_transaction_id) and the client txId
        // (transactionIdentifier) can differ in sandbox, causing double-credits
        // when both paths write. The client call is the single source of truth.
        break;
      case 'EXPIRATION':
      case 'BILLING_ISSUE':
        await supabase.from('profiles').update({ is_pro: false }).eq('id', appUserId);
        break;
      // CANCELLATION: subscription still active until EXPIRATION — no action needed
    }
  } catch (e: any) {
    console.error('RevenueCat webhook error:', e.message);
  }

  res.json({ received: true });
});

// ── RevenueCat: sync after purchase ─────────────────────────────────────────
// Called by the client immediately after a purchase to update is_pro without
// waiting for the webhook. Credits are added by the webhook to avoid double-counting.
// rcIsPro: client passes true when the RC SDK already confirmed the entitlement.
// The RC API can lag behind the SDK (especially in sandbox), so we trust the
// SDK result rather than potentially writing is_pro:false and breaking the UX.
// We never demote is_pro to false here — that is the webhook's job.
app.post('/api/revenuecat/sync', requireAuth, async (req: any, res) => {
  const userId = req.user.id;
  const { rcIsPro } = req.body; // optional assertion from RC SDK
  try {
    const rcRes = await fetch(`https://api.revenuecat.com/v1/subscribers/${userId}`, {
      headers: { Authorization: `Bearer ${process.env.REVENUECAT_SECRET_KEY}` },
    });
    if (!rcRes.ok) throw new Error(`RevenueCat API error: ${rcRes.status}`);

    const data: any      = await rcRes.json();
    const subscriber     = data.subscriber;
    const proEntitlement = subscriber?.entitlements?.['ContractShield AI Pro'];
    const serverIsPro    = proEntitlement
      ? new Date(proEntitlement.expires_date) > new Date()
      : false;

    // Trust RC SDK assertion if the server API hasn't caught up yet.
    const isPro = serverIsPro || rcIsPro === true;
    if (isPro) {
      await supabase.from('profiles').update({ is_pro: true }).eq('id', userId);
    }
    res.json({ isPro });
  } catch (e: any) {
    console.error('RevenueCat sync error:', e.message);
    res.status(500).json({ error: 'Could not sync subscription status.' });
  }
});

// ── Credits: add immediately after consumable purchase ──────────────────────
// Called by the client right after a successful purchase so credits update
// instantly rather than waiting for the async RevenueCat webhook.
// Uses the Apple transaction ID as an idempotency key so this endpoint and
// the webhook can't both count the same purchase.
app.post('/api/credits/add', requireAuth, async (req: any, res) => {
  const userId = req.user.id;
  const { productId, transactionId } = req.body;
  if (!productId || !transactionId) return res.status(400).json({ error: 'Missing productId or transactionId' });

  const creditsToAdd = productId === 'com.contractshield.credits.10' ? 10 : 1;
  try {
    const { data: profile, error: selectError } = await supabase
      .from('profiles')
      .select('credits, credited_transaction_ids')
      .eq('id', userId)
      .single();

    if (selectError) throw new Error(selectError.message);

    if (profile?.credited_transaction_ids?.includes(transactionId)) {
      return res.json({ credits: profile.credits });
    }

    const newCredits = (profile?.credits || 0) + creditsToAdd;

    // Update credits and record the transaction ID in a single write so there
    // is no window where the webhook can read the profile, miss the txId, and
    // double-count the same purchase.
    const { error: creditsError } = await supabase
      .from('profiles')
      .update({
        credits: newCredits,
        credited_transaction_ids: [...(profile?.credited_transaction_ids || []), transactionId],
      })
      .eq('id', userId);

    if (creditsError) throw new Error(`credits update failed: ${creditsError.message}`);

    res.json({ credits: newCredits });
  } catch (e: any) {
    console.error('Credits add error:', e.message);
    res.status(500).json({ error: 'Could not add credits.' });
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
    const { data: profiles }  = await supabase.from('profiles').select('id, is_pro, free_analyses_used, credits, created_at, stripe_customer_id');
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
    await supabase.from('analyses').delete().eq('user_id', id);
    await supabase.from('profiles').delete().eq('id', id);
    await supabase.auth.admin.deleteUser(id);
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ── Admin: password reset ────────────────────────────────────────────────────
app.post('/api/admin/users/:id/password-reset', requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const { data: { user }, error } = await supabase.auth.admin.getUserById(id);
    if (error || !user?.email) return res.status(404).json({ error: 'User not found' });
    const { error: resetErr } = await supabase.auth.resetPasswordForEmail(user.email);
    if (resetErr) throw resetErr;
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ── Admin: reset free analyses counter ──────────────────────────────────────
app.post('/api/admin/users/:id/reset-analyses', requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await supabase.from('profiles').update({ free_analyses_used: 0 }).eq('id', id);
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ── Admin: add credits (incremental) ────────────────────────────────────────
app.post('/api/admin/users/:id/add-credits', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { amount } = req.body;
  if (typeof amount !== 'number' || amount <= 0)
    return res.status(400).json({ error: 'Invalid amount' });
  try {
    const { data: profile } = await supabase.from('profiles').select('credits').eq('id', id).single();
    const newCredits = (profile?.credits || 0) + amount;
    await supabase.from('profiles').update({ credits: newCredits }).eq('id', id);
    res.json({ credits: newCredits });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ── Delete account ───────────────────────────────────────────────────────────
// Apple IAP subscriptions are managed by Apple — they cannot be cancelled
// server-side. The RevenueCat webhook will fire EXPIRATION when they lapse.
app.delete('/api/account', requireAuth, async (req: any, res) => {
  const userId = req.user.id;
  try {
    await supabase.from('analyses').delete().eq('user_id', userId);
    await supabase.from('profiles').delete().eq('id', userId);
    const { error } = await supabase.auth.admin.deleteUser(userId);
    if (error) throw error;
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: 'Could not delete account. Please contact support.' });
  }
});

// ── Helpers ──────────────────────────────────────────────────────────────────

export const buildPrompt = (text?: string, isPro = false) => {
  const charLimit = isPro ? 20000 : 6000;
  const clean = (text || '')
    .replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[SSN]')
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL]')
    .replace(/\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g, '[PHONE]')
    .trim()
    .slice(0, charLimit);

  const clauseCount = isPro ? '5-10' : '3';
  return 'Analyze this legal document. Return ONLY JSON with: score(1-10), type, verdict, summary, '
    + `clauses(${clauseCount} most important items ranked by severity: title/risk[high|medium|low]/plain/excerpt/standard/benchmark/script/action), `
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

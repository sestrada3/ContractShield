import { supabase } from './auth';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL!;

async function authHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  return {
    'Content-Type': 'application/json',
    ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
  };
}

// No-op kept for backwards compat — token is now read from Supabase session
export const setAuthToken = (_token: string | null) => {};

// ── Analyze a contract ───────────────────────────────────────────────────────
export async function analyzeDocument(payload: {
  text?: string;
  imageBase64?: string;
  imageType?: string;
  pdfBase64?: string;
}) {
  const headers = await authHeaders();
  const res = await fetch(`${BASE_URL}/api/analyze`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const error: any = new Error(err.error || 'Analysis failed');
    error.response = { status: res.status, data: err };
    throw error;
  }
  return res.json();
}

// Alias used by PaywallScreen
export const analyzeContract = analyzeDocument;

// ── Usage ────────────────────────────────────────────────────────────────────
export async function getUsage(): Promise<{ isPro: boolean; used: number; limit: number; credits: number }> {
  const res = await fetch(`${BASE_URL}/api/usage`, { headers: await authHeaders() });
  if (!res.ok) throw new Error('Failed to fetch usage');
  return res.json();
}

// ── Analysis history ─────────────────────────────────────────────────────────
export async function getHistory(): Promise<{ id: string; result: any; created_at: string }[]> {
  const res = await fetch(`${BASE_URL}/api/history`, { headers: await authHeaders() });
  if (!res.ok) throw new Error('Could not load history');
  return res.json();
}

// ── Stripe: subscription checkout ────────────────────────────────────────────
export async function createCheckoutSession(priceId: string): Promise<{ url: string }> {
  const res = await fetch(`${BASE_URL}/api/stripe/checkout`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({ priceId }),
  });
  if (!res.ok) throw new Error('Failed to create checkout session');
  return res.json();
}

// ── Stripe: one-time checkout ────────────────────────────────────────────────
export async function createOneTimeCheckout(priceId: string): Promise<{ url: string }> {
  const res = await fetch(`${BASE_URL}/api/stripe/checkout-onetime`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({ priceId }),
  });
  if (!res.ok) throw new Error('Failed to create one-time checkout');
  return res.json();
}

// ── Stripe: billing portal ───────────────────────────────────────────────────
export async function getPortalUrl(): Promise<{ url: string }> {
  const res = await fetch(`${BASE_URL}/api/stripe/portal`, {
    method: 'POST',
    headers: await authHeaders(),
  });
  if (!res.ok) throw new Error('Could not open billing portal');
  return res.json();
}

// ── Delete account ───────────────────────────────────────────────────────────
export async function deleteAccount(): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/account`, {
    method: 'DELETE',
    headers: await authHeaders(),
  });
  if (!res.ok) throw new Error('Could not delete account');
}

import { supabase } from './auth';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL!;

export interface AppConfig {
  min_build: number;
  store_url: string;
  features: {
    analysis_enabled: boolean;
    pdf_enabled: boolean;
    image_enabled: boolean;
    paywall_enabled: boolean;
  };
}

export async function getConfig(): Promise<AppConfig> {
  const res = await fetch(`${BASE_URL}/api/config`);
  if (!res.ok) throw new Error('Config fetch failed');
  return res.json();
}

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
  const res = await fetch(`${BASE_URL}/api/usage?_t=${Date.now()}`, { headers: await authHeaders() });
  if (!res.ok) throw new Error('Failed to fetch usage');
  return res.json();
}

// ── Analysis history ─────────────────────────────────────────────────────────
export async function getHistory(): Promise<{ id: string; result: any; created_at: string }[]> {
  const res = await fetch(`${BASE_URL}/api/history`, { headers: await authHeaders() });
  if (!res.ok) throw new Error('Could not load history');
  return res.json();
}

// ── RevenueCat: sync entitlement after purchase ──────────────────────────────
// rcIsPro: pass true when the RC SDK already confirmed the entitlement so the
// server can write is_pro:true even if the RC API hasn't caught up yet (common
// in sandbox where there is a short processing lag).
export async function syncPurchase(rcIsPro?: boolean): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/revenuecat/sync`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({ rcIsPro }),
  });
  if (!res.ok) throw new Error('Could not sync purchase');
}

// ── Credits: add after consumable purchase ───────────────────────────────────
export async function addCredits(productId: string, transactionId: string): Promise<{ credits: number }> {
  const res = await fetch(`${BASE_URL}/api/credits/add`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({ productId, transactionId }),
  });
  if (!res.ok) throw new Error('Could not add credits');
  return res.json();
}

// ── Delete a single analysis ─────────────────────────────────────────────────
export async function deleteAnalysis(id: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/analyses/${id}`, {
    method: 'DELETE',
    headers: await authHeaders(),
  });
  if (!res.ok) throw new Error('Could not delete analysis');
}

// ── Delete account ───────────────────────────────────────────────────────────
export async function deleteAccount(): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/account`, {
    method: 'DELETE',
    headers: await authHeaders(),
  });
  if (!res.ok) throw new Error('Could not delete account');
}

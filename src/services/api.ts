// src/services/api.ts — ContractShield API service

import { getAuthToken } from './auth';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL!;

async function authHeaders() {
  const token = await getAuthToken();
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

// ── Analyze a contract ───────────────────────────────────────────────────────
export async function analyzeContract(payload: {
  text?: string;
  imageBase64?: string;
  imageType?: string;
}) {
  const res = await fetch(`${BASE_URL}/api/analyze`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || err.error || 'Analysis failed');
  }
  return res.json();
}

// ── Get usage/credits ────────────────────────────────────────────────────────
export async function getUsage(): Promise<{
  isPro: boolean;
  used: number;
  credits: number;
  limit: number;
}> {
  const res = await fetch(`${BASE_URL}/api/usage`, {
    headers: await authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch usage');
  return res.json();
}

// ── Create subscription checkout (recurring) ─────────────────────────────────
export async function createCheckoutSession(priceId: string): Promise<{ url: string }> {
  const res = await fetch(`${BASE_URL}/api/stripe/checkout`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({ priceId }),
  });
  if (!res.ok) throw new Error('Failed to create checkout session');
  return res.json();
}

// ── Create one-time checkout (single analysis or credit pack) ─────────────────
export async function createOneTimeCheckout(priceId: string): Promise<{ url: string }> {
  const res = await fetch(`${BASE_URL}/api/stripe/checkout-onetime`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({ priceId }),
  });
  if (!res.ok) throw new Error('Failed to create one-time checkout');
  return res.json();
}
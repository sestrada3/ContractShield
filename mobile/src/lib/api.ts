import { supabase } from './supabase';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

async function getAuthHeader(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) {
    throw new Error('Not authenticated');
  }
  return { Authorization: `Bearer ${token}` };
}

export interface AnalysisClause {
  name: string;
  description: string;
  risk: 'high' | 'medium' | 'low';
  negotiation_script?: string;
}

export interface KeyDate {
  label: string;
  date: string;
}

export interface AnalysisResult {
  id: string;
  filename: string;
  score: number;
  market_context: string;
  clauses: AnalysisClause[];
  key_dates?: KeyDate[];
  created_at: string;
}

export interface HistoryItem {
  id: string;
  filename: string;
  score: number;
  created_at: string;
}

export interface UsageData {
  used: number;
  limit: number;
  plan: 'free' | 'pro';
  email: string;
}

export interface CheckoutResponse {
  url: string;
}

export interface PortalResponse {
  url: string;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const authHeader = await getAuthHeader();
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      ...authHeader,
      ...(options.headers as Record<string, string>),
    },
  });

  if (!response.ok) {
    const text = await response.text().catch(() => response.statusText);
    throw new ApiError(response.status, text);
  }

  return response.json() as Promise<T>;
}

export async function analyzeContract(formData: FormData): Promise<AnalysisResult> {
  const authHeader = await getAuthHeader();
  const response = await fetch(`${BASE_URL}/api/analyze`, {
    method: 'POST',
    headers: authHeader,
    body: formData,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => response.statusText);
    throw new ApiError(response.status, text);
  }

  return response.json() as Promise<AnalysisResult>;
}

export async function getUsage(): Promise<UsageData> {
  return request<UsageData>('/api/usage');
}

export async function getHistory(): Promise<HistoryItem[]> {
  return request<HistoryItem[]>('/api/history');
}

export async function getAnalysis(id: string): Promise<AnalysisResult> {
  return request<AnalysisResult>(`/api/analysis/${id}`);
}

export async function createCheckout(plan: 'monthly' | 'yearly'): Promise<CheckoutResponse> {
  return request<CheckoutResponse>('/api/stripe/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ plan }),
  });
}

export async function getBillingPortal(): Promise<PortalResponse> {
  return request<PortalResponse>('/api/stripe/portal', {
    method: 'POST',
  });
}

export async function deleteAccount(): Promise<void> {
  await request<void>('/api/account', { method: 'DELETE' });
}

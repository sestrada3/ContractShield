import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_URL,
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach auth token to every request
export const setAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

// ── Contract Analysis ──────────────────────────────────────────────────────────
export const analyzeDocument = async (payload: {
  text?: string;
  imageBase64?: string;
  imageType?: string;
  pdfBase64?: string;
}) => {
  const { data } = await api.post('/api/analyze', payload, {
    timeout: payload.pdfBase64 || payload.imageBase64 ? 120000 : 60000,
  });
  return data;
};

// ── Auth ───────────────────────────────────────────────────────────────────────
export const getUsage = async () => {
  const { data } = await api.get('/api/usage');
  return data; // { used: 2, limit: 3, isPro: false }
};

// ── Stripe Checkout ───────────────────────────────────────────────────────────
export const createCheckoutSession = async (priceId: string) => {
  const { data } = await api.post('/api/stripe/checkout', { priceId });
  return data; // { url: 'https://checkout.stripe.com/...' }
};

export const getPortalUrl = async () => {
  const { data } = await api.post('/api/stripe/portal');
  return data; // { url: 'https://billing.stripe.com/...' }
};

export const getHistory = async () => {
  const { data } = await api.get('/api/history');
  return data as { id: string; result: any; created_at: string }[];
};

export const deleteAccount = async () => {
  const { data } = await api.delete('/api/account');
  return data;
};

export default api;

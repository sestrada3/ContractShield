/**
 * Unit tests — API service (api.ts)
 * Tests the axios client wrappers with mocked HTTP responses.
 */

import axios from 'axios';
import {
  setAuthToken,
  analyzeDocument,
  getUsage,
  createCheckoutSession,
  getPortalUrl,
  getHistory,
  deleteAccount,
} from '../../services/api';

jest.mock('axios', () => {
  const mockAxiosInstance = {
    post:    jest.fn(),
    get:     jest.fn(),
    delete:  jest.fn(),
    defaults: { headers: { common: {} } },
  };
  return {
    __esModule: true,
    default: {
      create: jest.fn(() => mockAxiosInstance),
    },
    create: jest.fn(() => mockAxiosInstance),
  };
});

// Grab the mock instance created by api.ts
const mockAxios = (axios.create as jest.Mock).mock.results[0]?.value ?? {
  post: jest.fn(), get: jest.fn(), delete: jest.fn(), defaults: { headers: { common: {} } }
};

beforeEach(() => {
  jest.clearAllMocks();
  mockAxios.defaults = { headers: { common: {} } };
});

// ─── setAuthToken ─────────────────────────────────────────────────────────────
describe('setAuthToken', () => {
  it('sets Authorization header when token provided', () => {
    setAuthToken('my-jwt-token');
    expect(mockAxios.defaults.headers.common['Authorization']).toBe('Bearer my-jwt-token');
  });

  it('removes Authorization header when null passed', () => {
    mockAxios.defaults.headers.common['Authorization'] = 'Bearer old-token';
    setAuthToken(null);
    expect(mockAxios.defaults.headers.common['Authorization']).toBeUndefined();
  });
});

// ─── analyzeDocument ─────────────────────────────────────────────────────────
describe('analyzeDocument', () => {
  const mockResult = { score: 7, type: 'NDA', verdict: 'Fair', summary: 'OK', clauses: [], dates: [], positives: [] };

  it('POSTs to /api/analyze with text payload', async () => {
    mockAxios.post.mockResolvedValueOnce({ data: mockResult });
    const result = await analyzeDocument({ text: 'Contract text here' });
    expect(mockAxios.post).toHaveBeenCalledWith(
      '/api/analyze',
      { text: 'Contract text here' },
      expect.objectContaining({ timeout: 60000 }),
    );
    expect(result).toEqual(mockResult);
  });

  it('uses 120s timeout when imageBase64 is provided', async () => {
    mockAxios.post.mockResolvedValueOnce({ data: mockResult });
    await analyzeDocument({ imageBase64: 'base64data', imageType: 'image/jpeg' });
    expect(mockAxios.post).toHaveBeenCalledWith(
      '/api/analyze',
      expect.any(Object),
      expect.objectContaining({ timeout: 120000 }),
    );
  });

  it('uses 120s timeout when pdfBase64 is provided', async () => {
    mockAxios.post.mockResolvedValueOnce({ data: mockResult });
    await analyzeDocument({ pdfBase64: 'pdfbase64' });
    expect(mockAxios.post).toHaveBeenCalledWith(
      '/api/analyze',
      expect.any(Object),
      expect.objectContaining({ timeout: 120000 }),
    );
  });

  it('uses 60s timeout for text-only payloads', async () => {
    mockAxios.post.mockResolvedValueOnce({ data: mockResult });
    await analyzeDocument({ text: 'just text' });
    expect(mockAxios.post).toHaveBeenCalledWith(
      '/api/analyze',
      expect.any(Object),
      expect.objectContaining({ timeout: 60000 }),
    );
  });

  it('throws when the request fails', async () => {
    const err = new Error('Network Error');
    mockAxios.post.mockRejectedValueOnce(err);
    await expect(analyzeDocument({ text: 'test' })).rejects.toThrow('Network Error');
  });
});

// ─── getUsage ─────────────────────────────────────────────────────────────────
describe('getUsage', () => {
  it('GETs /api/usage and returns data', async () => {
    const usageData = { isPro: false, used: 1, limit: 3 };
    mockAxios.get.mockResolvedValueOnce({ data: usageData });
    const result = await getUsage();
    expect(mockAxios.get).toHaveBeenCalledWith('/api/usage');
    expect(result).toEqual(usageData);
  });
});

// ─── createCheckoutSession ────────────────────────────────────────────────────
describe('createCheckoutSession', () => {
  it('POSTs to /api/stripe/checkout with priceId', async () => {
    const sessionData = { url: 'https://checkout.stripe.com/session_abc' };
    mockAxios.post.mockResolvedValueOnce({ data: sessionData });
    const result = await createCheckoutSession('price_monthly_123');
    expect(mockAxios.post).toHaveBeenCalledWith('/api/stripe/checkout', { priceId: 'price_monthly_123' });
    expect(result).toEqual(sessionData);
  });
});

// ─── getPortalUrl ─────────────────────────────────────────────────────────────
describe('getPortalUrl', () => {
  it('POSTs to /api/stripe/portal and returns url', async () => {
    const portalData = { url: 'https://billing.stripe.com/portal_abc' };
    mockAxios.post.mockResolvedValueOnce({ data: portalData });
    const result = await getPortalUrl();
    expect(mockAxios.post).toHaveBeenCalledWith('/api/stripe/portal');
    expect(result).toEqual(portalData);
  });
});

// ─── getHistory ───────────────────────────────────────────────────────────────
describe('getHistory', () => {
  it('GETs /api/history and returns array', async () => {
    const historyData = [
      { id: 'a1', result: { score: 6 }, created_at: '2025-01-01T00:00:00Z' },
      { id: 'a2', result: { score: 8 }, created_at: '2025-01-02T00:00:00Z' },
    ];
    mockAxios.get.mockResolvedValueOnce({ data: historyData });
    const result = await getHistory();
    expect(mockAxios.get).toHaveBeenCalledWith('/api/history');
    expect(result).toEqual(historyData);
  });
});

// ─── deleteAccount ────────────────────────────────────────────────────────────
describe('deleteAccount', () => {
  it('DELETEs /api/account and returns success', async () => {
    const successData = { success: true };
    mockAxios.delete.mockResolvedValueOnce({ data: successData });
    const result = await deleteAccount();
    expect(mockAxios.delete).toHaveBeenCalledWith('/api/account');
    expect(result).toEqual(successData);
  });

  it('throws when account deletion fails', async () => {
    mockAxios.delete.mockRejectedValueOnce(new Error('Server error'));
    await expect(deleteAccount()).rejects.toThrow('Server error');
  });
});

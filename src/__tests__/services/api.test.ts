/**
 * Unit tests — API service (api.ts)
 * Tests the fetch-based client wrappers with mocked responses.
 */

import {
  setAuthToken,
  analyzeDocument,
  getUsage,
  createCheckoutSession,
  createOneTimeCheckout,
  getPortalUrl,
  getHistory,
  deleteAccount,
} from '../../services/api';

// ── Mock Supabase so authHeaders() resolves without a real session ────────────
jest.mock('../services/auth', () => ({
  supabase: {
    auth: {
      getSession: jest.fn().mockResolvedValue({
        data: { session: { access_token: 'test-jwt-token' } },
      }),
    },
  },
}), { virtual: true });

jest.mock('../../services/auth', () => ({
  supabase: {
    auth: {
      getSession: jest.fn().mockResolvedValue({
        data: { session: { access_token: 'test-jwt-token' } },
      }),
    },
  },
}));

// ── Mock global fetch ─────────────────────────────────────────────────────────
const mockFetch = jest.fn();
global.fetch = mockFetch;

function mockOk(body: any) {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: () => Promise.resolve(body),
  });
}

function mockError(status: number, body: any) {
  mockFetch.mockResolvedValueOnce({
    ok: false,
    status,
    json: () => Promise.resolve(body),
  });
}

beforeEach(() => {
  jest.clearAllMocks();
});

// ── setAuthToken ──────────────────────────────────────────────────────────────
describe('setAuthToken', () => {
  it('is a no-op function (kept for backwards compat)', () => {
    expect(() => setAuthToken('anything')).not.toThrow();
    expect(() => setAuthToken(null)).not.toThrow();
  });
});

// ── analyzeDocument ───────────────────────────────────────────────────────────
describe('analyzeDocument', () => {
  const mockResult = {
    score: 7, type: 'NDA', verdict: 'Fair', summary: 'OK',
    clauses: [], dates: [], positives: [],
  };

  it('POSTs to /api/analyze with text payload', async () => {
    mockOk(mockResult);
    const result = await analyzeDocument({ text: 'Contract text here' });
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/analyze'),
      expect.objectContaining({ method: 'POST' }),
    );
    expect(result).toEqual(mockResult);
  });

  it('sends Authorization header from Supabase session', async () => {
    mockOk(mockResult);
    await analyzeDocument({ text: 'test' });
    const [, options] = mockFetch.mock.calls[0];
    expect(options.headers['Authorization']).toBe('Bearer test-jwt-token');
  });

  it('sends pdfBase64 in request body', async () => {
    mockOk(mockResult);
    await analyzeDocument({ pdfBase64: 'base64pdfdata' });
    const [, options] = mockFetch.mock.calls[0];
    const body = JSON.parse(options.body);
    expect(body.pdfBase64).toBe('base64pdfdata');
  });

  it('sends imageBase64 and imageType in request body', async () => {
    mockOk(mockResult);
    await analyzeDocument({ imageBase64: 'imgdata', imageType: 'image/jpeg' });
    const [, options] = mockFetch.mock.calls[0];
    const body = JSON.parse(options.body);
    expect(body.imageBase64).toBe('imgdata');
    expect(body.imageType).toBe('image/jpeg');
  });

  it('throws structured error on non-ok response', async () => {
    mockError(402, { error: 'Free limit reached', upgradeRequired: true });
    await expect(analyzeDocument({ text: 'test' })).rejects.toMatchObject({
      response: { status: 402, data: { upgradeRequired: true } },
    });
  });

  it('throws on network failure', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network Error'));
    await expect(analyzeDocument({ text: 'test' })).rejects.toThrow('Network Error');
  });
});

// ── getUsage ──────────────────────────────────────────────────────────────────
describe('getUsage', () => {
  it('GETs /api/usage and returns data', async () => {
    const usageData = { isPro: false, used: 1, limit: 3 };
    mockOk(usageData);
    const result = await getUsage();
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/usage'),
      expect.any(Object),
    );
    expect(result).toEqual(usageData);
  });

  it('throws on non-ok response', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false });
    await expect(getUsage()).rejects.toThrow();
  });
});

// ── createCheckoutSession ─────────────────────────────────────────────────────
describe('createCheckoutSession', () => {
  it('POSTs to /api/stripe/checkout with priceId', async () => {
    const sessionData = { url: 'https://checkout.stripe.com/session_abc' };
    mockOk(sessionData);
    const result = await createCheckoutSession('price_monthly_123');
    const [, options] = mockFetch.mock.calls[0];
    const body = JSON.parse(options.body);
    expect(body.priceId).toBe('price_monthly_123');
    expect(result).toEqual(sessionData);
  });
});

// ── createOneTimeCheckout ─────────────────────────────────────────────────────
describe('createOneTimeCheckout', () => {
  it('POSTs to /api/stripe/checkout-onetime with priceId', async () => {
    const sessionData = { url: 'https://checkout.stripe.com/onetime_abc' };
    mockOk(sessionData);
    const result = await createOneTimeCheckout('price_credit_1');
    const [, options] = mockFetch.mock.calls[0];
    const body = JSON.parse(options.body);
    expect(body.priceId).toBe('price_credit_1');
    expect(result).toEqual(sessionData);
  });
});

// ── getPortalUrl ──────────────────────────────────────────────────────────────
describe('getPortalUrl', () => {
  it('POSTs to /api/stripe/portal and returns url', async () => {
    const portalData = { url: 'https://billing.stripe.com/portal_abc' };
    mockOk(portalData);
    const result = await getPortalUrl();
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/stripe/portal'),
      expect.objectContaining({ method: 'POST' }),
    );
    expect(result).toEqual(portalData);
  });
});

// ── getHistory ────────────────────────────────────────────────────────────────
describe('getHistory', () => {
  it('GETs /api/history and returns array', async () => {
    const historyData = [
      { id: 'a1', result: { score: 6 }, created_at: '2025-01-01T00:00:00Z' },
      { id: 'a2', result: { score: 8 }, created_at: '2025-01-02T00:00:00Z' },
    ];
    mockOk(historyData);
    const result = await getHistory();
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/history'),
      expect.any(Object),
    );
    expect(result).toEqual(historyData);
  });
});

// ── deleteAccount ─────────────────────────────────────────────────────────────
describe('deleteAccount', () => {
  it('DELETEs /api/account', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) });
    await deleteAccount();
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/account'),
      expect.objectContaining({ method: 'DELETE' }),
    );
  });

  it('throws when account deletion fails', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({ error: 'Server error' }) });
    await expect(deleteAccount()).rejects.toThrow();
  });
});

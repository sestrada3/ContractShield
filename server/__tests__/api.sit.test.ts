/**
 * SIT (System Integration Tests) — tests the HTTP API layer with all external
 * services mocked. Verifies auth boundaries, input validation, RevenueCat
 * webhook authorization, and endpoint behavior.
 */

// ─── Disable rate limiting so tests don't interfere with each other ──────────
jest.mock('express-rate-limit', () =>
  jest.fn(() => (_req: any, _res: any, next: any) => next()),
);

// ─── Mock state shared between factory closures and test assertions ───────────
const mockDb = {
  user:    null as any,
  profile: null as { is_pro: boolean; free_analyses_used: number; credits?: number } | null,
};

// ─── Supabase mock ────────────────────────────────────────────────────────────
jest.mock('@supabase/supabase-js', () => {
  const makeChain = () => {
    const chain: any = {
      select:  jest.fn(),
      eq:      jest.fn(),
      single:  jest.fn().mockImplementation(() => Promise.resolve({ data: mockDb.profile, error: null })),
      update:  jest.fn(),
      insert:  jest.fn().mockResolvedValue({ error: null }),
      delete:  jest.fn(),
      upsert:  jest.fn().mockResolvedValue({ error: null }),
      order:   jest.fn(),
      limit:   jest.fn().mockResolvedValue({ data: [], error: null }),
    };
    chain.select.mockReturnValue(chain);
    chain.eq.mockReturnValue(chain);
    chain.update.mockReturnValue(chain);
    chain.delete.mockReturnValue(chain);
    chain.order.mockReturnValue(chain);
    return chain;
  };

  return {
    createClient: jest.fn(() => ({
      auth: {
        getUser: jest.fn().mockImplementation(() =>
          Promise.resolve({
            data: { user: mockDb.user },
            error: mockDb.user ? null : { message: 'Not authenticated' },
          }),
        ),
        admin: { deleteUser: jest.fn().mockResolvedValue({ error: null }) },
      },
      from: jest.fn().mockImplementation(() => makeChain()),
    })),
  };
});

// ─── Anthropic mock ───────────────────────────────────────────────────────────
jest.mock('@anthropic-ai/sdk', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    messages: {
      create: jest.fn().mockResolvedValue({
        content: [{
          type: 'text',
          text: JSON.stringify({
            score: 7,
            type: 'NDA',
            verdict: 'Fair agreement',
            summary: 'Standard NDA with reasonable terms.',
            clauses: [{ title: 'Confidentiality', risk: 'low', plain: 'Keep info secret' }],
            dates: [],
            positives: ['Mutual obligations'],
          }),
        }],
      }),
    },
  })),
}));

// ─── RevenueCat REST API mock (used by /api/revenuecat/sync) ─────────────────
const mockRcFetch = jest.fn();
global.fetch = mockRcFetch;

import request from 'supertest';
import app from '../index';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const AUTH_HEADER = { Authorization: 'Bearer valid-test-token' };
const RC_WEBHOOK_SECRET = 'test-webhook-secret';

process.env.REVENUECAT_WEBHOOK_SECRET = RC_WEBHOOK_SECRET;
process.env.REVENUECAT_SECRET_KEY     = 'sk_test';

function asAuthenticatedFreeUser() {
  mockDb.user    = { id: 'user-123', email: 'test@test.com' };
  mockDb.profile = { is_pro: false, free_analyses_used: 0, credits: 0 };
}

function asAuthenticatedProUser() {
  mockDb.user    = { id: 'user-123', email: 'test@test.com' };
  mockDb.profile = { is_pro: true, free_analyses_used: 0, credits: 0 };
}

function asUnauthenticated() {
  mockDb.user    = null;
  mockDb.profile = null;
}

beforeEach(() => {
  asUnauthenticated();
  jest.clearAllMocks();
  // Default RevenueCat fetch mock — returns non-pro subscriber
  mockRcFetch.mockResolvedValue({
    ok: true,
    json: async () => ({
      subscriber: {
        entitlements: {},
        non_subscriptions: {},
      },
    }),
  });
});

// ─── Auth boundary: every protected route returns 401 without a token ─────────
describe('Authentication boundary (SIT)', () => {
  const protectedRoutes = [
    { method: 'post',   path: '/api/analyze',           body: { text: 'hello' } },
    { method: 'get',    path: '/api/usage',              body: {} },
    { method: 'post',   path: '/api/revenuecat/sync',   body: {} },
    { method: 'get',    path: '/api/history',            body: {} },
    { method: 'delete', path: '/api/account',            body: {} },
  ];

  test.each(protectedRoutes)(
    '$method $path → 401 without Authorization header',
    async ({ method, path, body }) => {
      const res = await (request(app) as any)[method](path).send(body);
      expect(res.status).toBe(401);
    },
  );
});

// ─── Input validation: /api/analyze ──────────────────────────────────────────
describe('POST /api/analyze — input validation (SIT)', () => {
  beforeEach(asAuthenticatedFreeUser);

  it('returns 400 when no document is provided', async () => {
    const res = await request(app).post('/api/analyze').set(AUTH_HEADER).send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/No document provided/i);
  });

  it('returns 400 when imageBase64 exceeds 6 MB', async () => {
    const oversized = 'A'.repeat(6 * 1024 * 1024 + 1);
    const res = await request(app).post('/api/analyze').set(AUTH_HEADER).send({ imageBase64: oversized, imageType: 'image/jpeg' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/too large/i);
  });

  it('returns 400 for unsupported image type', async () => {
    const res = await request(app).post('/api/analyze').set(AUTH_HEADER).send({
      imageBase64: 'validbase64data',
      imageType: 'image/bmp',
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/unsupported image type/i);
  });

  it('returns 400 when text is not a string', async () => {
    const res = await request(app).post('/api/analyze').set(AUTH_HEADER).send({ text: 12345 });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Invalid input/i);
  });

  it('returns 402 when free user has used all 3 analyses', async () => {
    mockDb.profile = { is_pro: false, free_analyses_used: 3, credits: 0 };
    const res = await request(app).post('/api/analyze').set(AUTH_HEADER).send({ text: 'some contract' });
    expect(res.status).toBe(402);
    expect(res.body.upgradeRequired).toBe(true);
  });

  it('returns 200 with analysis result for valid text input (free user)', async () => {
    const res = await request(app).post('/api/analyze').set(AUTH_HEADER).send({ text: 'This is an employment contract.' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('score');
    expect(res.body).toHaveProperty('clauses');
    expect(res.body).toHaveProperty('verdict');
  });
});

// ─── RevenueCat webhook ───────────────────────────────────────────────────────
describe('POST /api/revenuecat/webhook (SIT)', () => {
  it('returns 401 when Authorization header is missing', async () => {
    const res = await request(app).post('/api/revenuecat/webhook').send({
      event: { type: 'INITIAL_PURCHASE', app_user_id: 'u1', entitlement_ids: ['pro'] },
    });
    expect(res.status).toBe(401);
  });

  it('returns 401 when Authorization header is wrong', async () => {
    const res = await request(app)
      .post('/api/revenuecat/webhook')
      .set('Authorization', 'Bearer wrong-secret')
      .send({ event: { type: 'INITIAL_PURCHASE', app_user_id: 'u1', entitlement_ids: ['pro'] } });
    expect(res.status).toBe(401);
  });

  it('returns 200 with correct secret', async () => {
    const res = await request(app)
      .post('/api/revenuecat/webhook')
      .set('Authorization', `Bearer ${RC_WEBHOOK_SECRET}`)
      .send({ event: { type: 'INITIAL_PURCHASE', app_user_id: 'u1', entitlement_ids: ['pro'] } });
    expect(res.status).toBe(200);
    expect(res.body.received).toBe(true);
  });

  it('returns 400 when app_user_id is missing', async () => {
    const res = await request(app)
      .post('/api/revenuecat/webhook')
      .set('Authorization', `Bearer ${RC_WEBHOOK_SECRET}`)
      .send({ event: { type: 'INITIAL_PURCHASE' } });
    expect(res.status).toBe(400);
  });
});

// ─── RevenueCat sync ──────────────────────────────────────────────────────────
describe('POST /api/revenuecat/sync (SIT)', () => {
  beforeEach(asAuthenticatedFreeUser);

  it('returns isPro: false when no active entitlement', async () => {
    const res = await request(app).post('/api/revenuecat/sync').set(AUTH_HEADER);
    expect(res.status).toBe(200);
    expect(res.body.isPro).toBe(false);
  });

  it('returns isPro: true when pro entitlement is active', async () => {
    const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    mockRcFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        subscriber: {
          entitlements: { pro: { expires_date: futureDate } },
          non_subscriptions: {},
        },
      }),
    });
    const res = await request(app).post('/api/revenuecat/sync').set(AUTH_HEADER);
    expect(res.status).toBe(200);
    expect(res.body.isPro).toBe(true);
  });
});

// ─── Usage endpoint ───────────────────────────────────────────────────────────
describe('GET /api/usage (SIT)', () => {
  it('returns isPro and usage counts for authenticated user', async () => {
    asAuthenticatedFreeUser();
    const res = await request(app).get('/api/usage').set(AUTH_HEADER);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('isPro');
    expect(res.body).toHaveProperty('used');
    expect(res.body).toHaveProperty('limit');
  });
});

// ─── History endpoint ─────────────────────────────────────────────────────────
describe('GET /api/history (SIT)', () => {
  it('returns an array for authenticated user', async () => {
    asAuthenticatedFreeUser();
    const res = await request(app).get('/api/history').set(AUTH_HEADER);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

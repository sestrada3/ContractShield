/**
 * SIT (System Integration Tests) — tests the HTTP API layer with all external
 * services mocked. Verifies auth boundaries, input validation, Stripe webhook
 * signature verification, and static response pages.
 */

// ─── Disable rate limiting so tests don't interfere with each other ──────────
jest.mock('express-rate-limit', () =>
  jest.fn(() => (_req: any, _res: any, next: any) => next()),
);

// ─── Mock state shared between factory closures and test assertions ───────────
const mockDb = {
  user: null as any,
  profile: null as { is_pro: boolean; free_analyses_used: number; stripe_customer_id?: string } | null,
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

// ─── Stripe mock ──────────────────────────────────────────────────────────────
let mockConstructEvent: jest.Mock;
jest.mock('stripe', () => {
  mockConstructEvent = jest.fn().mockImplementation(() => {
    throw new Error('No signatures found matching the expected signature for payload');
  });
  const MockStripe = jest.fn().mockImplementation(() => ({
    webhooks: { constructEvent: mockConstructEvent },
    checkout: { sessions: { create: jest.fn().mockResolvedValue({ url: 'https://checkout.stripe.com/test' }) } },
    billingPortal: { sessions: { create: jest.fn().mockResolvedValue({ url: 'https://billing.stripe.com/test' }) } },
    subscriptions: { list: jest.fn().mockResolvedValue({ data: [] }), cancel: jest.fn().mockResolvedValue({}) },
  }));
  return MockStripe;
});

import request from 'supertest';
import app from '../index';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const AUTH_HEADER = { Authorization: 'Bearer valid-test-token' };

function asAuthenticatedFreeUser() {
  mockDb.user = { id: 'user-123', email: 'test@test.com' };
  mockDb.profile = { is_pro: false, free_analyses_used: 0 };
}

function asAuthenticatedProUser() {
  mockDb.user = { id: 'user-123', email: 'test@test.com' };
  mockDb.profile = { is_pro: true, free_analyses_used: 0, stripe_customer_id: 'cus_test' };
}

function asUnauthenticated() {
  mockDb.user = null;
  mockDb.profile = null;
}

beforeEach(() => {
  asUnauthenticated();
  jest.clearAllMocks();
  // Re-apply default stripe mock behaviour after clearAllMocks
  if (mockConstructEvent) {
    mockConstructEvent.mockImplementation(() => {
      throw new Error('Invalid signature');
    });
  }
});

// ─── Auth boundary: every protected route returns 401 without a token ─────────
describe('Authentication boundary (SIT)', () => {
  const protectedRoutes = [
    { method: 'post',   path: '/api/analyze',          body: { text: 'hello' } },
    { method: 'get',    path: '/api/usage',             body: {} },
    { method: 'post',   path: '/api/stripe/checkout',  body: { priceId: 'price_x' } },
    { method: 'post',   path: '/api/stripe/portal',    body: {} },
    { method: 'get',    path: '/api/history',           body: {} },
    { method: 'delete', path: '/api/account',           body: {} },
  ];

  test.each(protectedRoutes)(
    '$method $path → 401 without Authorization header',
    async ({ method, path, body }) => {
      const req = (request(app) as any)[method](path).send(body);
      const res = await req;
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
    mockDb.profile = { is_pro: false, free_analyses_used: 3 };
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

// ─── Input validation: /api/stripe/checkout ──────────────────────────────────
describe('POST /api/stripe/checkout — input validation (SIT)', () => {
  beforeEach(asAuthenticatedFreeUser);

  it('returns 400 for missing priceId', async () => {
    const res = await request(app).post('/api/stripe/checkout').set(AUTH_HEADER).send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Invalid plan/i);
  });

  it('returns 400 for unknown priceId', async () => {
    const res = await request(app).post('/api/stripe/checkout').set(AUTH_HEADER).send({ priceId: 'price_hacker_attempt' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Invalid plan/i);
  });
});

// ─── Stripe webhook ───────────────────────────────────────────────────────────
describe('POST /api/stripe/webhook (SIT)', () => {
  it('returns 400 when stripe-signature header is invalid', async () => {
    const res = await request(app)
      .post('/api/stripe/webhook')
      .set('stripe-signature', 'bad-sig')
      .set('Content-Type', 'application/json')
      .send(Buffer.from('{}'));
    expect(res.status).toBe(400);
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

// ─── Static redirect pages ────────────────────────────────────────────────────
describe('Payment redirect pages (SIT)', () => {
  it('GET /payment-success returns 200 HTML', async () => {
    const res = await request(app).get('/payment-success');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/html/);
    expect(res.text).toContain("You're now Pro");
  });

  it('GET /payment-cancel returns 200 HTML', async () => {
    const res = await request(app).get('/payment-cancel');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/html/);
    expect(res.text).toContain('No problem');
  });
});

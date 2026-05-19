# ContractShield — Project Memory

## What This Is
ContractShield is an AI-powered contract review **mobile app** (iOS + Android, built with React Native / Expo). Users upload a contract (PDF, Word, or paste text), get a 0–10 fairness score, plain-English summaries, and "WHAT TO SAY" negotiation scripts.

The landing page at **getcontractshield.app** is a Next.js 14 marketing site (this repo's `main` branch).

## Repository Layout
- `main` branch → Next.js landing page (getcontractshield.app via Vercel)
- `master` branch → React Native app + Express backend
- `claude/landing-page-design-0EeVl` → active landing page dev branch (merges to main)

## Key Product Details

### Score System
- **0–10 fairness scale** — HIGHER is better (fairer contract)
- Anything below 5 = needs attention; below 3 = negotiate hard
- NOT a 0–100 "risk score"

### Pricing
- **Free**: $0, 3 analyses/month
- **Pro Monthly**: $9.99/month
- **Pro Yearly**: $5.99/month (billed $71.88/year) — SAVE 40%
- **Free trial**: 7 days
- Stripe Price IDs: monthly `price_1TY8noPwwT0D6amwKPNvzhTO`, yearly `price_1TY8npPwwT0D6amwuwTPZRm4`

### Real App Features
1. AI Risk Score (0–10)
2. Plain English Summary
3. Negotiation Scripts ("WHAT TO SAY")
4. Market Benchmarking (vs. industry standard)
5. Key Date Alerts (auto-renewal, deadlines)
6. Privacy-First (zero data retention)
7. Hidden Clause Detection (200+ patterns)

### Analysis Time
- 15–30 seconds per contract

## Tech Stack
- **Landing page**: Next.js 14.2.3, Tailwind CSS, Framer Motion, lucide-react
- **Mobile app**: React Native (Expo)
- **Backend**: Node.js / Express → deployed on Vercel as `contractshield-backend`
- **Database**: Supabase (auth + profiles + analyses tables)
- **Payments**: Stripe (checkout, webhooks, portal)
- **AI**: Anthropic Claude Haiku (`claude-haiku-4-5-20251001`)

## Brand Colors
- Dark background: `#0b0d12` (navy-950)
- Gold accent: `#c9a84c` (gold-500)
- Blue: `#4a9eff`
- Green: `#4caf7d`
- Logo: `assets/logo SMALL.png` — served via GitHub raw URL in next/image

## Backend API (contractshield-backend.vercel.app)
- `POST /api/analyze` — AI analysis, enforces free tier limit
- `GET /api/usage` — returns isPro, used, limit
- `POST /api/stripe/checkout` — creates checkout session with 7-day trial
- `POST /api/stripe/webhook` — handles checkout.session.completed + customer.subscription.deleted
- `POST /api/stripe/portal` — billing portal
- `GET /api/history` — last 20 analyses
- `DELETE /api/account` — cancel sub + delete data

## Supabase Tables (need to create via SQL editor)
```sql
create table profiles (
  id uuid references auth.users primary key,
  is_pro boolean default false,
  free_analyses_used int default 0,
  stripe_customer_id text,
  created_at timestamp default now()
);
create table analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  result jsonb,
  created_at timestamp default now()
);
create table processed_webhook_events (
  event_id text primary key,
  created_at timestamp default now()
);
```
Plus a `handle_new_user` trigger (see README or server/index.ts).

## Status

### DONE ✅
- Landing page live at getcontractshield.app
- All 6 mobile app screens (Onboarding, Home, Results, Paywall, Account, Auth)
- Backend with all API endpoints
- Stripe checkout + webhook + portal
- Supabase auth + database schema designed
- Analysis history + account management

### TODO Before Launch 🔲
1. **Vercel env vars** (contractshield-backend project → Settings → Environment Variables):
   - `ANTHROPIC_API_KEY`
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_KEY`

2. **Supabase SQL** — run the table creation SQL above in the Supabase dashboard SQL editor

3. **Stripe webhook** — create endpoint in Stripe Dashboard:
   - URL: `https://contractshield-backend.vercel.app/api/stripe/webhook`
   - Events: `checkout.session.completed`, `customer.subscription.deleted`
   - Copy the webhook signing secret → set as `STRIPE_WEBHOOK_SECRET`

4. **Mobile app `.env`** — fill in real values from Supabase + Stripe dashboards

5. **App Store & Google Play** — run `eas build` then `eas submit`

6. **Landing page CTAs** — update App Store / Play Store URLs once apps are live

## git push workflow
Use `git push -u origin <branch>`. If blocked, use mcp__github__push_files MCP tool as fallback.

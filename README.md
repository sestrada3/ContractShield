# ContractShield 🛡⚖️
### AI-powered legal document review — React Native (Expo) + Node.js backend

---

## Architecture

```
User's Phone (React Native / Expo)
    ↓ uploads document
Your Backend (Node.js on Vercel/Railway)
    ↓ calls with API key
Anthropic Claude API
    ↓ returns JSON analysis
Your Backend
    ↓ returns result + saves to DB
User's Phone (displays results)
```

**The Anthropic API key never touches the mobile app.**

---

## Quick Start

### 1. Clone & install
```bash
git clone <your-repo>
cd contractshield
npm install
```

### 2. Set up Supabase
1. Go to https://supabase.com → New project
2. Run this SQL in the Supabase SQL editor:

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

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
```

3. Copy your project URL and anon key

### 3. Set up Stripe
1. Go to https://stripe.com → Create account
2. Create two products:
   - **ContractShield Pro Monthly** → $9.99/mo
   - **ContractShield Pro Yearly** → $71.88/yr
3. Copy the Price IDs into `src/screens/PaywallScreen.tsx`
4. Set up a webhook pointing to `https://your-backend.com/api/stripe/webhook`
   - Listen for: `checkout.session.completed`, `customer.subscription.deleted`

### 4. Deploy the backend
```bash
cd server
npm install
# Set env vars on Vercel/Railway:
# ANTHROPIC_API_KEY=sk-ant-...
# STRIPE_SECRET_KEY=sk_live_...
# STRIPE_WEBHOOK_SECRET=whsec_...
# SUPABASE_URL=https://xxx.supabase.co
# SUPABASE_SERVICE_KEY=eyJ...
vercel deploy
```

### 5. Configure the mobile app
```bash
cp .env.example .env
# Fill in your values:
# EXPO_PUBLIC_API_URL=https://your-backend.vercel.app
# EXPO_PUBLIC_SUPABASE_URL=...
# EXPO_PUBLIC_SUPABASE_ANON_KEY=...
# EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

### 6. Run locally
```bash
npx expo start
# Scan QR code with Expo Go app
```

---

## Build & Submit to App Stores

### iOS (App Store)
```bash
npm install -g eas-cli
eas login
eas build:configure
eas build --platform ios
eas submit --platform ios
```

### Android (Google Play)
```bash
eas build --platform android
eas submit --platform android
```

---

## Monetization Plan

| Tier       | Price        | Limit              |
|------------|--------------|--------------------|
| Free       | $0           | 3 analyses/month   |
| Pro Monthly| $9.99/mo     | Unlimited          |
| Pro Yearly | $71.88/yr    | Unlimited + savings|

**Additional revenue streams:**
- Lawyer referral commission (20% of flat-fee reviews)
- B2B white-label licensing (small law firms, HR depts)

---

## Roadmap
- [ ] PDF text extraction (pdfjs-dist)
- [ ] Push notifications for key date reminders
- [ ] Analysis history screen
- [ ] Share results as PDF
- [ ] Lawyer connect marketplace
- [ ] Apple Pay / Google Pay

---

## Security
- API key stored server-side only
- PII (SSN, email, card numbers) stripped before AI processing
- Document text cleared from memory after analysis
- Auth via Supabase JWT
- HTTPS only

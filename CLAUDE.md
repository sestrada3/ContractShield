# ContractShield — Claude Instructions

## Build Reminders
After making code changes, always run a production build and submit to the App Store without waiting for instructions:
```
eas build --platform ios --profile production
eas submit --platform ios
```

## Git Workflow
When making a code fix, always commit, push, and merge to main without waiting for explicit instructions. Never leave a fix in a draft PR or unmerged state — the fix isn't live until it's on main.

## In-Progress Work (session 2026-05-24)

### Bug: Account shows FREE while user is already subscribed

**Root cause chain (fully diagnosed):**
1. User has an active Apple/RevenueCat subscription but Supabase `is_pro = false`
2. User taps Subscribe → Apple shows “You’re currently subscribed to this” system sheet
3. User taps OK → Apple returns `PURCHASE_CANCELLED_ERROR` to RevenueCat
4. `syncPurchase()` queries RC API which may lag behind the actual purchase → writes `is_pro = false` back to Supabase
5. `AccountScreen.useFocusEffect` calls `getUsage()` → reads stale `is_pro = false` → overwrites store

**Fixes merged to main (PRs #11–#15):**
- `store.ts`: Added `isProFloor`/`isProFloorExpiry` — `setIsPro(false)` is blocked for 10 min after a confirmed purchase (same pattern as `creditFloor`)
- `PaywallScreen.tsx` `handleSubscribe`:
  - Sets `isProFloor` immediately on confirmed purchase
  - Wraps `syncPurchase()`/`getUsage()` in inner try/catch so failures don’t block store update
  - On any error (including `PURCHASE_CANCELLED_ERROR`): calls `Purchases.restorePurchases()` to re-validate receipt with Apple directly (more reliable than `getCustomerInfo()` which fails with “subscriber not found” when RC has no record)
  - If `pro` entitlement active after restore → sets floor, sets isPro, syncs, navigates back

**Still being tested:** Whether `restorePurchases()` correctly returns active `pro` entitlement in sandbox and production after tapping OK on Apple’s “already subscribed” sheet.

**Key files:**
- `src/screens/PaywallScreen.tsx` — `handleSubscribe()` (lines ~98–142)
- `src/services/store.ts` — `isProFloor` state and `setIsProFloor` action
- `src/screens/AccountScreen.tsx` — `useFocusEffect` calls `getUsage()` on focus (this is intentional; floor prevents it from downgrading isPro)

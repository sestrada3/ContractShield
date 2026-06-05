# ContractShield — Claude Instructions

## Build Reminders
After making code changes, always run a production build and submit to the App Store without waiting for instructions:
```
eas build --platform ios --profile production
eas submit --platform ios
```

## Git Workflow
When making a code fix, always commit, push, and merge to main without waiting for explicit instructions. Never leave a fix in a draft PR or unmerged state — the fix isn't live until it's on main.

## Status (session 2026-05-31)
Working branch: `claude/subscription-renewal-date-38qTe` (PR #16, draft, not yet merged)

### Changes in PR #16 (pending merge):
1. **Monthly plan misidentified as yearly** — fixed detection logic in `AccountScreen.tsx` to check `!id.includes('month')` before treating 'year' as yearly
2. **RevenueCat email attribute** — `App.tsx` now calls `Purchases.setAttributes({ $email })` after login so users are searchable by email in RevenueCat dashboard (not just UUID)
3. **Remote config + kill switches** — `server/index.ts` has `/api/config` endpoint; `App.tsx` fetches it on startup

### Remote config system (see server/index.ts for full cheat sheet):
Set in Vercel → contractshield-backend → Settings → Environment Variables:
- `CONFIG_ANALYSIS_ENABLED=false` → kills Analyze button instantly
- `CONFIG_PDF_ENABLED=false` → kills PDF/document upload
- `CONFIG_IMAGE_ENABLED=false` → kills camera and photo library
- `CONFIG_MIN_BUILD=<N>` → forces anyone on build <N to update
- `CONFIG_STORE_URL=https://apps.apple.com/app/id<YOUR_ID>` → App Store link shown on force-update screen

All default to "everything on, no forced update" if not set. Redeploy (~30s) to apply.

### RevenueCat notes:
- Users are stored by Supabase UUID, not email — search by UUID or email attribute (after next build)
- Testers set up via admin panel toggle (not real RC purchases) won't appear in RevenueCat
- Sandbox purchases show today's date for "Renews" (sandbox monthly = 5 min expiry) — this is correct

### Previous session (2026-05-24):
All subscription/credits bugs fixed and merged to main. expo-dev-client removed from dependencies (commit bbfb207) — requires new EAS production build before submitting to App Store.

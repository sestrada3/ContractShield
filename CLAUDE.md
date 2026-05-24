# ContractShield — Claude Instructions

## Build Reminders
After making code changes, always run a production build and submit to the App Store without waiting for instructions:
```
eas build --platform ios --profile production
eas submit --platform ios
```

## Git Workflow
When making a code fix, always commit, push, and merge to main without waiting for explicit instructions. Never leave a fix in a draft PR or unmerged state — the fix isn't live until it's on main.

## Status (session 2026-05-24)
All subscription/credits bugs fixed and merged to main. expo-dev-client removed from dependencies (commit bbfb207) — requires new EAS production build before submitting to App Store.

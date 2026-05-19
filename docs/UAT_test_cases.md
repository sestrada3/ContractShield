# ContractShield — UAT Test Cases

**Version:** 1.0  
**Date:** 2026-05-18  
**Platform:** iOS 17+ / Android 13+  
**Test environment:** Staging (Supabase staging project, Stripe test mode)

---

## Test Case Conventions

| Status | Meaning |
|--------|---------|
| ✅ Pass | Feature works as expected |
| ❌ Fail | Defect found — log issue with steps to reproduce |
| ⚠️ Partial | Works with caveats — document workaround |

**Tester fields:** Tester name · Device model · OS version · Date

---

## Section 1 — Onboarding

### UAT-001: First launch shows onboarding
**Precondition:** Fresh install (no prior app data)  
**Steps:**
1. Launch app

**Expected:** Three-slide onboarding carousel is displayed  
**Pass criteria:** First slide "Know What You're Actually Signing." is visible

---

### UAT-002: Onboarding slide navigation
**Steps:**
1. On first slide, tap "Next →"
2. Verify second slide ("HOW IT WORKS") appears
3. Tap "Next →" again
4. Verify third slide ("YOUR PRIVACY") appears
5. Tap "Get Started →"

**Expected:** Reaches login screen after tapping Get Started on last slide

---

### UAT-003: Skip onboarding
**Steps:**
1. Launch app (fresh)
2. Tap "Skip" on any slide

**Expected:** Immediately navigates to Login screen

---

### UAT-004: Onboarding not shown on re-launch
**Steps:**
1. Complete or skip onboarding
2. Force-close app and relaunch

**Expected:** Login screen shown directly (onboarding skipped)

---

## Section 2 — Authentication

### UAT-005: Sign up with valid credentials
**Steps:**
1. On Login screen, tap "Don't have an account? Sign up"
2. Enter valid email (e.g., `uat_test@yourdomain.com`)
3. Enter password of 6+ characters
4. Tap "Create Account →"

**Expected:** Success — either navigates to Home screen (if Supabase auto-confirm enabled) or shows "Check your email" confirmation prompt

---

### UAT-006: Sign up validation — empty email
**Steps:**
1. Leave email blank, tap "Create Account →"

**Expected:** Alert "Enter your email" is shown

---

### UAT-007: Sign up validation — password too short
**Steps:**
1. Enter valid email
2. Enter password "abc" (3 characters)
3. Tap "Create Account →"

**Expected:** Alert "Password too short — Password must be at least 6 characters."

---

### UAT-008: Sign in with valid credentials
**Steps:**
1. Enter registered email and correct password
2. Tap "Sign In →"

**Expected:** Navigates to Home screen, usage badge shows correct free analyses count

---

### UAT-009: Sign in with wrong password
**Steps:**
1. Enter registered email
2. Enter incorrect password
3. Tap "Sign In →"

**Expected:** Alert "Error" with descriptive message (e.g., "Invalid login credentials")

---

### UAT-010: Forgot password flow
**Steps:**
1. Tap "Forgot password?" on sign-in screen
2. Verify "Reset Password" title and password field is hidden
3. Enter registered email
4. Tap "Send Reset Link →"

**Expected:** Alert "Check your email" appears; mode returns to sign-in

---

### UAT-011: Sign out
**Steps:**
1. Sign in, navigate to Account screen
2. Tap "Sign Out"

**Expected:** Returns to Login screen; subsequent app launch shows Login screen (session cleared)

---

## Section 3 — Home Screen

### UAT-012: Usage badge shows correct count (free user)
**Precondition:** Free user with 1 of 3 analyses used  
**Expected:** Badge shows "2 free analyses remaining"

---

### UAT-013: Usage badge singular form
**Precondition:** Free user with 2 of 3 analyses used  
**Expected:** Badge shows "1 free analysis remaining" (singular)

---

### UAT-014: Usage badge hidden for Pro users
**Precondition:** Pro subscriber  
**Expected:** No usage badge visible

---

### UAT-015: Browse Files — PDF upload
**Steps:**
1. Tap "Browse Files"
2. Select a PDF contract from the device (< 1.5 MB)

**Expected:** File chip appears with filename; "Analyze My Document →" button enabled

---

### UAT-016: Browse Files — PDF too large
**Steps:**
1. Tap "Browse Files"
2. Select a PDF > 1.5 MB

**Expected:** Alert "PDF too large — Please use a PDF under 1.5 MB, or paste the text manually."

---

### UAT-017: Browse Files — text file upload
**Steps:**
1. Tap "Browse Files"
2. Select a `.txt` file

**Expected:** Text content is pasted into the text area (up to 3000 chars); file chip shows filename

---

### UAT-018: Camera capture
**Steps:**
1. Tap "Camera"
2. Grant camera permission if requested
3. Take a photo of a document

**Expected:** File chip shows "Camera photo"; analyze button enabled

---

### UAT-019: Camera — permission denied
**Steps:**
1. Deny camera permission in system prompt (or in app settings)
2. Tap "Camera"

**Expected:** Alert "Permission needed — Please allow access in Settings."

---

### UAT-020: Photo Library selection
**Steps:**
1. Tap "Choose from Photo Library"
2. Grant permission, select a photo of a contract

**Expected:** File chip shows "Photo from library"; analyze button enabled

---

### UAT-021: Paste text — analyze button enables
**Steps:**
1. Tap text input area
2. Type or paste any text

**Expected:** Analyze button becomes enabled (full opacity)

---

### UAT-022: Clear file chip
**Steps:**
1. Upload a file (shows file chip)
2. Tap the × on the file chip

**Expected:** File chip disappears; analyze button disabled again

---

### UAT-023: Security badges always visible
**Expected:** "Encrypted transit", "PII stripped", "Never stored" always shown on home screen

---

## Section 4 — Document Analysis

### UAT-024: Successful text analysis
**Steps:**
1. Paste substantial contract text (>100 words)
2. Tap "Analyze My Document →"

**Expected:**
- Loading overlay appears with cycling steps ("Reading your document…", etc.)
- Cancel button visible during loading
- Results screen shown after ~15–30 seconds
- Score ring animates in
- Verdict, summary, clauses, key dates, positives all populated

---

### UAT-025: Loading overlay — cancel
**Steps:**
1. Start analysis
2. When loading overlay appears, tap "Cancel"

**Expected:** Returns to Home screen with input preserved (analysis aborted)

---

### UAT-026: PII is stripped from prompts
**Steps:**
1. Paste text containing a fake SSN: "SSN: 123-45-6789" and email: "contact@test.com"
2. Analyze
3. Review results

**Expected:** Results DO NOT contain the SSN or email address (replaced with [SSN] / [EMAIL] before sending to AI)

---

### UAT-027: Free user analysis count increments
**Precondition:** Free user with 1/3 analyses used  
**Steps:**
1. Complete one analysis

**Expected:** Usage badge updates to "1 free analysis remaining"

---

### UAT-028: Free limit reached — paywall shown
**Precondition:** Free user with 3/3 analyses used  
**Steps:**
1. Enter text and tap analyze (button shows "Upgrade to Analyze →")

**Expected:** Paywall screen shown immediately (no analysis attempted)

---

### UAT-029: 402 during analysis shows paywall
**Scenario:** Backend returns 402 mid-analysis (race condition where quota exceeded)  
**Expected:** Paywall navigated to immediately without showing error dialog

---

## Section 5 — Results Screen

### UAT-030: Score ring animation
**Expected:** Score ring animates from 0 to the result score over ~1.4 seconds

---

### UAT-031: Score color coding
| Score range | Expected ring color |
|-------------|---------------------|
| 7–10 | Green |
| 4–6  | Amber |
| 1–3  | Red   |

---

### UAT-032: Clause risk badges
**Expected:** Each clause shows correct badge: "HIGH RISK" (red), "CAUTION" (amber), "FAVORABLE" (green)

---

### UAT-033: First high-risk clause pre-expanded
**Expected:** The first clause with `risk: "high"` is expanded on initial render showing the negotiation script

---

### UAT-034: Expand/collapse clause cards
**Steps:**
1. Tap a collapsed clause header

**Expected:** Clause body expands showing PLAIN ENGLISH, WHAT TO SAY, BENCHMARK, ORIGINAL TEXT sections (as available)

---

### UAT-035: Copy negotiation script
**Steps:**
1. Open an expanded clause with a script
2. Tap "Copy"

**Expected:** 
- Button briefly shows "✓ Copied"
- Script text is on device clipboard
- Haptic success feedback

---

### UAT-036: Key dates display
**Expected:** Each key date shows label, date value (monospace), and action text. High urgency dates shown in red, medium in amber, low in green.

---

### UAT-037: Positives section
**Expected:** "WORKS IN YOUR FAVOR" section with bullet points for each positive term

---

### UAT-038: Share results
**Steps:**
1. Tap "Share" button

**Expected:** Native share sheet appears with analysis summary text

---

### UAT-039: Back clears result
**Steps:**
1. View a result
2. Tap "Back"

**Expected:** Returns to Home screen; `currentResult` is cleared (re-entering Results shows "No results yet.")

---

## Section 6 — Paywall / Subscription

### UAT-040: Paywall renders correctly
**Expected:** Logo, title "ContractShield Pro", social proof, rotating reviews, 7 feature bullets, plan toggle, CTA button, trial note

---

### UAT-041: Yearly plan selected by default
**Expected:** Yearly plan has gold border on render; "Billed $71.88/yr" visible; SAVE 40% badge shown

---

### UAT-042: Monthly/Yearly plan toggle
**Steps:**
1. Tap "Monthly"
2. Verify $9.99/mo highlighted
3. Tap "Yearly"
4. Verify $5.99/mo highlighted

**Expected:** Only the selected plan shows gold border

---

### UAT-043: Checkout opens browser
**Steps:**
1. Select a plan, tap "Start Free 7-Day Trial →"

**Expected:** 
- Button shows "Opening…" while loading
- Stripe checkout page opens in in-app browser
- Using test card 4242 4242 4242 4242 / 12/34 / 123 completes checkout

---

### UAT-044: Pro status activated after checkout
**Steps:**
1. Complete Stripe test checkout
2. Return to app

**Expected:**
- "Welcome to Pro! 🎉" alert shown
- Usage badge disappears from Home screen
- Account screen shows PRO badge
- Analyze button shows "Analyze My Document →" (no upgrade prompt)

---

### UAT-045: Rotating testimonials
**Expected:** Testimonial text changes every 4 seconds, dots indicate active review index

---

## Section 7 — Account Screen

### UAT-046: Profile display
**Expected:** Avatar shows first 2 initials of email (uppercase), email displayed, "Member since [Month Year]"

---

### UAT-047: Free user subscription section
**Expected:** FREE badge, "Analyses remaining: X of 3", "Upgrade to Pro →" button

---

### UAT-048: Pro user subscription section
**Expected:** PRO badge (gold), "Manage Subscription →" button (no analyses remaining row)

---

### UAT-049: Manage subscription opens billing portal
**Steps:** (Pro user) Tap "Manage Subscription →"  
**Expected:** Stripe billing portal opens in in-app form sheet

---

### UAT-050: History items are tappable
**Steps:**
1. Tap a history item on Account screen

**Expected:** Navigates to ResultsScreen showing that historical analysis

---

### UAT-051: History shows score with color coding
**Expected:** Score chip colored: green (7–10), amber (4–6), red (1–3)

---

### UAT-052: Skeleton loading state for history
**Expected:** While history is loading, 3 animated skeleton rows are shown (pulsing opacity)

---

### UAT-053: Delete account confirmation dialog
**Steps:**
1. Tap "Delete Account & Data"

**Expected:** Alert with "Delete Account" title, warning text about permanent deletion, "Cancel" and "Delete Forever" buttons

---

### UAT-054: Delete account success
**Steps:**
1. Confirm deletion in dialog

**Expected:**
- Account, analyses, and Stripe subscriptions are cancelled
- User is signed out and redirected to Login screen

---

## Section 8 — Security & Edge Cases

### UAT-055: JWT stored in encrypted keychain (not AsyncStorage)
**Verification:** Use a security auditing tool (e.g., objection) to verify tokens are in iOS Keychain / Android Keystore, not in plaintext storage.

---

### UAT-056: App handles no network gracefully
**Steps:**
1. Enable airplane mode
2. Try to analyze a document

**Expected:** Error alert with user-friendly message (not a crash or raw network error)

---

### UAT-057: Rate limiting — too many analyses
**Steps:**
1. Attempt to analyze 6+ documents within 1 minute

**Expected:** Alert "Slow down — Too many requests. Please wait a moment."

---

### UAT-058: Large image is resized before upload
**Verification:** Using network interceptor (Charles Proxy / proxyman), verify image uploads are JPEG, max 1200px width, reasonable file size (< 1 MB after compression)

---

### UAT-059: PDF too large shows alert
**Steps:**
1. Browse Files and select PDF > 1.5 MB

**Expected:** Alert "PDF too large" (analysis NOT attempted)

---

### UAT-060: App returns to correct state after background/foreground
**Steps:**
1. Start analysis
2. Background app
3. Foreground app

**Expected:** Loading overlay still shown (analysis continues); result displayed when complete

---

## Section 9 — Pro Features

### UAT-061: Pro user gets longer analysis (20k vs 6k char limit)
**Verification:** Pro user can paste and analyze 10,000+ character contracts without truncation warning. Free user text is truncated to 6,000 chars server-side.

---

### UAT-062: Pro user sees unlimited analyses
**Expected:** No usage badge, no paywall triggered, unlimited analyses allowed

---

## Sign-Off

| Role          | Name | Signature | Date |
|---------------|------|-----------|------|
| QA Lead       |      |           |      |
| Product Owner |      |           |      |
| Developer     |      |           |      |

**Build approved for App Store submission:** ☐ Yes  ☐ No

**Known issues at sign-off:**
- _None_

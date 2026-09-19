# First release — 20 levels

Updated: 2026-09-19. This is the current plan; older architecture reports are historical.

## 1. Mechanics and level balance — implemented, human playtesting pending
- Exactly 20 authored stages, distinct names/goals/move budgets; no countdown in the shipping chapter.
- Colors introduced in three bands: levels 1–3 use four, 4–12 use five, 13–20 use six.
- Level 20 returns to the journey with a chapter-complete result; replay remains available.
- Legacy 100-level map progress is backed up before migration; higher-level saved games are archived.
- Cascade recovery is bounded at 64 passes and preserves remaining specials and objective progress.
- Reproducible balance runner plays the actual swap/match/gravity functions with seeded randomness, normal difficulty, no boosters and the greedy hint policy. DOM/animation and wall-clock costs are stubbed: this is NOT a phone benchmark or a human difficulty rating.
- 30 seeds per level, 600 full games. See BALANCE_REPORT.json. 61 regression tests pass.
- Human acceptance: new players can understand goals; no unexplained difficulty spikes; verify every special interaction and low-stock booster flow on devices.

## 2. Design and UI — in progress
- Existing shared palette, icons, dialogs and tutorial are retained.
- In-game boosters are semantic buttons for keyboard/accessibility operation.
- Swap tutorial now lets the player select and swap the highlighted pair; no overlapping pointer or automatic reversal. Reduced motion skips the swap animation.
- Remaining: small-screen walkthrough of every result/reward/error state, tutorial interaction polish, audio listening checks, reduced-motion and screen-reader checks.

## 3. Accounts and cloud progress — external setup needed
- Current player profile is device-local only; it is not server authentication.
- Target: Supabase Auth with Google, Apple and email; verified SMTP for verification/reset mail; secure per-user database policies; progress merge and retry behavior; account deletion.
- User can create Supabase/Resend projects; actual configuration is pending. Need project configuration, provider registration and verified mail domain. Never embed privileged service credentials in the app.

## 4. Android/iOS packaging — not started
- Repository is currently a web game, not a signed AAB/IPA. User confirms Play Console and Apple Developer accounts do not exist yet.
- Need native wrapper setup, app identifiers, lifecycle/deep links, signing, Android build environment and macOS/iOS build access.

## 5. Device QA — pending devices/builds
- User confirms test phones are available; exact models/OS versions are not yet supplied. Android lower/middle tier and physical iPhone: memory, frame times, thermal behavior, background/resume, audio interruption, touch, offline/reconnect, auth redirects and progress recovery.
- A desktop simulation or 61 automated tests is not evidence of device readiness.

## 6. Store release — pending accounts and QA
- Store identities, production eligibility/testing requirements, screenshots, age/content ratings, privacy declarations, support/privacy/deletion URLs and review instructions.
- Upload and public approval are distinct milestones. Review dates are not guaranteed.

## Execution order
Finish mechanics → UI walkthrough → accounts/progress → signed mobile builds → device QA → store submission.
Service setup can happen while UI work continues. Unavailable accounts, signing access and physical devices must not be represented as completed work.

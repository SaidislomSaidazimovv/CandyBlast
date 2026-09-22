# Candy Blast 1.0 release gate

## Required before closed testing

- Confirm ownership of bundle/application ID `uz.candyblast.game`.
- Create Google Play Console and Apple Developer accounts.
- Install Android Studio SDK, set `ANDROID_HOME`, build and sign an Android App Bundle.
- Build and sign iOS on a Mac with current Xcode.
- Add `candyblast://auth/callback` to Supabase Auth redirect URLs.
- Create Google and Apple native OAuth clients and test account linking on physical devices.
- Run Supabase migrations `002`, `003`, `004`, and `005` in order after the already-applied `001`.
- Create the three consumable products listed in `STORE_PRODUCTS.md` on both stores.
- Implement and deploy receipt verification; test purchase, cancel, pending, duplicate, refund and restore flows.
- Publish public Privacy Policy, Terms of Service, support URL and account deletion instructions.
- Replace generated Capacitor launcher/splash assets with final Candy Blast store artwork.

## Quality gate

- Pass `npm test` and `node tests/layout.cdp.cjs 9223`.
- Complete all 20 levels on at least one mid-range Android phone and one supported iPhone.
- Test offline launch, reconnect/cloud merge, app background/restore, incoming call interruption and low-memory restart.
- Verify Google/Apple/email sign-in, password recovery, sign-out and account deletion.
- Confirm five-heart timer, level failure, rewards, Lucky Spin, boosters, score upload and duplicate-claim protection.
- Record cold launch, Journey load and gameplay frame pacing on physical phones; investigate visible stalls.
- Capture phone/tablet screenshots with no debug data or test accounts.

## Store submission blockers currently known

- Google Play Console account is not yet available.
- Apple Developer account and macOS/Xcode signing environment are not yet available.
- This Windows machine has Java but no Android SDK/`ANDROID_HOME`.
- Native purchase verification credentials and final localized prices do not exist yet.

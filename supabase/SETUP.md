# Candy Blast Supabase setup

The browser client is already connected to project `wvoupimfijsveodbhmue` with its publishable key. Never add a `service_role`, `sb_secret_...`, Resend key, Google client secret, or Apple `.p8` key to this repository.

## 1. Create the progress table

Open **Supabase Dashboard → SQL Editor → New query**, paste the complete contents of [`migrations/001_auth_and_progress.sql`](migrations/001_auth_and_progress.sql), and run it once. The migration creates `player_progress`, enables RLS, and limits every read/write to the signed-in user's own row.

## 2. Configure application redirects

Open **Authentication → URL Configuration**.

- During local development set **Site URL** to `http://127.0.0.1:4174/`.
- Add `http://127.0.0.1:4174/` to **Redirect URLs**.
- Once hosting is chosen, replace the Site URL with the production HTTPS URL and add that exact URL to Redirect URLs.
- Later, add the native mobile deep-link callback used by the Android/iOS wrapper.

Email confirmation, password recovery, Google, and Apple all return to one of these allowed application URLs.

## 3. Email and password

Open **Authentication → Providers → Email** and keep Email enabled. For the release, keep **Confirm email** enabled. Before public testing, configure custom SMTP with the Resend credentials in the Supabase dashboard; the Resend key must stay in Supabase and out of the app.

## 4. Google provider

1. Open Google Cloud Console and create or select a project.
2. Open **Google Auth Platform** and complete Branding, Audience, and Data Access. Use only `openid`, `userinfo.email`, and `userinfo.profile`.
3. Under **Clients**, create an OAuth client with application type **Web application**.
4. Add these **Authorized JavaScript origins** while developing:
   - `http://127.0.0.1:4174`
   - the future production origin, such as `https://example.com`
5. Add this exact **Authorized redirect URI**:
   - `https://wvoupimfijsveodbhmue.supabase.co/auth/v1/callback`
6. Copy the generated **Client ID** and **Client secret** into **Supabase → Authentication → Providers → Google**, then enable and save the provider.

The secret belongs only in the Supabase provider form. The Android and iOS native client IDs will be added later after package and bundle IDs and signing credentials are final. Supabase accepts multiple Google client IDs with the Web client first.

## 5. Apple provider

Apple setup requires an active Apple Developer membership and a final App ID and Bundle ID. It cannot be completed with only a Supabase project.

1. In Apple Developer, register the primary App ID and enable **Sign in with Apple**.
2. Register a **Services ID** for web OAuth and associate it with the primary App ID.
3. Configure its website domain as `wvoupimfijsveodbhmue.supabase.co` and return URL as:
   - `https://wvoupimfijsveodbhmue.supabase.co/auth/v1/callback`
4. Create a Sign in with Apple key and securely download the `.p8` file. Apple only allows this download once.
5. Generate the Apple OAuth secret from the Team ID, Services ID, Key ID, and `.p8` signing key, then enter the required values in **Supabase → Authentication → Providers → Apple**.

Apple's web OAuth secret expires and must be rotated at least every six months. Keep the `.p8` file in secure credential storage, never in Git or chat. Native iOS Sign in with Apple will be connected through the mobile wrapper later.

## 6. Verification checklist

- Create an email account and confirm it from the received email.
- Sign out and sign back in.
- Complete a level, reload, and confirm that `player_progress` contains one row for that user.
- Sign in from a second browser or device and confirm that unlocked levels, stars, score, lives, boosters, rewards, theme, and settings are restored.
- Request password recovery and confirm that the link opens the new-password screen.
- Test Google after enabling its provider.
- Test Apple only after the Apple Developer configuration is complete.

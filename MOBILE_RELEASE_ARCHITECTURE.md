# Candy Blast mobile release architecture

## Product surfaces

### Android and iOS app

The playable game is the primary product. It owns gameplay, onboarding, account/profile, cloud progress, settings, rewards, sound, haptics and offline play. The current browser build is the shared game client used to develop this surface; it will be wrapped with Capacitor after the permanent application ID is fixed.

### Public website

The website is a lightweight product page, not the playable release. Its job is to explain Candy Blast, link to Google Play and the App Store, and host public Privacy Policy, Terms and support information. It is maintained and deployed from the separate `CandyBlast-Official-Site` repository. Store buttons remain marked “Coming soon” until real listing URLs exist.

## Environments

- Local game development: `http://127.0.0.1:4174/`
- Current web staging: `https://candy-blast-six.vercel.app/`
- Official website: `https://candyblast-official-site.vercel.app/`, followed by a custom HTTPS domain owned by the project
- Mobile auth callback: an app deep link added when the Capacitor application ID is finalized

The existing Candy Blast Vercel deployment remains the playable game staging build during mobile development. The public website uses a separate repository and Vercel project.

## Release order

1. Finish the shared mobile UI system and 20-level gameplay quality.
2. Finalize the Android application ID and iOS bundle ID.
3. Add Capacitor Android and iOS shells, native safe areas, deep links, haptics and secure session storage.
4. Configure Supabase mobile redirect URLs and native Google/Apple clients.
5. Test Android on a physical device; build and test iOS on macOS or a managed iOS build service.
6. Create store accounts, signing assets, screenshots, privacy declarations and testing tracks.
7. Connect real store URLs in the official-site repository and publish its custom domain.

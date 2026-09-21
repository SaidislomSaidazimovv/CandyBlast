# Candy Blast mobile release architecture

## Product surfaces

### Android and iOS app

The playable game is the primary product. It owns gameplay, onboarding, account/profile, cloud progress, settings, rewards, sound, haptics and offline play. Capacitor 8 Android and iOS shells now live in this repository. The provisional application ID is `uz.candyblast.game`; confirm ownership before creating store listings because changing it later creates a different app.

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
2. Confirm the Android application ID and iOS bundle ID (`uz.candyblast.game` is currently configured).
3. Android and iOS shells, safe areas, the `candyblast://auth/callback` deep link and haptics are configured. Add the callback to Supabase Auth redirect URLs.
4. Configure Supabase mobile redirect URLs and native Google/Apple clients.
5. Test Android on a physical device; build and test iOS on macOS or a managed iOS build service.
6. Create store accounts, signing assets, screenshots, privacy declarations and testing tracks.
7. Connect real store URLs in the official-site repository and publish its custom domain.

## Native development

Run `npm install`, then `npm run mobile:sync` after each web change. `npm run android` opens Android Studio and `npm run ios` opens Xcode. Android builds require Android Studio/SDK and a configured `ANDROID_HOME`; iOS signing and builds require macOS with Xcode. Large Three.js files and world images are now loaded and cached only when the player approaches the Journey or game screen, keeping them out of the initial launch path.

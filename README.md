# Candy Blast

Candy Blast is a mobile-first match-3 game with 20 handcrafted release levels,
cloud progress, profiles, rewards, boosters, a world map, and offline play.

## Run locally

Install the dependencies, then start the local server:

```sh
npm install
node scripts/serve.cjs
```

Open `http://127.0.0.1:4174/`.

## Build

```sh
npm run build
```

The production-ready web files are written to `dist/`. Vercel uses this folder
through `vercel.json`.

## Test

```sh
npm test
```

## Mobile apps

The Android and iOS shells use Capacitor. Generate the web build and synchronize
the native projects with:

```sh
npm run mobile:sync
```

Android packaging requires Android Studio and an Android SDK. iOS packaging
requires Xcode on macOS.

## Official website

The public download website is maintained separately in
[CandyBlast-Official-Site](https://github.com/SaidislomSaidazimovv/CandyBlast-Official-Site).

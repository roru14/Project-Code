# Fitness Diary

A calorie and macro tracker you install on your phone from a web link — no App
Store, no developer account, no server to run.

It's a recreation of the `myfitnesspal` reference app in
[tunde-alao/adios-subscriptions](https://github.com/tunde-alao/adios-subscriptions/tree/main/myfitnesspal),
rebuilt as an installable PWA so it can actually run on a phone without an Apple
Developer account or a hosted backend.

## Getting it on your phone

1. Deploy it (see below) and open the URL in your phone's browser.
2. **iPhone (Safari):** tap Share → *Add to Home Screen*.
   **Android (Chrome):** tap the *Install* button the app shows, or menu → *Install app*.
3. Launch it from the home-screen icon. It runs full-screen and works offline.

> Use `https://` (or `localhost`). The camera and offline support are both
> disabled by browsers on plain `http://` pages.

## Deploying

### Vercel (works on private repos, no settings to flip)

Import the repo at [vercel.com/new](https://vercel.com/new). `vercel.json`
pins the framework, build command and output directory, so accept the defaults
and deploy. You get an `https://<project>.vercel.app` URL, and every later push
redeploys automatically.

### GitHub Pages

`.github/workflows/deploy.yml` is manual-only (Actions tab -> Run workflow),
because **Pages has to be enabled by hand first** — the workflow token is not allowed to create a Pages site, so the
build fails at `configure-pages` until you do:

**Settings → Pages → Build and deployment → Source: GitHub Actions**

Then re-run the workflow from the Actions tab. The app lands at
`https://<user>.github.io/Project-Code/`.

Note that GitHub Pages on a **private** repository needs a paid plan. If the
Pages settings page says it is unavailable, use Vercel above, or make the repo
public.

### Any other static host

Build command `npm run build`, output directory `dist`. Nothing else to
configure — the app uses hash routing, so it needs no SPA rewrite rules.

## Running locally

```bash
npm install
npm run dev        # http://localhost:5173, also served on your LAN IP
npm run build
npm run preview
```

`npm run dev` binds to `0.0.0.0`, so you can open it from your phone on the same
Wi-Fi. Note that the camera scanner will not start over plain `http://` on a LAN
IP — use a deployed `https://` URL to test scanning.

## What it does

| Screen | |
|---|---|
| **Today** | Calorie and macro rings against your daily goals, a week strip, and the four meals. Tap a day to move around; days with entries are ticked. |
| **Log Food** | Search the [Open Food Facts](https://world.openfoodfacts.org) database, re-log from your history, or *Quick add* raw numbers. |
| **Add Food / Edit Entry** | Serving-size conversion (g/oz/ml/cup…), servings, meal, add-to-multiple-days, macro split ring, percent of daily goals, full nutrition facts. |
| **Barcode Scan** | Camera scanning with a manual-entry fallback. |
| **Progress** | Daily calories against your goal over 7/14/30 days, plus average macros. |
| **More** | Edit your daily goals, export/restore a JSON backup, clear all data. |
| **Plan** | Not available in this version (as in the reference app). |

## How it's built

- **Vite + React + TypeScript + Tailwind**, no UI framework.
- **Storage is local.** The reference app used Supabase auth plus a Hono/Postgres
  backend; this build is single-user, so everything lives in `localStorage` and
  works with no network. That means **your data lives in this browser only** —
  clearing site data or switching phones loses it, so use *More → Export backup*.
- **Barcode scanning** uses the native `BarcodeDetector` API where it exists
  (Chrome, Android). iOS Safari has no such API, so it lazy-loads ZXing instead —
  that ~400 kB only downloads on browsers that need it, and only when you open
  the scanner.
- **Offline** via a service worker (`vite-plugin-pwa`). The app shell is
  precached; Open Food Facts lookups are network-first with a 30-day cache, so
  products you've already seen still resolve offline.

### Differences from the reference app

Intentional, and all of them because the target is a browser rather than a
native iOS build:

- **No accounts.** Apple Sign In and magic links are gone with the backend; the
  onboarding step just asks your name.
- **Editable daily goals.** The original hard-coded 2930 kcal. That's fine for a
  design reference and useless for actually tracking, so More → Daily goals.
- **Progress is implemented** rather than a placeholder — the data was already
  there.
- **Delete a single entry** from the edit screen. The original could only clear a
  whole meal.
- **Every logged day is ticked** in the week strip, not just the selected one.
- **Font**: the original uses DIN Next Rounded, which is commercially licensed
  and can't be redistributed here. Nunito (Google Fonts) stands in — same rounded
  geometric feel.

## Data source

Food data comes from [Open Food Facts](https://world.openfoodfacts.org), licensed
under the [Open Database License](https://opendatacommons.org/licenses/odbl/1-0/).
Nutrition values are community-contributed and can be wrong or missing; check
anything that looks off.

This app is not affiliated with MyFitnessPal.

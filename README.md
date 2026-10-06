# CS Family Star — FUE Campus Food Guide

A mobile-first, bilingual (English/Arabic) food guide for Future University in Egypt. It helps students discover campus and Point 90 food spots, browse sourced menus, search dishes, plan a meal budget, save favourites, compare venues, and contribute community reviews when a managed backend is available.

## What is deliberately local

Favorites, personal reviews, saved dishes, meal plans, device memories, and menu reports are stored on the device by default. **Settings → Export device backup** creates a JSON copy, and **Import device backup** restores it. A student may clear local data at any time from Settings.

When a community API is configured, only actions explicitly labelled as shared—reviews, memories, and study-spot votes—are sent to that API. The frontend never contains an API secret.

## Local development

```bash
npm ci
npm run dev
```

The development server listens on all interfaces so a phone on the same network can open it. Production checks are:

```bash
npm run check      # typecheck + unit tests + production build
npm run build
npm run preview
```

## Deploying

The site is a static Vite build. Vercel uses `npm run build` and deploys `dist/`. Do not commit `node_modules/`, `dist/`, or packaged ZIP artifacts; CI installs dependencies from `package-lock.json` and builds reproducibly.

For a managed community experience, set this **public** build-time variable in the deployment environment:

```bash
VITE_COMMUNITY_API_URL=https://api.your-campus.example
```

Use HTTPS and configure CORS on the API for the web origin and Capacitor origin. The endpoint must implement the client contract in [`docs/COMMUNITY_API.md`](docs/COMMUNITY_API.md). Leaving the variable unset keeps the app device-only until a student manually connects a compatible API in Settings.

## Data policy

Bundled data provides a small offline fallback. Full menu/catalog data is loaded from the pinned original project source and is visibly marked when it is incomplete, branch-level status is unknown, or the data needs checking. A deployed community service should record source URLs, a last-confirmed timestamp, reporter context, and an approval state before publishing menu edits.

Logos and menu information remain subject to the source credits in [`public/CREDITS.md`](public/CREDITS.md). This guide is independent and is not a restaurant endorsement.

## Project layout

- `src/data.ts` — fallback catalog, venue types, routing/map helpers
- `src/original.ts`, `src/sourceParser.ts` — safe, off-thread source loading and cache hydration
- `src/menuLogic.ts` — menu normalization and data-safety rules
- `src/features.tsx`, `src/components.tsx`, `src/App.tsx` — user interface
- `src/foodTools.tsx`, `src/backup.ts` — device tools and portable backups
- `public/sw.js` — offline cache policy

See `MENU_CHECKS.md`, `MOBILE_QA.md`, and `ANDROID.md` for specialised validation and release guidance.

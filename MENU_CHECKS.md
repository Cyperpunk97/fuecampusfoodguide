# Menu Reliability and Food Tools

## Implemented Fixes

- Exact brand matching replaces substring and prefix guessing. Empty IDs cannot match arbitrary venues, and contradictory cache keys are rejected.
- Talabat reference menus are selected automatically where an exact match exists. Campus-authored menus remain separately selectable. Menus are never silently attached to another brand.
- HTML entities in text and image URLs are decoded, including the `&amp;` query parameters in the original photo dataset.
- Positive numeric, currency-formatted, and Arabic-digit prices are normalized to two decimals. Invalid, negative, missing, and zero prices are shown as **Ask in store**, not free food. Foreign-currency imports are rejected rather than relabeled EGP.
- Exact duplicate dishes are removed, colliding IDs repaired, and category indexes rebuilt from the retained items. Different sizes and prices are preserved.
- Vegetarian flags are removed when the name, ingredients, or category explicitly names meat or seafood. A temperature-only word such as **hot** does not make a drink spicy. These labels remain hints, never dietary guarantees.
- Source loading uses independent results: a failure in translations or the menu archive does not erase the last usable catalog or other menus.
- The version-4 menu cache migrates existing source data through the repaired normalizer. Personal favorites, reviews, and device edits are not deleted.
- Automatic missing-menu requests are shared between remounts so React Strict Mode does not suppress the result or leave the spinner stuck. Manual refresh failures keep the existing usable menu.
- Empty menus, partial offline subsets, brand-reference menus, missing dates, and future source dates are explicitly labeled.
- Menus render in 40-item batches with search, category, price, popularity, and saved-item filters. Photo errors can be retried without stale component error state.

## New Features

- **Saved dishes:** bookmark exact dishes with their venue and source reference; old entries remain visible if an item disappears.
- **Meal budget planner:** quantities, a user-set budget, current-menu subtotal, over-budget warnings, changed-price warnings, and shareable planning notes. Unknown prices and missing items are excluded from the known subtotal and prominently flagged. This is not ordering or checkout.
- **Menu check center:** structural checks for every loaded venue, available/missing/source-note filters, source provenance, and a downloadable JSON report.
- **Problem reports:** private device reports for incorrect prices, missing dishes, photo problems, or dietary-label issues. Reports appear in the check center and its export; the app never pretends to publish them.
- **Photo checks:** an explicit action probes all unique supported image URLs in the selected menu with four concurrent loads and an eight-second per-image timeout. The action can be cancelled. A network failure is reported as unavailable or timeout, not automatically as a permanently broken restaurant image.
- **Missing-menu lookup:** when a real backend is connected, the check center can look up missing menus one at a time, spacing calls to respect the original endpoint's 10-per-minute limit. Only matching, usable responses are applied. Failed or missing sources stay marked unavailable.

## Checks and Limitations

`src/menuLogic.ts` contains a built-in deterministic check suite for price parsing, URL decoding, unsupported image hosts, deduplication, dietary conflicts, currency safety, and brand matching. The menu check center executes it and displays the actual pass count. It also checks every loaded menu's retained data and exports those results.

The production build is checked with the provided build tool. No physical Android device or deployed community backend is available in this workspace. Current Talabat prices, current campus-branch availability, and every remote photo cannot be claimed verified here. The app keeps those distinctions visible instead of generating replacement menus or fabricated verification badges.

Full menu data is loaded from the pinned original repository. On a first-ever offline launch, only the bundled authentic subset is available; the check center labels that coverage provisional. The repository archive and authored menu dates can be outdated or future-dated. **Reload source data** rechecks that pinned archive; **Refresh menu** uses the configured backend for a Talabat lookup. These are distinct operations.

## Before Android Release

1. Connect the HTTPS deployment of the original Next.js backend in Settings and enable CORS for the website and Capacitor origin.
2. Open **Check menus**, reload the source data, inspect missing menus and branch-reference notes, then export the report.
3. Use the rate-limited lookup action for missing menus. If a source cannot be found, supply a genuine matching menu or leave it clearly unavailable.
4. Run individual menu photo checks on a real connection. Confirm branch prices and dietary information directly with the venue before marking them verified.
5. Test startup, offline reopening, source switching, saved dishes, quantities, cancellation, Arabic/RTL, and Android hardware back on an actual device.

Implementation paths: `src/menuLogic.ts`, `src/original.ts`, `src/MenuPanel.tsx`, `src/MenuAudit.tsx`, `src/menuPhotos.ts`, `src/foodTools.tsx`, and `src/FoodPlanner.tsx`.
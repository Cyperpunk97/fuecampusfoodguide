# CS Family Star — Android Mobile Porting Guide & Enhancements

Source project: https://github.com/Cyperpunk97/CS-FAMILY-STAR
Reference commit: `d8392863f32443974543d50307774a81def72b07`

## Menu Checks and Food Tools

Read `MENU_CHECKS.md` before release. It describes the exact-brand menu resolver, safe image/price normalization, full Talabat versus campus menu selection, saved dishes, meal-budget planning, photo checks, private problem reports, and the all-venue menu check center.

The check center runs deterministic menu-logic checks and inspects all loaded menus, with a downloadable report. A connected original backend can look up missing menus at a safe request rate. No source menu, live Talabat price, remote image, or campus branch is marked vendor-verified merely because parsing succeeded. Menus absent from both the original dataset and the reachable backend remain explicitly unavailable.

The current production build is verifiable here; physical Android behavior, all live photo URLs, and a deployed backend still require device/network checks. Device backups now include saved dishes, meal plans, budgets, menu-source preferences, and problem reports as well as the existing records.

## 9:16 Mobile-Only Layout

- `src/app.css` is the single mobile-first stylesheet. The old stacked override sheet was removed; portrait phones are the design target and desktop shows a centered phone-width preview of the same app instead of a separate dashboard.
- At a 360 x 640 or 393 x 699 viewport, the brand, area selector, one supporting sentence, search, categories, and the first complete restaurant row fit above the bottom navigation. The second row begins in view on most phones.
- Place cards are touch-friendly scan rows. Menu and directions remain one tap away; comparison is accessible in each place sheet and from More. Surprise Me, faculty, leaderboard, planner, menu checks, language, profile, settings, and install controls remain in More.
- The venue sheet reserves space for a fixed menu-tab row and directions footer while only its content scrolls. Dialogs have focus trapping and swipe-down-to-close from the header/handle. The tab content scroll position resets on tab changes.
- Search and text inputs hide the bottom navigation while the keyboard is focused. Safe-area and dynamic viewport units keep controls clear of the gesture bar and on-screen keyboard. Arabic keeps RTL ordering without mirroring logos.
- Both the downloaded source parser and the saved-catalog JSON parser now run in Web Workers. On cold start the bundled authentic catalog paints immediately; the full saved catalog hydrates off-thread. The first HTML is roughly 497 KB (151 KB gzip) instead of roughly 871 KB before optimization.
- Build and deploy **all** files in `dist/`, including `cacheWorker-*.js` and `sourceWorker-*.js`. With a cached dataset and no network, reopening still restores menus via the cache worker. There is no runtime server URL baked into the Capacitor configuration.

See `MOBILE_QA.md` for the device test checklist. The production build passes; a physical 9:16 Android WebView and live backend have not been verified in this workspace.

## Mobile-first Performance Pass

- The phone home screen now puts brand, nearby location, search, categories, and the first restaurant row above the old promotional/tool clutter. The bottom bar is Discover, Saved, Memories, More; leaderboard, meal planning, menu checks, comparison, and settings remain accessible from More.
- Venue cards on phones are lightweight list rows instead of large stacked cards. The full brand logo still appears in the venue sheet; a wide wordmark uses an initials avatar in the small list position so it stays readable.
- The original menu TypeScript parser and large Talabat JSON normalize in `src/sourceWorker.ts`; saved-catalog hydration parses in `src/cacheWorker.ts`. Both execute off the main UI thread.
- Pull-to-refresh updates the small indicator directly during a drag instead of rerendering the whole app on every touch move. Search work is deferred and dish results render in smaller batches on phones.
- Logo images now use the browser's native lazy loading and service-worker cache. They are no longer redundantly fetched from Cache Storage and converted to separate blob URLs for every mounted logo.
- On phones, menu editing/import/export stays behind a Menu tools toggle; important search and menu items remain immediately visible. Effects like backdrop blur and hover shadows are disabled on touch devices.

Source parsing requires Web Worker support on a first online launch. Android Chrome and modern Android WebView support workers. If an unsupported old WebView cannot load original sources, the bundled authentic subset and any previously saved catalog remain available; no made-up menu is shown. Test on a real device before distribution.

## Mobile enhancements implemented before porting

Before generating the Android APK or installing via PWA, the following mobile-specific enhancements have been integrated into the code:

1. **Android Hardware Back Button Navigation**:
   - Integrated with `@capacitor/app`.
   - Dismisses open modal sheets, dialogs, or search results first.
   - If pressed on the root screen, prevents accidental closure by prompting *"Press back again to exit"* with a 2.5s window before closing.
   - Triggers native haptic feedback on back press.

2. **Native Android Haptic Feedback**:
   - Integrated with `@capacitor/haptics` (and Web Vibration API fallback).
   - Light feedback on tab selection, filters, and venue card open.
   - Success vibration on adding to favorites.
   - Medium vibration on pull-to-refresh and the confirmed Android exit action.

3. **Android Status Bar & Splash Screen Lifecycle**:
   - Integrated with `@capacitor/status-bar` and `@capacitor/splash-screen`.
   - Native dark status bar style with `#822727` deep maroon background.
   - Automatic smooth splash screen fade-out upon web runtime readiness.

4. **Android Material Bottom Sheet Affordance**:
   - Rounded top corners (`20px 20px 0 0`) on mobile screens (`≤760px`).
   - Material 3 drag-handle indicator bar on dialogs and sheets.
   - `overscroll-behavior-y: contain` so dragging does not bounce the outer viewport.
   - `height: 92dvh` on mobile phones for comfortable one-handed navigation.

5. **Direct One-Tap Walking Directions on Cards**:
   - Mobile venue cards feature an instant **Directions** button alongside **View Menu** and **Compare**.
   - Opens walking directions directly in Google Maps from the campus or selected faculty.

6. **Pull-to-Refresh Gesture**:
   - Touch-enabled pull-to-refresh at the top of the discovery feed.
   - Pulling down reveals an animated loader and triggers a refresh of menus and reviews with haptic feedback.

7. **Android Keyboard & Input Optimizations**:
   - Text and search inputs configured with `inputMode="search"`, `enterKeyHint="search"`, and enter-to-blur.
   - Font sizes set to ≥16px on mobile viewports to prevent unwanted browser zoom jumps.
   - Integrated `@capacitor/keyboard` configured with resize: `body`.

8. **Original CS-Family-Star Palette Everywhere**:
   - Deep maroon brand (`#822727`), amber star (`#f59e0b`), warm cream surface (`#faf8f5`), and accessible ink (`#1c1917`, `#57534e`, `#6b6560`).
   - Complete coverage across cards, bottom bar, dialogs, menus, memories, filters, and Android theme color.

9. **Fluid Aspect-Ratio Layout on Phones**:
   - Brand marks, dish thumbnails, map panels, and the install preview use `aspect-ratio` frames instead of fixed pixel heights, so nothing is squashed or letterboxed at 320px, on tall phones, or on foldables (`5/3` logo frames on phones, `16/9` above, square dish photos, `4/3` maps).
   - Hero, sheet, and dialog heights use `dvh` with `max()` clamps, so no artwork eats the first screen and sheets never exceed the visual viewport.
   - Short landscape phones (`max-height:560px`) switch to full-height sheets, a compact bottom bar, and 2-column grids.
   - Sizes scale with `clamp()` (`--logo-w`, `--thumb-size`) rather than snapping between breakpoints; `@supports not (aspect-ratio:1)` restores explicit frames on older WebViews.
   - Body text floors at ~11.5px on phones, form controls stay at 16px to block auto-zoom, touch targets reach 40–44px, rails scroll-snap, and safe-area insets guard the notch and gesture bar.
   - `interactive-widget=resizes-content` in the viewport meta keeps sheets above the on-screen keyboard.

10. **Talabat Menu Auto-Hydration & Dish Images**:
   - Menu items with dish photos from the original verified Talabat and repository menus are loaded and rendered.
   - Delivery Hero/Talabat image CDNs (`talabat.dhmedia.io`, `images.deliveryhero.io`) are cached cache-first in Service Worker for offline availability.

11. **Android Launcher App Shortcuts**:
    - `manifest.webmanifest` includes Android home screen quick actions (Discover Food, My Favorites, Campus Memories, Top Reviewers).

---

## Building the Native Android APK (Android Studio)

All required Capacitor packages are installed:
- `@capacitor/core`
- `@capacitor/cli`
- `@capacitor/android`
- `@capacitor/app`
- `@capacitor/haptics`
- `@capacitor/status-bar`
- `@capacitor/splash-screen`
- `@capacitor/keyboard`

### Steps to generate & run the APK:

1. **Build the production web assets**:
   ```bash
   npm run build
   ```

2. **Add the Android platform** (creates the `android/` directory):
   ```bash
   npx cap add android
   ```

3. **Sync web bundle & plugins into the Android project**:
   ```bash
   npx cap sync android
   ```

4. **Open in Android Studio**:
   ```bash
   npx cap open android
   ```

5. **In Android Studio**:
   - Allow Gradle sync to complete.
   - Connect an Android phone with USB debugging enabled or launch an Android Virtual Device (AVD).
   - Click the green **Run** button (Shift+F10).

6. **Generate a release APK / AAB**:
   - In Android Studio: **Build → Generate Signed Bundle / APK**.
   - Choose **APK** or **Android App Bundle** (for Google Play).
   - Sign with your keystore and build.

---

## Direct Browser Installation (PWA on Android)

Deploy the `dist/` directory to any HTTPS server:
1. Open the URL in **Google Chrome** on your Android phone.
2. Tap the in-app **"Get the Android app"** button, or tap Chrome menu (⋮) → **"Install app"** / **"Add to Home screen"**.
3. The app installs as a WebAPK with its launcher icon, standalone full-screen window, and offline support.

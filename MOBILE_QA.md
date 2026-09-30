# Portrait Phone Release Check

## Recovery And Visual Pass

- The app now validates stored favorites, reviews, filters, profile and saved catalog data before using it. Corrupt source data loads the bundled catalog instead of crashing the whole page. A root recovery screen can reload the app or just clear the public food-catalog cache; it does not delete personal favorites or reviews.
- The phone list uses the actual brand logo, not an initials substitute for wide wordmarks. Wide logos get a wider image slot. Venue names, category and price are now direct, unembellished labels rather than promotional copy.
- Dish search no longer remounts all results on every keystroke. Venue sheets no longer remount when switching tabs, and community reviews only load on the Reviews tab.

These changes passed the production build. Real Android startup, memory use, CDN image responses and tap-to-tap performance remain unverified until tested on a phone.

The interface is designed for 9:16 Android phones. This list separates a successful build from checks that require a device or browser simulator.

## Screen Sizes

- 320 x 568: compact Android, 9:16. Header, search, filters, categories, and the first place row must be usable without horizontal scroll.
- 360 x 640: baseline 9:16. A full first restaurant row should appear above the bottom bar.
- 393 x 699 and 412 x 732: common taller phones. The second row should begin in view.
- 390 x 844: tall phone with top and bottom safe areas.
- Landscape with under 550 px height: sheet and menu content must remain scrollable; footer actions must stay visible.

## Interactions

1. Open Discover, enter and clear an English and Arabic search, then change to dish search and set a budget. Results must not flicker or lose input focus.
2. Open the area selector in the top bar, filter to Point 90, change faculty in More, then open Maps directions. Approximate locations should search by name rather than route to an estimated door.
3. Open and close a place by tapping the row, using the close button, swiping down from the handle, and using Android back. Switch between Overview, Menu, Reviews, and Study spot while scrolled to the bottom; each new tab should begin at its top.
4. With the keyboard open in search, review, memory, menu editing, and the planner, confirm the fixed bottom bar is hidden and the active field is visible above the keyboard.
5. Save a place, save a dish, add a dish to the budget planner, and reopen after force-stopping the app. The records must remain on that device.
6. Open a venue with a full Talabat menu, scroll 16 items, load more, switch category, and test a menu photo with and without network. Original wordmarks must fit without stretching.
7. Toggle Arabic. Confirm bottom navigation, header, menus, sheet tabs, comparison, and alerts work in RTL. Logos and food photos must not mirror.
8. In More, confirm Surprise Me, faculty, leaderboard, comparison, menu checks, language, profile, Settings, and installation remain reachable.

## Performance and Offline

- Inspect DevTools Network: `dist/cacheWorker-*.js` restores saved menus; `dist/sourceWorker-*.js` parses a first online load. The UI thread should remain responsive while each worker runs.
- Offline after one completed online visit: venue data, saved records, cached menu data, and requested logos must remain readable. Uncached photos must show a fallback, not a broken layout.
- Pull to refresh from the very top. The loader should track the gesture without stuttering the whole list and must stop when the request finishes or fails.
- Android WebView: confirm the status bar, splash, haptics, back button, and local data survive reopening.

The production web build has been verified here. No phone screenshot, Android APK, physical-device frame timing, live backend, or real Talabat CDN availability has been verified in this environment. Do not claim those tests passed until they are run on a device.
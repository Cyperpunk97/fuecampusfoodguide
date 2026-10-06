import { Capacitor } from '@capacitor/core';

let initialized = false;

/** Register the static offline shell. Install icons ship as real files, so browsers
 * can resolve them before JavaScript or a service worker has run. */
export async function initializePwa() {
  // Vite's development server serves workers from source paths, while the release
  // shell precaches stable built worker URLs. Keep the production cache policy out
  // of development so local HMR is never controlled by a stale service worker.
  if (import.meta.env.DEV || initialized || Capacitor.isNativePlatform() || !('serviceWorker' in navigator)) return;
  initialized = true;
  try {
    await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    await navigator.serviceWorker.ready;
  } catch {
    // Storage restrictions and embedded browsers must not block the food guide.
  }
}

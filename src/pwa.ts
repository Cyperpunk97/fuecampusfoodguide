import { Capacitor } from '@capacitor/core';

let initialized = false;

function createIcon(size: number): Promise<Blob | null> {
  const canvas = document.createElement('canvas');
  canvas.width = size; canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return Promise.resolve(null);
  ctx.scale(size / 512, size / 512);
  ctx.fillStyle = '#822727'; ctx.fillRect(0, 0, 512, 512);
  ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 19; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.save(); ctx.translate(249, 256); ctx.rotate(-0.72);
  ctx.beginPath(); ctx.moveTo(0, -112); ctx.lineTo(0, 111); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-31, -112); ctx.lineTo(-31, -57); ctx.quadraticCurveTo(-31, -29, 0, -29); ctx.quadraticCurveTo(31, -29, 31, -57); ctx.lineTo(31, -112); ctx.stroke();
  ctx.restore();
  ctx.save(); ctx.translate(263, 256); ctx.rotate(0.72);
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(-9, -113); ctx.quadraticCurveTo(30, -94, 20, -14); ctx.lineTo(3, 0); ctx.lineTo(-9, 0); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(2, -7); ctx.lineTo(2, 111); ctx.stroke(); ctx.restore();
  ctx.fillStyle = '#e8c97a'; ctx.beginPath(); ctx.moveTo(376, 117); ctx.lineTo(382, 134); ctx.lineTo(399, 140); ctx.lineTo(382, 146); ctx.lineTo(376, 163); ctx.lineTo(370, 146); ctx.lineTo(353, 140); ctx.lineTo(370, 134); ctx.closePath(); ctx.fill();
  return new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
}

/** Generate exact-size Android PNG icons into the service worker's persistent cache. */
export async function initializePwa() {
  if (initialized || Capacitor.isNativePlatform() || !('serviceWorker' in navigator) || !('caches' in window)) return;
  initialized = true;
  try {
    await Promise.all((await caches.keys()).filter(key => key.startsWith('cs-family-icons-') && key !== 'cs-family-icons-v2').map(key => caches.delete(key)));
    const icons = await caches.open('cs-family-icons-v2');
    await Promise.all([192, 512].map(async size => {
      const url = new URL(`/icons/icon-${size}.png`, window.location.origin).href;
      if (await icons.match(url)) return;
      const blob = await createIcon(size);
      if (blob) await icons.put(url, new Response(blob, { headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=31536000' } }));
    }));
    await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) await new Promise<void>(resolve => {
      const timeout = window.setTimeout(resolve, 3000);
      navigator.serviceWorker.addEventListener('controllerchange', () => { window.clearTimeout(timeout); resolve(); }, { once: true });
    });
    if (!document.querySelector('link[rel="manifest"]')) {
      const link = document.createElement('link'); link.rel = 'manifest'; link.href = '/manifest.webmanifest'; document.head.appendChild(link);
    }
    // Cache original assets only. Remove the obsolete food-photo cache.
    await Promise.all((await caches.keys()).filter(key => key.startsWith('cs-family-photos-')).map(key => caches.delete(key)));
    // Images load lazily and the service worker caches requested logos; prefetching
    // every visible image here caused a burst of duplicate network work on phones.
  } catch {
    // Storage restrictions and embedded browsers must not block the food guide.
  }
}

import { fallbackMenus, ORIGINAL_RAW, venues, type Menus, type RestaurantMenu, type Venue } from './data';
import { findBrandMenu, menuMatchesVenue, normalizeMenu } from './menuLogic';
import type { ParsedSources } from './sourceParser';

export { normalizeMenu } from './menuLogic';
export type MenuPreference = 'talabat' | 'repository';
export type OriginalSnapshot = { venues: Venue[]; menus: Menus; cachedMenus: Menus; messages: Record<string, string>; loadedAt?: string; schemaVersion?: number; complete?: boolean; errors?: string[] };
const CACHE_KEY = 'cs-star-original-snapshot-v4';
let sourceGeneration = 0;

/** Show the bundled catalog immediately; hydrate the large saved menu off-thread. */
export function readOriginalCache(): OriginalSnapshot {
  return { venues, menus: Object.fromEntries(Object.entries(fallbackMenus).map(([id, menu]) => [id, { ...menu, partial: true }])),
    cachedMenus: {}, messages: {}, schemaVersion: 4, complete: false, errors: [] };
}

async function loadCachedSnapshot(signal?: AbortSignal): Promise<OriginalSnapshot> {
  for (const key of [CACHE_KEY, 'cs-star-original-snapshot-v3', 'cs-star-original-snapshot-v2']) {
    try {
      const raw = localStorage.getItem(key); if (!raw) continue;
      const data = await new Promise<OriginalSnapshot>((resolve, reject) => {
        const worker = new Worker(new URL('./cacheWorker.ts', import.meta.url), { type: 'module' });
        let settled = false;
        const finish = () => { settled = true; signal?.removeEventListener('abort', abort); worker.terminate(); };
        const abort = () => { if (!settled) { finish(); reject(new DOMException('Loading cancelled.', 'AbortError')); } };
        worker.onmessage = (event: MessageEvent<{ value?: OriginalSnapshot; error?: string }>) => {
          if (settled) return; finish();
          if (event.data.value) resolve(event.data.value);
          else reject(new Error(event.data.error || 'Saved catalog is unavailable.'));
        };
        worker.onerror = error => { if (!settled) { finish(); reject(new Error(error.message || 'Saved catalog worker failed.')); } };
        signal?.addEventListener('abort', abort, { once: true });
        if (signal?.aborted) { abort(); return; }
        worker.postMessage({ raw, current: key === CACHE_KEY });
      });
      return data;
    } catch (error) {
      if (signal?.aborted) throw error;
      // Try the previous cache before falling back to bundled data.
    }
  }
  return readOriginalCache();
}

async function readSource(path: string, signal?: AbortSignal) {
  const response = await fetch(`${ORIGINAL_RAW}/lib/${path}`, { signal });
  if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
  const text = await response.text();
  if (text.length > 2_500_000) throw new Error(`${path}: source exceeds the safe size limit.`);
  return text;
}

async function parseOffThread(sources: (string | null)[], signal?: AbortSignal): Promise<ParsedSources> {
  if (typeof Worker === 'undefined') throw new Error('Background menu loading is not supported on this device. The saved catalog remains available.');
  return new Promise<ParsedSources>((resolve, reject) => {
        const worker = new Worker(new URL('./sourceWorker.ts', import.meta.url), { type: 'module' });
        let settled = false;
        const finish = () => { settled = true; signal?.removeEventListener('abort', abort); worker.terminate(); };
        const abort = () => { if (!settled) { finish(); reject(new DOMException('Loading cancelled.', 'AbortError')); } };
        worker.onmessage = (event: MessageEvent<{ result?: ParsedSources; error?: string }>) => {
          if (settled) return;
          finish();
          if (event.data.result) resolve(event.data.result);
          else reject(new Error(event.data.error || 'Source parsing failed.'));
        };
        worker.onerror = error => { if (!settled) { finish(); reject(new Error(error.message || 'Worker unavailable.')); } };
        signal?.addEventListener('abort', abort, { once: true });
        if (signal?.aborted) { abort(); return; }
        worker.postMessage(sources);
      });
}

export async function loadOriginalSnapshot(signal?: AbortSignal, onCache?: (snapshot: OriginalSnapshot) => void, refresh = false): Promise<OriginalSnapshot> {
  const generation = ++sourceGeneration;
  const previous = await loadCachedSnapshot(signal);
  if (signal?.aborted) throw new DOMException('Loading cancelled.', 'AbortError');
  if (previous.loadedAt) onCache?.(previous);
  if (previous.complete && previous.schemaVersion === 4 && !refresh) return previous;
  const paths = ['menus.ts', 'talabatMenusData.json', 'venues.ts', 'i18n.ts'];
  const results = await Promise.allSettled(paths.map(path => readSource(path, signal)));
  if (signal?.aborted && results.every(result => result.status === 'rejected')) throw new DOMException('Loading cancelled.', 'AbortError');
  const next = { ...previous, schemaVersion: 4, errors: [] as string[] };
  results.forEach((result, index) => {
    if (result.status === 'rejected') next.errors.push(`${paths[index]}: ${(result.reason as Error).message}`);
  });
  const inputs = results.map(result => result.status === 'fulfilled' ? result.value : null);
  const parsed = inputs.some(Boolean) ? await parseOffThread(inputs, signal) : { errors: [], successes: 0 };
  if (parsed.menus) next.menus = parsed.menus;
  if (parsed.cachedMenus) next.cachedMenus = parsed.cachedMenus;
  if (parsed.venues) next.venues = parsed.venues;
  if (parsed.messages) next.messages = parsed.messages;
  next.errors.push(...parsed.errors);
  if (!parsed.successes && !previous.loadedAt) throw new Error('Cannot load the original source right now. Your bundled catalog remains available.');
  next.loadedAt = parsed.successes ? new Date().toISOString() : previous.loadedAt;
  next.complete = next.errors.length === 0;
  if (generation !== sourceGeneration) return next;
  const save = () => {
    if (generation !== sourceGeneration) return;
    try {
      const encoded = JSON.stringify(next);
      localStorage.setItem(CACHE_KEY, encoded);
      for (const oldKey of ['cs-star-original-snapshot-v3', 'cs-star-original-snapshot-v2']) localStorage.removeItem(oldKey);
    } catch { window.dispatchEvent(new Event('cs-storage-error')); }
  };
  if (typeof window.requestIdleCallback === 'function') window.requestIdleCallback(save, { timeout: 4000 });
  else window.setTimeout(save, 500);
  return next;
}

export function getVenueMenuOptions(v: Venue, snapshot: OriginalSnapshot): { talabat?: RestaurantMenu; repository?: RestaurantMenu } {
  const cached = findBrandMenu(v, snapshot.cachedMenus); const authored = snapshot.menus[v.id];
  return {
    talabat: cached ? { ...cached, restaurantId: v.id, restaurantName: v.name, brand: v.brand, scope: 'brand', originRestaurantName: cached.originRestaurantName || cached.restaurantName } : undefined,
    repository: authored?.items.length && (authored.restaurantId === v.id || menuMatchesVenue(authored, v)) ? { ...authored, restaurantId: v.id, brand: v.brand, scope: 'branch' } : undefined,
  };
}

export function getVenueMenu(v: Venue, snapshot: OriginalSnapshot, overrides: Menus, preference: MenuPreference = 'repository'): RestaurantMenu {
  if (overrides[v.id]) {
    const source = overrides[v.id].source || 'custom'; const cleaned = normalizeMenu(overrides[v.id], source);
    if (cleaned && (source === 'custom' || cleaned.items.length > 0 && menuMatchesVenue(cleaned, v))) return { ...cleaned, restaurantId: v.id };
  }
  const options = getVenueMenuOptions(v, snapshot);
  const preferred = preference === 'repository' ? options.repository || options.talabat : options.talabat || options.repository;
  return preferred || { restaurantId: v.id, restaurantName: v.name, brand: v.brand, currency: 'EGP', categories: [], items: [], source: 'repository', scope: 'branch',
    note: 'No usable matching source menu is available. Add a menu or connect your backend; no dishes have been invented.' };
}
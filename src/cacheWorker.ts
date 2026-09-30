import { normalizeMenu } from './menuLogic';
import type { Menus, Venue } from './data';

type CachedValue = { venues: Venue[]; menus: Menus; cachedMenus: Menus; messages: Record<string, string>; loadedAt?: string; schemaVersion?: number; complete?: boolean; errors?: string[] };

function normalizeCollection(value: unknown, source: 'repository' | 'talabat-cache'): Menus {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const result: Menus = {};
  for (const [id, raw] of Object.entries(value)) {
    if (['__proto__', 'constructor', 'prototype'].includes(id)) continue;
    const menu = normalizeMenu(raw, source);
    if (menu?.items.length) result[id] = { ...menu, restaurantId: menu.restaurantId || id };
  }
  return result;
}

self.onmessage = (event: MessageEvent<{ raw: string; current: boolean }>) => {
  try {
    const data = JSON.parse(event.data.raw) as CachedValue;
    if (!Array.isArray(data.venues) || !data.venues.length || !data.menus || !data.cachedMenus) throw new Error('Saved catalog is incomplete.');
    const validVenues = data.venues.filter(venue => venue && typeof venue.id === 'string' && typeof venue.name === 'string' && typeof venue.brand === 'string' && Number.isFinite(venue.lat) && Number.isFinite(venue.lng));
    if (!validVenues.length) throw new Error('Saved venues are invalid.');
    const value: CachedValue = {
      ...data,
      venues: validVenues,
      menus: normalizeCollection(data.menus, 'repository'),
      cachedMenus: normalizeCollection(data.cachedMenus, 'talabat-cache'),
      messages: data.messages && typeof data.messages === 'object' && !Array.isArray(data.messages) ? data.messages : {},
      complete: event.data.current && data.schemaVersion === 4 && data.complete === true && validVenues.length === data.venues.length,
      schemaVersion: event.data.current ? 4 : 3,
      errors: Array.isArray(data.errors) ? data.errors.filter((message): message is string => typeof message === 'string') : [],
    };
    self.postMessage({ value });
  } catch (error) { self.postMessage({ error: (error as Error).message }); }
};
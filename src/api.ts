import { makeVenue, type AttributeId, type AttributeTally, type LeaderboardEntry, type Memory, type RestaurantMenu, type Review, type Venue } from './data';
import { normalizeMenu, safeMenuUrl } from './menuLogic';

export function validateBackend(raw: string) {
  const url = new URL(raw.trim());
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname))) throw new Error('Use an HTTPS backend URL (HTTP is only allowed on localhost).');
  if (url.username || url.password || url.search || url.hash) throw new Error('Use a backend URL without credentials, a query, or a fragment.');
  return url.toString().replace(/\/+$/, '').replace(/\/api$/, '');
}
async function request(base: string, path: string, body?: unknown, timeout = 15000): Promise<unknown> {
  if (!base) throw new Error('Connect a community backend in Settings to use shared features.');
  const controller = new AbortController(); const timer = window.setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(`${validateBackend(base)}${path}`, { method: body === undefined ? 'GET' : 'POST', signal: controller.signal,
      headers: { Accept: 'application/json', ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) }, body: body === undefined ? undefined : JSON.stringify(body) });
    const text = await response.text(); let data: unknown;
    try { data = JSON.parse(text); } catch { throw new Error('This URL did not return the original app API. Check the backend address and its CORS settings.'); }
    if (!response.ok) throw new Error(typeof (data as {error?: unknown}).error === 'string' ? (data as {error: string}).error : `Request failed (${response.status}).`);
    return data;
  } catch (err) {
    if ((err as Error).name === 'AbortError') throw new Error('The backend took too long to respond. Please retry.');
    if (err instanceof TypeError) throw new Error('Cannot reach the backend. Check the URL, network, and CORS configuration.');
    throw err;
  } finally { clearTimeout(timer); }
}
const record = (value: unknown): Record<string, unknown> => value && typeof value === 'object' ? value as Record<string, unknown> : {};
const menuJobs = new Map<string, Promise<RestaurantMenu>>();
export function fromRemoteReview(value: unknown): Review {
  const r = record(value);
  return { id: `community-${String(r.id)}`, venueId: String(r.restaurant_id), name: String(r.user_name || 'Student'), rating: Number(r.rating),
    comment: typeof r.comment === 'string' ? r.comment : '', spent: r.price_per_person === null || r.price_per_person === undefined ? null : Number(r.price_per_person),
    date: String(r.created_at), dish: typeof r.recommended_dish === 'string' ? r.recommended_dish : undefined, source: 'community' };
}
export function fromRemoteMemory(value: unknown): Memory {
  const m = record(value);
  return { id: String(m.id), title: String(m.title), caption: String(m.story || ''), name: String(m.authorName || ''), venueId: String(m.venueId || ''),
    venueName: String(m.venueName || ''), date: String(m.createdAt || m.date), outingDate: String(m.date), faculty: typeof m.faculty === 'string' ? m.faculty : undefined,
    mood: m.mood as Memory['mood'], tags: Array.isArray(m.tags) ? m.tags.map(String) : [], cheers: Number(m.cheersCount) || 0, source: 'community' };
}
export const api = {
  async venues(base: string): Promise<Venue[]> {
    const data = await request(base, '/api/restaurants'); if (!Array.isArray(data)) throw new Error('Invalid restaurant response.');
    return data.map(value => { const r = record(value); const v = makeVenue(r); return { ...v, rating: Number(r.averageRating) || 0, reviewCount: Number(r.reviewCount) || 0,
      averagePrice: r.averagePrice === null || r.averagePrice === undefined ? null : Number(r.averagePrice), priceReports: Number(r.priceReportCount) || 0,
      topDishes: Array.isArray(r.topDishes) ? r.topDishes.map(String) : [], openState: r.openState === 'open' || r.openState === 'closed' ? r.openState : 'unknown' }; });
  },
  async reviews(base: string, venueId: string): Promise<Review[]> { const data = await request(base, `/api/reviews?restaurant_id=${encodeURIComponent(venueId)}&limit=50&offset=0`); if (!Array.isArray(data)) throw new Error('Invalid review response.'); return data.map(fromRemoteReview); },
  async postReview(base: string, review: Review): Promise<Review> { return fromRemoteReview(await request(base, '/api/reviews', { restaurant_id: review.venueId, rating: review.rating, comment: review.comment || null, user_name: review.name || null, price_per_person: review.spent, recommended_dish: review.dish || null, image_url: null })); },
  async memories(base: string): Promise<Memory[]> { const data = await request(base, '/api/memories'); if (!Array.isArray(data)) throw new Error('Invalid memory response.'); return data.map(fromRemoteMemory); },
  async postMemory(base: string, memory: Memory): Promise<Memory> { return fromRemoteMemory(await request(base, '/api/memories', { title: memory.title, venueName: memory.venueName, authorName: memory.name, date: memory.outingDate || memory.date.slice(0,10), story: memory.caption, mood: memory.mood || 'celebration', venueId: memory.venueId || undefined, faculty: memory.faculty, tags: memory.tags || [], photoUrl: null })); },
  async cheer(base: string, id: string, token: string): Promise<{ id: string; cheersCount: number }> {
    const result = record(await request(base, `/api/memories/${encodeURIComponent(id)}/cheer`, { voter_token: token }));
    if (typeof result.cheersCount !== 'number') throw new Error('The backend did not confirm the cheer count.');
    return { id: String(result.id), cheersCount: result.cheersCount };
  },
  async leaderboard(base: string): Promise<LeaderboardEntry[]> { const data = await request(base, '/api/leaderboard'); if (!Array.isArray(data)) throw new Error('Invalid leaderboard response.'); return data as LeaderboardEntry[]; },
  async attributes(base: string): Promise<AttributeTally[]> { const data = await request(base, '/api/attributes'); if (!Array.isArray(data)) throw new Error('Invalid study-spot response.'); return data as AttributeTally[]; },
  async vote(base: string, venueId: string, attribute: AttributeId, value: boolean, token: string) { return request(base, '/api/attributes', { venue_id: venueId, attribute, value, voter_token: token }); },
  async lookupMenu(base: string, venueId: string, name: string, url?: string, forceLive = false): Promise<RestaurantMenu> {
    if (url) { const u = new URL(url); if (u.protocol !== 'https:' || !(u.hostname === 'talabat.com' || u.hostname.endsWith('.talabat.com')) || u.username || u.password) throw new Error('Only HTTPS talabat.com menu links are allowed.'); }
    const key = `${base}|${venueId}|${name}|${url || ''}|${forceLive}`;
    const running = menuJobs.get(key); if (running) return running;
    const job = (async () => {
      const data = record(await request(base, '/api/talabat/extract', { venueId, name, ...(url ? { url } : {}), forceLive }, 30000));
      if (!data.success) throw new Error(String(data.error || 'Menu lookup failed.'));
      const source = data.isLiveScraped === false ? 'talabat-cache' : 'live';
      const menu = normalizeMenu(data.menu, source);
      if (!menu?.items.length) throw new Error('The backend returned no usable menu items. Your current menu has not been replaced.');
      return { ...menu, scope: 'brand' as const, checkedAt: new Date().toISOString(), sourceUrl: safeMenuUrl(data.sourceUrl) || menu.sourceUrl };
    })();
    menuJobs.set(key, job);
    try { return await job; } finally { if (menuJobs.get(key) === job) menuJobs.delete(key); }
  },
};

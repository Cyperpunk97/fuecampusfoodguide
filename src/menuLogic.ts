import { normalized, type MenuIssue, type MenuItem, type Menus, type RestaurantMenu, type Venue } from './data';

export const MENU_IMAGE_HOSTS = ['talabat.dhmedia.io', 'images.deliveryhero.io', 'images.talabat.com'];

export function decodeMenuText(value: unknown, max = 1400): string {
  if (typeof value !== 'string') return '';
  const entities: Record<string, string> = { amp: '&', quot: '"', apos: "'", lt: '<', gt: '>', nbsp: ' ' };
  return value.replace(/&(#x[\da-f]+|#\d+|amp|quot|apos|lt|gt|nbsp);/gi, (match, entity: string) => {
    if (entity[0] !== '#') return entities[entity.toLowerCase()] ?? match;
    const number = entity[1].toLowerCase() === 'x' ? parseInt(entity.slice(2), 16) : parseInt(entity.slice(1), 10);
    return number > 0 && number <= 0x10ffff && !(number >= 0xd800 && number <= 0xdfff) ? String.fromCodePoint(number) : '';
  }).replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim().slice(0, max);
}

export function parseDishPrice(value: unknown): number | null {
  if (value === null || value === undefined || typeof value === 'boolean') return null;
  const text = typeof value === 'string' ? decodeMenuText(value).replace(/[٠-٩]/g, d => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d))).replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/٬|,/g, '').replace(/٫/g, '.').replace(/\b(?:EGP|LE|E£)\b|ج\.?م\.?/gi, '').trim() : value;
  if (text === '' || typeof text !== 'string' && typeof text !== 'number') return null;
  const number = Number(text);
  const rounded = Math.round(number * 100) / 100;
  return Number.isFinite(number) && rounded > 0 && number <= 100000 ? rounded : null;
}

export function safeMenuUrl(value: unknown): string | undefined {
  if (typeof value !== 'string' || value.length > 3000) return;
  try {
    const url = new URL(decodeMenuText(value, 3000));
    if (url.protocol !== 'https:' || url.username || url.password || url.port && url.port !== '443') return;
    return url.href;
  } catch { return; }
}

export function normalizeDishImage(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const text = decodeMenuText(value, 3000).replace(/^\/\//, 'https://').replace(/^http:\/\//, 'https://');
  const safe = safeMenuUrl(text);
  if (!safe) return null;
  return MENU_IMAGE_HOSTS.includes(new URL(safe).hostname) ? safe : null;
}

const meat = /\b(chicken|beef|meat|lamb|mutton|veal|steak|turkey|duck|pastrami|bacon|ham|pepperoni|sausage|salami|liver|kofta|kebab|kabab|shawarma|shawerma|tawook|ribs|wings|nuggets?|fish|tuna|salmon|shrimp|prawn|crab|lobster|calamari|seafood|anchovies|pork|gelatin|lard)\b|فراخ|دجاج|لحم|كفتة|كباب|شاورم|سجق|بسطرمة|سمك|جمبري|تونة|بانيه|كبد/i;
export const containsMeat = (text: string) => meat.test(text);
const spice = /\b(spicy|chili|chilli|jalapeno|jalapeño|habanero|sriracha|harissa|shatta|cayenne|tabasco|zinger|volcano)\b|hot sauce|hot wings|حار|حراق|سبايسي|شطة/i;
const vegetarian = /\b(vegetarian|veggie|vegan|falafel|halloumi|hummus|margherita|koshary|kushari)\b|four cheese|greek salad|garden salad|french fries|onion rings|mozzarella sticks|mac & cheese|فلافل|طعمية|حلومي|حمص|كشري|نباتي/i;

export function normalizeMenu(value: unknown, source: RestaurantMenu['source'] = 'custom'): RestaurantMenu | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const raw = value as Record<string, unknown>;
  if (!Array.isArray(raw.items)) return null;
  if (typeof raw.currency === 'string' && raw.currency.trim() && !['EGP', 'LE', 'E£'].includes(raw.currency.trim().toUpperCase())) return null;
  const issueCounts = new Map<string, MenuIssue>();
  const issue = (code: string, detail: string) => { const existing = issueCounts.get(code); issueCounts.set(code, { code, detail, count: (existing?.count || 0) + 1 }); };
  const items: MenuItem[] = [];
  const ids = new Set<string>(); const identities = new Set<string>();
  for (const [index, candidate] of raw.items.slice(0, 2500).entries()) {
    if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) { issue('invalid-item', 'Malformed item removed.'); continue; }
    const it = candidate as Record<string, unknown>;
    const name = decodeMenuText(it.name, 180); const nameAr = decodeMenuText(it.nameAr, 180);
    if (!name && !nameAr) { issue('missing-name', 'Unnamed item removed.'); continue; }
    const description = decodeMenuText(it.description); const category = decodeMenuText(it.category, 160) || 'Menu';
    if (!decodeMenuText(it.category)) issue('missing-category', 'Uncategorized item placed under Menu.');
    const price = parseDishPrice(it.price);
    if (price === null && it.price !== null && it.price !== undefined && it.price !== '') issue('unknown-price', 'Invalid or zero price shown as Ask in store.');
    const identity = `${normalized(name || nameAr)}|${normalized(category)}|${price}|${normalized(description)}`;
    if (identities.has(identity)) { issue('duplicate-item', 'Exact duplicate removed; different sizes and prices retained.'); continue; }
    identities.add(identity);
    let id = decodeMenuText(typeof it.id === 'number' ? String(it.id) : it.id, 200) || `item-${index}-${normalized(name || nameAr).slice(0, 30)}`;
    if (ids.has(id)) { issue('duplicate-id', 'Colliding item ID repaired.'); id = `${id}-${index}`; while (ids.has(id)) id += '-x'; }
    ids.add(id);
    const imageRaw = it.imageUrl || it.image || it.originalImage;
    const imageUrl = normalizeDishImage(imageRaw);
    if (imageRaw && !imageUrl) issue('unsafe-image', 'Invalid or unsupported image URL omitted.');
    const haystack = `${name} ${nameAr} ${description} ${category}`;
    const veto = containsMeat(haystack);
    if (it.isVegetarian === true && veto) issue('dietary-conflict', 'Vegetarian flag removed from an item naming meat or seafood.');
    items.push({ id, name: name || nameAr, nameAr: nameAr || undefined, description, category, price, imageUrl,
      isPopular: it.isPopular === true, isStudentDeal: it.isStudentDeal === true,
      isVegetarian: !veto && (it.isVegetarian === true || vegetarian.test(haystack)),
      isSpicy: it.isSpicy === true || spice.test(haystack) });
  }
  if (raw.items.length > 2500) issue('item-limit', 'Import exceeds the 2500-item safety limit.');
  const sourceDate = typeof raw.lastUpdated === 'string' && Number.isFinite(Date.parse(raw.lastUpdated)) ? raw.lastUpdated : undefined;
  if (sourceDate && Date.parse(sourceDate) > Date.now() + 86400000) issue('future-date', 'Source date is in the future; it does not prove freshness.');
  if (Array.isArray(raw.issues)) for (const saved of raw.issues.slice(0, 30)) {
    if (saved && typeof saved === 'object' && typeof saved.code === 'string' && typeof saved.detail === 'string' && Number.isFinite(saved.count) && saved.count > 0 && !issueCounts.has(saved.code)) {
      issueCounts.set(saved.code, { code: saved.code.slice(0, 80), detail: decodeMenuText(saved.detail, 250), count: Math.min(2500, saved.count) });
    }
  }
  return { restaurantId: decodeMenuText(raw.restaurantId, 200), restaurantName: decodeMenuText(raw.restaurantName || raw.brand, 180),
    brand: decodeMenuText(raw.brand, 180) || undefined, currency: 'EGP', items, categories: Array.from(new Set(items.map(item => item.category))),
    source, scope: raw.scope === 'branch' || raw.scope === 'brand' || raw.scope === 'device' ? raw.scope : source === 'repository' ? 'branch' : source === 'custom' ? 'device' : 'brand',
    originRestaurantName: decodeMenuText(raw.originRestaurantName || raw.restaurantName, 180) || undefined,
    lastUpdated: sourceDate, checkedAt: typeof raw.checkedAt === 'string' ? raw.checkedAt : undefined,
    note: decodeMenuText(raw.note), sourceUrl: safeMenuUrl(raw.sourceUrl), pdfUrl: safeMenuUrl(raw.pdfUrl),
    partial: raw.partial === true, originalItemCount: raw.items.length, issues: Array.from(issueCounts.values()) };
}

const brandAliases: Record<string, string> = {
  tbs: 'tbs', thebakeryshop: 'tbs', tbsthebakeryshop: 'tbs', pasta2go: 'pasta2go', pasta2gocampus: 'pasta2go',
  papajohns: 'papajohns', papajohnspizza: 'papajohns', paul: 'paul', paulbakeryrestaurant: 'paul', paulbakeryandrestaurant: 'paul',
  willys: 'willys', willyskitchen: 'willys', smashburger: 'smashburger', kosharyeltahrir: 'kosharytahrir', kosharytahrir: 'kosharytahrir',
  cinnabonseattlesbest: 'cinnabon', cinnabonandseattlesbest: 'cinnabon', cinnabon: 'cinnabon', buffaloburgerexpress: 'buffaloburger',
  minceburger: 'minceburger', starbuckscoffee: 'starbucks', abushakra: 'aboushakra', bawburgerswings: 'bwburgerswings',
  centralcafeteriagrill: 'centralcafeteria', centralcafeteria: 'centralcafeteria', shaghafcafestudycorner: 'shaghafcafe',
  tabioteaboba: 'tabiotea', tabiotea: 'tabiotea', chilisgrillbar: 'chilis', chilisgrillandbar: 'chilis',
};

export function brandIdentity(value: string): string {
  const base = normalized(value).replace(/\s*[-|]\s*(?:fue|point\s*90|new cairo|90th street|concord|campus).*$/, '').replace(/^talabat[-\s]+/, '').replace(/^(?:p90|fue)[-\s]+/, '').replace(/[^a-z\d\u0600-\u06ff]/g, '');
  return brandAliases[base] || base;
}

export const VENUE_MENU_KEYS: Record<string, string[]> = {
  'fue-cilantro': ['cilantro'], 'fue-costa-campus': ['costa-coffee'], 'fue-buffalo-campus': ['buffalo-burger'],
  'fue-tbs-campus': ['tbs'], 'fue-koshary-campus': ['koshary-tahrir'], 'fue-dunkin-campus': ['dunkin'], 'fue-cinnabon-campus': ['cinnabon'],
  'p90-mcdonalds': ['mcdonalds'], 'p90-kfc': ['kfc'], 'p90-burger-king': ['burger-king'], 'p90-hardees': ['hardees'],
  'p90-pizza-hut': ['pizza-hut'], 'p90-dominos': ['dominos', 'dominos-pizza'], 'p90-papa-johns': ['papa-johns'],
  'p90-starbucks': ['starbucks'], 'p90-costa': ['costa-coffee'], 'p90-caribou': ['caribou-coffee'], 'p90-paul': ['paul'],
  'p90-chilis': ['chilis'], 'p90-fuddruckers': ['fuddruckers'], 'p90-arbys': ['arbys'], 'p90-brioche-doree': ['brioche-doree'],
  'p90-baskin-robbins': ['baskin-robbins'], 'p90-krispy-kreme': ['krispy-kreme'], 'p90-texas-chicken': ['texas-chicken'],
  'p90-caffe-pascucci': ['caffe-pascucci'], 'p90-second-cup': ['second-cup'], 'p90-smash-burger': ['smash-burger', 'smashburger'],
  'p90-heart-attack': ['heart-attack'], 'p90-bazooka': ['bazooka'], 'p90-willys-kitchen': ['willys'], 'p90-mince-burger': ['mince-burger'],
  'p90-zooba': ['zooba'], 'p90-auntie-annes': ['auntie-annes'], 'p90-dipndip': ['dipndip'], 'p90-el-dahan': ['el-dahan'],
  'p90-abou-shakra': ['abou-shakra'], 'p90-manousha': ['manousha-street'],
};

export function findBrandMenu(venue: Venue, cached: Menus): RestaurantMenu | undefined {
  const targets = new Set([brandIdentity(venue.brand), ...(VENUE_MENU_KEYS[venue.id] || []).map(brandIdentity)].filter(Boolean));
  const entries = Object.entries(cached).filter(([, menu]) => {
    if (!menu.items.length) return false;
    const identities = [menu.restaurantName, menu.originRestaurantName, menu.brand].filter((name): name is string => Boolean(name));
    return identities.length > 0 && identities.every(name => targets.has(brandIdentity(name)));
  });
  const explicit = (VENUE_MENU_KEYS[venue.id] || []).map(key => entries.find(([id]) => id === key)).find(Boolean);
  if (explicit) return explicit[1];
  const matches = entries.filter(([key, menu]) => [menu.brand, menu.restaurantName, menu.restaurantId, key].filter(Boolean).some(name => targets.has(brandIdentity(name!))));
  return matches.length === 1 ? matches[0][1] : undefined;
}

export function menuMatchesVenue(menu: RestaurantMenu, venue: Venue): boolean {
  const expected = new Set([brandIdentity(venue.brand), ...(VENUE_MENU_KEYS[venue.id] || []).map(brandIdentity)].filter(Boolean));
  return [menu.brand, menu.originRestaurantName, menu.restaurantName].filter(Boolean).some(name => expected.has(brandIdentity(name!)));
}

export function auditMenu(venue: Venue, menu: RestaurantMenu) {
  const issues = [...(menu.issues || [])];
  const add = (code: string, detail: string, count = 1) => { if (!issues.some(issue => issue.code === code)) issues.push({ code, detail, count }); };
  const priced = menu.items.filter(item => parseDishPrice(item.price) !== null).length;
  const images = menu.items.filter(item => Boolean(normalizeDishImage(item.imageUrl))).length;
  if (!menu.items.length) add('missing-menu', 'No usable source menu is available.');
  if (menu.partial) add('partial-menu', 'Only a bundled offline subset is loaded.');
  if (menu.items.length && !menuMatchesVenue(menu, venue)) add('brand-mismatch', 'Source brand does not match this venue.');
  if (menu.scope === 'brand' && menu.items.length) add('brand-reference', 'Brand menu may be from another branch; confirm local prices.');
  if (menu.items.length && !menu.lastUpdated) add('undated', 'No source update date is available.');
  if (menu.lastUpdated && Date.parse(menu.lastUpdated) > Date.now() + 86400000) add('future-date', 'Source update date is in the future.');
  const duplicateIds = menu.items.length - new Set(menu.items.map(item => item.id)).size;
  if (duplicateIds) add('duplicate-id', 'Duplicate IDs remain in this menu.', duplicateIds);
  const badPrices = menu.items.filter(item => item.price !== null && parseDishPrice(item.price) === null).length;
  if (badPrices) add('invalid-price', 'Invalid price remains in this menu.', badPrices);
  const badDiet = menu.items.filter(item => item.isVegetarian && containsMeat(`${item.name} ${item.nameAr || ''} ${item.description} ${item.category}`)).length;
  if (badDiet) add('dietary-conflict', 'Meat item has a vegetarian flag.', badDiet);
  const categories = new Set(menu.categories);
  const invalidCategories = menu.items.filter(item => !categories.has(item.category)).length;
  if (invalidCategories) add('category-mismatch', 'Item category is not in the category index.', invalidCategories);
  return { venueId: venue.id, name: venue.name, source: menu.source || 'repository', scope: menu.scope || 'branch', items: menu.items.length, priced, images,
    status: !menu.items.length ? 'missing' as const : issues.some(issue => ['brand-mismatch', 'brand-reference', 'invalid-price', 'category-mismatch'].includes(issue.code)) ? 'review' as const : 'available' as const,
    issues, checkedAt: new Date().toISOString() };
}

export function runMenuChecks(): { name: string; passed: boolean }[] {
  const base = (brand: string, id = 'test'): Venue => ({ id, brand, name: brand, category: 'Cafe', kind: 'Cafés', onCampus: false, location: '', lat: 0, lng: 0, approximate: true, logoUrl: null, signature: '', description: '', tags: [], priceMin: 0, priceMax: 0, distance: 0, walk: 0, rating: 0, reviewCount: 0, tier: 1, averagePrice: null, priceReports: 0, topDishes: [], phone: null, menuUrl: null, openingHours: null, openState: 'unknown' });
  const sample = normalizeMenu({ restaurantName: 'Costa Coffee', items: [
    { id: '1', name: ' Latte ', price: '95 EGP', category: 'Coffee' }, { id: '1', name: ' Latte ', price: '95 EGP', category: 'Coffee' },
    { id: '1', name: 'Large Latte', price: 120, category: 'Coffee' }, { name: '', price: 12 },
    { id: '2', name: 'Chicken salad', price: 0, isVegetarian: true, category: 'Salads' },
  ] }, 'talabat-cache')!;
  const cached: Menus = { 'costa-coffee': sample };
  const checks: [string, () => boolean][] = [
    ['EGP price strings', () => parseDishPrice('95 EGP') === 95],
    ['Arabic price digits', () => parseDishPrice('٩٥٫٥٠ ج.م') === 95.5],
    ['No zero-price meals', () => parseDishPrice(0) === null],
    ['Sub-cent prices cannot round to free food', () => parseDishPrice(0.001) === null],
    ['No negative or boolean prices', () => parseDishPrice(-1) === null && parseDishPrice(true) === null],
    ['Foreign currencies are not relabeled EGP', () => normalizeMenu({ currency: 'USD', items: [{ name: 'Coffee', price: 5 }] }) === null],
    ['Currency precision', () => parseDishPrice(337.3999938964844) === 337.4],
    ['Encoded photo URL repair', () => normalizeDishImage('https://talabat.dhmedia.io/image/a.jpg?width=172&amp;height=172')?.includes('&height=172') === true],
    ['Unsafe photo host rejection', () => normalizeDishImage('https://talabat.dhmedia.io.evil.test/a.jpg') === null],
    ['No executable image URLs', () => normalizeDishImage('javascript:alert(1)') === null],
    ['Duplicate dishes removed', () => sample.items.length === 3],
    ['Unique repaired IDs', () => new Set(sample.items.map(item => item.id)).size === sample.items.length],
    ['No vegetarian chicken', () => sample.items.find(item => item.name === 'Chicken salad')?.isVegetarian === false],
    ['Hot chocolate is not automatically spicy', () => normalizeMenu({ items: [{ name: 'Hot Chocolate', price: 60, category: 'Hot drinks' }] })?.items[0].isSpicy === false],
    ['Empty source IDs cannot match everyone', () => findBrandMenu(base('Unknown Cafe'), cached) === undefined],
    ['Exact brand match', () => findBrandMenu(base('Costa Coffee'), cached) === sample],
    ['Branch suffix matches source identity', () => findBrandMenu(base('Fuddruckers', 'p90-fuddruckers'), { fuddruckers: { ...sample, restaurantName: 'Fuddruckers - Point 90 Mall', originRestaurantName: 'Fuddruckers - Point 90 Mall', brand: 'Fuddruckers' } })?.brand === 'Fuddruckers'],
    ['Conflicting source identity is rejected', () => findBrandMenu(base('Fuddruckers', 'p90-fuddruckers'), { fuddruckers: { ...sample, restaurantName: 'Creviano', brand: 'Fuddruckers' } }) === undefined],
    ['No fuzzy unrelated matches', () => findBrandMenu(base('Costa Burger'), cached) === undefined],
    ['Mislabeled cache keys are rejected', () => findBrandMenu(base('Costa Coffee', 'p90-costa'), { 'costa-coffee': { ...sample, restaurantName: 'Starbucks', originRestaurantName: 'Starbucks', brand: 'Starbucks' } }) === undefined],
    ['TBS brand alias', () => brandIdentity('TBS (The Bakery Shop)') === brandIdentity('tbs')],
    ['Branch source suffix', () => brandIdentity('Costa Coffee - FUE Campus') === brandIdentity('Costa Coffee')],
    ['Faculty cafe name variants', () => brandIdentity('Shaghaf Cafe & Study Corner') === brandIdentity('Shaghaf Cafe')],
    ['Campus cafeteria name variants', () => brandIdentity('FUE Central Cafeteria & Grill') === brandIdentity('FUE Central Cafeteria')],
  ];
  return checks.map(([name, check]) => { try { return { name, passed: check() }; } catch { return { name, passed: false }; } });
}
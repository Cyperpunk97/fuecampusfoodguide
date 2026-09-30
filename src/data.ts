export const REPOSITORY = 'https://github.com/Cyperpunk97/CS-FAMILY-STAR';
export const ORIGINAL_REF = 'd8392863f32443974543d50307774a81def72b07';
export const ORIGINAL_RAW = `https://raw.githubusercontent.com/Cyperpunk97/CS-FAMILY-STAR/${ORIGINAL_REF}`;
export const logoAsset = (file: string) => `${ORIGINAL_RAW}/public/logos/${file}`;

export type Category = 'Cafe' | 'Fast Food' | 'Restaurant';
export type Kind = 'Cafés' | 'Fast food' | 'Restaurants' | 'Sweet treats';
export type Venue = {
  id: string; name: string; brand: string; category: Category; kind: Kind; onCampus: boolean;
  location: string; lat: number; lng: number; approximate: boolean;
  logoUrl: string | null; logoWidth?: number; logoHeight?: number;
  signature: string; description: string; tags: string[];
  priceMin: number; priceMax: number; distance: number; walk: number;
  rating: number; reviewCount: number; tier: number;
  averagePrice: number | null; priceReports: number; topDishes: string[];
  phone: string | null; menuUrl: string | null; openingHours: string | null;
  openState: 'open' | 'closed' | 'unknown';
};
export type Review = { id: string; venueId: string; name: string; rating: number; comment: string; spent: number | null; date: string; dish?: string; source?: 'device' | 'community' };
export type MemoryMood = 'celebration' | 'exam_relief' | 'midnight_run' | 'chill_latte' | 'laughing_fit' | 'study_crunch' | 'golden_hour';
export type Memory = { id: string; title: string; caption: string; name: string; venueId: string; venueName?: string; date: string; outingDate?: string; cheers: number; mood?: MemoryMood; faculty?: string; tags?: string[]; demo?: boolean; source?: 'device' | 'community' };
export type MenuItem = { id: string; name: string; nameAr?: string; description: string; price: number | null; category: string; isPopular?: boolean; isStudentDeal?: boolean; isVegetarian?: boolean; isSpicy?: boolean; imageUrl?: string | null };
export type MenuIssue = { code: string; count: number; detail: string };
export type RestaurantMenu = { restaurantId: string; restaurantName: string; currency: string; categories: string[]; items: MenuItem[]; lastUpdated?: string; note?: string; source?: 'repository' | 'talabat-cache' | 'custom' | 'live'; sourceUrl?: string; pdfUrl?: string; brand?: string; scope?: 'branch' | 'brand' | 'device'; originRestaurantName?: string; checkedAt?: string; issues?: MenuIssue[]; originalItemCount?: number; partial?: boolean };
export type Menus = Record<string, RestaurantMenu>;
export type Faculty = { id: string; name: string; nameAr: string; shortName: string; building: string; lat: number; lng: number };
export type AttributeId = 'wifi' | 'power' | 'quiet' | 'seating' | 'aircon' | 'long_stay';
export type AttributeTally = { venueId: string; attribute: AttributeId; yesCount: number; totalCount: number };
export type StudyVotes = Record<string, Partial<Record<AttributeId, boolean>>>;
export type LeaderboardEntry = { userName: string; reviewCount: number; averageRatingGiven: number; lastActive: string; rank: number; badge: string; tier: string };

export const faculties: Faculty[] = [
  { id: 'fcit-cs', name: 'Faculty of Computers & Information Technology', nameAr: 'الحاسبات وتكنولوجيا المعلومات', shortName: 'CS / IT Building', building: 'Building 1 (North-West)', lat: 30.0268, lng: 31.4902 },
  { id: 'engineering', name: 'Faculty of Engineering & Technology', nameAr: 'الهندسة والتكنولوجيا', shortName: 'Engineering', building: 'Building 2 (West Wing)', lat: 30.0254, lng: 31.4897 },
  { id: 'pharmacy', name: 'Faculty of Pharmaceutical Sciences', nameAr: 'العلوم الصيدلية', shortName: 'Pharmacy', building: 'Building 3 (East Wing)', lat: 30.0265, lng: 31.4923 },
  { id: 'dental', name: 'Faculty of Oral & Dental Medicine', nameAr: 'طب الفم والأسنان', shortName: 'Dental Medicine', building: 'Building 4 & Hospital (North)', lat: 30.0273, lng: 31.4915 },
  { id: 'business', name: 'Faculty of Commerce & Business Administration', nameAr: 'التجارة وإدارة الأعمال', shortName: 'Business / Commerce', building: 'Building 5 (South Wing)', lat: 30.0248, lng: 31.4910 },
  { id: 'economics', name: 'Faculty of Economics & Political Science', nameAr: 'الاقتصاد والعلوم السياسية', shortName: 'Economics & Politics', building: 'Building 6 (South-East)', lat: 30.0251, lng: 31.4921 },
  { id: 'campus-center', name: 'Main Campus Center & Plaza', nameAr: 'وسط الحرم الجامعي', shortName: 'Campus Center', building: 'Central Gate & Plaza', lat: 30.0260, lng: 31.4911 },
];
export const studyAttributes: { id: AttributeId; label: string; labelAr: string; question: string }[] = [
  { id: 'wifi', label: 'Wi-Fi', labelAr: 'واي فاي', question: 'Is there usable Wi-Fi?' },
  { id: 'power', label: 'Power outlets', labelAr: 'مقابس كهرباء', question: 'Are there power outlets you can reach?' },
  { id: 'quiet', label: 'Quiet enough to work', labelAr: 'هادئ للمذاكرة', question: 'Quiet enough to concentrate?' },
  { id: 'seating', label: 'Comfortable seating', labelAr: 'جلسة مريحة', question: 'Somewhere you could sit for hours?' },
  { id: 'aircon', label: 'Air conditioning', labelAr: 'تكييف', question: 'Is it air conditioned?' },
  { id: 'long_stay', label: 'No rush to leave', labelAr: 'تقدر تقعد براحتك', question: 'Can you stay without being moved on?' },
];
export const moods: { id: MemoryMood; label: string; labelAr: string; emoji: string }[] = [
  { id: 'celebration', label: 'Celebration', labelAr: 'احتفال', emoji: '🎉' },
  { id: 'exam_relief', label: 'Post-exam relief', labelAr: 'راحة بعد الامتحان', emoji: '☕' },
  { id: 'midnight_run', label: 'Midnight run', labelAr: 'خروجة بالليل', emoji: '🌙' },
  { id: 'chill_latte', label: 'Chill & chat', labelAr: 'قعدة ودردشة', emoji: '🧋' },
  { id: 'laughing_fit', label: 'Unstoppable laughs', labelAr: 'ضحك من القلب', emoji: '😂' },
  { id: 'study_crunch', label: 'Study hangout', labelAr: 'قعدة مذاكرة', emoji: '📚' },
  { id: 'golden_hour', label: 'Golden hour', labelAr: 'الساعة الذهبية', emoji: '🌅' },
];

// These filenames are exclusively the assets referenced by the original lib/venues.ts.
const logoFiles: Record<string, string> = {
  'fue-cilantro': 'cilantro.png', 'fue-uncle-tonny': 'uncle-tonny.svg', 'fue-pasta2go': 'pasta-2go.svg',
  'fue-tbs-campus': 'tbs.png', 'fue-costa-campus': 'costa-coffee.png', 'fue-buffalo-campus': 'buffalo-burger.svg',
  'fue-cinnabon-campus': 'cinnabon.png', 'fue-koshary-campus': 'koshary-el-tahrir.jpg', 'fue-dunkin-campus': 'dunkin.png',
  'fue-central-cafeteria': 'fue-logo.png', 'fue-sugo': 'sugo.svg', 'fue-bw-burger': 'bw-burger.svg', 'fue-coffeeshop-company': 'coffeeshop-company.png',
  'p90-mcdonalds': 'mcdonalds.png', 'p90-kfc': 'kfc.svg', 'p90-burger-king': 'burger-king.png', 'p90-hardees': 'hardees.png',
  'p90-pizza-hut': 'pizza-hut.png', 'p90-dominos': 'dominos-pizza.png', 'p90-papa-johns': 'papa-johns-pizza.png',
  'p90-starbucks': 'starbucks.svg', 'p90-costa': 'costa-coffee.png', 'p90-caribou': 'caribou-coffee.png', 'p90-paul': 'paul-bakery-restaurant.png',
  'p90-chilis': 'chilis.png', 'p90-fuddruckers': 'fuddruckers.png', 'p90-arbys': 'arbys.png', 'p90-brioche-doree': 'brioche-doree.jpg',
  'p90-baskin-robbins': 'baskin-robbins.png', 'p90-krispy-kreme': 'krispy-kreme.png', 'p90-texas-chicken': 'texas-chicken.png',
  'p90-caffe-pascucci': 'caffe-pascucci.png', 'p90-second-cup': 'second-cup.webp', 'p90-smash-burger': 'smash-burger.jpg',
  'p90-heart-attack': 'heart-attack.svg', 'p90-bazooka': 'bazooka.png', 'p90-willys-kitchen': 'willys-kitchen.svg',
  'p90-mince-burger': 'mince-burger.svg', 'p90-zooba': 'zooba.svg', 'p90-auntie-annes': 'auntie-annes.png',
  'p90-dipndip': 'dipndip.png', 'p90-el-dahan': 'el-dahan.png', 'p90-abou-shakra': 'abou-shakra.jpg', 'p90-manousha': 'manousha-street.svg',
};
type Entry = [string, string, Category, boolean, number, number, number, string?];
const catalog: Entry[] = [
  ['fue-cilantro', 'Cilantro', 'Cafe', true, 30.0260, 31.4911, 1, 'FUE Campus Food Court, Main Building'],
  ['fue-uncle-tonny', 'Uncle Tonny', 'Fast Food', true, 30.0261, 31.4912, 1, 'FUE Campus Food Court, Main Plaza'],
  ['fue-vivo', 'Vivo', 'Restaurant', true, 30.0260, 31.4914, 1],
  ['fue-tbs-campus', 'TBS (The Bakery Shop)', 'Cafe', false, 30.0259, 31.4915, 1, 'FUE Engineering Building Plaza'],
  ['fue-pasta2go', 'Pasta 2Go', 'Fast Food', true, 30.0262, 31.4913, 1],
  ['fue-seven-days', 'Seven Days Cafe', 'Cafe', true, 30.0261, 31.4908, 1, 'FUE Campus Courtyard'],
  ['fue-costa-campus', 'Costa Coffee - FUE Campus', 'Cafe', true, 30.0262, 31.4915, 2],
  ['fue-buffalo-campus', 'Buffalo Burger Express', 'Fast Food', false, 30.0261, 31.4914, 2],
  ['fue-saladero', 'Saladero', 'Restaurant', true, 30.0261, 31.4910, 1],
  ['fue-juice-me-up', 'Juice Me Up', 'Cafe', true, 30.0259, 31.4909, 1],
  ['fue-bouza-roll', 'Bouza Roll', 'Cafe', true, 30.0262, 31.4916, 1],
  ['fue-cinnabon-campus', "Cinnabon & Seattle's Best", 'Cafe', false, 30.0263, 31.4910, 1],
  ['fue-koshary-campus', 'Koshary El Tahrir', 'Restaurant', false, 30.0258, 31.4912, 1],
  ['fue-dunkin-campus', "Dunkin'", 'Cafe', false, 30.0257, 31.4905, 1],
  ['fue-central-cafeteria', 'FUE Central Cafeteria & Grill', 'Restaurant', false, 30.0260, 31.4907, 1],
  ['fue-container-campus', 'Container Cafe', 'Cafe', false, 30.0265, 31.4920, 1],
  ['fue-tabio-campus', 'TABiO Tea & Boba', 'Cafe', false, 30.0263, 31.4918, 1],
  ['fue-sugo', 'Sugo (سوجو)', 'Restaurant', false, 30.0261, 31.4912, 1],
  ['fue-bw-burger', 'B&W (Burgers & Wings)', 'Fast Food', false, 30.0262, 31.4915, 2],
  ['fue-bimbo', 'Bimbo', 'Cafe', false, 30.0261, 31.4916, 1],
  ['fue-shaghaf-campus', 'Shaghaf Cafe & Study Corner', 'Cafe', false, 30.0258, 31.4901, 1],
  ['fue-coffeeshop-company', 'Coffeeshop Company', 'Cafe', false, 30.0260, 31.4898, 2],
  ['p90-mcdonalds', "McDonald's - Point 90 Mall", 'Fast Food', false, 30.0185, 31.4988, 1],
  ['p90-kfc', 'KFC - Point 90 Mall', 'Fast Food', false, 30.0187, 31.4990, 1],
  ['p90-burger-king', 'Burger King - Point 90 Mall', 'Fast Food', false, 30.0189, 31.4986, 1],
  ['p90-hardees', "Hardee's - Point 90 Mall", 'Fast Food', false, 30.0191, 31.4984, 1],
  ['p90-pizza-hut', 'Pizza Hut - Point 90 Mall', 'Fast Food', false, 30.0184, 31.4992, 1],
  ['p90-dominos', "Domino's Pizza - Point 90 Mall", 'Fast Food', false, 30.0186, 31.4995, 1],
  ['p90-papa-johns', "Papa John's Pizza - Point 90 Mall", 'Fast Food', false, 30.0188, 31.4997, 1],
  ['p90-starbucks', 'Starbucks - Point 90 Mall', 'Cafe', false, 30.0183, 31.4985, 2],
  ['p90-costa', 'Costa Coffee - Point 90 Mall', 'Cafe', false, 30.0182, 31.4987, 2],
  ['p90-caribou', 'Caribou Coffee - Point 90 Mall', 'Cafe', false, 30.0181, 31.4989, 2],
  ['p90-paul', 'Paul Bakery & Restaurant - Point 90', 'Restaurant', false, 30.0180, 31.4983, 3],
  ['p90-chilis', "Chili's Grill & Bar - Point 90", 'Restaurant', false, 30.0189, 31.4999, 2],
  ['p90-fuddruckers', 'Fuddruckers - Point 90 Mall', 'Restaurant', false, 30.0192, 31.4998, 2],
  ['p90-arbys', "Arby's - Point 90 Mall", 'Fast Food', false, 30.0190, 31.4982, 2],
  ['p90-brioche-doree', 'Brioche Dorée - Point 90', 'Cafe', false, 30.0184, 31.4981, 2],
  ['p90-baskin-robbins', 'Baskin Robbins - Point 90', 'Cafe', false, 30.0186, 31.4996, 1],
  ['p90-krispy-kreme', 'Krispy Kreme - Point 90 Mall', 'Cafe', false, 30.0185, 31.4980, 1],
  ['p90-texas-chicken', 'Texas Chicken - Point 90 Mall', 'Fast Food', false, 30.0187, 31.4981, 1],
  ['p90-caffe-pascucci', 'Caffè Pascucci - Point 90', 'Cafe', false, 30.0183, 31.4977, 2],
  ['p90-second-cup', 'Second Cup - Point 90', 'Cafe', false, 30.0182, 31.4978, 2],
  ['p90-smash-burger', 'Smashburger - Point 90 Mall', 'Fast Food', false, 30.0189, 31.4976, 2],
  ['p90-heart-attack', 'Heart Attack - New Cairo Plaza', 'Fast Food', false, 30.0205, 31.4950, 2],
  ['p90-bazooka', 'Bazooka Fried Chicken - 90th Street', 'Fast Food', false, 30.0210, 31.4942, 2],
  ['p90-willys-kitchen', "Willy's Kitchen - Point 90 Area", 'Fast Food', false, 30.0195, 31.4965, 2],
  ['p90-mince-burger', 'Mince Burger - Point 90', 'Restaurant', false, 30.0184, 31.4984, 2],
  ['p90-zooba', 'Zooba - New Cairo', 'Restaurant', false, 30.0215, 31.4930, 2],
  ['p90-auntie-annes', "Auntie Anne's - Point 90 Mall", 'Cafe', false, 30.0187, 31.4991, 1],
  ['p90-dipndip', 'Dipndip - Point 90 Mall', 'Cafe', false, 30.0185, 31.4988, 2],
  ['p90-el-dahan', 'El Dahan Grills - New Cairo', 'Restaurant', false, 30.0220, 31.4925, 3],
  ['p90-abou-shakra', 'Abou Shakra - Concord Plaza', 'Restaurant', false, 30.0242, 31.4775, 2],
  ['p90-manousha', "Man'ousha Street - Point 90", 'Fast Food', false, 30.0190, 31.4970, 1],
];
const signatures: Record<string, string> = {
  'fue-cilantro': 'Iced Spanish Latte & Emmental Croissant', 'fue-uncle-tonny': 'Double Smashed Burger & Crispy Tender Wrap',
  'fue-vivo': 'Neapolitan Margherita Pizza & Chicken Alfredo Penne', 'fue-pasta2go': 'Crispy Chicken Alfredo Pasta',
  'fue-seven-days': 'Iced Caramel Macchiato & Student Toastie', 'fue-tbs-campus': 'Almond Butter Croissant & Halloumi Focaccia',
  'fue-saladero': 'Grilled Chicken Caesar Bowl & Mexican Quinoa Salad', 'fue-juice-me-up': 'Mango Passion Smoothie & Fresh Pomegranate Booster',
  'fue-bouza-roll': 'Lotus Biscoff Rolled Ice Cream & Nutella Strawberry Roll', 'fue-buffalo-campus': 'Shiitake Mushroom Burger & Cheesy Fries',
  'fue-costa-campus': 'Iced Flat White & Chocolate Muffin', 'fue-cinnabon-campus': 'Caramel Pecanbon Roll & Minibon',
  'fue-koshary-campus': 'Tahrir Mega Box with Garlic Da’ah', 'fue-dunkin-campus': 'Boston Kreme Donut & Iced Caramel Coffee',
  'fue-central-cafeteria': 'Grilled Shish Tawook Plate Meal', 'fue-tabio-campus': 'Brown Sugar Tiger Milk Boba',
};

export function haversine(a: {lat: number; lng: number}, b: {lat: number; lng: number}) {
  const r = Math.PI / 180; const h = Math.sin((b.lat - a.lat) * r / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin((b.lng - a.lng) * r / 2) ** 2;
  return Math.round(6371000 * 2 * Math.asin(Math.sqrt(Math.min(1, h))));
}
export function normalized(input: string) {
  return input.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f\u064b-\u0652\u0670\u0640]/g, '').replace(/[أإآٱ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/[’'`]/g, '').trim();
}
export function makeVenue(entry: Record<string, unknown>): Venue {
  const id = String(entry.id); const name = String(entry.name || id); const category = (entry.category || 'Cafe') as Category;
  const sweet = /cinnabon|bouza|bimbo|baskin|krispy|dipndip|auntie/.test(id);
  const tier = Number(entry.priceTier || entry.tier || 1);
  const ranges: Record<number, [number, number]> = { 1: [40, 100], 2: [120, 250], 3: [300, 600] };
  const [priceMin, priceMax] = ranges[tier] || ranges[1];
  const lat = Number(entry.lat); const lng = Number(entry.lng); const distance = haversine(faculties[6], { lat, lng });
  const authoredLogo = typeof entry.logoUrl === 'string' && /^\/logos\/[a-z\d-]+\.(svg|png|jpe?g|webp)$/.test(entry.logoUrl) ? logoAsset(entry.logoUrl.split('/').pop()!) : null;
  return {
    id, name, brand: String(entry.brand || name.split(' - ')[0]), category, tier,
    kind: sweet ? 'Sweet treats' : category === 'Cafe' ? 'Cafés' : category === 'Fast Food' ? 'Fast food' : 'Restaurants',
    onCampus: Boolean(entry.isOnCampus), lat, lng, distance, walk: Math.max(1, Math.round(distance / 83)),
    approximate: entry.coordSource !== 'osm', location: String(entry.vicinity || (id.startsWith('p90-') ? 'Point 90 Mall, New Cairo' : 'FUE Campus Food Court')),
    logoUrl: authoredLogo || (logoFiles[id] ? logoAsset(logoFiles[id]) : null),
    logoWidth: Number(entry.logoWidth) || undefined, logoHeight: Number(entry.logoHeight) || undefined,
    signature: String(entry.signatureDish || signatures[id] || ''), description: '', tags: [],
    priceMin, priceMax, rating: 0, reviewCount: 0, averagePrice: null, priceReports: 0, topDishes: [],
    phone: typeof entry.phone === 'string' ? entry.phone : null,
    menuUrl: typeof entry.menuUrl === 'string' && /^https:\/\//.test(entry.menuUrl) ? entry.menuUrl : null,
    openingHours: typeof entry.openingHours === 'string' ? entry.openingHours : null, openState: 'unknown',
  };
}
export const venues: Venue[] = catalog.map(([id, name, category, isOnCampus, lat, lng, priceTier, vicinity]) => makeVenue({ id, name, category, isOnCampus, lat, lng, priceTier, vicinity, coordSource: id.startsWith('p90-') ? 'approx' : 'osm' }));

export function venueStats(v: Venue, reviews: Review[]): Venue {
  const local = reviews.filter(r => r.venueId === v.id && r.source !== 'community');
  if (!local.length) return v;
  const prices = local.filter(r => r.spent !== null && r.spent > 0);
  const ratingCount = v.reviewCount + local.length;
  const priceCount = v.priceReports + prices.length;
  const dishes = local.map(r => r.dish?.trim()).filter((x): x is string => Boolean(x));
  return { ...v, rating: (v.rating * v.reviewCount + local.reduce((s, r) => s + r.rating, 0)) / ratingCount, reviewCount: ratingCount,
    averagePrice: priceCount ? ((v.averagePrice || 0) * v.priceReports + prices.reduce((s, r) => s + (r.spent || 0), 0)) / priceCount : null,
    priceReports: priceCount, topDishes: Array.from(new Set([...dishes, ...v.topDishes])) };
}
export const effectivePrice = (v: Venue) => v.averagePrice ?? ((v.priceMin + v.priceMax) / 2);
export function distanceLabel(v: Venue) {
  const d = v.distance;
  if (d < 60 && !v.approximate) return 'On campus';
  return `${v.approximate ? '~' : ''}${d >= 1000 ? `${(d / 1000).toFixed(1)} km` : `${Math.max(10, Math.round(d / (v.approximate ? d < 500 ? 25 : 50 : 10)) * (v.approximate ? d < 500 ? 25 : 50 : 10))} m`}`;
}
export function directionsUrl(v: Venue, origin?: {lat: number; lng: number}) {
  const destination = v.approximate ? encodeURIComponent(`${v.name}, ${v.location}`) : `${v.lat},${v.lng}`;
  return `https://www.google.com/maps/dir/?api=1&destination=${destination}${origin ? `&origin=${origin.lat},${origin.lng}` : ''}&travelmode=walking`;
}
export function mapsUrl(v: Venue) { return `https://www.google.com/maps/search/?api=1&query=${v.approximate ? encodeURIComponent(`${v.name}, ${v.location}`) : `${v.lat},${v.lng}`}`; }
export function mapEmbed(v?: Venue) {
  const lat = v?.lat ?? 30.026; const lng = v?.lng ?? 31.4911; const pad = v ? .004 : .012;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${lng-pad}%2C${lat-pad/2}%2C${lng+pad}%2C${lat+pad/2}&layer=mapnik${v && !v.approximate ? `&marker=${lat}%2C${lng}` : ''}`;
}

// A small, authentic offline subset. The loader imports ALL original menus and cached Talabat items.
export const fallbackMenus: Menus = {
  'fue-cilantro': { restaurantId: 'fue-cilantro', restaurantName: 'Cilantro - FUE Campus', currency: 'EGP', source: 'repository', lastUpdated: '2026-09-14', categories: ['Hot Drinks', 'Iced & Cold Drinks', 'Sandwiches & Wraps', 'Bakery & Desserts'], note: 'Original repository menu. Student ID discount applicable on select beverages.', items: [
    { id: 'cil-1', name: 'Iced Spanish Latte', nameAr: 'سبانيش لاتيه مثلج', description: 'Rich espresso with condensed milk and chilled fresh milk over ice', price: 95, category: 'Iced & Cold Drinks', isPopular: true, isStudentDeal: true },
    { id: 'cil-2', name: 'Caramel Macchiato', nameAr: 'كاراميل ماكياتو', description: 'Steamed milk, vanilla, espresso and caramel drizzle', price: 90, category: 'Hot Drinks', isPopular: true },
    { id: 'cil-3', name: 'Smoked Turkey & Emmental Croissant', nameAr: 'كرواسون ديك رومي وجبنة إيمنتال', description: 'Butter croissant filled with smoked turkey and melted French cheese', price: 85, category: 'Sandwiches & Wraps', isPopular: true },
    { id: 'cil-4', name: 'Halloumi & Pesto Panini', nameAr: 'بانيني حلوم بالبيستو', description: 'Grilled halloumi, basil pesto and sun-dried tomatoes on ciabatta', price: 110, category: 'Sandwiches & Wraps', isVegetarian: true },
    { id: 'cil-5', name: 'Double Espresso', nameAr: 'دوبل إسبريسو', description: 'Double shot of premium Arabica espresso', price: 55, category: 'Hot Drinks' },
    { id: 'cil-6', name: 'Iced Matcha Green Tea Latte', nameAr: 'ماتشا لاتيه مثلج', description: 'Matcha lightly sweetened and shaken with milk', price: 115, category: 'Iced & Cold Drinks' },
    { id: 'cil-7', name: 'Nutella Brownie Slice', nameAr: 'براوني بالنوتيلا', description: 'Fudge brownie, chocolate chips and hazelnut cream', price: 70, category: 'Bakery & Desserts' },
  ] },
  'fue-uncle-tonny': { restaurantId: 'fue-uncle-tonny', restaurantName: 'Uncle Tonny', currency: 'EGP', source: 'repository', lastUpdated: '2026-09-14', categories: ['Burgers & Smash', 'Crispy Chicken & Strips', 'Loaded Fries & Appetizers', 'Combos & Drinks'], items: [
    { id: 'tonny-1', name: 'Uncle Tonny Double Smash Burger', nameAr: 'أونكل توني دوبل سماش برجر', description: 'Two smashed beef patties, cheese, pickles, caramelized onions and Tonny sauce', price: 140, category: 'Burgers & Smash', isPopular: true },
    { id: 'tonny-2', name: 'Classic Cheeseburger', nameAr: 'كلاسيك تشيز برجر', description: 'Single smashed beef patty with melted cheese', price: 105, category: 'Burgers & Smash' },
    { id: 'tonny-3', name: 'Crispy Chicken Tender Wrap', nameAr: 'راب تشيكن ستربس مقرمشة', description: 'Chicken tenders, lettuce, cheddar and honey mustard', price: 95, category: 'Crispy Chicken & Strips', isPopular: true, isStudentDeal: true },
    { id: 'tonny-4', name: 'Crispy Tenders Meal (3 Pcs + Fries + Dip)', nameAr: 'وجبة كرسبي تندرز', description: 'Hand-breaded tenders, fries, coleslaw and dip', price: 120, category: 'Crispy Chicken & Strips', isPopular: true, isStudentDeal: true },
    { id: 'tonny-5', name: 'Tonny Cheesy Volcano Fries', nameAr: 'بطاطس تشيزي بركان أونكل توني', description: 'Seasoned fries, cheddar cheese sauce and jalapeños', price: 65, category: 'Loaded Fries & Appetizers', isVegetarian: true },
    { id: 'tonny-6', name: 'Onion Rings with Ranch Dip', nameAr: 'حلقات بصل مقرمشة مع صوص رانش', description: 'Battered onion rings with house-made ranch', price: 45, category: 'Loaded Fries & Appetizers', isVegetarian: true },
    { id: 'tonny-7', name: 'Fresh Lemon Mint Juice', nameAr: 'ليمون بالنعناع فريش', description: 'Squeezed lemon and garden mint', price: 40, category: 'Combos & Drinks' },
  ] },
  'fue-vivo': { restaurantId: 'fue-vivo', restaurantName: 'Vivo', currency: 'EGP', source: 'repository', categories: ['Pizza', 'Pasta & Risotto', 'Paninis & Starters', 'Desserts & Beverages'], items: [
    { id: 'vivo-1', name: 'Pizza Margherita', nameAr: 'بيتزا مارجريتا نابوليتان', description: 'Tomato sauce, fresh mozzarella, basil and olive oil', price: 95, category: 'Pizza', isPopular: true, isVegetarian: true },
    { id: 'vivo-2', name: 'Pizza Pepperoni & Hot Honey', nameAr: 'بيتزا ببروني مع عسل حار', description: 'Beef pepperoni, mozzarella, oregano and chili honey', price: 130, category: 'Pizza', isPopular: true },
    { id: 'vivo-3', name: 'Chicken Alfredo Fettuccine', nameAr: 'فيتوتشيني تشيكن ألفريدو', description: 'Grilled chicken in creamy Parmesan mushroom sauce', price: 115, category: 'Pasta & Risotto', isPopular: true, isStudentDeal: true },
    { id: 'vivo-4', name: 'Penne all’Arrabbiata', nameAr: 'بيني أرابياتا حارة بالريحان', description: 'Spicy garlic tomato sauce and basil', price: 85, category: 'Pasta & Risotto', isVegetarian: true },
    { id: 'vivo-5', name: 'Smoked Turkey & Mozzarella Panini', nameAr: 'بانيني تركي مدخن وموزاريلا', description: 'Turkey, mozzarella, arugula and pesto mayo', price: 85, category: 'Paninis & Starters', isStudentDeal: true },
    { id: 'vivo-6', name: 'Cheesy Garlic Bread', nameAr: 'خبز الثوم بالجبنة الذائبة', description: 'Baguette with garlic butter and mozzarella', price: 50, category: 'Paninis & Starters', isVegetarian: true },
    { id: 'vivo-7', name: 'Nutella Calzone Dessert', nameAr: 'كالزوني نوتيلا محشي شوكولاتة', description: 'Warm folded pizza dough with Nutella', price: 65, category: 'Desserts & Beverages', isVegetarian: true },
  ] },
  'fue-pasta2go': { restaurantId: 'fue-pasta2go', restaurantName: 'Pasta 2Go', currency: 'EGP', source: 'repository', categories: ['Signature Pastas', 'Appetizers & Sides', 'Beverages'], items: [
    { id: 'p2g-1', name: 'Crispy Chicken Alfredo Penne', nameAr: 'بيني ألفريدو دجاج مقرمش', description: 'Parmesan garlic sauce and fried chicken tenders', price: 135, category: 'Signature Pastas', isPopular: true, isStudentDeal: true },
    { id: 'p2g-2', name: 'Pink Sauce Funghi Chicken', nameAr: 'باستا بينك صوص مشروم ودجاج', description: 'Marinara and cream sauce, mushrooms and chicken', price: 140, category: 'Signature Pastas', isPopular: true },
    { id: 'p2g-3', name: 'Spicy Arrabiata Pasta', nameAr: 'باستا أرابياتا حارة', description: 'Tomato basil sauce, olives and chili flakes', price: 85, category: 'Signature Pastas', isVegetarian: true, isSpicy: true },
    { id: 'p2g-4', name: 'Four Cheese Mac & Cheese', nameAr: 'ماك أند تشيز 4 أجبان', description: 'Cheddar, mozzarella, gouda and Parmesan', price: 120, category: 'Signature Pastas', isPopular: true },
    { id: 'p2g-5', name: 'Mozzarella Cheese Sticks (4 pcs)', nameAr: 'أصابع جبنة موتزاريلا', description: 'Breaded sticks with marinara sauce', price: 65, category: 'Appetizers & Sides' },
    { id: 'p2g-6', name: 'Cheesy Garlic Bread', nameAr: 'خبز بالثوم والجبنة', description: 'Baguette with garlic herb butter and mozzarella', price: 50, category: 'Appetizers & Sides', isVegetarian: true },
    { id: 'p2g-7', name: 'Soft Drink (Can)', nameAr: 'مشروب غازي', description: 'Pepsi, 7Up or Mirinda', price: 25, category: 'Beverages' },
  ] },
};

export const initialMemories: Memory[] = [{
  id: 'original-mem-1', title: 'After class, over dessert', venueId: '', venueName: 'Campus food court',
  name: 'A group of classmates', faculty: 'Faculty of Computers & Information Technology', date: '2026-09-08T18:00:00', outingDate: '2026-09-08',
  caption: 'After a long day of lectures, we grabbed a quick bite between classes. We shared dessert, compared notes on the week, and picked a new place to try next time.',
  mood: 'chill_latte', cheers: 4, tags: ['After class', 'Friends', 'Campus'], demo: true,
}];

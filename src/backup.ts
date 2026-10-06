import { normalizeMenu } from './menuLogic';
import type { Language } from './i18n';
import type { AttributeId, Memory, Menus, Review, StudyVotes } from './data';
import type { MenuPreference } from './original';

const MAX_LIST = 500;
const MAX_TEXT = 1000;
const blockedKeys = new Set(['__proto__', 'prototype', 'constructor']);

type UnknownRecord = Record<string, unknown>;
export type RestoredBackup = {
  favorites: string[];
  reviews: Review[];
  memories: Memory[];
  cheers: string[];
  menuOverrides: Menus;
  menuPreferences: Record<string, MenuPreference>;
  votes: StudyVotes;
  profile: { name: string; faculty: string };
  facultyId: string;
  language: Language;
  foodTools: unknown;
};

const record = (value: unknown): UnknownRecord => value && typeof value === 'object' && !Array.isArray(value) ? value as UnknownRecord : {};
const text = (value: unknown, max = MAX_TEXT) => typeof value === 'string' ? value.trim().slice(0, max) : '';
const id = (value: unknown) => { const candidate = text(value, 120); return /^[a-zA-Z0-9_.:-]{1,120}$/.test(candidate) && !blockedKeys.has(candidate) ? candidate : ''; };
const list = (value: unknown, limit = MAX_LIST) => Array.isArray(value) ? value.slice(0, limit) : [];

function stringList(value: unknown, limit = MAX_LIST) {
  return Array.from(new Set(list(value, limit).map(item => text(item, 160)).filter(item => Boolean(item) && !blockedKeys.has(item))));
}

function review(value: unknown): Review | null {
  const row = record(value); const venueId = id(row.venueId); const reviewId = id(row.id); const name = text(row.name, 60);
  const rating = Number(row.rating); const date = text(row.date, 40);
  if (!venueId || !reviewId || !name || !Number.isFinite(rating) || rating < 1 || rating > 5 || !date) return null;
  const spent = row.spent === null || row.spent === undefined ? null : Number(row.spent);
  return { id: reviewId, venueId, name, rating: Math.round(rating * 2) / 2, comment: text(row.comment), spent: typeof spent === 'number' && Number.isFinite(spent) && spent > 0 && spent <= 100000 ? spent : null,
    date, dish: text(row.dish, 160) || undefined, source: row.source === 'community' ? 'community' : 'device' };
}

function memory(value: unknown): Memory | null {
  const row = record(value); const memoryId = id(row.id); const title = text(row.title, 100); const name = text(row.name, 60); const caption = text(row.caption, 1000); const date = text(row.date, 40);
  if (!memoryId || !title || !name || !caption || !date) return null;
  const cheers = Math.max(0, Math.min(100000, Math.floor(Number(row.cheers) || 0)));
  return { id: memoryId, title, caption, name, venueId: id(row.venueId), venueName: text(row.venueName, 120) || undefined, date,
    outingDate: text(row.outingDate, 20) || undefined, faculty: text(row.faculty, 120) || undefined,
    mood: ['celebration', 'exam_relief', 'midnight_run', 'chill_latte', 'laughing_fit', 'study_crunch', 'golden_hour'].includes(text(row.mood, 30)) ? text(row.mood, 30) as Memory['mood'] : undefined,
    tags: stringList(row.tags, 6).map(tag => tag.slice(0, 30)), cheers, source: row.source === 'community' ? 'community' : 'device' };
}

function menus(value: unknown): Menus {
  const result: Menus = {};
  for (const [venueId, raw] of Object.entries(record(value)).slice(0, 150)) {
    if (!id(venueId) || blockedKeys.has(venueId)) continue;
    const source = record(raw).source;
    const menu = normalizeMenu(raw, source === 'live' || source === 'talabat-cache' || source === 'custom' ? source : 'custom');
    if (menu) result[venueId] = { ...menu, restaurantId: venueId };
  }
  return result;
}

function preferences(value: unknown): Record<string, MenuPreference> {
  const result: Record<string, MenuPreference> = {};
  for (const [venueId, preference] of Object.entries(record(value)).slice(0, 150)) if (id(venueId) && (preference === 'repository' || preference === 'talabat')) result[venueId] = preference;
  return result;
}

function votes(value: unknown): StudyVotes {
  const result: StudyVotes = {}; const attributes: AttributeId[] = ['wifi', 'power', 'quiet', 'seating', 'aircon', 'long_stay'];
  for (const [venueId, raw] of Object.entries(record(value)).slice(0, 150)) {
    if (!id(venueId)) continue;
    const entry = record(raw); const vote: StudyVotes[string] = {};
    for (const attribute of attributes) if (typeof entry[attribute] === 'boolean') vote[attribute] = entry[attribute] as boolean;
    if (Object.keys(vote).length) result[venueId] = vote;
  }
  return result;
}

/** Parse a portable, local-only backup without trusting its shape. */
export function parseDeviceBackup(raw: string): RestoredBackup {
  if (raw.length > 5_000_000) throw new Error('This backup is too large to import safely.');
  let parsed: unknown;
  try { parsed = JSON.parse(raw); } catch { throw new Error('That file is not valid JSON.'); }
  const data = record(parsed); const version = Number(data.version);
  if (!Number.isFinite(version) || version < 1 || version > 4) throw new Error('This backup version is not supported.');
  const profileData = record(data.profile);
  const restored: RestoredBackup = {
    favorites: stringList(data.favorites, 300),
    reviews: list(data.reviews, MAX_LIST).map(review).filter((item): item is Review => Boolean(item)),
    memories: list(data.memories, MAX_LIST).map(memory).filter((item): item is Memory => Boolean(item)),
    cheers: stringList(data.cheers, MAX_LIST),
    menuOverrides: menus(data.menuOverrides),
    menuPreferences: preferences(data.menuPreferences),
    votes: votes(data.votes),
    profile: { name: text(profileData.name, 60) || 'Campus foodie', faculty: text(profileData.faculty, 120) },
    facultyId: id(data.facultyId) || 'campus-center',
    language: data.language === 'ar' ? 'ar' : 'en',
    foodTools: { saved: data.savedDishes, plan: data.mealPlan, budget: data.mealBudget, reports: data.menuReports },
  };
  return restored;
}

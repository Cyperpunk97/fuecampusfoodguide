const PREFIX = 'csfs:v1';

export class CommunityError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

export function send(res, status, payload) {
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(payload));
}

function configuredOrigins() {
  return (process.env.COMMUNITY_ALLOWED_ORIGINS || '')
    .split(',').map(value => value.trim()).filter(Boolean);
}

/** Permit same-origin requests by default; mobile or separate web clients must be explicit. */
export function applyCors(req, res) {
  const origin = req.headers.origin;
  if (!origin) return false;
  const host = String(req.headers.host || '');
  const sameOrigin = origin === `https://${host}` || origin === `http://${host}`;
  const allowed = sameOrigin || configuredOrigins().includes(origin);
  if (!allowed) throw new CommunityError(403, 'This origin is not allowed to use the community API.');
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  return req.method === 'OPTIONS';
}

export function communityHandler(methods, action) {
  return async (req, res) => {
    try {
      if (applyCors(req, res)) return send(res, 204, {});
      if (!methods.includes(req.method || 'GET')) throw new CommunityError(405, 'Method not allowed.');
      await action(req, res);
    } catch (error) {
      const status = error instanceof CommunityError ? error.status : 500;
      const message = error instanceof CommunityError ? error.message : 'The community service could not complete that request.';
      send(res, status, { error: message });
    }
  };
}

function kvConfig() {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) throw new CommunityError(503, 'Community storage is not configured yet. Add Vercel KV environment variables, then redeploy.');
  return { url: url.replace(/\/$/, ''), token };
}

/** Minimal Vercel KV REST client: avoids adding a browser/server dependency. */
export async function kv(command, ...args) {
  const { url, token } = kvConfig();
  const path = [command, ...args.map(value => encodeURIComponent(String(value)))].join('/');
  const response = await fetch(`${url}/${path}`, { headers: { Authorization: `Bearer ${token}` } });
  let payload = {};
  try { payload = await response.json(); } catch { /* handled below */ }
  if (!response.ok || payload.error) throw new CommunityError(503, 'Community storage is temporarily unavailable.');
  return payload.result;
}

export const key = value => `${PREFIX}:${value}`;
export const now = () => new Date().toISOString();

export async function readJson(storageKey) {
  const value = await kv('get', storageKey);
  if (typeof value !== 'string') return null;
  try { return JSON.parse(value); } catch { return null; }
}

export async function readMany(storageKeys) {
  // Avoid a burst of hundreds of REST calls in one serverless invocation.
  const values = [];
  for (let index = 0; index < storageKeys.length; index += 40) {
    values.push(...await Promise.all(storageKeys.slice(index, index + 40).map(readJson)));
  }
  return values.filter(Boolean);
}

export async function writeJson(storageKey, value) {
  await kv('set', storageKey, JSON.stringify(value));
  return value;
}

export async function newestIds(collection, limit = 200) {
  const ids = await kv('zrevrange', key(`index:${collection}`), 0, Math.max(0, limit - 1));
  return Array.isArray(ids) ? ids.map(String) : [];
}

export async function addNewest(collection, id) {
  await kv('zadd', key(`index:${collection}`), Date.now(), id);
  // A student guide does not need an unbounded anonymous-content index.
  await kv('zremrangebyrank', key(`index:${collection}`), 0, -501);
}

export function cleanText(value, label, { min = 0, max = 500, required = false } = {}) {
  const text = typeof value === 'string' ? value.trim().replace(/[\u0000-\u001f\u007f]/g, ' ') : '';
  if (required && text.length < min) throw new CommunityError(400, `${label} is required.`);
  if (text.length > max) throw new CommunityError(400, `${label} is too long.`);
  return text;
}

export function id(value, label = 'ID') {
  const valueString = cleanText(value, label, { min: 1, max: 140, required: true });
  if (!/^[a-zA-Z0-9][a-zA-Z0-9:_-]*$/.test(valueString)) throw new CommunityError(400, `${label} has an invalid format.`);
  return valueString;
}

export function voterToken(value) {
  const token = cleanText(value, 'Voter token', { min: 16, max: 160, required: true });
  if (!/^[a-zA-Z0-9_-]+$/.test(token)) throw new CommunityError(400, 'Voter token has an invalid format.');
  return token;
}

export async function jsonBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch { throw new CommunityError(400, 'Request body must be valid JSON.'); }
  }
  return {};
}

/** Lightweight write throttling by forwarded address. It is intentionally not an identity system. */
export async function allowWrite(req, bucket, limit = 12, seconds = 600) {
  const forwarded = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
  const rateKey = key(`rate:${bucket}:${forwarded.slice(0, 80)}`);
  const count = Number(await kv('incr', rateKey));
  if (count === 1) await kv('expire', rateKey, seconds);
  if (count > limit) throw new CommunityError(429, 'Please wait a few minutes before contributing again.');
}

export const average = values => values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length * 10) / 10 : 0;

export function rankEntries(reviews) {
  const people = new Map();
  for (const review of reviews) {
    const previous = people.get(review.user_name) || [];
    previous.push(review); people.set(review.user_name, previous);
  }
  return Array.from(people.entries()).map(([userName, entries]) => {
    const count = entries.length;
    const badge = count >= 10 ? 'Star Critic 🌟' : count >= 6 ? 'Taste Master 🥇' : count >= 3 ? 'Campus Foodie 🥈' : 'Food Scout 🥉';
    const tier = count >= 10 ? 'diamond' : count >= 6 ? 'gold' : count >= 3 ? 'silver' : 'bronze';
    return { userName, reviewCount: count, averageRatingGiven: average(entries.map(entry => entry.rating)), lastActive: entries.sort((a, b) => b.created_at.localeCompare(a.created_at))[0]?.created_at || '', badge, tier, rank: 0 };
  }).sort((a, b) => b.reviewCount - a.reviewCount || b.averageRatingGiven - a.averageRatingGiven || b.lastActive.localeCompare(a.lastActive)).map((entry, index) => ({ ...entry, rank: index + 1 }));
}

import { addNewest, allowWrite, cleanText, communityHandler, CommunityError, id, jsonBody, key, newestIds, now, readMany, send, writeJson } from './_lib/community.js';

const moods = new Set(['celebration', 'exam_relief', 'midnight_run', 'chill_latte', 'laughing_fit', 'study_crunch', 'golden_hour']);

export default communityHandler(['GET', 'POST'], async (req, res) => {
  if (req.method === 'GET') {
    const ids = await newestIds('memories', 150);
    return send(res, 200, await readMany(ids.map(value => key(`memory:${value}`))));
  }

  await allowWrite(req, 'memories', 5);
  const body = await jsonBody(req);
  const mood = cleanText(body.mood, 'Mood', { max: 40 }) || 'celebration';
  if (!moods.has(mood)) throw new CommunityError(400, 'Mood is not supported.');
  const tags = Array.isArray(body.tags) ? body.tags.map(value => cleanText(value, 'Tag', { max: 30 })).filter(Boolean).slice(0, 6) : [];
  const date = cleanText(body.date, 'Outing date', { min: 10, max: 24, required: true });
  if (!/^\d{4}-\d{2}-\d{2}/.test(date)) throw new CommunityError(400, 'Outing date must use YYYY-MM-DD.');
  const memory = {
    id: `memory-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    title: cleanText(body.title, 'Title', { min: 3, max: 100, required: true }),
    venueName: cleanText(body.venueName, 'Venue name', { min: 2, max: 100, required: true }),
    venueId: body.venueId ? id(body.venueId, 'Venue ID') : '',
    authorName: cleanText(body.authorName, 'Name', { min: 2, max: 60, required: true }),
    date,
    story: cleanText(body.story, 'Story', { min: 5, max: 1000, required: true }),
    mood,
    faculty: cleanText(body.faculty, 'Faculty', { max: 120 }) || undefined,
    tags,
    photoUrl: null,
    cheersCount: 0,
    createdAt: now(),
  };
  await writeJson(key(`memory:${memory.id}`), memory);
  await addNewest('memories', memory.id);
  send(res, 201, memory);
});

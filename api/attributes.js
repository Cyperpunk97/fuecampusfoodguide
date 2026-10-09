import { allowWrite, communityHandler, CommunityError, id, jsonBody, key, send, voterToken, kv } from './_lib/community.js';

const attributes = new Set(['wifi', 'power', 'quiet', 'seating', 'aircon', 'long_stay']);

export default communityHandler(['GET', 'POST'], async (req, res) => {
  if (req.method === 'GET') {
    const entries = await kv('smembers', key('attributeKeys'));
    const keys = Array.isArray(entries) ? entries.map(String).filter(value => value.includes('|')).slice(0, 500) : [];
    const rows = await Promise.all(keys.map(async value => {
      const [venueId, attribute] = value.split('|');
      const [yesCount, noCount] = await Promise.all([
        kv('scard', key(`attribute:${venueId}:${attribute}:yes`)),
        kv('scard', key(`attribute:${venueId}:${attribute}:no`)),
      ]);
      const yes = Number(yesCount) || 0; const no = Number(noCount) || 0;
      return { venueId, attribute, yesCount: yes, totalCount: yes + no };
    }));
    return send(res, 200, rows.filter(row => row.totalCount > 0));
  }

  await allowWrite(req, 'attributes', 30);
  const body = await jsonBody(req);
  const venueId = id(body.venue_id, 'Venue ID');
  const attribute = id(body.attribute, 'Attribute');
  if (!attributes.has(attribute)) throw new CommunityError(400, 'This study attribute is not supported.');
  if (typeof body.value !== 'boolean') throw new CommunityError(400, 'Vote value must be true or false.');
  const token = voterToken(body.voter_token);
  const prefix = key(`attribute:${venueId}:${attribute}`);
  await kv('srem', `${prefix}:${body.value ? 'no' : 'yes'}`, token);
  await kv('sadd', `${prefix}:${body.value ? 'yes' : 'no'}`, token);
  await kv('sadd', key('attributeKeys'), `${venueId}|${attribute}`);
  send(res, 200, { venueId, attribute, value: body.value });
});

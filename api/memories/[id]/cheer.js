import { allowWrite, communityHandler, CommunityError, id, jsonBody, key, readJson, send, voterToken, writeJson, kv } from '../../_lib/community.js';

export default communityHandler(['POST'], async (req, res) => {
  await allowWrite(req, 'cheers', 20);
  const memoryId = id(req.query.id, 'Memory ID');
  const memory = await readJson(key(`memory:${memoryId}`));
  if (!memory) throw new CommunityError(404, 'That memory no longer exists.');
  const body = await jsonBody(req);
  const token = voterToken(body.voter_token);
  const votersKey = key(`memory:${memoryId}:cheers`);
  const wasNew = Number(await kv('sadd', votersKey, token)) === 1;
  if (wasNew) memory.cheersCount = Number(await kv('incr', key(`memory:${memoryId}:cheersCount`)));
  else memory.cheersCount = Number(await kv('get', key(`memory:${memoryId}:cheersCount`))) || Number(memory.cheersCount) || 0;
  await writeJson(key(`memory:${memoryId}`), memory);
  send(res, 200, { id: memoryId, cheersCount: memory.cheersCount });
});

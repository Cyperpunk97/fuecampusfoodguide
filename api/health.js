import { communityHandler, key, kv, send } from './_lib/community.js';

export default communityHandler(['GET'], async (_req, res) => {
  await kv('get', key('health'));
  send(res, 200, { service: 'cs-family-community', storage: 'configured' });
});

import { communityHandler, key, newestIds, rankEntries, readMany, send } from './_lib/community.js';

export default communityHandler(['GET'], async (_req, res) => {
  const ids = await newestIds('reviews', 300);
  const reviews = await readMany(ids.map(value => key(`review:${value}`)));
  send(res, 200, rankEntries(reviews).slice(0, 50));
});

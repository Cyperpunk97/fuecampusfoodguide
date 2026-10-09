import { addNewest, allowWrite, cleanText, communityHandler, CommunityError, id, jsonBody, key, newestIds, now, readJson, readMany, send, writeJson } from './_lib/community.js';

export default communityHandler(['GET', 'POST'], async (req, res) => {
  if (req.method === 'GET') {
    const restaurantId = typeof req.query.restaurant_id === 'string' ? id(req.query.restaurant_id, 'Restaurant ID') : '';
    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 100);
    const ids = await newestIds('reviews', 200);
    const reviews = await readMany(ids.map(value => key(`review:${value}`)));
    const matching = restaurantId ? reviews.filter(review => review.restaurant_id === restaurantId) : reviews;
    return send(res, 200, matching.slice(0, limit));
  }

  await allowWrite(req, 'reviews', 8);
  const body = await jsonBody(req);
  const restaurantId = id(body.restaurant_id, 'Restaurant ID');
  const rating = Number(body.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new CommunityError(400, 'Rating must be a whole number from 1 to 5.');
  const review = {
    id: `review-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    restaurant_id: restaurantId,
    rating,
    comment: cleanText(body.comment, 'Comment', { max: 500 }) || null,
    user_name: cleanText(body.user_name, 'Name', { min: 2, max: 60, required: true }),
    price_per_person: body.price_per_person === null || body.price_per_person === undefined || body.price_per_person === '' ? null : Number(body.price_per_person),
    recommended_dish: cleanText(body.recommended_dish, 'Recommended dish', { max: 80 }) || null,
    image_url: null,
    created_at: now(),
  };
  if (review.price_per_person !== null && (!Number.isFinite(review.price_per_person) || review.price_per_person <= 0 || review.price_per_person > 100000)) throw new CommunityError(400, 'Price per person must be a sensible positive amount.');
  await writeJson(key(`review:${review.id}`), review);
  await addNewest('reviews', review.id);
  send(res, 201, review);
});

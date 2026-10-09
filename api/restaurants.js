import { average, communityHandler, key, newestIds, readMany, send } from './_lib/community.js';

export default communityHandler(['GET'], async (_req, res) => {
  const ids = await newestIds('reviews', 200);
  const reviews = await readMany(ids.map(value => key(`review:${value}`)));
  const byVenue = new Map();
  for (const review of reviews) {
    const rows = byVenue.get(review.restaurant_id) || [];
    rows.push(review); byVenue.set(review.restaurant_id, rows);
  }
  const venues = Array.from(byVenue.entries()).map(([id, rows]) => {
    const prices = rows.map(row => row.price_per_person).filter(value => typeof value === 'number' && Number.isFinite(value));
    const dishes = rows.map(row => row.recommended_dish).filter(Boolean);
    const frequency = dishes.reduce((all, dish) => ({ ...all, [dish]: (all[dish] || 0) + 1 }), {});
    return {
      id,
      averageRating: average(rows.map(row => Number(row.rating))),
      reviewCount: rows.length,
      averagePrice: prices.length ? Math.round(average(prices)) : null,
      priceReportCount: prices.length,
      topDishes: Object.entries(frequency).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([dish]) => dish),
      openState: 'unknown',
    };
  });
  send(res, 200, venues);
});

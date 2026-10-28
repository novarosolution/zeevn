/** Rating maths for the product page summary. All inputs are optional — a product with no reviews yields zeros. */

export function buildRatingStats(reviews, { fallbackAverage = 0, fallbackCount = 0 } = {}) {
  const list = Array.isArray(reviews) ? reviews : [];
  const buckets = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  let sum = 0;
  let count = 0;
  list.forEach((review) => {
    const value = Math.round(Number(review?.rating));
    if (value >= 1 && value <= 5) {
      buckets[value] += 1;
      sum += value;
      count += 1;
    }
  });

  if (count === 0) {
    const avg = Number(fallbackAverage);
    const total = Math.max(0, Math.floor(Number(fallbackCount) || 0));
    return { average: Number.isFinite(avg) && avg > 0 ? avg : 0, count: total, buckets, hasBreakdown: false };
  }
  return { average: sum / count, count, buckets, hasBreakdown: true };
}

/** 0..1 width of one bar relative to the biggest bucket. */
export function bucketShare(buckets, star) {
  const max = Math.max(1, ...Object.values(buckets || {}));
  return Math.min(1, (buckets?.[star] || 0) / max);
}

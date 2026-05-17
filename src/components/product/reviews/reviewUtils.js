export const REVIEW_PAGE_SIZE = 8;

export const FILTER_ALL = "all";
export const FILTER_PHOTOS = "photos";
export const FILTER_VERIFIED = "verified";

export const SORT_HELPFUL = "helpful";
export const SORT_RECENT = "recent";
export const SORT_HIGH = "high";
export const SORT_LOW = "low";

export function normalizeReview(raw) {
  if (!raw) return null;
  return {
    id: String(raw._id || raw.id || ""),
    userName: String(raw.userName || "Customer").trim() || "Customer",
    rating: Math.min(5, Math.max(0, Number(raw.rating || 0))),
    comment: String(raw.comment || "").trim(),
    title: String(raw.title || "").trim(),
    photos: Array.isArray(raw.photos) ? raw.photos.map((u) => String(u || "").trim()).filter(Boolean) : [],
    helpfulCount: Math.max(0, Number(raw.helpfulCount || 0)),
    notHelpfulCount: Math.max(0, Number(raw.notHelpfulCount || 0)),
    verifiedPurchase: raw.verifiedPurchase === true || raw.verified === true,
    createdAt: raw.createdAt ? new Date(raw.createdAt) : null,
  };
}

export function buildRatingDistribution(reviews) {
  const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  (reviews || []).forEach((r) => {
    const star = Math.round(Number(r.rating || 0));
    if (star >= 1 && star <= 5) dist[star] += 1;
  });
  return dist;
}

export function verifiedPercent(reviews) {
  const list = reviews || [];
  if (!list.length) return 0;
  const verified = list.filter((r) => r.verifiedPurchase).length;
  return Math.round((verified / list.length) * 100);
}

export function filterReviews(reviews, filterKey) {
  const list = reviews || [];
  if (filterKey === FILTER_ALL) return list;
  if (filterKey === FILTER_PHOTOS) return list.filter((r) => r.photos?.length > 0);
  if (filterKey === FILTER_VERIFIED) return list.filter((r) => r.verifiedPurchase);
  const star = Number(filterKey);
  if (star >= 1 && star <= 5) return list.filter((r) => Math.round(r.rating) === star);
  return list;
}

function reviewTime(review) {
  const d = review?.createdAt;
  if (d instanceof Date) return d.getTime();
  if (d) return new Date(d).getTime() || 0;
  return 0;
}

export function sortReviews(reviews, sortKey) {
  const list = [...(reviews || [])];
  if (sortKey === SORT_HIGH) {
    return list.sort((a, b) => b.rating - a.rating || reviewTime(b) - reviewTime(a));
  }
  if (sortKey === SORT_LOW) {
    return list.sort((a, b) => a.rating - b.rating || reviewTime(b) - reviewTime(a));
  }
  if (sortKey === SORT_HELPFUL) {
    return list.sort((a, b) => b.helpfulCount - a.helpfulCount || reviewTime(b) - reviewTime(a));
  }
  return list.sort((a, b) => reviewTime(b) - reviewTime(a));
}

export function initialsFromName(name) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export function formatReviewDate(date) {
  if (!date) return "";
  try {
    return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(
      date instanceof Date ? date : new Date(date)
    );
  } catch {
    return "";
  }
}

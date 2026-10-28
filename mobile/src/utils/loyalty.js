/**
 * Zeevan Rewards tiers. Points are earned on delivered orders; the tier is only a label and a set of perks the app
 * shows, so it is derived from the balance on the device and never stored.
 *
 * The first threshold matches the "to Gold" ring the rewards screens already drew (Gold at 3,000 points).
 */

export const LOYALTY_TIERS = [
  {
    key: "member",
    label: "Member",
    min: 0,
    icon: "leaf-outline",
    blurb: "Welcome to Zeevan Rewards.",
    perks: ["Earn points on every delivered order", "Redeem points for coupons"],
  },
  {
    key: "gold",
    label: "Gold",
    min: 3000,
    icon: "star-outline",
    blurb: "Our regulars. Thank you for choosing slow, honest food.",
    perks: ["Everything in Member", "Early access to festive hampers", "Priority replies on support chat"],
  },
  {
    key: "platinum",
    label: "Platinum",
    min: 8000,
    icon: "diamond-outline",
    blurb: "The inner circle of the Zeevan table.",
    perks: ["Everything in Gold", "First pick of limited batches", "A thank-you gift with big orders"],
  },
];

const clampPoints = (points) => {
  const n = Math.floor(Number(points));
  return Number.isFinite(n) && n > 0 ? n : 0;
};

/**
 * Where a points balance sits on the ladder.
 * @returns {{ points:number, tier:object, next:object|null, progress:number, toNext:number, tierIndex:number }}
 *   `progress` is 0..1 across the current tier toward the next one (1 at the top tier).
 */
export function getTierProgress(points) {
  const pts = clampPoints(points);
  let tierIndex = 0;
  LOYALTY_TIERS.forEach((tier, i) => {
    if (pts >= tier.min) tierIndex = i;
  });
  const tier = LOYALTY_TIERS[tierIndex];
  const next = LOYALTY_TIERS[tierIndex + 1] || null;
  if (!next) return { points: pts, tier, next: null, progress: 1, toNext: 0, tierIndex };
  const span = next.min - tier.min;
  const progress = span > 0 ? Math.min(1, Math.max(0, (pts - tier.min) / span)) : 1;
  return { points: pts, tier, next, progress, toNext: Math.max(0, next.min - pts), tierIndex };
}

/** "12,500" — Indian digit grouping, the same as the balance on the rewards hero. */
export function formatPoints(points) {
  return clampPoints(points).toLocaleString("en-IN");
}

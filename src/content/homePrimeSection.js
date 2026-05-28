/** Copy and defaults for the home Prime Products block. */
export const HOME_PRIME_SECTION = {
  overline: "Prime picks",
  titleFallback: "Prime Products",
  subtitle: "Curated staples — quality you can taste, delivered with care",
  seeAllLabel: "Shop all",
  seeAllA11y: "Shop all prime products",
  countSingular: "1 item",
  countPlural: "{count} items",
  badgeLabel: "Prime",
};

export function formatPrimeSectionCount(count) {
  const n = Math.max(0, Number(count) || 0);
  if (n === 1) return HOME_PRIME_SECTION.countSingular;
  return HOME_PRIME_SECTION.countPlural.replace("{count}", String(n));
}

import PremiumSectionHeader from "../ui/PremiumSectionHeader";

/**
 * Back-compat alias for the home section header. The shared implementation
 * lives in `src/components/ui/PremiumSectionHeader.js` so any customer
 * screen can use it (and cohesion stays one-source-of-truth).
 *
 *   <HomeSectionHeader
 *     overline="Curated for you"
 *     title="Prime products"
 *     count={items.length}
 *     onSeeAll={...}
 *   />
 */
export default PremiumSectionHeader;

import React, { memo } from "react";
import SectionHeader from "./SectionHeader";

/** @deprecated Prefer {@link SectionHeader} — maps legacy home-style props to the design-system header. */
function PremiumSectionHeaderBase({
  overline,
  title,
  subtitle,
  onSeeAll,
  seeAllLabel = "See all",
  align = "left",
  compact: _compact,
}) {
  return (
    <SectionHeader
      overline={overline}
      title={title}
      subtitle={subtitle}
      align={align}
      actionLabel={seeAllLabel}
      onActionPress={onSeeAll}
      showActionChevron
    />
  );
}

const PremiumSectionHeader = memo(PremiumSectionHeaderBase);

export default PremiumSectionHeader;

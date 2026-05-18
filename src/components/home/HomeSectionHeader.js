import React, { memo } from "react";
import SectionHeader from "../ui/SectionHeader";

/**
 * Home catalog section chrome — maps legacy `onSeeAll` / `count` props to `SectionHeader`.
 */
function HomeSectionHeader({ count, subtitle, onSeeAll, seeAllLabel = "See all", compact: _compact, ...rest }) {
  const resolvedSubtitle =
    subtitle ??
    (count != null && Number.isFinite(Number(count))
      ? `${count} item${Number(count) === 1 ? "" : "s"}`
      : undefined);

  return (
    <SectionHeader
      {...rest}
      subtitle={resolvedSubtitle}
      actionLabel={seeAllLabel}
      onActionPress={onSeeAll}
      density="catalog"
    />
  );
}

export default memo(HomeSectionHeader);

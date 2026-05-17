import React, { memo } from "react";
import EmptyState from "./EmptyState";

/** @deprecated Prefer {@link EmptyState} — thin compatibility wrapper. */
function PremiumEmptyStateBase({
  iconName = "leaf-outline",
  title,
  description,
  titleLines: _titleLines,
  descriptionLines: _descriptionLines,
  ctaLabel,
  onCtaPress,
  ctaVariant = "primary",
  ctaIconLeft: _ctaIconLeft,
  secondaryCtaLabel,
  onSecondaryCtaPress,
  compact: _compact,
  style,
}) {
  return (
    <EmptyState
      iconName={iconName}
      title={title}
      description={description}
      ctaLabel={ctaLabel}
      onCtaPress={onCtaPress}
      ctaVariant={ctaVariant === "danger" ? "destructive" : ctaVariant}
      secondaryCtaLabel={secondaryCtaLabel}
      onSecondaryCtaPress={onSecondaryCtaPress}
      secondaryVariant="ghost"
      style={style}
    />
  );
}

const PremiumEmptyState = memo(PremiumEmptyStateBase);

export default PremiumEmptyState;

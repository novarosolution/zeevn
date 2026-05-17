import React from "react";
import EmptyState from "../ui/EmptyState";
import { HOME_EMPTY_STATES } from "../../content/appContent";

/**
 * Shared offline / network failure pattern.
 */
export default function NetworkErrorState({ onRetry, title, description, style }) {
  const copy = HOME_EMPTY_STATES.networkError;
  return (
    <EmptyState
      style={style}
      iconName={copy.icon}
      title={title ?? copy.title}
      description={description ?? copy.body}
      ctaLabel={copy.retryCta}
      onCtaPress={onRetry}
      ctaVariant="primary"
    />
  );
}

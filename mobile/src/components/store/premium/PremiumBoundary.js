import React from "react";

/**
 * Keeps an optional section from taking its screen down: if anything inside throws while rendering, the section simply
 * disappears. The premium extras (rails, cards, charts) are all wrapped in this, so a bad row of data in one of them can
 * never blank Home, the cart or the profile.
 */
export default class PremiumBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    if (typeof __DEV__ !== "undefined" && __DEV__) {
      console.warn(`[premium:${this.props.name || "section"}]`, error?.message || error);
    }
  }

  render() {
    if (this.state.failed) return this.props.fallback ?? null;
    return this.props.children;
  }
}

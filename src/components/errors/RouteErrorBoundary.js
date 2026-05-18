import React from "react";
import { captureException } from "../../observability/sentry";
import ErrorFallback from "./ErrorFallback";

export default class RouteErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, resetKey: 0 };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    captureException(error, {
      tags: { boundary: "route", route: this.props.routeName || "unknown" },
      extra: { componentStack: info?.componentStack },
    });
  }

  handleRetry = () => {
    this.setState((prev) => ({
      hasError: false,
      resetKey: prev.resetKey + 1,
    }));
  };

  render() {
    if (this.state.hasError) {
      return <ErrorFallback compact onRetry={this.handleRetry} />;
    }
    return <React.Fragment key={this.state.resetKey}>{this.props.children}</React.Fragment>;
  }
}

export function withRouteErrorBoundary(ScreenComponent, routeName) {
  const displayName = ScreenComponent.displayName || ScreenComponent.name || routeName || "Screen";
  function Wrapped(props) {
    return (
      <RouteErrorBoundary routeName={routeName || props?.route?.name}>
        <ScreenComponent {...props} />
      </RouteErrorBoundary>
    );
  }
  Wrapped.displayName = `WithRouteErrorBoundary(${displayName})`;
  return Wrapped;
}

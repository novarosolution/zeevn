import React from "react";
import { View } from "react-native";
import { captureException } from "../../observability/sentry";
import ErrorFallback from "./ErrorFallback";

export default class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, resetKey: 0 };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    captureException(error, {
      tags: { boundary: "app" },
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
      return (
        <View style={{ flex: 1 }}>
          <ErrorFallback onRetry={this.handleRetry} />
        </View>
      );
    }
    return <React.Fragment key={this.state.resetKey}>{this.props.children}</React.Fragment>;
  }
}

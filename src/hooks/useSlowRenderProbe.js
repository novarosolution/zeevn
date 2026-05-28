import { useEffect, useRef } from "react";
import { captureSlowRender } from "../observability/sentry";

/**
 * Reports screens that take >400ms from mount to first layout (dev + production telemetry).
 */
export default function useSlowRenderProbe(componentName) {
  const startRef = useRef(Date.now());
  const reportedRef = useRef(false);

  useEffect(() => {
    startRef.current = Date.now();
    reportedRef.current = false;
  }, [componentName]);

  const onLayout = () => {
    if (reportedRef.current) return;
    reportedRef.current = true;
    const durationMs = Date.now() - startRef.current;
    captureSlowRender(componentName, durationMs);
  };

  return onLayout;
}

/**
 * Filters known harmless Expo / RN Web dev noise in the browser console (LogBox does not cover these).
 */
if (typeof __DEV__ !== "undefined" && __DEV__ && typeof window !== "undefined") {
  const SUPPRESSED = [
    "Download the React DevTools",
    "props.pointerEvents is deprecated",
    "Running application",
    "Development-level warnings",
    "Slow network is detected",
    "was preloaded using link preload but not used",
    "has an invalid `href` value",
    "recyclingKey",
    "useNativeDriver",
  ];

  const shouldSuppress = (args) => {
    const text = args.map((a) => (typeof a === "string" ? a : "")).join(" ");
    return SUPPRESSED.some((snippet) => text.includes(snippet));
  };

  const wrap = (original) => (...args) => {
    if (shouldSuppress(args)) return;
    original(...args);
  };

  console.warn = wrap(console.warn);
  console.error = wrap(console.error);
}

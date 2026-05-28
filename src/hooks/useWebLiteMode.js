import { useEffect, useState } from "react";
import { Platform } from "react-native";
import {
  bindWebPerformanceListeners,
  getWebPerformanceProfile,
} from "../utils/webPerformance";

/**
 * True on Android web, touch browsers, save-data, low memory, or reduced-motion.
 * Use to skip blur, GSAP, ambient layers, and heavy scroll effects.
 */
export default function useWebLiteMode() {
  const [lite, setLite] = useState(() =>
    Platform.OS === "web" ? getWebPerformanceProfile().lite : false
  );

  useEffect(() => {
    if (Platform.OS !== "web") return undefined;
    return bindWebPerformanceListeners((profile) => setLite(profile.lite));
  }, []);

  return lite;
}

import { useCallback, useEffect, useRef } from "react";
import { Platform } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { applyRouteMeta } from "../utils/webMeta";

export default function useRouteMeta(routeKey, overrides = {}) {
  const overridesRef = useRef(overrides);
  overridesRef.current = overrides;

  const applyCurrentMeta = useCallback(() => {
    if (Platform.OS !== "web") return;
    applyRouteMeta(routeKey, overridesRef.current);
  }, [routeKey]);

  useFocusEffect(
    useCallback(() => {
      applyCurrentMeta();
      return undefined;
    }, [applyCurrentMeta])
  );

  useEffect(() => {
    applyCurrentMeta();
  }, [applyCurrentMeta, overrides]);
}

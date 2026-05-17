import { useCallback, useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import { useFocusEffect, useRoute } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import { navigateAfterAuth } from "../components/auth/authNavigation";
import { clearAuthFormDraft, loadAuthFormDraft, saveAuthFormDraft } from "../utils/authFormCache";

const AUTH_STORAGE_KEY = "@zeevan_auth";

/**
 * Auth screen guards: already-signed-in redirect, form draft cache, web multi-tab sync.
 */
export default function useAuthScreenLifecycle({
  navigation,
  screen,
  onDraftLoaded,
  toastMessage = "You're already signed in.",
}) {
  const route = useRoute();
  const { isAuthenticated, isAuthLoading, rehydrateFromStorage } = useAuth();
  const draftRef = useRef(null);
  const toastShown = useRef(false);
  const [toastVisible, setToastVisible] = useState(false);

  useEffect(() => {
    const draft = loadAuthFormDraft(screen);
    if (draft) {
      draftRef.current = draft;
      onDraftLoaded?.(draft);
    }
  }, [onDraftLoaded, screen]);

  useFocusEffect(
    useCallback(() => {
      if (isAuthLoading) return undefined;
      if (isAuthenticated) {
        if (!toastShown.current) {
          toastShown.current = true;
          setToastVisible(true);
        }
        const t = setTimeout(() => {
          navigateAfterAuth(navigation, route);
        }, 900);
        return () => clearTimeout(t);
      }
      return undefined;
    }, [isAuthLoading, isAuthenticated, navigation, route])
  );

  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return undefined;
    const onStorage = (event) => {
      if (event.key !== AUTH_STORAGE_KEY || !event.newValue) return;
      rehydrateFromStorage().then(() => {
        navigation.replace("Home");
      });
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [isAuthenticated, navigation]);

  const persistDraft = useCallback(
    (fields) => {
      saveAuthFormDraft(screen, fields);
    },
    [screen]
  );

  const clearDraft = useCallback(() => {
    clearAuthFormDraft(screen);
  }, [screen]);

  return {
    persistDraft,
    clearDraft,
    toastVisible,
    setToastVisible,
    toastMessage,
  };
}

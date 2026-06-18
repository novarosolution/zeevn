import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { appleAuthRequest, googleAuthRequest, loginRequest, registerRequest } from "../services/authService";
import { fetchUserProfile } from "../services/userService";
import { registerForPushNotifications } from "../services/pushNotificationService";
import { configureApiClient, onSessionExpiredEvent } from "../services/apiClient";

const AuthContext = createContext(undefined);
const AUTH_STORAGE_KEY = "@kankreg_auth";
const PROFILE_REFRESH_TTL_MS = 45 * 1000;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);

  const tokenRef = useRef(null);
  const refreshTokenRef = useRef(null);
  const userRef = useRef(null);
  const profileRefreshAtRef = useRef(0);

  useEffect(() => {
    tokenRef.current = token;
  }, [token]);
  useEffect(() => {
    refreshTokenRef.current = refreshToken;
  }, [refreshToken]);
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const persistSession = useCallback(async (nextToken, nextRefreshToken, nextUser) => {
    await AsyncStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify({
        token: nextToken,
        refreshToken: nextRefreshToken,
        user: nextUser,
      })
    );
  }, []);

  const refreshProfile = useCallback(
    async ({ force = false } = {}) => {
      if (!tokenRef.current) return userRef.current;
      const now = Date.now();
      if (!force && userRef.current && now - profileRefreshAtRef.current < PROFILE_REFRESH_TTL_MS) {
        return userRef.current;
      }
      const freshUser = await fetchUserProfile();
      profileRefreshAtRef.current = Date.now();
      setUser(freshUser);
      userRef.current = freshUser;
      await persistSession(tokenRef.current, refreshTokenRef.current, freshUser);
      return freshUser;
    },
    [persistSession]
  );

  const clearSession = useCallback(async () => {
    setUser(null);
    setToken(null);
    setRefreshToken(null);
    try {
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
    } catch {
      // memory state already cleared
    }
  }, []);

  // Configure the API client once. Use refs so the client always sees the
  // latest tokens without recreating the configuration on every render.
  useEffect(() => {
    configureApiClient({
      getAccessToken: () => tokenRef.current,
      getRefreshToken: () => refreshTokenRef.current,
      onTokensRefreshed: async (nextToken, nextUser) => {
        if (!nextToken) return;
        setToken(nextToken);
        tokenRef.current = nextToken;
        const mergedUser = nextUser || userRef.current;
        if (nextUser) {
          setUser(nextUser);
          userRef.current = nextUser;
        }
        try {
          await persistSession(nextToken, refreshTokenRef.current, mergedUser);
        } catch {
          // Persisting is best-effort; in-memory state is already updated.
        }
      },
      onSessionExpired: () => {
        setSessionExpired(true);
        clearSession().catch(() => {});
      },
    });
  }, [persistSession, clearSession]);

  useEffect(() => {
    const off = onSessionExpiredEvent(() => setSessionExpired(true));
    return () => {
      if (typeof off === "function") off();
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function restoreAuth() {
      try {
        const saved = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
        if (!saved) {
          return;
        }

        const parsed = JSON.parse(saved);
        if (parsed?.token && parsed?.user) {
          if (isMounted) {
            setToken(parsed.token);
            tokenRef.current = parsed.token;
            setRefreshToken(parsed.refreshToken || null);
            refreshTokenRef.current = parsed.refreshToken || null;
            setUser(parsed.user);
            userRef.current = parsed.user;
          }

          // Paint immediately with cached session; refresh profile in background.
          refreshProfile({ force: true }).catch(() => {});
        }
      } catch {
        await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
      } finally {
        if (isMounted) {
          setIsAuthLoading(false);
        }
      }
    }

    const watchdogMs = Platform.OS === "web" ? 800 : 1500;
    const watchdog = setTimeout(() => {
      if (isMounted) {
        setIsAuthLoading(false);
      }
    }, watchdogMs);

    restoreAuth();

    return () => {
      isMounted = false;
      clearTimeout(watchdog);
    };
  }, [refreshProfile]);

  useEffect(() => {
    if (!token) return;
    registerForPushNotifications(token).catch(() => {
      // Avoid auth flow break if notification permission/token registration fails.
    });
  }, [token]);

  const saveSession = useCallback(async (sessionToken, sessionUser, sessionRefreshToken = null) => {
    setToken(sessionToken);
    tokenRef.current = sessionToken;
    setRefreshToken(sessionRefreshToken);
    refreshTokenRef.current = sessionRefreshToken;
    setUser(sessionUser);
    userRef.current = sessionUser;
    profileRefreshAtRef.current = Date.now();
    setSessionExpired(false);
    await persistSession(sessionToken, sessionRefreshToken, sessionUser);
  }, [persistSession]);

  const updateStoredUser = useCallback(async (nextUser) => {
    setUser(nextUser);
    userRef.current = nextUser;
    profileRefreshAtRef.current = Date.now();
    if (!tokenRef.current) {
      return;
    }
    await persistSession(tokenRef.current, refreshTokenRef.current, nextUser);
  }, [persistSession]);

  const loginWithCredentials = useCallback(async ({ email, password }) => {
    const data = await loginRequest({ email, password });
    await saveSession(data.token, data.user, data.refreshToken || null);
    return data.user;
  }, [saveSession]);

  const registerWithCredentials = useCallback(async ({ name, email, password }) => {
    const data = await registerRequest({ name, email, password });
    await saveSession(data.token, data.user, data.refreshToken || null);
    return data.user;
  }, [saveSession]);

  const loginWithGoogle = useCallback(
    async ({ idToken }) => {
      const data = await googleAuthRequest({ idToken });
      await saveSession(data.token, data.user, data.refreshToken || null);
      return data.user;
    },
    [saveSession]
  );

  const loginWithApple = useCallback(
    async ({ identityToken, fullName }) => {
      const data = await appleAuthRequest({ identityToken, fullName });
      await saveSession(data.token, data.user, data.refreshToken || null);
      return data.user;
    },
    [saveSession]
  );

  const logout = useCallback(async () => {
    await clearSession();
    setSessionExpired(false);
  }, [clearSession]);

  const acknowledgeSessionExpired = useCallback(() => {
    setSessionExpired(false);
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token),
      isAuthLoading,
      sessionExpired,
      acknowledgeSessionExpired,
      loginWithCredentials,
      registerWithCredentials,
      loginWithGoogle,
      loginWithApple,
      updateStoredUser,
      refreshProfile,
      logout,
    }),
    [
      user,
      token,
      isAuthLoading,
      sessionExpired,
      acknowledgeSessionExpired,
      loginWithCredentials,
      registerWithCredentials,
      loginWithGoogle,
      loginWithApple,
      updateStoredUser,
      refreshProfile,
      logout,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside an AuthProvider");
  }

  return context;
}

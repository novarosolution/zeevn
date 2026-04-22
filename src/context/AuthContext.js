import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { loginRequest, registerRequest } from "../services/authService";
import { fetchUserProfile } from "../services/userService";
import { registerForPushNotifications } from "../services/pushNotificationService";

const AuthContext = createContext(undefined);
const AUTH_STORAGE_KEY = "@kankreg_auth";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

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
            setUser(parsed.user);
          }

          // Keep role/profile fresh so admin access reflects backend state.
          try {
            const freshUser = await Promise.race([
              fetchUserProfile(parsed.token),
              new Promise((_, reject) =>
                setTimeout(() => reject(new Error("Profile refresh timeout")), 3500)
              ),
            ]);
            if (isMounted) {
              setUser(freshUser);
            }
            await AsyncStorage.setItem(
              AUTH_STORAGE_KEY,
              JSON.stringify({ token: parsed.token, user: freshUser })
            );
          } catch {
            // If profile refresh fails, continue with cached session.
          }
        }
      } catch {
        await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
      } finally {
        if (isMounted) {
          setIsAuthLoading(false);
        }
      }
    }

    const watchdog = setTimeout(() => {
      if (isMounted) {
        setIsAuthLoading(false);
      }
    }, 5000);

    restoreAuth();

    return () => {
      isMounted = false;
      clearTimeout(watchdog);
    };
  }, []);

  useEffect(() => {
    if (!token) return;
    registerForPushNotifications(token).catch(() => {
      // Avoid auth flow break if notification permission/token registration fails.
    });
  }, [token]);

  const saveSession = async (sessionToken, sessionUser) => {
    setToken(sessionToken);
    setUser(sessionUser);

    await AsyncStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify({ token: sessionToken, user: sessionUser })
    );
  };

  const updateStoredUser = async (nextUser) => {
    setUser(nextUser);
    if (!token) {
      return;
    }
    await AsyncStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify({ token, user: nextUser })
    );
  };

  const loginWithCredentials = async ({ email, password }) => {
    const data = await loginRequest({ email, password });
    await saveSession(data.token, data.user);
    return data.user;
  };

  const registerWithCredentials = async ({ name, email, password }) => {
    const data = await registerRequest({ name, email, password });
    await saveSession(data.token, data.user);
    return data.user;
  };

  const logout = async () => {
    setUser(null);
    setToken(null);
    try {
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
    } catch {
      // still signed out in memory; storage clear is best-effort
    }
  };

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token),
      isAuthLoading,
      loginWithCredentials,
      registerWithCredentials,
      updateStoredUser,
      logout,
    }),
    [user, token, isAuthLoading]
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

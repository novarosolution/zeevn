import React from "react";
import { Text } from "react-native";
import { render, waitFor, act } from "@testing-library/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthProvider, useAuth } from "../AuthContext";
import { loginRequest, registerRequest } from "../../services/authService";
import { fetchUserProfile } from "../../services/userService";
import { configureApiClient, onSessionExpiredEvent } from "../../services/apiClient";

jest.mock("../../services/authService");
jest.mock("../../services/userService");
jest.mock("../../services/pushNotificationService", () => ({
  registerForPushNotifications: jest.fn().mockResolvedValue(undefined),
}));
jest.mock("../../services/apiClient");
jest.mock("../../utils/sessionStorage", () => ({
  loadStoredSessionId: jest.fn().mockResolvedValue(""),
  persistSessionId: jest.fn().mockResolvedValue(undefined),
  clearStoredSessionId: jest.fn().mockResolvedValue(undefined),
}));

function Probe() {
  const auth = useAuth();
  return (
    <Text testID="auth-probe">
      {JSON.stringify({
        loading: auth.isAuthLoading,
        authed: auth.isAuthenticated,
        email: auth.user?.email ?? null,
        expired: auth.sessionExpired,
      })}
    </Text>
  );
}

function readProbe(screen) {
  return JSON.parse(screen.getByTestId("auth-probe").props.children);
}

describe("AuthContext", () => {
  let sessionExpiredHandler;

  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
    configureApiClient.mockImplementation((handlers) => {
      sessionExpiredHandler = handlers.onSessionExpired;
    });
    onSessionExpiredEvent.mockImplementation(() => () => {});
    fetchUserProfile.mockResolvedValue({ id: "u1", email: "fresh@zeevan.test", name: "Fresh" });
  });

  test("initial state transitions loading → unauthenticated", async () => {
    const screen = render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );
    await waitFor(() => {
      expect(readProbe(screen).loading).toBe(false);
    });
    expect(readProbe(screen).authed).toBe(false);
  });

  test("login success path authenticates user", async () => {
    loginRequest.mockResolvedValue({
      token: "access",
      refreshToken: "refresh",
      user: { id: "u1", email: "ok@zeevan.test", name: "OK" },
      sessionId: "sid",
    });
    fetchUserProfile.mockResolvedValue({ id: "u1", email: "ok@zeevan.test", name: "OK" });

    const authRef = { current: null };
    function Capture() {
      authRef.current = useAuth();
      return <Probe />;
    }

    const screen = render(
      <AuthProvider>
        <Capture />
      </AuthProvider>
    );

    await waitFor(() => expect(readProbe(screen).loading).toBe(false));

    await act(async () => {
      await authRef.current.loginWithCredentials({
        email: "ok@zeevan.test",
        password: "secret",
      });
    });

    await waitFor(() => expect(readProbe(screen).authed).toBe(true));
    expect(readProbe(screen).email).toBe("ok@zeevan.test");
  });

  test("login failure leaves user unauthenticated", async () => {
    loginRequest.mockRejectedValue(new Error("Invalid credentials"));

    const authRef = { current: null };
    function Capture() {
      authRef.current = useAuth();
      return <Probe />;
    }

    const screen = render(
      <AuthProvider>
        <Capture />
      </AuthProvider>
    );
    await waitFor(() => expect(readProbe(screen).loading).toBe(false));

    await expect(
      authRef.current.loginWithCredentials({ email: "bad@zeevan.test", password: "x" })
    ).rejects.toThrow("Invalid credentials");

    expect(readProbe(screen).authed).toBe(false);
  });

  test("token refresh via api client updates session", async () => {
    await AsyncStorage.setItem(
      "@zeevan_auth",
      JSON.stringify({
        token: "old",
        refreshToken: "r1",
        user: { id: "u1", email: "old@zeevan.test" },
      })
    );

    let refreshHandler;
    configureApiClient.mockImplementation((handlers) => {
      refreshHandler = handlers.onTokensRefreshed;
    });

    const screen = render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );

    await waitFor(() => expect(readProbe(screen).authed).toBe(true));

    await act(async () => {
      await refreshHandler("new-token", { id: "u1", email: "new@zeevan.test" });
    });

    await waitFor(() => expect(readProbe(screen).email).toBe("new@zeevan.test"));
    const stored = JSON.parse(await AsyncStorage.getItem("@zeevan_auth"));
    expect(stored.token).toBe("new-token");
  });

  test("session expiry clears auth and sets sessionExpired flag", async () => {
    await AsyncStorage.setItem(
      "@zeevan_auth",
      JSON.stringify({
        token: "t",
        refreshToken: "r",
        user: { id: "u1", email: "x@zeevan.test" },
      })
    );

    const screen = render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );

    await waitFor(() => expect(readProbe(screen).authed).toBe(true));

    await act(async () => {
      sessionExpiredHandler();
      await new Promise((resolve) => setImmediate(resolve));
    });

    await waitFor(
      () => {
        const state = readProbe(screen);
        expect(state.authed).toBe(false);
        expect(state.expired).toBe(true);
      },
      { timeout: 5000 }
    );
  });

  test("register without verification does not auto-login when flag set", async () => {
    registerRequest.mockResolvedValue({
      requiresEmailVerification: true,
      user: { id: "u2", email: "new@zeevan.test" },
    });

    const authRef = { current: null };
    function Capture() {
      authRef.current = useAuth();
      return <Probe />;
    }

    const screen = render(
      <AuthProvider>
        <Capture />
      </AuthProvider>
    );
    await waitFor(() => expect(readProbe(screen).loading).toBe(false));

    const result = await authRef.current.registerWithCredentials({
      name: "N",
      email: "new@zeevan.test",
      password: "Secret!234",
    });

    expect(result.requiresEmailVerification).toBe(true);
    expect(readProbe(screen).authed).toBe(false);
  });
});

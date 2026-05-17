import { useCallback, useEffect, useRef, useState } from "react";
import { isDeviceOffline } from "../utils/authNetwork";
import { formatRetryCountdown } from "../utils/authRateLimit";
import { AUTH_SCREEN } from "../content/appContent";

const SLOW_MS = 8000;
const ABORT_MS = 20000;

/**
 * Wraps auth API calls: offline guard, slow hint, hard abort, 429 countdown.
 */
export default function useAuthSubmit() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [slowHint, setSlowHint] = useState(false);
  const [networkError, setNetworkError] = useState(false);
  const [serverError, setServerError] = useState("");
  const [rateLimitUntil, setRateLimitUntil] = useState(null);
  const abortRef = useRef(null);

  const clearErrors = useCallback(() => {
    setNetworkError(false);
    setServerError("");
  }, []);

  useEffect(() => {
    if (!rateLimitUntil) return undefined;
    const tick = () => {
      if (Date.now() >= rateLimitUntil) {
        setRateLimitUntil(null);
        setServerError("");
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [rateLimitUntil]);

  const rateLimitMessage = rateLimitUntil
    ? `Too many attempts. Try again in ${formatRetryCountdown(rateLimitUntil - Date.now())}.`
    : "";

  const isRateLimited = Boolean(rateLimitUntil && Date.now() < rateLimitUntil);

  const run = useCallback(
    async (task) => {
      if (isRateLimited) return null;

      if (await isDeviceOffline()) {
        setNetworkError(true);
        setServerError("");
        return null;
      }

      setIsSubmitting(true);
      setSlowHint(false);
      setNetworkError(false);
      setServerError("");

      const controller = new AbortController();
      abortRef.current = controller;
      const slowTimer = setTimeout(() => setSlowHint(true), SLOW_MS);
      const abortTimer = setTimeout(() => controller.abort(), ABORT_MS);

      try {
        return await task(controller.signal);
      } catch (err) {
        if (err?.name === "AbortError" || err?.aborted || controller.signal.aborted) {
          setNetworkError(true);
          return null;
        }
        if (err?.isNetwork) {
          setNetworkError(true);
          return null;
        }
        if (err?.status === 429) {
          const until = Date.now() + (err.retryAfterMs ?? 120000);
          setRateLimitUntil(until);
          setServerError("");
          return null;
        }
        if (err?.status === 401) {
          setServerError(AUTH_SCREEN.login.invalidCredentials);
          return null;
        }
        if (err?.status === 403 && err?.code === "ACCOUNT_DELETION_PENDING") {
          setServerError(AUTH_SCREEN.login.accountDeletionPending);
          return null;
        }
        setServerError(err?.message || AUTH_SCREEN.shared.serverError);
        return null;
      } finally {
        clearTimeout(slowTimer);
        clearTimeout(abortTimer);
        abortRef.current = null;
        setIsSubmitting(false);
        setSlowHint(false);
      }
    },
    [isRateLimited]
  );

  return {
    run,
    isSubmitting,
    slowHint,
    networkError,
    serverError,
    rateLimitMessage,
    rateLimitUntil,
    isRateLimited,
    clearErrors,
    setServerError,
    setNetworkError,
  };
}

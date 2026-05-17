import { getApiBaseUrl } from "./apiBase";
import { parseRetryAfterMs } from "../utils/authRateLimit";

function apiUrl(path) {
  return `${getApiBaseUrl()}${path}`;
}

async function request(path, options = {}) {
  const { signal, captchaToken, headers: extraHeaders, ...fetchOptions } = options;

  let response;
  try {
    response = await fetch(apiUrl(path), {
      headers: {
        "Content-Type": "application/json",
        ...(captchaToken ? { "X-Captcha-Token": captchaToken } : {}),
        ...(extraHeaders || {}),
      },
      signal,
      ...fetchOptions,
    });
  } catch (cause) {
    if (cause?.name === "AbortError") {
      const err = new Error("Request aborted");
      err.aborted = true;
      throw err;
    }
    const err = new Error(cause?.message || "Network request failed");
    err.isNetwork = true;
    throw err;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const err = new Error(data.message || "Request failed.");
    err.status = response.status;
    if (data.code) err.code = data.code;
    if (response.status === 429) {
      err.retryAfterMs = parseRetryAfterMs(response, data);
    }
    throw err;
  }

  return data;
}

export function registerRequest({ name, email, password, signal, captchaToken }) {
  return request("/users/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
    signal,
    captchaToken,
  });
}

export function loginRequest({ email, password, signal, captchaToken }) {
  return request("/users/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
    signal,
    captchaToken,
  });
}

/** Enumeration-safe — always 200 when email format is valid. */
export function forgotPasswordRequest({ email, signal, captchaToken }) {
  return request("/users/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
    signal,
    captchaToken,
  });
}

export function resetPasswordWithTokenRequest({ email, token, newPassword, signal, captchaToken }) {
  return request("/users/reset-password", {
    method: "POST",
    body: JSON.stringify({ email, token, newPassword }),
    signal,
    captchaToken,
  });
}

export function verifyEmailWithTokenRequest({ email, token, signal, captchaToken }) {
  return request("/users/verify-email", {
    method: "POST",
    body: JSON.stringify({ email, token }),
    signal,
    captchaToken,
  });
}

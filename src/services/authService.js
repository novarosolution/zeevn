import { getApiBaseUrl } from "./apiBase";

function apiUrl(path) {
  return `${getApiBaseUrl()}${path}`;
}

async function request(path, options = {}) {
  const response = await fetch(apiUrl(path), {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Request failed.");
  }

  return data;
}

export function registerRequest({ name, email, password }) {
  return request("/users/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });
}

export function loginRequest({ email, password }) {
  return request("/users/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

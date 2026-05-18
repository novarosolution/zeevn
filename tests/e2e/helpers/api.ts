const API_BASE = (process.env.E2E_API_URL || "http://127.0.0.1:5001").replace(/\/$/, "");
const WEB_BASE = (process.env.E2E_BASE_URL || "http://localhost:8081").replace(/\/$/, "");

function buildVerifyUrl(email: string, token: string) {
  return `${WEB_BASE}/verify-email?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;
}

export function uniqueEmail(prefix = "e2e") {
  return `${prefix}.${Date.now()}.${Math.random().toString(36).slice(2, 8)}@e2e.zeevan.test`;
}

export const E2E_PASSWORD = "E2eTest!234";

async function apiJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body?.message || `API ${res.status} ${path}`);
  }
  return body as T;
}

export async function registerUserApi(email: string, password = E2E_PASSWORD, name = "E2E User") {
  return apiJson<{
    token: string;
    refreshToken: string;
    user: { id: string; email: string; name: string };
  }>("/users/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });
}

export async function loginUserApi(email: string, password = E2E_PASSWORD) {
  return apiJson<{ token: string; user: { id: string; email: string } }>("/users/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function issueVerificationToken(email: string) {
  const data = await apiJson<{ token: string; verifyUrl?: string }>("/test/issue-verification-token", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
  return { ...data, verifyUrl: buildVerifyUrl(email, data.token) };
}

export async function getLastVerificationToken(email: string) {
  const data = await apiJson<{ token: string; verifyUrl?: string }>(
    `/test/last-verification-token?email=${encodeURIComponent(email)}`
  );
  return { ...data, verifyUrl: buildVerifyUrl(email, data.token) };
}

export async function fetchProducts() {
  return apiJson<Array<{ _id: string; name: string; price: number }>>("/products");
}

export async function ensureE2EProductId(): Promise<string> {
  const envId = process.env.E2E_PRODUCT_ID;
  if (envId) return envId;
  const products = await fetchProducts();
  const named = products.find((p) => p.name === "E2E Ghee Jar");
  if (named?._id) return named._id;
  if (products[0]?._id) return products[0]._id;
  throw new Error("No products in catalog — run backend/scripts/seed-e2e.js");
}

export async function updateProfileApi(
  token: string,
  patch: { defaultAddress?: Record<string, string>; name?: string }
) {
  return apiJson("/users/profile", {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(patch),
  });
}

export async function replaceCartApi(
  token: string,
  items: Array<{ product: string; quantity: number }>
) {
  return apiJson("/users/cart", {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ items }),
  });
}

export async function fetchMyOrdersApi(token: string) {
  return apiJson<Array<{ _id: string; totalPrice?: number }>>("/users/my-orders", {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export { API_BASE };

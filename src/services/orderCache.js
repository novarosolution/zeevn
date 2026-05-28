const ORDER_CACHE_TTL_MS = 15_000;

let cachedPromise = null;
let cachedAt = 0;
let cachedData = null;

export async function getMyOrdersCached(fetcher) {
  const now = Date.now();
  if (cachedData && now - cachedAt < ORDER_CACHE_TTL_MS) {
    return cachedData;
  }
  if (cachedPromise) {
    return cachedPromise;
  }
  cachedPromise = Promise.resolve()
    .then(() => fetcher())
    .then((data) => {
      cachedData = data;
      cachedAt = Date.now();
      cachedPromise = null;
      return data;
    })
    .catch((err) => {
      cachedPromise = null;
      throw err;
    });
  return cachedPromise;
}

export function invalidateMyOrdersCache() {
  cachedPromise = null;
  cachedData = null;
  cachedAt = 0;
}


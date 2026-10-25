import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "zeevan.admin.offlineQueue.v1";
const CATALOG_KEY = "zeevan.admin.catalogCache.v1";

function id() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function readQueue() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const rows = raw ? JSON.parse(raw) : [];
    return Array.isArray(rows) ? rows : [];
  } catch {
    return [];
  }
}

async function writeQueue(rows) {
  await AsyncStorage.setItem(KEY, JSON.stringify(rows));
  return rows;
}

export async function listAdminOfflineDrafts() {
  return readQueue();
}

export async function enqueueAdminOfflineDraft(kind, payload, label = "") {
  const rows = await readQueue();
  const row = {
    id: id(),
    kind,
    payload,
    label: String(label || kind).slice(0, 80),
    at: new Date().toISOString(),
    tries: 0,
    error: "",
  };
  rows.unshift(row);
  await writeQueue(rows.slice(0, 40));
  return row;
}

export async function removeAdminOfflineDraft(draftId) {
  const rows = (await readQueue()).filter((row) => row.id !== draftId);
  await writeQueue(rows);
  return rows;
}

export async function cacheAdminCatalog(products) {
  const list = Array.isArray(products) ? products : [];
  await AsyncStorage.setItem(
    CATALOG_KEY,
    JSON.stringify({
      at: new Date().toISOString(),
      products: list.map((p) => ({
        _id: p._id,
        name: p.name,
        sku: p.sku,
        price: p.price,
        image: p.image,
        images: p.images,
        stockQty: p.stockQty,
        stockCounter: p.stockCounter,
        inStock: p.inStock,
        isPublished: p.isPublished,
        comingSoon: p.comingSoon,
        unit: p.unit,
        lastCost: p.lastCost,
        reorderMinOnline: p.reorderMinOnline,
        reorderMinCounter: p.reorderMinCounter,
      })),
    })
  );
}

export async function readAdminCatalogCache() {
  try {
    const raw = await AsyncStorage.getItem(CATALOG_KEY);
    const data = raw ? JSON.parse(raw) : null;
    return data && Array.isArray(data.products) ? data : { at: "", products: [] };
  } catch {
    return { at: "", products: [] };
  }
}

export function isLikelyOffline(err) {
  const m = String(err?.message || err || "");
  return /network|failed to fetch|offline|timeout|internet|load failed/i.test(m);
}

export async function syncAdminOfflineDrafts(handlers = {}) {
  const rows = await readQueue();
  const kept = [];
  const done = [];
  for (const row of rows) {
    const run = handlers[row.kind];
    if (typeof run !== "function") {
      kept.push(row);
      continue;
    }
    try {
      const result = await run(row.payload);
      done.push({ ...row, result });
    } catch (err) {
      kept.push({
        ...row,
        tries: (row.tries || 0) + 1,
        error: err?.message || "Could not sync.",
      });
    }
  }
  await writeQueue(kept);
  return { done, pending: kept };
}

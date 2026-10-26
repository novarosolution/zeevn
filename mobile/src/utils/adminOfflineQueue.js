import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "zeevan.admin.offlineQueue.v1";
const CATALOG_KEY = "zeevan.admin.catalogCache.v1";

function id() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * One reference per action, made when it is first attempted and sent with every retry. The server answers a repeated
 * reference with the first result instead of billing, receiving or writing stock off twice (a reply lost on a weak
 * connection looks exactly like a failure to the phone).
 */
export function newClientRef() {
  return `ref-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Reads and writes of the queue run one at a time, so a draft saved mid-sync can't be overwritten with an old copy. */
let queueLock = Promise.resolve();
function withQueueLock(task) {
  const run = queueLock.then(task, task);
  queueLock = run.catch(() => {});
  return run;
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

export function enqueueAdminOfflineDraft(kind, payload, label = "") {
  return withQueueLock(async () => {
    const rows = await readQueue();
    const row = {
      id: id(),
      kind,
      // Keep the reference the first attempt used; a draft that never had one gets it now.
      payload: { ...payload, clientRef: payload?.clientRef || newClientRef() },
      label: String(label || kind).slice(0, 80),
      at: new Date().toISOString(),
      tries: 0,
      error: "",
    };
    rows.unshift(row);
    await writeQueue(rows.slice(0, 40));
    return row;
  });
}

export function removeAdminOfflineDraft(draftId) {
  return withQueueLock(async () => {
    const rows = (await readQueue()).filter((row) => row.id !== draftId);
    await writeQueue(rows);
    return rows;
  });
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

export async function syncAdminOfflineDrafts(handlers = {}, options = {}) {
  const kinds = Array.isArray(options.kinds) && options.kinds.length ? new Set(options.kinds) : null;
  const ids = Array.isArray(options.ids) && options.ids.length ? new Set(options.ids) : null;
  const rows = await readQueue();
  const done = [];
  const failed = new Map();
  // Oldest first (the queue is newest first): a restock saved before a sale has to land before that sale does.
  for (const row of [...rows].reverse()) {
    if ((kinds && !kinds.has(row.kind)) || (ids && !ids.has(row.id))) continue;
    const run = handlers[row.kind];
    if (typeof run !== "function") continue;
    try {
      const result = await run(row.payload);
      done.push({ ...row, result });
    } catch (err) {
      failed.set(row.id, {
        ...row,
        tries: (row.tries || 0) + 1,
        error: err?.message || "Could not sync.",
      });
    }
  }
  // Syncing takes a while. Merge into the queue as it is now, so a draft saved meanwhile is kept, not overwritten.
  return withQueueLock(async () => {
    const doneIds = new Set(done.map((row) => row.id));
    const pending = (await readQueue()).filter((row) => !doneIds.has(row.id)).map((row) => failed.get(row.id) || row);
    await writeQueue(pending);
    return { done, pending };
  });
}

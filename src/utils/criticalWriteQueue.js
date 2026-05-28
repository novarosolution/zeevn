import AsyncStorage from "@react-native-async-storage/async-storage";

const QUEUE_KEY = "@zeevan_critical_writes_v1";
const MAX_ITEMS = 40;

export const WRITE_TYPES = {
  CART_SYNC: "cart_sync",
  ADDRESS_SAVE: "address_save",
};

async function readQueue() {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    const parsed = JSON.parse(raw || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeQueue(items) {
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(items.slice(-MAX_ITEMS)));
}

/**
 * @param {string} type — WRITE_TYPES value
 * @param {object} payload — serializable job data
 */
export async function enqueueCriticalWrite(type, payload) {
  const queue = await readQueue();
  queue.push({
    id: `${type}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    type,
    payload,
    queuedAt: Date.now(),
    attempts: 0,
  });
  await writeQueue(queue);
}

export async function peekCriticalWrites() {
  return readQueue();
}

export async function removeCriticalWrite(id) {
  const queue = await readQueue();
  await writeQueue(queue.filter((item) => item.id !== id));
}

export async function bumpCriticalWriteAttempt(id) {
  const queue = await readQueue();
  const next = queue.map((item) =>
    item.id === id ? { ...item, attempts: (item.attempts || 0) + 1, lastAttemptAt: Date.now() } : item
  );
  await writeQueue(next);
  return next.find((item) => item.id === id);
}

export async function flushCriticalWriteQueue(handlers = {}) {
  const queue = await readQueue();
  if (!queue.length) return { flushed: 0, failed: 0 };

  let flushed = 0;
  let failed = 0;

  for (const job of queue) {
    const handler = handlers[job.type];
    if (typeof handler !== "function") {
      failed += 1;
      continue;
    }
    try {
      await handler(job.payload);
      await removeCriticalWrite(job.id);
      flushed += 1;
    } catch {
      await bumpCriticalWriteAttempt(job.id);
      failed += 1;
    }
  }

  return { flushed, failed };
}

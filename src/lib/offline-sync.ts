// Inspire Courts — IndexedDB Offline Mutation Queue
// Used by admin pages to queue score/check-in mutations when offline,
// then replay them when connectivity returns.

const DB_NAME = "inspire-offline-db";
const STORE_NAME = "offline-mutations";
const DB_VERSION = 1;

export interface OfflineMutation {
  id: number;
  url: string;
  method: string;
  body: unknown;
  timestamp: number;
  type: "score" | "checkin";
  status: "pending" | "synced" | "failed";
  error?: string;
}

type MutationInput = {
  url: string;
  method: string;
  body: unknown;
  type: "score" | "checkin";
};

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, {
          keyPath: "id",
          autoIncrement: true,
        });
        store.createIndex("status", "status", { unique: false });
        store.createIndex("type", "type", { unique: false });
        store.createIndex("timestamp", "timestamp", { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/** Queue a mutation for later sync. */
export async function queueMutation(mutation: MutationInput): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).add({
      url: mutation.url,
      method: mutation.method,
      body: mutation.body,
      timestamp: Date.now(),
      type: mutation.type,
      status: "pending",
    });
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

/** Get all pending mutations ordered by timestamp. */
export async function getPendingMutations(): Promise<OfflineMutation[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const index = tx.objectStore(STORE_NAME).index("status");
    const request = index.getAll("pending");
    request.onsuccess = () => {
      db.close();
      const results = (request.result as OfflineMutation[]).sort(
        (a, b) => a.timestamp - b.timestamp
      );
      resolve(results);
    };
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

/** Mark a mutation as synced. */
export async function markSynced(id: number): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const getReq = store.get(id);
    getReq.onsuccess = () => {
      if (getReq.result) {
        store.put({ ...getReq.result, status: "synced" });
      }
    };
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

/** Mark a mutation as failed with an error message. */
export async function markFailed(id: number, error: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const getReq = store.get(id);
    getReq.onsuccess = () => {
      if (getReq.result) {
        store.put({ ...getReq.result, status: "failed", error });
      }
    };
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

/** Replay all pending mutations. Returns count of synced vs failed. */
export async function replayPendingMutations(): Promise<{
  synced: number;
  failed: number;
}> {
  const pending = await getPendingMutations();
  let synced = 0;
  let failed = 0;

  for (const mutation of pending) {
    try {
      const res = await fetch(mutation.url, {
        method: mutation.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mutation.body),
      });
      if (res.ok) {
        await markSynced(mutation.id);
        synced++;
      } else {
        const errText = await res.text().catch(() => res.statusText);
        await markFailed(mutation.id, errText);
        failed++;
      }
    } catch (err) {
      await markFailed(
        mutation.id,
        err instanceof Error ? err.message : "Unknown error"
      );
      failed++;
    }
  }

  return { synced, failed };
}

/** Get count of pending mutations. */
export async function getPendingCount(): Promise<number> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const index = tx.objectStore(STORE_NAME).index("status");
    const request = index.count("pending");
    request.onsuccess = () => {
      db.close();
      resolve(request.result);
    };
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

/** Remove all synced mutations from the store. */
export async function clearSyncedMutations(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const index = store.index("status");
    const request = index.openCursor("synced");
    request.onsuccess = () => {
      const cursor = request.result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

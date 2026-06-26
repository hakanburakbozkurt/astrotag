"use client";

const LS_PROBE = "__astrotag_ls_probe__";
const IDB_PROBE = "__astrotag_idb_probe__";

/**
 * localStorage + IndexedDB erişimini test ederek gizli sekme tespiti.
 */
export async function isPrivateBrowsingMode(): Promise<boolean> {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    window.localStorage.setItem(LS_PROBE, "1");
    window.localStorage.removeItem(LS_PROBE);
  } catch {
    return true;
  }

  if (!window.indexedDB) {
    return true;
  }

  try {
    await new Promise<void>((resolve, reject) => {
      const request = window.indexedDB.open(IDB_PROBE, 1);
      request.onerror = () => reject(new Error("idb-open-failed"));
      request.onsuccess = () => {
        request.result.close();
        window.indexedDB.deleteDatabase(IDB_PROBE);
        resolve();
      };
    });
  } catch {
    return true;
  }

  return false;
}

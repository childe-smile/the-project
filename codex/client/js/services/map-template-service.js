function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("codex-map-templates", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("templates", { keyPath: "id" });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function transact(mode, operation) {
  const database = await openDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const transaction = database.transaction("templates", mode);
      const request = operation(transaction.objectStore("templates"));
      transaction.oncomplete = () => resolve(request.result);
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
  } finally { database.close(); }
}

export const getUploadedMapTemplates = () => transact("readonly", store => store.getAll());
export const saveUploadedMapTemplate = template => transact("readwrite", store => store.put(template));

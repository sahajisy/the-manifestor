interface QueuedAudio {
  id: string;
  userId: string;
  audioFileName: string;
  audioBlob: Blob;
  timestamp: number;
}

let dbPromise: Promise<IDBDatabase> | null = null;

const getDB = (): Promise<IDBDatabase> => {
  if (!dbPromise && typeof window !== 'undefined') {
    dbPromise = new Promise((resolve, reject) => {
      const request = window.indexedDB.open('manifestor-offline-db', 1);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      request.onupgradeneeded = () => {
        request.result.createObjectStore('audioQueue', { keyPath: 'id' });
      };
    });
  }
  return dbPromise || Promise.reject('No window');
};

export const enqueueAudio = async (
  docId: string, 
  userId: string, 
  audioFileName: string, 
  audioBlob: Blob
) => {
  try {
    const db = await getDB();
    const tx = db.transaction('audioQueue', 'readwrite');
    const store = tx.objectStore('audioQueue');
    store.put({
      id: docId,
      userId,
      audioFileName,
      audioBlob,
      timestamp: Date.now()
    });
    return new Promise((resolve, reject) => {
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
  } catch (e) {
    console.error("Failed to enqueue audio", e);
  }
};

export const getQueuedAudio = async (): Promise<QueuedAudio[]> => {
  try {
    const db = await getDB();
    const tx = db.transaction('audioQueue', 'readonly');
    const store = tx.objectStore('audioQueue');
    const request = store.getAll();
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    return [];
  }
};

export const removeQueuedAudio = async (docId: string) => {
  try {
    const db = await getDB();
    const tx = db.transaction('audioQueue', 'readwrite');
    const store = tx.objectStore('audioQueue');
    store.delete(docId);
    return new Promise((resolve, reject) => {
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
  } catch (e) {
    console.error("Failed to remove queued audio", e);
  }
};

import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface ManifestorDB extends DBSchema {
  audioQueue: {
    key: string;
    value: {
      id: string; // The Firestore document ID waiting for this audio
      userId: string;
      audioFileName: string;
      audioBlob: Blob;
      timestamp: number;
    };
  };
}

let dbPromise: Promise<IDBPDatabase<ManifestorDB>> | null = null;

const getDB = () => {
  if (!dbPromise && typeof window !== 'undefined') {
    dbPromise = openDB<ManifestorDB>('manifestor-offline-db', 1, {
      upgrade(db) {
        db.createObjectStore('audioQueue', { keyPath: 'id' });
      },
    });
  }
  return dbPromise;
};

export const enqueueAudio = async (
  docId: string, 
  userId: string, 
  audioFileName: string, 
  audioBlob: Blob
) => {
  const db = await getDB();
  if (!db) return;
  await db.put('audioQueue', {
    id: docId,
    userId,
    audioFileName,
    audioBlob,
    timestamp: Date.now()
  });
};

export const getQueuedAudio = async () => {
  const db = await getDB();
  if (!db) return [];
  return await db.getAll('audioQueue');
};

export const removeQueuedAudio = async (docId: string) => {
  const db = await getDB();
  if (!db) return;
  await db.delete('audioQueue', docId);
};

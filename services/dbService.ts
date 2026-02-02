
import { AnimalProfile, RationItem } from '../types';

const DB_NAME = 'BesiRasyonDB';
const STORE_NAME = 'saved_rations';
const DB_VERSION = 2; // Sürüm yükseltildi

export interface SavedRecord {
  id?: number;
  timestamp: number;
  dateStr: string;
  priceUpdatedDate?: string;
  profile: AnimalProfile;
  ration: RationItem[];
  totals: any;
  requirements: any;
  qualityScore: number;
  aiAnalysisReports?: string[]; // Birden fazla rapor desteği
}

export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const saveRationRecord = async (record: Omit<SavedRecord, 'id'>): Promise<number> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.add(record);

    request.onsuccess = () => resolve(request.result as number);
    request.onerror = () => reject(request.error);
  });
};

export const updateRecord = async (record: SavedRecord) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(record);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const getAllRecords = async (): Promise<SavedRecord[]> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      const sorted = (request.result as SavedRecord[]).sort((a, b) => b.timestamp - a.timestamp);
      resolve(sorted);
    };
    request.onerror = () => reject(request.error);
  });
};

export const deleteRecord = async (id: number) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
};

export const exportDatabase = async (): Promise<string> => {
  const records = await getAllRecords();
  return JSON.stringify(records, null, 2);
};

export const importDatabase = async (jsonString: string): Promise<void> => {
  const db = await initDB();
  const records: SavedRecord[] = JSON.parse(jsonString);
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    store.clear();
    records.forEach(record => {
      const { id, ...dataWithoutId } = record;
      store.add(dataWithoutId);
    });
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
};

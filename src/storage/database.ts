import { openDB, IDBPDatabase } from 'idb';
import { Solve } from '../types/solve';
import { Session } from '../types/session';

const DB_NAME = 'cubert_db';
const DB_VERSION = 1;

export interface CuberTDB {
  solves: {
    key: string;
    value: Solve;
    indexes: {
      by_session: string;
      by_created: number;
    };
  };
  sessions: {
    key: string;
    value: Session;
    indexes: {
      by_created: number;
    };
  };
  settings: {
    key: string;
    value: any;
  };
}

let dbPromise: Promise<IDBPDatabase<CuberTDB>> | null = null;
let useLocalStorageFallback = false;

export async function getDatabase(): Promise<IDBPDatabase<CuberTDB> | null> {
  if (useLocalStorageFallback) return null;
  if (typeof window === 'undefined' || !window.indexedDB) {
    useLocalStorageFallback = true;
    return null;
  }

  if (!dbPromise) {
    dbPromise = openDB<CuberTDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('solves')) {
          const solvesStore = db.createObjectStore('solves', { keyPath: 'id' });
          solvesStore.createIndex('by_session', 'sessionId');
          solvesStore.createIndex('by_created', 'createdAt');
        }
        if (!db.objectStoreNames.contains('sessions')) {
          const sessionsStore = db.createObjectStore('sessions', { keyPath: 'id' });
          sessionsStore.createIndex('by_created', 'createdAt');
        }
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings');
        }
      },
    }).catch((err) => {
      console.warn('IndexedDB failed to open, falling back to localStorage:', err);
      useLocalStorageFallback = true;
      return null as any;
    });
  }

  return dbPromise;
}

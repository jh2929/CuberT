import { getDatabase } from './database';
import { Session } from '../types/session';

const LOCAL_STORAGE_SESSIONS_KEY = 'cubert_sessions';
const LOCAL_STORAGE_ACTIVE_SESSION_KEY = 'cubert_active_session_id';

export const sessionsRepository = {
  async getAll(): Promise<Session[]> {
    const db = await getDatabase();
    if (db) {
      try {
        const sessions = await db.getAllFromIndex('sessions', 'by_created');
        return sessions;
      } catch (e) {
        console.warn('Error reading sessions from IndexedDB:', e);
      }
    }

    try {
      const item = localStorage.getItem(LOCAL_STORAGE_SESSIONS_KEY);
      return item ? JSON.parse(item) : [];
    } catch {
      return [];
    }
  },

  async save(session: Session): Promise<void> {
    const db = await getDatabase();
    if (db) {
      try {
        await db.put('sessions', session);
        return;
      } catch (e) {
        console.warn('Error saving session to IndexedDB:', e);
      }
    }

    const all = await this.getAll();
    const idx = all.findIndex((s) => s.id === session.id);
    if (idx >= 0) {
      all[idx] = session;
    } else {
      all.push(session);
    }
    localStorage.setItem(LOCAL_STORAGE_SESSIONS_KEY, JSON.stringify(all));
  },

  async saveAll(sessions: Session[]): Promise<void> {
    const db = await getDatabase();
    if (db) {
      try {
        const tx = db.transaction('sessions', 'readwrite');
        for (const s of sessions) {
          await tx.store.put(s);
        }
        await tx.done;
        return;
      } catch (e) {
        console.warn('Error batch saving sessions to IndexedDB:', e);
      }
    }

    localStorage.setItem(LOCAL_STORAGE_SESSIONS_KEY, JSON.stringify(sessions));
  },

  async delete(id: string): Promise<void> {
    const db = await getDatabase();
    if (db) {
      try {
        await db.delete('sessions', id);
        return;
      } catch (e) {
        console.warn('Error deleting session from IndexedDB:', e);
      }
    }

    const all = await this.getAll();
    const filtered = all.filter((s) => s.id !== id);
    localStorage.setItem(LOCAL_STORAGE_SESSIONS_KEY, JSON.stringify(filtered));
  },

  getActiveSessionId(): string | null {
    try {
      return localStorage.getItem(LOCAL_STORAGE_ACTIVE_SESSION_KEY);
    } catch {
      return null;
    }
  },

  setActiveSessionId(id: string): void {
    try {
      localStorage.setItem(LOCAL_STORAGE_ACTIVE_SESSION_KEY, id);
    } catch {
      // Ignore
    }
  },

  async clear(): Promise<void> {
    const db = await getDatabase();
    if (db) {
      try {
        await db.clear('sessions');
        return;
      } catch (e) {
        console.warn('Error clearing sessions from IndexedDB:', e);
      }
    }
    localStorage.removeItem(LOCAL_STORAGE_SESSIONS_KEY);
  },
};

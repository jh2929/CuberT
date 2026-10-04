import { getDatabase } from './database';
import { Solve } from '../types/solve';

const LOCAL_STORAGE_SOLVES_KEY = 'cubert_solves';

export const solvesRepository = {
  async getAll(): Promise<Solve[]> {
    const db = await getDatabase();
    if (db) {
      try {
        const solves = await db.getAllFromIndex('solves', 'by_created');
        // Return sorted newest first
        return solves.reverse();
      } catch (e) {
        console.warn('Error reading solves from IndexedDB:', e);
      }
    }

    try {
      const item = localStorage.getItem(LOCAL_STORAGE_SOLVES_KEY);
      return item ? JSON.parse(item) : [];
    } catch {
      return [];
    }
  },

  async getBySession(sessionId: string): Promise<Solve[]> {
    const db = await getDatabase();
    if (db) {
      try {
        const solves = await db.getAllFromIndex('solves', 'by_session', sessionId);
        return solves.sort((a, b) => b.createdAt - a.createdAt);
      } catch (e) {
        console.warn('Error getting session solves from IndexedDB:', e);
      }
    }

    const all = await this.getAll();
    return all.filter((s) => s.sessionId === sessionId);
  },

  async save(solve: Solve): Promise<void> {
    const db = await getDatabase();
    if (db) {
      try {
        await db.put('solves', solve);
        return;
      } catch (e) {
        console.warn('Error saving solve to IndexedDB:', e);
      }
    }

    const all = await this.getAll();
    const existingIdx = all.findIndex((s) => s.id === solve.id);
    if (existingIdx >= 0) {
      all[existingIdx] = solve;
    } else {
      all.unshift(solve);
    }
    localStorage.setItem(LOCAL_STORAGE_SOLVES_KEY, JSON.stringify(all));
  },

  async saveAll(solves: Solve[]): Promise<void> {
    const db = await getDatabase();
    if (db) {
      try {
        const tx = db.transaction('solves', 'readwrite');
        for (const s of solves) {
          tx.store.put(s);
        }
        await tx.done;
      } catch (e) {
        console.warn('Error batch saving solves to IndexedDB:', e);
      }
    }

    try {
      localStorage.setItem(LOCAL_STORAGE_SOLVES_KEY, JSON.stringify(solves));
    } catch (e) {
      console.warn('LocalStorage quota exceeded or unavailable for solves backup:', e);
    }
  },

  async delete(id: string): Promise<void> {
    const db = await getDatabase();
    if (db) {
      try {
        await db.delete('solves', id);
        return;
      } catch (e) {
        console.warn('Error deleting solve from IndexedDB:', e);
      }
    }

    const all = await this.getAll();
    const filtered = all.filter((s) => s.id !== id);
    localStorage.setItem(LOCAL_STORAGE_SOLVES_KEY, JSON.stringify(filtered));
  },

  async clear(): Promise<void> {
    const db = await getDatabase();
    if (db) {
      try {
        await db.clear('solves');
        return;
      } catch (e) {
        console.warn('Error clearing solves from IndexedDB:', e);
      }
    }
    localStorage.removeItem(LOCAL_STORAGE_SOLVES_KEY);
  },
};

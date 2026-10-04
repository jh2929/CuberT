import { getDatabase } from './database';
import { UserSettings, DEFAULT_SETTINGS } from '../types/settings';

const LOCAL_STORAGE_SETTINGS_KEY = 'cubert_settings';

export const settingsRepository = {
  async get(): Promise<UserSettings> {
    const db = await getDatabase();
    if (db) {
      try {
        const stored = await db.get('settings', 'user_settings');
        if (stored) {
          return { ...DEFAULT_SETTINGS, ...stored };
        }
      } catch (e) {
        console.warn('Error reading settings from IndexedDB:', e);
      }
    }

    try {
      const item = localStorage.getItem(LOCAL_STORAGE_SETTINGS_KEY);
      if (item) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(item) };
      }
    } catch {
      // Fallback
    }

    return { ...DEFAULT_SETTINGS };
  },

  async save(settings: UserSettings): Promise<void> {
    const db = await getDatabase();
    if (db) {
      try {
        await db.put('settings', settings, 'user_settings');
        return;
      } catch (e) {
        console.warn('Error saving settings to IndexedDB:', e);
      }
    }

    try {
      localStorage.setItem(LOCAL_STORAGE_SETTINGS_KEY, JSON.stringify(settings));
    } catch {
      // Fallback
    }
  },
};

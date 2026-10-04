import { create } from 'zustand';
import { UserSettings, DEFAULT_SETTINGS } from '../types/settings';
import { settingsRepository } from '../storage/settings.repository';

interface SettingsState {
  settings: UserSettings;
  isLoaded: boolean;
  loadSettings: () => Promise<void>;
  updateSettings: (partial: Partial<UserSettings>) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  isLoaded: false,

  loadSettings: async () => {
    const loaded = await settingsRepository.get();
    set({ settings: loaded, isLoaded: true });
  },

  updateSettings: async (partial: Partial<UserSettings>) => {
    const updated = { ...get().settings, ...partial };
    set({ settings: updated });
    await settingsRepository.save(updated);
  },
}));

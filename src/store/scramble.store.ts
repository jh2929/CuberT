import { create } from 'zustand';
import { CubeEventId } from '../types/event';
import { generateScramble, generateFallbackScramble } from '../features/scrambles/scramble.service';

interface ScrambleState {
  currentScramble: string;
  previousScrambles: string[];
  isGenerating: boolean;
  activeEvent: CubeEventId;

  initScramble: (event: CubeEventId, allowLucky?: boolean, luckyLevel?: number) => Promise<void>;
  generateNextScramble: (event?: CubeEventId, allowLucky?: boolean, luckyLevel?: number) => Promise<string>;
  goToPreviousScramble: () => boolean;
  copyScrambleToClipboard: () => Promise<boolean>;
}

export const useScrambleStore = create<ScrambleState>((set, get) => ({
  currentScramble: '',
  previousScrambles: [],
  isGenerating: false,
  activeEvent: '333',

  initScramble: async (event: CubeEventId, allowLucky = true, luckyLevel = 2) => {
    set({ activeEvent: event, isGenerating: true });
    // Instant fallback first so user never sees blank screen
    const fastScramble = generateFallbackScramble(event);
    set({ currentScramble: fastScramble });

    // Official WCA background enhancement
    generateScramble(event, allowLucky, luckyLevel)
      .then((wcaScramble) => {
        // Only replace if user hasn't started a solve yet and event is still the same
        if (get().activeEvent === event && get().currentScramble === fastScramble) {
          set({ currentScramble: wcaScramble, isGenerating: false });
        }
      })
      .catch(() => {
        set({ isGenerating: false });
      });
  },

  generateNextScramble: async (event?: CubeEventId, allowLucky = true, luckyLevel = 2) => {
    const targetEvent = event || get().activeEvent;
    const { currentScramble, previousScrambles } = get();

    const newHistory = currentScramble
      ? [currentScramble, ...previousScrambles].slice(0, 50)
      : previousScrambles;

    set({ isGenerating: true, previousScrambles: newHistory, activeEvent: targetEvent });

    try {
      const nextScramble = await generateScramble(targetEvent, allowLucky, luckyLevel);
      set({ currentScramble: nextScramble, isGenerating: false });
      return nextScramble;
    } catch {
      const fallback = generateFallbackScramble(targetEvent);
      set({ currentScramble: fallback, isGenerating: false });
      return fallback;
    }
  },

  goToPreviousScramble: () => {
    const { previousScrambles } = get();
    if (previousScrambles.length === 0) return false;

    const [prev, ...rest] = previousScrambles;
    set({
      currentScramble: prev,
      previousScrambles: rest,
    });
    return true;
  },

  copyScrambleToClipboard: async () => {
    const { currentScramble } = get();
    if (!currentScramble) return false;
    try {
      await navigator.clipboard.writeText(currentScramble);
      return true;
    } catch {
      return false;
    }
  },
}));

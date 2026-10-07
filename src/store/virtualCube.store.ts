import { create } from 'zustand';
import { CubeState, KeyMappingConfig } from '../features/virtualCube/cube.types';
import { CubeEngine } from '../features/virtualCube/cube.engine';
import { createSolvedState } from '../features/virtualCube/cube.state';
import { getInverseMove } from '../features/virtualCube/cube.moves';
import {
  loadKeybindings,
  saveKeybindings,
  resetKeybindingsStorage,
} from '../features/virtualCube/cube.utils';
import { generateScramble } from '../features/scrambles/scramble.service';

interface VirtualCubeStoreState {
  cube: CubeState;
  history: string[];
  undoneHistory: string[];
  activeScramble: string | null;
  keyMappings: KeyMappingConfig;
  isCustomizingKeys: boolean;
  isEngineReady: boolean;

  // Actions
  initEngine: () => Promise<void>;
  move: (moveStr: string) => void;
  scramble: () => Promise<string>;
  applyScramble: (scrambleStr: string) => void;
  solve: () => void;
  reset: () => void;
  undo: () => boolean;
  redo: () => boolean;
  clearHistory: () => void;
  updateKeyMapping: (key: string, move: string) => void;
  resetKeyMappings: () => void;
  setCustomizingKeys: (val: boolean) => void;
  isSolved: () => boolean;
}

const engine = new CubeEngine();

export const useVirtualCubeStore = create<VirtualCubeStoreState>((set, get) => ({
  cube: createSolvedState(),
  history: [],
  undoneHistory: [],
  activeScramble: null,
  keyMappings: loadKeybindings(),
  isCustomizingKeys: false,
  isEngineReady: false,

  initEngine: async () => {
    await engine.init();
    set({
      cube: engine.getState(),
      isEngineReady: true,
    });
  },

  move: (moveStr: string) => {
    const newState = engine.applyMove(moveStr);
    set((state) => ({
      cube: newState,
      history: [...state.history, moveStr],
      undoneHistory: [], // clear redo branch upon new move
    }));
  },

  scramble: async () => {
    const scrambleStr = await generateScramble('333', false);
    get().applyScramble(scrambleStr);
    return scrambleStr;
  },

  applyScramble: (scrambleStr: string) => {
    const newState = engine.scramble(scrambleStr);
    set({
      cube: newState,
      activeScramble: scrambleStr,
      history: [],
      undoneHistory: [],
    });
  },

  solve: () => {
    const newState = engine.solve();
    set({
      cube: newState,
      history: [],
      undoneHistory: [],
      activeScramble: null,
    });
  },

  reset: () => {
    const newState = engine.reset();
    set({
      cube: newState,
      history: [],
      undoneHistory: [],
      activeScramble: null,
    });
  },

  undo: () => {
    const { history } = get();
    if (history.length === 0) return false;

    const lastMove = history[history.length - 1];
    const inverse = getInverseMove(lastMove);
    const newState = engine.applyMove(inverse);

    set((state) => ({
      cube: newState,
      history: state.history.slice(0, -1),
      undoneHistory: [lastMove, ...state.undoneHistory],
    }));

    return true;
  },

  redo: () => {
    const { undoneHistory } = get();
    if (undoneHistory.length === 0) return false;

    const [nextMove, ...rest] = undoneHistory;
    const newState = engine.applyMove(nextMove);

    set((state) => ({
      cube: newState,
      history: [...state.history, nextMove],
      undoneHistory: rest,
    }));

    return true;
  },

  clearHistory: () => {
    set({ history: [], undoneHistory: [] });
  },

  updateKeyMapping: (key: string, move: string) => {
    const updated = { ...get().keyMappings, [key.toLowerCase()]: move };
    saveKeybindings(updated);
    set({ keyMappings: updated });
  },

  resetKeyMappings: () => {
    const defaults = resetKeybindingsStorage();
    set({ keyMappings: defaults });
  },

  setCustomizingKeys: (val: boolean) => {
    set({ isCustomizingKeys: val });
  },

  isSolved: () => {
    return engine.isSolved();
  },
}));

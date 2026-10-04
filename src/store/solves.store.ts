import { create } from 'zustand';
import { Solve, Penalty } from '../types/solve';
import { CubeEventId } from '../types/event';
import { solvesRepository } from '../storage/solves.repository';
import { generateId } from '../utils/generateId';
import { checkForNewPB, calculatePersonalBests, NewPBNotification } from '../features/statistics/pb';

interface SolvesState {
  solves: Solve[];
  isLoaded: boolean;
  lastDeletedSolve: Solve | null;
  newPBNotification: NewPBNotification | null;
  showBackupReminder: boolean;

  loadSolves: () => Promise<void>;
  addSolve: (params: {
    rawTime: number;
    penalty: Penalty;
    scramble: string;
    event: CubeEventId;
    sessionId: string;
    note?: string;
    backupInterval?: number;
    lastBackupCount?: number;
  }) => Promise<Solve>;
  updatePenalty: (id: string, penalty: Penalty) => Promise<void>;
  updateNote: (id: string, note: string) => Promise<void>;
  deleteSolve: (id: string) => Promise<void>;
  undoDeleteSolve: () => Promise<Solve | null>;
  clearSessionSolves: (sessionId: string) => Promise<void>;
  clearNewPBNotification: () => void;
  dismissBackupReminder: () => void;
  setAllSolves: (solves: Solve[]) => Promise<void>;
}

export const useSolvesStore = create<SolvesState>((set, get) => ({
  solves: [],
  isLoaded: false,
  lastDeletedSolve: null,
  newPBNotification: null,
  showBackupReminder: false,

  loadSolves: async () => {
    const all = await solvesRepository.getAll();
    set({ solves: all, isLoaded: true });
  },

  addSolve: async ({
    rawTime,
    penalty,
    scramble,
    event,
    sessionId,
    note,
    backupInterval = 100,
    lastBackupCount = 0,
  }) => {
    let finalTime: number | null = rawTime;
    if (penalty === '+2') {
      finalTime = rawTime + 2000;
    } else if (penalty === 'DNF') {
      finalTime = null;
    }

    const newSolve: Solve = {
      id: generateId(),
      sessionId,
      event,
      rawTime,
      finalTime,
      penalty,
      scramble,
      createdAt: Date.now(),
      note,
    };

    const currentSolves = get().solves;
    const sessionSolves = currentSolves.filter((s) => s.sessionId === sessionId);
    const previousPBs = calculatePersonalBests(sessionSolves);

    const updated = [newSolve, ...currentSolves];
    set({ solves: updated, lastDeletedSolve: null });

    // Check for PB in this session
    const updatedSessionSolves = [newSolve, ...sessionSolves];
    const pbNotice = checkForNewPB(previousPBs, newSolve, updatedSessionSolves);
    if (pbNotice) {
      set({ newPBNotification: pbNotice });
    }

    // Check backup reminder
    if (backupInterval > 0 && updated.length - lastBackupCount >= backupInterval) {
      set({ showBackupReminder: true });
    }

    await solvesRepository.save(newSolve);
    return newSolve;
  },

  updatePenalty: async (id: string, penalty: Penalty) => {
    const solves = get().solves;
    const target = solves.find((s) => s.id === id);
    if (!target) return;

    let finalTime: number | null = target.rawTime;
    if (penalty === '+2') {
      finalTime = target.rawTime + 2000;
    } else if (penalty === 'DNF') {
      finalTime = null;
    }

    const updatedSolve: Solve = {
      ...target,
      penalty,
      finalTime,
    };

    const updatedList = solves.map((s) => (s.id === id ? updatedSolve : s));
    set({ solves: updatedList });
    await solvesRepository.save(updatedSolve);
  },

  updateNote: async (id: string, note: string) => {
    const solves = get().solves;
    const target = solves.find((s) => s.id === id);
    if (!target) return;

    const updatedSolve: Solve = {
      ...target,
      note: note.trim() || undefined,
    };

    const updatedList = solves.map((s) => (s.id === id ? updatedSolve : s));
    set({ solves: updatedList });
    await solvesRepository.save(updatedSolve);
  },

  deleteSolve: async (id: string) => {
    const solves = get().solves;
    const target = solves.find((s) => s.id === id);
    if (!target) return;

    const remaining = solves.filter((s) => s.id !== id);
    set({ solves: remaining, lastDeletedSolve: target });
    await solvesRepository.delete(id);
  },

  undoDeleteSolve: async () => {
    const target = get().lastDeletedSolve;
    if (!target) return null;

    const updated = [target, ...get().solves].sort((a, b) => b.createdAt - a.createdAt);
    set({ solves: updated, lastDeletedSolve: null });
    await solvesRepository.save(target);
    return target;
  },

  clearSessionSolves: async (sessionId: string) => {
    const remaining = get().solves.filter((s) => s.sessionId !== sessionId);
    set({ solves: remaining });
    // In db, save remaining
    await solvesRepository.saveAll(remaining);
  },

  clearNewPBNotification: () => {
    set({ newPBNotification: null });
  },

  dismissBackupReminder: () => {
    set({ showBackupReminder: false });
  },

  setAllSolves: async (newSolves: Solve[]) => {
    set({ solves: newSolves });
    await solvesRepository.saveAll(newSolves);
  },
}));

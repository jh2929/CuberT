import { create } from 'zustand';
import { Session } from '../types/session';
import { CubeEventId } from '../types/event';
import { sessionsRepository } from '../storage/sessions.repository';
import { generateId } from '../utils/generateId';

interface SessionsState {
  sessions: Session[];
  activeSessionId: string | null;
  isLoaded: boolean;

  loadSessions: () => Promise<void>;
  createSession: (name: string, event: CubeEventId) => Promise<Session>;
  renameSession: (id: string, newName: string) => Promise<void>;
  updateSessionEvent: (id: string, event: CubeEventId) => Promise<void>;
  setActiveSession: (id: string) => void;
  deleteSession: (id: string) => Promise<void>;
  setAllSessions: (sessions: Session[], newActiveId?: string) => Promise<void>;
}

export const useSessionsStore = create<SessionsState>((set, get) => ({
  sessions: [],
  activeSessionId: null,
  isLoaded: false,

  loadSessions: async () => {
    let storedSessions = await sessionsRepository.getAll();

    if (storedSessions.length === 0) {
      const defaultSession: Session = {
        id: generateId(),
        name: 'Session 1',
        event: '333',
        createdAt: Date.now(),
      };
      await sessionsRepository.save(defaultSession);
      storedSessions = [defaultSession];
    }

    const savedActiveId = sessionsRepository.getActiveSessionId();
    const activeExists = storedSessions.some((s) => s.id === savedActiveId);
    const initialActiveId = activeExists && savedActiveId ? savedActiveId : storedSessions[0].id;

    sessionsRepository.setActiveSessionId(initialActiveId);

    set({
      sessions: storedSessions,
      activeSessionId: initialActiveId,
      isLoaded: true,
    });
  },

  createSession: async (name: string, event: CubeEventId) => {
    const newSession: Session = {
      id: generateId(),
      name: name.trim() || `Session ${get().sessions.length + 1}`,
      event,
      createdAt: Date.now(),
    };

    const updated = [...get().sessions, newSession];
    set({ sessions: updated, activeSessionId: newSession.id });
    sessionsRepository.setActiveSessionId(newSession.id);
    await sessionsRepository.save(newSession);
    return newSession;
  },

  renameSession: async (id: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) return;

    const updated = get().sessions.map((s) => (s.id === id ? { ...s, name: trimmed } : s));
    const target = updated.find((s) => s.id === id);
    set({ sessions: updated });
    if (target) {
      await sessionsRepository.save(target);
    }
  },

  updateSessionEvent: async (id: string, event: CubeEventId) => {
    const updated = get().sessions.map((s) => (s.id === id ? { ...s, event } : s));
    const target = updated.find((s) => s.id === id);
    set({ sessions: updated });
    if (target) {
      await sessionsRepository.save(target);
    }
  },

  setActiveSession: (id: string) => {
    set({ activeSessionId: id });
    sessionsRepository.setActiveSessionId(id);
  },

  deleteSession: async (id: string) => {
    const { sessions, activeSessionId } = get();
    if (sessions.length <= 1) {
      // Cannot delete the only session
      return;
    }

    const remaining = sessions.filter((s) => s.id !== id);
    let nextActiveId = activeSessionId;
    if (activeSessionId === id) {
      nextActiveId = remaining[0].id;
      sessionsRepository.setActiveSessionId(nextActiveId);
    }

    set({ sessions: remaining, activeSessionId: nextActiveId });
    await sessionsRepository.delete(id);
  },

  setAllSessions: async (newSessions: Session[], newActiveId?: string) => {
    const targetActiveId = newActiveId || (newSessions.length > 0 ? newSessions[0].id : null);
    set({ sessions: newSessions, activeSessionId: targetActiveId });
    if (targetActiveId) {
      sessionsRepository.setActiveSessionId(targetActiveId);
    }
    await sessionsRepository.saveAll(newSessions);
  },
}));

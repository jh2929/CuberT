import { useEffect } from 'react';
import { TimerState } from '../features/timer/timer.machine';

export interface ShortcutHandlers {
  onNewScramble?: () => void;
  onUndo?: () => void;
  onToggleDNF?: () => void;
  onTogglePlusTwo?: () => void;
  onClearPenalty?: () => void;
  onToggleFocusMode?: () => void;
  onEscape?: () => void;
  timerState: TimerState;
  hasOpenModal?: boolean;
  isVirtualCubeActive?: boolean;
}

export function useKeyboardShortcuts({
  onNewScramble,
  onUndo,
  onToggleDNF,
  onTogglePlusTwo,
  onClearPenalty,
  onToggleFocusMode,
  onEscape,
  timerState,
  hasOpenModal = false,
  isVirtualCubeActive = false,
}: ShortcutHandlers) {
  useEffect(() => {
    const isInputElement = (target: EventTarget | null) => {
      if (!target || !(target instanceof HTMLElement)) return false;
      const tag = target.tagName.toLowerCase();
      return tag === 'input' || tag === 'textarea' || tag === 'select' || target.isContentEditable;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isInputElement(e.target)) return;

      if (e.key === 'Escape') {
        if (onEscape) {
          e.preventDefault();
          onEscape();
        }
        return;
      }

      // If a modal is open, virtual cube is active, or timer is active, do not execute global action shortcuts
      if (
        hasOpenModal ||
        isVirtualCubeActive ||
        timerState === 'holding' ||
        timerState === 'ready' ||
        timerState === 'running'
      ) {
        return;
      }

      const key = e.key.toLowerCase();

      if (key === 'f' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        onToggleFocusMode?.();
      } else if (key === 'r' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        onNewScramble?.();
      } else if (key === 'z' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        onUndo?.();
      } else if (key === 'd' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        onToggleDNF?.();
      } else if (key === '2') {
        e.preventDefault();
        onTogglePlusTwo?.();
      } else if (key === '0') {
        e.preventDefault();
        onClearPenalty?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    onNewScramble,
    onUndo,
    onToggleDNF,
    onTogglePlusTwo,
    onClearPenalty,
    onToggleFocusMode,
    onEscape,
    timerState,
    hasOpenModal,
    isVirtualCubeActive,
  ]);
}

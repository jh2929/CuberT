import { useState, useRef, useEffect, useCallback } from 'react';
import { TimerState } from './timer.machine';
import { Penalty } from '../../types/solve';

export interface UseTimerOptions {
  holdDelay?: number; // ms, default 500
  inspectionEnabled?: boolean;
  onFinishSolve: (timeMs: number, penalty: Penalty) => void;
  disabled?: boolean;
}

export function useTimer({
  holdDelay = 500,
  inspectionEnabled = false,
  onFinishSolve,
  disabled = false,
}: UseTimerOptions) {
  const [state, setState] = useState<TimerState>('idle');
  const [elapsed, setElapsed] = useState<number>(0);
  const [inspectionCountdown, setInspectionCountdown] = useState<number>(15);
  const [inspectionPenalty, setInspectionPenalty] = useState<Penalty>('none');

  const stateRef = useRef<TimerState>('idle');

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const startTimeRef = useRef<number | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const holdTimeoutRef = useRef<number | null>(null);
  const inspectionIntervalRef = useRef<number | null>(null);
  const inspectionStartRef = useRef<number | null>(null);
  const inspectionPenaltyRef = useRef<Penalty>('none');
  const spacePressedRef = useRef<boolean>(false);
  const justStartedTimeRef = useRef<number>(0);

  // Stop running timer
  const stopTimer = useCallback(() => {
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }

    if (startTimeRef.current !== null) {
      const finalElapsed = Math.round(performance.now() - startTimeRef.current);
      setElapsed(finalElapsed);
      setState('stopped');
      onFinishSolve(finalElapsed, inspectionPenaltyRef.current);
      startTimeRef.current = null;
    }
  }, [onFinishSolve]);

  // Start running timer
  const startTimer = useCallback(() => {
    if (inspectionIntervalRef.current) {
      clearInterval(inspectionIntervalRef.current);
      inspectionIntervalRef.current = null;
    }

    const now = performance.now();
    startTimeRef.current = now;
    justStartedTimeRef.current = now;
    setState('running');

    const tick = () => {
      if (startTimeRef.current !== null) {
        setElapsed(Math.round(performance.now() - startTimeRef.current));
        rafIdRef.current = requestAnimationFrame(tick);
      }
    };
    rafIdRef.current = requestAnimationFrame(tick);
  }, []);

  // Start inspection countdown
  const startInspection = useCallback(() => {
    setState('inspection');
    setInspectionCountdown(15);
    setInspectionPenalty('none');
    inspectionPenaltyRef.current = 'none';
    inspectionStartRef.current = Date.now();

    if (inspectionIntervalRef.current) {
      clearInterval(inspectionIntervalRef.current);
    }

    inspectionIntervalRef.current = window.setInterval(() => {
      if (inspectionStartRef.current === null) return;
      const passedSec = Math.floor((Date.now() - inspectionStartRef.current) / 1000);
      const remaining = 15 - passedSec;

      if (remaining > 0) {
        setInspectionCountdown(remaining);
        inspectionPenaltyRef.current = 'none';
        setInspectionPenalty('none');
      } else if (remaining >= -2) {
        // 15-17 seconds -> +2 penalty
        setInspectionCountdown(0);
        inspectionPenaltyRef.current = '+2';
        setInspectionPenalty('+2');
      } else {
        // > 17 seconds -> DNF
        setInspectionCountdown(0);
        inspectionPenaltyRef.current = 'DNF';
        setInspectionPenalty('DNF');
      }
    }, 200);
  }, []);

  // Cancel hold
  const cancelHold = useCallback(() => {
    if (holdTimeoutRef.current) {
      clearTimeout(holdTimeoutRef.current);
      holdTimeoutRef.current = null;
    }
    if (stateRef.current === 'holding') {
      setState(inspectionEnabled && inspectionStartRef.current !== null ? 'inspection' : 'idle');
    }
  }, [inspectionEnabled]);

  // Reset to idle
  const resetTimer = useCallback(() => {
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    if (holdTimeoutRef.current) {
      clearTimeout(holdTimeoutRef.current);
      holdTimeoutRef.current = null;
    }
    if (inspectionIntervalRef.current) {
      clearInterval(inspectionIntervalRef.current);
      inspectionIntervalRef.current = null;
    }
    inspectionStartRef.current = null;
    startTimeRef.current = null;
    setState('idle');
    setElapsed(0);
    setInspectionCountdown(15);
    setInspectionPenalty('none');
    inspectionPenaltyRef.current = 'none';
    spacePressedRef.current = false;
  }, []);

  // Handle key down or touch down
  const handleTriggerDown = useCallback(() => {
    if (disabled) return;
    const currentState = stateRef.current;

    if (currentState === 'running') {
      stopTimer();
      return;
    }

    if (currentState === 'stopped' || currentState === 'idle') {
      if (inspectionEnabled) {
        startInspection();
        return;
      }
      // Start holding immediately on first press
      setState('holding');
      holdTimeoutRef.current = window.setTimeout(() => {
        setState('ready');
      }, holdDelay);
      return;
    }

    if (currentState === 'inspection') {
      setState('holding');
      holdTimeoutRef.current = window.setTimeout(() => {
        setState('ready');
      }, holdDelay);
      return;
    }
  }, [disabled, inspectionEnabled, holdDelay, startInspection, stopTimer]);

  // Handle key up or touch up
  const handleTriggerUp = useCallback(() => {
    if (disabled) return;
    const currentState = stateRef.current;

    if (currentState === 'holding') {
      // Released before holdDelay completed
      cancelHold();
      return;
    }

    if (currentState === 'ready') {
      // Start timer!
      startTimer();
      return;
    }
  }, [disabled, cancelHold, startTimer]);

  // Keyboard listener
  useEffect(() => {
    const isInputElement = (target: EventTarget | null) => {
      if (!target || !(target instanceof HTMLElement)) return false;
      const tag = target.tagName.toLowerCase();
      return tag === 'input' || tag === 'textarea' || tag === 'select' || target.isContentEditable;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isInputElement(e.target)) return;

      if (e.code === 'Space') {
        e.preventDefault(); // Prevent scroll!
        if (e.repeat) return; // Prevent key repeat events!
        if (!spacePressedRef.current) {
          spacePressedRef.current = true;
          handleTriggerDown();
        }
      } else if (e.code === 'Escape') {
        e.preventDefault();
        if (stateRef.current === 'holding' || stateRef.current === 'ready' || stateRef.current === 'inspection') {
          resetTimer();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (isInputElement(e.target)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        spacePressedRef.current = false;
        handleTriggerUp();
      }
    };

    window.addEventListener('keydown', handleKeyDown, { passive: false });
    window.addEventListener('keyup', handleKeyUp, { passive: false });

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      if (holdTimeoutRef.current) clearTimeout(holdTimeoutRef.current);
      if (inspectionIntervalRef.current) clearInterval(inspectionIntervalRef.current);
    };
  }, [handleTriggerDown, handleTriggerUp, resetTimer]);

  return {
    state,
    elapsed,
    inspectionCountdown,
    inspectionPenalty,
    handleTriggerDown,
    handleTriggerUp,
    resetTimer,
  };
}

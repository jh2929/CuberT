import { useRef, useCallback } from 'react';

export function useSound(enabled: boolean) {
  const audioCtxRef = useRef<AudioContext | null>(null);

  const getAudioContext = useCallback(() => {
    if (!audioCtxRef.current && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        audioCtxRef.current = new AudioCtx();
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  const playTone = useCallback(
    (freq: number, durationSec: number, type: OscillatorType = 'sine', gainVal = 0.05) => {
      if (!enabled) return;
      try {
        const ctx = getAudioContext();
        if (!ctx) return;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);

        gain.gain.setValueAtTime(gainVal, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + durationSec);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + durationSec);
      } catch {
        // Audio error ignored
      }
    },
    [enabled, getAudioContext]
  );

  const playReadyChime = useCallback(() => {
    playTone(587.33, 0.12, 'sine', 0.06); // D5
  }, [playTone]);

  const playInspectionWarning = useCallback(() => {
    playTone(440, 0.15, 'sine', 0.08); // A4
  }, [playTone]);

  return {
    playReadyChime,
    playInspectionWarning,
  };
}

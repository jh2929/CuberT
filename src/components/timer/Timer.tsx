import React, { useRef } from 'react';
import { TimerDisplay } from './TimerDisplay';
import { TimerStatus } from './TimerStatus';
import { TimerState } from '../../features/timer/timer.machine';
import { TimerPrecision } from '../../types/settings';
import { Penalty } from '../../types/solve';

interface TimerProps {
  elapsed: number;
  state: TimerState;
  inspectionCountdown: number;
  inspectionPenalty: Penalty;
  precision: TimerPrecision;
  inspectionEnabled: boolean;
  onTriggerDown: () => void;
  onTriggerUp: () => void;
}

export const Timer: React.FC<TimerProps> = ({
  elapsed,
  state,
  inspectionCountdown,
  inspectionPenalty,
  precision,
  inspectionEnabled,
  onTriggerDown,
  onTriggerUp,
}) => {
  const isPointerDownRef = useRef(false);

  const handlePointerDown = (e: React.PointerEvent) => {
    // Only respond to primary mouse click or touch
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    isPointerDownRef.current = true;
    onTriggerDown();
  };

  const handlePointerUp = () => {
    if (isPointerDownRef.current) {
      isPointerDownRef.current = false;
      onTriggerUp();
    }
  };

  const isRunning = state === 'running';

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      className={`w-full flex flex-col items-center justify-center cursor-pointer select-none focus:outline-none touch-none transition-all duration-150 ${
        isRunning
          ? 'fixed inset-0 z-40 bg-[#F5F5F7] dark:bg-[#000000] p-0 m-0'
          : 'flex-1 py-8 md:py-16'
      }`}
      role="button"
      tabIndex={0}
      aria-label="Cronómetro de cubos"
    >
      <div className="flex flex-col items-center justify-center pointer-events-none">
        <TimerDisplay
          elapsed={elapsed}
          state={state}
          inspectionCountdown={inspectionCountdown}
          inspectionPenalty={inspectionPenalty}
          precision={precision}
        />
        {!isRunning && (
          <div className="mt-3 md:mt-4">
            <TimerStatus
              state={state}
              inspectionPenalty={inspectionPenalty}
              inspectionEnabled={inspectionEnabled}
            />
          </div>
        )}
      </div>
    </div>
  );
};


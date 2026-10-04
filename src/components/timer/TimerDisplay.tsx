import React from 'react';
import { TimerState } from '../../features/timer/timer.machine';
import { formatTime } from '../../utils/formatTime';
import { TimerPrecision } from '../../types/settings';
import { Penalty } from '../../types/solve';

interface TimerDisplayProps {
  elapsed: number;
  state: TimerState;
  inspectionCountdown: number;
  inspectionPenalty: Penalty;
  precision: TimerPrecision;
}

export const TimerDisplay: React.FC<TimerDisplayProps> = ({
  elapsed,
  state,
  inspectionCountdown,
  inspectionPenalty,
  precision,
}) => {
  // If in inspection, show inspection countdown
  if (state === 'inspection') {
    let colorClass = 'text-amber-500 dark:text-amber-400';
    if (inspectionPenalty === '+2') {
      colorClass = 'text-orange-500 dark:text-orange-400';
    } else if (inspectionPenalty === 'DNF') {
      colorClass = 'text-red-500 dark:text-red-400';
    }

    return (
      <div className={`font-mono-numbers text-7xl sm:text-8xl md:text-9xl font-bold tracking-tight select-none transition-colors duration-100 ${colorClass}`}>
        {inspectionPenalty === 'DNF'
          ? 'DNF'
          : inspectionPenalty === '+2'
          ? '+2'
          : inspectionCountdown}
      </div>
    );
  }

  // Display time
  const timeFormatted = formatTime(elapsed, 'none', { precision });

  // State color mapping
  let colorClass = 'text-neutral-900 dark:text-[#F5F5F7]';
  if (state === 'holding') {
    colorClass = 'text-[#FF9F0A] drop-shadow-[0_0_24px_rgba(255,159,10,0.35)]';
  } else if (state === 'ready') {
    colorClass = 'text-[#00FF66] dark:text-[#10E364] drop-shadow-[0_0_35px_rgba(16,227,100,0.5)]';
  }

  return (
    <div
      className={`font-mono-numbers text-6xl sm:text-7xl md:text-8xl lg:text-[112px] xl:text-[128px] font-semibold tracking-tight select-none leading-none transition-all duration-150 ${colorClass}`}
    >
      {timeFormatted}
    </div>
  );
};

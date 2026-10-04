import React from 'react';
import { TimerState } from '../../features/timer/timer.machine';
import { Penalty } from '../../types/solve';

interface TimerStatusProps {
  state: TimerState;
  inspectionPenalty: Penalty;
  inspectionEnabled: boolean;
}

export const TimerStatus: React.FC<TimerStatusProps> = ({
  state,
  inspectionPenalty,
  inspectionEnabled,
}) => {
  if (state === 'running') {
    // Hide status completely while running to prevent distractions
    return null;
  }

  let text = '';
  let color = 'text-neutral-400 dark:text-neutral-500';

  switch (state) {
    case 'idle':
      text = inspectionEnabled ? 'Presiona SPACE para inspección' : 'Mantén SPACE para iniciar';
      break;
    case 'inspection':
      if (inspectionPenalty === 'DNF') {
        text = 'Límite de inspección superado (DNF)';
        color = 'text-red-500';
      } else if (inspectionPenalty === '+2') {
        text = 'Inspección >15s (Penalización +2)';
        color = 'text-orange-500';
      } else {
        text = 'Inspección — mantén SPACE cuando estés listo';
        color = 'text-amber-500';
      }
      break;
    case 'holding':
      text = 'Preparando...';
      color = 'text-amber-500';
      break;
    case 'ready':
      text = '¡Listo! Suelta para cronometrar';
      color = 'text-[#00FF66] dark:text-[#10E364] font-semibold drop-shadow-[0_0_12px_rgba(16,227,100,0.4)]';
      break;
    case 'stopped':
      text = 'Solución guardada • Presiona SPACE para continuar';
      break;
  }

  return (
    <div className={`h-6 text-xs sm:text-sm tracking-wide text-center select-none transition-colors duration-150 ${color}`}>
      {text}
    </div>
  );
};

import React from 'react';
import { Solve } from '../../types/solve';
import { TimerPrecision } from '../../types/settings';

interface SolveDeltaBadgeProps {
  sessionSolves: Solve[];
  precision: TimerPrecision;
  className?: string;
}

export const SolveDeltaBadge: React.FC<SolveDeltaBadgeProps> = ({
  sessionSolves,
  precision,
  className = '',
}) => {
  if (sessionSolves.length < 2) {
    return null;
  }

  const current = sessionSolves[0];
  const previous = sessionSolves[1];

  // If current was DNF, it is always worse
  if (current.penalty === 'DNF' || current.finalTime === null) {
    return (
      <div
        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-rose-500/10 dark:bg-rose-500/15 border border-rose-500/20 text-rose-600 dark:text-rose-400 font-mono font-bold text-sm tracking-tight shadow-xs select-none ${className}`}
        title="Diferencia con respecto al solve anterior (DNF)"
        aria-label="Diferencia con el solve anterior: DNF"
      >
        <span>(+DNF)</span>
      </div>
    );
  }

  // If previous was DNF and current is valid, it is an improvement
  if (previous.penalty === 'DNF' || previous.finalTime === null) {
    return (
      <div
        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/20 text-emerald-600 dark:text-[#10E364] font-mono font-bold text-sm tracking-tight shadow-xs select-none ${className}`}
        title="Diferencia con respecto al solve anterior (Mejora tras DNF)"
        aria-label="Diferencia con el solve anterior: Mejora tras DNF"
      >
        <span>(-OK)</span>
      </div>
    );
  }

  const diffMs = current.finalTime - previous.finalTime;
  const diffSec = diffMs / 1000;
  const absFormatted = Math.abs(diffSec).toFixed(precision);

  const isWorse = diffMs > 0;
  const isBetter = diffMs < 0;

  if (isWorse) {
    return (
      <div
        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-rose-500/10 dark:bg-rose-500/15 border border-rose-500/20 text-rose-600 dark:text-rose-400 font-mono font-bold text-sm md:text-base tracking-tight shadow-xs select-none transition-all duration-200 ${className}`}
        title={`Peor por ${absFormatted}s respecto al anterior`}
        aria-label={`Diferencia con el solve anterior: más ${absFormatted} segundos`}
      >
        <span>(+{absFormatted})</span>
      </div>
    );
  }

  if (isBetter) {
    return (
      <div
        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#00FF66]/10 dark:bg-[#10E364]/15 border border-[#00FF66]/30 dark:border-[#10E364]/30 text-emerald-600 dark:text-[#10E364] font-mono font-bold text-sm md:text-base tracking-tight shadow-xs select-none transition-all duration-200 ${className}`}
        title={`Mejor por ${absFormatted}s respecto al anterior`}
        aria-label={`Diferencia con el solve anterior: menos ${absFormatted} segundos`}
      >
        <span>(-{absFormatted})</span>
      </div>
    );
  }

  // Identical time
  return (
    <div
      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-neutral-500/10 border border-neutral-500/20 text-neutral-500 dark:text-neutral-400 font-mono font-bold text-sm md:text-base tracking-tight select-none ${className}`}
      title="Mismo tiempo que el solve anterior"
      aria-label="Diferencia con el solve anterior: igual tiempo"
    >
      <span>(±{absFormatted})</span>
    </div>
  );
};

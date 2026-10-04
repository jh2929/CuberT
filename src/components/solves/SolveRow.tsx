import React from 'react';
import { Solve } from '../../types/solve';
import { formatTime } from '../../utils/formatTime';
import { TimerPrecision } from '../../types/settings';

interface SolveRowProps {
  solve: Solve;
  index: number;
  totalCount: number;
  precision: TimerPrecision;
  onClick: (solve: Solve) => void;
}

export const SolveRow: React.FC<SolveRowProps> = ({
  solve,
  index,
  totalCount,
  precision,
  onClick,
}) => {
  const solveNumber = totalCount - index;

  let timeDisplay = formatTime(solve.finalTime, solve.penalty, { precision });
  let badgeColor = 'text-neutral-900 dark:text-neutral-100';

  if (solve.penalty === 'DNF') {
    badgeColor = 'text-red-500 font-semibold';
  } else if (solve.penalty === '+2') {
    badgeColor = 'text-amber-500 font-semibold';
  }

  return (
    <button
      onClick={() => onClick(solve)}
      type="button"
      className="w-full flex items-center justify-between px-3.5 py-1.5 rounded-xl hover:bg-black/[0.04] dark:hover:bg-white/[0.06] active:bg-black/[0.06] dark:active:bg-white/[0.09] transition-all text-left group focus:outline-none focus-visible:ring-1 focus-visible:ring-white/20"
    >
      <div className="flex items-center gap-2.5">
        <span className="font-mono text-[11px] text-neutral-400 dark:text-neutral-500 w-8 group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors">
          #{solveNumber}
        </span>
        {solve.note && (
          <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shadow-[0_0_6px_rgba(56,189,248,0.6)]" title="Tiene nota" />
        )}
      </div>

      <div className="flex items-center gap-1.5 font-mono text-xs">
        <span className={`${badgeColor} transition-colors group-hover:translate-x-[-2px]`}>{timeDisplay}</span>
        {solve.penalty === '+2' && (
          <span className="text-[10px] text-amber-400 font-medium px-1 rounded bg-amber-400/10">+2</span>
        )}
      </div>
    </button>
  );
};

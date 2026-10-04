import React from 'react';
import { formatTime } from '../../utils/formatTime';
import { SessionStats } from '../../features/statistics/statistics';
import { TimerPrecision } from '../../types/settings';

interface QuickStatsProps {
  stats: SessionStats;
  precision: TimerPrecision;
  onOpenStatsModal: () => void;
}

export const QuickStats: React.FC<QuickStatsProps> = ({
  stats,
  precision,
  onOpenStatsModal,
}) => {
  const items = [
    { label: 'PB', value: stats.pbSingle, isPB: true },
    { label: 'Ao5', value: stats.ao5, isPB: false },
    { label: 'Ao12', value: stats.ao12, isPB: false },
    { label: 'Ao100', value: stats.ao100, isPB: false },
  ];

  return (
    <div
      onClick={onOpenStatsModal}
      className="inline-flex items-center justify-center rounded-2xl bg-white/70 dark:bg-[#121215]/80 backdrop-blur-xl border border-black/[0.06] dark:border-white/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_28px_rgba(0,0,0,0.5)] transition-all duration-200 cursor-pointer group hover:border-black/[0.12] dark:hover:border-white/[0.16] hover:scale-[1.01] divide-x divide-black/[0.04] dark:divide-white/[0.06] overflow-hidden"
      title="Click para ver estadísticas detalladas y gráficos"
      role="button"
      tabIndex={0}
    >
      {items.map((item) => (
        <div key={item.label} className="flex flex-col items-center px-4 sm:px-7 md:px-9 py-2.5 sm:py-3 transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.03]">
          <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors">
            {item.label}
          </span>
          <span className={`font-mono-numbers text-sm sm:text-base font-semibold mt-0.5 tracking-tight ${
            item.isPB && item.value !== null
              ? 'text-neutral-900 dark:text-[#00FF66]'
              : 'text-neutral-800 dark:text-[#ECECED]'
          }`}>
            {item.value !== null ? formatTime(item.value, 'none', { precision }) : '—'}
          </span>
        </div>
      ))}
    </div>
  );
};

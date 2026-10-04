import React from 'react';
import { SessionStats } from '../../features/statistics/statistics';
import { Solve } from '../../types/solve';
import { TimerPrecision } from '../../types/settings';
import { formatTime } from '../../utils/formatTime';
import { SolveList } from './SolveList';
import { BarChart2 } from 'lucide-react';
import { Penalty } from '../../types/solve';

interface SidebarStatsHistoryCardProps {
  stats: SessionStats;
  solves: Solve[];
  sessionName: string;
  precision: TimerPrecision;
  lastDeletedSolve: Solve | null;
  onUndoDelete: () => void;
  onUpdatePenalty: (id: string, penalty: Penalty) => Promise<void>;
  onUpdateNote: (id: string, note: string) => Promise<void>;
  onDeleteSolve: (id: string) => Promise<void>;
  confirmDelete: boolean;
  onOpenStatsModal: () => void;
}

export const SidebarStatsHistoryCard: React.FC<SidebarStatsHistoryCardProps> = ({
  stats,
  solves,
  sessionName,
  precision,
  lastDeletedSolve,
  onUndoDelete,
  onUpdatePenalty,
  onUpdateNote,
  onDeleteSolve,
  confirmDelete,
  onOpenStatsModal,
}) => {
  const statItems = [
    { label: 'PB', value: stats.pbSingle, isPB: true },
    { label: 'Ao5', value: stats.ao5, isPB: false },
    { label: 'Ao12', value: stats.ao12, isPB: false },
    { label: 'Ao100', value: stats.ao100, isPB: false },
  ];

  return (
    <div className="w-full max-w-[340px] sm:max-w-[360px] rounded-3xl bg-white/75 dark:bg-[#121215]/85 backdrop-blur-xl border border-black/[0.06] dark:border-white/[0.08] shadow-[0_12px_40px_rgba(0,0,0,0.06)] dark:shadow-[0_16px_50px_rgba(0,0,0,0.6)] p-3.5 sm:p-4 flex flex-col gap-3 transition-all duration-200">
      {/* Top Section: Quick Stats */}
      <div
        onClick={onOpenStatsModal}
        className="flex items-center justify-between gap-1 p-2 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] hover:bg-black/[0.05] dark:hover:bg-white/[0.07] border border-black/[0.04] dark:border-white/[0.05] transition-all cursor-pointer group"
        title="Ver analítica completa y gráficos"
        role="button"
        tabIndex={0}
      >
        <div className="grid grid-cols-4 w-full divide-x divide-black/[0.04] dark:divide-white/[0.06]">
          {statItems.map((item) => (
            <div key={item.label} className="flex flex-col items-center px-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 group-hover:text-neutral-700 dark:group-hover:text-neutral-300 transition-colors">
                {item.label}
              </span>
              <span
                className={`font-mono-numbers text-xs sm:text-sm font-semibold mt-0.5 tracking-tight ${
                  item.isPB && item.value !== null
                    ? 'text-neutral-900 dark:text-[#00FF66]'
                    : 'text-neutral-800 dark:text-[#ECECED]'
                }`}
              >
                {item.value !== null ? formatTime(item.value, 'none', { precision }) : '—'}
              </span>
            </div>
          ))}
        </div>
        <BarChart2 size={13} className="text-neutral-400 group-hover:text-[#00FF66] transition-colors ml-1 shrink-0" />
      </div>

      {/* Divider */}
      <div className="h-px bg-black/[0.05] dark:bg-white/[0.07]" />

      {/* Bottom Section: Recent Solves History List */}
      <div className="h-48 sm:h-52 flex flex-col">
        <SolveList
          solves={solves}
          sessionName={sessionName}
          precision={precision}
          lastDeletedSolve={lastDeletedSolve}
          onUndoDelete={onUndoDelete}
          onUpdatePenalty={onUpdatePenalty}
          onUpdateNote={onUpdateNote}
          onDeleteSolve={onDeleteSolve}
          confirmDelete={confirmDelete}
        />
      </div>
    </div>
  );
};

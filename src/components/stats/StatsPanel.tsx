import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { SessionStats } from '../../features/statistics/statistics';
import { Solve } from '../../types/solve';
import { formatTime } from '../../utils/formatTime';
import { ProgressChart } from './ProgressChart';
import { DistributionChart } from './DistributionChart';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface StatsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  stats: SessionStats;
  sessionSolvesRecentFirst: Solve[];
  sessionName: string;
}

export const StatsPanel: React.FC<StatsPanelProps> = ({
  isOpen,
  onClose,
  stats,
  sessionSolvesRecentFirst,
  sessionName,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Estadísticas — ${sessionName}`}
      description={`${stats.totalSolves} solves registrados`}
      maxWidth="2xl"
    >
      <div className="flex flex-col gap-5 max-h-[75vh] overflow-y-auto pr-1">
        {/* Core Records Grid - Apple Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white/[0.04] dark:bg-white/[0.03] p-3.5 rounded-2xl border border-black/[0.06] dark:border-white/[0.07] shadow-xs">
            <div className="text-[10px] uppercase tracking-wider text-neutral-400 font-semibold">PB Single</div>
            <div className="text-xl font-bold font-mono text-neutral-900 dark:text-[#F5F5F7] mt-1 tracking-tight">
              {formatTime(stats.pbSingle)}
            </div>
            <div className="text-[11px] text-neutral-500 mt-0.5">Mejor tiempo</div>
          </div>

          <div className="bg-white/[0.04] dark:bg-white/[0.03] p-3.5 rounded-2xl border border-black/[0.06] dark:border-white/[0.07] shadow-xs">
            <div className="text-[10px] uppercase tracking-wider text-neutral-400 font-semibold">PB Ao5</div>
            <div className="text-xl font-bold font-mono text-[#00FF66] mt-1 tracking-tight drop-shadow-[0_0_8px_rgba(0,255,102,0.3)]">
              {formatTime(stats.bestAo5)}
            </div>
            <div className="text-[11px] text-neutral-500 mt-0.5">Actual: {formatTime(stats.ao5)}</div>
          </div>

          <div className="bg-white/[0.04] dark:bg-white/[0.03] p-3.5 rounded-2xl border border-black/[0.06] dark:border-white/[0.07] shadow-xs">
            <div className="text-[10px] uppercase tracking-wider text-neutral-400 font-semibold">PB Ao12</div>
            <div className="text-xl font-bold font-mono text-sky-400 mt-1 tracking-tight">
              {formatTime(stats.bestAo12)}
            </div>
            <div className="text-[11px] text-neutral-500 mt-0.5">Actual: {formatTime(stats.ao12)}</div>
          </div>

          <div className="bg-white/[0.04] dark:bg-white/[0.03] p-3.5 rounded-2xl border border-black/[0.06] dark:border-white/[0.07] shadow-xs">
            <div className="text-[10px] uppercase tracking-wider text-neutral-400 font-semibold">PB Ao100</div>
            <div className="text-xl font-bold font-mono text-purple-400 mt-1 tracking-tight">
              {formatTime(stats.bestAo100)}
            </div>
            <div className="text-[11px] text-neutral-500 mt-0.5">Actual: {formatTime(stats.ao100)}</div>
          </div>
        </div>

        {/* Global Summary Card */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white/[0.04] dark:bg-white/[0.03] p-4 rounded-2xl border border-black/[0.06] dark:border-white/[0.07] text-xs">
          <div>
            <span className="text-neutral-400">Media Global:</span>
            <span className="ml-1.5 font-mono font-semibold text-neutral-900 dark:text-[#F5F5F7]">
              {formatTime(stats.globalMean)}
            </span>
          </div>
          <div>
            <span className="text-neutral-400">Mediana:</span>
            <span className="ml-1.5 font-mono font-semibold text-neutral-900 dark:text-[#F5F5F7]">
              {formatTime(stats.median)}
            </span>
          </div>
          <div>
            <span className="text-neutral-400">Mejor / Peor:</span>
            <span className="ml-1.5 font-mono font-semibold text-neutral-900 dark:text-[#F5F5F7]">
              {formatTime(stats.bestTime)} / {formatTime(stats.worstTime)}
            </span>
          </div>
          <div>
            <span className="text-neutral-400">DNFs:</span>
            <span className="ml-1.5 font-mono font-semibold text-neutral-900 dark:text-[#F5F5F7]">
              {stats.dnfCount}
            </span>
          </div>
        </div>

        {/* Progress Chart Card */}
        <div className="p-4 bg-white/[0.04] dark:bg-white/[0.03] rounded-2xl border border-black/[0.06] dark:border-white/[0.07]">
          <div className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider mb-2.5">
            Progreso de la Sesión
          </div>
          <ProgressChart solvesRecentFirst={sessionSolvesRecentFirst} />
        </div>

        {/* Time Distribution Card */}
        <div className="p-4 bg-white/[0.04] dark:bg-white/[0.03] rounded-2xl border border-black/[0.06] dark:border-white/[0.07]">
          <DistributionChart distribution={stats.distribution} />
        </div>

        {/* Advanced Stats Toggle */}
        <div className="border-t border-black/[0.05] dark:border-white/[0.07] pt-3">
          <button
            onClick={() => setShowAdvanced((prev) => !prev)}
            className="flex items-center gap-1.5 text-xs font-medium text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-[#F5F5F7] transition-colors focus:outline-none"
          >
            <span>Estadísticas Avanzadas</span>
            {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {showAdvanced && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 p-4 bg-white/[0.04] dark:bg-white/[0.03] rounded-2xl border border-black/[0.06] dark:border-white/[0.07] text-xs">
              <div>
                <div className="text-neutral-400 text-[10px] uppercase font-semibold">
                  Desviación Estándar
                </div>
                <div className="font-mono font-semibold text-neutral-900 dark:text-[#F5F5F7] mt-0.5">
                  {stats.standardDeviation !== null ? `${(stats.standardDeviation / 1000).toFixed(2)}s` : '—'}
                </div>
              </div>
              <div>
                <div className="text-neutral-400 text-[10px] uppercase font-semibold">
                  Consistencia (CV)
                </div>
                <div className="font-mono font-semibold text-neutral-900 dark:text-[#F5F5F7] mt-0.5">
                  {stats.consistencyPercent !== null ? `${stats.consistencyPercent}%` : '—'}
                </div>
              </div>
              <div>
                <div className="text-neutral-400 text-[10px] uppercase font-semibold">
                  Media Top 10%
                </div>
                <div className="font-mono font-semibold text-[#00FF66] mt-0.5">
                  {formatTime(stats.best10PercentMean)}
                </div>
              </div>
              <div>
                <div className="text-neutral-400 text-[10px] uppercase font-semibold">
                  Media Peor 10%
                </div>
                <div className="font-mono font-semibold text-red-500 mt-0.5">
                  {formatTime(stats.worst10PercentMean)}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

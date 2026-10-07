import React from 'react';
import { Session } from '../../types/session';
import { CubeEventId } from '../../types/event';
import { SessionStats } from '../../features/statistics/statistics';
import { Solve } from '../../types/solve';
import { TimerPrecision } from '../../types/settings';
import { formatTime } from '../../utils/formatTime';
import { SessionSelector } from '../sessions/SessionSelector';
import { EventSelector } from '../scramble/EventSelector';
import { SolveList } from '../solves/SolveList';
import { IconButton } from '../ui/IconButton';
import {
  BarChart3,
  Settings as SettingsIcon,
  Maximize2,
  Minimize2,
  ChevronRight,
  Trophy,
  Box,
  X,
} from 'lucide-react';
import { Penalty } from '../../types/solve';


interface AppleMusicSidebarProps {
  activeSession: Session | undefined;
  sessions: Session[];
  activeSessionId: string | null;
  sessionSolves: Solve[];
  sessionStats: SessionStats;
  precision: TimerPrecision;
  lastDeletedSolve: Solve | null;
  isFocusMode: boolean;
  onCloseMobile?: () => void;
  onToggleFocusMode: () => void;
  onSelectEvent: (event: CubeEventId) => void;
  onOpenSessionManager: () => void;
  onOpenStatsModal: () => void;
  onOpenSettingsModal: () => void;
  onToggleVirtualCube: () => void;
  isVirtualCubeActive?: boolean;
  onCollapseSidebar?: () => void;
  onUndoDelete: () => void;

  onUpdatePenalty: (id: string, penalty: Penalty) => Promise<void>;
  onUpdateNote: (id: string, note: string) => Promise<void>;
  onDeleteSolve: (id: string) => Promise<void>;
  confirmDelete: boolean;
}


export const AppleMusicSidebar: React.FC<AppleMusicSidebarProps> = ({
  activeSession,
  sessionSolves,
  sessionStats,
  precision,
  lastDeletedSolve,
  isFocusMode,
  onCloseMobile,
  onToggleFocusMode,
  onSelectEvent,
  onOpenSessionManager,
  onOpenStatsModal,
  onOpenSettingsModal,
  onToggleVirtualCube,
  isVirtualCubeActive = false,
  onCollapseSidebar,
  onUndoDelete,
  onUpdatePenalty,
  onUpdateNote,
  onDeleteSolve,
  confirmDelete,
}) => {
  const statItems = [
    { label: 'PB', value: sessionStats.pbSingle, isPB: true },
    { label: 'Ao5', value: sessionStats.ao5, isPB: false },
    { label: 'Ao12', value: sessionStats.ao12, isPB: false },
    { label: 'Ao100', value: sessionStats.ao100, isPB: false },
  ];

  return (
    <aside className="w-64 sm:w-72 h-full flex flex-col rounded-3xl bg-white/75 dark:bg-[#121215]/85 backdrop-blur-2xl border border-black/[0.06] dark:border-white/[0.08] shadow-[0_20px_50px_rgba(0,0,0,0.06)] dark:shadow-[0_25px_60px_rgba(0,0,0,0.8)] transition-all duration-300 select-none relative">
      {/* 1. Header: Branding (Clickable to collapse) & Action Icons */}
      <div className="p-4 pb-3 flex items-center justify-between border-b border-black/[0.04] dark:border-white/[0.06] shrink-0">
        <button
          type="button"
          onClick={onCollapseSidebar}
          className="flex items-center gap-2.5 p-1 -ml-1 rounded-xl hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors cursor-pointer group text-left"
          title="Colapsar barra lateral"
          aria-label="Colapsar barra lateral"
        >
          <img
            src="/favicon.svg"
            alt="CuberT logo"
            className="w-6 h-6 rounded-lg shrink-0 shadow-xs group-hover:scale-95 transition-transform"
          />
          <span className="font-bold tracking-tight text-sm text-neutral-900 dark:text-[#F5F5F7]">
            CuberT
          </span>
        </button>

        <div className="flex items-center gap-1">
          <IconButton
            size="sm"
            ariaLabel={isVirtualCubeActive ? 'Desactivar Cubo Virtual' : 'Activar Cubo Virtual 3D'}
            onClick={onToggleVirtualCube}
            className={`transition-colors ${
              isVirtualCubeActive
                ? 'text-[#00FF66] bg-[#00FF66]/15 dark:text-[#10E364] dark:bg-[#10E364]/15 ring-1 ring-[#00FF66]/30'
                : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
            }`}
          >
            <Box size={15} />
          </IconButton>


          <IconButton
            size="sm"
            ariaLabel="Modo Focus (F)"
            onClick={onToggleFocusMode}
            className="text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
          >
            {isFocusMode ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </IconButton>

          <IconButton
            size="sm"
            ariaLabel="Estadísticas y gráficos"
            onClick={onOpenStatsModal}
            className="text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
          >
            <BarChart3 size={15} />
          </IconButton>

          <IconButton
            size="sm"
            ariaLabel="Configuración"
            onClick={onOpenSettingsModal}
            className="text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
          >
            <SettingsIcon size={15} />
          </IconButton>


          {onCloseMobile && (
            <IconButton
              size="sm"
              ariaLabel="Cerrar barra lateral"
              onClick={onCloseMobile}
              className="md:hidden text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white ml-0.5"
            >
              <X size={15} />
            </IconButton>
          )}
        </div>
      </div>

      {/* 2. Session & Event Picker */}
      <div className="px-4 py-3 flex items-center gap-2 border-b border-black/[0.04] dark:border-white/[0.06] shrink-0 relative z-30">
        <div className="flex-1 min-w-0">
          <SessionSelector
            currentSession={activeSession}
            solvesCount={sessionSolves.length}
            onOpenSessionManager={onOpenSessionManager}
          />
        </div>
        <EventSelector
          currentEvent={activeSession?.event || '333'}
          onSelectEvent={onSelectEvent}
        />
      </div>

      {/* 3. Rolling Averages Section (Segmented Apple Card - PB resides in Stats) */}
      <div className="p-3 border-b border-black/[0.04] dark:border-white/[0.06] shrink-0">
        <div
          onClick={onOpenStatsModal}
          className="p-2.5 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] hover:bg-black/[0.05] dark:hover:bg-white/[0.07] border border-black/[0.04] dark:border-white/[0.05] transition-all cursor-pointer group"
          title="Ver estadísticas detalladas y récords en el panel de estadísticas"
          role="button"
          tabIndex={0}
        >
          <div className="flex items-center justify-between mb-1.5 px-1">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
              <Trophy size={11} className="text-[#00FF66]" />
              <span>Averages & Récord</span>
            </div>
            <ChevronRight size={12} className="text-neutral-400 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
          </div>

          <div className="grid grid-cols-4 divide-x divide-black/[0.04] dark:divide-white/[0.06]">
            {statItems.map((item) => (
              <div key={item.label} className="flex flex-col items-center px-0.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                  {item.label}
                </span>
                <span
                  className={`font-mono-numbers text-xs font-semibold mt-0.5 tracking-tight ${
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
        </div>
      </div>

      {/* 4. Solves History (Takes remaining vertical height with virtual scroll) */}
      <div className="flex-1 min-h-0 p-3 pt-2 flex flex-col overflow-hidden rounded-b-3xl">
        <SolveList
          solves={sessionSolves}
          sessionName={activeSession?.name || 'Sesión'}
          precision={precision}
          lastDeletedSolve={lastDeletedSolve}
          onUndoDelete={onUndoDelete}
          onUpdatePenalty={onUpdatePenalty}
          onUpdateNote={onUpdateNote}
          onDeleteSolve={onDeleteSolve}
          confirmDelete={confirmDelete}
        />
      </div>
    </aside>
  );
};

import React from 'react';
import { Layers } from 'lucide-react';
import { Session } from '../../types/session';

interface SessionSelectorProps {
  currentSession: Session | undefined;
  solvesCount: number;
  onOpenSessionManager: () => void;
  disabled?: boolean;
}

export const SessionSelector: React.FC<SessionSelectorProps> = ({
  currentSession,
  solvesCount,
  onOpenSessionManager,
  disabled = false,
}) => {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onOpenSessionManager}
      className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-neutral-800 dark:text-[#ECECED] bg-white/70 dark:bg-white/[0.07] hover:bg-white/90 dark:hover:bg-white/[0.12] active:scale-[0.98] rounded-xl transition-all border border-black/[0.06] dark:border-white/[0.09] shadow-xs backdrop-blur-md focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20 group"
      title="Administrar sesiones"
    >
      <Layers size={13} className="text-neutral-400 group-hover:text-neutral-600 dark:group-hover:text-[#00FF66] transition-colors" />
      <span className="truncate max-w-[120px] sm:max-w-[160px]">
        {currentSession?.name || 'Sesión'}
      </span>
      <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-mono px-1.5 py-0.5 rounded-md bg-black/[0.04] dark:bg-white/[0.08]">
        {solvesCount}
      </span>
    </button>
  );
};

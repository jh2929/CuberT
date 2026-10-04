import React from 'react';
import { AlertCircle, X } from 'lucide-react';

interface BackupReminderBannerProps {
  onBackupNow: () => void;
  onDismiss: () => void;
}

export const BackupReminderBanner: React.FC<BackupReminderBannerProps> = ({
  onBackupNow,
  onDismiss,
}) => {
  return (
    <div className="w-full bg-neutral-100 dark:bg-neutral-800/90 border-b border-neutral-200 dark:border-neutral-700/60 px-4 py-2 flex items-center justify-between text-xs z-30">
      <div className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300">
        <AlertCircle size={14} className="text-amber-500 shrink-0" />
        <span>Has realizado muchos solves sin hacer backup. Guarda una copia de tus tiempos.</span>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={onBackupNow}
          className="text-xs font-semibold text-neutral-900 dark:text-white hover:underline focus:outline-none"
        >
          Hacer backup ahora
        </button>
        <button
          onClick={onDismiss}
          className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 focus:outline-none"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
};

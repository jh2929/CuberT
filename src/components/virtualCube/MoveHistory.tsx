import React, { useState } from 'react';
import { Copy, Trash2, Download, Check } from 'lucide-react';
import { copyHistoryToClipboard, exportHistoryFile } from '../../features/virtualCube/cube.utils';

interface MoveHistoryProps {
  moves: string[];
  activeScramble?: string | null;
  onClearHistory: () => void;
  className?: string;
}

export const MoveHistory: React.FC<MoveHistoryProps> = ({
  moves,
  activeScramble,
  onClearHistory,
  className = '',
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const success = await copyHistoryToClipboard(moves);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleExport = () => {
    exportHistoryFile(moves, activeScramble || undefined);
  };

  return (
    <div
      className={`w-full flex flex-col gap-2 p-3 rounded-2xl bg-white/50 dark:bg-[#121215]/60 backdrop-blur-md border border-black/[0.05] dark:border-white/[0.07] ${className}`}
      role="region"
      aria-label="Historial de movimientos del Cubo Virtual"
    >
      <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 select-none">
        <div className="flex items-center gap-2">
          <span className="font-semibold uppercase tracking-wider text-[10px]">Historial de giros</span>
          <span className="px-2 py-0.5 rounded-full bg-black/[0.05] dark:bg-white/[0.08] font-mono text-[11px] font-bold text-neutral-800 dark:text-neutral-200">
            {moves.length} {moves.length === 1 ? 'movimiento' : 'movimientos'}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {moves.length > 0 && (
            <>
              <button
                type="button"
                onClick={handleCopy}
                className="p-1.5 rounded-lg hover:bg-black/[0.05] dark:hover:bg-white/[0.08] text-neutral-600 dark:text-neutral-300 transition-colors"
                title="Copiar secuencia de movimientos"
                aria-label="Copiar secuencia"
              >
                {copied ? <Check size={13} className="text-[#00FF66]" /> : <Copy size={13} />}
              </button>
              <button
                type="button"
                onClick={handleExport}
                className="p-1.5 rounded-lg hover:bg-black/[0.05] dark:hover:bg-white/[0.08] text-neutral-600 dark:text-neutral-300 transition-colors"
                title="Exportar archivo de solución"
                aria-label="Exportar archivo de solución"
              >
                <Download size={13} />
              </button>
              <button
                type="button"
                onClick={onClearHistory}
                className="p-1.5 rounded-lg hover:bg-black/[0.05] dark:hover:bg-white/[0.08] text-neutral-600 dark:text-neutral-300 hover:text-rose-500 transition-colors"
                title="Limpiar historial"
                aria-label="Limpiar historial"
              >
                <Trash2 size={13} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Moves string */}
      <div className="min-h-[38px] max-h-[80px] overflow-y-auto font-mono text-xs text-neutral-700 dark:text-neutral-300 tracking-wide select-text flex flex-wrap gap-1.5 items-center">
        {moves.length === 0 ? (
          <span className="text-neutral-400 dark:text-neutral-500 italic font-sans text-xs">
            Sin movimientos registrados aún. Usa el teclado para resolver.
          </span>
        ) : (
          moves.map((m, idx) => (
            <span
              key={`${m}-${idx}`}
              className="px-1.5 py-0.5 rounded bg-black/[0.04] dark:bg-white/[0.06] font-semibold text-neutral-900 dark:text-neutral-100"
            >
              {m}
            </span>
          ))
        )}
      </div>
    </div>
  );
};

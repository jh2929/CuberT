import React, { useState, useRef, useEffect } from 'react';
import { Copy, Trash2, Download, Check, Maximize2 } from 'lucide-react';
import { copyHistoryToClipboard, exportHistoryFile } from '../../features/virtualCube/cube.utils';
import { Modal } from '../ui/Modal';

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
  const [isExpanded, setIsExpanded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the latest move horizontally without affecting screen height
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, [moves.length]);

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
    <>
      <div
        className={`w-full flex flex-col gap-1.5 p-2.5 rounded-2xl bg-white/50 dark:bg-[#121215]/60 backdrop-blur-md border border-black/[0.05] dark:border-white/[0.07] ${className}`}
        role="region"
        aria-label="Historial de movimientos del Cubo Virtual"
      >
        <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 select-none">
          <div className="flex items-center gap-2">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Historial de giros</span>
            <span className="px-2 py-0.5 rounded-full bg-black/[0.05] dark:bg-white/[0.08] font-mono text-[10px] font-bold text-neutral-800 dark:text-neutral-200">
              {moves.length} {moves.length === 1 ? 'giro' : 'giros'}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {moves.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={() => setIsExpanded(true)}
                  className="p-1 rounded-lg hover:bg-black/[0.05] dark:hover:bg-white/[0.08] text-neutral-600 dark:text-neutral-300 transition-colors"
                  title="Expandir historial completo"
                  aria-label="Expandir historial completo"
                >
                  <Maximize2 size={13} />
                </button>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="p-1 rounded-lg hover:bg-black/[0.05] dark:hover:bg-white/[0.08] text-neutral-600 dark:text-neutral-300 transition-colors"
                  title="Copiar secuencia de movimientos"
                  aria-label="Copiar secuencia"
                >
                  {copied ? <Check size={13} className="text-[#00FF66]" /> : <Copy size={13} />}
                </button>
                <button
                  type="button"
                  onClick={handleExport}
                  className="p-1 rounded-lg hover:bg-black/[0.05] dark:hover:bg-white/[0.08] text-neutral-600 dark:text-neutral-300 transition-colors"
                  title="Exportar archivo de solución"
                  aria-label="Exportar archivo de solución"
                >
                  <Download size={13} />
                </button>
                <button
                  type="button"
                  onClick={onClearHistory}
                  className="p-1 rounded-lg hover:bg-black/[0.05] dark:hover:bg-white/[0.08] text-neutral-600 dark:text-neutral-300 hover:text-rose-500 transition-colors"
                  title="Limpiar historial"
                  aria-label="Limpiar historial"
                >
                  <Trash2 size={13} />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Moves single row: Fixed height, never wraps or expands vertical screen scroll */}
        <div
          ref={scrollRef}
          className="h-8 flex items-center gap-1.5 overflow-x-auto whitespace-nowrap scrollbar-none font-mono text-xs text-neutral-700 dark:text-neutral-300 select-text"
        >
          {moves.length === 0 ? (
            <span className="text-neutral-400 dark:text-neutral-500 italic font-sans text-xs">
              Sin giros aún. Usa el teclado para resolver.
            </span>
          ) : (
            moves.map((m, idx) => (
              <span
                key={`${m}-${idx}`}
                className="px-1.5 py-0.5 rounded bg-black/[0.04] dark:bg-white/[0.06] font-semibold text-neutral-900 dark:text-neutral-100 shrink-0"
              >
                {m}
              </span>
            ))
          )}
        </div>
      </div>

      {/* Expanded History Modal (Doesn't affect screen size/scroll) */}
      <Modal
        isOpen={isExpanded}
        onClose={() => setIsExpanded(false)}
        title="Historial de giros del Cubo"
        description={`${moves.length} movimientos realizados`}
        maxWidth="md"
      >
        <div className="flex flex-col gap-4">
          <div className="max-h-60 overflow-y-auto p-3 rounded-xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.06] flex flex-wrap gap-1.5 font-mono text-xs">
            {moves.map((m, idx) => (
              <span
                key={`modal-${m}-${idx}`}
                className="px-2 py-1 rounded bg-black/[0.05] dark:bg-white/[0.08] font-bold text-neutral-900 dark:text-neutral-100"
              >
                {m}
              </span>
            ))}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-black/[0.06] dark:border-white/[0.06]">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/[0.05] dark:bg-white/[0.08] text-xs font-medium text-neutral-700 dark:text-neutral-300"
              >
                {copied ? <Check size={13} className="text-[#00FF66]" /> : <Copy size={13} />}
                <span>{copied ? 'Copiado' : 'Copiar'}</span>
              </button>
              <button
                type="button"
                onClick={handleExport}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/[0.05] dark:bg-white/[0.08] text-xs font-medium text-neutral-700 dark:text-neutral-300"
              >
                <Download size={13} />
                <span>Exportar</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              className="px-4 py-1.5 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-black text-xs font-semibold"
            >
              Cerrar
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

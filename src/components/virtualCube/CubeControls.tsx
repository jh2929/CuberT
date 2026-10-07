import React, { useState } from 'react';
import { Shuffle, RotateCcw, CheckCircle2, Undo2, Redo2, Keyboard, RotateCw } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { KeyMappingConfig } from '../../features/virtualCube/cube.types';

interface CubeControlsProps {
  onScramble: () => void;
  onReset: () => void;
  onSolve: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  isGeneratingScramble?: boolean;
  keyMappings: KeyMappingConfig;
  onUpdateKeyMapping: (key: string, move: string) => void;
  onResetKeyMappings: () => void;
}

export const CubeControls: React.FC<CubeControlsProps> = ({
  onScramble,
  onReset,
  onSolve,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  isGeneratingScramble = false,
  keyMappings,
  onUpdateKeyMapping,
  onResetKeyMappings,
}) => {
  const [isKeyboardModalOpen, setIsKeyboardModalOpen] = useState(false);
  const [editingMove, setEditingMove] = useState<string | null>(null);

  // Group default moves in logical order for mapping
  const trackedMoves = [
    'U', "U'", 'R', "R'", 'F', "F'", 'L', "L'", 'D', "D'", 'B', "B'", 'y', "y'", 'Rw', "Rw'"
  ];

  const handleKeyDownForBinding = (e: React.KeyboardEvent) => {
    if (!editingMove) return;
    e.preventDefault();
    e.stopPropagation();

    const key = e.key.toLowerCase();
    if (key === 'escape') {
      setEditingMove(null);
      return;
    }

    onUpdateKeyMapping(key, editingMove);
    setEditingMove(null);
  };

  // Find key assigned to a given move
  const getKeyForMove = (targetMove: string) => {
    const entry = Object.entries(keyMappings).find(([, m]) => m === targetMove);
    return entry ? entry[0].toUpperCase() : '-';
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 select-none" role="toolbar" aria-label="Controles del Cubo Virtual">
        {/* Scramble Button */}
        <button
          type="button"
          onClick={onScramble}
          disabled={isGeneratingScramble}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-black/[0.05] dark:bg-white/[0.08] hover:bg-black/[0.08] dark:hover:bg-white/[0.12] text-xs font-medium text-neutral-800 dark:text-neutral-200 transition-all focus-visible:outline-2 focus-visible:outline-neutral-400 disabled:opacity-50 shadow-xs"
          aria-label="Generar mezcla oficial WCA"
        >
          <Shuffle size={13} className={isGeneratingScramble ? 'animate-spin' : ''} />
          <span>Mezclar</span>
        </button>

        {/* Reset Button */}
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-black/[0.05] dark:bg-white/[0.08] hover:bg-black/[0.08] dark:hover:bg-white/[0.12] text-xs font-medium text-neutral-800 dark:text-neutral-200 transition-all focus-visible:outline-2 focus-visible:outline-neutral-400 shadow-xs"
          aria-label="Reiniciar el cubo al estado resuelto"
        >
          <RotateCcw size={13} />
          <span>Reiniciar</span>
        </button>

        {/* Solve Button */}
        <button
          type="button"
          onClick={onSolve}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-black/[0.05] dark:bg-white/[0.08] hover:bg-black/[0.08] dark:hover:bg-white/[0.12] text-xs font-medium text-neutral-800 dark:text-neutral-200 transition-all focus-visible:outline-2 focus-visible:outline-neutral-400 shadow-xs"
          aria-label="Restaurar estado resuelto"
        >
          <CheckCircle2 size={13} />
          <span>Resolver</span>
        </button>

        {/* Undo Button */}
        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-black/[0.05] dark:bg-white/[0.08] hover:bg-black/[0.08] dark:hover:bg-white/[0.12] text-xs font-medium text-neutral-800 dark:text-neutral-200 transition-all focus-visible:outline-2 focus-visible:outline-neutral-400 disabled:opacity-30 disabled:pointer-events-none shadow-xs"
          title="Deshacer (Ctrl + Z)"
          aria-label="Deshacer último movimiento"
        >
          <Undo2 size={13} />
          <span>Deshacer</span>
        </button>

        {/* Redo Button */}
        <button
          type="button"
          onClick={onRedo}
          disabled={!canRedo}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-black/[0.05] dark:bg-white/[0.08] hover:bg-black/[0.08] dark:hover:bg-white/[0.12] text-xs font-medium text-neutral-800 dark:text-neutral-200 transition-all focus-visible:outline-2 focus-visible:outline-neutral-400 disabled:opacity-30 disabled:pointer-events-none shadow-xs"
          title="Rehacer (Ctrl + Shift + Z)"
          aria-label="Rehacer movimiento"
        >
          <Redo2 size={13} />
          <span>Rehacer</span>
        </button>

        {/* Keyboard Settings Button */}
        <button
          type="button"
          onClick={() => setIsKeyboardModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-black/[0.05] dark:bg-white/[0.08] hover:bg-black/[0.08] dark:hover:bg-white/[0.12] text-xs font-medium text-neutral-800 dark:text-neutral-200 transition-all focus-visible:outline-2 focus-visible:outline-neutral-400 shadow-xs"
          aria-label="Configurar atajos de teclado"
        >
          <Keyboard size={13} />
          <span>Teclado</span>
        </button>
      </div>

      {/* Keyboard Config Modal */}
      <Modal
        isOpen={isKeyboardModalOpen}
        onClose={() => {
          setIsKeyboardModalOpen(false);
          setEditingMove(null);
        }}
        title="Atajos de Teclado del Cubo"
        description="Configura los giros asignados a cada tecla (estilo CSTimer)"
        maxWidth="lg"
      >
        <div className="flex flex-col gap-4 text-xs select-none">
          <div className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
            Presiona el botón de una tecla para reasignarla. Para volver a los controles predeterminados de CSTimer, pulsa &quot;Restaurar por defecto&quot;.
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-h-[55vh] overflow-y-auto pr-1">
            {trackedMoves.map((m) => {
              const currentKey = getKeyForMove(m);
              const isEditing = editingMove === m;

              return (
                <div
                  key={m}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.06]"
                >
                  <span className="font-mono font-bold text-neutral-800 dark:text-neutral-200 text-sm">
                    {m}
                  </span>
                  <button
                    type="button"
                    onClick={() => setEditingMove(m)}
                    onKeyDown={isEditing ? handleKeyDownForBinding : undefined}
                    className={`min-w-[36px] px-2 py-1 rounded-lg font-mono text-center text-xs font-semibold transition-all focus:outline-none ${
                      isEditing
                        ? 'bg-[#00FF66] text-black animate-pulse ring-2 ring-[#00FF66]/50'
                        : 'bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-100 shadow-xs border border-black/10 dark:border-white/10 hover:border-black/25 dark:hover:border-white/30'
                    }`}
                    title={`Hacer clic para cambiar la tecla de ${m}`}
                    aria-label={`Tecla para el movimiento ${m}: ${currentKey}`}
                  >
                    {isEditing ? '...' : currentKey}
                  </button>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-black/10 dark:border-white/10">
            <button
              type="button"
              onClick={onResetKeyMappings}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors"
            >
              <RotateCw size={13} />
              <span>Restaurar por defecto</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setIsKeyboardModalOpen(false);
                setEditingMove(null);
              }}
              className="px-4 py-1.5 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-black font-semibold shadow-xs transition-opacity hover:opacity-90"
            >
              Listo
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

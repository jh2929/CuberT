import React, { useEffect, useState, useCallback } from 'react';
import { useVirtualCubeStore } from '../../store/virtualCube.store';
import { CubeRenderer, CubeRendererAction } from './CubeRenderer';
import { CubeControls } from './CubeControls';
import { MoveHistory } from './MoveHistory';
import { getInverseMove } from '../../features/virtualCube/cube.moves';
import { Sparkles, X, HelpCircle } from 'lucide-react';

interface VirtualCubeProps {
  onClose?: () => void;
}

export const VirtualCube: React.FC<VirtualCubeProps> = ({ onClose }) => {
  const {
    cube,
    history,
    undoneHistory,
    activeScramble,
    keyMappings,
    isCustomizingKeys,
    move,
    scramble,
    solve,
    reset,
    undo,
    redo,
    clearHistory,
    updateKeyMapping,
    resetKeyMappings,
  } = useVirtualCubeStore();

  const [lastAction, setLastAction] = useState<CubeRendererAction | null>(null);
  const [isGeneratingScramble, setIsGeneratingScramble] = useState(false);
  const [showQuickHelp, setShowQuickHelp] = useState(false);

  // Trigger move both in engine state and 3D renderer
  const handlePerformMove = useCallback(
    (moveStr: string) => {
      move(moveStr);
      setLastAction({
        type: 'move',
        moveStr,
        id: Date.now() + Math.random(),
      });
    },
    [move]
  );

  // Trigger undo with reverse animation
  const handleUndo = useCallback(() => {
    if (history.length === 0) return;
    const lastMove = history[history.length - 1];
    const inverse = getInverseMove(lastMove);
    const success = undo();
    if (success) {
      setLastAction({
        type: 'undo',
        moveStr: inverse,
        id: Date.now() + Math.random(),
      });
    }
  }, [history, undo]);

  // Trigger redo with animation
  const handleRedo = useCallback(() => {
    if (undoneHistory.length === 0) return;
    const nextMove = undoneHistory[0];
    const success = redo();
    if (success) {
      setLastAction({
        type: 'redo',
        moveStr: nextMove,
        id: Date.now() + Math.random(),
      });
    }
  }, [undoneHistory, redo]);

  // Scramble cube
  const handleScramble = useCallback(async () => {
    setIsGeneratingScramble(true);
    try {
      const scr = await scramble();
      setLastAction({
        type: 'scramble',
        scrambleStr: scr,
        id: Date.now() + Math.random(),
      });
    } finally {
      setIsGeneratingScramble(false);
    }
  }, [scramble]);

  // Reset cube
  const handleReset = useCallback(() => {
    reset();
    setLastAction({
      type: 'reset',
      id: Date.now() + Math.random(),
    });
  }, [reset]);

  // Solve cube
  const handleSolve = useCallback(() => {
    solve();
    setLastAction({
      type: 'reset',
      id: Date.now() + Math.random(),
    });
  }, [solve]);

  // Keyboard listener for cube moves and shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture when typing in inputs or when editing bindings
      const target = e.target as HTMLElement;
      if (
        isCustomizingKeys ||
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      // Check for Undo: Ctrl+Z or Cmd+Z
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
        return;
      }

      // Check for Redo: Ctrl+Shift+Z, Cmd+Shift+Z or Ctrl+Y
      if (
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && e.shiftKey) ||
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y')
      ) {
        e.preventDefault();
        handleRedo();
        return;
      }

      // Check if key is in active mappings
      const key = e.key.toLowerCase();
      const mappedMove = keyMappings[key];

      if (mappedMove) {
        e.preventDefault();
        handlePerformMove(mappedMove);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [keyMappings, isCustomizingKeys, handlePerformMove, handleUndo, handleRedo]);

  const isSolvedAndMoved = cube.isSolved && history.length > 0;

  return (
    <div
      className="relative w-full flex flex-col items-center justify-center px-3 py-2 sm:p-4 select-none max-w-xl mx-auto"
      tabIndex={0}
      role="application"
      aria-label="Cubo Virtual 3x3"
    >
      {/* Top Bar with Title, Help and Close button grouped safely on left */}
      <div className="w-full flex items-center justify-start gap-2.5 z-10 mb-2">
        <span className="font-mono text-sm sm:text-base font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
          Cubo Virtual 3×3
        </span>
        <button
          type="button"
          onClick={() => setShowQuickHelp((prev) => !prev)}
          className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
          title="Ver atajos básicos de teclado"
          aria-label="Ayuda de atajos"
        >
          <HelpCircle size={15} />
        </button>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-black/[0.05] dark:bg-white/[0.08] hover:bg-black/[0.1] dark:hover:bg-white/[0.15] text-xs font-medium text-neutral-700 dark:text-neutral-200 transition-all shadow-xs ml-2"
            title="Volver al cronómetro normal"
            aria-label="Volver al cronómetro normal"
          >
            <span>Volver al timer</span>
            <X size={13} />
          </button>
        )}
      </div>

      {/* Quick Help Overlay */}
      {showQuickHelp && (
        <div className="w-full mb-3 p-3 rounded-2xl bg-white/80 dark:bg-[#141417]/90 backdrop-blur-md border border-black/[0.08] dark:border-white/[0.1] text-xs text-neutral-600 dark:text-neutral-400 flex flex-wrap items-center justify-between gap-3 shadow-md">
          <div className="flex flex-wrap gap-2">
            <span><b>J</b>: U | <b>F</b>: U&apos;</span>
            <span><b>I</b>: R | <b>K</b>: R&apos;</span>
            <span><b>H</b>: F | <b>G</b>: F&apos;</span>
            <span><b>D</b>: L | <b>E</b>: L&apos;</span>
            <span><b>S</b>: D | <b>L</b>: D&apos;</span>
            <span><b>W</b>: B | <b>O</b>: B&apos;</span>
            <span><b>Ctrl+Z</b>: Deshacer</span>
          </div>
          <button
            type="button"
            onClick={() => setShowQuickHelp(false)}
            className="text-[11px] font-semibold text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
          >
            Ocultar
          </button>
        </div>
      )}

      {/* Center 3D Interactive Rubik's Cube */}
      <div className="relative w-full flex items-center justify-center my-1 sm:my-2 min-h-[250px] sm:min-h-[290px] md:min-h-[320px]">
        <CubeRenderer lastAction={lastAction} />

        {/* Solved celebration toast */}
        {isSolvedAndMoved && (
          <div className="absolute top-2 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#00FF66]/20 border border-[#00FF66]/40 text-emerald-700 dark:text-[#10E364] font-semibold text-xs shadow-lg backdrop-blur-md animate-bounce select-none">
            <Sparkles size={15} />
            <span>¡Cubo resuelto en {history.length} movimientos!</span>
          </div>
        )}
      </div>

      {/* Move History */}
      <div className="w-full mb-3">
        <MoveHistory
          moves={history}
          activeScramble={activeScramble}
          onClearHistory={clearHistory}
        />
      </div>

      {/* Cube Controls */}
      <div className="w-full">
        <CubeControls
          onScramble={handleScramble}
          onReset={handleReset}
          onSolve={handleSolve}
          onUndo={handleUndo}
          onRedo={handleRedo}
          canUndo={history.length > 0}
          canRedo={undoneHistory.length > 0}
          isGeneratingScramble={isGeneratingScramble}
          keyMappings={keyMappings}
          onUpdateKeyMapping={updateKeyMapping}
          onResetKeyMappings={resetKeyMappings}
        />
      </div>
    </div>
  );
};

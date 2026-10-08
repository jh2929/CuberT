import React, { useEffect, useState, useCallback } from 'react';
import { useVirtualCubeStore } from '../../store/virtualCube.store';
import { CubeRenderer, CubeRendererAction } from './CubeRenderer';
import { CubeControls } from './CubeControls';
import { MoveHistory } from './MoveHistory';
import { getInverseMove } from '../../features/virtualCube/cube.moves';
import { Sparkles } from 'lucide-react';

interface VirtualCubeProps {
  onClose?: () => void;
}

export const VirtualCube: React.FC<VirtualCubeProps> = () => {
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

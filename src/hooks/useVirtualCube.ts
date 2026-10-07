import { useEffect } from 'react';
import { useVirtualCubeStore } from '../store/virtualCube.store';

export function useVirtualCube() {
  const cube = useVirtualCubeStore((s) => s.cube);
  const history = useVirtualCubeStore((s) => s.history);
  const undoneHistory = useVirtualCubeStore((s) => s.undoneHistory);
  const move = useVirtualCubeStore((s) => s.move);
  const scramble = useVirtualCubeStore((s) => s.scramble);
  const solve = useVirtualCubeStore((s) => s.solve);
  const reset = useVirtualCubeStore((s) => s.reset);
  const undo = useVirtualCubeStore((s) => s.undo);
  const redo = useVirtualCubeStore((s) => s.redo);
  const isSolved = useVirtualCubeStore((s) => s.isSolved);
  const initEngine = useVirtualCubeStore((s) => s.initEngine);
  const isEngineReady = useVirtualCubeStore((s) => s.isEngineReady);

  useEffect(() => {
    if (!isEngineReady) {
      initEngine();
    }
  }, [isEngineReady, initEngine]);

  return {
    cube,
    move,
    scramble,
    solve,
    reset,
    undo,
    redo,
    isSolved,
    history,
    canUndo: history.length > 0,
    canRedo: undoneHistory.length > 0,
  };
}

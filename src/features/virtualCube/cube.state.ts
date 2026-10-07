import { CornerPiece, CubeState, EdgePiece } from './cube.types';
import { INITIAL_CORNERS, INITIAL_EDGES } from './cube.constants';

/**
 * Checks whether the piece state represents a completely solved Rubik's cube.
 * True only when all 8 corners and 12 edges are in their solved positions with orientation 0.
 */
export function checkIsSolved(corners: readonly CornerPiece[], edges: readonly EdgePiece[]): boolean {
  if (corners.length !== 8 || edges.length !== 12) {
    return false;
  }

  const cornersSolved = corners.every(
    (c) => c.id === c.position && c.orientation === 0
  );

  const edgesSolved = edges.every(
    (e) => e.id === e.position && e.orientation === 0
  );

  return cornersSolved && edgesSolved;
}

/**
 * Creates a brand new solved CubeState.
 */
export function createSolvedState(): CubeState {
  const corners: CornerPiece[] = INITIAL_CORNERS.map((c) => ({ ...c }));
  const edges: EdgePiece[] = INITIAL_EDGES.map((e) => ({ ...e }));

  return {
    corners,
    edges,
    isSolved: true,
    moveCount: 0,
  };
}

/**
 * Clones a CubeState immutably.
 */
export function cloneCubeState(state: CubeState): CubeState {
  return {
    corners: state.corners.map((c) => ({ ...c })),
    edges: state.edges.map((e) => ({ ...e })),
    isSolved: state.isSolved,
    lastMove: state.lastMove,
    moveCount: state.moveCount,
  };
}

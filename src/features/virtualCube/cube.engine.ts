import { Alg } from 'cubing/alg';
import { cube3x3x3 } from 'cubing/puzzles';
import type { KPuzzle, KPattern } from 'cubing/kpuzzle';
import { CornerPiece, CubeState, EdgePiece } from './cube.types';
import { checkIsSolved, createSolvedState } from './cube.state';
import { isValidMove } from './cube.moves';

export class CubeEngine {
  private kpuzzle: KPuzzle | null = null;
  private currentPattern: KPattern | null = null;
  private state: CubeState = createSolvedState();
  private initPromise: Promise<void> | null = null;

  constructor() {
    this.init();
  }

  /**
   * Initializes the kpuzzle engine asynchronously
   */
  public async init(): Promise<void> {
    if (this.kpuzzle) return;
    if (!this.initPromise) {
      this.initPromise = (async () => {
        try {
          this.kpuzzle = await cube3x3x3.kpuzzle();
          this.currentPattern = this.kpuzzle.defaultPattern();
          this.state = this.extractStateFromPattern(this.currentPattern);
        } catch (err) {
          console.error('Failed to initialize CubeEngine kpuzzle:', err);
        }
      })();
    }
    return this.initPromise;
  }

  /**
   * Converts a KPuzzle pattern into the strict piece-based CubeState
   * tracking 8 corners and 12 edges with position and orientation.
   */
  private extractStateFromPattern(pattern: KPattern, lastMove?: string): CubeState {
    const cornersData = pattern.patternData['CORNERS'];
    const edgesData = pattern.patternData['EDGES'];

    const corners: CornerPiece[] = cornersData.pieces.map((pieceId, slotIndex) => ({
      id: pieceId,
      position: slotIndex,
      orientation: cornersData.orientation[slotIndex],
    }));

    const edges: EdgePiece[] = edgesData.pieces.map((pieceId, slotIndex) => ({
      id: pieceId,
      position: slotIndex,
      orientation: edgesData.orientation[slotIndex],
    }));

    const solved = checkIsSolved(corners, edges);

    return {
      corners,
      edges,
      isSolved: solved,
      lastMove,
      moveCount: this.state ? this.state.moveCount + (lastMove ? 1 : 0) : 0,
    };
  }

  /**
   * Returns current snapshot of the piece-based state
   */
  public getState(): CubeState {
    return this.state;
  }

  /**
   * Checks whether the cube is currently solved
   */
  public isSolved(): boolean {
    return this.state.isSolved;
  }

  /**
   * Applies a single turn or rotation to the cube state
   */
  public applyMove(moveStr: string): CubeState {
    if (!isValidMove(moveStr)) {
      console.warn(`[CubeEngine] Invalid move requested: ${moveStr}`);
      return this.state;
    }

    if (!this.kpuzzle || !this.currentPattern) {
      console.warn('[CubeEngine] kpuzzle not ready yet, queueing synchronously');
      return this.state;
    }

    try {
      const alg = new Alg(moveStr);
      this.currentPattern = this.currentPattern.applyAlg(alg);
      this.state = this.extractStateFromPattern(this.currentPattern, moveStr);
    } catch (err) {
      console.error(`[CubeEngine] Error applying move ${moveStr}:`, err);
    }

    return this.state;
  }

  /**
   * Applies an algorithm sequence (e.g. Scramble or formula)
   */
  public applyAlg(algString: string, recordMoveCount = true): CubeState {
    if (!algString.trim() || !this.kpuzzle || !this.currentPattern) {
      return this.state;
    }

    try {
      const alg = new Alg(algString);
      this.currentPattern = this.currentPattern.applyAlg(alg);
      const previousCount = recordMoveCount ? this.state.moveCount : 0;
      this.state = this.extractStateFromPattern(this.currentPattern);
      if (!recordMoveCount) {
        this.state.moveCount = 0;
      } else {
        this.state.moveCount = previousCount + 1;
      }
    } catch (err) {
      console.error(`[CubeEngine] Error applying alg: "${algString}":`, err);
    }

    return this.state;
  }

  /**
   * Sets up the cube from a scramble string and resets move counter
   */
  public scramble(scrambleString: string): CubeState {
    if (!this.kpuzzle) {
      return this.state;
    }

    try {
      this.currentPattern = this.kpuzzle.defaultPattern().applyAlg(new Alg(scrambleString));
      this.state = this.extractStateFromPattern(this.currentPattern);
      this.state.moveCount = 0;
      this.state.lastMove = undefined;
    } catch (err) {
      console.error('[CubeEngine] Error setting up scramble:', err);
    }

    return this.state;
  }

  /**
   * Instantly restores the solved state (Solve / Reset button)
   */
  public reset(): CubeState {
    if (this.kpuzzle) {
      this.currentPattern = this.kpuzzle.defaultPattern();
    }
    this.state = createSolvedState();
    return this.state;
  }

  /**
   * Same as reset: restores solved state
   */
  public solve(): CubeState {
    return this.reset();
  }
}

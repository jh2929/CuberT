export type FaceMove = 'R' | 'L' | 'U' | 'D' | 'F' | 'B';
export type MoveModifier = '' | "'" | '2';
export type StandardMove =
  | 'R' | "R'" | 'R2'
  | 'L' | "L'" | 'L2'
  | 'U' | "U'" | 'U2'
  | 'D' | "D'" | 'D2'
  | 'F' | "F'" | 'F2'
  | 'B' | "B'" | 'B2';

export type CubeRotation = 'x' | "x'" | 'x2' | 'y' | "y'" | 'y2' | 'z' | "z'" | 'z2';
export type WideMove =
  | 'Rw' | "Rw'" | 'Rw2'
  | 'Lw' | "Lw'" | 'Lw2'
  | 'Uw' | "Uw'" | 'Uw2'
  | 'Dw' | "Dw'" | 'Dw2'
  | 'Fw' | "Fw'" | 'Fw2'
  | 'Bw' | "Bw'" | 'Bw2';

export type CubeMove = StandardMove | CubeRotation | WideMove;

export interface CornerPiece {
  /** Target piece identity 0..7 */
  id: number;
  /** Current slot position 0..7 */
  position: number;
  /** Orientation value: 0 (oriented), 1 (clockwise twist), 2 (counter-clockwise twist) */
  orientation: number;
}

export interface EdgePiece {
  /** Target piece identity 0..11 */
  id: number;
  /** Current slot position 0..11 */
  position: number;
  /** Orientation value: 0 (oriented), 1 (flipped) */
  orientation: number;
}

export interface CubeState {
  corners: CornerPiece[];
  edges: EdgePiece[];
  isSolved: boolean;
  lastMove?: string;
  moveCount: number;
}

export type KeyMappingConfig = Record<string, string>;

import { CubeMove } from './cube.types';

const VALID_MOVE_REGEX = /^[RLUDFBxyz](w)?(')?(2)?$/;

/**
 * Returns the exact inverse move for any valid WCA move or rotation.
 * Examples:
 * R -> R'
 * R' -> R
 * R2 -> R2
 * Rw -> Rw'
 * x -> x'
 */
export function getInverseMove(move: string): string {
  const trimmed = move.trim();
  if (!trimmed) return '';

  if (trimmed.endsWith('2')) {
    // A half-turn inverse is itself
    return trimmed;
  }

  if (trimmed.endsWith("'")) {
    return trimmed.slice(0, -1);
  }

  return `${trimmed}'`;
}

/**
 * Validates whether a move string is a recognized Rubik's cube turn or rotation.
 */
export function isValidMove(move: string): move is CubeMove {
  return VALID_MOVE_REGEX.test(move.trim());
}

/**
 * Inverts an entire sequence of moves.
 * e.g., "R U R'" -> ["R", "U'", "R'"]
 */
export function invertMoveSequence(moves: string[]): string[] {
  return [...moves].reverse().map(getInverseMove);
}

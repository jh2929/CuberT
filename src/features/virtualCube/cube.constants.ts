import { CornerPiece, EdgePiece, KeyMappingConfig, StandardMove } from './cube.types';

export const NUM_CORNERS = 8;
export const NUM_EDGES = 12;

export const INITIAL_CORNERS: readonly CornerPiece[] = Object.freeze(
  Array.from({ length: NUM_CORNERS }, (_, i) => ({
    id: i,
    position: i,
    orientation: 0,
  }))
);

export const INITIAL_EDGES: readonly EdgePiece[] = Object.freeze(
  Array.from({ length: NUM_EDGES }, (_, i) => ({
    id: i,
    position: i,
    orientation: 0,
  }))
);

export const CORNER_NAMES = [
  'UBL', 'UBR', 'UFR', 'UFL',
  'DFL', 'DFR', 'DBR', 'DBL',
] as const;

export const EDGE_NAMES = [
  'UB', 'UR', 'UF', 'UL',
  'BL', 'BR', 'FR', 'FL',
  'DF', 'DR', 'DB', 'DL',
] as const;

export const STANDARD_MOVES: readonly StandardMove[] = [
  'R', "R'", 'R2',
  'L', "L'", 'L2',
  'U', "U'", 'U2',
  'D', "D'", 'D2',
  'F', "F'", 'F2',
  'B', "B'", 'B2',
] as const;

/**
 * Standard CSTimer keyboard layout:
 * J -> U, F -> U'
 * I -> R, K -> R'
 * H -> F, G -> F'
 * D -> L, E -> L'
 * S -> D, L -> D'
 * W -> B, O -> B'
 * Extra common speedcubing shortcuts:
 * ; -> y, A -> y'
 * U -> r, M -> r'
 */
export const DEFAULT_KEY_MAPPINGS: KeyMappingConfig = {
  j: 'U',
  f: "U'",
  i: 'R',
  k: "R'",
  h: 'F',
  g: "F'",
  d: 'L',
  e: "L'",
  s: 'D',
  l: "D'",
  w: 'B',
  o: "B'",
  ';': 'y',
  a: "y'",
  u: 'Rw',
  m: "Rw'",
};

export const LOCAL_STORAGE_KEYBINDINGS_KEY = 'cubert_virtual_cube_keybindings';

export const ANIMATION_DURATION_MS = 140; // 100-180ms range requested

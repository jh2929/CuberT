import { CubeEventId } from '../../types/event';

// Standard 3x3 face moves without opposing face redundancy
const CUBE_MOVES_3X3 = [
  ['U', "U'", 'U2'],
  ['D', "D'", 'D2'],
  ['R', "R'", 'R2'],
  ['L', "L'", 'L2'],
  ['F', "F'", 'F2'],
  ['B', "B'", 'B2'],
];

function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Generates a valid WCA-compliant move sequence of specified length
 */
function generateRandomMoves(length: number, allowedAxes = [0, 1, 2, 3, 4, 5]): string {
  const moves: string[] = [];
  let lastAxis = -1;
  let secondLastAxis = -1;

  for (let i = 0; i < length; i++) {
    let axisIndex: number;
    do {
      axisIndex = allowedAxes[Math.floor(Math.random() * allowedAxes.length)];
    } while (
      axisIndex === lastAxis ||
      (Math.floor(axisIndex / 2) === Math.floor(lastAxis / 2) &&
        Math.floor(axisIndex / 2) === Math.floor(secondLastAxis / 2))
    );

    secondLastAxis = lastAxis;
    lastAxis = axisIndex;
    moves.push(getRandomItem(CUBE_MOVES_3X3[axisIndex]));
  }

  return moves.join(' ');
}

/**
 * Ultra-Lucky: Preserves the entire D-cross and 3 of the 4 F2L pairs.
 * Only scrambles the last F2L pair (FR) and the top U-layer using <R, U, R'> triggers.
 * Gives the user a solved cross + 3 pre-solved F2L pairs!
 */
function generateUltraLuckyScramble(): string {
  const triggers = [
    "R U R' U'",
    "R U2 R' U",
    "R U' R' U2",
    "R' U' R U",
    "U R U' R'",
    "U2 R U2 R'",
    "R U2 R' U'",
    "U' R U R' U2",
  ];
  // Chain 4-5 triggers so the last slot & top layer are thoroughly scrambled
  const count = Math.floor(Math.random() * 2) + 3;
  const selected: string[] = [];
  for (let i = 0; i < count; i++) {
    selected.push(getRandomItem(triggers));
  }
  return selected.join(' ');
}

/**
 * High-Lucky: Cross is 1 move away from solved and at least 1 F2L pair is formed
 */
function generateHighLuckyScramble(): string {
  const body = generateRandomMoves(10);
  const align = getRandomItem(['D', "D'", 'D2']);
  return `${body} ${align}`;
}

/**
 * Normal-Lucky: Short scramble (9-12 moves) leaving blocks naturally formed
 */
function generateShortLuckyScramble(): string {
  const length = Math.floor(Math.random() * 4) + 9; // 9, 10, 11, or 12 moves
  return generateRandomMoves(length);
}

/**
 * Low-Lucky: Mildly shorter scramble (13-15 moves)
 */
function generateMildLuckyScramble(): string {
  const length = Math.floor(Math.random() * 3) + 13;
  return generateRandomMoves(length);
}

/**
 * Determines whether a lucky scramble should trigger according to the configured level:
 * 0: Never (0%)
 * 1: Low (~8%)
 * 2: Normal (~18%) [Default]
 * 3: High (~40%)
 * 4: Ultra (~75%) [Cross + 3 F2L pairs]
 */
export function shouldGenerateLuckyScramble(enabled = true, level = 2): boolean {
  if (!enabled || level === 0) return false;

  switch (level) {
    case 1:
      return Math.random() < 0.08;
    case 2:
      return Math.random() < 0.18;
    case 3:
      return Math.random() < 0.40;
    case 4:
      return Math.random() < 0.75;
    default:
      return Math.random() < 0.18;
  }
}

/**
 * Generates a lucky scramble adapted to the requested level
 */
export function generateLuckyScramble(event: CubeEventId = '333', level = 2): string {
  if (event !== '333' && event !== '333oh') {
    return generateRandomMoves(8);
  }

  if (level === 4) {
    return generateUltraLuckyScramble();
  }

  if (level === 3) {
    return Math.random() > 0.4 ? generateUltraLuckyScramble() : generateHighLuckyScramble();
  }

  if (level === 1) {
    return generateMildLuckyScramble();
  }

  // Level 2 (Normal)
  const roll = Math.random();
  if (roll < 0.3) {
    return generateUltraLuckyScramble();
  } else if (roll < 0.65) {
    return generateHighLuckyScramble();
  } else {
    return generateShortLuckyScramble();
  }
}

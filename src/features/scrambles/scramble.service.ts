import { CubeEventId } from '../../types/event';

// Fast fallback generators following WCA regulations
const CUBE_MOVES_3X3 = [
  ['U', "U'", 'U2'],
  ['D', "D'", 'D2'],
  ['R', "R'", 'R2'],
  ['L', "L'", 'L2'],
  ['F', "F'", 'F2'],
  ['B', "B'", 'B2'],
];

const CUBE_MOVES_2X2 = [
  ['U', "U'", 'U2'],
  ['R', "R'", 'R2'],
  ['F', "F'", 'F2'],
];

const CUBE_MOVES_4X4_WIDE = [
  ['U', "U'", 'U2', 'Uw', "Uw'", 'Uw2'],
  ['D', "D'", 'D2'],
  ['R', "R'", 'R2', 'Rw', "Rw'", 'Rw2'],
  ['L', "L'", 'L2'],
  ['F', "F'", 'F2', 'Fw', "Fw'", 'Fw2'],
  ['B', "B'", 'B2'],
];

const PYRA_MOVES = [
  ['U', "U'"],
  ['L', "L'"],
  ['R', "R'"],
  ['B', "B'"],
];
const PYRA_TIPS = [
  ['u', "u'"],
  ['l', "l'"],
  ['r', "r'"],
  ['b', "b'"],
];

const SKEWB_MOVES = [
  ['U', "U'"],
  ['R', "R'"],
  ['L', "L'"],
  ['B', "B'"],
];

function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateRandomMoveCube(axes: string[][], length: number): string {
  const moves: string[] = [];
  let lastAxis = -1;
  let secondLastAxis = -1;

  for (let i = 0; i < length; i++) {
    let axis: number;
    do {
      axis = Math.floor(Math.random() * axes.length);
    } while (
      axis === lastAxis ||
      // Prevent redundant moves on opposite parallel faces like R L R'
      (Math.floor(axis / 2) === Math.floor(lastAxis / 2) &&
        Math.floor(axis / 2) === Math.floor(secondLastAxis / 2))
    );

    secondLastAxis = lastAxis;
    lastAxis = axis;
    moves.push(getRandomItem(axes[axis]));
  }

  return moves.join(' ');
}

function generateFallbackMegaminx(): string {
  const lines: string[] = [];
  const movesPerLine = 10;
  for (let l = 0; l < 7; l++) {
    const lineMoves: string[] = [];
    for (let i = 0; i < movesPerLine; i++) {
      const isR = i % 2 === 0;
      const dir = Math.random() > 0.5 ? '++' : '--';
      lineMoves.push(`${isR ? 'R' : 'D'}${dir}`);
    }
    lineMoves.push(Math.random() > 0.5 ? 'U' : "U'");
    lines.push(lineMoves.join(' '));
  }
  return lines.join('\n');
}

function generateFallbackPyraminx(): string {
  const body = generateRandomMoveCube(PYRA_MOVES, 10);
  const tips: string[] = [];
  for (const tip of PYRA_TIPS) {
    if (Math.random() > 0.5) {
      tips.push(getRandomItem(tip));
    }
  }
  return tips.length > 0 ? `${body} ${tips.join(' ')}` : body;
}

function generateFallbackSkewb(): string {
  return generateRandomMoveCube(SKEWB_MOVES, 9);
}

function generateFallbackClock(): string {
  const pins = ['UR', 'DR', 'DL', 'UL'];
  const moves: string[] = [];
  const randDial = () => {
    const n = Math.floor(Math.random() * 12) - 5; // -5 to +6
    return n >= 0 ? `${n}+` : `${Math.abs(n)}-`;
  };

  for (const p of ['UR', 'DR', 'DL', 'UL', 'ALL']) {
    moves.push(`${p}${randDial()}`);
  }
  moves.push('y2');
  for (const p of ['U', 'R', 'D', 'L', 'ALL']) {
    moves.push(`${p}${randDial()}`);
  }
  for (const pin of pins) {
    if (Math.random() > 0.5) moves.push(pin);
  }
  return moves.join(' ');
}

/**
 * Generate fallback scramble immediately without async delay
 */
export function generateFallbackScramble(event: CubeEventId): string {
  switch (event) {
    case '222':
      return generateRandomMoveCube(CUBE_MOVES_2X2, 10);
    case '333':
    case '333oh':
    case '333bld':
      return generateRandomMoveCube(CUBE_MOVES_3X3, 21);
    case '444':
      return generateRandomMoveCube(CUBE_MOVES_4X4_WIDE, 44);
    case '555':
      return generateRandomMoveCube(CUBE_MOVES_4X4_WIDE, 60);
    case '666':
      return generateRandomMoveCube(CUBE_MOVES_4X4_WIDE, 80);
    case '777':
      return generateRandomMoveCube(CUBE_MOVES_4X4_WIDE, 100);
    case 'pyram':
      return generateFallbackPyraminx();
    case 'skewb':
      return generateFallbackSkewb();
    case 'minx':
      return generateFallbackMegaminx();
    case 'clock':
      return generateFallbackClock();
    case 'sq1':
      // Simplified Square-1 notation
      return "/ (1, 0) / (0, -3) / (-1, -1) / (3, 0) / (0, 3) / (-3, 0) / (0, -3) / (1, 2) / (0, 3) /";
    default:
      return generateRandomMoveCube(CUBE_MOVES_3X3, 21);
  }
}

let cubingScramblePromise: Promise<typeof import('cubing/scramble')> | null = null;

function getCubingScrambleModule() {
  if (!cubingScramblePromise) {
    cubingScramblePromise = import('cubing/scramble');
  }
  return cubingScramblePromise;
}

/**
 * Maps our CubeEventId to cubing.js event string
 */
function mapEventToCubing(event: CubeEventId): string {
  switch (event) {
    case '333':
    case '333oh':
    case '333bld':
      return '333';
    case '222':
      return '222';
    case '444':
      return '444';
    case '555':
      return '555';
    case '666':
      return '666';
    case '777':
      return '777';
    case 'pyram':
      return 'pyram';
    case 'skewb':
      return 'skewb';
    case 'minx':
      return 'minx';
    case 'sq1':
      return 'sq1';
    case 'clock':
      return 'clock';
    default:
      return '333';
  }
}

/**
 * Generates an official WCA scramble via cubing.js with fallback
 */
export async function generateScramble(event: CubeEventId): Promise<string> {
  try {
    const cubing = await getCubingScrambleModule();
    const cubingId = mapEventToCubing(event);
    const scrambleObj = await cubing.randomScrambleForEvent(cubingId);
    return scrambleObj.toString();
  } catch (err) {
    console.warn('cubing.js scramble failed, using fallback:', err);
    return generateFallbackScramble(event);
  }
}

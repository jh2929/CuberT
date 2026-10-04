import { Solve } from '../../types/solve';

/**
 * Returns trim count (number of best and worst solves to trim) according to WCA regulations:
 * N = 5 -> trim 1 best, 1 worst (middle 3 averaged)
 * N = 12 -> trim 1 best, 1 worst (middle 10 averaged)
 * N = 100 -> trim 5 best, 5 worst (middle 90 averaged)
 * General formula for N >= 20: Math.ceil(N * 0.05)
 */
export function getTrimCount(size: number): number {
  if (size < 3) return 0;
  if (size === 5 || size === 12) return 1;
  return Math.max(1, Math.ceil(size * 0.05));
}

/**
 * Computes trimmed average of an array of solves according to WCA regulations.
 * Returns null if size requirement not met or if average evaluates to DNF.
 */
export function calculateTrimmedAverage(solves: Solve[], count: number): number | null {
  if (solves.length < count) {
    return null;
  }

  const window = solves.slice(0, count);
  const trimCount = getTrimCount(count);

  let dnfCount = 0;
  const validTimes: number[] = [];

  for (const s of window) {
    if (s.penalty === 'DNF' || s.finalTime === null) {
      dnfCount++;
    } else {
      validTimes.push(s.finalTime);
    }
  }

  // If there are more DNFs than allowed to be trimmed, the average is DNF
  if (dnfCount > trimCount) {
    return null; // DNF
  }

  // Sort valid times ascending
  validTimes.sort((a, b) => a - b);

  // Remaining worst slots to drop after accounting for dropped DNFs
  const worstSlotsRemaining = trimCount - dnfCount;

  // Slice off the trimCount best times from the front
  // and worstSlotsRemaining times from the back
  const endSlice = validTimes.length - worstSlotsRemaining;
  const trimmed = validTimes.slice(trimCount, endSlice);

  if (trimmed.length === 0) {
    return null;
  }

  const sum = trimmed.reduce((acc, t) => acc + t, 0);
  return Math.round(sum / trimmed.length);
}

/**
 * Calculates current Ao5 from solves list (ordered most recent first).
 */
export function calculateAo5(solves: Solve[]): number | null {
  return calculateTrimmedAverage(solves, 5);
}

/**
 * Calculates current Ao12 from solves list (ordered most recent first).
 */
export function calculateAo12(solves: Solve[]): number | null {
  return calculateTrimmedAverage(solves, 12);
}

/**
 * Calculates current Ao100 from solves list (ordered most recent first).
 */
export function calculateAo100(solves: Solve[]): number | null {
  return calculateTrimmedAverage(solves, 100);
}

/**
 * Calculates Mean of 3 (Mo3) - without trimming best/worst.
 * If any solve is DNF, result is DNF (null).
 */
export function calculateMo3(solves: Solve[]): number | null {
  if (solves.length < 3) return null;
  const window = solves.slice(0, 3);
  let sum = 0;
  for (const s of window) {
    if (s.penalty === 'DNF' || s.finalTime === null) {
      return null;
    }
    sum += s.finalTime;
  }
  return Math.round(sum / 3);
}

/**
 * Finds the best average of given size across the entire solves array.
 * Note: solves are assumed ordered chronologically or reverse-chronologically.
 * We normalize by sorting chronologically, then slide a window of size `count`.
 */
export function calculateBestAverage(solves: Solve[], count: number): number | null {
  if (solves.length < count) {
    return null;
  }

  // Order chronologically (oldest to newest) to slide through historical progression
  const sorted = [...solves].sort((a, b) => a.createdAt - b.createdAt);

  let best: number | null = null;

  for (let i = 0; i <= sorted.length - count; i++) {
    const window = sorted.slice(i, i + count);
    const avg = calculateTrimmedAverage(window, count);
    if (avg !== null) {
      if (best === null || avg < best) {
        best = avg;
      }
    }
  }

  return best;
}

/**
 * Computes all sliding averages of given count for charts (ordered chronologically).
 * Returns array of values (number or null for DNF/insufficient) corresponding to each solve index.
 */
export function calculateRollingAverages(solvesChronological: Solve[], count: number): (number | null)[] {
  const result: (number | null)[] = new Array(solvesChronological.length).fill(null);

  for (let i = count - 1; i < solvesChronological.length; i++) {
    const window = solvesChronological.slice(i - count + 1, i + 1);
    result[i] = calculateTrimmedAverage(window, count);
  }

  return result;
}

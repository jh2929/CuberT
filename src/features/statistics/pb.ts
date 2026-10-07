import { Solve } from '../../types/solve';
import { calculateBestAverage, calculateAo5, calculateAo12, calculateAo100 } from './averages';

export interface PersonalBests {
  single: number | null;
  ao5: number | null;
  ao12: number | null;
  ao100: number | null;
}

export interface NewPBNotification {
  type: 'single' | 'ao5' | 'ao12' | 'ao100';
  value: number;
}

/**
 * Calculates current personal bests for a session's solves.
 */
export function calculatePersonalBests(solves: Solve[]): PersonalBests {
  let single: number | null = null;

  for (const s of solves) {
    if (s.penalty !== 'DNF' && s.finalTime !== null) {
      if (single === null || s.finalTime < single) {
        single = s.finalTime;
      }
    }
  }

  return {
    single,
    ao5: calculateBestAverage(solves, 5),
    ao12: calculateBestAverage(solves, 12),
    ao100: calculateBestAverage(solves, 100),
  };
}

/**
 * Check if the newly added solve achieved a new PB Single or Avg compared to previous PBs.
 */
export function checkForNewPB(
  previousPBs: PersonalBests,
  newSolve: Solve,
  allSolvesRecentFirst: Solve[]
): NewPBNotification | null {
  // Check single: only fires when an existing PB was broken
  if (newSolve.penalty !== 'DNF' && newSolve.finalTime !== null) {
    if (previousPBs.single !== null && newSolve.finalTime < previousPBs.single) {
      return { type: 'single', value: newSolve.finalTime };
    }
  }

  // Check current Ao5: only fires when breaking an existing Ao5 PB record
  const currentAo5 = calculateAo5(allSolvesRecentFirst);
  if (currentAo5 !== null) {
    if (previousPBs.ao5 !== null && currentAo5 < previousPBs.ao5) {
      return { type: 'ao5', value: currentAo5 };
    }
  }

  // Check current Ao12: only fires when breaking an existing Ao12 PB record
  const currentAo12 = calculateAo12(allSolvesRecentFirst);
  if (currentAo12 !== null) {
    if (previousPBs.ao12 !== null && currentAo12 < previousPBs.ao12) {
      return { type: 'ao12', value: currentAo12 };
    }
  }

  // Check current Ao100: only fires when breaking an existing Ao100 PB record
  const currentAo100 = calculateAo100(allSolvesRecentFirst);
  if (currentAo100 !== null) {
    if (previousPBs.ao100 !== null && currentAo100 < previousPBs.ao100) {
      return { type: 'ao100', value: currentAo100 };
    }
  }

  return null;
}

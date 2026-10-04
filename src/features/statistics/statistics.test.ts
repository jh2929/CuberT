import { describe, it, expect } from 'vitest';
import { Solve } from '../../types/solve';
import { calculateAo5, calculateAo12, calculateAo100, calculateBestAverage } from './averages';
import { calculateSessionStats } from './statistics';
import { calculatePersonalBests } from './pb';
import { formatTime } from '../../utils/formatTime';

function makeSolve(timeMs: number, penalty: 'none' | '+2' | 'DNF' = 'none', id = 's'): Solve {
  let finalTime: number | null = timeMs;
  if (penalty === '+2') {
    finalTime = timeMs + 2000;
  } else if (penalty === 'DNF') {
    finalTime = null;
  }

  return {
    id: `${id}-${Math.random()}`,
    sessionId: 'session-1',
    event: '333',
    rawTime: timeMs,
    finalTime,
    penalty,
    scramble: "R U R' U'",
    createdAt: Date.now(),
  };
}

describe('WCA Averages Calculation', () => {
  it('returns null when solves count is fewer than needed', () => {
    const solves = [
      makeSolve(10000),
      makeSolve(11000),
      makeSolve(12000),
      makeSolve(13000),
    ];
    expect(calculateAo5(solves)).toBeNull();
  });

  it('calculates Ao5 correctly with 5 normal solves (drops best and worst, averages middle 3)', () => {
    // Solves: 10.00, 11.00, 12.00, 13.00, 14.00
    // Best: 10.00, Worst: 14.00 -> remaining: 11.00, 12.00, 13.00 -> avg = 12.00 (12000ms)
    const solves = [
      makeSolve(14000),
      makeSolve(10000),
      makeSolve(12000),
      makeSolve(13000),
      makeSolve(11000),
    ];
    expect(calculateAo5(solves)).toBe(12000);
  });

  it('handles 1 DNF in Ao5 (counts as single worst and gets eliminated)', () => {
    // Solves: 10.00, 11.00, 12.00, 13.00, DNF
    // Best: 10.00, Worst: DNF -> remaining: 11.00, 12.00, 13.00 -> avg = 12000ms
    const solves = [
      makeSolve(10000, 'none'),
      makeSolve(11000, 'none'),
      makeSolve(12000, 'none'),
      makeSolve(13000, 'none'),
      makeSolve(15000, 'DNF'),
    ];
    expect(calculateAo5(solves)).toBe(12000);
  });

  it('returns DNF (null) when there are 2 or more DNFs in Ao5', () => {
    const solves = [
      makeSolve(10000, 'none'),
      makeSolve(11000, 'none'),
      makeSolve(12000, 'none'),
      makeSolve(13000, 'DNF'),
      makeSolve(15000, 'DNF'),
    ];
    expect(calculateAo5(solves)).toBeNull();
  });

  it('handles +2 penalties correctly by including the +2000ms', () => {
    // Solves:
    // raw 9000 -> 9000
    // raw 10000 -> 10000
    // raw 10000 +2 -> 12000
    // raw 11000 -> 11000
    // raw 15000 -> 15000
    // Times: 9000, 10000, 11000, 12000, 15000
    // Drop 9000 and 15000 -> average(10000, 11000, 12000) = 11000ms
    const solves = [
      makeSolve(9000, 'none'),
      makeSolve(10000, 'none'),
      makeSolve(10000, '+2'),
      makeSolve(11000, 'none'),
      makeSolve(15000, 'none'),
    ];
    expect(calculateAo5(solves)).toBe(11000);
  });

  it('handles ties correctly in Ao5', () => {
    const solves = [
      makeSolve(10000),
      makeSolve(10000),
      makeSolve(10000),
      makeSolve(10000),
      makeSolve(10000),
    ];
    expect(calculateAo5(solves)).toBe(10000);
  });

  it('calculates Ao12 correctly (drops 1 best and 1 worst out of 12)', () => {
    // 12 solves: 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 5 (best), 20 (worst)
    // Trim 5 and 20 -> remaining ten 10s -> average 10000
    const solves = [
      makeSolve(5000),
      ...Array.from({ length: 10 }, () => makeSolve(10000)),
      makeSolve(20000),
    ];
    expect(calculateAo12(solves)).toBe(10000);
  });

  it('calculates Ao100 correctly (drops 5 best and 5 worst out of 100)', () => {
    // 5 at 1000ms (best 5)
    // 90 at 10000ms (middle 90)
    // 5 at 30000ms (worst 5)
    const solves = [
      ...Array.from({ length: 5 }, () => makeSolve(1000)),
      ...Array.from({ length: 90 }, () => makeSolve(10000)),
      ...Array.from({ length: 5 }, () => makeSolve(30000)),
    ];
    expect(calculateAo100(solves)).toBe(10000);
  });

  it('calculates best average historically', () => {
    const solves = [
      makeSolve(10000),
      makeSolve(10000),
      makeSolve(10000),
      makeSolve(10000),
      makeSolve(10000),
      makeSolve(20000),
      makeSolve(20000),
      makeSolve(20000),
      makeSolve(20000),
      makeSolve(20000),
    ];
    // Solves are assigned createdAt order
    solves.forEach((s, idx) => { s.createdAt = 1000 + idx; });

    // The first window of 5 has avg 10000, the second 20000
    expect(calculateBestAverage(solves, 5)).toBe(10000);
  });
});

describe('Personal Bests', () => {
  it('calculates PB single and average correctly', () => {
    const solves = [
      makeSolve(15000),
      makeSolve(12000),
      makeSolve(9500),
      makeSolve(13000),
      makeSolve(14000),
    ];
    const pbs = calculatePersonalBests(solves);
    expect(pbs.single).toBe(9500);
    expect(pbs.ao5).not.toBeNull();
  });

  it('ignores DNF for PB single', () => {
    const solves = [
      makeSolve(8000, 'DNF'),
      makeSolve(12000, 'none'),
    ];
    const pbs = calculatePersonalBests(solves);
    expect(pbs.single).toBe(12000);
  });
});

describe('Time Formatter', () => {
  it('formats sub-minute times with 2 decimals by default', () => {
    expect(formatTime(9540)).toBe('9.54');
    expect(formatTime(59840)).toBe('59.84');
  });

  it('formats times over a minute correctly (m:ss.xx)', () => {
    expect(formatTime(62430)).toBe('1:02.43');
    expect(formatTime(632110)).toBe('10:32.11');
  });

  it('formats DNF correctly', () => {
    expect(formatTime(null)).toBe('DNF');
    expect(formatTime(12000, 'DNF')).toBe('DNF');
  });

  it('formats +2 with suffix when requested', () => {
    expect(formatTime(12000, '+2', { showPenaltySuffix: true })).toBe('12.00+');
  });

  it('formats 3 decimals when requested', () => {
    expect(formatTime(9547, 'none', { precision: 3 })).toBe('9.547');
  });

  it('formats empty / negative placeholder', () => {
    expect(formatTime(-1, 'none')).toBe('—');
  });
});

describe('Session Stats', () => {
  it('handles empty session gracefully with dashes/nulls', () => {
    const stats = calculateSessionStats([]);
    expect(stats.totalSolves).toBe(0);
    expect(stats.pbSingle).toBeNull();
    expect(stats.ao5).toBeNull();
    expect(stats.ao12).toBeNull();
    expect(stats.ao100).toBeNull();
  });

  it('calculates full statistics correctly', () => {
    const solves = [
      makeSolve(10000),
      makeSolve(11000),
      makeSolve(12000),
      makeSolve(13000),
      makeSolve(14000),
      makeSolve(15000),
    ];
    const stats = calculateSessionStats(solves);
    expect(stats.totalSolves).toBe(6);
    expect(stats.validSolvesCount).toBe(6);
    expect(stats.dnfCount).toBe(0);
    expect(stats.bestTime).toBe(10000);
    expect(stats.worstTime).toBe(15000);
    expect(stats.globalMean).toBe(12500);
    expect(stats.median).toBe(12500);
    expect(stats.distribution.length).toBeGreaterThan(0);
  });
});

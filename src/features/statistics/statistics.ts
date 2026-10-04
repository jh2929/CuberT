import { Solve } from '../../types/solve';
import { calculateAo5, calculateAo12, calculateAo100 } from './averages';
import { calculatePersonalBests, PersonalBests } from './pb';

export interface TimeBucket {
  label: string;
  min: number;
  max: number;
  count: number;
  percentage: number;
}

export interface SessionStats {
  totalSolves: number;
  validSolvesCount: number;
  dnfCount: number;

  // Primary 4 stats
  pbSingle: number | null;
  ao5: number | null;
  ao12: number | null;
  ao100: number | null;

  // Best averages
  bestAo5: number | null;
  bestAo12: number | null;
  bestAo100: number | null;

  // Advanced stats
  bestTime: number | null;
  worstTime: number | null;
  globalMean: number | null;
  median: number | null;
  standardDeviation: number | null;
  consistencyPercent: number | null; // (stdDev / mean) * 100
  best10PercentMean: number | null;
  worst10PercentMean: number | null;

  // Distribution
  distribution: TimeBucket[];

  // Personal Bests structure
  pbs: PersonalBests;
}

/**
 * Calculates full session statistics. Solves are expected to be ordered most recent first.
 */
export function calculateSessionStats(solvesRecentFirst: Solve[]): SessionStats {
  const totalSolves = solvesRecentFirst.length;

  if (totalSolves === 0) {
    const emptyPbs: PersonalBests = { single: null, ao5: null, ao12: null, ao100: null };
    return {
      totalSolves: 0,
      validSolvesCount: 0,
      dnfCount: 0,
      pbSingle: null,
      ao5: null,
      ao12: null,
      ao100: null,
      bestAo5: null,
      bestAo12: null,
      bestAo100: null,
      bestTime: null,
      worstTime: null,
      globalMean: null,
      median: null,
      standardDeviation: null,
      consistencyPercent: null,
      best10PercentMean: null,
      worst10PercentMean: null,
      distribution: [],
      pbs: emptyPbs,
    };
  }

  const pbs = calculatePersonalBests(solvesRecentFirst);

  const ao5 = calculateAo5(solvesRecentFirst);
  const ao12 = calculateAo12(solvesRecentFirst);
  const ao100 = calculateAo100(solvesRecentFirst);

  const validTimes: number[] = [];
  let dnfCount = 0;

  for (const s of solvesRecentFirst) {
    if (s.penalty === 'DNF' || s.finalTime === null) {
      dnfCount++;
    } else {
      validTimes.push(s.finalTime);
    }
  }

  const validSolvesCount = validTimes.length;

  if (validSolvesCount === 0) {
    return {
      totalSolves,
      validSolvesCount: 0,
      dnfCount,
      pbSingle: null,
      ao5,
      ao12,
      ao100,
      bestAo5: pbs.ao5,
      bestAo12: pbs.ao12,
      bestAo100: pbs.ao100,
      bestTime: null,
      worstTime: null,
      globalMean: null,
      median: null,
      standardDeviation: null,
      consistencyPercent: null,
      best10PercentMean: null,
      worst10PercentMean: null,
      distribution: [],
      pbs,
    };
  }

  // Sorted ascending for quantiles and min/max
  const sortedTimes = [...validTimes].sort((a, b) => a - b);
  const bestTime = sortedTimes[0];
  const worstTime = sortedTimes[sortedTimes.length - 1];

  const sum = sortedTimes.reduce((acc, t) => acc + t, 0);
  const globalMean = Math.round(sum / validSolvesCount);

  // Median
  let median: number;
  const mid = Math.floor(sortedTimes.length / 2);
  if (sortedTimes.length % 2 === 0) {
    median = Math.round((sortedTimes[mid - 1] + sortedTimes[mid]) / 2);
  } else {
    median = sortedTimes[mid];
  }

  // Standard Deviation
  const variance =
    sortedTimes.reduce((acc, t) => acc + Math.pow(t - globalMean, 2), 0) / validSolvesCount;
  const standardDeviation = Math.round(Math.sqrt(variance));

  const consistencyPercent =
    globalMean > 0 ? Number(((standardDeviation / globalMean) * 100).toFixed(1)) : null;

  // Best 10% and Worst 10%
  const tenPercentCount = Math.max(1, Math.round(validSolvesCount * 0.1));
  const best10Slice = sortedTimes.slice(0, tenPercentCount);
  const worst10Slice = sortedTimes.slice(sortedTimes.length - tenPercentCount);

  const best10PercentMean = Math.round(
    best10Slice.reduce((acc, t) => acc + t, 0) / best10Slice.length
  );
  const worst10PercentMean = Math.round(
    worst10Slice.reduce((acc, t) => acc + t, 0) / worst10Slice.length
  );

  // Dynamic distribution buckets
  const distribution = calculateDistribution(sortedTimes);

  return {
    totalSolves,
    validSolvesCount,
    dnfCount,
    pbSingle: pbs.single,
    ao5,
    ao12,
    ao100,
    bestAo5: pbs.ao5,
    bestAo12: pbs.ao12,
    bestAo100: pbs.ao100,
    bestTime,
    worstTime,
    globalMean,
    median,
    standardDeviation,
    consistencyPercent,
    best10PercentMean,
    worst10PercentMean,
    distribution,
    pbs,
  };
}

/**
 * Calculates dynamic histogram distribution buckets based on times.
 */
function calculateDistribution(sortedTimes: number[]): TimeBucket[] {
  if (sortedTimes.length === 0) return [];

  const minSec = Math.floor(sortedTimes[0] / 1000);
  const maxSec = Math.ceil(sortedTimes[sortedTimes.length - 1] / 1000);
  const range = maxSec - minSec;

  // Choose bucket size: 1s, 2s, 5s, or 10s depending on spread
  let bucketSize = 1;
  if (range > 60) {
    bucketSize = 10;
  } else if (range > 25) {
    bucketSize = 5;
  } else if (range > 12) {
    bucketSize = 2;
  } else {
    bucketSize = 1;
  }

  const start = Math.floor(minSec / bucketSize) * bucketSize;
  const numBuckets = Math.min(10, Math.max(3, Math.ceil((maxSec - start) / bucketSize)));

  const buckets: TimeBucket[] = [];
  for (let i = 0; i < numBuckets; i++) {
    const bMin = (start + i * bucketSize) * 1000;
    const bMax = (start + (i + 1) * bucketSize) * 1000;
    const isLast = i === numBuckets - 1;

    const label =
      isLast && maxSec > (start + (i + 1) * bucketSize)
        ? `${start + i * bucketSize}s+`
        : `${start + i * bucketSize}-${start + (i + 1) * bucketSize}s`;

    buckets.push({
      label,
      min: bMin,
      max: isLast ? Infinity : bMax,
      count: 0,
      percentage: 0,
    });
  }

  // Populate counts
  for (const time of sortedTimes) {
    for (const b of buckets) {
      if (time >= b.min && time < b.max) {
        b.count++;
        break;
      }
    }
  }

  const total = sortedTimes.length;
  for (const b of buckets) {
    b.percentage = total > 0 ? Number(((b.count / total) * 100).toFixed(1)) : 0;
  }

  return buckets;
}

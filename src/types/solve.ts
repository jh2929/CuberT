import { CubeEventId } from './event';

export type Penalty = 'none' | '+2' | 'DNF';

export interface Solve {
  id: string;
  sessionId: string;
  event: CubeEventId;

  rawTime: number; // In milliseconds
  finalTime: number | null; // rawTime, rawTime + 2000, or null for DNF

  penalty: Penalty;

  scramble: string;

  createdAt: number;

  note?: string;
}

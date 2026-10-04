export type TimerState =
  | 'idle'
  | 'inspection'
  | 'holding'
  | 'ready'
  | 'running'
  | 'stopped';

export interface TimerMachineContext {
  state: TimerState;
  startTime: number | null; // performance.now()
  elapsed: number; // in milliseconds
  inspectionStartTime: number | null;
  inspectionRemaining: number; // in seconds
  inspectionPenalty: 'none' | '+2' | 'DNF';
}

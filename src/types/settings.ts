export type ThemeMode = 'light' | 'dark' | 'system';
export type TimerPrecision = 2 | 3;
export type HoldDelay = 300 | 500 | 700;
export type AnimationSetting = 'normal' | 'reduced';

export interface UserSettings {
  theme: ThemeMode;
  inspection: boolean;
  timerPrecision: TimerPrecision;
  holdDelay: HoldDelay;
  showScramble: boolean;
  soundEnabled: boolean;
  animation: AnimationSetting;
  confirmSolveDeletion: boolean;
  backupReminderInterval: number; // e.g. 100 solves; 0 to disable
  lastBackupSolveCount: number;
  luckyScrambles: boolean;
  luckyScrambleLevel: number; // 0: never, 1: low, 2: normal (default), 3: high, 4: ultra (cross + 3 pairs)
}

export const DEFAULT_SETTINGS: UserSettings = {
  theme: 'dark',
  inspection: false,
  timerPrecision: 2,
  holdDelay: 500,
  showScramble: true,
  soundEnabled: false,
  animation: 'normal',
  confirmSolveDeletion: true,
  backupReminderInterval: 100,
  lastBackupSolveCount: 0,
  luckyScrambles: true,
  luckyScrambleLevel: 2,
};



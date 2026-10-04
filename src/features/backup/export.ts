import { Solve } from '../../types/solve';
import { Session } from '../../types/session';
import { UserSettings } from '../../types/settings';

export interface CuberTBackupData {
  version: 1;
  exportedAt: string;
  app: 'CuberT';
  sessions: Session[];
  solves: Solve[];
  settings: UserSettings;
}

export function createBackupJson(
  sessions: Session[],
  solves: Solve[],
  settings: UserSettings
): string {
  const data: CuberTBackupData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    app: 'CuberT',
    sessions,
    solves,
    settings,
  };
  return JSON.stringify(data, null, 2);
}

export function downloadBackupFile(jsonString: string, filename?: string): void {
  const dateStr = new Date().toISOString().split('T')[0];
  const name = filename || `cubert-backup-${dateStr}.json`;
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

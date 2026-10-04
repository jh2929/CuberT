import { describe, it, expect } from 'vitest';
import { createBackupJson } from './export';
import { validateBackupJson, mergeImportData } from './import';
import { DEFAULT_SETTINGS } from '../../types/settings';
import { Session } from '../../types/session';
import { Solve } from '../../types/solve';

describe('Backup Export & Import', () => {
  const mockSessions: Session[] = [
    { id: 'sess-1', name: 'Practice', event: '333', createdAt: 1000 },
  ];
  const mockSolves: Solve[] = [
    {
      id: 'solve-1',
      sessionId: 'sess-1',
      event: '333',
      rawTime: 12500,
      finalTime: 12500,
      penalty: 'none',
      scramble: "R U R' U'",
      createdAt: 2000,
    },
  ];

  it('exports valid JSON matching schema version 1', () => {
    const json = createBackupJson(mockSessions, mockSolves, DEFAULT_SETTINGS);
    const parsed = JSON.parse(json);

    expect(parsed.version).toBe(1);
    expect(parsed.app).toBe('CuberT');
    expect(parsed.sessions).toHaveLength(1);
    expect(parsed.solves).toHaveLength(1);
    expect(parsed.settings).toBeDefined();
  });

  it('validates a correct backup file', () => {
    const json = createBackupJson(mockSessions, mockSolves, DEFAULT_SETTINGS);
    const result = validateBackupJson(json);

    expect(result.valid).toBe(true);
    expect(result.summary?.sessionsCount).toBe(1);
    expect(result.summary?.solvesCount).toBe(1);
  });

  it('rejects invalid or corrupted JSON', () => {
    expect(validateBackupJson('{ bad json').valid).toBe(false);
    expect(validateBackupJson(JSON.stringify({ version: 2 })).valid).toBe(false);
    expect(validateBackupJson(JSON.stringify({ version: 1, sessions: 'not an array' })).valid).toBe(false);
  });

  it('merges imported data without duplicating existing IDs', () => {
    const existingSessions: Session[] = [
      { id: 'sess-1', name: 'Practice', event: '333', createdAt: 1000 },
    ];
    const existingSolves: Solve[] = [
      {
        id: 'solve-1',
        sessionId: 'sess-1',
        event: '333',
        rawTime: 12500,
        finalTime: 12500,
        penalty: 'none',
        scramble: "R U R' U'",
        createdAt: 2000,
      },
    ];

    const importedData = {
      version: 1 as const,
      app: 'CuberT' as const,
      exportedAt: new Date().toISOString(),
      sessions: [
        { id: 'sess-1', name: 'Practice', event: '333' as const, createdAt: 1000 }, // Duplicate
        { id: 'sess-2', name: 'One Handed', event: '333oh' as const, createdAt: 1500 }, // New
      ],
      solves: [
        {
          id: 'solve-1', // Duplicate
          sessionId: 'sess-1',
          event: '333' as const,
          rawTime: 12500,
          finalTime: 12500,
          penalty: 'none' as const,
          scramble: "R U R' U'",
          createdAt: 2000,
        },
        {
          id: 'solve-2', // New
          sessionId: 'sess-2',
          event: '333oh' as const,
          rawTime: 25000,
          finalTime: 25000,
          penalty: 'none' as const,
          scramble: "R U R' U'",
          createdAt: 3000,
        },
      ],
      settings: DEFAULT_SETTINGS,
    };

    const merged = mergeImportData(existingSessions, existingSolves, importedData);
    expect(merged.sessions).toHaveLength(2);
    expect(merged.solves).toHaveLength(2);
    expect(merged.solves[0].id).toBe('solve-2'); // Sorted newest first
  });
});

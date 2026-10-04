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

  it('correctly parses csTimer exports with session metadata and penalties', () => {
    const csTimerJson = JSON.stringify({
      session1: [
        [[0, 11500], "R U R' U'", '', 1680000001],
        [[2000, 14200], "F R U R' U' F'", 'OLL mistake', 1680000002],
        [[-1, 9900], 'U R U2', '', 1680000003],
      ],
      properties: {
        sessionData: JSON.stringify({
          '1': { name: 'Main 3x3', opt: { scrType: '333' } },
        }),
      },
    });

    const result = validateBackupJson(csTimerJson);
    expect(result.valid).toBe(true);
    expect(result.format).toBe('csTimer');
    expect(result.summary?.solvesCount).toBe(3);
    expect(result.summary?.sessionsCount).toBe(1);

    const data = result.data!;
    expect(data.sessions[0].name).toBe('Main 3x3');
    expect(data.sessions[0].event).toBe('333');

    // Check penalty handling
    const dnfSolve = data.solves.find((s) => s.penalty === 'DNF');
    expect(dnfSolve).toBeDefined();
    expect(dnfSolve?.finalTime).toBeNull();

    const plusTwoSolve = data.solves.find((s) => s.penalty === '+2');
    expect(plusTwoSolve).toBeDefined();
    expect(plusTwoSolve?.finalTime).toBe(14200); // 12200 + 2000
    expect(plusTwoSolve?.note).toBe('OLL mistake');
  });

  it('guarantees localhost existing solves are NEVER deleted when merging', () => {
    const localhostSolves: Solve[] = [
      {
        id: 'user-treasured-pb-solve',
        sessionId: 'my-local-sess',
        event: '333',
        rawTime: 8450,
        finalTime: 8450,
        penalty: 'none',
        scramble: 'F2 L2 U ...',
        createdAt: 9999999,
        note: 'My fastest solve ever!',
      },
    ];
    const localhostSessions: Session[] = [
      { id: 'my-local-sess', name: 'My Local Solves', event: '333', createdAt: 9999990 },
    ];

    const foreignImport = {
      version: 1 as const,
      app: 'CuberT' as const,
      exportedAt: new Date().toISOString(),
      sessions: [{ id: 'other-sess', name: 'Other', event: '333' as const, createdAt: 1000 }],
      solves: [
        {
          id: 'foreign-solve-1',
          sessionId: 'other-sess',
          event: '333' as const,
          rawTime: 15000,
          finalTime: 15000,
          penalty: 'none' as const,
          scramble: 'R U ...',
          createdAt: 1000,
        },
      ],
      settings: DEFAULT_SETTINGS,
    };

    const merged = mergeImportData(localhostSessions, localhostSolves, foreignImport);
    expect(merged.solves).toHaveLength(2);
    // User's treasured solve is preserved exactly
    const treasured = merged.solves.find((s) => s.id === 'user-treasured-pb-solve');
    expect(treasured).toBeDefined();
    expect(treasured?.rawTime).toBe(8450);
    expect(treasured?.note).toBe('My fastest solve ever!');

    // User's local session is preserved
    expect(merged.sessions.some((s) => s.id === 'my-local-sess')).toBe(true);
  });
});


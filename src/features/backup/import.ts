import { CuberTBackupData } from './export';
import { Solve } from '../../types/solve';
import { Session } from '../../types/session';
import { UserSettings, DEFAULT_SETTINGS } from '../../types/settings';

export interface ImportValidationResult {
  valid: boolean;
  error?: string;
  data?: CuberTBackupData;
  summary?: {
    sessionsCount: number;
    solvesCount: number;
  };
}

export function validateBackupJson(jsonString: string): ImportValidationResult {
  try {
    const parsed = JSON.parse(jsonString);

    if (!parsed || typeof parsed !== 'object') {
      return { valid: false, error: 'Formato inválido: el archivo no contiene un objeto JSON.' };
    }

    if (parsed.version !== 1) {
      return { valid: false, error: `Versión no compatible (${parsed.version}). Se espera versión 1.` };
    }

    if (!Array.isArray(parsed.sessions)) {
      return { valid: false, error: 'Faltan datos de sesiones o formato inválido.' };
    }

    if (!Array.isArray(parsed.solves)) {
      return { valid: false, error: 'Faltan datos de solves o formato inválido.' };
    }

    // Validate sessions
    for (const sess of parsed.sessions) {
      if (!sess.id || !sess.name || !sess.event) {
        return { valid: false, error: 'Una o más sesiones contienen campos requeridos faltantes.' };
      }
    }

    // Validate solves
    for (const solve of parsed.solves) {
      if (
        !solve.id ||
        !solve.sessionId ||
        !solve.event ||
        typeof solve.rawTime !== 'number' ||
        typeof solve.createdAt !== 'number'
      ) {
        return { valid: false, error: 'Uno o más solves contienen datos corruptos o incompletos.' };
      }
    }

    // Safe settings fallback
    const settings: UserSettings = {
      ...DEFAULT_SETTINGS,
      ...(parsed.settings || {}),
    };

    const validData: CuberTBackupData = {
      version: 1,
      exportedAt: parsed.exportedAt || new Date().toISOString(),
      app: 'CuberT',
      sessions: parsed.sessions,
      solves: parsed.solves,
      settings,
    };

    return {
      valid: true,
      data: validData,
      summary: {
        sessionsCount: validData.sessions.length,
        solvesCount: validData.solves.length,
      },
    };
  } catch (err: any) {
    return { valid: false, error: `Error de análisis JSON: ${err.message}` };
  }
}

export function mergeImportData(
  currentSessions: Session[],
  currentSolves: Solve[],
  importedData: CuberTBackupData
): { sessions: Session[]; solves: Solve[] } {
  // Merge sessions by ID
  const sessionMap = new Map<string, Session>();
  for (const s of currentSessions) {
    sessionMap.set(s.id, s);
  }
  for (const s of importedData.sessions) {
    if (!sessionMap.has(s.id)) {
      sessionMap.set(s.id, s);
    }
  }

  // Merge solves by ID
  const solveMap = new Map<string, Solve>();
  for (const s of currentSolves) {
    solveMap.set(s.id, s);
  }
  for (const s of importedData.solves) {
    if (!solveMap.has(s.id)) {
      solveMap.set(s.id, s);
    }
  }

  const mergedSessions = Array.from(sessionMap.values());
  const mergedSolves = Array.from(solveMap.values()).sort((a, b) => b.createdAt - a.createdAt);

  return {
    sessions: mergedSessions,
    solves: mergedSolves,
  };
}

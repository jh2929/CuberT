import { CuberTBackupData } from './export';
import { Solve, Penalty } from '../../types/solve';
import { Session } from '../../types/session';
import { UserSettings, DEFAULT_SETTINGS } from '../../types/settings';
import { CubeEventId } from '../../types/event';
import { generateId } from '../../utils/generateId';

export interface ImportValidationResult {
  valid: boolean;
  format?: 'CuberT' | 'csTimer' | 'Generic';
  error?: string;
  data?: CuberTBackupData;
  summary?: {
    sessionsCount: number;
    solvesCount: number;
  };
}

export interface MergeOptions {
  targetSessionId?: string; // If provided, puts all imported solves directly into this session
}

const EVENT_MAP: Record<string, CubeEventId> = {
  '333': '333',
  '3x3': '333',
  '3x3x3': '333',
  '222': '222',
  '2x2': '222',
  '2x2x2': '222',
  '444': '444',
  '4x4': '444',
  '4x4x4': '444',
  '555': '555',
  '5x5': '555',
  '5x5x5': '555',
  '666': '666',
  '6x6': '666',
  '777': '777',
  '7x7': '777',
  'pyram': 'pyram',
  'pyraminx': 'pyram',
  'minx': 'minx',
  'megaminx': 'minx',
  'skewb': 'skewb',
  'sq1': 'sq1',
  'square-1': 'sq1',
  'square1': 'sq1',
  'clock': 'clock',
  '333oh': '333oh',
  'oh': '333oh',
  '333bld': '333bld',
  'bld': '333bld',
};

export function parseTimeToMs(val: any): number | null {
  if (val === null || val === undefined) return null;

  if (typeof val === 'number') {
    if (isNaN(val) || val <= 0) return null;
    // If under 120 and has decimals, it's likely seconds (e.g. 12.45s = 12450ms)
    if (val < 120 && !Number.isInteger(val)) {
      return Math.round(val * 1000);
    }
    return Math.round(val);
  }

  if (typeof val === 'string') {
    const clean = val.trim().replace(/s$/i, '').trim();
    if (!clean) return null;

    // Check for "MM:SS.xx" format e.g. "1:14.23"
    if (clean.includes(':')) {
      const parts = clean.split(':');
      if (parts.length === 2) {
        const minutes = parseFloat(parts[0]);
        const seconds = parseFloat(parts[1]);
        if (!isNaN(minutes) && !isNaN(seconds)) {
          return Math.round((minutes * 60 + seconds) * 1000);
        }
      }
    }

    const num = parseFloat(clean);
    if (isNaN(num) || num <= 0) return null;

    if (num < 120 && clean.includes('.')) {
      return Math.round(num * 1000);
    }
    return Math.round(num);
  }

  return null;
}

function sanitizeSolve(
  raw: any,
  defaultSessionId: string,
  defaultEvent: CubeEventId,
  index: number
): Solve | null {
  if (!raw || typeof raw !== 'object') return null;

  // Search across common property names for time
  const possibleTime =
    raw.rawTime ??
    raw.time ??
    raw.finalTime ??
    raw.result ??
    raw.duration ??
    raw.t ??
    raw.millis ??
    raw.ms ??
    raw.seconds;

  const rawTime = parseTimeToMs(possibleTime);
  if (!rawTime) return null;

  // Penalty
  let penalty: Penalty = 'none';
  const p = String(raw.penalty ?? raw.pen ?? '').trim();
  if (p === '+2' || p === '2' || p === '2000' || raw.penalty === 2000 || raw.plusTwo) {
    penalty = '+2';
  } else if (p.toUpperCase() === 'DNF' || p === '-1' || raw.penalty === -1 || raw.dnf) {
    penalty = 'DNF';
  }

  // Final time
  let finalTime: number | null = rawTime;
  if (penalty === '+2') finalTime = rawTime + 2000;
  else if (penalty === 'DNF') finalTime = null;

  // Created at (Must be a valid integer timestamp for IndexedDB key index)
  let createdAt = Date.now() - index * 1000;
  const rawDate =
    raw.createdAt ??
    raw.date ??
    raw.timestamp ??
    raw.time_stamp ??
    raw.created_at ??
    raw.recorded_at;

  if (typeof rawDate === 'number' && rawDate > 0) {
    createdAt = rawDate < 10000000000 ? rawDate * 1000 : rawDate;
  } else if (typeof rawDate === 'string' && rawDate.trim()) {
    const parsedDate = new Date(rawDate).getTime();
    if (!isNaN(parsedDate) && parsedDate > 0) {
      createdAt = parsedDate;
    }
  }
  createdAt = Math.floor(createdAt);

  // Event
  const rawEv = String(raw.event || raw.puzzle || raw.category || raw.type || defaultEvent)
    .toLowerCase()
    .trim();
  const event: CubeEventId = EVENT_MAP[rawEv] || defaultEvent || '333';

  // Session ID
  const sessionId = String(raw.sessionId || defaultSessionId || 'default-session').trim();

  // ID
  const id =
    raw.id && typeof raw.id === 'string' && raw.id.trim().length > 0
      ? raw.id.trim()
      : `solve_${createdAt}_${generateId()}`;

  // Scramble
  const scramble = String(raw.scramble ?? raw.scrambleStr ?? raw.scr ?? raw.alg ?? '').trim();

  // Note
  const note = String(raw.note ?? raw.comment ?? raw.memo ?? '').trim() || undefined;

  return {
    id,
    sessionId,
    event,
    rawTime,
    finalTime,
    penalty,
    scramble,
    createdAt,
    note,
  };
}

function parseCsTimerExport(parsed: any): ImportValidationResult | null {
  const root = parsed.cstimer || parsed.data || parsed;
  const sessionKeys = Object.keys(root).filter(
    (k) => /^session\d+$/.test(k) && Array.isArray(root[k])
  );
  if (sessionKeys.length === 0) return null;

  let sessionDataMap: Record<string, { name?: string; opt?: { scrType?: string } }> = {};
  if (root.properties?.sessionData) {
    try {
      const rawSessionData =
        typeof root.properties.sessionData === 'string'
          ? JSON.parse(root.properties.sessionData)
          : root.properties.sessionData;
      sessionDataMap = rawSessionData || {};
    } catch {
      // Ignore JSON parse error in properties
    }
  }

  const sessions: Session[] = [];
  const solves: Solve[] = [];
  const baseTime = Date.now();

  sessionKeys.forEach((key, sIdx) => {
    const sessionNumStr = key.replace('session', '');
    const meta = sessionDataMap[sessionNumStr] || {};
    const rawScrType = (meta.opt?.scrType || '333').toLowerCase();
    const event: CubeEventId = EVENT_MAP[rawScrType] || '333';
    const sessionName = meta.name || `csTimer Sesión ${sessionNumStr}`;
    const sessionId = `cstimer_sess_${sessionNumStr}_${generateId()}`;

    sessions.push({
      id: sessionId,
      name: sessionName,
      event,
      createdAt: baseTime - (sessionKeys.length - sIdx) * 100000,
    });

    const rawSolvesList = root[key];
    if (Array.isArray(rawSolvesList)) {
      rawSolvesList.forEach((item: any, idx: number) => {
        if (!Array.isArray(item) || item.length < 2) return;
        const [timing, scrambleRaw, commentRaw, timestampRaw] = item;
        if (!Array.isArray(timing) || timing.length < 2) return;

        const penaltyCode = Number(timing[0]);
        const timeMs = Number(timing[1]);
        if (isNaN(timeMs) || timeMs <= 0) return;

        let penalty: Penalty = 'none';
        let rawTime = timeMs;

        if (penaltyCode === 2000) {
          penalty = '+2';
          rawTime = Math.max(0, timeMs - 2000);
        } else if (penaltyCode === -1) {
          penalty = 'DNF';
          rawTime = timeMs;
        }

        let createdAt = Number(timestampRaw);
        if (isNaN(createdAt) || createdAt <= 0) {
          createdAt = baseTime - (rawSolvesList.length - idx) * 2000;
        } else if (createdAt < 10000000000) {
          createdAt = createdAt * 1000;
        }
        createdAt = Math.floor(createdAt);

        const scramble = typeof scrambleRaw === 'string' ? scrambleRaw.trim() : '';
        const note = typeof commentRaw === 'string' && commentRaw.trim() ? commentRaw.trim() : undefined;

        solves.push({
          id: `cstimer_solve_${createdAt}_${generateId()}`,
          sessionId,
          event,
          rawTime,
          finalTime: penalty === '+2' ? rawTime + 2000 : penalty === 'DNF' ? null : rawTime,
          penalty,
          scramble,
          createdAt,
          note,
        });
      });
    }
  });

  if (solves.length === 0) {
    return {
      valid: false,
      error: 'Se detectó estructura de csTimer pero no contenía ningún solve válido.',
    };
  }

  solves.sort((a, b) => b.createdAt - a.createdAt);

  return {
    valid: true,
    format: 'csTimer',
    data: {
      version: 1,
      exportedAt: new Date().toISOString(),
      app: 'CuberT',
      sessions,
      solves,
      settings: DEFAULT_SETTINGS,
    },
    summary: {
      sessionsCount: sessions.length,
      solvesCount: solves.length,
    },
  };
}

export function validateBackupJson(jsonString: string): ImportValidationResult {
  try {
    const trimmed = jsonString.trim();
    if (!trimmed) {
      return { valid: false, error: 'El archivo está vacío.' };
    }

    const parsed = JSON.parse(trimmed);

    if (!parsed || typeof parsed !== 'object') {
      return { valid: false, error: 'Formato inválido: el archivo no contiene un objeto o lista JSON.' };
    }

    // 1. Try csTimer format
    const csTimerResult = parseCsTimerExport(parsed);
    if (csTimerResult) {
      return csTimerResult;
    }

    // 2. Standard CuberT format, or generic JSON with solves/sessions
    let rawSolvesList: any[] = [];
    let rawSessionsList: any[] = [];
    let settings: UserSettings = DEFAULT_SETTINGS;

    if (Array.isArray(parsed)) {
      rawSolvesList = parsed;
    } else {
      if (Array.isArray(parsed.solves)) {
        rawSolvesList = parsed.solves;
      } else if (Array.isArray(parsed.times)) {
        rawSolvesList = parsed.times;
      } else if (Array.isArray(parsed.data)) {
        rawSolvesList = parsed.data;
      } else if (Array.isArray(parsed.history)) {
        rawSolvesList = parsed.history;
      }

      if (Array.isArray(parsed.sessions)) {
        rawSessionsList = parsed.sessions;

        // If sessions contain nested solves inside them, collect them!
        for (const sess of parsed.sessions) {
          if (sess && Array.isArray(sess.solves)) {
            for (const slv of sess.solves) {
              rawSolvesList.push({
                ...slv,
                sessionId: slv.sessionId || sess.id,
                event: slv.event || sess.event,
              });
            }
          }
        }
      }

      if (parsed.settings && typeof parsed.settings === 'object') {
        settings = { ...DEFAULT_SETTINGS, ...parsed.settings };
      }
    }

    if (rawSolvesList.length === 0 && rawSessionsList.length === 0) {
      return { valid: false, error: 'El archivo no contiene sesiones ni solves para importar.' };
    }

    const sessions: Session[] = [];
    const sessionMap = new Map<string, Session>();

    for (const s of rawSessionsList) {
      if (s && typeof s === 'object') {
        const id = String(s.id || `sess_${generateId()}`).trim();
        const name = String(s.name || 'Sesión importada').trim();
        const rawEv = String(s.event || '333').toLowerCase().trim();
        const event: CubeEventId = EVENT_MAP[rawEv] || '333';
        let createdAt = Number(s.createdAt) || Date.now();
        if (createdAt < 10000000000) createdAt = createdAt * 1000;

        const sessionObj: Session = {
          id,
          name,
          event,
          createdAt: Math.floor(createdAt),
        };
        sessions.push(sessionObj);
        sessionMap.set(id, sessionObj);
      }
    }

    const defaultSessionId = sessions.length > 0 ? sessions[0].id : `import_sess_${generateId()}`;
    if (sessions.length === 0) {
      const defaultSess: Session = {
        id: defaultSessionId,
        name: 'Solves Importados',
        event: '333',
        createdAt: Date.now(),
      };
      sessions.push(defaultSess);
      sessionMap.set(defaultSessionId, defaultSess);
    }

    const solves: Solve[] = [];
    for (let i = 0; i < rawSolvesList.length; i++) {
      const sanitized = sanitizeSolve(rawSolvesList[i], defaultSessionId, sessions[0].event, i);
      if (sanitized) {
        if (!sessionMap.has(sanitized.sessionId)) {
          const newSess: Session = {
            id: sanitized.sessionId,
            name: `Sesión (${sanitized.event})`,
            event: sanitized.event,
            createdAt: sanitized.createdAt,
          };
          sessions.push(newSess);
          sessionMap.set(newSess.id, newSess);
        }
        solves.push(sanitized);
      }
    }

    if (solves.length === 0 && sessions.length === 0) {
      return { valid: false, error: 'No se encontraron solves válidos en el archivo.' };
    }

    solves.sort((a, b) => b.createdAt - a.createdAt);

    return {
      valid: true,
      format: parsed.app === 'CuberT' ? 'CuberT' : 'Generic',
      data: {
        version: 1,
        exportedAt: parsed.exportedAt || new Date().toISOString(),
        app: 'CuberT',
        sessions,
        solves,
        settings,
      },
      summary: {
        sessionsCount: sessions.length,
        solvesCount: solves.length,
      },
    };
  } catch (err: any) {
    return { valid: false, error: `Error de análisis JSON: ${err.message}` };
  }
}

export function mergeImportData(
  currentSessions: Session[],
  currentSolves: Solve[],
  importedData: CuberTBackupData,
  options?: MergeOptions
): {
  sessions: Session[];
  solves: Solve[];
  addedSolvesCount: number;
  duplicateSolvesCount: number;
  activeSessionIdToSet: string;
} {
  // 1. Preserve 100% of current sessions - NEVER mutate or remove
  const sessionMap = new Map<string, Session>();
  for (const s of currentSessions) {
    sessionMap.set(s.id, s);
  }

  const targetSessionId = options?.targetSessionId;
  let activeSessionIdToSet = targetSessionId || (currentSessions.length > 0 ? currentSessions[0].id : '');

  // If importing directly into a specific target session:
  if (targetSessionId && sessionMap.has(targetSessionId)) {
    activeSessionIdToSet = targetSessionId;
  } else {
    // Add imported sessions without collision
    const sessionIdRemap = new Map<string, string>();

    for (const importedSess of importedData.sessions) {
      if (!sessionMap.has(importedSess.id)) {
        sessionMap.set(importedSess.id, importedSess);
        if (!activeSessionIdToSet) {
          activeSessionIdToSet = importedSess.id;
        }
      } else {
        const existing = sessionMap.get(importedSess.id)!;
        if (existing.name !== importedSess.name || existing.event !== importedSess.event) {
          const newId = `${importedSess.id}_imported_${generateId()}`;
          sessionIdRemap.set(importedSess.id, newId);
          sessionMap.set(newId, {
            ...importedSess,
            id: newId,
          });
          if (!activeSessionIdToSet) {
            activeSessionIdToSet = newId;
          }
        }
      }
    }
  }

  // 2. Preserve 100% of current solves - NEVER delete existing solves
  const existingSolveIds = new Set<string>();
  const solveSignatures = new Set<string>();

  for (const s of currentSolves) {
    existingSolveIds.add(s.id);
    solveSignatures.add(`${s.createdAt}_${s.rawTime}_${s.scramble}`);
  }

  const mergedSolves = [...currentSolves];
  let addedSolvesCount = 0;
  let duplicateSolvesCount = 0;

  for (const solve of importedData.solves) {
    const signature = `${solve.createdAt}_${solve.rawTime}_${solve.scramble}`;

    // Duplicate detection: same timestamp + time + scramble
    if (
      solveSignatures.has(signature) ||
      (existingSolveIds.has(solve.id) &&
        currentSolves.some((cs) => cs.id === solve.id && cs.rawTime === solve.rawTime))
    ) {
      duplicateSolvesCount++;
      continue;
    }

    // Determine final session ID:
    // If targetSessionId was specified, ALL imported solves belong to that session!
    let finalSessionId = targetSessionId || solve.sessionId;
    if (!targetSessionId && !sessionMap.has(finalSessionId)) {
      // Find matching session or use activeSessionIdToSet
      finalSessionId = activeSessionIdToSet || (currentSessions[0]?.id ?? 'default-session');
    }

    let finalSolveId = solve.id;
    if (existingSolveIds.has(finalSolveId)) {
      finalSolveId = `imported_${solve.createdAt}_${generateId()}`;
    }

    const cleanSolve: Solve = {
      ...solve,
      id: finalSolveId,
      sessionId: finalSessionId,
    };

    existingSolveIds.add(finalSolveId);
    solveSignatures.add(signature);
    mergedSolves.push(cleanSolve);
    addedSolvesCount++;
  }

  mergedSolves.sort((a, b) => b.createdAt - a.createdAt);

  // If separate sessions and new solves were added, prioritize the session with the most new solves
  if (!targetSessionId && importedData.sessions.length > 0) {
    activeSessionIdToSet = importedData.sessions[0].id;
  }

  return {
    sessions: Array.from(sessionMap.values()),
    solves: mergedSolves,
    addedSolvesCount,
    duplicateSolvesCount,
    activeSessionIdToSet: activeSessionIdToSet || currentSessions[0]?.id || '',
  };
}

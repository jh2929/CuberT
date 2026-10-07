import { KeyMappingConfig } from './cube.types';
import { DEFAULT_KEY_MAPPINGS, LOCAL_STORAGE_KEYBINDINGS_KEY } from './cube.constants';

/**
 * Loads keybindings from localStorage with fallback to default mappings
 */
export function loadKeybindings(): KeyMappingConfig {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEYBINDINGS_KEY);
    if (!raw) return { ...DEFAULT_KEY_MAPPINGS };
    const parsed = JSON.parse(raw);
    if (typeof parsed === 'object' && parsed !== null) {
      return { ...DEFAULT_KEY_MAPPINGS, ...parsed };
    }
  } catch (err) {
    console.warn('Failed to load keybindings from localStorage:', err);
  }
  return { ...DEFAULT_KEY_MAPPINGS };
}

/**
 * Persists keybindings to localStorage
 */
export function saveKeybindings(config: KeyMappingConfig): boolean {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEYBINDINGS_KEY, JSON.stringify(config));
    return true;
  } catch (err) {
    console.error('Failed to save keybindings to localStorage:', err);
    return false;
  }
}

/**
 * Resets keybindings to the original CSTimer defaults
 */
export function resetKeybindingsStorage(): KeyMappingConfig {
  try {
    localStorage.removeItem(LOCAL_STORAGE_KEYBINDINGS_KEY);
  } catch (err) {
    console.warn('Failed to clear keybindings in localStorage:', err);
  }
  return { ...DEFAULT_KEY_MAPPINGS };
}

/**
 * Copies the move history to the clipboard
 */
export async function copyHistoryToClipboard(moves: string[]): Promise<boolean> {
  if (moves.length === 0) return false;
  try {
    await navigator.clipboard.writeText(moves.join(' '));
    return true;
  } catch (err) {
    console.error('Failed to copy move history:', err);
    return false;
  }
}

/**
 * Creates a downloadable .txt file for the solve reconstruction
 */
export function exportHistoryFile(moves: string[], scramble?: string): void {
  const lines: string[] = [];
  if (scramble) {
    lines.push(`Scramble: ${scramble}`);
    lines.push('');
  }
  lines.push(`Total Moves: ${moves.length}`);
  lines.push(`Solution:`);
  lines.push(moves.join(' '));

  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `cubert-virtual-solve-${new Date().toISOString().split('T')[0]}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

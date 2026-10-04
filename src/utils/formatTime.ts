import { Penalty } from '../types/solve';

export interface FormatTimeOptions {
  precision?: 2 | 3;
  showPenaltySuffix?: boolean;
  emptyPlaceholder?: string;
}

/**
 * Formats a time in milliseconds according to speedcubing standards.
 * Handles sub-minute (12.43), multi-minute (1:02.43, 10:32.11), DNF, and +2 penalties.
 */
export function formatTime(
  milliseconds: number | null | undefined,
  penalty: Penalty = 'none',
  options: FormatTimeOptions = {}
): string {
  const { precision = 2, showPenaltySuffix = false, emptyPlaceholder = '—' } = options;

  if (penalty === 'DNF' || milliseconds === null || milliseconds === undefined || Number.isNaN(milliseconds)) {
    return 'DNF';
  }

  if (milliseconds < 0) {
    return emptyPlaceholder;
  }

  const totalSeconds = milliseconds / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  let formattedSeconds: string;
  if (precision === 3) {
    formattedSeconds = seconds.toFixed(3);
  } else {
    // 2 decimals default
    formattedSeconds = seconds.toFixed(2);
  }

  let result: string;
  if (minutes > 0) {
    // Pad integer part of seconds with 0 when minutes > 0
    const [secInt, secDec] = formattedSeconds.split('.');
    const paddedInt = secInt.padStart(2, '0');
    result = `${minutes}:${paddedInt}.${secDec}`;
  } else {
    result = formattedSeconds;
  }

  if (penalty === '+2' && showPenaltySuffix) {
    result = `${result}+`;
  }

  return result;
}

/**
 * Convenience formatter for raw display when penalty is already calculated into finalTime
 */
export function formatFinalTime(
  finalTime: number | null | undefined,
  penalty: Penalty = 'none',
  options: FormatTimeOptions = {}
): string {
  return formatTime(finalTime, penalty, options);
}

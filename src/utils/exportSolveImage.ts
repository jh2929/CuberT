import { Solve } from '../types/solve';
import { formatTime } from './formatTime';
import { formatDate } from './dates';
import { TimerPrecision } from '../types/settings';
import { CUBE_EVENTS, CubeEventId } from '../types/event';

export interface GenerateSolveImageOptions {
  solve: Solve;
  solveNumber: number;
  sessionName: string;
  precision: TimerPrecision;
}

/**
 * Renders an Apple/Linear-inspired dark share card on a 2x Retina canvas.
 */
export async function generateSolveImageCanvas(
  options: GenerateSolveImageOptions
): Promise<HTMLCanvasElement> {
  const { solve, solveNumber, sessionName, precision } = options;

  const canvas = document.createElement('canvas');
  const width = 1200;
  const height = 675;
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');

  // 1. Deep OLED dark background
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, '#09090C');
  bgGrad.addColorStop(1, '#131318');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // 2. Ambient neon green glow at top right
  const glowGrad = ctx.createRadialGradient(width - 150, 150, 10, width - 150, 150, 450);
  glowGrad.addColorStop(0, 'rgba(0, 255, 102, 0.12)');
  glowGrad.addColorStop(1, 'rgba(0, 255, 102, 0)');
  ctx.fillStyle = glowGrad;
  ctx.fillRect(0, 0, width, height);

  // 3. Rounded inner card frame
  const cardX = 48;
  const cardY = 48;
  const cardW = width - 96;
  const cardH = height - 96;
  const radius = 32;

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardW, cardH, radius);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.025)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();

  // 4. Header: Logo + App Name + Event Badge
  const contentX = cardX + 54;
  let currentY = cardY + 68;

  // Draw 2x2 Rubik grid icon for CuberT
  ctx.save();
  const iconSize = 28;
  const stickerSize = 11;
  const gap = 4;
  const colors = ['#00FF66', '#FFFFFF', '#FFFFFF', '#00FF66'];
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 2; c++) {
      ctx.fillStyle = colors[r * 2 + c];
      ctx.beginPath();
      ctx.roundRect(contentX + c * (stickerSize + gap), currentY - 20 + r * (stickerSize + gap), stickerSize, stickerSize, 3);
      ctx.fill();
    }
  }
  ctx.restore();

  // App Name
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '700 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('CuberT', contentX + iconSize + 16, currentY);

  // Event & Session Pill (Top Right)
  const eventMeta = CUBE_EVENTS[solve.event as CubeEventId] || CUBE_EVENTS['333'];
  const eventLabel = `${eventMeta.name} • ${sessionName}`;
  ctx.font = '600 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  const pillWidth = ctx.measureText(eventLabel).width + 32;
  const pillX = cardX + cardW - 54 - pillWidth;

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(pillX, currentY - 22, pillWidth, 34, 17);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = '#E5E5E7';
  ctx.fillText(eventLabel, pillX + 16, currentY);
  ctx.restore();

  // 5. Divider
  currentY += 36;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(contentX, currentY);
  ctx.lineTo(cardX + cardW - 54, currentY);
  ctx.stroke();

  // 6. Time Display (Protagonist)
  currentY += 92;
  const timeFormatted = formatTime(solve.finalTime, solve.penalty, { precision });

  ctx.save();
  ctx.font = '700 96px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
  ctx.fillStyle = solve.penalty === 'DNF' ? '#EF4444' : '#00FF66';
  ctx.shadowColor = solve.penalty === 'DNF' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(0, 255, 102, 0.35)';
  ctx.shadowBlur = 28;
  ctx.fillText(timeFormatted, contentX, currentY);
  ctx.restore();

  // Solve # & Penalty info
  ctx.font = '500 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#8E8E93';
  const subtitle = `Solve #${solveNumber} • ${formatDate(solve.createdAt)}${
    solve.penalty === '+2' ? ` (Tiempo base: ${formatTime(solve.rawTime, 'none', { precision })})` : ''
  }`;
  ctx.fillText(subtitle, contentX, currentY + 34);

  // 7. Scramble Container Box
  currentY += 76;
  const scrambleBoxW = cardW - 108;
  const scrambleBoxH = 130;

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(contentX, currentY, scrambleBoxW, scrambleBoxH, 20);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Scramble label
  ctx.fillStyle = '#636366';
  ctx.font = '700 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('SCRAMBLE', contentX + 22, currentY + 30);

  // Scramble text with word wrapping
  ctx.fillStyle = '#E5E5E7';
  ctx.font = '500 18px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
  const words = solve.scramble.split(' ');
  let line = '';
  let lineY = currentY + 62;
  const maxLineWidth = scrambleBoxW - 44;

  for (let i = 0; i < words.length; i++) {
    const testLine = line + words[i] + ' ';
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxLineWidth && i > 0) {
      ctx.fillText(line.trim(), contentX + 22, lineY);
      line = words[i] + ' ';
      lineY += 28;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line.trim(), contentX + 22, lineY);
  ctx.restore();

  // 8. Footer note & branding
  const footerY = cardY + cardH - 32;
  if (solve.note) {
    ctx.fillStyle = '#A1A1A6';
    ctx.font = 'italic 500 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(`“${solve.note}”`, contentX, footerY);
  }

  ctx.fillStyle = '#636366';
  ctx.font = '500 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  const footerWatermark = 'cubert.app • Speedcubing Timer';
  const watermarkWidth = ctx.measureText(footerWatermark).width;
  ctx.fillText(footerWatermark, cardX + cardW - 54 - watermarkWidth, footerY);

  return canvas;
}

/**
 * Downloads the solve as a high-resolution PNG image file.
 */
export async function downloadSolveImage(options: GenerateSolveImageOptions): Promise<void> {
  const canvas = await generateSolveImageCanvas(options);
  const timeFormatted = formatTime(options.solve.finalTime, options.solve.penalty, {
    precision: options.precision,
  }).replace(/[^0-9.]/g, '');

  const link = document.createElement('a');
  link.download = `cubert-solve-${options.solveNumber}-${timeFormatted || 'dnf'}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

/**
 * Shares the solve image using Web Share API or falls back to downloading/copying.
 */
export async function shareSolveImage(options: GenerateSolveImageOptions): Promise<'shared' | 'copied' | 'downloaded'> {
  const canvas = await generateSolveImageCanvas(options);

  return new Promise((resolve) => {
    canvas.toBlob(async (blob) => {
      if (!blob) {
        await downloadSolveImage(options);
        resolve('downloaded');
        return;
      }

      const file = new File([blob], `cubert-solve-${options.solveNumber}.png`, {
        type: 'image/png',
      });

      // 1. Try native Web Share API with file support
      if (
        typeof navigator.share === 'function' &&
        typeof navigator.canShare === 'function' &&
        navigator.canShare({ files: [file] })
      ) {
        try {
          await navigator.share({
            title: `Solve #${options.solveNumber} en CuberT`,
            text: `¡Nuevo tiempo en CuberT! ${formatTime(options.solve.finalTime, options.solve.penalty, { precision: options.precision })} con ${options.sessionName}`,
            files: [file],
          });
          resolve('shared');
          return;
        } catch (err: unknown) {
          if ((err as Error)?.name === 'AbortError') {
            resolve('shared');
            return;
          }
        }
      }

      // 2. Try copying image blob to clipboard
      try {
        if (navigator.clipboard && typeof window.ClipboardItem !== 'undefined') {
          await navigator.clipboard.write([
            new ClipboardItem({
              'image/png': blob,
            }),
          ]);
          resolve('copied');
          return;
        }
      } catch {
        // Fall back to download
      }

      // 3. Fallback to download
      await downloadSolveImage(options);
      resolve('downloaded');
    }, 'image/png');
  });
}

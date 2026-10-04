import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Solve, Penalty } from '../../types/solve';
import { formatTime } from '../../utils/formatTime';
import { formatDate } from '../../utils/dates';
import { TimerPrecision } from '../../types/settings';
import { Copy, Check, Trash2, Share2, Download } from 'lucide-react';
import { shareSolveImage, downloadSolveImage } from '../../utils/exportSolveImage';

interface SolveDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  solve: Solve | null;
  solveNumber: number;
  precision: TimerPrecision;
  sessionName: string;
  onUpdatePenalty: (id: string, penalty: Penalty) => Promise<void>;
  onUpdateNote: (id: string, note: string) => Promise<void>;
  onDeleteSolve: (id: string) => Promise<void>;
  confirmDelete: boolean;
}

export const SolveDetailsModal: React.FC<SolveDetailsModalProps> = ({
  isOpen,
  onClose,
  solve,
  solveNumber,
  precision,
  sessionName,
  onUpdatePenalty,
  onUpdateNote,
  onDeleteSolve,
  confirmDelete,
}) => {
  const [note, setNote] = useState(() => solve?.note || '');
  const [copied, setCopied] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [prevSolveId, setPrevSolveId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportFeedback, setExportFeedback] = useState<string | null>(null);

  // Sync state when different solve is opened
  if (solve && solve.id !== prevSolveId) {
    setPrevSolveId(solve.id);
    setNote(solve.note || '');
    setIsConfirmingDelete(false);
    setExportFeedback(null);
  }

  if (!solve) return null;

  const handleCopyScramble = async () => {
    try {
      await navigator.clipboard.writeText(solve.scramble);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Ignore
    }
  };

  const handlePenaltyChange = async (newPenalty: Penalty) => {
    const penaltyToApply = solve.penalty === newPenalty ? 'none' : newPenalty;
    await onUpdatePenalty(solve.id, penaltyToApply);
  };

  const handleSaveNote = async () => {
    await onUpdateNote(solve.id, note);
  };

  const handleShareImage = async () => {
    setIsExporting(true);
    try {
      const outcome = await shareSolveImage({
        solve,
        solveNumber,
        sessionName,
        precision,
      });
      if (outcome === 'copied') {
        setExportFeedback('¡Imagen copiada al portapapeles!');
      } else if (outcome === 'shared') {
        setExportFeedback('¡Compartido con éxito!');
      } else {
        setExportFeedback('¡Imagen descargada!');
      }
      setTimeout(() => setExportFeedback(null), 2500);
    } catch {
      setExportFeedback('Error al exportar');
      setTimeout(() => setExportFeedback(null), 2000);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadImage = async () => {
    setIsExporting(true);
    try {
      await downloadSolveImage({
        solve,
        solveNumber,
        sessionName,
        precision,
      });
      setExportFeedback('¡Imagen descargada!');
      setTimeout(() => setExportFeedback(null), 2500);
    } catch {
      setExportFeedback('Error al descargar');
      setTimeout(() => setExportFeedback(null), 2000);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDelete = async () => {
    if (confirmDelete && !isConfirmingDelete) {
      setIsConfirmingDelete(true);
      return;
    }
    await onDeleteSolve(solve.id);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Solve #${solveNumber}`}
      description={`${sessionName} • ${formatDate(solve.createdAt)}`}
      maxWidth="md"
    >
      <div className="flex flex-col gap-5">
        {/* Time display card */}
        <div className="flex flex-col items-center justify-center p-6 bg-white/[0.04] dark:bg-white/[0.03] rounded-2xl border border-black/[0.06] dark:border-white/[0.08] shadow-inner">
          <div className="font-mono-numbers text-5xl sm:text-6xl font-bold tracking-tight text-neutral-900 dark:text-[#F5F5F7]">
            {formatTime(solve.finalTime, solve.penalty, { precision })}
          </div>
          {solve.penalty === '+2' && (
            <div className="text-xs font-mono text-neutral-400 mt-1.5">
              Tiempo base: {formatTime(solve.rawTime, 'none', { precision })}
            </div>
          )}
        </div>

        {/* Penalties Selector Segmented Pill */}
        <div className="flex items-center justify-center gap-1.5 p-1 bg-black/[0.04] dark:bg-white/[0.06] rounded-xl border border-black/[0.05] dark:border-white/[0.08]">
          <button
            type="button"
            onClick={() => handlePenaltyChange('none')}
            className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${
              solve.penalty === 'none'
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-black shadow-xs font-semibold'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            OK
          </button>
          <button
            type="button"
            onClick={() => handlePenaltyChange('+2')}
            className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${
              solve.penalty === '+2'
                ? 'bg-amber-500 text-white shadow-xs font-semibold'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-amber-500'
            }`}
          >
            +2
          </button>
          <button
            type="button"
            onClick={() => handlePenaltyChange('DNF')}
            className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${
              solve.penalty === 'DNF'
                ? 'bg-red-500 text-white shadow-xs font-semibold'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-red-500'
            }`}
          >
            DNF
          </button>
        </div>

        {/* Scramble card */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs text-neutral-500 px-1">
            <span className="font-semibold uppercase tracking-wider text-[10px] text-neutral-400">Scramble</span>
            <button
              onClick={handleCopyScramble}
              className="inline-flex items-center gap-1 text-[11px] text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors"
            >
              {copied ? <Check size={12} className="text-[#00FF66]" /> : <Copy size={12} />}
              <span>{copied ? 'Copiado' : 'Copiar'}</span>
            </button>
          </div>
          <div className="p-3.5 bg-white/[0.04] dark:bg-white/[0.03] rounded-2xl border border-black/[0.06] dark:border-white/[0.08] font-mono text-xs leading-relaxed text-neutral-800 dark:text-[#ECECED] select-text">
            {solve.scramble}
          </div>
        </div>

        {/* Share & Export Image Card */}
        <div className="flex items-center justify-between p-3.5 bg-white/[0.04] dark:bg-white/[0.03] rounded-2xl border border-black/[0.06] dark:border-white/[0.08]">
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-neutral-800 dark:text-[#ECECED]">
              Exportar como imagen
            </span>
            <span className="text-[11px] text-neutral-400 dark:text-neutral-500">
              {exportFeedback || 'Descarga o comparte una tarjeta con tu tiempo y scramble'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadImage}
              disabled={isExporting}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-black/[0.05] dark:bg-white/[0.08] hover:bg-black/[0.08] dark:hover:bg-white/[0.14] text-neutral-700 dark:text-neutral-200 transition-all disabled:opacity-50"
              title="Descargar imagen PNG"
            >
              <Download size={13} />
              <span>Guardar</span>
            </button>

            <button
              type="button"
              onClick={handleShareImage}
              disabled={isExporting}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 hover:opacity-90 transition-all shadow-xs disabled:opacity-50"
              title="Compartir o copiar imagen"
            >
              <Share2 size={13} />
              <span>Compartir</span>
            </button>
          </div>
        </div>

        {/* Note editor */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="solve-note" className="text-[10px] uppercase font-semibold tracking-wider text-neutral-400 px-1">
            Nota
          </label>
          <textarea
            id="solve-note"
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onBlur={handleSaveNote}
            placeholder="Ej: PLL skip, mala cruz, etc."
            className="w-full px-3.5 py-2.5 text-xs rounded-2xl bg-white/[0.04] dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.08] text-neutral-900 dark:text-[#F5F5F7] placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-white/30 resize-none"
          />
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-black/[0.05] dark:border-white/[0.07]">
          <button
            type="button"
            onClick={handleDelete}
            className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl transition-all ${
              isConfirmingDelete
                ? 'bg-red-500 text-white'
                : 'text-red-500 hover:bg-red-500/10'
            }`}
          >
            <Trash2 size={13} />
            <span>{isConfirmingDelete ? '¿Confirmar eliminación?' : 'Eliminar solve'}</span>
          </button>

          <Button size="sm" variant="secondary" onClick={onClose}>
            Listo
          </Button>
        </div>
      </div>
    </Modal>
  );
};

import React, { useRef, useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { UserSettings, ThemeMode, TimerPrecision, HoldDelay, AnimationSetting } from '../../types/settings';
import { Session } from '../../types/session';
import { Solve } from '../../types/solve';
import { createBackupJson, downloadBackupFile } from '../../features/backup/export';
import { validateBackupJson, mergeImportData, ImportValidationResult } from '../../features/backup/import';
import { Download, Upload, CheckCircle2, ShieldCheck } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onUpdateSettings: (partial: Partial<UserSettings>) => Promise<void>;
  sessions: Session[];
  solves: Solve[];
  onImportReplace: (sessions: Session[], solves: Solve[], settings: UserSettings) => Promise<void>;
  onImportMerge: (sessions: Session[], solves: Solve[], settings: UserSettings) => Promise<void>;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  sessions,
  solves,
  onImportReplace,
  onImportMerge,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [pendingImport, setPendingImport] = useState<ImportValidationResult | null>(null);
  const [isConfirmingReplace, setIsConfirmingReplace] = useState(false);

  const handleExportBackup = () => {
    const jsonStr = createBackupJson(sessions, solves, settings);
    downloadBackupFile(jsonStr);
    onUpdateSettings({ lastBackupSolveCount: solves.length });
    setImportStatus('Backup descargado correctamente.');
    setTimeout(() => setImportStatus(null), 3000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const validation = validateBackupJson(content);
      if (!validation.valid || !validation.data) {
        setImportStatus(`Error al validar el archivo: ${validation.error}`);
        setPendingImport(null);
      } else {
        setPendingImport(validation);
        const formatLabel = validation.format === 'csTimer' ? 'csTimer' : 'CuberT / Estándar';
        setImportStatus(
          `Archivo válido (${formatLabel}): ${validation.summary?.solvesCount} solves detectados en ${validation.summary?.sessionsCount} sesión(es).`
        );
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleExecuteMerge = async () => {
    if (!pendingImport?.data) return;

    // Safety measure: Store emergency pre-import backup in localStorage
    try {
      const preImportBackup = createBackupJson(sessions, solves, settings);
      localStorage.setItem('cubert_pre_import_safety_backup', preImportBackup);
    } catch {
      // Ignore quota
    }

    const merged = mergeImportData(sessions, solves, pendingImport.data);
    await onImportMerge(merged.sessions, merged.solves, pendingImport.data.settings);
    setPendingImport(null);
    setImportStatus(
      `✓ Fusión completada con éxito: Se agregaron ${merged.addedSolvesCount} nuevos solves. Tus ${solves.length} solves locales se conservaron intactos.`
    );
    setTimeout(() => setImportStatus(null), 5000);
  };

  const handleExecuteReplace = async () => {
    if (!pendingImport?.data) return;
    if (!isConfirmingReplace) {
      setIsConfirmingReplace(true);
      return;
    }

    // Crucial safety measure: Automatically download a backup of current data so it can NEVER be lost
    try {
      const currentBackup = createBackupJson(sessions, solves, settings);
      downloadBackupFile(
        currentBackup,
        `cubert-copia-seguridad-automatica-${new Date().toISOString().split('T')[0]}.json`
      );
    } catch (e) {
      console.warn('Could not auto-download safety backup:', e);
    }

    await onImportReplace(
      pendingImport.data.sessions,
      pendingImport.data.solves,
      pendingImport.data.settings
    );
    setIsConfirmingReplace(false);
    setPendingImport(null);
    setImportStatus('Datos reemplazados. Se ha descargado automáticamente una copia de seguridad previa de tus datos.');
    setTimeout(() => setImportStatus(null), 6000);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Configuración"
      description="Personaliza la experiencia del timer y gestiona tus datos"
      maxWidth="2xl"
    >
      <div className="flex flex-col gap-5 max-h-[72vh] overflow-y-auto pr-1 text-xs">
        {/* Appearance Group */}
        <div className="flex flex-col gap-2">
          <div className="font-semibold uppercase tracking-wider text-[10px] text-neutral-400 px-1">
            Apariencia
          </div>

          <div className="flex flex-col rounded-2xl bg-white/50 dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.07] divide-y divide-black/[0.04] dark:divide-white/[0.05] p-1">
            <div className="flex items-center justify-between p-3">
              <span className="text-neutral-800 dark:text-[#ECECED] font-medium">Tema</span>
              <div className="flex items-center gap-1 bg-black/[0.04] dark:bg-white/[0.06] p-1 rounded-xl border border-black/[0.05] dark:border-white/[0.08]">
                {(['dark', 'light', 'system'] as ThemeMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => onUpdateSettings({ theme: mode })}
                    className={`px-3 py-1 text-xs rounded-lg capitalize transition-all ${
                      settings.theme === mode
                        ? 'bg-neutral-900 text-white dark:bg-white dark:text-black shadow-xs font-semibold'
                        : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
                    }`}
                  >
                    {mode === 'system' ? 'Sistema' : mode === 'dark' ? 'Oscuro' : 'Claro'}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between p-3">
              <span className="text-neutral-800 dark:text-[#ECECED] font-medium">Animaciones</span>
              <div className="flex items-center gap-1 bg-black/[0.04] dark:bg-white/[0.06] p-1 rounded-xl border border-black/[0.05] dark:border-white/[0.08]">
                {(['normal', 'reduced'] as AnimationSetting[]).map((anim) => (
                  <button
                    key={anim}
                    onClick={() => onUpdateSettings({ animation: anim })}
                    className={`px-3 py-1 text-xs rounded-lg transition-all ${
                      settings.animation === anim
                        ? 'bg-neutral-900 text-white dark:bg-white dark:text-black shadow-xs font-semibold'
                        : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
                    }`}
                  >
                    {anim === 'normal' ? 'Normal' : 'Reducidas'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Timer Behavior Group */}
        <div className="flex flex-col gap-2">
          <div className="font-semibold uppercase tracking-wider text-[10px] text-neutral-400 px-1">
            Comportamiento del Timer
          </div>

          <div className="flex flex-col rounded-2xl bg-white/50 dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.07] divide-y divide-black/[0.04] dark:divide-white/[0.05] p-1">
            <div className="flex items-center justify-between p-3">
              <div>
                <div className="text-neutral-800 dark:text-[#ECECED] font-medium">Inspección WCA (15s)</div>
                <div className="text-[11px] text-neutral-400">Penalización +2 tras 15s y DNF tras 17s</div>
              </div>
              <button
                type="button"
                onClick={() => onUpdateSettings({ inspection: !settings.inspection })}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  settings.inspection ? 'bg-[#00FF66]' : 'bg-neutral-200 dark:bg-neutral-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    settings.inspection ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-3">
              <span className="text-neutral-800 dark:text-[#ECECED] font-medium">Precisión del display</span>
              <div className="flex items-center gap-1 bg-black/[0.04] dark:bg-white/[0.06] p-1 rounded-xl border border-black/[0.05] dark:border-white/[0.08]">
                {([2, 3] as TimerPrecision[]).map((prec) => (
                  <button
                    key={prec}
                    onClick={() => onUpdateSettings({ timerPrecision: prec })}
                    className={`px-3 py-1 text-xs rounded-lg transition-all ${
                      settings.timerPrecision === prec
                        ? 'bg-neutral-900 text-white dark:bg-white dark:text-black shadow-xs font-semibold'
                        : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
                    }`}
                  >
                    {prec} decimales
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between p-3">
              <div>
                <span className="text-neutral-800 dark:text-[#ECECED] font-medium">Tiempo de espera (Hold delay)</span>
                <div className="text-[11px] text-neutral-400">Tiempo manteniendo pulsado antes de estar listo</div>
              </div>
              <div className="flex items-center gap-1 bg-black/[0.04] dark:bg-white/[0.06] p-1 rounded-xl border border-black/[0.05] dark:border-white/[0.08]">
                {([300, 500, 700] as HoldDelay[]).map((delay) => (
                  <button
                    key={delay}
                    onClick={() => onUpdateSettings({ holdDelay: delay })}
                    className={`px-2.5 py-1 text-xs rounded-lg transition-all ${
                      settings.holdDelay === delay
                        ? 'bg-neutral-900 text-white dark:bg-white dark:text-black shadow-xs font-semibold'
                        : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
                    }`}
                  >
                    {delay}ms
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between p-3">
              <span className="text-neutral-800 dark:text-[#ECECED] font-medium">Mostrar scramble</span>
              <button
                type="button"
                onClick={() => onUpdateSettings({ showScramble: !settings.showScramble })}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  settings.showScramble ? 'bg-[#00FF66]' : 'bg-neutral-200 dark:bg-neutral-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    settings.showScramble ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-3">
              <div>
                <span className="text-neutral-800 dark:text-[#ECECED] font-medium">Sonidos sutiles</span>
                <div className="text-[11px] text-neutral-400">Chime de listo y aviso de inspección</div>
              </div>
              <button
                type="button"
                onClick={() => onUpdateSettings({ soundEnabled: !settings.soundEnabled })}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  settings.soundEnabled ? 'bg-[#00FF66]' : 'bg-neutral-200 dark:bg-neutral-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    settings.soundEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-3">
              <span className="text-neutral-800 dark:text-[#ECECED] font-medium">Confirmar eliminación de solve</span>
              <button
                type="button"
                onClick={() => onUpdateSettings({ confirmSolveDeletion: !settings.confirmSolveDeletion })}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  settings.confirmSolveDeletion ? 'bg-[#00FF66]' : 'bg-neutral-200 dark:bg-neutral-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    settings.confirmSolveDeletion ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Backup & Data Management Group */}
        <div className="flex flex-col gap-2">
          <div className="font-semibold uppercase tracking-wider text-[10px] text-neutral-400 px-1">
            Copia de Seguridad y Datos
          </div>

          <div className="flex flex-col gap-3 rounded-2xl bg-white/50 dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.07] p-4">
            <div className="flex flex-col sm:flex-row gap-2.5">
              <Button
                size="sm"
                variant="secondary"
                onClick={handleExportBackup}
                className="flex-1 text-xs py-2.5 rounded-xl font-medium"
              >
                <Download size={14} className="text-[#00FF66]" />
                <span>Exportar Backup (JSON)</span>
              </Button>

              <Button
                size="sm"
                variant="secondary"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 text-xs py-2.5 rounded-xl font-medium"
              >
                <Upload size={14} />
                <span>Importar datos</span>
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".json,.txt"
                className="hidden"
              />
            </div>

            {/* Pending Import Actions */}
            {pendingImport && (
              <div className="p-4 bg-black/[0.04] dark:bg-white/[0.04] rounded-2xl border border-[#00FF66]/25 flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={16} className="text-[#00FF66]" />
                  <div className="text-xs font-semibold text-neutral-800 dark:text-[#ECECED]">
                    Importación segura ({pendingImport.format === 'csTimer' ? 'Formato csTimer' : 'Formato CuberT / Estándar'})
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-[#00FF66]/10 border border-[#00FF66]/20 text-[11px] text-neutral-700 dark:text-neutral-300">
                  <span className="text-neutral-900 dark:text-white font-medium">Tus datos están protegidos:</span> Tienes{' '}
                  <span className="font-mono font-bold text-[#00FF66]">{solves.length}</span> solves en este navegador. Al seleccionar <strong>Combinar</strong>, no se perderá ningún tiempo existente.
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={handleExecuteMerge}
                    className="flex-1 text-xs py-2 rounded-xl font-medium bg-[#00FF66] text-black hover:bg-[#00FF66]/90 shadow-xs"
                  >
                    <span>Combinar y conservar existentes (Recomendado)</span>
                  </Button>
                  <button
                    type="button"
                    onClick={handleExecuteReplace}
                    className={`px-3 py-2 text-xs font-medium rounded-xl transition-all ${
                      isConfirmingReplace
                        ? 'bg-red-600 text-white shadow-md'
                        : 'bg-red-500/10 text-red-500 dark:text-red-400 hover:bg-red-500/20'
                    }`}
                  >
                    {isConfirmingReplace ? '¿Confirmar reemplazo (descarga backup)?' : 'Reemplazar todo'}
                  </button>
                </div>
              </div>
            )}

            {/* Status Message */}
            {importStatus && (
              <div className="p-3 bg-white/70 dark:bg-white/[0.04] rounded-xl text-[11px] text-neutral-600 dark:text-neutral-300 flex items-center gap-2 border border-black/[0.05] dark:border-white/[0.06]">
                <CheckCircle2 size={14} className="text-[#00FF66] shrink-0" />
                <span>{importStatus}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

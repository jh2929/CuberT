import React, { useRef, useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { UserSettings, ThemeMode, TimerPrecision, HoldDelay, AnimationSetting } from '../../types/settings';
import { Session } from '../../types/session';
import { Solve } from '../../types/solve';
import { createBackupJson, downloadBackupFile } from '../../features/backup/export';
import { validateBackupJson, mergeImportData, ImportValidationResult } from '../../features/backup/import';
import { Download, Upload, CheckCircle2, ShieldCheck, ExternalLink, Trash2, AlertTriangle } from 'lucide-react';
import { wipeAllData } from '../../storage/database';


interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onUpdateSettings: (partial: Partial<UserSettings>) => Promise<void>;
  sessions: Session[];
  solves: Solve[];
  activeSession: Session;
  onImportReplace: (sessions: Session[], solves: Solve[], settings: UserSettings) => Promise<void>;
  onImportMerge: (
    sessions: Session[],
    solves: Solve[],
    settings: UserSettings,
    targetActiveSessionId?: string
  ) => Promise<void>;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  sessions,
  solves,
  activeSession,
  onImportReplace,
  onImportMerge,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [pendingImport, setPendingImport] = useState<ImportValidationResult | null>(null);
  const [isConfirmingReplace, setIsConfirmingReplace] = useState(false);
  const [targetMode, setTargetMode] = useState<'current' | 'separate'>('current');
  const [isConfirmingWipe, setIsConfirmingWipe] = useState(false);
  const [isWiping, setIsWiping] = useState(false);

  const handleWipeData = async () => {
    if (!isConfirmingWipe) {
      setIsConfirmingWipe(true);
      return;
    }
    setIsWiping(true);
    await wipeAllData();
    window.location.reload();
  };

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

    const targetSessionId = targetMode === 'current' ? activeSession.id : undefined;
    const merged = mergeImportData(sessions, solves, pendingImport.data, { targetSessionId });
    await onImportMerge(
      merged.sessions,
      merged.solves,
      pendingImport.data.settings,
      merged.activeSessionIdToSet
    );
    setPendingImport(null);
    setImportStatus(
      `✓ ¡Éxito! Se sincronizaron ${merged.addedSolvesCount} solves nuevos ${
        targetMode === 'current' ? `en la sesión "${activeSession.name}"` : 'en tus sesiones'
      }. Todos tus ${solves.length} solves locales anteriores se conservaron intactos.`
    );
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
                <span className="text-neutral-800 dark:text-[#ECECED] font-medium">Mezclas &apos;Lucky&apos; impredecibles</span>
                <div className="text-[11px] text-neutral-400">Genera aleatoriamente scrambles con posiciones favorables (cruz fácil, pares)</div>
              </div>
              <button
                type="button"
                onClick={() => onUpdateSettings({ luckyScrambles: !settings.luckyScrambles })}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  settings.luckyScrambles ? 'bg-[#00FF66]' : 'bg-neutral-200 dark:bg-neutral-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    settings.luckyScrambles ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Slider de nivel de Lucky Scrambles */}
            <div className="flex flex-col gap-2 p-3 bg-black/[0.02] dark:bg-white/[0.02] rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-neutral-700 dark:text-neutral-300 font-medium">Frecuencia / Dificultad de mezclas</span>
                <span className="font-mono font-bold text-[#00FF66] text-xs">
                  {settings.luckyScrambleLevel === 0 && 'Never (Desactivado)'}
                  {settings.luckyScrambleLevel === 1 && 'Bajo (Raras veces)'}
                  {settings.luckyScrambleLevel === 2 && 'Normal (Defecto)'}
                  {settings.luckyScrambleLevel === 3 && 'Fácil (Frecuente)'}
                  {settings.luckyScrambleLevel === 4 && 'Máximo (Cruz + 3 pares hechos)'}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="4"
                step="1"
                value={settings.luckyScrambles ? settings.luckyScrambleLevel : 0}
                disabled={!settings.luckyScrambles}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  onUpdateSettings({ luckyScrambleLevel: val, luckyScrambles: val > 0 });
                }}
                className="w-full accent-[#00FF66] cursor-pointer h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-neutral-400 font-mono">
                <span>Never</span>
                <span>Bajo</span>
                <span>Normal</span>
                <span>Fácil</span>
                <span>Máximo</span>
              </div>
              <div className="text-[11px] text-neutral-500 dark:text-neutral-400 italic mt-0.5">
                {settings.luckyScrambleLevel === 0 && 'No aparecerán scrambles lucky en absoluto.'}
                {settings.luckyScrambleLevel === 1 && 'Aparecen muy rara vez para mantenerte alerta.'}
                {settings.luckyScrambleLevel === 2 && 'Mezclas favorables aleatorias de vez en cuando (cruces sencillas o bloques).'}
                {settings.luckyScrambleLevel === 3 && 'Alta probabilidad de cruces casi resueltas y pares de F2L emparejados.'}
                {settings.luckyScrambleLevel === 4 && '¡Posición de ensueño! Cruz completamente resuelta y hasta 3 pares de F2L armados.'}
              </div>
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

                {/* Target Session Selection */}
                <div className="flex flex-col gap-1.5 pt-1">
                  <span className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400">
                    ¿Dónde deseas guardar los solves importados?
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setTargetMode('current')}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        targetMode === 'current'
                          ? 'border-[#00FF66] bg-[#00FF66]/10 text-neutral-900 dark:text-white'
                          : 'border-black/[0.08] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.02] text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300'
                      }`}
                    >
                      <div className="text-xs font-semibold">Sesión activa ({activeSession.name})</div>
                      <div className="text-[10px] opacity-75">Aparecerán al instante en tu pantalla actual</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTargetMode('separate')}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        targetMode === 'separate'
                          ? 'border-[#00FF66] bg-[#00FF66]/10 text-neutral-900 dark:text-white'
                          : 'border-black/[0.08] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.02] text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300'
                      }`}
                    >
                      <div className="text-xs font-semibold">Sesiones del archivo ({pendingImport.summary?.sessionsCount || 1})</div>
                      <div className="text-[10px] opacity-75">Crea o conserva las sesiones originales</div>
                    </button>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={handleExecuteMerge}
                    className="flex-1 text-xs py-2 rounded-xl font-medium bg-[#00FF66] text-black hover:bg-[#00FF66]/90 shadow-xs"
                  >
                    <span>Combinar y sincronizar ahora (Recomendado)</span>
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

            {/* Status Message with direct CTA */}
            {importStatus && (
              <div className="p-3 bg-white/70 dark:bg-white/[0.04] rounded-xl text-[11px] text-neutral-600 dark:text-neutral-300 flex items-center justify-between gap-2 border border-black/[0.05] dark:border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-[#00FF66] shrink-0" />
                  <span>{importStatus}</span>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={onClose}
                  className="text-xs py-1 px-2.5 rounded-lg shrink-0 bg-neutral-900 text-white dark:bg-white dark:text-black font-semibold"
                >
                  Ver solves
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Danger Zone: Vaciar Aplicación (Doble Confirmación) */}
        <div className="flex flex-col gap-2.5 p-3.5 rounded-2xl bg-red-500/[0.04] dark:bg-red-500/[0.06] border border-red-500/20 select-none">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-red-600 dark:text-red-400">
              <AlertTriangle size={15} />
              <span>Zona de Peligro</span>
            </div>
            {isConfirmingWipe && (
              <span className="text-[10px] font-mono uppercase text-red-500 animate-pulse font-bold">
                Requiere segunda confirmación
              </span>
            )}
          </div>

          <div className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
            Elimina permanentemente todas las sesiones, tiempos guardados, notas y configuraciones restableciendo la app a su estado original de fábrica.
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleWipeData}
              disabled={isWiping}
              className={`flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                isConfirmingWipe
                  ? 'bg-red-600 hover:bg-red-700 text-white shadow-md animate-pulse'
                  : 'bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20'
              }`}
            >
              <Trash2 size={13} />
              <span>
                {isWiping
                  ? 'Borrando datos...'
                  : isConfirmingWipe
                  ? '¿Confirmas borrar TODO? Haz clic para ejecutar'
                  : 'Vaciar aplicación (Borrar todos los datos)'}
              </span>
            </button>

            {isConfirmingWipe && !isWiping && (
              <button
                type="button"
                onClick={() => setIsConfirmingWipe(false)}
                className="px-3 py-2 rounded-xl text-xs font-medium bg-black/[0.05] dark:bg-white/[0.08] hover:bg-black/[0.08] dark:hover:bg-white/[0.12] text-neutral-600 dark:text-neutral-300 transition-colors"
              >
                Cancelar
              </button>
            )}
          </div>
        </div>

        {/* Developer / Portfolio Section */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#00FF66]/5 dark:bg-[#00FF66]/10 border border-[#00FF66]/20 text-neutral-700 dark:text-neutral-300 select-none">
          <div className="flex flex-col">
            <span className="font-semibold text-xs text-neutral-900 dark:text-white">
              Desarrollado por Jhezdev
            </span>
            <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
              Conoce más proyectos y portfolio oficial
            </span>
          </div>
          <a
            href="https://jesus-herrera.vercel.app"
            target="_blank"
            rel="noopener noreferrer author"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-black font-semibold text-xs shadow-xs hover:opacity-90 transition-opacity"
          >
            <span>Portfolio</span>
            <ExternalLink size={12} />
          </a>
        </div>
      </div>
    </Modal>
  );
};


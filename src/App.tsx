import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useSettingsStore } from './store/settings.store';
import { useSessionsStore } from './store/sessions.store';
import { useSolvesStore } from './store/solves.store';
import { useScrambleStore } from './store/scramble.store';
import { useTimer } from './features/timer/useTimer';
import { useTheme } from './hooks/useTheme';
import { useSound } from './hooks/useSound';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { calculateSessionStats } from './features/statistics/statistics';
import { createBackupJson, downloadBackupFile } from './features/backup/export';

// Components
import { Timer } from './components/timer/Timer';
import { Scramble } from './components/scramble/Scramble';
import { CubeVisualizer } from './components/scramble/CubeVisualizer';
import { AppleMusicSidebar } from './components/sidebar/AppleMusicSidebar';
import { SessionManagerModal } from './components/sessions/SessionManagerModal';
import { StatsPanel } from './components/stats/StatsPanel';
import { NewPBBanner } from './components/stats/NewPBBanner';
import { SettingsModal } from './components/settings/SettingsModal';
import { BackupReminderBanner } from './components/ui/BackupReminderBanner';
import { SolveDeltaBadge } from './components/timer/SolveDeltaBadge';
import { VirtualCube } from './components/virtualCube/VirtualCube';
import { PanelLeft, X } from 'lucide-react';
import { CubeEventId, CUBE_EVENTS } from './types/event';




export const App: React.FC = () => {
  // Stores
  const { settings, isLoaded: settingsLoaded, loadSettings, updateSettings } = useSettingsStore();
  const {
    sessions,
    activeSessionId,
    isLoaded: sessionsLoaded,
    loadSessions,
    createSession,
    renameSession,
    updateSessionEvent,
    setActiveSession,
    deleteSession,
    setAllSessions,
  } = useSessionsStore();
  const {
    solves,
    isLoaded: solvesLoaded,
    lastDeletedSolve,
    newPBNotification,
    showBackupReminder,
    loadSolves,
    addSolve,
    updatePenalty,
    updateNote,
    deleteSolve,
    undoDeleteSolve,
    clearSessionSolves,
    clearNewPBNotification,
    dismissBackupReminder,
    setAllSolves,
  } = useSolvesStore();
  const {
    currentScramble,
    previousScrambles,
    isGenerating: isGeneratingScramble,
    initScramble,
    generateNextScramble,
    goToPreviousScramble,
    copyScrambleToClipboard,
  } = useScrambleStore();

  // Modals & Focus Mode state
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isVirtualCubeActive, setIsVirtualCubeActive] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSolveDismissed, setIsSolveDismissed] = useState(true);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [showFocusBadge, setShowFocusBadge] = useState(false);

  const previousSessionIdRef = React.useRef<string | null>(null);

  // Focus mode badge 2-second auto-dismiss
  useEffect(() => {
    if (isFocusMode) {
      setShowFocusBadge(true);
      const timer = setTimeout(() => {
        setShowFocusBadge(false);
      }, 2000);
      return () => clearTimeout(timer);
    } else {
      setShowFocusBadge(false);
    }
  }, [isFocusMode]);

  // Theme & Sound hooks
  useTheme(settings.theme);
  const { playReadyChime, playInspectionWarning } = useSound(settings.soundEnabled);

  // Active session
  const activeSession = useMemo(() => {
    return sessions.find((s) => s.id === activeSessionId) || sessions[0];
  }, [sessions, activeSessionId]);

  // Solves for active session strictly filtered by current event (each category has its own times and history)
  const sessionSolves = useMemo(() => {
    if (!activeSession) return [];
    return solves.filter(
      (s) => s.sessionId === activeSession.id && s.event === activeSession.event
    );
  }, [solves, activeSession]);

  // Solves count map for all sessions
  const solvesCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const s of solves) {
      counts[s.sessionId] = (counts[s.sessionId] || 0) + 1;
    }
    return counts;
  }, [solves]);

  // Session Statistics
  const sessionStats = useMemo(() => {
    return calculateSessionStats(sessionSolves);
  }, [sessionSolves]);

  // Initial Boot Data Loading
  useEffect(() => {
    loadSettings();
    loadSessions();
    loadSolves();
  }, [loadSettings, loadSessions, loadSolves]);

  // When active session changes or loads, sync scramble event
  useEffect(() => {
    if (activeSession) {
      initScramble(activeSession.event, settings.luckyScrambles, settings.luckyScrambleLevel);
    }
  }, [activeSession, initScramble, settings.luckyScrambles, settings.luckyScrambleLevel]);

  // Timer finish handler
  const handleFinishSolve = useCallback(
    async (timeMs: number, penalty: 'none' | '+2' | 'DNF') => {
      if (!activeSession) return;

      const scrambleUsed = currentScramble;

      // Make delta badge and time visible
      setIsSolveDismissed(false);

      // 1. Save solve
      await addSolve({
        rawTime: timeMs,
        penalty,
        scramble: scrambleUsed,
        event: activeSession.event,
        sessionId: activeSession.id,
        backupInterval: settings.backupReminderInterval,
        lastBackupCount: settings.lastBackupSolveCount,
      });

      // 2. Generate next scramble
      await generateNextScramble(
        activeSession.event,
        settings.luckyScrambles,
        settings.luckyScrambleLevel
      );
    },
    [
      activeSession,
      currentScramble,
      addSolve,
      settings.backupReminderInterval,
      settings.lastBackupSolveCount,
      settings.luckyScrambles,
      settings.luckyScrambleLevel,
      generateNextScramble,
    ]
  );


  const hasOpenModal =
    isStatsModalOpen ||
    isSettingsModalOpen ||
    isSessionModalOpen ||
    isMobileSidebarOpen;

  // Custom Timer hook
  const {
    state: timerState,
    elapsed,
    inspectionCountdown,
    inspectionPenalty,
    handleTriggerDown,
    handleTriggerUp,
    resetTimer,
  } = useTimer({
    holdDelay: settings.holdDelay,
    inspectionEnabled: settings.inspection,
    onFinishSolve: handleFinishSolve,
    disabled: hasOpenModal || !activeSession,
  });

  // Sound cues on timer states
  useEffect(() => {
    if (timerState === 'ready') {
      playReadyChime();
    }
  }, [timerState, playReadyChime]);

  useEffect(() => {
    if (timerState === 'inspection' && inspectionCountdown <= 3 && inspectionCountdown > 0) {
      playInspectionWarning();
    }
  }, [timerState, inspectionCountdown, playInspectionWarning]);

  // Keyboard Shortcuts
  const mostRecentSolve = sessionSolves[0];

  const handleToggleDNF = useCallback(() => {
    if (!mostRecentSolve) return;
    const newPenalty = mostRecentSolve.penalty === 'DNF' ? 'none' : 'DNF';
    updatePenalty(mostRecentSolve.id, newPenalty);
  }, [mostRecentSolve, updatePenalty]);

  const handleTogglePlusTwo = useCallback(() => {
    if (!mostRecentSolve) return;
    const newPenalty = mostRecentSolve.penalty === '+2' ? 'none' : '+2';
    updatePenalty(mostRecentSolve.id, newPenalty);
  }, [mostRecentSolve, updatePenalty]);

  const handleClearPenalty = useCallback(() => {
    if (!mostRecentSolve) return;
    updatePenalty(mostRecentSolve.id, 'none');
  }, [mostRecentSolve, updatePenalty]);

  const handleToggleFocusMode = useCallback(() => {
    setIsFocusMode((prev) => !prev);
  }, []);

  // Virtual Cube Dedicated Session isolation & Handlers
  const handleExitVirtualCube = useCallback(() => {
    setIsVirtualCubeActive(false);
    if (previousSessionIdRef.current) {
      setActiveSession(previousSessionIdRef.current);
      previousSessionIdRef.current = null;
    }
  }, [setActiveSession]);

  const handleEnterVirtualCube = useCallback(async () => {
    previousSessionIdRef.current = activeSessionId;
    setIsSidebarCollapsed(true);
    setIsVirtualCubeActive(true);

    let vSession = sessions.find((s) => s.name === 'Cubo Virtual');
    if (!vSession) {
      vSession = await createSession('Cubo Virtual', '333');
    }
    setActiveSession(vSession.id);
  }, [activeSessionId, sessions, createSession, setActiveSession]);

  const handleToggleVirtualCube = useCallback(() => {
    if (isVirtualCubeActive) {
      handleExitVirtualCube();
    } else {
      handleEnterVirtualCube();
    }
  }, [isVirtualCubeActive, handleExitVirtualCube, handleEnterVirtualCube]);

  useKeyboardShortcuts({
    onNewScramble: () => generateNextScramble(activeSession?.event),
    onUndo: () => undoDeleteSolve(),
    onToggleDNF: handleToggleDNF,
    onTogglePlusTwo: handleTogglePlusTwo,
    onClearPenalty: handleClearPenalty,
    onToggleFocusMode: handleToggleFocusMode,
    onEscape: () => {
      if (isMobileSidebarOpen) setIsMobileSidebarOpen(false);
      else if (isStatsModalOpen) setIsStatsModalOpen(false);
      else if (isSettingsModalOpen) setIsSettingsModalOpen(false);
      else if (isSessionModalOpen) setIsSessionModalOpen(false);
      else if (isFocusMode) setIsFocusMode(false);
      else {
        // Reset timer and dismiss solve display + delta badge (never exit virtual cube on ESC)
        setIsSolveDismissed(true);
        resetTimer();
      }
    },
    timerState,
    hasOpenModal,
  });



  // Event change handler: ensures each category has its own separate session, times, and history
  const handleSelectEvent = async (event: CubeEventId) => {
    const matchingSession = sessions.find((s) => s.event === event);
    if (matchingSession) {
      setActiveSession(matchingSession.id);
    } else {
      const currentSessionSolvesCount = solves.filter(
        (s) => s.sessionId === activeSession?.id
      ).length;
      if (activeSession && currentSessionSolvesCount === 0) {
        await updateSessionEvent(activeSession.id, event);
      } else {
        const eventName = CUBE_EVENTS[event]?.shortName || event;
        const newSession = await createSession(eventName, event);
        setActiveSession(newSession.id);
      }
    }
    await generateNextScramble(event, settings.luckyScrambles, settings.luckyScrambleLevel);
  };


  // Immediate Backup handler
  const handleBackupNow = () => {
    const jsonStr = createBackupJson(sessions, solves, settings);
    downloadBackupFile(jsonStr);
    updateSettings({ lastBackupSolveCount: solves.length });
    dismissBackupReminder();
  };

  // Import handlers
  const handleImportReplace = async (
    newSessions: typeof sessions,
    newSolves: typeof solves,
    newSettings: typeof settings
  ) => {
    await setAllSessions(newSessions);
    await setAllSolves(newSolves);
    await updateSettings(newSettings);
  };

  const handleImportMerge = async (
    mergedSessions: typeof sessions,
    mergedSolves: typeof solves,
    mergedSettings: typeof settings,
    targetActiveSessionId?: string
  ) => {
    await setAllSessions(mergedSessions, targetActiveSessionId);
    await setAllSolves(mergedSolves);
    await updateSettings(mergedSettings);

    const newActive =
      mergedSessions.find((s) => s.id === targetActiveSessionId) ||
      mergedSessions.find((s) => s.id === activeSessionId) ||
      mergedSessions[0];
    if (newActive) {
      await initScramble(newActive.event);
    }
  };

  const isRunning = timerState === 'running';
  const hideSecondaryUI = isRunning || isFocusMode;

  if (!settingsLoaded || !sessionsLoaded || !solvesLoaded) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#F5F5F7] dark:bg-[#000000] text-neutral-400">
        <div className="animate-pulse font-mono text-sm tracking-widest uppercase">CuberT</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col bg-[#F5F5F7] dark:bg-[#000000] text-[#1D1D1F] dark:text-[#F5F5F7] transition-colors duration-200 overflow-x-hidden selection:bg-[#00FF66]/20 relative">
      {/* Backup Reminder Banner */}
      {showBackupReminder && !hideSecondaryUI && (
        <BackupReminderBanner
          onBackupNow={handleBackupNow}
          onDismiss={dismissBackupReminder}
        />
      )}

      {/* New PB banner with confetti */}
      <NewPBBanner
        notification={newPBNotification}
        onDismiss={clearNewPBNotification}
        precision={settings.timerPrecision}
      />

      {/* Esquina superior derecha: Delta vs Solve Anterior (se oculta si no hay tiempo o tras ESC) */}
      <div
        className={`fixed top-3.5 right-3.5 sm:top-4 sm:right-5 z-30 transition-all duration-200 ${
          hideSecondaryUI || isSolveDismissed || (timerState === 'idle' && elapsed === 0)
            ? 'opacity-0 pointer-events-none -translate-y-2'
            : 'opacity-100 translate-y-0'
        }`}
      >
        <SolveDeltaBadge
          sessionSolves={sessionSolves}
          precision={settings.timerPrecision}
        />
      </div>

      {/* Focus Mode floating escape pill (shows for 2 seconds then disappears) */}
      {isFocusMode && !isRunning && showFocusBadge && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/75 dark:bg-[#141417]/85 backdrop-blur-xl border border-black/[0.08] dark:border-white/[0.1] text-xs text-neutral-600 dark:text-neutral-400 shadow-lg">
          <span>Modo Focus activo</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/[0.06] dark:bg-white/[0.1] font-mono text-neutral-800 dark:text-white">
            ESC o F
          </span>
          <button
            onClick={() => setIsFocusMode(false)}
            className="text-neutral-400 hover:text-neutral-900 dark:hover:text-white ml-1"
          >
            <X size={13} />
          </button>
        </div>
      )}

      {/* Floating Logo Toggle Button in Top-Left when Desktop Sidebar is Collapsed */}
      {isSidebarCollapsed && !hideSecondaryUI && (
        <div className="hidden md:block fixed top-3.5 left-3.5 z-30 transition-all duration-200">
          <button
            type="button"
            onClick={() => setIsSidebarCollapsed(false)}
            className="p-2 sm:p-2.5 rounded-2xl bg-white/75 dark:bg-[#121215]/85 backdrop-blur-xl border border-black/[0.06] dark:border-white/[0.08] shadow-[0_4px_20px_rgba(0,0,0,0.1)] hover:bg-black/[0.04] dark:hover:bg-white/[0.08] text-neutral-800 dark:text-neutral-200 transition-all flex items-center gap-2 group cursor-pointer"
            title="Mostrar barra lateral"
            aria-label="Abrir barra lateral"
          >
            <img
              src="/favicon.svg"
              alt="CuberT logo"
              className="w-5 h-5 rounded-lg group-hover:scale-95 transition-transform"
            />
            <span className="font-bold tracking-tight text-xs text-neutral-900 dark:text-[#F5F5F7]">
              CuberT
            </span>
          </button>
        </div>
      )}

      {/* Mobile Sidebar Toggle Button */}
      <div className="md:hidden fixed top-3 left-3 z-30">
        <button
          type="button"
          onClick={() => setIsMobileSidebarOpen(true)}
          className={`p-2.5 rounded-2xl bg-white/75 dark:bg-[#121215]/85 backdrop-blur-xl border border-black/[0.06] dark:border-white/[0.08] shadow-[0_4px_20px_rgba(0,0,0,0.1)] text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-all flex items-center gap-1.5 ${
            hideSecondaryUI ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
          title="Abrir menú e historial"
          aria-label="Abrir menú"
        >
          <img
            src="/favicon.svg"
            alt="CuberT logo"
            className="w-5 h-5 rounded-lg shrink-0"
          />
        </button>
      </div>

      {/* Mobile Sidebar Drawer */}
      {isMobileSidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
          {/* Drawer panel */}
          <div className="relative z-10 p-3 h-full max-w-[88vw] flex flex-col">
            <AppleMusicSidebar
              activeSession={activeSession}
              sessions={sessions}
              activeSessionId={activeSessionId}
              sessionSolves={sessionSolves}
              sessionStats={sessionStats}
              precision={settings.timerPrecision}
              lastDeletedSolve={lastDeletedSolve}
              isFocusMode={isFocusMode}
              onCloseMobile={() => setIsMobileSidebarOpen(false)}
              onToggleFocusMode={handleToggleFocusMode}
              onSelectEvent={handleSelectEvent}
              onOpenSessionManager={() => {
                setIsMobileSidebarOpen(false);
                setIsSessionModalOpen(true);
              }}
              onOpenStatsModal={() => {
                setIsMobileSidebarOpen(false);
                setIsStatsModalOpen(true);
              }}
              onOpenSettingsModal={() => {
                setIsMobileSidebarOpen(false);
                setIsSettingsModalOpen(true);
              }}
              onToggleVirtualCube={() => {
                setIsMobileSidebarOpen(false);
                handleToggleVirtualCube();
              }}
              isVirtualCubeActive={isVirtualCubeActive}
              onCollapseSidebar={() => setIsMobileSidebarOpen(false)}
              onUndoDelete={undoDeleteSolve}
              onUpdatePenalty={updatePenalty}
              onUpdateNote={updateNote}
              onDeleteSolve={deleteSolve}
              confirmDelete={settings.confirmSolveDeletion}
            />
          </div>
        </div>
      )}

      {/* Desktop Floating Apple Music Sidebar */}
      <div
        className={`hidden md:block fixed top-3.5 bottom-3.5 left-3.5 z-30 transition-all duration-300 ${
          hideSecondaryUI || isSidebarCollapsed
            ? 'opacity-0 pointer-events-none -translate-x-8 scale-95'
            : 'opacity-100 translate-x-0 scale-100'
        }`}
      >
        <AppleMusicSidebar
          activeSession={activeSession}
          sessions={sessions}
          activeSessionId={activeSessionId}
          sessionSolves={sessionSolves}
          sessionStats={sessionStats}
          precision={settings.timerPrecision}
          lastDeletedSolve={lastDeletedSolve}
          isFocusMode={isFocusMode}
          onToggleFocusMode={handleToggleFocusMode}
          onSelectEvent={handleSelectEvent}
          onOpenSessionManager={() => setIsSessionModalOpen(true)}
          onOpenStatsModal={() => setIsStatsModalOpen(true)}
          onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
          onToggleVirtualCube={handleToggleVirtualCube}
          isVirtualCubeActive={isVirtualCubeActive}
          onCollapseSidebar={() => setIsSidebarCollapsed(true)}
          onUndoDelete={undoDeleteSolve}
          onUpdatePenalty={updatePenalty}
          onUpdateNote={updateNote}
          onDeleteSolve={deleteSolve}
          confirmDelete={settings.confirmSolveDeletion}
        />
      </div>

      {/* Main Workspace */}
      <main
        className={`flex-1 w-full flex flex-col items-center justify-between pb-6 pt-4 sm:pt-6 relative min-h-screen transition-all duration-300 ${
          isFocusMode || isRunning || isSidebarCollapsed ? 'pl-0 pr-0' : 'md:pl-[300px] lg:pl-[320px] md:pr-6'
        }`}
      >
        {/* Scramble Display (Directly on background, no enclosing card) */}
        <div
          className={`w-full max-w-2xl lg:max-w-3xl px-4 pt-2 sm:pt-4 transition-all duration-150 ${
            isRunning || !settings.showScramble
              ? 'opacity-0 pointer-events-none -translate-y-2'
              : 'opacity-100 translate-y-0'
          }`}
        >
          <Scramble
            scramble={currentScramble}
            hasPrevious={previousScrambles.length > 0}
            onNextScramble={() => generateNextScramble(activeSession?.event)}
            onPreviousScramble={goToPreviousScramble}
            onCopyScramble={copyScrambleToClipboard}
            isGenerating={isGeneratingScramble}
          />
        </div>

        {/* The Centerpiece: Timer or Virtual Cube */}
        {!isVirtualCubeActive ? (
          <div className="w-full flex-1 flex items-center justify-center my-auto min-h-[260px] sm:min-h-[340px]">
            <Timer
              elapsed={elapsed}
              state={timerState}
              inspectionCountdown={inspectionCountdown}
              inspectionPenalty={inspectionPenalty}
              precision={settings.timerPrecision}
              inspectionEnabled={settings.inspection}
              onTriggerDown={handleTriggerDown}
              onTriggerUp={handleTriggerUp}
            />
          </div>
        ) : (
          <div className="w-full flex-1 flex flex-col items-center justify-center my-auto">
            {/* Center: Virtual Cube 3D */}
            <div className="w-full max-w-xl flex flex-col items-center justify-center">
              <VirtualCube onClose={handleExitVirtualCube} />
            </div>

            {/* Side: Centered on screen height against right edge, significantly smaller */}
            <div className="fixed top-1/2 -translate-y-1/2 right-4 sm:right-6 md:right-8 z-30 flex flex-col items-end pointer-events-auto select-none scale-[0.55] sm:scale-[0.62] md:scale-[0.68] origin-right">
              <Timer
                elapsed={elapsed}
                state={timerState}
                inspectionCountdown={inspectionCountdown}
                inspectionPenalty={inspectionPenalty}
                precision={settings.timerPrecision}
                inspectionEnabled={settings.inspection}
                onTriggerDown={handleTriggerDown}
                onTriggerUp={handleTriggerUp}
              />
            </div>
          </div>
        )}

        {/* Mobile Scramble Cube Visualizer (bottom of screen on phones) */}
        <div
          className={`md:hidden flex justify-center pb-2 transition-all duration-150 ${
            hideSecondaryUI || isVirtualCubeActive ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
        >
          <CubeVisualizer
            scramble={currentScramble}
            event={activeSession?.event || '333'}
          />
        </div>
      </main>

      {/* Desktop Bottom-Right: Scramble Cube Visualizer Card ("desarmado por caras") */}
      <div
        className={`hidden md:block fixed bottom-4 right-4 z-20 transition-all duration-300 ${
          hideSecondaryUI || isVirtualCubeActive
            ? 'opacity-0 pointer-events-none translate-y-6 scale-95'
            : 'opacity-100 translate-y-0 scale-100'
        }`}
      >
        <CubeVisualizer
          scramble={currentScramble}
          event={activeSession?.event || '333'}
        />
      </div>

      {/* Modals */}
      <StatsPanel
        isOpen={isStatsModalOpen}
        onClose={() => setIsStatsModalOpen(false)}
        stats={sessionStats}
        sessionSolvesRecentFirst={sessionSolves}
        sessionName={activeSession?.name || 'Sesión'}
      />

      <SessionManagerModal
        isOpen={isSessionModalOpen}
        onClose={() => setIsSessionModalOpen(false)}
        sessions={sessions}
        activeSessionId={activeSessionId}
        solvesCounts={solvesCounts}
        onSelectSession={setActiveSession}
        onCreateSession={createSession}
        onRenameSession={renameSession}
        onDeleteSession={deleteSession}
        onClearSessionSolves={clearSessionSolves}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={settings}
        onUpdateSettings={updateSettings}
        sessions={sessions}
        solves={solves}
        activeSession={activeSession}
        onImportReplace={handleImportReplace}
        onImportMerge={handleImportMerge}
      />
    </div>
  );
};



export default App;

import React, { useState, useRef, useEffect, UIEvent } from 'react';
import { Solve } from '../../types/solve';
import { SolveRow } from './SolveRow';
import { SolveDetailsModal } from './SolveDetailsModal';
import { TimerPrecision } from '../../types/settings';
import { RotateCcw } from 'lucide-react';
import { Penalty } from '../../types/solve';

interface SolveListProps {
  solves: Solve[];
  sessionName: string;
  precision: TimerPrecision;
  lastDeletedSolve: Solve | null;
  onUndoDelete: () => void;
  onUpdatePenalty: (id: string, penalty: Penalty) => Promise<void>;
  onUpdateNote: (id: string, note: string) => Promise<void>;
  onDeleteSolve: (id: string) => Promise<void>;
  confirmDelete: boolean;
}

const ITEM_HEIGHT = 34; // px per row
const VISIBLE_BUFFER = 5;

export const SolveList: React.FC<SolveListProps> = ({
  solves,
  sessionName,
  precision,
  lastDeletedSolve,
  onUndoDelete,
  onUpdatePenalty,
  onUpdateNote,
  onDeleteSolve,
  confirmDelete,
}) => {
  const [selectedSolveId, setSelectedSolveId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(300);

  useEffect(() => {
    if (containerRef.current) {
      setContainerHeight(containerRef.current.clientHeight || 300);
    }
  }, []);

  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  const totalCount = solves.length;
  const selectedSolve = selectedSolveId ? solves.find((s) => s.id === selectedSolveId) || null : null;

  // Windowed virtual scroll calculations
  const startIndex = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - VISIBLE_BUFFER);
  const endIndex = Math.min(
    totalCount,
    Math.ceil((scrollTop + containerHeight) / ITEM_HEIGHT) + VISIBLE_BUFFER
  );
  const visibleSolves = solves.slice(startIndex, endIndex);
  const offsetY = startIndex * ITEM_HEIGHT;
  const totalHeight = totalCount * ITEM_HEIGHT;

  const selectedSolveNumber = selectedSolve
    ? totalCount - solves.findIndex((s) => s.id === selectedSolve.id)
    : 0;

  return (
    <div className="w-full flex flex-col h-full overflow-hidden">
      {/* Header & Undo bar */}
      <div className="flex items-center justify-between pb-2 px-1 text-xs">
        <div className="font-medium text-neutral-400 dark:text-neutral-500 uppercase tracking-wider text-[10px]">
          Historial ({totalCount})
        </div>

        {lastDeletedSolve && (
          <button
            onClick={onUndoDelete}
            className="inline-flex items-center gap-1 text-[11px] text-blue-500 hover:text-blue-600 dark:text-blue-400 transition-colors"
          >
            <RotateCcw size={11} />
            <span>Deshacer eliminación</span>
          </button>
        )}
      </div>

      {/* List Container */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto relative pr-1"
        style={{ minHeight: '180px' }}
      >
        {totalCount === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-neutral-400 dark:text-neutral-500 text-center py-8">
            Sin solves aún en esta sesión
          </div>
        ) : (
          <div style={{ height: `${totalHeight}px`, position: 'relative' }}>
            <div
              style={{
                transform: `translateY(${offsetY}px)`,
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
              }}
              className="flex flex-col"
            >
              {visibleSolves.map((solve, idx) => (
                <div key={solve.id} style={{ height: `${ITEM_HEIGHT}px` }}>
                  <SolveRow
                    solve={solve}
                    index={startIndex + idx}
                    totalCount={totalCount}
                    precision={precision}
                    onClick={(s) => setSelectedSolveId(s.id)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Solve Details Modal */}
      <SolveDetailsModal
        isOpen={selectedSolve !== null}
        onClose={() => setSelectedSolveId(null)}
        solve={selectedSolve}
        solveNumber={selectedSolveNumber}
        precision={precision}
        sessionName={sessionName}
        onUpdatePenalty={onUpdatePenalty}
        onUpdateNote={onUpdateNote}
        onDeleteSolve={onDeleteSolve}
        confirmDelete={confirmDelete}
      />
    </div>
  );
};

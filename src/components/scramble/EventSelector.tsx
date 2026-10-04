import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Layers } from 'lucide-react';
import { CubeEventId, CUBE_EVENTS } from '../../types/event';

interface EventSelectorProps {
  currentEvent: CubeEventId;
  onSelectEvent: (event: CubeEventId) => void;
  disabled?: boolean;
}

const EVENT_GROUPS = [
  {
    title: 'Cubos Clásicos',
    events: ['333', '222', '444', '555', '666', '777'] as CubeEventId[],
  },
  {
    title: 'Especiales WCA',
    events: ['pyram', 'skewb', 'minx', 'sq1', 'clock'] as CubeEventId[],
  },
  {
    title: 'Variantes 3x3',
    events: ['333oh', '333bld'] as CubeEventId[],
  },
];

export const EventSelector: React.FC<EventSelectorProps> = ({
  currentEvent,
  onSelectEvent,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const activeMeta = CUBE_EVENTS[currentEvent] || CUBE_EVENTS['333'];

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-800 dark:text-[#ECECED] bg-black/[0.04] dark:bg-white/[0.07] hover:bg-black/[0.08] dark:hover:bg-white/[0.12] active:scale-[0.98] rounded-xl transition-all border border-black/[0.06] dark:border-white/[0.09] shadow-xs backdrop-blur-md focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
        title="Cambiar categoría / evento de cubo"
      >
        <Layers size={13} className="text-[#00FF66] shrink-0" />
        <span className="tracking-tight">{activeMeta.shortName}</span>
        <ChevronDown
          size={12}
          className={`text-neutral-400 dark:text-neutral-500 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-neutral-900 dark:text-white' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl bg-white/95 dark:bg-[#16161A]/95 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.35)] dark:shadow-[0_25px_60px_rgba(0,0,0,0.9)] border border-black/[0.08] dark:border-white/[0.12] p-2 z-50 focus:outline-none max-h-[380px] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between px-2 pb-1.5 pt-0.5 border-b border-black/[0.05] dark:border-white/[0.06] mb-1.5">
            <span className="text-[11px] font-semibold text-neutral-700 dark:text-neutral-300">
              Categoría a practicar
            </span>
            <span className="text-[10px] font-mono text-neutral-400 dark:text-neutral-500">
              WCA
            </span>
          </div>

          <div className="space-y-2">
            {EVENT_GROUPS.map((group) => (
              <div key={group.title} className="space-y-0.5">
                <div className="px-2 pt-1 pb-0.5 text-[9px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                  {group.title}
                </div>
                {group.events.map((evId) => {
                  const ev = CUBE_EVENTS[evId];
                  if (!ev) return null;
                  const isSelected = ev.id === currentEvent;
                  return (
                    <button
                      key={ev.id}
                      type="button"
                      onClick={() => {
                        onSelectEvent(ev.id);
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-xl transition-all ${
                        isSelected
                          ? 'bg-neutral-900 text-white dark:bg-white/[0.12] dark:text-[#00FF66] font-semibold shadow-xs'
                          : 'text-neutral-700 dark:text-neutral-300 hover:bg-black/[0.05] dark:hover:bg-white/[0.07]'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {isSelected ? (
                          <Check size={13} className="text-[#00FF66] shrink-0" />
                        ) : (
                          <span className="w-3.5" />
                        )}
                        <span className="truncate">{ev.name}</span>
                      </div>
                      <span
                        className={`text-[10px] font-mono shrink-0 ml-2 px-1.5 py-0.5 rounded-md ${
                          isSelected
                            ? 'bg-white/20 dark:bg-black/40 text-white dark:text-[#00FF66]'
                            : 'bg-black/[0.04] dark:bg-white/[0.05] text-neutral-400 dark:text-neutral-500'
                        }`}
                      >
                        {ev.shortName}
                      </span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

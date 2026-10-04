import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { IconButton } from '../ui/IconButton';
import { Session } from '../../types/session';
import { CubeEventId, CUBE_EVENT_LIST } from '../../types/event';
import { Plus, Check, Edit2, Trash2, Eraser } from 'lucide-react';

interface SessionManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: Session[];
  activeSessionId: string | null;
  solvesCounts: Record<string, number>;
  onSelectSession: (id: string) => void;
  onCreateSession: (name: string, event: CubeEventId) => Promise<Session>;
  onRenameSession: (id: string, newName: string) => Promise<void>;
  onDeleteSession: (id: string) => Promise<void>;
  onClearSessionSolves: (id: string) => Promise<void>;
}

export const SessionManagerModal: React.FC<SessionManagerModalProps> = ({
  isOpen,
  onClose,
  sessions,
  activeSessionId,
  solvesCounts,
  onSelectSession,
  onCreateSession,
  onRenameSession,
  onDeleteSession,
  onClearSessionSolves,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEvent, setNewEvent] = useState<CubeEventId>('333');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmClearId, setConfirmClearId] = useState<string | null>(null);

  const handleStartCreate = () => {
    setIsCreating(true);
    setNewName(`Sesión ${sessions.length + 1}`);
    setNewEvent('333');
  };

  const handleFinishCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const created = await onCreateSession(newName.trim(), newEvent);
    onSelectSession(created.id);
    setIsCreating(false);
  };

  const handleStartRename = (s: Session) => {
    setEditingId(s.id);
    setEditingName(s.name);
  };

  const handleSaveRename = async (id: string) => {
    if (editingName.trim()) {
      await onRenameSession(id, editingName.trim());
    }
    setEditingId(null);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Sesiones"
      description="Gestiona y organiza tus sesiones de práctica"
      maxWidth="md"
    >
      <div className="flex flex-col gap-4 max-h-[70vh] overflow-y-auto pr-1">
        {/* Create Session Card */}
        {isCreating ? (
          <form
            onSubmit={handleFinishCreate}
            className="flex flex-col gap-3 p-4 bg-white/[0.05] dark:bg-white/[0.04] rounded-2xl border border-black/[0.08] dark:border-white/[0.09]"
          >
            <div className="text-xs font-semibold text-neutral-800 dark:text-[#ECECED]">
              Nueva Sesión
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Nombre de la sesión"
                className="flex-1 px-3.5 py-2 text-xs rounded-xl bg-white/80 dark:bg-black/40 border border-black/[0.08] dark:border-white/[0.1] text-neutral-900 dark:text-[#F5F5F7] placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-white/30"
              />
              <select
                value={newEvent}
                onChange={(e) => setNewEvent(e.target.value as CubeEventId)}
                className="px-3 py-2 text-xs rounded-xl bg-white/80 dark:bg-black/40 border border-black/[0.08] dark:border-white/[0.1] text-neutral-900 dark:text-[#F5F5F7] focus:outline-none"
              >
                {CUBE_EVENT_LIST.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.name} ({ev.shortName})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-end gap-2 pt-1">
              <Button size="sm" variant="ghost" onClick={() => setIsCreating(false)}>
                Cancelar
              </Button>
              <Button size="sm" variant="primary" type="submit">
                Crear Sesión
              </Button>
            </div>
          </form>
        ) : (
          <button
            type="button"
            onClick={handleStartCreate}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white bg-white/[0.03] hover:bg-white/[0.06] rounded-2xl border border-dashed border-black/[0.12] dark:border-white/[0.1] transition-all"
          >
            <Plus size={14} className="text-[#00FF66]" />
            <span>Crear nueva sesión</span>
          </button>
        )}

        {/* Sessions List */}
        <div className="flex flex-col gap-2">
          {sessions.map((session) => {
            const isActive = session.id === activeSessionId;
            const count = solvesCounts[session.id] || 0;
            const isEditing = editingId === session.id;

            return (
              <div
                key={session.id}
                className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                  isActive
                    ? 'bg-black/[0.04] dark:bg-white/[0.08] border-black/[0.15] dark:border-white/[0.18] shadow-xs'
                    : 'bg-white/50 dark:bg-white/[0.03] border-black/[0.05] dark:border-white/[0.06] hover:border-black/[0.1] dark:hover:border-white/[0.12]'
                }`}
              >
                {/* Left: Info or Edit input */}
                <div
                  className="flex-1 cursor-pointer min-w-0 mr-2"
                  onClick={() => {
                    if (!isEditing) {
                      onSelectSession(session.id);
                    }
                  }}
                >
                  {isEditing ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        autoFocus
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveRename(session.id);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        className="px-2.5 py-1 text-xs rounded-lg bg-white dark:bg-black/50 border border-neutral-300 dark:border-white/20 text-neutral-900 dark:text-white focus:outline-none"
                      />
                      <IconButton
                        size="sm"
                        ariaLabel="Guardar nombre"
                        onClick={() => handleSaveRename(session.id)}
                      >
                        <Check size={12} className="text-[#00FF66]" />
                      </IconButton>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      {isActive && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#00FF66] shadow-[0_0_6px_rgba(0,255,102,0.8)]" />
                      )}
                      <span className="text-xs font-semibold text-neutral-900 dark:text-[#F5F5F7] truncate">
                        {session.name}
                      </span>
                      <span className="px-2 py-0.5 text-[10px] rounded-md bg-black/[0.05] dark:bg-white/[0.08] text-neutral-600 dark:text-neutral-300 font-mono">
                        {session.event}
                      </span>
                      <span className="text-[11px] text-neutral-400 font-mono">
                        {count} solves
                      </span>
                    </div>
                  )}
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  {!isActive && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onSelectSession(session.id)}
                      className="text-[11px] px-2.5 py-1 h-auto rounded-lg"
                    >
                      Activar
                    </Button>
                  )}

                  {!isEditing && (
                    <IconButton
                      size="sm"
                      ariaLabel="Renombrar sesión"
                      onClick={() => handleStartRename(session)}
                    >
                      <Edit2 size={12} />
                    </IconButton>
                  )}

                  {confirmClearId === session.id ? (
                    <button
                      type="button"
                      onClick={async () => {
                        await onClearSessionSolves(session.id);
                        setConfirmClearId(null);
                      }}
                      className="px-2.5 py-1 text-[10px] font-medium bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
                    >
                      ¿Limpiar?
                    </button>
                  ) : (
                    <IconButton
                      size="sm"
                      ariaLabel="Limpiar solves de la sesión"
                      onClick={() => setConfirmClearId(session.id)}
                      disabled={count === 0}
                    >
                      <Eraser size={12} />
                    </IconButton>
                  )}

                  {sessions.length > 1 && (
                    <>
                      {confirmDeleteId === session.id ? (
                        <button
                          type="button"
                          onClick={async () => {
                            await onDeleteSession(session.id);
                            setConfirmDeleteId(null);
                          }}
                          className="px-2.5 py-1 text-[10px] font-medium bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                        >
                          ¿Borrar?
                        </button>
                      ) : (
                        <IconButton
                          size="sm"
                          ariaLabel="Eliminar sesión"
                          onClick={() => setConfirmDeleteId(session.id)}
                        >
                          <Trash2 size={12} className="text-red-400" />
                        </IconButton>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Modal>
  );
};

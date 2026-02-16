'use client';

import { useAppStore } from '@/lib/store';
import { useModal } from '@/hooks';

const PACKAGE = (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
);
const PHONE = (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

const DRAG_TYPE = 'application/x-yam-backlog-item';

export function BacklogSidebar() {
  const { getBacklogDeliverables, getBacklogCalls, getClientById, navigateToClient } = useAppStore();
  const { openDeliverableModal, openCallModal } = useModal();

  const backlogDeliverables = getBacklogDeliverables();
  const backlogCalls = getBacklogCalls();
  const total = backlogDeliverables.length + backlogCalls.length;

  const handleDragStart = (e: React.DragEvent, type: 'deliverable' | 'call', id: string) => {
    e.dataTransfer.setData(DRAG_TYPE, JSON.stringify({ type, id }));
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', '');
  };

  const handleDragEnd = () => {
    window.dispatchEvent(new CustomEvent('backlog-drag-end'));
  };

  return (
    <div className="flex flex-col h-full min-h-0 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)]/95 backdrop-blur-sm shadow-[0_8px_30px_rgba(0,0,0,0.25)] overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-[var(--border-subtle)]/80">
        <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
          À planifier {total > 0 && `(${total})`}
        </p>
      </div>

      {/* Liste — style aligné sur les cards todo (contour, fond, rounded) */}
      <div className="flex-1 overflow-y-auto min-h-0 p-3 flex flex-col gap-1.5">
        {total === 0 ? (
          <p className="text-xs text-[var(--text-muted)] px-2 py-6 text-center leading-relaxed">
            Aucun élément à planifier.
          </p>
        ) : (
          <>
            {backlogDeliverables.map(d => {
              const client = getClientById(d.clientId ?? '');
              return (
                <div
                  key={d.id}
                  draggable
                  onDragStart={e => handleDragStart(e, 'deliverable', d.id)}
                  onDragEnd={handleDragEnd}
                  onClick={() => d.clientId ? navigateToClient(d.clientId) : openDeliverableModal(d.clientId, d)}
                  className="flex items-start gap-2 p-2 rounded-lg bg-[var(--bg-card)]/80 border border-[var(--border-subtle)]/60 hover:border-[var(--accent-violet)]/40 transition-all cursor-grab active:cursor-grabbing"
                >
                  <span className="text-[var(--accent-violet)] flex-shrink-0 mt-0.5" title="Livrable">
                    {PACKAGE}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
                      {client?.name ?? '—'}
                    </p>
                    <p className="text-[11px] text-[var(--text-muted)] truncate mt-0.5">
                      {d.name}
                    </p>
                  </div>
                </div>
              );
            })}
            {backlogCalls.map(c => {
              const client = getClientById(c.clientId ?? '');
              return (
                <div
                  key={c.id}
                  draggable
                  onDragStart={e => handleDragStart(e, 'call', c.id)}
                  onDragEnd={handleDragEnd}
                  onClick={() => c.clientId ? navigateToClient(c.clientId) : openCallModal(c.clientId, c)}
                  className="flex items-start gap-2 p-2 rounded-lg bg-[var(--bg-card)]/80 border border-[var(--border-subtle)]/60 hover:border-[var(--accent-coral)]/40 transition-all cursor-grab active:cursor-grabbing"
                >
                  <span className="text-[var(--accent-coral)] flex-shrink-0 mt-0.5" title="Appel">
                    {PHONE}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
                      {client?.name ?? '—'}
                    </p>
                    <p className="text-[11px] text-[var(--text-muted)] truncate mt-0.5">
                      {c.title}
                    </p>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}

export const BACKLOG_DRAG_TYPE = DRAG_TYPE;

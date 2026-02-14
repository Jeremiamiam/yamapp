'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { useModal } from '@/hooks';
import { Deliverable, Call } from '@/types';

const CHEVRON_RIGHT = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18l6-6-6-6" />
  </svg>
);
const CHEVRON_LEFT = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 18l-6-6 6-6" />
  </svg>
);
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
  const { openDeliverableModal, openCallModal, openClientModal } = useModal();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const backlogDeliverables = getBacklogDeliverables();
  const backlogCalls = getBacklogCalls();
  const total = backlogDeliverables.length + backlogCalls.length;

  const handleDragStart = (e: React.DragEvent, type: 'deliverable' | 'call', id: string) => {
    e.dataTransfer.setData(DRAG_TYPE, JSON.stringify({ type, id }));
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', ''); // fallback for some browsers
  };

  const handleDragEnd = () => {
    window.dispatchEvent(new CustomEvent('backlog-drag-end'));
  };

  return (
    <div
      className={`flex flex-col border-l border-[var(--border-subtle)] bg-[var(--bg-card)] transition-[width] duration-200 ${
        isCollapsed ? 'w-14' : 'w-64 min-w-[200px]'
      }`}
    >
      {/* Header: count + collapse + actions */}
      <div className="flex-shrink-0 flex flex-col gap-2 px-3 py-3 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-2">
          {!isCollapsed && (
            <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider truncate">
              À planifier ({total})
            </span>
          )}
          <button
          type="button"
          onClick={() => setIsCollapsed(prev => !prev)}
          className="ml-auto p-1.5 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] transition-colors"
          title={isCollapsed ? 'Ouvrir le backlog' : 'Réduire le backlog'}
        >
          {isCollapsed ? CHEVRON_RIGHT : CHEVRON_LEFT}
        </button>
        </div>
        {!isCollapsed && (
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => openDeliverableModal(undefined)}
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium text-[var(--accent-violet)] bg-[var(--accent-violet)]/10 hover:bg-[var(--accent-violet)]/20 transition-colors"
            >
              {PACKAGE}
              <span>+ Livrable</span>
            </button>
            <button
              type="button"
              onClick={() => openCallModal(undefined)}
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium text-[var(--accent-coral)] bg-[var(--accent-coral)]/10 hover:bg-[var(--accent-coral)]/20 transition-colors"
            >
              {PHONE}
              <span>+ Appel</span>
            </button>
            <button
              type="button"
              onClick={() => openClientModal()}
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium text-[var(--accent-cyan)] bg-[var(--accent-cyan)]/10 hover:bg-[var(--accent-cyan)]/20 transition-colors"
            >
              <span>+ Client</span>
            </button>
          </div>
        )}
      </div>

      {!isCollapsed && (
        <div className="flex-1 overflow-y-auto min-h-0 p-2 space-y-1">
          {total === 0 ? (
            <p className="text-xs text-[var(--text-muted)] px-2 py-4 text-center">
              Aucun élément à planifier. Créez un livrable ou un appel sans date.
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
                    className="group flex items-start gap-2 px-3 py-2 rounded-lg border border-transparent hover:border-[var(--border-subtle)] hover:bg-[var(--bg-secondary)] cursor-grab active:cursor-grabbing transition-colors"
                  >
                    <span className="text-[var(--accent-violet)] flex-shrink-0 mt-0.5" title="Livrable">
                      {PACKAGE}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider truncate">
                        {client?.name ?? '—'}
                      </p>
                      <p className="text-sm font-medium text-[var(--text-primary)] truncate">
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
                    className="group flex items-start gap-2 px-3 py-2 rounded-lg border border-transparent hover:border-[var(--border-subtle)] hover:bg-[var(--bg-secondary)] cursor-grab active:cursor-grabbing transition-colors"
                  >
                    <span className="text-[var(--accent-coral)] flex-shrink-0 mt-0.5" title="Appel">
                      {PHONE}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider truncate">
                        {client?.name ?? '—'}
                      </p>
                      <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                        {c.title}
                      </p>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}

      {/* Collapsed: show only count */}
      {isCollapsed && total > 0 && (
        <div className="flex-1 flex flex-col items-center justify-start pt-4">
          <span className="text-lg font-bold text-[var(--accent-amber)]">{total}</span>
          <span className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider mt-0.5">À planifier</span>
        </div>
      )}
    </div>
  );
}

export const BACKLOG_DRAG_TYPE = DRAG_TYPE;

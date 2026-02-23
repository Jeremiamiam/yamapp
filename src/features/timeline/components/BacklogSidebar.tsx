'use client';

import { useEffect, useRef, useState } from 'react';
import type { Project } from '@/types';
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
const CALENDAR = (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

const DRAG_TYPE = 'application/x-yam-backlog-item';

interface BacklogDeliverableCardProps {
  deliverable: { id: string; name: string };
  clientName: string;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  onNavigate: () => void;
  onPlanifier: (date: Date) => void;
  isNewlyAdded?: boolean;
}

interface BacklogProjectCardProps {
  project: Project;
  clientName: string;
  onNavigate: () => void;
  onPlanifier: (date: Date) => void;
  deliverableCount: number;
}

function BacklogProjectCard({ project, clientName, onNavigate, onPlanifier, deliverableCount }: BacklogProjectCardProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handlePlanifierClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    inputRef.current?.click();
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    if (v) onPlanifier(new Date(v));
    e.target.value = '';
  };

  return (
    <div
      onClick={onNavigate}
      className="flex items-start gap-2 p-2 rounded-lg bg-[var(--bg-card)]/80 border border-[var(--accent-cyan)]/30 hover:border-[var(--accent-cyan)]/50 transition-all cursor-pointer"
    >
      <span className="text-[var(--accent-cyan)] flex-shrink-0 mt-0.5" title="Projet">
        {FOLDER}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
          {clientName}
        </p>
        <p className="text-[11px] text-[var(--text-muted)] truncate mt-0.5">
          {project.name} · {deliverableCount} produit{deliverableCount !== 1 ? 's' : ''}
        </p>
      </div>
      <button
        type="button"
        onClick={handlePlanifierClick}
        className="flex-shrink-0 p-1.5 rounded-md text-[var(--accent-lime)] hover:bg-[var(--accent-lime)]/10 transition-colors touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
        title="Planifier le projet sur la timeline"
      >
        <input
          ref={inputRef}
          type="datetime-local"
          className="sr-only"
          onChange={handleDateChange}
          onClick={(e) => e.stopPropagation()}
        />
        {CALENDAR}
      </button>
    </div>
  );
}

function BacklogDeliverableCard({ deliverable, clientName, onDragStart, onDragEnd, onNavigate, onPlanifier, isNewlyAdded }: BacklogDeliverableCardProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handlePlanifierClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    inputRef.current?.click();
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    if (v) onPlanifier(new Date(v));
    e.target.value = '';
  };

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onNavigate}
      className={`flex items-start gap-2 p-2 rounded-lg border transition-all cursor-grab active:cursor-grabbing ${
        isNewlyAdded
          ? 'bg-[var(--accent-violet)]/20 border-[var(--accent-violet)]/60 animate-backlog-flash'
          : 'bg-[var(--bg-card)]/80 border-[var(--border-subtle)]/60 hover:border-[var(--accent-violet)]/40'
      }`}
    >
      <span className="text-[var(--accent-violet)] flex-shrink-0 mt-0.5" title="Produit">
        {PACKAGE}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
          {clientName}
        </p>
        <p className="text-[11px] text-[var(--text-muted)] truncate mt-0.5">
          {deliverable.name}
        </p>
      </div>
      <button
        type="button"
        onClick={handlePlanifierClick}
        className="flex-shrink-0 p-1.5 rounded-md text-[var(--accent-lime)] hover:bg-[var(--accent-lime)]/10 transition-colors touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
        title="Planifier sur la timeline"
      >
        <input
          ref={inputRef}
          type="datetime-local"
          className="sr-only"
          onChange={handleDateChange}
          onClick={(e) => e.stopPropagation()}
        />
        {CALENDAR}
      </button>
    </div>
  );
}

interface BacklogSidebarProps {
  onBeforeNavigate?: () => void;
}

const FOLDER = (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </svg>
);

export function BacklogSidebar({ onBeforeNavigate }: BacklogSidebarProps = {}) {
  const { getBacklogDeliverables, getBacklogCalls, getBacklogProjects, getClientById, navigateToClient, updateDeliverable, updateCall, updateProject, currentView, navigateToTimeline, projects, deliverables } = useAppStore();
  const { openDeliverableModal, openCallModal } = useModal();
  const [isDragOver, setIsDragOver] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const backlogDeliverables = getBacklogDeliverables();
  const backlogCalls = getBacklogCalls();
  const backlogProjects = getBacklogProjects();
  const total = backlogDeliverables.length + backlogCalls.length + backlogProjects.length;

  const handleDragStart = (e: React.DragEvent, type: 'deliverable' | 'call', id: string) => {
    e.dataTransfer.setData(DRAG_TYPE, JSON.stringify({ type, id }));
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', '');
    
    // Si on n'est pas sur la timeline, y aller automatiquement
    if (currentView !== 'timeline') {
      navigateToTimeline();
    }
  };

  const handleDragEnd = () => {
    window.dispatchEvent(new CustomEvent('backlog-drag-end'));
  };

  // Handler HTML5 drag : drop depuis la vue Production → backlog
  const handleHtml5DragOver = (e: React.DragEvent) => {
    // Accepter le drop si ça vient de la vue Production (ou tout HTML5 drag)
    if (e.dataTransfer.types.includes('application/x-yam-production')) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      setIsDragOver(true);
    }
  };
  const handleHtml5DragLeave = () => {
    setIsDragOver(false);
  };
  const [backlogFlash, setBacklogFlash] = useState<string | null>(null);

  const handleHtml5Drop = async (e: React.DragEvent) => {
    setIsDragOver(false);
    const raw = e.dataTransfer.getData('application/x-yam-production');
    if (!raw) return;
    e.preventDefault();
    try {
      const { id } = JSON.parse(raw);
      if (id) {
        // Ne touche PAS au status ni à dueDate — juste toggle inBacklog
        await updateDeliverable(id, { inBacklog: true });
        // Animation flash
        setBacklogFlash(id);
        setTimeout(() => setBacklogFlash(null), 1500);
      }
    } catch (_) {}
  };

  // Écouter les événements custom de drag depuis la timeline (mouse-based drag)
  useEffect(() => {
    const handleTimelineDragMove = (e: CustomEvent<{ x: number; y: number }>) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const { x, y } = e.detail;
      const isOver = x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
      setIsDragOver(isOver);
    };

    const handleTimelineDragEnd = async (e: CustomEvent<{ x: number; y: number; type: 'deliverable' | 'call' | 'todo'; id: string } | null>) => {
      setIsDragOver(false);
      if (!e.detail || !containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const { x, y, type, id } = e.detail;
      const isOver = x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
      
      if (isOver) {
        // Remettre l'item dans le backlog
        if (type === 'deliverable') {
          await updateDeliverable(id, { dueDate: undefined, inBacklog: true });
        } else if (type === 'call') {
          await updateCall(id, { scheduledAt: undefined });
        }
        // Les todos ne peuvent pas retourner au backlog
      }
    };

    const onDragMove = (e: Event) => handleTimelineDragMove(e as CustomEvent);
    const onDragEnd = (e: Event) => handleTimelineDragEnd(e as CustomEvent);

    window.addEventListener('timeline-drag-move', onDragMove);
    window.addEventListener('timeline-drag-end', onDragEnd);

    return () => {
      window.removeEventListener('timeline-drag-move', onDragMove);
      window.removeEventListener('timeline-drag-end', onDragEnd);
    };
  }, [updateDeliverable, updateCall]);

  return (
    <div 
      ref={containerRef}
      data-backlog-drop-zone
      onDragOver={handleHtml5DragOver}
      onDragLeave={handleHtml5DragLeave}
      onDrop={handleHtml5Drop}
      className={`flex flex-col h-full min-h-0 overflow-hidden transition-all duration-200 ${
        isDragOver 
          ? 'ring-2 ring-[var(--accent-violet)]/30 ring-inset' 
          : ''
      }`}
    >
      {/* Header */}
      <div className="flex-shrink-0 px-3 py-3 flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
          {isDragOver ? '↓ Déposer ici' : `À planifier`}
        </p>
        {total > 0 && !isDragOver && (
          <span className="text-[10px] text-[var(--text-muted)] bg-[var(--bg-tertiary)] px-1.5 py-0.5 rounded-full">
            {total}
          </span>
        )}
        <div className="flex items-center gap-1 ml-auto">
          <button
            type="button"
            onClick={() => openDeliverableModal(undefined, undefined)}
            className="w-6 h-6 flex items-center justify-center rounded-md text-[var(--accent-violet)] bg-[var(--accent-violet)]/10 hover:bg-[var(--accent-violet)]/20 transition-colors cursor-pointer"
            title="Nouveau produit"
          >
            {PACKAGE}
          </button>
          <button
            type="button"
            onClick={() => openCallModal(undefined, undefined)}
            className="w-6 h-6 flex items-center justify-center rounded-md text-[var(--accent-coral)] bg-[var(--accent-coral)]/10 hover:bg-[var(--accent-coral)]/20 transition-colors cursor-pointer"
            title="Nouvel appel"
          >
            {PHONE}
          </button>
        </div>
      </div>

      {/* Liste */}
      <div className="flex-1 overflow-y-auto min-h-0 px-3 pb-3 flex flex-col gap-1.5">
        {total === 0 ? (
          <p className="text-xs text-[var(--text-muted)] px-2 py-6 text-center leading-relaxed">
            Aucun élément à planifier.
          </p>
        ) : (
          <>
            {backlogProjects.map((proj) => {
              const client = getClientById(proj.clientId);
              const projectDeliverables = deliverables.filter((d) => d.projectId === proj.id);
              return (
                <BacklogProjectCard
                  key={proj.id}
                  project={proj}
                  clientName={client?.name ?? '—'}
                  onNavigate={() => {
                    onBeforeNavigate?.();
                    navigateToClient(proj.clientId, proj.id);
                  }}
                  onPlanifier={(date) => {
                    projectDeliverables.forEach((d) => updateDeliverable(d.id, { dueDate: date, inBacklog: false }));
                    updateProject(proj.id, { inBacklog: false });
                  }}
                  deliverableCount={projectDeliverables.length}
                />
              );
            })}
            {backlogDeliverables.map(d => {
              const clientId = d.clientId ?? projects.find(p => p.id === d.projectId)?.clientId ?? '';
              const client = getClientById(clientId);
              const isNewlyAdded = backlogFlash === d.id;
              return (
                <BacklogDeliverableCard
                  key={d.id}
                  deliverable={d}
                  clientName={client?.name ?? '—'}
                  onDragStart={(e) => handleDragStart(e, 'deliverable', d.id)}
                  onDragEnd={handleDragEnd}
                  onNavigate={() => {
                    onBeforeNavigate?.();
                    if (clientId) navigateToClient(clientId, d.projectId ?? '__divers__');
                  }}
                  onPlanifier={(date) => updateDeliverable(d.id, { dueDate: date, inBacklog: false })}
                  isNewlyAdded={isNewlyAdded}
                />
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
                  onClick={() => {
                    onBeforeNavigate?.();
                    if (c.clientId) navigateToClient(c.clientId);
                  }}
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

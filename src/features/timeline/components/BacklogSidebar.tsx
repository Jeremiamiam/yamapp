'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
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

const DRAG_TYPE = 'application/x-yam-backlog-item';

interface BacklogDeliverableCardProps {
  deliverable: { id: string; name: string };
  clientName: string;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  onNavigate: () => void;
  onRemove: (e: React.MouseEvent) => void;
  isNewlyAdded?: boolean;
}

interface BacklogProjectCardProps {
  project: Project;
  clientName: string;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  onNavigate: () => void;
  onRemove: (e: React.MouseEvent) => void;
  deliverableCount: number;
}

function BacklogProjectCard({ project, clientName, onDragStart, onDragEnd, onNavigate, onRemove, deliverableCount }: BacklogProjectCardProps) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onNavigate}
      className="flex items-center gap-2 p-2 rounded-lg bg-[var(--bg-card)]/80 border border-[var(--accent-cyan)]/30 hover:border-[var(--accent-cyan)]/50 transition-all cursor-grab active:cursor-grabbing"
    >
      <span className="text-[var(--accent-cyan)] flex-shrink-0" title="Projet">
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
        onClick={onRemove}
        className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors cursor-pointer"
        title="Retirer du backlog"
      >
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}

function BacklogDeliverableCard({ deliverable, clientName, onDragStart, onDragEnd, onNavigate, onRemove, isNewlyAdded }: BacklogDeliverableCardProps) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onNavigate}
      className={`flex items-center gap-2 p-2 rounded-lg border transition-all cursor-grab active:cursor-grabbing ${
        isNewlyAdded
          ? 'bg-[var(--accent-violet)]/20 border-[var(--accent-violet)]/60 animate-backlog-flash'
          : 'bg-[var(--bg-card)]/80 border-[var(--border-subtle)]/60 hover:border-[var(--accent-violet)]/40'
      }`}
    >
      <span className="text-[var(--accent-violet)] flex-shrink-0" title="Produit">
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
        onClick={onRemove}
        className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors cursor-pointer"
        title="Retirer du backlog"
      >
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
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
  const { getBacklogDeliverables, getBacklogCalls, getBacklogProjects, getClientById, navigateToClient, updateDeliverable, updateCall, updateProject, currentView, navigateToTimeline, projects, deliverables, clients } = useAppStore();
  const { openCallModal } = useModal();
  const [isDragOver, setIsDragOver] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addSearch, setAddSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const backlogDeliverables = getBacklogDeliverables();
  const backlogCalls = getBacklogCalls();
  const backlogProjects = getBacklogProjects();
  const total = backlogDeliverables.length + backlogCalls.length + backlogProjects.length;

  // Projets disponibles à ajouter au backlog (pas déjà dedans)
  const availableProjects = useMemo(() => {
    const q = addSearch.toLowerCase();
    return projects
      .filter(p => !p.inBacklog)
      .filter(p => {
        if (!q) return true;
        const client = getClientById(p.clientId);
        return (
          p.name.toLowerCase().includes(q) ||
          (client?.name ?? '').toLowerCase().includes(q)
        );
      })
      .map(p => {
        const client = getClientById(p.clientId);
        return { p, clientName: client?.name ?? 'Sans client', clientId: p.clientId };
      })
      .sort((a, b) => a.clientName.localeCompare(b.clientName) || a.p.name.localeCompare(b.p.name));
  }, [projects, addSearch, clients, getClientById]); // eslint-disable-line react-hooks/exhaustive-deps

  // Produits disponibles à ajouter au backlog (pas déjà dedans, pas terminés)
  const availableDeliverables = useMemo(() => {
    const q = addSearch.toLowerCase();
    return deliverables
      .filter(d => !d.inBacklog && d.status !== 'completed')
      .filter(d => {
        if (!q) return true;
        const client = d.clientId ? getClientById(d.clientId) : null;
        const proj = d.projectId ? projects.find(p => p.id === d.projectId) : null;
        return (
          d.name.toLowerCase().includes(q) ||
          (client?.name ?? '').toLowerCase().includes(q) ||
          (proj?.name ?? '').toLowerCase().includes(q)
        );
      })
      .map(d => {
        const clientId = d.clientId ?? projects.find(p => p.id === d.projectId)?.clientId ?? '';
        const client = clientId ? getClientById(clientId) : null;
        const proj = d.projectId ? projects.find(p => p.id === d.projectId) : null;
        return { d, clientName: client?.name ?? 'Sans client', clientId, projName: proj?.name ?? null };
      })
      .sort((a, b) => a.clientName.localeCompare(b.clientName) || (a.projName ?? '').localeCompare(b.projName ?? '') || a.d.name.localeCompare(b.d.name));
  }, [deliverables, addSearch, projects, clients, getClientById]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDragStart = (e: React.DragEvent, type: 'deliverable' | 'call' | 'project', id: string) => {
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

    const handleTimelineDragEnd = async (e: CustomEvent<{ x: number; y: number; type: 'deliverable' | 'call' | 'todo' | 'project'; id: string } | null>) => {
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
        } else if (type === 'project') {
          await updateProject(id, { scheduledAt: undefined, inBacklog: true });
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
            onClick={() => { setShowAddModal(true); setAddSearch(''); }}
            className="w-6 h-6 flex items-center justify-center rounded-md text-[var(--accent-violet)] bg-[var(--accent-violet)]/10 hover:bg-[var(--accent-violet)]/20 transition-colors cursor-pointer"
            title="Ajouter au backlog"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
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
                  onDragStart={(e) => handleDragStart(e, 'project', proj.id)}
                  onDragEnd={handleDragEnd}
                  onNavigate={() => {
                    onBeforeNavigate?.();
                    navigateToClient(proj.clientId, proj.id);
                  }}
                  onRemove={(e) => {
                    e.stopPropagation();
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
                  onRemove={(e) => {
                    e.stopPropagation();
                    updateDeliverable(d.id, { inBacklog: false });
                  }}
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

      {/* Modale : ajouter un produit existant au backlog */}
      {showAddModal && (
        <div className="absolute inset-0 z-50 flex flex-col bg-[var(--bg-primary)] rounded-lg overflow-hidden">
          {/* Header */}
          <div className="flex-shrink-0 flex items-center gap-2 px-3 py-3 border-b border-[var(--border-subtle)]">
            <span className="text-xs font-semibold text-[var(--text-primary)] flex-1">Ajouter au backlog</span>
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="w-6 h-6 flex items-center justify-center rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Search */}
          <div className="flex-shrink-0 px-3 py-2 border-b border-[var(--border-subtle)]">
            <input
              autoFocus
              type="text"
              placeholder="Rechercher client, projet, produit…"
              value={addSearch}
              onChange={e => setAddSearch(e.target.value)}
              className="w-full text-xs bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-md px-2.5 py-1.5 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--accent-violet)]/50"
            />
          </div>

          {/* Liste */}
          <div className="flex-1 overflow-y-auto px-2 py-2">
            {availableProjects.length === 0 && availableDeliverables.length === 0 ? (
              <p className="text-xs text-[var(--text-muted)] text-center py-8">
                {addSearch ? 'Aucun résultat' : 'Tout est déjà dans le backlog ou terminé.'}
              </p>
            ) : (() => {
              // Construire une map client → { projets, produits groupés par projet }
              type DelEntry = typeof availableDeliverables[0];
              const clientMap = new Map<string, {
                clientName: string;
                projects: typeof availableProjects;
                projMap: Map<string, { projName: string | null; items: DelEntry[] }>;
              }>();

              // Ajouter les projets
              availableProjects.forEach(entry => {
                if (!clientMap.has(entry.clientId)) clientMap.set(entry.clientId, { clientName: entry.clientName, projects: [], projMap: new Map() });
                clientMap.get(entry.clientId)!.projects.push(entry);
              });

              // Ajouter les produits
              availableDeliverables.forEach(entry => {
                if (!clientMap.has(entry.clientId)) clientMap.set(entry.clientId, { clientName: entry.clientName, projects: [], projMap: new Map() });
                const cg = clientMap.get(entry.clientId)!;
                const pkey = entry.d.projectId ?? '__none__';
                if (!cg.projMap.has(pkey)) cg.projMap.set(pkey, { projName: entry.projName, items: [] });
                cg.projMap.get(pkey)!.items.push(entry);
              });

              return [...clientMap.entries()].map(([cid, cg]) => (
                <div key={cid} className="mb-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] px-1 mb-1">{cg.clientName}</p>

                  {/* Projets du client */}
                  {cg.projects.map(entry => (
                    <button
                      key={entry.p.id}
                      type="button"
                      onClick={async () => {
                        await updateProject(entry.p.id, { inBacklog: true });
                        setShowAddModal(false);
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-md text-xs text-[var(--accent-cyan)] hover:bg-[var(--accent-cyan)]/10 transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                      <span className="truncate">{entry.p.name}</span>
                    </button>
                  ))}

                  {/* Produits du client */}
                  {[...cg.projMap.entries()].map(([pkey, pg]) => (
                    <div key={pkey} className="mb-1.5">
                      {pg.projName && (
                        <p className="text-[10px] text-[var(--text-muted)] flex items-center gap-1 px-1 mb-0.5 mt-1">
                          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                          {pg.projName}
                        </p>
                      )}
                      {pg.items.map(entry => (
                        <button
                          key={entry.d.id}
                          type="button"
                          onClick={async () => {
                            await updateDeliverable(entry.d.id, { inBacklog: true });
                            setBacklogFlash(entry.d.id);
                            setTimeout(() => setBacklogFlash(null), 1500);
                            setShowAddModal(false);
                          }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs text-[var(--text-primary)] hover:bg-[var(--accent-violet)]/10 hover:text-[var(--accent-violet)] transition-colors cursor-pointer flex items-center gap-1.5 ${pg.projName ? 'pl-4' : ''}`}
                        >
                          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 opacity-50"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
                          <span className="truncate">{entry.d.name}</span>
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              ));
            })()}
          </div>
        </div>
      )}
    </div>
  );
}

export const BACKLOG_DRAG_TYPE = DRAG_TYPE;

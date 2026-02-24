'use client';

import { useMemo, useState, useCallback } from 'react';
import { useAppStore } from '@/lib/store';
import { useModal } from '@/hooks';
import { Deliverable, DeliverableStatus, Project } from '@/types';
import { canTransitionStatus } from '@/lib/production-rules';
import { computeProjectBilling, formatEuro, PROJECT_BILLING_LABELS, PROJECT_BILLING_COLORS } from '@/lib/project-billing';

// Colonnes Kanban
const COLUMNS: { id: DeliverableStatus; label: string; color: string }[] = [
  { id: 'to_quote', label: 'À deviser', color: 'var(--accent-coral)' },
  { id: 'pending', label: 'À faire', color: 'var(--accent-violet)' },
  { id: 'in-progress', label: 'En attente', color: 'var(--accent-cyan)' },
  { id: 'completed', label: 'Terminé', color: 'var(--accent-lime)' },
];

// SVG icons
const LOCK_ICON = (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

interface ProductionCardProps {
  deliverable: Deliverable;
  onClick: () => void;
  onDragStart: (e: React.DragEvent, deliverable: Deliverable) => void;
  isCompact?: boolean;
  isGrouped?: boolean;
  isFirst?: boolean;
  isLast?: boolean;
  inProject?: boolean;
}

function ProductionCard({
  deliverable,
  onClick,
  onDragStart,
  isCompact = false,
  isGrouped = false,
  isFirst = true,
  isLast = true,
  inProject = false,
}: ProductionCardProps) {
  const [didDrag, setDidDrag] = useState(false);

  const handleClick = () => {
    if (!didDrag) onClick();
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    setDidDrag(true);
    onDragStart(e, deliverable);
  };

  const handleDragEnd = () => {
    requestAnimationFrame(() => setDidDrag(false));
  };

  if (isCompact) {
    const compactRounded = isFirst && isLast 
      ? 'rounded' 
      : isFirst ? 'rounded-t rounded-b-none' 
      : isLast ? 'rounded-b rounded-t-none' 
      : 'rounded-none';

    return (
      <div
        draggable
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onClick={handleClick}
        className={`flex items-center gap-2 px-2 py-1 bg-[var(--bg-tertiary)]/50 hover:bg-[var(--bg-tertiary)] cursor-pointer transition-colors text-[10px] group ${compactRounded} ${
          !isFirst ? '-mt-px' : ''
        } ${inProject ? 'pl-4' : ''}`}
      >
        <span className="truncate flex-1 text-[var(--text-muted)] group-hover:text-[var(--text-primary)]">
          {deliverable.name}
        </span>
        {deliverable.prixFacturé != null && deliverable.prixFacturé > 0 && (
          <span className="text-[#22c55e]/80 flex-shrink-0 font-medium">
            {deliverable.prixFacturé.toLocaleString('fr-FR')} €
          </span>
        )}
      </div>
    );
  }

  // Rounded corners selon position dans le groupe
  const roundedClass = isFirst && isLast 
    ? 'rounded-lg' 
    : isFirst 
      ? 'rounded-t-lg rounded-b-none' 
      : isLast 
        ? 'rounded-b-lg rounded-t-none' 
        : 'rounded-none';

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={handleClick}
      className={`py-2 bg-[var(--bg-secondary)] border border-[var(--border-subtle)] hover:border-[var(--accent-cyan)]/50 cursor-pointer transition-all hover:shadow-md group ${roundedClass} ${
        !isFirst ? '-mt-px' : ''
      } ${inProject ? 'pl-4 pr-2.5' : 'px-2.5'}`}
    >
      <div className="flex items-center gap-2">
        <span className="text-[13px] font-medium text-[var(--text-primary)] truncate flex-1 group-hover:text-[var(--accent-cyan)]">
          {deliverable.name}
        </span>
        {deliverable.prixFacturé != null && deliverable.prixFacturé > 0 && (
          <span className="text-[11px] font-semibold text-[#22c55e] flex-shrink-0">
            {deliverable.prixFacturé.toLocaleString('fr-FR')} €
          </span>
        )}
      </div>
    </div>
  );
}

interface ProjectBandeauProps {
  project: Project;
  deliverables: Deliverable[];
  onClick: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: (e: React.MouseEvent) => void;
}

function ProjectBandeau({ project, deliverables, onClick, isCollapsed = false, onToggleCollapse }: ProjectBandeauProps) {
  const billing = computeProjectBilling(project, deliverables);
  const colors = PROJECT_BILLING_COLORS[billing.status];
  const hasQuote = project.quoteAmount && project.quoteAmount > 0;
  const pct = hasQuote ? Math.min(100, billing.progressPercent) : 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] text-left cursor-pointer hover:bg-[var(--bg-tertiary)]/80 transition-colors overflow-hidden ${
        isCollapsed ? 'rounded-xl' : 'rounded-t-xl border-b-0'
      }`}
    >
      <div className="px-3 pt-2 pb-2 space-y-1">
        <div className="flex items-center gap-1.5">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--accent-cyan)] flex-shrink-0">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
          </svg>
          <span className="text-[12px] font-semibold text-[var(--text-primary)] truncate flex-1">
            {project.name}
          </span>
          {billing.status !== 'none' && (
            <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold flex-shrink-0 ${colors.bg} ${colors.text}`}>
              {PROJECT_BILLING_LABELS[billing.status]}
            </span>
          )}
          {hasQuote && (
            <span className="text-[10px] font-medium text-[var(--text-muted)] flex-shrink-0 tabular-nums">
              {formatEuro(billing.totalPaid)}
              <span className="opacity-40">/</span>
              {formatEuro(project.quoteAmount!)}
            </span>
          )}
          {onToggleCollapse && (
            <span
              role="button"
              onClick={(e) => { e.stopPropagation(); onToggleCollapse(e); }}
              className="flex-shrink-0 ml-0.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
              title={isCollapsed ? 'Déplier' : 'Replier'}
            >
              <svg
                width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                className={`transition-transform duration-200 ${isCollapsed ? '-rotate-90' : 'rotate-0'}`}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </span>
          )}
        </div>
      </div>

      {/* Barre de progression — masquée si replié */}
      {hasQuote && !isCollapsed && (
        <div className="h-[2px] w-full bg-[var(--bg-secondary)]">
          <div
            className="h-full bg-[var(--accent-cyan)] transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </button>
  );
}

function ClientHeader({ name, isFirst }: { name: string; isFirst: boolean }) {
  return (
    <div className={`flex items-center gap-2 px-0.5 pb-1.5 ${isFirst ? '' : 'pt-4'}`}>
      <span className="text-[11px] font-bold text-[var(--text-primary)] uppercase tracking-wider truncate">
        {name}
      </span>
      <div className="flex-1 h-px bg-[var(--border-subtle)]" />
    </div>
  );
}

export function ProductionView() {
  const { deliverables, projects, getClientById, updateDeliverable, filters } = useAppStore();

  const getProjectQuoteForDeliverable = useCallback((d: Deliverable) => {
    if (!d.projectId) return undefined;
    const project = projects.find((p) => p.id === d.projectId);
    return project?.quoteAmount ?? undefined;
  }, [projects]);
  const navigateToClient = useAppStore((s) => s.navigateToClient);
  const { openDeliverableModal } = useModal();
  const [draggedItem, setDraggedItem] = useState<Deliverable | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<DeliverableStatus | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [collapsedProjects, setCollapsedProjects] = useState<Set<string>>(new Set());

  const allProjectIds = useMemo(() => new Set(projects.map(p => p.id)), [projects]);
  const allCollapsed = allProjectIds.size > 0 && [...allProjectIds].every(id => collapsedProjects.has(id));

  const toggleAllCollapsed = useCallback(() => {
    if (allCollapsed) {
      setCollapsedProjects(new Set());
    } else {
      setCollapsedProjects(new Set(allProjectIds));
    }
  }, [allCollapsed, allProjectIds]);

  const toggleProject = useCallback((projectId: string) => {
    setCollapsedProjects(prev => {
      const next = new Set(prev);
      if (next.has(projectId)) next.delete(projectId);
      else next.add(projectId);
      return next;
    });
  }, []);

  // Filtrer par membre d'équipe si filtre actif
  const filteredDeliverables = useMemo(() => {
    if (!filters.teamMemberId) return deliverables;
    return deliverables.filter(d => d.assigneeId === filters.teamMemberId);
  }, [deliverables, filters.teamMemberId]);

  // Grouper par statut et trier par deadline
  const columns = useMemo(() => {
    const grouped: Record<DeliverableStatus, Deliverable[]> = {
      'to_quote': [],
      'pending': [],
      'in-progress': [],
      'completed': [],
    };

    filteredDeliverables.forEach(d => {
      // Déjà devisé (devis ou prix renseigné) → afficher en "À faire", pas en "À deviser"
      const effectiveStatus: DeliverableStatus =
        d.status === 'to_quote' && ((d.quoteAmount ?? d.prixFacturé ?? 0) > 0)
          ? 'pending'
          : d.status;
      if (grouped[effectiveStatus]) {
        grouped[effectiveStatus].push(d);
      }
    });

    // Trier par deadline (null en dernier)
    Object.keys(grouped).forEach(status => {
      grouped[status as DeliverableStatus].sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate.getTime() - b.dueDate.getTime();
      });
    });

    return grouped;
  }, [filteredDeliverables]);

  // Drag handlers
  const handleDragStart = (e: React.DragEvent, deliverable: Deliverable) => {
    setDraggedItem(deliverable);
    e.dataTransfer.effectAllowed = 'move';
    // Data pour le backlog sidebar (HTML5 drag)
    e.dataTransfer.setData('application/x-yam-production', JSON.stringify({ id: deliverable.id }));
  };

  const handleDragOver = (e: React.DragEvent, columnId: DeliverableStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(columnId);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const showToast = useCallback((message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  }, []);

  const handleDrop = async (e: React.DragEvent, newStatus: DeliverableStatus) => {
    e.preventDefault();
    setDragOverColumn(null);
    
    if (draggedItem && draggedItem.status !== newStatus) {
      // Vérifier les règles métier (projet devisé = le projet l’emporte, pas besoin de devis produit)
      const result = canTransitionStatus({
        status: draggedItem.status,
        billingStatus: draggedItem.billingStatus,
        prixFacturé: draggedItem.prixFacturé,
        projectQuoteAmount: getProjectQuoteForDeliverable(draggedItem),
      }, newStatus);

      if (!result.allowed) {
        showToast(result.reason);
        setDraggedItem(null);
        return;
      }

      await updateDeliverable(draggedItem.id, { status: newStatus });
    }
    setDraggedItem(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverColumn(null);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden p-3 md:p-6">
      {/* Header */}
      <div className="flex-shrink-0 mb-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <div>
            <h1 className="text-lg font-semibold text-[var(--text-primary)]">
              Production
            </h1>
            <p className="text-xs text-[var(--text-muted)]">
              {filteredDeliverables.length} produit{filteredDeliverables.length > 1 ? 's' : ''}
            </p>
          </div>
          {/* Pipeline summary */}
          {(() => {
            const totalPotentiel = columns.to_quote.reduce((s, d) => s + (d.margePotentielle || 0), 0);
            const pipelineConfirme = [...columns.pending, ...columns['in-progress']].reduce((s, d) => s + (d.prixFacturé || 0), 0);
            const totalEncaisse = columns.completed.reduce((s, d) => s + (d.prixFacturé || 0), 0);
            return (
              <div className="hidden md:flex items-center gap-4 text-[11px]">
                {totalPotentiel > 0 && (
                  <div className="flex items-baseline gap-1">
                    <span className="text-[var(--text-muted)] uppercase tracking-wider">Potentiel</span>
                    <span className="text-sm font-bold text-[var(--accent-violet)]">{totalPotentiel.toLocaleString('fr-FR')} €</span>
                  </div>
                )}
                {pipelineConfirme > 0 && (
                  <div className="flex items-baseline gap-1">
                    <span className="text-[var(--text-muted)] uppercase tracking-wider">Pipeline</span>
                    <span className="text-sm font-bold text-[#22c55e]">{pipelineConfirme.toLocaleString('fr-FR')} €</span>
                  </div>
                )}
                {totalEncaisse > 0 && (
                  <div className="flex items-baseline gap-1">
                    <span className="text-[var(--text-muted)] uppercase tracking-wider">Encaissé</span>
                    <span className="text-sm font-bold text-[#22c55e]">{totalEncaisse.toLocaleString('fr-FR')} €</span>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
        {/* Bouton global replier/déplier projets */}
        {allProjectIds.size > 0 && (
          <button
            type="button"
            onClick={toggleAllCollapsed}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer border border-[var(--border-subtle)]"
            title={allCollapsed ? 'Déplier tous les projets' : 'Replier tous les projets'}
          >
            <svg
              width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              className={`transition-transform duration-200 ${allCollapsed ? '-rotate-90' : 'rotate-0'}`}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
            {allCollapsed ? 'Déplier' : 'Replier'}
          </button>
        )}
      </div>

      {/* Kanban board */}
      <div className="flex-1 flex gap-3 md:gap-4 overflow-x-auto pb-20 md:pb-4 snap-x snap-mandatory">
        {COLUMNS.map(column => {
          const items = columns[column.id];
          const isCompleted = column.id === 'completed';
          const isDragOver = dragOverColumn === column.id;

          // Vérifier si le drop est interdit + motif
          const dropCheck = isDragOver && draggedItem && draggedItem.status !== column.id
            ? canTransitionStatus({
                status: draggedItem.status,
                billingStatus: draggedItem.billingStatus,
                prixFacturé: draggedItem.prixFacturé,
                projectQuoteAmount: getProjectQuoteForDeliverable(draggedItem),
              }, column.id)
            : null;
          const isDropBlocked = dropCheck ? !dropCheck.allowed : false;
          const blockReason = dropCheck && !dropCheck.allowed ? dropCheck.reason : null;

          // Total financier par colonne
          const columnTotal = column.id === 'to_quote'
            ? items.reduce((sum, d) => sum + (d.margePotentielle || 0), 0)
            : items.reduce((sum, d) => sum + (d.prixFacturé || 0), 0);

          return (
            <div
              key={column.id}
              className={`snap-start flex-shrink-0 flex flex-col rounded-xl bg-[var(--bg-secondary)]/30 border transition-all ${
                isCompleted ? 'w-[82vw] md:w-[200px]' : 'w-[82vw] md:w-[260px]'
              } ${
                isDragOver
                  ? isDropBlocked
                    ? 'border-red-500/60 bg-red-500/5'
                    : 'border-[var(--accent-cyan)] bg-[var(--accent-cyan)]/5'
                  : 'border-[var(--border-subtle)]'
              }`}
              onDragOver={(e) => handleDragOver(e, column.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              {/* Column header */}
              <div className={`flex-shrink-0 px-3 py-2 border-b transition-colors ${
                isDropBlocked ? 'border-red-500/40 bg-red-500/10' : 'border-[var(--border-subtle)]'
              }`}>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-2 h-2 rounded-full" 
                    style={{ backgroundColor: isDropBlocked ? 'rgb(239 68 68)' : column.color }}
                  />
                  <span className={`text-xs font-semibold uppercase tracking-wider ${
                    isDropBlocked ? 'text-red-400' : 'text-[var(--text-primary)]'
                  }`}>
                    {column.label}
                  </span>
                  {isCompleted && (
                    <span className="text-[var(--text-muted)]/60 ml-1">{LOCK_ICON}</span>
                  )}
                  <span className="text-[10px] text-[var(--text-muted)] ml-auto">
                    {items.length}
                  </span>
                </div>
                {/* Total financier */}
                {columnTotal > 0 && (() => {
                  const isEstimated = column.id === 'to_quote';
                  const totalColor = isEstimated ? 'var(--accent-violet)' : '#22c55e';
                  return (
                    <div className="mt-1 flex items-baseline gap-1">
                      <span className="text-base font-bold" style={{ color: totalColor }}>
                        {columnTotal.toLocaleString('fr-FR')}
                      </span>
                      <span className="text-[10px]" style={{ color: totalColor, opacity: 0.7 }}>
                        €{isEstimated ? ' estimé' : ''}
                      </span>
                    </div>
                  );
                })()}
                {/* Message de blocage */}
                {blockReason && (
                  <p className="text-[10px] text-red-400 mt-1 leading-tight">
                    {blockReason}
                  </p>
                )}
              </div>

              {/* Column content */}
              <div className={`flex-1 overflow-y-auto p-2 ${isCompleted ? 'space-y-2' : 'space-y-3'}`}>
                {items.length === 0 ? (
                  <div className="text-center py-8 text-[var(--text-muted)] text-xs">
                    Aucun produit
                  </div>
                ) : (() => {
                  // --- Groupement par client (projets + orphelins ensemble) ---
                  type ProjGroup = { project: Project; items: Deliverable[] };
                  type ClientGroup = { clientId: string; clientName: string; projectGroups: ProjGroup[]; orphanItems: Deliverable[] };
                  const clientGroupMap = new Map<string, ClientGroup>();
                  const clientGroupList: ClientGroup[] = [];

                  items.forEach(d => {
                    const cid = d.clientId || '__none__';
                    if (!clientGroupMap.has(cid)) {
                      const client = d.clientId ? getClientById(d.clientId) : null;
                      const cg: ClientGroup = { clientId: cid, clientName: client?.name || 'Sans client', projectGroups: [], orphanItems: [] };
                      clientGroupMap.set(cid, cg);
                      clientGroupList.push(cg);
                    }
                    const cg = clientGroupMap.get(cid)!;
                    if (d.projectId) {
                      const proj = projects.find(p => p.id === d.projectId);
                      if (proj) {
                        let pg = cg.projectGroups.find(pg => pg.project.id === d.projectId);
                        if (!pg) {
                          pg = { project: proj, items: [] };
                          cg.projectGroups.push(pg);
                        }
                        pg.items.push(d);
                        return;
                      }
                    }
                    cg.orphanItems.push(d);
                  });

                  return clientGroupList.map((cg, cgIdx) => (
                    <div key={cg.clientId}>
                      <ClientHeader name={cg.clientName} isFirst={cgIdx === 0} />
                      {cg.projectGroups.map(pg => {
                        const isCollapsed = collapsedProjects.has(pg.project.id);
                        return (
                          <div key={pg.project.id} className="mb-1.5">
                            <ProjectBandeau
                              project={pg.project}
                              deliverables={deliverables.filter(d => d.projectId === pg.project.id)}
                              onClick={() => navigateToClient(pg.project.clientId, pg.project.id)}
                              isCollapsed={isCollapsed}
                              onToggleCollapse={() => toggleProject(pg.project.id)}
                            />
                            {!isCollapsed && pg.items.map((d, idx) => (
                              <ProductionCard
                                key={d.id}
                                deliverable={d}
                                onClick={() => navigateToClient(pg.project.clientId, pg.project.id)}
                                onDragStart={handleDragStart}
                                isCompact={isCompleted}
                                isGrouped={pg.items.length > 1}
                                isFirst={false}
                                isLast={idx === pg.items.length - 1}
                                inProject={true}
                              />
                            ))}
                          </div>
                        );
                      })}
                      {cg.orphanItems.length > 0 && (
                        <div className={cg.projectGroups.length > 0 ? 'mt-1.5' : ''}>
                          {cg.orphanItems.map((d, idx) => (
                            <ProductionCard
                              key={d.id}
                              deliverable={d}
                              onClick={() => {
                                const cid = d.clientId || (d.projectId ? projects.find(p => p.id === d.projectId)?.clientId : undefined);
                                if (cid) navigateToClient(cid, d.projectId ?? '__divers__');
                                else openDeliverableModal(undefined, d);
                              }}
                              onDragStart={handleDragStart}
                              isCompact={isCompleted}
                              isGrouped={cg.orphanItems.length > 1}
                              isFirst={idx === 0}
                              isLast={idx === cg.orphanItems.length - 1}
                              inProject={false}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  ));
                })()}
              </div>
            </div>
          );
        })}
      </div>

      {/* Toast notification */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-lg bg-[var(--bg-secondary)] border border-red-500/40 shadow-lg shadow-red-500/10 animate-fade-in-up">
          <span className="text-sm text-[var(--text-primary)]">{toast}</span>
        </div>
      )}

    </div>
  );
}

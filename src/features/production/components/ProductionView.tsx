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
  clientName: string;
  assigneeColor?: string;
  assigneeInitials?: string;
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
  clientName, 
  assigneeColor, 
  assigneeInitials, 
  onClick,
  onDragStart,
  isCompact = false,
  isGrouped = false,
  isFirst = true,
  isLast = true,
  inProject = false,
}: ProductionCardProps) {

  if (isCompact) {
    const compactRounded = isFirst && isLast 
      ? 'rounded' 
      : isFirst ? 'rounded-t rounded-b-none' 
      : isLast ? 'rounded-b rounded-t-none' 
      : 'rounded-none';

    return (
      <div
        draggable
        onDragStart={(e) => onDragStart(e, deliverable)}
        onClick={onClick}
        className={`flex items-center gap-2 px-2 py-1 bg-[var(--bg-tertiary)]/50 hover:bg-[var(--bg-tertiary)] cursor-pointer transition-colors text-[10px] group ${compactRounded} ${
          !isFirst ? '-mt-px' : ''
        }`}
      >
        {isFirst ? (
          <span className="truncate text-[var(--text-muted)]/60 max-w-[60px] flex-shrink-0 font-semibold">
            {clientName}
          </span>
        ) : (
          <span className="w-[60px] flex-shrink-0" />
        )}
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
      onDragStart={(e) => onDragStart(e, deliverable)}
      onClick={onClick}
      className={`py-2 bg-[var(--bg-secondary)] border border-[var(--border-subtle)] hover:border-[var(--accent-cyan)]/50 cursor-pointer transition-all hover:shadow-md group ${roundedClass} ${
        !isFirst ? '-mt-px' : ''
      } ${inProject ? 'pl-4 pr-2.5' : 'px-2.5'}`}
    >
      {/* Client — affiché seulement si premier du groupe et pas dans un projet */}
      {isFirst && !inProject && clientName && (
        <div className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider truncate mb-0.5">
          {clientName}
        </div>
      )}
      
      {/* Ligne produit : nom + prix + assigné */}
      <div className="flex items-center gap-2">
        <span className="text-[13px] font-medium text-[var(--text-primary)] truncate flex-1 group-hover:text-[var(--accent-cyan)]">
          {deliverable.name}
        </span>
        
        {deliverable.prixFacturé != null && deliverable.prixFacturé > 0 && (
          <span className="text-[11px] font-semibold text-[#22c55e] flex-shrink-0">
            {deliverable.prixFacturé.toLocaleString('fr-FR')} €
          </span>
        )}
        
        {assigneeColor && (
          inProject ? (
            <div
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: assigneeColor }}
            />
          ) : assigneeInitials ? (
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0"
              style={{ backgroundColor: assigneeColor }}
            >
              {assigneeInitials}
            </div>
          ) : null
        )}
      </div>
    </div>
  );
}

interface ProjectBandeauProps {
  project: Project;
  deliverables: Deliverable[];
  clientName: string;
  onClick: () => void;
}

function ProjectBandeau({ project, deliverables, clientName, onClick }: ProjectBandeauProps) {
  const billing = computeProjectBilling(project, deliverables);
  const colors = PROJECT_BILLING_COLORS[billing.status];
  const hasQuote = project.quoteAmount && project.quoteAmount > 0;
  const pct = hasQuote ? Math.min(100, billing.progressPercent) : 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-t-xl bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] border-b-0 text-left cursor-pointer hover:bg-[var(--bg-tertiary)]/80 transition-colors overflow-hidden"
    >
      <div className="px-3 pt-2.5 pb-2 space-y-1.5">
        {/* Ligne 1 : Client (en premier, le plus important) */}
        <div className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider truncate">
          {clientName}
        </div>

        {/* Ligne 2 : Icône dossier + nom projet + badge + montants */}
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
        </div>
      </div>

      {/* Barre de progression fine en bas du bandeau */}
      {hasQuote && (
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

export function ProductionView() {
  const { deliverables, projects, getClientById, getTeamMemberById, updateDeliverable, filters } = useAppStore();

  const getProjectQuoteForDeliverable = useCallback((d: Deliverable) => {
    if (!d.projectId) return undefined;
    const project = projects.find((p) => p.id === d.projectId);
    return project?.quoteAmount ?? undefined;
  }, [projects]);
  const { openDeliverableModal } = useModal();
  const [draggedItem, setDraggedItem] = useState<Deliverable | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<DeliverableStatus | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const groupByProject = true;

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
                  if (groupByProject) {
                    // --- Groupement par projet ---
                    type PGroup = { type: 'project'; project: Project; clientName: string; items: Deliverable[] };
                    type OGroup = { type: 'orphan'; clientId: string; clientName: string; items: Deliverable[] };
                    const projectGroups: (PGroup | OGroup)[] = [];
                    const projectMap = new Map<string, PGroup>();
                    const orphanMap = new Map<string, OGroup>();

                    items.forEach(d => {
                      if (d.projectId) {
                        const proj = projects.find(p => p.id === d.projectId);
                        if (proj) {
                          if (!projectMap.has(proj.id)) {
                            const client = getClientById(proj.clientId);
                            const grp: PGroup = { type: 'project', project: proj, clientName: client?.name || 'Sans client', items: [] };
                            projectMap.set(proj.id, grp);
                            projectGroups.push(grp);
                          }
                          projectMap.get(proj.id)!.items.push(d);
                          return;
                        }
                      }
                      const cid = d.clientId || '__none__';
                      if (!orphanMap.has(cid)) {
                        const client = d.clientId ? getClientById(d.clientId) : null;
                        const grp: OGroup = { type: 'orphan', clientId: cid, clientName: client?.name || 'Sans client', items: [] };
                        orphanMap.set(cid, grp);
                        projectGroups.push(grp);
                      }
                      orphanMap.get(cid)!.items.push(d);
                    });

                    return projectGroups.map(group => {
                      const key = group.type === 'project' ? `proj-${group.project.id}` : `client-${group.clientId}`;
                      return (
                        <div key={key}>
                          {group.type === 'project' && (
                            <ProjectBandeau
                              project={group.project}
                              deliverables={deliverables.filter(d => d.projectId === group.project.id)}
                              clientName={group.clientName}
                              onClick={() => openProjectModal(undefined, group.project, 'billing')}
                            />
                          )}
                          {group.items.map((d, idx) => {
                            const assignee = d.assigneeId ? getTeamMemberById(d.assigneeId) : null;
                            const isInProject = group.type === 'project';
                            return (
                              <ProductionCard
                                key={d.id}
                                deliverable={d}
                                clientName={isInProject ? '' : group.clientName}
                                assigneeColor={assignee?.color}
                                assigneeInitials={assignee?.initials}
                                onClick={() => openDeliverableModal(d.clientId, d)}
                                onDragStart={handleDragStart}
                                isCompact={isCompleted}
                                isGrouped={group.items.length > 1}
                                isFirst={isInProject ? false : idx === 0}
                                isLast={idx === group.items.length - 1}
                                inProject={isInProject}
                              />
                            );
                          })}
                        </div>
                      );
                    });
                  }

                  // --- Groupement par client (défaut) ---
                  const groups: { clientId: string; clientName: string; items: Deliverable[] }[] = [];
                  const seen = new Map<string, number>();
                  items.forEach(d => {
                    const cid = d.clientId || '__none__';
                    if (seen.has(cid)) {
                      groups[seen.get(cid)!].items.push(d);
                    } else {
                      seen.set(cid, groups.length);
                      const client = d.clientId ? getClientById(d.clientId) : null;
                      groups.push({ clientId: cid, clientName: client?.name || 'Sans client', items: [d] });
                    }
                  });

                  return groups.map(group => (
                    <div key={group.clientId}>
                      {group.items.map((d, idx) => {
                        const assignee = d.assigneeId ? getTeamMemberById(d.assigneeId) : null;
                        return (
                          <ProductionCard
                            key={d.id}
                            deliverable={d}
                            clientName={group.clientName}
                            assigneeColor={assignee?.color}
                            assigneeInitials={assignee?.initials}
                            onClick={() => openDeliverableModal(d.clientId, d)}
                            onDragStart={handleDragStart}
                            isCompact={isCompleted}
                            isGrouped={group.items.length > 1}
                            isFirst={idx === 0}
                            isLast={idx === group.items.length - 1}
                          />
                        );
                      })}
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

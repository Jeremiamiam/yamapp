'use client';

import { useMemo, useState, useCallback } from 'react';
import { useAppStore } from '@/lib/store';
import { useModal } from '@/hooks';
import { Deliverable, DeliverableStatus } from '@/types';
import { canTransitionStatus } from '@/lib/production-rules';
import { ProductionRulesTest } from './ProductionRulesTest';

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
  isGrouped?: boolean; // fait partie d'un groupe client (pas le premier)
  isFirst?: boolean;   // premier du groupe
  isLast?: boolean;    // dernier du groupe
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
      className={`px-2.5 py-2 bg-[var(--bg-secondary)] border border-[var(--border-subtle)] hover:border-[var(--accent-cyan)]/50 cursor-pointer transition-all hover:shadow-md group ${roundedClass} ${
        !isFirst ? '-mt-px' : ''
      }`}
    >
      {/* Client — affiché seulement si premier du groupe */}
      {isFirst && (
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
        
        {assigneeInitials && (
          <div
            className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0"
            style={{ backgroundColor: assigneeColor }}
          >
            {assigneeInitials}
          </div>
        )}
      </div>
    </div>
  );
}

export function ProductionView() {
  const { deliverables, getClientById, getTeamMemberById, updateDeliverable, filters } = useAppStore();
  const { openDeliverableModal } = useModal();
  const [draggedItem, setDraggedItem] = useState<Deliverable | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<DeliverableStatus | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [showTests, setShowTests] = useState(false);

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
      if (grouped[d.status]) {
        grouped[d.status].push(d);
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
      // Vérifier les règles métier
      const result = canTransitionStatus({
        status: draggedItem.status,
        billingStatus: draggedItem.billingStatus,
        prixFacturé: draggedItem.prixFacturé,
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
    <div className="flex-1 flex flex-col overflow-hidden p-4 md:p-6">
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
        {/* Proto: toggle tests */}
        <button
          type="button"
          onClick={() => setShowTests(!showTests)}
          title="Tests des règles métier"
          className={`w-5 h-5 rounded text-[9px] font-bold transition-all cursor-pointer ${
            showTests
              ? 'bg-[var(--accent-coral)] text-white'
              : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-[var(--accent-coral)]'
          }`}
        >
          T
        </button>
      </div>

      {/* Panel de tests (proto) */}
      {showTests && (
        <div className="flex-shrink-0 mb-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)]/50 overflow-y-auto max-h-[50vh]">
          <ProductionRulesTest />
        </div>
      )}

      {/* Kanban board */}
      <div className="flex-1 flex gap-4 overflow-x-auto pb-4">
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
              className={`flex-shrink-0 flex flex-col rounded-xl bg-[var(--bg-secondary)]/30 border transition-all ${
                isDragOver 
                  ? isDropBlocked
                    ? 'border-red-500/60 bg-red-500/5'
                    : 'border-[var(--accent-cyan)] bg-[var(--accent-cyan)]/5' 
                  : 'border-[var(--border-subtle)]'
              }`}
              style={{ width: isCompleted ? 200 : 260 }}
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

              {/* Column content — groupé par client (toutes colonnes) */}
              <div className={`flex-1 overflow-y-auto p-2 ${isCompleted ? 'space-y-2' : 'space-y-3'}`}>
                {items.length === 0 ? (
                  <div className="text-center py-8 text-[var(--text-muted)] text-xs">
                    Aucun produit
                  </div>
                ) : (() => {
                  // Grouper par clientId
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

'use client';

import { useAppStore } from '@/lib/store';
import { useClient, useModal } from '@/hooks';
import { formatDateShort } from '@/lib/date-utils';
import { getStatusStyle, getCategoryStyle } from '@/lib/styles';
import type { DeliverableCategory } from '@/types';

const Package = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/>
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
    <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
    <line x1="12" y1="22.08" x2="12" y2="12"/>
  </svg>
);

const Plus = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const formatEur = (n?: number) =>
  n != null ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n) : null;

interface DeliverablesSectionProps {
  clientId: string;
}

export function DeliverablesSection({ clientId }: DeliverablesSectionProps) {
  const { getDeliverablesByClientId, getTeamMemberById } = useAppStore();
  const client = useClient(clientId);
  const { openDeliverableModal } = useModal();
  const deliverables = client ? getDeliverablesByClientId(client.id) : [];

  if (!client) return null;

  const sortedDeliverables = [...deliverables].sort((a, b) => {
    if (a.dueDate == null && b.dueDate == null) return 0;
    if (a.dueDate == null) return 1;
    if (b.dueDate == null) return -1;
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  return (
    <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-subtle)] overflow-hidden">
      <div className="px-5 py-4 border-b border-[var(--border-subtle)] flex items-center gap-2">
        <Package />
        <h2 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider">
          Livrables
        </h2>
        <span className="text-xs text-[var(--text-muted)] bg-[var(--bg-tertiary)] px-2 py-0.5 rounded-full">
          {deliverables.length}
        </span>
        <button
          onClick={() => openDeliverableModal(clientId)}
          className="ml-auto p-1.5 rounded-lg bg-[var(--accent-violet)]/10 text-[var(--accent-violet)] hover:bg-[var(--accent-violet)]/20 transition-colors"
          title="Ajouter un livrable"
        >
          <Plus />
        </button>
      </div>
      <div className="divide-y divide-[var(--border-subtle)]">
        {sortedDeliverables.length === 0 ? (
          <button
            onClick={() => openDeliverableModal(clientId)}
            className="w-full px-5 py-8 text-center text-[var(--text-muted)] text-sm hover:bg-[var(--bg-secondary)] hover:text-[var(--accent-violet)] transition-colors"
          >
            + Ajouter un livrable
          </button>
        ) : (
          sortedDeliverables.map((d, index) => {
            const statusStyle = getStatusStyle(d.status);
            const categoryStyle = getCategoryStyle(d.category ?? 'other');
            const assignee = d.assigneeId ? getTeamMemberById(d.assigneeId) : null;
            const hasPrix = (d.prixFacturé != null && d.prixFacturé > 0) || (d.coutSousTraitance != null && d.coutSousTraitance > 0);
            return (
              <div
                key={d.id}
                className="px-5 py-4 hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer animate-fade-in-up"
                style={{ animationDelay: `${index * 0.05}s` }}
                onClick={() => openDeliverableModal(clientId, d)}
              >
                <div className="flex items-start gap-2 mb-1.5">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${categoryStyle.bg} ${categoryStyle.text}`}>
                    {categoryStyle.label}
                  </span>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${statusStyle.bg} ${statusStyle.text}`}>
                    {statusStyle.label}
                  </span>
                </div>
                <p className="font-medium text-[var(--text-primary)] text-sm">
                  {d.name}
                </p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-[var(--text-muted)]">
                  <span>{d.dueDate != null ? formatDateShort(d.dueDate) : 'Non planifié'}</span>
                  {d.prixFacturé != null && d.prixFacturé > 0 && (
                    <span className="text-[#22c55e]" title="Prix facturé">{formatEur(d.prixFacturé)}</span>
                  )}
                  {d.coutSousTraitance != null && d.coutSousTraitance > 0 && (
                    <span className="text-[#ef4444]" title="Sous-traitance">− {formatEur(d.coutSousTraitance)}</span>
                  )}
                  {!hasPrix && d.cost != null && <span className="text-[var(--accent-lime)]">{formatEur(d.cost)}</span>}
                  {d.deliveredAt != null && (
                    <span className="text-[var(--accent-lime)]">Livré le {formatDateShort(d.deliveredAt)}</span>
                  )}
                  {d.externalContractor != null && d.externalContractor !== '' && (
                    <span>Prestataire: {d.externalContractor}</span>
                  )}
                  {assignee != null && <span>{assignee.name}</span>}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

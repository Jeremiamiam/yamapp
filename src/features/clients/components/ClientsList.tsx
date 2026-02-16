'use client';

import { useMemo } from 'react';
import { useAppStore } from '@/lib/store';
import { useModal } from '@/hooks';
import { Client } from '@/types';

// Icons
const Plus = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5v14M5 12h14"/>
  </svg>
);

const MoreVertical = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="1"/>
    <circle cx="12" cy="5" r="1"/>
    <circle cx="12" cy="19" r="1"/>
  </svg>
);

export function ClientsList() {
  const { clients, deliverables, calls, filters, navigateToClient, openModal } = useAppStore();
  const { openClientModal } = useModal();

  const { clientsColumn, prospectsColumn } = useMemo(() => {
    const filtered = clients.filter(c => {
      if (filters.clientStatus !== 'all' && c.status !== filters.clientStatus) return false;
      if (filters.teamMemberId) {
        const hasDeliverables = deliverables.some(d => d.clientId === c.id && d.assigneeId === filters.teamMemberId);
        const hasCalls = calls.some(call => call.clientId === c.id && call.assigneeId === filters.teamMemberId);
        if (!hasDeliverables && !hasCalls) return false;
      }
      return true;
    });
    const sorted = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
    return {
      clientsColumn: sorted.filter(c => c.status === 'client'),
      prospectsColumn: sorted.filter(c => c.status === 'prospect'),
    };
  }, [clients, deliverables, calls, filters]);

  const getClientTotals = (clientId: string) => {
    const clientDeliverables = deliverables.filter(d => d.clientId === clientId);

    const totalFacture = clientDeliverables
      .filter(d => d.billingStatus === 'balance' && !d.isPotentiel)
      .reduce((sum, d) => sum + (d.totalInvoiced || d.prixFacturé || 0), 0);

    const totalPotentiel = clientDeliverables
      .filter(d => d.isPotentiel)
      .reduce((sum, d) => sum + (d.totalInvoiced || d.prixFacturé || 0), 0);

    return { totalFacture, totalPotentiel };
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  function renderCard(client: Client) {
    const { totalFacture, totalPotentiel } = getClientTotals(client.id);
    const hasAmounts = totalFacture > 0 || totalPotentiel > 0;

    return (
      <div
        key={client.id}
        onClick={() => navigateToClient(client.id)}
        className="group bg-[var(--bg-card)] rounded-lg border border-[var(--border-subtle)] hover:border-[var(--accent-cyan)] hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden"
      >
        <div className="p-4 flex items-center justify-between gap-3">
          <h3 className="font-display font-semibold text-base text-[var(--text-primary)] group-hover:text-[var(--accent-cyan)] transition-colors truncate flex-1">
            {client.name}
          </h3>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              openModal({ type: 'client', mode: 'edit', client });
            }}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
            title="Modifier"
          >
            <MoreVertical />
          </button>
        </div>

        {/* Montants */}
        {hasAmounts && (
          <div className="px-4 pb-3 flex items-center gap-4 text-xs">
            {totalFacture > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="text-[var(--text-muted)]">Facturé:</span>
                <span className="font-semibold text-[var(--accent-lime)]">{formatAmount(totalFacture)}</span>
              </div>
            )}
            {totalPotentiel > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="text-[var(--text-muted)]">Potentiel:</span>
                <span className="font-semibold text-[var(--accent-amber)]">{formatAmount(totalPotentiel)}</span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8">
      {/* Header avec bouton d'ajout */}
      <div className="max-w-6xl mx-auto mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-[var(--text-primary)] mb-1">Clients & Prospects</h1>
          <p className="text-sm text-[var(--text-muted)]">
            {clientsColumn.length} client{clientsColumn.length > 1 ? 's' : ''} • {prospectsColumn.length} prospect{prospectsColumn.length > 1 ? 's' : ''}
          </p>
        </div>
        <button
          type="button"
          onClick={() => openClientModal()}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--accent-cyan)] text-[var(--bg-primary)] font-medium hover:scale-105 active:scale-95 transition-transform shadow-lg"
        >
          <Plus />
          <span>Nouveau client</span>
        </button>
      </div>

      {/* Colonnes */}
      <div className="flex flex-col lg:flex-row max-w-6xl mx-auto gap-0">
        {/* Colonne gauche : Clients */}
        <div className="flex-1 flex flex-col gap-4 lg:pr-8 lg:border-r-2 border-[var(--border-subtle)]">
          <h2 className="text-lg font-bold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--accent-cyan)]" />
            Clients
            <span className="text-sm font-normal normal-case text-[var(--text-muted)]">({clientsColumn.length})</span>
          </h2>
          <div className="flex flex-col gap-4">
            {clientsColumn.map(renderCard)}
          </div>
        </div>

        {/* Colonne droite : Prospects */}
        <div className="flex-1 flex flex-col gap-4 lg:pl-8 mt-8 lg:mt-0">
          <h2 className="text-lg font-bold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--accent-amber)]" />
            Prospects
            <span className="text-sm font-normal normal-case text-[var(--text-muted)]">({prospectsColumn.length})</span>
          </h2>
          <div className="flex flex-col gap-4">
            {prospectsColumn.map(renderCard)}
          </div>
        </div>
      </div>
    </div>
  );
}

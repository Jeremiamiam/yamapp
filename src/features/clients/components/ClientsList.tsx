'use client';

import { useMemo } from 'react';
import { useAppStore } from '@/lib/store';
import { useModal } from '@/hooks';
import { Client } from '@/types';

// Icons
const Plus = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5v14M5 12h14"/>
  </svg>
);

const MoreVertical = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

    // Rentrées = deliverables where billing has progressed (acompte/avancement/solde)
    const totalFacture = clientDeliverables
      .filter(d => d.billingStatus !== 'pending')
      .reduce((sum, d) => sum + (d.totalInvoiced || d.prixFacturé || 0), 0);

    // Marge potentielle Yam = margePotentielle from deliverables with no billing progress
    const totalMargePotentielle = clientDeliverables
      .filter(d => d.billingStatus === 'pending' && (d.margePotentielle ?? 0) > 0)
      .reduce((sum, d) => sum + (d.margePotentielle ?? 0), 0);

    return { totalFacture, totalPotentiel: totalMargePotentielle };
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

    return (
      <div
        key={client.id}
        onClick={() => navigateToClient(client.id)}
        className="group bg-[var(--bg-card)] rounded-md border border-[var(--border-subtle)] hover:border-[var(--accent-cyan)] hover:shadow-sm transition-all duration-150 cursor-pointer overflow-hidden"
      >
        <div className="px-3 py-2 flex items-center gap-2">
          {/* Nom du client */}
          <h3 className="font-display font-medium text-sm text-[var(--text-primary)] group-hover:text-[var(--accent-cyan)] transition-colors truncate flex-1 min-w-0">
            {client.name}
          </h3>

          {/* Montants - même ligne */}
          <div className="flex items-center gap-2 flex-shrink-0 text-[11px]">
            {totalFacture > 0 && (
              <span className="font-semibold text-[var(--accent-lime)]">{formatAmount(totalFacture)}</span>
            )}
            {totalPotentiel > 0 && (
              <span className="font-semibold text-[var(--accent-violet)]">{formatAmount(totalPotentiel)}</span>
            )}
          </div>

          {/* Bouton edit */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              openModal({ type: 'client', mode: 'edit', client });
            }}
            className="p-1 rounded text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
            title="Modifier"
          >
            <MoreVertical />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6">
      {/* Header avec bouton d'ajout */}
      <div className="max-w-6xl mx-auto mb-4 flex items-center justify-between">
        <h1 className="text-lg font-display font-bold text-[var(--text-primary)]">Clients & Prospects</h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => openClientModal('client')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--accent-cyan)] text-[var(--bg-primary)] text-sm font-medium hover:scale-105 active:scale-95 transition-transform shadow-md"
          >
            <Plus />
            <span>Client</span>
          </button>
          <button
            type="button"
            onClick={() => openClientModal('prospect')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-500 text-amber-500 text-sm font-medium hover:bg-amber-500/10 hover:scale-105 active:scale-95 transition-all"
          >
            <Plus />
            <span>Prospect</span>
          </button>
        </div>
      </div>

      {/* Colonnes */}
      <div className="flex flex-col lg:flex-row max-w-6xl mx-auto gap-0">
        {/* Colonne gauche : Clients */}
        <div className="flex-1 flex flex-col gap-2 lg:pr-6 lg:border-r border-[var(--border-subtle)]">
          <h2 className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-2 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-cyan)]" />
            Clients
            <span className="font-normal text-[var(--text-muted)]/60">({clientsColumn.length})</span>
          </h2>
          <div className="flex flex-col gap-1.5">
            {clientsColumn.map(renderCard)}
          </div>
        </div>

        {/* Colonne droite : Prospects */}
        <div className="flex-1 flex flex-col gap-2 lg:pl-6 mt-6 lg:mt-0">
          <h2 className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-2 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-amber)]" />
            Prospects
            <span className="font-normal text-[var(--text-muted)]/60">({prospectsColumn.length})</span>
          </h2>
          <div className="flex flex-col gap-1.5">
            {prospectsColumn.map(renderCard)}
          </div>
        </div>
      </div>
    </div>
  );
}

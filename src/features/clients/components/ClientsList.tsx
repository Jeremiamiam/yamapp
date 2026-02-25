'use client';

import { useMemo, useState } from 'react';
import { useAppStore } from '@/lib/store';
import { useModal } from '@/hooks';
import { toast } from '@/lib/toast';
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
  const { clients, deliverables, projects, calls, filters, navigateToClient, openModal, updateProject } = useAppStore();
  const { openClientModal } = useModal();
  const [draggingClientId, setDraggingClientId] = useState<string | null>(null);
  const [isOverClientsColumn, setIsOverClientsColumn] = useState(false);

  const getClientTotals = useMemo(() => {
    return (clientId: string) => {
      const clientDeliverables = deliverables.filter(d => d.clientId === clientId);
      const clientProjects = projects.filter(p => p.clientId === clientId);

      // Rentrées = deliverables where billing has progressed (acompte/avancement/solde)
      const totalFacture = clientDeliverables
        .filter(d => d.billingStatus !== 'pending')
        .reduce((sum, d) => sum + (d.totalInvoiced || d.prixFacturé || 0), 0);

      // Potentiel = margePotentielle (deliverables) + potentiel des projets inactifs
      const margePotentielleDeliv = clientDeliverables
        .filter(d => d.billingStatus === 'pending' && (d.margePotentielle ?? 0) > 0)
        .reduce((sum, d) => sum + (d.margePotentielle ?? 0), 0);
      const potentielProjetsInactifs = clientProjects
        .filter(p => p.isActive === false && (p.potentiel ?? 0) > 0)
        .reduce((sum, p) => sum + (p.potentiel ?? 0), 0);
      const potentielProjetsSansDevis = clientProjects
        .filter(p => p.isActive !== false && (!p.quoteAmount || p.quoteAmount <= 0) && (p.potentiel ?? 0) > 0)
        .reduce((sum, p) => sum + (p.potentiel ?? 0), 0);
      const totalPotentiel = margePotentielleDeliv + potentielProjetsInactifs + potentielProjetsSansDevis;

      // Inactif = pipeline (pas client) — 0€ ou 10M€, toujours dans Potentiel
      const hasInactiveProject = clientProjects.some(p => p.isActive === false);

      return { totalFacture, totalPotentiel, hasInactiveProject };
    };
  }, [deliverables, projects]);

  const { clientsColumn, potentielColumn, totalClients, totalPotentiel } = useMemo(() => {
    const filtered = clients.filter(c => {
      if (filters.teamMemberId) {
        const hasDeliverables = deliverables.some(d => d.clientId === c.id && d.assigneeId === filters.teamMemberId);
        const hasCalls = calls.some(call => call.clientId === c.id && call.assigneeId === filters.teamMemberId);
        if (!hasDeliverables && !hasCalls) return false;
      }
      return true;
    });
    const sorted = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
    const getTotals = (cid: string) => getClientTotals(cid);
    const clientsCol = sorted.filter(c => {
      const t = getTotals(c.id);
      return t.totalFacture > 0 || !t.hasInactiveProject;
    });
    const potentielCol = sorted.filter(c => getTotals(c.id).hasInactiveProject);
    const totalC = clientsCol.reduce((sum, c) => sum + getTotals(c.id).totalFacture, 0);
    const totalP = potentielCol.reduce((sum, c) => sum + getTotals(c.id).totalPotentiel, 0);
    return {
      clientsColumn: clientsCol,
      potentielColumn: potentielCol,
      totalClients: totalC,
      totalPotentiel: totalP,
    };
  }, [clients, deliverables, projects, calls, filters, getClientTotals]);

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const activateInactiveProjects = (clientId: string) => {
    const inactiveProjects = projects.filter(p => p.clientId === clientId && p.isActive === false);
    inactiveProjects.forEach(p => updateProject(p.id, { isActive: true }));
    if (inactiveProjects.length > 0) {
      toast.success(inactiveProjects.length === 1 ? 'Projet activé' : `${inactiveProjects.length} projets activés`);
    }
  };

  function renderCard(client: Client, options?: { column: 'clients' | 'potentiel'; draggable?: boolean }) {
    const { totalFacture, totalPotentiel, hasInactiveProject } = getClientTotals(client.id);
    const canDrag = options?.draggable && hasInactiveProject;
    const isDragging = draggingClientId === client.id;
    const inClientsColumn = options?.column === 'clients';

    return (
      <div
        key={client.id}
        draggable={canDrag}
        onDragStart={canDrag ? (e) => {
          setDraggingClientId(client.id);
          e.dataTransfer.setData('text/plain', client.id);
          e.dataTransfer.effectAllowed = 'move';
        } : undefined}
        onDragEnd={canDrag ? () => setDraggingClientId(null) : undefined}
        onClick={() => navigateToClient(client.id)}
        className={`group bg-[var(--bg-card)] rounded-md border border-[var(--border-subtle)] hover:border-[var(--accent-cyan)] hover:shadow-sm transition-all duration-150 overflow-hidden
          ${canDrag ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}
          ${isDragging ? 'opacity-40' : ''}`}
      >
        <div className="px-3 py-2 flex items-center gap-2">
          {/* Nom du client */}
          <h3 className="font-display font-medium text-sm text-[var(--text-primary)] group-hover:text-[var(--accent-cyan)] transition-colors truncate flex-1 min-w-0">
            {client.name}
          </h3>

          {/* Montants : selon la colonne, on n'affiche que le montant pertinent */}
          <div className="flex items-center gap-2 flex-shrink-0 text-[11px]">
            {inClientsColumn && totalFacture > 0 && (
              <span className="font-semibold text-[var(--accent-lime)]">{formatAmount(totalFacture)}</span>
            )}
            {!inClientsColumn && totalPotentiel > 0 && (
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
        <h1 className="text-lg font-display font-bold text-[var(--text-primary)]">Clients</h1>
        <button
          type="button"
          onClick={() => openClientModal()}
          className="flex items-center justify-center w-9 h-9 rounded-lg bg-[var(--accent-cyan)] text-[var(--bg-primary)] text-sm font-medium hover:scale-105 active:scale-95 transition-transform shadow-md"
          title="Ajouter un client"
        >
          <Plus />
        </button>
      </div>

      {/* Colonnes */}
      <div className="flex flex-col lg:flex-row max-w-6xl mx-auto gap-0">
        {/* Colonne gauche : Clients (drop zone pour activer un potentiel) */}
        <div
          className={`flex-1 flex flex-col gap-2 lg:pr-6 lg:border-r transition-colors ${
            isOverClientsColumn && draggingClientId ? 'border-[var(--accent-cyan)] bg-[var(--accent-cyan)]/5 rounded-lg' : 'border-[var(--border-subtle)]'
          }`}
          onDragOver={draggingClientId ? (e) => { e.preventDefault(); setIsOverClientsColumn(true); } : undefined}
          onDragLeave={draggingClientId ? () => setIsOverClientsColumn(false) : undefined}
          onDrop={draggingClientId ? (e) => {
            e.preventDefault();
            setIsOverClientsColumn(false);
            const clientId = e.dataTransfer.getData('text/plain');
            if (clientId) activateInactiveProjects(clientId);
            setDraggingClientId(null);
          } : undefined}
        >
          <h2 className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-2 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-cyan)]" />
            Clients
            <span className="font-normal text-[var(--text-muted)]/60">({clientsColumn.length})</span>
            {totalClients > 0 && (
              <span className="ml-auto font-semibold text-[var(--accent-lime)]">{formatAmount(totalClients)}</span>
            )}
          </h2>
          <div className="flex flex-col gap-1.5 min-h-[120px]">
            {clientsColumn.map(c => renderCard(c, { column: 'clients' }))}
          </div>
          {isOverClientsColumn && draggingClientId && (
            <p className="text-xs text-[var(--accent-cyan)] mt-2">Relâchez pour activer le projet</p>
          )}
        </div>

        {/* Colonne droite : Potentiel (draggable vers Clients pour activer) */}
        <div className="flex-1 flex flex-col gap-2 lg:pl-6 mt-6 lg:mt-0">
          <h2 className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-2 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-violet)]" />
            Potentiel
            <span className="font-normal text-[var(--text-muted)]/60">({potentielColumn.length})</span>
            {totalPotentiel > 0 && (
              <span className="ml-auto font-semibold text-[var(--accent-violet)]">{formatAmount(totalPotentiel)}</span>
            )}
          </h2>
          <div className="flex flex-col gap-1.5 min-h-[120px]">
            {potentielColumn.map(c => renderCard(c, { column: 'potentiel', draggable: true }))}
          </div>
          <p className="text-[10px] text-[var(--text-muted)] mt-2">
            Glisser vers Clients pour activer les projets inactifs
          </p>
        </div>
      </div>
    </div>
  );
}

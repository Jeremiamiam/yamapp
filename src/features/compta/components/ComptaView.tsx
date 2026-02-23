'use client';

import React, { useMemo, useState } from 'react';
import { useAppStore } from '@/lib/store';
import { useModal } from '@/hooks';
import { useUserRole } from '@/hooks/useUserRole';
import type { Deliverable, BillingStatus } from '@/types';
import { YearSelector } from './YearSelector';

const formatEur = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);

const BILLING_STATUS_CONFIG: Record<BillingStatus, { label: string; color: string; bgColor: string }> = {
  'pending': { label: 'En attente', color: 'var(--text-muted)', bgColor: 'var(--bg-tertiary)' },
  'deposit': { label: 'Acompte', color: 'var(--accent-cyan)', bgColor: 'var(--accent-cyan)/10' },
  'progress': { label: 'Avancement', color: 'var(--accent-lime)', bgColor: 'var(--accent-lime)/10' },
  'balance': { label: 'Soldé', color: '#22c55e', bgColor: '#22c55e/10' },
};

const BillingStatusChip = ({ status }: { status: BillingStatus }) => {
  const config = BILLING_STATUS_CONFIG[status];

  // Fallback for old or undefined status values
  if (!config) {
    return (
      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-[var(--bg-tertiary)] text-[var(--text-muted)]">
        {status || 'N/A'}
      </span>
    );
  }

  return (
    <span
      className="text-xs px-2 py-0.5 rounded-full font-medium"
      style={{ color: config.color, backgroundColor: config.bgColor }}
    >
      {config.label}
    </span>
  );
};

type FilterMode = 'all' | 'with-validated' | 'with-potential';

type ClientTableRow = {
  clientId: string;
  clientName: string;
  isProspect: boolean;
  rentreesValidees: number;
  sousTraitance: number;
  margeNette: number;
  margePotentielleYam: number;
  totalGlobal: number;
  billedDeliverables: Deliverable[];
  margePotentielleDeliverables: Deliverable[];
};

const ChevronDown = ({ open }: { open: boolean }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    className={`transition-transform ${open ? 'rotate-180' : ''}`}
  >
    <path d="M6 9l6 6 6-6" />
  </svg>
);

const ArrowUpDown = ({ direction }: { direction: 'asc' | 'desc' }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    {direction === 'desc' ? (
      <path d="M12 5v14M19 12l-7 7-7-7" />
    ) : (
      <path d="M12 19V5M5 12l7-7 7 7" />
    )}
  </svg>
);

export function ComptaView() {
  const { isAdmin, loading: roleLoading } = useUserRole();
  const { deliverables, getClientById, comptaYear, clients, projects } = useAppStore();
  const { openDeliverableModal } = useModal();
  const [expandedClientId, setExpandedClientId] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filterMode, setFilterMode] = useState<FilterMode>('all');

  // Filter deliverables by selected year (dueDate, fallback to createdAt for backlog items)
  const yearDeliverables = useMemo(() => {
    return deliverables.filter(d => {
      const date = d.dueDate ?? d.createdAt;
      if (!date) return false;
      return new Date(date).getFullYear() === comptaYear;
    });
  }, [deliverables, comptaYear]);

  // Billed deliverables = billing has progressed (acompte/avancement/solde engagé)
  const billedDeliverables = useMemo(() =>
    yearDeliverables.filter(d => d.billingStatus !== 'pending'),
    [yearDeliverables]
  );

  // Marge potentielle deliverables = no billing progress + margePotentielle set
  const margePotentielleDeliverables = useMemo(() =>
    yearDeliverables.filter(d => d.billingStatus === 'pending' && (d.margePotentielle ?? 0) > 0),
    [yearDeliverables]
  );

  // KPI calculations: rentrées, dépenses, marge (from billed deliverables only)
  const { totalFacturé, totalDépensé, margeNette } = useMemo(() => {
    let facturé = 0;
    let dépensé = 0;
    for (const d of billedDeliverables) {
      facturé += d.prixFacturé ?? 0;
      dépensé += d.coutSousTraitance ?? 0;
    }
    return { totalFacturé: facturé, totalDépensé: dépensé, margeNette: facturé - dépensé };
  }, [billedDeliverables]);

  // Potentiel projet (projets sans devis signé, avec potentiel renseigné)
  const totalPotentielProjets = useMemo(() => {
    return projects
      .filter((p) => (!p.quoteAmount || p.quoteAmount <= 0) && (p.potentiel ?? 0) > 0)
      .reduce((sum, p) => sum + (p.potentiel ?? 0), 0);
  }, [projects]);

  // Marge potentielle Yam (deliverables + projets)
  const totalMargePotentielle = useMemo(() => {
    const fromDeliverables = margePotentielleDeliverables.reduce((sum, d) => sum + (d.margePotentielle ?? 0), 0);
    return fromDeliverables + totalPotentielProjets;
  }, [margePotentielleDeliverables, totalPotentielProjets]);

  // Total unique clients (independent of filter)
  const totalClients = useMemo(() => {
    const clientIds = new Set<string>();
    for (const d of yearDeliverables) {
      if (d.clientId) clientIds.add(d.clientId);
    }
    return clientIds.size;
  }, [yearDeliverables]);

  // Build table rows: one row per client
  const tableRows = useMemo(() => {
    const map = new Map<string, ClientTableRow>();

    const ensureRow = (clientId: string) => {
      if (!map.has(clientId)) {
        const client = getClientById(clientId);
        map.set(clientId, {
          clientId,
          clientName: client?.name ?? 'Sans nom',
          isProspect: client?.status === 'prospect',
          rentreesValidees: 0,
          sousTraitance: 0,
          margeNette: 0,
          margePotentielleYam: 0,
          totalGlobal: 0,
          billedDeliverables: [],
          margePotentielleDeliverables: [],
        });
      }
      return map.get(clientId)!;
    };

    // Billed deliverables → rentrées / sous-traitance / marge nette
    for (const d of billedDeliverables) {
      if (!d.clientId) continue;
      const row = ensureRow(d.clientId);
      const prix = d.prixFacturé ?? 0;
      const st = d.coutSousTraitance ?? 0;
      row.rentreesValidees += prix;
      row.sousTraitance += st;
      row.margeNette = row.rentreesValidees - row.sousTraitance;
      row.totalGlobal += prix;
      row.billedDeliverables.push(d);
    }

    // Marge potentielle deliverables → marge Yam
    for (const d of margePotentielleDeliverables) {
      if (!d.clientId) continue;
      const row = ensureRow(d.clientId);
      const marge = d.margePotentielle ?? 0;
      row.margePotentielleYam += marge;
      row.totalGlobal += marge;
      row.margePotentielleDeliverables.push(d);
    }

    // Potentiel projet (pas encore devisé) → marge Yam
    for (const p of projects) {
      if ((!p.quoteAmount || p.quoteAmount <= 0) && (p.potentiel ?? 0) > 0) {
        const row = ensureRow(p.clientId);
        row.margePotentielleYam += p.potentiel!;
        row.totalGlobal += p.potentiel!;
      }
    }

    let rows = Array.from(map.values());

    // Apply filters
    if (filterMode === 'with-validated') {
      rows = rows.filter(r => r.rentreesValidees > 0);
    } else if (filterMode === 'with-potential') {
      rows = rows.filter(r => r.margePotentielleYam > 0);
    }

    // Sort by totalGlobal
    rows.sort((a, b) => {
      if (sortDirection === 'desc') {
        return b.totalGlobal - a.totalGlobal;
      } else {
        return a.totalGlobal - b.totalGlobal;
      }
    });

    return rows;
  }, [billedDeliverables, margePotentielleDeliverables, projects, getClientById, sortDirection, filterMode]);

  if (roleLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="h-12 w-12 rounded-full border-2 border-[var(--accent-lime)] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[var(--bg-primary)]">
        <div className="text-center max-w-sm px-6">
          <div className="text-6xl mb-4" aria-hidden>🔒</div>
          <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">Accès refusé</h2>
          <p className="text-[var(--text-muted)]">
            Vous devez être admin pour accéder à la comptabilité.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 lg:space-y-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <p className="text-sm text-[var(--text-muted)] uppercase tracking-wider">
            Bilan annuel
          </p>
          <YearSelector />
        </div>

        {/* 5 KPIs: Clients + 4 financial metrics */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4 sm:p-6 shadow-lg">
            <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2">
              Clients
            </p>
            <p className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">{totalClients}</p>
            <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1">actifs {comptaYear}</p>
          </div>
          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4 sm:p-6 shadow-lg">
            <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2">
              Rentrées validées
            </p>
            <p className="text-xl sm:text-2xl font-bold text-[#22c55e]">{formatEur(totalFacturé)}</p>
            <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1">produits terminés {comptaYear}</p>
          </div>
          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4 sm:p-6 shadow-lg">
            <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2">
              Sous-traitance
            </p>
            <p className="text-xl sm:text-2xl font-bold text-[#ef4444]">{formatEur(totalDépensé)}</p>
            <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1">freelances + impression</p>
          </div>
          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4 sm:p-6 shadow-lg">
            <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2">
              Marge nette
            </p>
            <p className="text-xl sm:text-2xl font-bold text-[#3b82f6]">{formatEur(margeNette)}</p>
            <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1">rentrées - sous-traitance</p>
          </div>
          <div className="rounded-xl border-2 border-[var(--accent-violet)]/40 bg-[var(--accent-violet)]/5 p-4 sm:p-6 shadow-lg col-span-2 md:col-span-2 lg:col-span-1">
            <p className="text-xs font-medium text-[var(--accent-violet)] uppercase tracking-wider mb-2">
              Rentrée potentielle
            </p>
            <p className="text-xl sm:text-2xl font-bold text-[var(--accent-violet)]">{formatEur(totalMargePotentielle)}</p>
            <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1">rentrée potentielle {comptaYear}</p>
          </div>
        </div>

        {/* Filters + Sort */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-[var(--text-muted)] w-full sm:w-auto">Afficher:</span>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setFilterMode('all')}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  filterMode === 'all'
                    ? 'bg-[var(--accent-violet)] text-white'
                    : 'bg-[var(--bg-card)] text-[var(--text-primary)] border border-[var(--border-subtle)] hover:bg-[var(--bg-tertiary)]'
                }`}
              >
                Tous
              </button>
              <button
                onClick={() => setFilterMode('with-validated')}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  filterMode === 'with-validated'
                    ? 'bg-[#22c55e] text-white'
                    : 'bg-[var(--bg-card)] text-[var(--text-primary)] border border-[var(--border-subtle)] hover:bg-[var(--bg-tertiary)]'
                }`}
              >
                Validés
              </button>
              <button
                onClick={() => setFilterMode('with-potential')}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  filterMode === 'with-potential'
                    ? 'bg-[var(--accent-violet)] text-white'
                    : 'bg-[var(--bg-card)] text-[var(--text-primary)] border border-[var(--border-subtle)] hover:bg-[var(--bg-tertiary)]'
                }`}
              >
                Rentrée pot.
              </button>
            </div>
          </div>

          <button
            onClick={() => setSortDirection(prev => prev === 'desc' ? 'asc' : 'desc')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] hover:bg-[var(--bg-tertiary)] transition-colors text-sm text-[var(--text-primary)]"
          >
            <span>Tri: Montant</span>
            <ArrowUpDown direction={sortDirection} />
          </button>
        </div>

        {/* Table desktop (lg+) / Cards mobile */}
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] overflow-hidden">
          {/* Mobile: card layout */}
          <div className="lg:hidden divide-y divide-[var(--border-subtle)]">
            {tableRows.length === 0 && (
              <div className="py-12 px-4 text-center text-[var(--text-muted)]">
                Aucune donnée pour {comptaYear}
              </div>
            )}
            {tableRows.map((row) => {
              const isExpanded = expandedClientId === row.clientId;
              return (
                <div key={row.clientId} className="p-4">
                  <button
                    type="button"
                    onClick={() => setExpandedClientId(isExpanded ? null : row.clientId)}
                    className="w-full text-left"
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <ChevronDown open={isExpanded} />
                        <span className="font-medium text-[var(--text-primary)] truncate">
                          {row.clientName}
                          {row.isProspect && row.rentreesValidees === 0 && (
                            <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full border border-amber-500/50 text-amber-600">
                              P
                            </span>
                          )}
                        </span>
                      </div>
                      <span className="text-sm font-bold text-[var(--text-primary)] shrink-0">
                        {formatEur(row.totalGlobal)}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      {filterMode !== 'with-potential' && (
                        <>
                          <div className="flex justify-between sm:block">
                            <span className="text-[var(--text-muted)] sm:block sm:mb-0.5">Rentrées</span>
                            <span className="text-[#22c55e] font-medium">{row.rentreesValidees > 0 ? formatEur(row.rentreesValidees) : '—'}</span>
                          </div>
                          <div className="flex justify-between sm:block">
                            <span className="text-[var(--text-muted)] sm:block sm:mb-0.5">ST</span>
                            <span className="text-[#ef4444]">{row.sousTraitance > 0 ? formatEur(row.sousTraitance) : '—'}</span>
                          </div>
                          <div className="flex justify-between sm:block">
                            <span className="text-[var(--text-muted)] sm:block sm:mb-0.5">Marge</span>
                            <span className="text-[#3b82f6] font-medium">{row.margeNette !== 0 ? formatEur(row.margeNette) : '—'}</span>
                          </div>
                        </>
                      )}
                      <div className="flex justify-between sm:block col-span-2 sm:col-span-1">
                        <span className="text-[var(--text-muted)] sm:block sm:mb-0.5">Pot.</span>
                        <span className="text-[var(--accent-violet)] font-medium">{row.margePotentielleYam > 0 ? formatEur(row.margePotentielleYam) : '—'}</span>
                      </div>
                    </div>
                  </button>
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-[var(--border-subtle)] space-y-4">
                      {row.billedDeliverables.length > 0 && filterMode !== 'with-potential' && (
                        <div>
                          <p className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2">
                            Rentrées ({row.billedDeliverables.length})
                          </p>
                          <ul className="space-y-1.5">
                            {row.billedDeliverables.map((d) => (
                              <li
                                key={d.id}
                                onClick={(e) => { e.stopPropagation(); openDeliverableModal(row.clientId, d); }}
                                className="flex items-center justify-between gap-3 py-2 px-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-sm cursor-pointer active:bg-[var(--bg-tertiary)]"
                              >
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                  <span className="text-[var(--text-primary)] truncate">{d.name}</span>
                                  <BillingStatusChip status={d.billingStatus} />
                                </div>
                                <div className="flex items-center gap-2 shrink-0 text-xs">
                                  <span className="text-[#22c55e]">{formatEur(d.prixFacturé ?? 0)}</span>
                                  {(d.coutSousTraitance ?? 0) > 0 && (
                                    <span className="text-[#ef4444]">− {formatEur(d.coutSousTraitance ?? 0)}</span>
                                  )}
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {row.margePotentielleDeliverables.length > 0 && filterMode !== 'with-validated' && (
                        <div>
                          <p className="text-[10px] font-medium text-[var(--accent-violet)] uppercase tracking-wider mb-2">
                            Rentrée potentielle ({row.margePotentielleDeliverables.length})
                          </p>
                          <ul className="space-y-1.5">
                            {row.margePotentielleDeliverables.map((d) => (
                              <li
                                key={d.id}
                                onClick={(e) => { e.stopPropagation(); openDeliverableModal(row.clientId, d); }}
                                className="flex items-center justify-between gap-3 py-2 px-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--accent-violet)]/20 text-sm cursor-pointer active:bg-[var(--bg-tertiary)]"
                              >
                                <span className="text-[var(--text-primary)] truncate flex-1">{d.name}</span>
                                <span className="text-[var(--accent-violet)] font-medium shrink-0 text-xs">
                                  {formatEur(d.margePotentielle ?? 0)}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Desktop: table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-sm table-fixed">
              <colgroup>
                <col style={{ width: '40px' }} />
                <col style={{ width: '20%' }} />
                <col style={{ width: '20%' }} />
                <col style={{ width: '20%' }} />
                <col style={{ width: '20%' }} />
                <col style={{ width: '20%' }} />
              </colgroup>
              <thead>
                <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-tertiary)]/30">
                  <th className="text-left py-4 px-4 font-medium text-[var(--text-muted)]" />
                  <th className="text-left py-4 px-4 font-medium text-[var(--text-muted)]">Client</th>
                  <th className="text-right py-4 px-4 font-medium text-[#22c55e]">Rentrées validées</th>
                  <th className="text-right py-4 px-4 font-medium text-[#ef4444]">Sous-traitance</th>
                  <th className="text-right py-4 px-4 font-medium text-[#3b82f6]">Marge nette</th>
                  <th className="text-right py-4 px-4 font-medium text-[var(--accent-violet)]">Rentrée pot.</th>
                </tr>
              </thead>
              <tbody>
                {tableRows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[var(--text-muted)]">
                      Aucune donnée pour {comptaYear}
                    </td>
                  </tr>
                )}

                {tableRows.map((row) => {
                  const isExpanded = expandedClientId === row.clientId;
                  return (
                    <React.Fragment key={row.clientId}>
                      <tr
                        className="border-b border-[var(--border-subtle)]/50 hover:bg-[var(--bg-tertiary)]/30 cursor-pointer transition-colors"
                        onClick={() => setExpandedClientId(isExpanded ? null : row.clientId)}
                      >
                        <td className="py-4 px-4 text-[var(--text-muted)]">
                          <ChevronDown open={isExpanded} />
                        </td>
                        <td className="py-4 px-4 text-[var(--text-primary)] font-medium">
                          {row.clientName}
                          {row.isProspect && row.rentreesValidees === 0 && (
                            <span className="ml-2 text-xs px-2 py-0.5 rounded-full border border-amber-500/50 text-amber-600 dark:text-amber-400">
                              P
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-right text-[#22c55e] font-medium">
                          {filterMode === 'with-potential' ? '—' : (row.rentreesValidees > 0 ? formatEur(row.rentreesValidees) : '—')}
                        </td>
                        <td className="py-4 px-4 text-right text-[#ef4444]">
                          {filterMode === 'with-potential' ? '—' : (row.sousTraitance > 0 ? formatEur(row.sousTraitance) : '—')}
                        </td>
                        <td className="py-4 px-4 text-right text-[#3b82f6] font-medium">
                          {filterMode === 'with-potential' ? '—' : (row.margeNette !== 0 ? formatEur(row.margeNette) : '—')}
                        </td>
                        <td className="py-4 px-4 text-right text-[var(--accent-violet)] font-medium">
                          {row.margePotentielleYam > 0 ? formatEur(row.margePotentielleYam) : '—'}
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan={6} className="py-0 px-0 bg-[var(--bg-tertiary)]/20">
                            <div className="px-8 py-6 space-y-4">
                              {/* Billed deliverables (rentrées) */}
                              {row.billedDeliverables.length > 0 && filterMode !== 'with-potential' && (
                                <div>
                                  <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-3">
                                    Rentrées ({row.billedDeliverables.length})
                                  </p>
                                  <ul className="space-y-2">
                                    {row.billedDeliverables.map((d) => (
                                      <li
                                        key={d.id}
                                        onClick={(e) => { e.stopPropagation(); openDeliverableModal(row.clientId, d); }}
                                        className="flex items-center justify-between gap-4 py-2 px-3 rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)] text-sm cursor-pointer hover:border-[var(--accent-violet)]/50 hover:bg-[var(--bg-tertiary)]/30 transition-colors"
                                      >
                                        <div className="flex items-center gap-2 min-w-0">
                                          <span className="text-[var(--text-primary)] truncate">{d.name}</span>
                                          <BillingStatusChip status={d.billingStatus} />
                                        </div>
                                        <div className="flex items-center gap-4 shrink-0 text-xs">
                                          <span className="text-[#22c55e]">{formatEur(d.prixFacturé ?? 0)}</span>
                                          {(d.coutSousTraitance ?? 0) > 0 && (
                                            <span className="text-[#ef4444]">− {formatEur(d.coutSousTraitance ?? 0)}</span>
                                          )}
                                        </div>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {/* Marge potentielle deliverables */}
                              {row.margePotentielleDeliverables.length > 0 && filterMode !== 'with-validated' && (
                                <div>
                                  <p className="text-xs font-medium text-[var(--accent-violet)] uppercase tracking-wider mb-3">
                                    Rentrée potentielle ({row.margePotentielleDeliverables.length})
                                  </p>
                                  <ul className="space-y-2">
                                    {row.margePotentielleDeliverables.map((d) => (
                                      <li
                                        key={d.id}
                                        onClick={(e) => { e.stopPropagation(); openDeliverableModal(row.clientId, d); }}
                                        className="flex items-center justify-between gap-4 py-2 px-3 rounded-lg bg-[var(--bg-card)] border border-[var(--accent-violet)]/20 text-sm cursor-pointer hover:border-[var(--accent-violet)]/50 hover:bg-[var(--bg-tertiary)]/30 transition-colors"
                                      >
                                        <span className="text-[var(--text-primary)] truncate">{d.name}</span>
                                        <span className="text-[var(--accent-violet)] font-medium shrink-0 text-xs">
                                          {formatEur(d.margePotentielle ?? 0)}
                                        </span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

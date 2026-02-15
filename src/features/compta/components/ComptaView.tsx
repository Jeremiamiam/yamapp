'use client';

import React, { useMemo, useState } from 'react';
import { useAppStore } from '@/lib/store';
import { useModal } from '@/hooks';
import { useUserRole } from '@/hooks/useUserRole';
import type { Deliverable } from '@/types';
import { YearSelector } from './YearSelector';

const formatEur = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);

type FilterMode = 'all' | 'with-validated' | 'with-potential';

type ClientTableRow = {
  clientId: string;
  clientName: string;
  isProspect: boolean;
  rentreesValidees: number;
  sousTraitance: number;
  margeNette: number;
  potentiel: number;
  totalGlobal: number;
  completedDeliverables: Deliverable[];
  potentielDeliverables: Deliverable[];
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
  const { deliverables, getClientById, comptaYear, clients } = useAppStore();
  const { openDeliverableModal } = useModal();
  const [expandedClientId, setExpandedClientId] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filterMode, setFilterMode] = useState<FilterMode>('all');

  // ⚠️ TEMPORARY MOCK DATA FOR VISUAL VALIDATION - TO BE REMOVED ⚠️
  const mockCompletedDeliverables: Deliverable[] = useMemo(() => {
    const firstClientId = clients[0]?.id;
    const secondClientId = clients[1]?.id;
    const thirdClientId = clients[2]?.id;

    if (!firstClientId) return [];

    const now = new Date();

    return [
      {
        id: 'mock-deliv-1',
        clientId: firstClientId,
        name: 'Logo + identité visuelle',
        type: 'creative',
        dueDate: new Date('2026-02-15'),
        status: 'completed',
        prixFacturé: 8500,
        coutSousTraitance: 1200,
        createdAt: now,
      } as unknown as Deliverable,
      {
        id: 'mock-deliv-2',
        clientId: firstClientId,
        name: 'Site web 5 pages',
        type: 'creative',
        dueDate: new Date('2026-03-20'),
        status: 'completed',
        prixFacturé: 12000,
        coutSousTraitance: 3500,
        createdAt: now,
      } as unknown as Deliverable,
      {
        id: 'mock-deliv-3',
        clientId: secondClientId || firstClientId,
        name: 'Brochure 12 pages',
        type: 'document',
        dueDate: new Date('2026-01-30'),
        status: 'completed',
        prixFacturé: 4500,
        coutSousTraitance: 800,
        createdAt: now,
      } as unknown as Deliverable,
      {
        id: 'mock-deliv-4',
        clientId: secondClientId || firstClientId,
        name: 'Vidéo corporate',
        type: 'creative',
        dueDate: new Date('2026-05-10'),
        status: 'completed',
        prixFacturé: 15000,
        coutSousTraitance: 5000,
        createdAt: now,
      } as unknown as Deliverable,
      {
        id: 'mock-deliv-5',
        clientId: thirdClientId || firstClientId,
        name: 'Pack réseaux sociaux',
        type: 'creative',
        dueDate: new Date('2026-07-15'),
        status: 'completed',
        prixFacturé: 3200,
        coutSousTraitance: 0,
        createdAt: now,
      } as unknown as Deliverable,
      {
        id: 'mock-deliv-6',
        clientId: thirdClientId || firstClientId,
        name: 'Refonte UI dashboard',
        type: 'creative',
        dueDate: new Date('2026-09-25'),
        status: 'completed',
        prixFacturé: 9800,
        coutSousTraitance: 2100,
        createdAt: now,
      } as unknown as Deliverable,
    ];
  }, [clients]);
  // ⚠️ END MOCK DATA ⚠️

  // Filter deliverables by selected year (dueDate-based)
  const yearDeliverables = useMemo(() => {
    // ⚠️ TEMPORARY: Merge mock data with real data ⚠️
    const allDeliverables = [...deliverables, ...mockCompletedDeliverables];
    return allDeliverables.filter(d => {
      if (!d.dueDate) return false;
      return new Date(d.dueDate).getFullYear() === comptaYear;
    });
  }, [deliverables, comptaYear, mockCompletedDeliverables]);

  // Completed deliverables = rentrées validées
  const completedDeliverables = useMemo(() =>
    yearDeliverables.filter(d => d.status === 'completed'),
    [yearDeliverables]
  );

  // Potentiel deliverables = pending + in-progress
  const potentielDeliverables = useMemo(() =>
    yearDeliverables.filter(d => d.status === 'pending' || d.status === 'in-progress'),
    [yearDeliverables]
  );

  // KPI calculations: rentrées, dépenses, marge
  const { totalFacturé, totalDépensé, margeNette } = useMemo(() => {
    let facturé = 0;
    let dépensé = 0;
    for (const d of completedDeliverables) {
      facturé += d.prixFacturé ?? 0;
      dépensé += d.coutSousTraitance ?? 0;
    }
    return { totalFacturé: facturé, totalDépensé: dépensé, margeNette: facturé - dépensé };
  }, [completedDeliverables]);

  // Potentiel total
  const totalPotentiel = useMemo(() => {
    return potentielDeliverables.reduce((sum, d) => sum + (d.prixFacturé ?? 0), 0);
  }, [potentielDeliverables]);

  // Build table rows: one row per client with 4 KPI columns
  const tableRows = useMemo(() => {
    const map = new Map<string, ClientTableRow>();

    // Add completed deliverables
    for (const d of completedDeliverables) {
      if (!d.clientId) continue;
      const client = getClientById(d.clientId);
      const prix = d.prixFacturé ?? 0;
      const sousTraitance = d.coutSousTraitance ?? 0;

      const existing = map.get(d.clientId);
      if (existing) {
        existing.rentreesValidees += prix;
        existing.sousTraitance += sousTraitance;
        existing.margeNette = existing.rentreesValidees - existing.sousTraitance;
        existing.totalGlobal += prix;
        existing.completedDeliverables.push(d);
      } else {
        map.set(d.clientId, {
          clientId: d.clientId,
          clientName: client?.name ?? 'Sans nom',
          isProspect: client?.status === 'prospect',
          rentreesValidees: prix,
          sousTraitance,
          margeNette: prix - sousTraitance,
          potentiel: 0,
          totalGlobal: prix,
          completedDeliverables: [d],
          potentielDeliverables: [],
        });
      }
    }

    // Add potentiel deliverables
    for (const d of potentielDeliverables) {
      if (!d.clientId) continue;
      const client = getClientById(d.clientId);
      const prix = d.prixFacturé ?? 0;

      const existing = map.get(d.clientId);
      if (existing) {
        existing.potentiel += prix;
        existing.totalGlobal += prix;
        existing.potentielDeliverables.push(d);
      } else {
        map.set(d.clientId, {
          clientId: d.clientId,
          clientName: client?.name ?? 'Sans nom',
          isProspect: client?.status === 'prospect',
          rentreesValidees: 0,
          sousTraitance: 0,
          margeNette: 0,
          potentiel: prix,
          totalGlobal: prix,
          completedDeliverables: [],
          potentielDeliverables: [d],
        });
      }
    }

    let rows = Array.from(map.values());

    // Apply filters
    if (filterMode === 'with-validated') {
      rows = rows.filter(r => r.rentreesValidees > 0);
    } else if (filterMode === 'with-potential') {
      rows = rows.filter(r => r.potentiel > 0);
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
  }, [completedDeliverables, potentielDeliverables, getClientById, sortDirection, filterMode]);

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
    <div className="flex-1 overflow-y-auto p-8">
      <div className="max-w-7xl mx-auto space-y-10">
        <div className="flex items-center justify-between">
          <p className="text-sm text-[var(--text-muted)] uppercase tracking-wider">
            Bilan annuel
          </p>
          <YearSelector />
        </div>

        {/* 4 KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6 shadow-lg">
            <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2">
              Rentrées validées
            </p>
            <p className="text-2xl font-bold text-[#22c55e]">{formatEur(totalFacturé)}</p>
            <p className="text-sm text-[var(--text-muted)] mt-1">délivrables terminés {comptaYear}</p>
          </div>
          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6 shadow-lg">
            <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2">
              Sous-traitance
            </p>
            <p className="text-2xl font-bold text-[#ef4444]">{formatEur(totalDépensé)}</p>
            <p className="text-sm text-[var(--text-muted)] mt-1">freelances + impression</p>
          </div>
          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6 shadow-lg">
            <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2">
              Marge nette
            </p>
            <p className="text-2xl font-bold text-[#3b82f6]">{formatEur(margeNette)}</p>
            <p className="text-sm text-[var(--text-muted)] mt-1">rentrées - sous-traitance</p>
          </div>
          <div className="rounded-xl border-2 border-dashed border-amber-500/60 bg-amber-500/5 p-6 shadow-lg">
            <p className="text-xs font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-2">
              Potentiel
            </p>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{formatEur(totalPotentiel)}</p>
            <p className="text-sm text-[var(--text-muted)] mt-1">en cours + à venir {comptaYear}</p>
          </div>
        </div>

        {/* Filters + Sort */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-sm text-[var(--text-muted)]">Afficher:</span>
            <div className="flex items-center gap-2">
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
                Avec validés
              </button>
              <button
                onClick={() => setFilterMode('with-potential')}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  filterMode === 'with-potential'
                    ? 'bg-amber-500 text-white'
                    : 'bg-[var(--bg-card)] text-[var(--text-primary)] border border-[var(--border-subtle)] hover:bg-[var(--bg-tertiary)]'
                }`}
              >
                Potentiels
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

        {/* Table: 4 columns aligned with KPIs */}
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm table-fixed">
              <colgroup>
                <col style={{ width: '40px' }} />
                <col style={{ width: 'auto', minWidth: '180px' }} />
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
                  <th className="text-right py-4 px-4 font-medium text-amber-600 dark:text-amber-400">Potentiel</th>
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
                          {row.rentreesValidees > 0 ? formatEur(row.rentreesValidees) : '—'}
                        </td>
                        <td className="py-4 px-4 text-right text-[#ef4444]">
                          {row.sousTraitance > 0 ? formatEur(row.sousTraitance) : '—'}
                        </td>
                        <td className="py-4 px-4 text-right text-[#3b82f6] font-medium">
                          {row.margeNette !== 0 ? formatEur(row.margeNette) : '—'}
                        </td>
                        <td className="py-4 px-4 text-right text-amber-600 dark:text-amber-400 font-medium">
                          {row.potentiel > 0 ? formatEur(row.potentiel) : '—'}
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan={6} className="py-0 px-0 bg-[var(--bg-tertiary)]/20">
                            <div className="px-8 py-6 space-y-4">
                              {row.completedDeliverables.length > 0 && (
                                <div>
                                  <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-3">
                                    Rentrées ({row.completedDeliverables.length})
                                  </p>
                                  <ul className="space-y-2">
                                    {row.completedDeliverables.map((d) => (
                                      <li
                                        key={d.id}
                                        onClick={(e) => { e.stopPropagation(); openDeliverableModal(row.clientId, d); }}
                                        className="flex items-center justify-between gap-4 py-2 px-3 rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)] text-sm cursor-pointer hover:border-[var(--accent-violet)]/50 hover:bg-[var(--bg-tertiary)]/30 transition-colors"
                                      >
                                        <span className="text-[var(--text-primary)]">{d.name}</span>
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

                              {row.potentielDeliverables.length > 0 && (
                                <div>
                                  <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-3">
                                    Potentiel ({row.potentielDeliverables.length})
                                  </p>
                                  <ul className="space-y-2">
                                    {row.potentielDeliverables.map((d) => (
                                      <li
                                        key={d.id}
                                        onClick={(e) => { e.stopPropagation(); openDeliverableModal(row.clientId, d); }}
                                        className="flex items-center justify-between gap-4 py-2 px-3 rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)] text-sm cursor-pointer hover:border-[var(--accent-violet)]/50 hover:bg-[var(--bg-tertiary)]/30 transition-colors"
                                      >
                                        <div className="flex items-center gap-2">
                                          <span className="text-[var(--text-primary)]">{d.name}</span>
                                          <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--bg-tertiary)] text-[var(--text-muted)]">
                                            {d.status === 'pending' ? 'à venir' : 'en cours'}
                                          </span>
                                        </div>
                                        <span className="text-amber-600 dark:text-amber-400 shrink-0 text-xs">
                                          {formatEur(d.prixFacturé ?? 0)}
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

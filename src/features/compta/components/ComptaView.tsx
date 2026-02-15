'use client';

import React, { useMemo, useState } from 'react';
import { useAppStore } from '@/lib/store';
import { useModal } from '@/hooks';
import { useUserRole } from '@/hooks/useUserRole';
import type { Deliverable } from '@/types';
import { YearSelector } from './YearSelector';

const formatEur = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);

type ClientRow = {
  clientId: string;
  clientName: string;
  isProspect: boolean;
  rentrees: {
    total: number;
    sousTraitance: number;
    marge: number;
    deliverables: Deliverable[];
  } | null;
  potentiel: {
    total: number;
    deliverables: Deliverable[];
  } | null;
  totalGlobal: number; // For sorting
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

  // Merge rentrées + potentiel by client into unified rows
  const clientRows = useMemo(() => {
    const map = new Map<string, ClientRow>();

    // Add completed deliverables (rentrées)
    for (const d of completedDeliverables) {
      if (!d.clientId) continue;
      const client = getClientById(d.clientId);
      const prix = d.prixFacturé ?? 0;
      const sousTraitance = d.coutSousTraitance ?? 0;

      const existing = map.get(d.clientId);
      if (existing?.rentrees) {
        existing.rentrees.total += prix;
        existing.rentrees.sousTraitance += sousTraitance;
        existing.rentrees.marge = existing.rentrees.total - existing.rentrees.sousTraitance;
        existing.rentrees.deliverables.push(d);
        existing.totalGlobal += prix;
      } else {
        map.set(d.clientId, {
          clientId: d.clientId,
          clientName: client?.name ?? 'Sans nom',
          isProspect: client?.status === 'prospect',
          rentrees: {
            total: prix,
            sousTraitance,
            marge: prix - sousTraitance,
            deliverables: [d],
          },
          potentiel: existing?.potentiel ?? null,
          totalGlobal: prix + (existing?.potentiel?.total ?? 0),
        });
      }
    }

    // Add potentiel deliverables
    for (const d of potentielDeliverables) {
      if (!d.clientId) continue;
      const client = getClientById(d.clientId);
      const prix = d.prixFacturé ?? 0;

      const existing = map.get(d.clientId);
      if (existing?.potentiel) {
        existing.potentiel.total += prix;
        existing.potentiel.deliverables.push(d);
        existing.totalGlobal += prix;
      } else {
        map.set(d.clientId, {
          clientId: d.clientId,
          clientName: client?.name ?? 'Sans nom',
          isProspect: client?.status === 'prospect',
          rentrees: existing?.rentrees ?? null,
          potentiel: {
            total: prix,
            deliverables: [d],
          },
          totalGlobal: (existing?.rentrees?.total ?? 0) + prix,
        });
      }
    }

    // Sort by totalGlobal
    const rows = Array.from(map.values());
    rows.sort((a, b) => {
      if (sortDirection === 'desc') {
        return b.totalGlobal - a.totalGlobal;
      } else {
        return a.totalGlobal - b.totalGlobal;
      }
    });

    return rows;
  }, [completedDeliverables, potentielDeliverables, getClientById, sortDirection]);

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

        {/* 4 KPIs : Rentrées validées, Sous-traitance, Marge nette, Potentiel */}
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

        {/* Sort control */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-[var(--text-muted)]">
            {clientRows.length} client{clientRows.length > 1 ? 's' : ''}
          </p>
          <button
            onClick={() => setSortDirection(prev => prev === 'desc' ? 'asc' : 'desc')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] hover:bg-[var(--bg-tertiary)] transition-colors text-sm text-[var(--text-primary)]"
          >
            <span>Tri: Montant</span>
            <ArrowUpDown direction={sortDirection} />
          </button>
        </div>

        {/* 2-column layout: Rentrées | Potentiel */}
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-2 border-b border-[var(--border-subtle)] bg-[var(--bg-tertiary)]/30">
            <div className="p-4 border-r border-[var(--border-subtle)]">
              <p className="text-sm font-medium text-[var(--text-primary)]">Rentrées validées</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">Déjà facturé</p>
            </div>
            <div className="p-4">
              <p className="text-sm font-medium text-[var(--text-primary)]">Potentiel</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">En cours / à venir</p>
            </div>
          </div>

          {/* Rows */}
          <div>
            {clientRows.length === 0 && (
              <div className="p-8 text-center text-[var(--text-muted)]">
                Aucune donnée pour {comptaYear}
              </div>
            )}

            {clientRows.map((row) => {
              const isExpanded = expandedClientId === row.clientId;
              return (
                <div key={row.clientId} className="grid grid-cols-2 border-b border-[var(--border-subtle)] last:border-b-0">
                  {/* Left column: Rentrées */}
                  <div className="p-4 border-r border-[var(--border-subtle)]">
                    {row.rentrees ? (
                      <div>
                        <div
                          className="flex items-center justify-between gap-4 cursor-pointer hover:bg-[var(--bg-tertiary)]/30 -mx-2 px-2 py-2 rounded transition-colors"
                          onClick={() => setExpandedClientId(isExpanded ? null : row.clientId)}
                        >
                          <div className="flex items-center gap-3">
                            <ChevronDown open={isExpanded} />
                            <span className="text-[var(--text-primary)] font-medium">{row.clientName}</span>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-[#22c55e] font-medium">{formatEur(row.rentrees.total)}</div>
                            <div className="text-xs text-[var(--text-muted)]">Marge: {formatEur(row.rentrees.marge)}</div>
                          </div>
                        </div>
                        {isExpanded && (
                          <div className="mt-3 ml-7 space-y-2">
                            {row.rentrees.deliverables.map((d) => (
                              <div
                                key={d.id}
                                onClick={(e) => { e.stopPropagation(); openDeliverableModal(row.clientId, d); }}
                                className="flex items-center justify-between gap-4 py-2 px-3 rounded-lg bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] cursor-pointer text-sm transition-colors"
                              >
                                <span className="text-[var(--text-primary)]">{d.name}</span>
                                <div className="flex items-center gap-3 shrink-0 text-xs">
                                  <span className="text-[#22c55e]">{formatEur(d.prixFacturé ?? 0)}</span>
                                  {(d.coutSousTraitance ?? 0) > 0 && (
                                    <span className="text-[#ef4444]">− {formatEur(d.coutSousTraitance ?? 0)}</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-[var(--text-muted)] text-sm">—</div>
                    )}
                  </div>

                  {/* Right column: Potentiel */}
                  <div className="p-4">
                    {row.potentiel ? (
                      <div>
                        <div
                          className="flex items-center justify-between gap-4 cursor-pointer hover:bg-[var(--bg-tertiary)]/30 -mx-2 px-2 py-2 rounded transition-colors"
                          onClick={() => setExpandedClientId(isExpanded ? null : row.clientId)}
                        >
                          <div className="flex items-center gap-3">
                            <ChevronDown open={isExpanded} />
                            <span className="text-[var(--text-primary)] font-medium">
                              {row.clientName}
                              {row.isProspect && !row.rentrees && (
                                <span className="ml-2 text-xs px-2 py-0.5 rounded-full border border-amber-500/50 text-amber-600 dark:text-amber-400">
                                  P
                                </span>
                              )}
                            </span>
                          </div>
                          <span className="text-amber-600 dark:text-amber-400 font-medium shrink-0">
                            {formatEur(row.potentiel.total)}
                          </span>
                        </div>
                        {isExpanded && (
                          <div className="mt-3 ml-7 space-y-2">
                            {row.potentiel.deliverables.map((d) => (
                              <div
                                key={d.id}
                                onClick={(e) => { e.stopPropagation(); openDeliverableModal(row.clientId, d); }}
                                className="flex items-center justify-between gap-4 py-2 px-3 rounded-lg bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] cursor-pointer text-sm transition-colors"
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
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-[var(--text-muted)] text-sm">—</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

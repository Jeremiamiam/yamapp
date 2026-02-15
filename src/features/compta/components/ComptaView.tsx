'use client';

import React, { useMemo, useState } from 'react';
import { useAppStore } from '@/lib/store';
import { useModal } from '@/hooks';
import { useUserRole } from '@/hooks/useUserRole';
import type { Deliverable } from '@/types';
import { YearSelector } from './YearSelector';

const formatEur = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);

type ClientCompta = {
  clientId: string;
  clientName: string;
  totalFacturé: number;
  totalSousTraitance: number;
  marge: number;
  deliverables: Deliverable[];
};

type ClientPotentiel = {
  clientId: string;
  clientName: string;
  isProspect: boolean;
  total: number;
  deliverables: Deliverable[];
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

export function ComptaView() {
  const { isAdmin, loading: roleLoading } = useUserRole();
  const { deliverables, getClientById, comptaYear } = useAppStore();
  const { openDeliverableModal } = useModal();
  const [expandedClientId, setExpandedClientId] = useState<string | null>(null);
  const [expandedPotentielId, setExpandedPotentielId] = useState<string | null>(null);

  // Filter deliverables by selected year (dueDate-based)
  const yearDeliverables = useMemo(() => {
    return deliverables.filter(d => {
      if (!d.dueDate) return false;
      return new Date(d.dueDate).getFullYear() === comptaYear;
    });
  }, [deliverables, comptaYear]);

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

  // Rentrées par client (completed deliverables grouped by client)
  const byClientCompleted = useMemo(() => {
    const map = new Map<string, ClientCompta>();
    for (const d of completedDeliverables) {
      if (!d.clientId) continue;
      const existing = map.get(d.clientId);
      const client = getClientById(d.clientId);
      const prix = d.prixFacturé ?? 0;
      const sousTraitance = d.coutSousTraitance ?? 0;
      if (existing) {
        existing.totalFacturé += prix;
        existing.totalSousTraitance += sousTraitance;
        existing.marge = existing.totalFacturé - existing.totalSousTraitance;
        existing.deliverables.push(d);
      } else {
        map.set(d.clientId, {
          clientId: d.clientId,
          clientName: client?.name ?? 'Sans nom',
          totalFacturé: prix,
          totalSousTraitance: sousTraitance,
          marge: prix - sousTraitance,
          deliverables: [d],
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => b.totalFacturé - a.totalFacturé);
  }, [completedDeliverables, getClientById]);

  // Potentiel par client (pending + in-progress grouped by client)
  const byClientPotentiel = useMemo(() => {
    const map = new Map<string, ClientPotentiel>();
    for (const d of potentielDeliverables) {
      if (!d.clientId) continue;
      const client = getClientById(d.clientId);
      const existing = map.get(d.clientId);
      const prix = d.prixFacturé ?? 0;
      if (existing) {
        existing.total += prix;
        existing.deliverables.push(d);
      } else {
        map.set(d.clientId, {
          clientId: d.clientId,
          clientName: client?.name ?? 'Sans nom',
          isProspect: client?.status === 'prospect',
          total: prix,
          deliverables: [d],
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [potentielDeliverables, getClientById]);

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
      <div className="max-w-5xl mx-auto space-y-10">
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

        {/* Potentiel par client (pending + in-progress) */}
        {byClientPotentiel.length > 0 && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-6">
            <p className="text-sm font-medium text-[var(--text-primary)] mb-2">Potentiel par client</p>
            <p className="text-xs text-[var(--text-muted)] mb-4">Délivrables en cours ou à venir pour {comptaYear}</p>
            <div className="space-y-2">
              {byClientPotentiel.map((row) => {
                const isExpanded = expandedPotentielId === row.clientId;
                return (
                  <div key={row.clientId} className="rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)]">
                    <div
                      className="flex items-center justify-between gap-4 py-3 px-4 cursor-pointer hover:bg-[var(--bg-tertiary)]/30"
                      onClick={() => setExpandedPotentielId(isExpanded ? null : row.clientId)}
                    >
                      <div className="flex items-center gap-3">
                        <ChevronDown open={isExpanded} />
                        <span className="text-[var(--text-primary)] font-medium">
                          {row.clientName}
                          {row.isProspect && (
                            <span className="ml-2 text-xs px-2 py-0.5 rounded-full border border-amber-500/50 text-amber-600 dark:text-amber-400">
                              P
                            </span>
                          )}
                        </span>
                      </div>
                      <span className="text-amber-600 dark:text-amber-400 font-medium shrink-0">{formatEur(row.total)}</span>
                    </div>
                    {isExpanded && (
                      <div className="px-4 pb-4 pt-2 border-t border-[var(--border-subtle)]">
                        <ul className="space-y-2">
                          {row.deliverables.map((d) => (
                            <li
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
                              <span className="text-amber-600 dark:text-amber-400 shrink-0">{formatEur(d.prixFacturé ?? 0)}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Rentrées par client (completed deliverables) */}
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6">
          <p className="text-sm font-medium text-[var(--text-primary)] mb-4">Rentrées par client</p>
          <p className="text-xs text-[var(--text-muted)] mb-4">Délivrables terminés pour {comptaYear}</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border-subtle)]">
                  <th className="text-left py-3 px-2 font-medium text-[var(--text-muted)] w-8" />
                  <th className="text-left py-3 px-2 font-medium text-[var(--text-muted)]">Client</th>
                  <th className="text-right py-3 px-2 font-medium text-[var(--text-muted)]">Facturé</th>
                  <th className="text-right py-3 px-2 font-medium text-[var(--text-muted)]">Sous-traitance</th>
                  <th className="text-right py-3 px-2 font-medium text-[var(--text-muted)]">Marge</th>
                </tr>
              </thead>
              <tbody>
                {byClientCompleted.map((row) => {
                  const isExpanded = expandedClientId === row.clientId;
                  return (
                    <React.Fragment key={row.clientId}>
                      <tr
                        className="border-b border-[var(--border-subtle)]/50 hover:bg-[var(--bg-tertiary)]/30 cursor-pointer"
                        onClick={() => setExpandedClientId(isExpanded ? null : row.clientId)}
                      >
                        <td className="py-3 px-2 text-[var(--text-muted)]">
                          <ChevronDown open={isExpanded} />
                        </td>
                        <td className="py-3 px-2 text-[var(--text-primary)] font-medium">{row.clientName}</td>
                        <td className="py-3 px-2 text-right text-[#22c55e]">{formatEur(row.totalFacturé)}</td>
                        <td className="py-3 px-2 text-right text-[#ef4444]">{formatEur(row.totalSousTraitance)}</td>
                        <td className="py-3 px-2 text-right text-[#3b82f6] font-medium">{formatEur(row.marge)}</td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan={5} className="py-0 px-0 bg-[var(--bg-tertiary)]/20">
                            <div className="px-6 py-4">
                              <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-3">
                                Livrables ({row.deliverables.length})
                              </p>
                              <ul className="space-y-2">
                                {row.deliverables.map((d) => (
                                  <li
                                    key={d.id}
                                    onClick={(e) => { e.stopPropagation(); openDeliverableModal(row.clientId, d); }}
                                    className="flex items-center justify-between gap-4 py-2 px-3 rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)] text-sm cursor-pointer hover:border-[var(--accent-violet)]/50 hover:bg-[var(--bg-tertiary)]/30 transition-colors"
                                  >
                                    <span className="text-[var(--text-primary)]">{d.name}</span>
                                    <div className="flex items-center gap-4 shrink-0">
                                      {d.prixFacturé != null && d.prixFacturé > 0 && (
                                        <span className="text-[#22c55e]">{formatEur(d.prixFacturé)}</span>
                                      )}
                                      {d.coutSousTraitance != null && d.coutSousTraitance > 0 && (
                                        <span className="text-[#ef4444]">− {formatEur(d.coutSousTraitance)}</span>
                                      )}
                                      {((d.prixFacturé ?? 0) === 0 && (d.coutSousTraitance ?? 0) === 0) && (
                                        <span className="text-[var(--text-muted)]">—</span>
                                      )}
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
                {byClientCompleted.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-[var(--text-muted)]">
                      Aucun livrable terminé avec prix renseigné pour {comptaYear}.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Histogramme mensuel -- Plan 06-02 */}
      </div>
    </div>
  );
}

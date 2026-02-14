'use client';

import React, { useMemo, useState } from 'react';
import { useAppStore } from '@/lib/store';
import { useModal } from '@/hooks';
import { mockComptaMonthly } from '@/lib/mock-data';
import type { Deliverable } from '@/types';

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
  const { deliverables, getClientById } = useAppStore();
  const { openDeliverableModal } = useModal();
  const [expandedClientId, setExpandedClientId] = useState<string | null>(null);

  // Agrégation par client depuis les livrables (avec liste des livrables)
  const byClient = useMemo(() => {
    const map = new Map<string, ClientCompta>();
    for (const d of deliverables) {
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
    // Trier les livrables par date
    for (const row of map.values()) {
      row.deliverables.sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
    }
    return Array.from(map.values()).sort((a, b) => b.totalFacturé - a.totalFacturé);
  }, [deliverables, getClientById]);

  // Totaux globaux
  const { totalFacturé, totalDépensé, margeNette } = useMemo(() => {
    let facturé = 0;
    let dépensé = 0;
    for (const d of deliverables) {
      facturé += d.prixFacturé ?? 0;
      dépensé += d.coutSousTraitance ?? 0;
    }
    return {
      totalFacturé: facturé,
      totalDépensé: dépensé,
      margeNette: facturé - dépensé,
    };
  }, [deliverables]);

  const maxAbs = useMemo(() => {
    const maxE = Math.max(...mockComptaMonthly.map((m) => m.entrées));
    const maxS = Math.max(...mockComptaMonthly.map((m) => m.sorties));
    const maxC = Math.max(...mockComptaMonthly.map((m) => Math.abs(m.soldeCumulé)));
    return Math.max(maxE, maxS, maxC);
  }, []);

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="max-w-5xl mx-auto space-y-10">
        <p className="text-sm text-[var(--text-muted)] uppercase tracking-wider">
          Agrégation depuis les livrables (prix facturé + sous-traitance par livrable)
        </p>

        {/* 3 KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6 shadow-lg">
            <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2">
              Total Facturé
            </p>
            <p className="text-2xl font-bold text-[#22c55e]">{formatEur(totalFacturé)}</p>
            <p className="text-sm text-[var(--text-muted)] mt-1">somme des prix facturés (livrables)</p>
          </div>
          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6 shadow-lg">
            <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2">
              Total Sous-traitance
            </p>
            <p className="text-2xl font-bold text-[#ef4444]">{formatEur(totalDépensé)}</p>
            <p className="text-sm text-[var(--text-muted)] mt-1">impression, freelance, etc.</p>
          </div>
          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6 shadow-lg">
            <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2">
              Marge Nette
            </p>
            <p className="text-2xl font-bold text-[#3b82f6]">{formatEur(margeNette)}</p>
            <p className="text-sm text-[var(--text-muted)] mt-1">facturé − sous-traitance</p>
          </div>
        </div>

        {/* Détail par client avec liste des livrables */}
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6">
          <p className="text-sm font-medium text-[var(--text-primary)] mb-4">Détail par client</p>
          <p className="text-xs text-[var(--text-muted)] mb-4">Clique sur un client pour voir la liste des livrables</p>
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
                {byClient.map((row) => {
                  const isExpanded = expandedClientId === row.clientId;
                  return (
                    <React.Fragment key={row.clientId}>
                      <tr
                        key={row.clientId}
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
                {byClient.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-[var(--text-muted)]">
                      Aucun livrable avec prix renseigné. Ajoutez « Prix facturé » et « Sous-traitance » aux livrables.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Histogramme mensuel (mock — sera calculé plus tard depuis dates livrables) */}
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6">
          <p className="text-sm font-medium text-[var(--text-primary)] mb-2">
            Bilan mensuel
          </p>
          <p className="text-xs text-[var(--text-muted)] mb-6">
            (Mock — à calculer depuis les dates des livrables)
          </p>
          <div className="h-48 flex items-end gap-2">
            {mockComptaMonthly.map((m) => (
              <div key={m.month} className="flex-1 flex flex-col gap-1 items-center min-w-0">
                <div className="w-full max-w-[28px] flex flex-col-reverse gap-0.5 items-center">
                  <div
                    className="w-full rounded-t bg-[#22c55e]/80"
                    style={{ height: `${(m.entrées / maxAbs) * 100}%`, minHeight: m.entrées > 0 ? 6 : 0 }}
                  />
                  <div
                    className="w-full rounded-t bg-[#ef4444]/80"
                    style={{ height: `${(m.sorties / maxAbs) * 100}%`, minHeight: m.sorties > 0 ? 6 : 0 }}
                  />
                </div>
                <span className="text-[10px] font-medium text-[var(--text-muted)] uppercase">{m.month}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

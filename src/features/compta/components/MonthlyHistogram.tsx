'use client';

import React, { useMemo } from 'react';
import type { Deliverable } from '@/types';

interface MonthlyHistogramProps {
  completedDeliverables: Deliverable[];
  year: number;
}

const formatEur = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);

export function MonthlyHistogram({ completedDeliverables, year }: MonthlyHistogramProps) {
  const monthlyData = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => ({
      label: new Date(year, i).toLocaleDateString('fr-FR', { month: 'short' }),
      entrées: 0,
      sorties: 0,
    }));

    for (const d of completedDeliverables) {
      if (!d.dueDate) continue;
      const monthIndex = new Date(d.dueDate).getMonth();
      months[monthIndex].entrées += d.prixFacturé ?? 0;
      months[monthIndex].sorties += d.coutSousTraitance ?? 0;
    }

    return months;
  }, [completedDeliverables, year]);

  const maxValue = useMemo(() => {
    const max = Math.max(
      ...monthlyData.map(m => Math.max(m.entrées, m.sorties)),
      1 // prevent division by zero
    );
    return max;
  }, [monthlyData]);

  return (
    <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6">
      <p className="text-sm font-medium text-[var(--text-primary)]">Bilan mensuel {year}</p>
      <p className="text-xs text-[var(--text-muted)] mb-6">Rentrées (vert) et sous-traitance (rouge) par mois</p>

      {monthlyData.every(m => m.entrées === 0 && m.sorties === 0) ? (
        <p className="text-sm text-[var(--text-muted)] text-center w-full py-8">
          Aucune donnée pour {year}
        </p>
      ) : (
        <div className="h-48 flex items-end gap-2 mt-6">
          {monthlyData.map((m, i) => (
            <div key={i} className="flex-1 flex flex-col items-center min-w-0 gap-1">
              <div className="w-full flex flex-col-reverse items-center gap-0.5" style={{ height: '100%' }}>
                {m.entrées > 0 && (
                  <div
                    className="w-full max-w-[28px] rounded-t bg-[#22c55e]/80"
                    style={{ height: `${(m.entrées / maxValue) * 100}%`, minHeight: 6 }}
                    title={`Entrées: ${formatEur(m.entrées)}`}
                  />
                )}
                {m.sorties > 0 && (
                  <div
                    className="w-full max-w-[28px] rounded-t bg-[#ef4444]/80"
                    style={{ height: `${(m.sorties / maxValue) * 100}%`, minHeight: 6 }}
                    title={`Sorties: ${formatEur(m.sorties)}`}
                  />
                )}
              </div>
              <span className="text-[10px] font-medium text-[var(--text-muted)] uppercase">
                {m.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

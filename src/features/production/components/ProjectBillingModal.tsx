'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useAppStore } from '@/lib/store';
import type { Project, Deliverable, BillingStatus } from '@/types';
import {
  computeProjectBilling,
  formatEuro,
  PROJECT_BILLING_LABELS,
  PROJECT_BILLING_COLORS,
} from '@/lib/project-billing';
import { DateInput } from '@/components/ui/DateInput';

interface ProjectBillingModalProps {
  project: Project;
  deliverables: Deliverable[];
  onClose: () => void;
}

const BILLING_STATUS_LABEL: Record<BillingStatus, string> = {
  pending: 'En attente',
  deposit: 'Acompte',
  progress: 'Avancement',
  balance: 'Soldé',
};

const BILLING_STATUS_DOT: Record<BillingStatus, string> = {
  pending: 'bg-[var(--text-muted)]',
  deposit: 'bg-[var(--accent-amber)]',
  progress: 'bg-[var(--accent-violet)]',
  balance: 'bg-[var(--accent-lime)]',
};

export function ProjectBillingModal({ project, deliverables, onClose }: ProjectBillingModalProps) {
  const { updateProject, getClientById } = useAppStore();
  const client = getClientById(project.clientId);
  const allDeliverables = useAppStore((s) => s.deliverables);

  const billing = useMemo(
    () => computeProjectBilling(project, allDeliverables),
    [project, allDeliverables]
  );
  const colors = PROJECT_BILLING_COLORS[billing.status];

  // Form state for project-level payments
  const [quoteAmount, setQuoteAmount] = useState(project.quoteAmount?.toString() || '');
  const [quoteDate, setQuoteDate] = useState(project.quoteDate || '');
  const [depositAmount, setDepositAmount] = useState(project.depositAmount?.toString() || '');
  const [depositDate, setDepositDate] = useState(project.depositDate || '');
  const [progressAmounts, setProgressAmounts] = useState<string[]>(
    (project.progressAmounts || []).map(String)
  );
  const [progressDates, setProgressDates] = useState<string[]>(project.progressDates || []);
  const [balanceDate, setBalanceDate] = useState(project.balanceDate || '');
  const [saving, setSaving] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleSave = async () => {
    setSaving(true);
    await updateProject(project.id, {
      quoteAmount: quoteAmount ? parseFloat(quoteAmount) : undefined,
      quoteDate: quoteDate || undefined,
      depositAmount: depositAmount ? parseFloat(depositAmount) : undefined,
      depositDate: depositDate || undefined,
      progressAmounts: progressAmounts.map(Number).filter((n) => n > 0),
      progressDates: progressDates.filter((_, i) => Number(progressAmounts[i]) > 0),
      balanceDate: balanceDate || undefined,
    });
    setSaving(false);
    onClose();
  };

  const addProgressRow = () => {
    setProgressAmounts((prev) => [...prev, '']);
    setProgressDates((prev) => [...prev, '']);
  };

  const removeProgressRow = (idx: number) => {
    setProgressAmounts((prev) => prev.filter((_, i) => i !== idx));
    setProgressDates((prev) => prev.filter((_, i) => i !== idx));
  };

  const overBudget = project.quoteAmount && billing.totalPaid > project.quoteAmount;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div
        ref={modalRef}
        className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] shadow-2xl"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[var(--bg-primary)] border-b border-[var(--border-subtle)] px-6 py-4 flex items-center gap-3">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--text-muted)]">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
          </svg>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-semibold text-[var(--text-primary)] truncate">
              {project.name}
            </h2>
            <p className="text-xs text-[var(--text-muted)]">{client?.name || 'Client inconnu'}</p>
          </div>
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${colors.bg} ${colors.text}`}>
            {PROJECT_BILLING_LABELS[billing.status]}
          </span>
          <button type="button" onClick={onClose} className="p-1 rounded-lg hover:bg-[var(--bg-tertiary)] cursor-pointer">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--text-muted)]">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Progress bar */}
        {project.quoteAmount && project.quoteAmount > 0 && (
          <div className="px-6 py-3 border-b border-[var(--border-subtle)]">
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-xs text-[var(--text-muted)]">Progression de facturation</span>
              <span className={`text-sm font-bold ${overBudget ? 'text-red-400' : 'text-[var(--text-primary)]'}`}>
                {formatEuro(billing.totalPaid)} / {formatEuro(project.quoteAmount)}
                {overBudget && (
                  <span className="text-xs ml-1 text-red-400">(dépassé de {formatEuro(billing.totalPaid - project.quoteAmount)})</span>
                )}
              </span>
            </div>
            <div className="h-2 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${overBudget ? 'bg-red-500' : 'bg-[var(--accent-cyan)]'}`}
                style={{ width: `${Math.min(100, billing.progressPercent)}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-[var(--text-muted)] mt-1">
              <span>{billing.progressPercent}%</span>
              <span>Restant : {formatEuro(billing.remaining)}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 md:divide-x divide-[var(--border-subtle)]">
          {/* Left — Produits du projet */}
          <div className="p-4 space-y-2">
            <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">
              Produits ({deliverables.length})
            </h3>
            {deliverables.length === 0 ? (
              <p className="text-xs text-[var(--text-muted)] text-center py-6">Aucun produit dans ce projet</p>
            ) : (
              <div className="space-y-1">
                {deliverables.map((d) => (
                  <div key={d.id} className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
                    <div className={`w-1.5 h-1.5 rounded-full ${BILLING_STATUS_DOT[d.billingStatus]}`} />
                    <span className="text-xs font-medium text-[var(--text-primary)] truncate flex-1">{d.name}</span>
                    {d.prixFacturé != null && d.prixFacturé > 0 && (
                      <span className="text-[10px] font-semibold text-[#22c55e]">{formatEuro(d.prixFacturé)}</span>
                    )}
                    <span className="text-[9px] text-[var(--text-muted)]">{BILLING_STATUS_LABEL[d.billingStatus]}</span>
                    {d.totalInvoiced != null && d.totalInvoiced > 0 && (
                      <span className="text-[9px] font-medium text-[var(--accent-cyan)]">
                        {formatEuro(d.totalInvoiced)} facturé
                      </span>
                    )}
                  </div>
                ))}
                {/* Totaux produits */}
                <div className="flex justify-between text-[10px] text-[var(--text-muted)] pt-2 border-t border-[var(--border-subtle)] mt-2 px-2.5">
                  <span>Total facturé produits</span>
                  <span className="font-semibold text-[var(--accent-cyan)]">{formatEuro(billing.totalProductInvoiced)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Right — Facturation projet */}
          <div className="p-4 space-y-3">
            <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">
              Facturation projet
            </h3>

            {/* Devis */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider">Devis global</label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="number"
                    value={quoteAmount}
                    onChange={(e) => setQuoteAmount(e.target.value)}
                    placeholder="Montant"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)]/40 focus:outline-none focus:border-[var(--accent-cyan)]"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-[var(--text-muted)]">€</span>
                </div>
                <DateInput value={quoteDate} onChange={setQuoteDate} />
              </div>
            </div>

            {/* Acompte */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider">Acompte</label>
                {quoteAmount && parseFloat(quoteAmount) > 0 && (
                  <button
                    type="button"
                    onClick={() => setDepositAmount(String(Math.round(parseFloat(quoteAmount) * 0.3)))}
                    className="text-[10px] font-semibold text-[var(--accent-cyan)] hover:underline cursor-pointer"
                  >
                    30%
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="Montant"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)]/40 focus:outline-none focus:border-[var(--accent-cyan)]"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-[var(--text-muted)]">€</span>
                </div>
                <DateInput value={depositDate} onChange={setDepositDate} />
              </div>
            </div>

            {/* Avancements */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider">Avancements</label>
                <button
                  type="button"
                  onClick={addProgressRow}
                  className="text-[10px] text-[var(--accent-cyan)] hover:underline cursor-pointer"
                >
                  + Ajouter
                </button>
              </div>
              {progressAmounts.map((amt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="number"
                      value={amt}
                      onChange={(e) => {
                        const copy = [...progressAmounts];
                        copy[idx] = e.target.value;
                        setProgressAmounts(copy);
                      }}
                      placeholder="Montant"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)]/40 focus:outline-none focus:border-[var(--accent-cyan)]"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-[var(--text-muted)]">€</span>
                  </div>
                  <DateInput
                    value={progressDates[idx] || ''}
                    onChange={(v) => {
                      const copy = [...progressDates];
                      copy[idx] = v;
                      setProgressDates(copy);
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => removeProgressRow(idx)}
                    className="w-6 h-6 rounded flex items-center justify-center text-[var(--text-muted)] hover:text-red-400 hover:bg-red-400/10 cursor-pointer flex-shrink-0"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                  </button>
                </div>
              ))}
            </div>

            {/* Solde date */}
            {billing.remaining <= 0.01 && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider">Date solde</label>
                <DateInput value={balanceDate} onChange={setBalanceDate} />
              </div>
            )}

            {/* Recap */}
            <div className="mt-4 pt-3 border-t border-[var(--border-subtle)] space-y-1.5">
              <div className="flex justify-between text-[10px]">
                <span className="text-[var(--text-muted)]">Paiements projet</span>
                <span className="font-medium text-[var(--text-primary)]">{formatEuro(billing.totalProjectPayments)}</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-[var(--text-muted)]">Facturé produits</span>
                <span className="font-medium text-[var(--accent-cyan)]">{formatEuro(billing.totalProductInvoiced)}</span>
              </div>
              <div className="flex justify-between text-xs font-semibold pt-1 border-t border-dashed border-[var(--border-subtle)]">
                <span className="text-[var(--text-primary)]">Total payé</span>
                <span className={overBudget ? 'text-red-400' : 'text-[#22c55e]'}>{formatEuro(billing.totalPaid)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-[var(--bg-primary)] border-t border-[var(--border-subtle)] px-6 py-3 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-medium text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] cursor-pointer"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-1.5 rounded-lg text-xs font-medium bg-[var(--accent-cyan)] text-white hover:opacity-90 disabled:opacity-50 cursor-pointer"
          >
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );
}

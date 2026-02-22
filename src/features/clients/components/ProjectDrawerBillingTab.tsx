'use client';

import { useMemo } from 'react';
import type { Project, Client, Deliverable, BillingStatus } from '@/types';
import {
  computeProjectBilling,
  formatEuro,
  PROJECT_BILLING_LABELS,
  PROJECT_BILLING_COLORS,
} from '@/lib/project-billing';

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: '2-digit' });
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProjectDrawerBillingTabProps {
  project: Project;
  client: Client;
  deliverables: Deliverable[];
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ProjectDrawerBillingTab({ project, client, deliverables }: ProjectDrawerBillingTabProps) {
  const projectDeliverables = useMemo(
    () => deliverables.filter((d) => d.projectId === project.id),
    [deliverables, project.id]
  );

  const billing = useMemo(
    () => computeProjectBilling(project, deliverables),
    [project, deliverables]
  );

  const hasQuote = project.quoteAmount != null && project.quoteAmount > 0;

  // Unused client suppression
  void client;

  return (
    <div className="p-4 space-y-5 overflow-y-auto">

      {/* ── Section 1 : Niveau Projet (si devis global) ── */}
      {hasQuote && (
        <section>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
              Niveau Projet
            </h3>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-medium
                         ${PROJECT_BILLING_COLORS[billing.status].bg}
                         ${PROJECT_BILLING_COLORS[billing.status].text}`}
            >
              {PROJECT_BILLING_LABELS[billing.status]}
            </span>
          </div>

          {/* Progress bar */}
          {billing.progressPercent > 0 && (
            <div className="mb-3">
              <div className="h-1.5 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[var(--accent-cyan)] transition-all"
                  style={{ width: `${Math.min(100, billing.progressPercent)}%` }}
                />
              </div>
              <div className="flex justify-between text-[9px] text-[var(--text-muted)] mt-1">
                <span>{billing.progressPercent}% encaissé</span>
                <span>Reste : {formatEuro(billing.remaining)}</span>
              </div>
            </div>
          )}

          <div className="rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)] divide-y divide-[var(--border-subtle)]">
            {/* Devis */}
            <ProjectBillingRow
              label="Devis"
              amount={project.quoteAmount ?? undefined}
              date={project.quoteDate}
              highlight
            />

            {/* Acompte */}
            {project.depositAmount != null && project.depositAmount > 0 && (
              <ProjectBillingRow
                label="Acompte"
                amount={project.depositAmount}
                date={project.depositDate}
              />
            )}

            {/* Avancements */}
            {project.progressAmounts && project.progressAmounts.length > 0 &&
              project.progressAmounts.map((amt, i) =>
                amt > 0 ? (
                  <ProjectBillingRow
                    key={i}
                    label={`Avancement ${project.progressAmounts!.length > 1 ? i + 1 : ''}`}
                    amount={amt}
                    date={project.progressDates?.[i]}
                  />
                ) : null
              )}

            {/* Solde restant */}
            {billing.remaining > 0.01 && (
              <ProjectBillingRow
                label="Solde restant"
                amount={billing.remaining}
                dimmed
              />
            )}
            {billing.remaining <= 0.01 && project.balanceDate && (
              <ProjectBillingRow
                label="Soldé le"
                amount={undefined}
                date={project.balanceDate}
              />
            )}
          </div>

          {/* Résumé total */}
          <div className="mt-2 flex justify-between text-[10px]">
            <span className="text-[var(--text-muted)]">Total encaissé</span>
            <span className="font-semibold text-[#22c55e]">{formatEuro(billing.totalPaid)}</span>
          </div>
        </section>
      )}

      {/* ── Section 2 : Niveau Produits ── */}
      {projectDeliverables.length > 0 && (
        <section>
          <h3 className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
            Niveau Produits ({projectDeliverables.length})
          </h3>

          <div className="space-y-2">
            {projectDeliverables.map((d) => (
              <ProductBillingCard key={d.id} product={d} />
            ))}
          </div>

          {/* Total produits */}
          {billing.totalProductInvoiced > 0 && (
            <div className="mt-2 flex justify-between text-[10px] pt-2 border-t border-dashed border-[var(--border-subtle)]">
              <span className="text-[var(--text-muted)]">Total facturé produits</span>
              <span className="font-semibold text-[var(--accent-cyan)]">
                {formatEuro(billing.totalProductInvoiced)}
              </span>
            </div>
          )}
        </section>
      )}

      {/* ── Cas: pas de devis global + pas de produits ── */}
      {!hasQuote && projectDeliverables.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 gap-2">
          <p className="text-xs text-[var(--text-muted)] text-center">
            Aucune facturation enregistrée
          </p>
          <p className="text-[10px] text-[var(--text-muted)]/60 text-center">
            Ajoutez un devis global au projet ou assignez des produits.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ProjectBillingRow({
  label,
  amount,
  date,
  highlight = false,
  dimmed = false,
}: {
  label: string;
  amount: number | undefined;
  date?: string;
  highlight?: boolean;
  dimmed?: boolean;
}) {
  return (
    <div className="flex items-center justify-between px-3 py-2 text-[10px]">
      <span
        className={
          highlight
            ? 'font-semibold text-[var(--text-primary)]'
            : dimmed
            ? 'text-[var(--text-muted)]/60'
            : 'text-[var(--text-muted)]'
        }
      >
        {label}
      </span>
      <div className="flex items-center gap-2">
        {date && (
          <span className="text-[var(--text-muted)]">{formatDate(date)}</span>
        )}
        {amount != null && amount > 0 && (
          <span
            className={`font-semibold ${
              highlight
                ? 'text-[var(--text-primary)]'
                : dimmed
                ? 'text-[var(--text-muted)]/60'
                : 'text-[var(--text-primary)]'
            }`}
          >
            {formatEuro(amount)}
          </span>
        )}
      </div>
    </div>
  );
}

function ProductBillingCard({ product }: { product: Deliverable }) {
  const hasBilling =
    (product.quoteAmount != null && product.quoteAmount > 0) ||
    (product.depositAmount != null && product.depositAmount > 0) ||
    (product.progressAmounts && product.progressAmounts.length > 0) ||
    (product.balanceAmount != null && product.balanceAmount > 0);

  return (
    <div className="rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)] overflow-hidden">
      {/* En-tête produit */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-[var(--border-subtle)]">
        <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${BILLING_STATUS_DOT[product.billingStatus]}`} />
        <span className="text-xs font-medium text-[var(--text-primary)] truncate flex-1">
          {product.name}
        </span>
        <span className="text-[9px] text-[var(--text-muted)] flex-shrink-0">
          {BILLING_STATUS_LABEL[product.billingStatus]}
        </span>
        {product.totalInvoiced != null && product.totalInvoiced > 0 && (
          <span className="text-[9px] font-semibold text-[#22c55e] flex-shrink-0">
            {formatEuro(product.totalInvoiced)}
          </span>
        )}
      </div>

      {/* Détail facturation produit */}
      {hasBilling && (
        <div className="px-3 py-2 space-y-1">
          {/* Devis */}
          {product.quoteAmount != null && product.quoteAmount > 0 && (
            <MiniRow label="Devis" amount={product.quoteAmount} date={product.quoteDate} />
          )}

          {/* Acompte */}
          {product.depositAmount != null && product.depositAmount > 0 && (
            <MiniRow label="Acompte" amount={product.depositAmount} date={product.depositDate} />
          )}

          {/* Avancements */}
          {product.progressAmounts && product.progressAmounts.map((amt, i) =>
            amt > 0 ? (
              <MiniRow
                key={i}
                label={`Avancement ${product.progressAmounts!.length > 1 ? i + 1 : ''}`}
                amount={amt}
                date={product.progressDates?.[i]}
              />
            ) : null
          )}

          {/* Solde */}
          {product.balanceAmount != null && product.balanceAmount > 0 && (
            <MiniRow label="Solde" amount={product.balanceAmount} date={product.balanceDate} />
          )}
        </div>
      )}
    </div>
  );
}

function MiniRow({
  label,
  amount,
  date,
}: {
  label: string;
  amount: number;
  date?: string;
}) {
  return (
    <div className="flex items-center justify-between text-[9px]">
      <span className="text-[var(--text-muted)]">{label}</span>
      <div className="flex items-center gap-2">
        {date && <span className="text-[var(--text-muted)]">{formatDate(date)}</span>}
        <span className="font-medium text-[var(--text-primary)]">{formatEuro(amount)}</span>
      </div>
    </div>
  );
}

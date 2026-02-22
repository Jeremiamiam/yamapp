'use client';

import { useMemo } from 'react';
import type { Project, Client, Deliverable, DeliverableStatus } from '@/types';
import { formatEuro } from '@/lib/project-billing';

// ─── Icons ────────────────────────────────────────────────────────────────────

const UserIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const CalendarIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<DeliverableStatus, string> = {
  to_quote: 'À devis',
  pending: 'En attente',
  'in-progress': 'En cours',
  completed: 'Terminé',
};

const STATUS_COLOR: Record<DeliverableStatus, string> = {
  to_quote: 'bg-[var(--text-muted)]/20 text-[var(--text-muted)]',
  pending: 'bg-[var(--accent-amber)]/15 text-[var(--accent-amber)]',
  'in-progress': 'bg-[var(--accent-violet)]/15 text-[var(--accent-violet)]',
  completed: 'bg-[var(--accent-lime)]/15 text-[var(--accent-lime)]',
};

function formatDate(date: Date | string | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: '2-digit' });
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProjectDrawerProductsTabProps {
  project: Project;
  client: Client;
  deliverables: Deliverable[];
  selectedProductId: string | null;
  onSelectProduct: (id: string) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ProjectDrawerProductsTab({
  project,
  client,
  deliverables,
  selectedProductId,
  onSelectProduct,
}: ProjectDrawerProductsTabProps) {
  const projectDeliverables = useMemo(
    () => deliverables.filter((d) => d.projectId === project.id),
    [deliverables, project.id]
  );

  const selectedProduct = useMemo(
    () => projectDeliverables.find((d) => d.id === selectedProductId) ?? null,
    [projectDeliverables, selectedProductId]
  );

  // Unused client suppression — client kept in props for potential future use
  void client;

  if (projectDeliverables.length === 0) {
    return (
      <div className="flex items-center justify-center h-full py-12">
        <p className="text-sm text-[var(--text-muted)] text-center">
          Aucun produit dans ce projet
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Pane gauche — 1/3 : liste des produits */}
      <div className="w-1/3 border-r border-[var(--border-subtle)] overflow-y-auto flex-shrink-0">
        <div className="p-2 space-y-0.5">
          {projectDeliverables.map((d) => {
            const isSelected = d.id === selectedProductId;
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => onSelectProduct(d.id)}
                className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors cursor-pointer
                           ${
                             isSelected
                               ? 'bg-[var(--accent-cyan)]/10 border border-[var(--accent-cyan)]/30'
                               : 'hover:bg-[var(--bg-secondary)] border border-transparent'
                           }`}
              >
                <p
                  className={`text-xs font-medium truncate ${
                    isSelected ? 'text-[var(--accent-cyan)]' : 'text-[var(--text-primary)]'
                  }`}
                >
                  {d.name}
                </p>
                <span
                  className={`inline-block mt-1 text-[9px] px-1.5 py-0.5 rounded font-medium ${STATUS_COLOR[d.status]}`}
                >
                  {STATUS_LABEL[d.status]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Pane droite — 2/3 : détail produit */}
      <div className="w-2/3 overflow-y-auto">
        {selectedProduct ? (
          <ProductDetail product={selectedProduct} />
        ) : (
          <div className="flex items-center justify-center h-full py-12">
            <p className="text-xs text-[var(--text-muted)]">Sélectionnez un produit</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── ProductDetail ─────────────────────────────────────────────────────────────

function ProductDetail({ product }: { product: Deliverable }) {
  return (
    <div className="p-4 space-y-4">
      {/* Nom + statut */}
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">{product.name}</h3>
        <span className={`flex-shrink-0 text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[product.status]}`}>
          {STATUS_LABEL[product.status]}
        </span>
      </div>

      {/* Champs infos */}
      <div className="space-y-2.5">
        {/* Assigné */}
        {product.assigneeId && (
          <FieldRow icon={<UserIcon />} label="Assigné" value={product.assigneeId} />
        )}

        {/* Dates */}
        {product.dueDate && (
          <FieldRow
            icon={<CalendarIcon />}
            label="Deadline"
            value={formatDate(product.dueDate)}
          />
        )}
        {product.deliveredAt && (
          <FieldRow
            icon={<CalendarIcon />}
            label="Livré le"
            value={formatDate(product.deliveredAt)}
          />
        )}

        {/* Prestataire externe */}
        {product.externalContractor && (
          <FieldRow label="Prestataire" value={product.externalContractor} />
        )}

        {/* Prix */}
        {product.prixFacturé != null && product.prixFacturé > 0 && (
          <FieldRow
            label="Prix facturé"
            value={formatEuro(product.prixFacturé)}
            valueColor="text-[#22c55e]"
          />
        )}
        {product.coutSousTraitance != null && product.coutSousTraitance > 0 && (
          <FieldRow
            label="Coût sous-traitance"
            value={formatEuro(product.coutSousTraitance)}
            valueColor="text-[var(--accent-coral)]"
          />
        )}
      </div>

      {/* Notes */}
      {product.notes && (
        <div className="rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)] p-3">
          <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
            Notes
          </p>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap">
            {product.notes}
          </p>
        </div>
      )}

      {/* Facturation produit */}
      {product.quoteAmount != null && product.quoteAmount > 0 && (
        <div className="rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)] p-3 space-y-1.5">
          <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
            Facturation
          </p>

          {/* Devis */}
          <BillingRow
            label="Devis"
            amount={product.quoteAmount ?? undefined}
            date={product.quoteDate}
          />

          {/* Acompte */}
          {product.depositAmount != null && product.depositAmount > 0 && (
            <BillingRow
              label="Acompte"
              amount={product.depositAmount}
              date={product.depositDate}
            />
          )}

          {/* Avancements */}
          {product.progressAmounts && product.progressAmounts.length > 0 &&
            product.progressAmounts.map((amt, i) =>
              amt > 0 ? (
                <BillingRow
                  key={i}
                  label={`Avancement ${product.progressAmounts!.length > 1 ? i + 1 : ''}`}
                  amount={amt}
                  date={product.progressDates?.[i]}
                />
              ) : null
            )}

          {/* Solde */}
          {product.balanceAmount != null && product.balanceAmount > 0 && (
            <BillingRow
              label="Solde"
              amount={product.balanceAmount}
              date={product.balanceDate}
            />
          )}

          {/* Total */}
          {product.totalInvoiced != null && product.totalInvoiced > 0 && (
            <div className="pt-1.5 mt-1.5 border-t border-dashed border-[var(--border-subtle)] flex justify-between text-xs font-semibold">
              <span className="text-[var(--text-primary)]">Total facturé</span>
              <span className="text-[#22c55e]">{formatEuro(product.totalInvoiced)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FieldRow({
  icon,
  label,
  value,
  valueColor = 'text-[var(--text-primary)]',
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      {icon && (
        <span className="text-[var(--text-muted)] flex-shrink-0">{icon}</span>
      )}
      <span className="text-xs text-[var(--text-muted)] flex-shrink-0 w-28">{label}</span>
      <span className={`text-xs font-medium truncate ${valueColor}`}>{value}</span>
    </div>
  );
}

function BillingRow({
  label,
  amount,
  date,
}: {
  label: string;
  amount: number | undefined;
  date?: string;
}) {
  if (!amount) return null;
  return (
    <div className="flex items-center justify-between text-[10px]">
      <span className="text-[var(--text-muted)]">{label}</span>
      <div className="flex items-center gap-2">
        {date && (
          <span className="text-[var(--text-muted)]">
            {new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: '2-digit' })}
          </span>
        )}
        <span className="font-semibold text-[var(--text-primary)]">{formatEuro(amount)}</span>
      </div>
    </div>
  );
}

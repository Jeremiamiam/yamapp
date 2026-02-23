'use client';

import { useMemo, useCallback, useRef } from 'react';
import type { Project, Client, Deliverable, DeliverableStatus, DeliverableType, DeliverableCategory } from '@/types';
import { formatEuro } from '@/lib/project-billing';
import { useAppStore } from '@/lib/store';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_OPTIONS: { value: DeliverableStatus; label: string }[] = [
  { value: 'to_quote', label: 'À deviser' },
  { value: 'pending', label: 'En attente' },
  { value: 'in-progress', label: 'En cours' },
  { value: 'completed', label: 'Terminé' },
];

const STATUS_COLOR: Record<DeliverableStatus, string> = {
  to_quote: 'bg-[var(--text-muted)]/20 text-[var(--text-muted)]',
  pending: 'bg-[var(--accent-amber)]/15 text-[var(--accent-amber)]',
  'in-progress': 'bg-[var(--accent-violet)]/15 text-[var(--accent-violet)]',
  completed: 'bg-[var(--accent-lime)]/15 text-[var(--accent-lime)]',
};

const STATUS_LABEL: Record<DeliverableStatus, string> = {
  to_quote: 'À deviser',
  pending: 'En attente',
  'in-progress': 'En cours',
  completed: 'Terminé',
};

const TYPE_OPTIONS: { value: DeliverableType; label: string }[] = [
  { value: 'creative', label: 'Créatif' },
  { value: 'document', label: 'Document' },
  { value: 'other', label: 'Autre' },
];

const CATEGORY_OPTIONS: { value: DeliverableCategory; label: string }[] = [
  { value: 'digital', label: 'Digital' },
  { value: 'print', label: 'Print' },
  { value: 'other', label: 'Autre' },
];

function parseEur(raw: string): number {
  const cleaned = raw.replace(/[^\d,.\-]/g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
}

function toDateInput(date: Date | string | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
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

  const openModal = useAppStore((state) => state.openModal);

  if (projectDeliverables.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12 gap-3">
        <p className="text-sm text-[var(--text-muted)] text-center">
          Aucun produit dans ce projet
        </p>
        <button
          type="button"
          onClick={() => openModal({ type: 'deliverable', mode: 'create', clientId: client.id })}
          className="text-xs font-medium px-3 py-1.5 rounded-lg bg-[var(--accent-cyan)]/10 text-[var(--accent-cyan)] hover:bg-[var(--accent-cyan)]/20 transition-colors cursor-pointer"
        >
          + Ajouter un produit
        </button>
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
          <button
            type="button"
            onClick={() => openModal({ type: 'deliverable', mode: 'create', clientId: client.id })}
            className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-[var(--accent-cyan)]
                       hover:bg-[var(--accent-cyan)]/10 transition-colors cursor-pointer border border-dashed border-[var(--border-subtle)]"
          >
            + Ajouter un produit
          </button>
        </div>
      </div>

      {/* Pane droite — 2/3 : détail produit éditable */}
      <div className="w-2/3 overflow-y-auto">
        {selectedProduct ? (
          <ProductDetailForm product={selectedProduct} />
        ) : (
          <div className="flex items-center justify-center h-full py-12">
            <p className="text-xs text-[var(--text-muted)]">Sélectionnez un produit</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── ProductDetailForm (inline editable) ──────────────────────────────────────

function ProductDetailForm({ product }: { product: Deliverable }) {
  const updateDeliverable = useAppStore((state) => state.updateDeliverable);
  const deleteDeliverable = useAppStore((state) => state.deleteDeliverable);
  const team = useAppStore((state) => state.team);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const save = useCallback(
    (data: Partial<Deliverable>) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        updateDeliverable(product.id, data);
      }, 400);
    },
    [product.id, updateDeliverable]
  );

  const saveImmediate = useCallback(
    (data: Partial<Deliverable>) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      updateDeliverable(product.id, data);
    },
    [product.id, updateDeliverable]
  );

  const assignee = team.find((m) => m.id === product.assigneeId);

  return (
    <div className="p-4 space-y-5">

      {/* ── Nom ─────────────────────────────────────────────────────────── */}
      <input
        key={`name-${product.id}`}
        type="text"
        defaultValue={product.name}
        onChange={(e) => save({ name: e.target.value })}
        className="w-full text-sm font-semibold text-[var(--text-primary)] bg-transparent border-b border-transparent
                   hover:border-[var(--border-subtle)] focus:border-[var(--accent-cyan)] focus:outline-none
                   transition-colors py-1"
      />

      {/* ── Statut + Type + Catégorie ───────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        <Field label="Statut">
          <select
            key={`status-${product.id}`}
            defaultValue={product.status}
            onChange={(e) => saveImmediate({ status: e.target.value as DeliverableStatus })}
            className="w-full text-xs bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-lg px-2.5 py-1.5 text-[var(--text-primary)] focus:border-[var(--accent-cyan)] focus:outline-none transition-colors"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </Field>
        <Field label="Type">
          <select
            key={`type-${product.id}`}
            defaultValue={product.type}
            onChange={(e) => saveImmediate({ type: e.target.value as DeliverableType })}
            className="w-full text-xs bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-lg px-2.5 py-1.5 text-[var(--text-primary)] focus:border-[var(--accent-cyan)] focus:outline-none transition-colors"
          >
            {TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </Field>
        <Field label="Catégorie">
          <select
            key={`cat-${product.id}`}
            defaultValue={product.category ?? 'other'}
            onChange={(e) => saveImmediate({ category: e.target.value as DeliverableCategory })}
            className="w-full text-xs bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-lg px-2.5 py-1.5 text-[var(--text-primary)] focus:border-[var(--accent-cyan)] focus:outline-none transition-colors"
          >
            {CATEGORY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </Field>
      </div>

      {/* ── Assigné + Dates ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Assigné">
          <select
            key={`assignee-${product.id}`}
            defaultValue={product.assigneeId ?? ''}
            onChange={(e) => saveImmediate({ assigneeId: e.target.value || undefined })}
            className="w-full text-xs bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-lg px-2.5 py-1.5 text-[var(--text-primary)] focus:border-[var(--accent-cyan)] focus:outline-none transition-colors"
          >
            <option value="">Non assigné</option>
            {team.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Planification">
          <div className="space-y-2">
            <input
              key={`due-${product.id}`}
              type="date"
              defaultValue={toDateInput(product.dueDate)}
              onChange={(e) => saveImmediate({
                dueDate: e.target.value ? new Date(e.target.value + 'T12:00:00.000Z') : undefined,
                inBacklog: !e.target.value,
              })}
              className="w-full text-xs bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-lg px-2.5 py-1.5 text-[var(--text-primary)] focus:border-[var(--accent-cyan)] focus:outline-none transition-colors"
            />
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={product.inBacklog ?? false}
                onChange={(e) => saveImmediate({ inBacklog: e.target.checked, dueDate: e.target.checked ? undefined : product.dueDate })}
                className="rounded border-[var(--border-subtle)]"
              />
              <span className="text-[10px] text-[var(--text-muted)]">À planifier (backlog)</span>
            </label>
          </div>
        </Field>
      </div>

      {/* ── Prix ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Prix facturé">
          <div className="relative">
            <input
              key={`prix-${product.id}`}
              type="text"
              defaultValue={product.prixFacturé ? formatEuro(product.prixFacturé) : ''}
              placeholder="0 €"
              onBlur={(e) => saveImmediate({ prixFacturé: parseEur(e.target.value) })}
              className="w-full text-xs bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-lg px-2.5 py-1.5 text-[#22c55e] focus:border-[var(--accent-cyan)] focus:outline-none transition-colors pr-6"
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-[var(--text-muted)]">€</span>
          </div>
        </Field>
        <Field label="Coût sous-traitance">
          <div className="relative">
            <input
              key={`st-${product.id}`}
              type="text"
              defaultValue={product.coutSousTraitance ? formatEuro(product.coutSousTraitance) : ''}
              placeholder="0 €"
              onBlur={(e) => saveImmediate({ coutSousTraitance: parseEur(e.target.value) })}
              className="w-full text-xs bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-lg px-2.5 py-1.5 text-[var(--accent-coral)] focus:border-[var(--accent-cyan)] focus:outline-none transition-colors pr-6"
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-[var(--text-muted)]">€</span>
          </div>
        </Field>
      </div>

      {/* Marge calculée */}
      {(product.prixFacturé ?? 0) > 0 && (
        <div className="flex items-center justify-between text-xs px-1">
          <span className="text-[var(--text-muted)]">Marge</span>
          <span className="font-semibold text-[var(--accent-violet)]">
            {formatEuro((product.prixFacturé ?? 0) - (product.coutSousTraitance ?? 0))}
          </span>
        </div>
      )}

      {/* ── Prestataire externe ─────────────────────────────────────────── */}
      <Field label="Prestataire externe">
        <input
          key={`ext-${product.id}`}
          type="text"
          defaultValue={product.externalContractor ?? ''}
          placeholder="Nom du prestataire"
          onChange={(e) => save({ externalContractor: e.target.value || undefined })}
          className="w-full text-xs bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-lg px-2.5 py-1.5 text-[var(--text-primary)] focus:border-[var(--accent-cyan)] focus:outline-none transition-colors"
        />
      </Field>

      {/* ── Date livraison ──────────────────────────────────────────────── */}
      <Field label="Date de livraison">
        <input
          key={`delivered-${product.id}`}
          type="date"
          defaultValue={toDateInput(product.deliveredAt)}
          onChange={(e) => saveImmediate({ deliveredAt: e.target.value ? new Date(e.target.value) : undefined })}
          className="w-full text-xs bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-lg px-2.5 py-1.5 text-[var(--text-primary)] focus:border-[var(--accent-cyan)] focus:outline-none transition-colors"
        />
      </Field>

      {/* ── Notes ───────────────────────────────────────────────────────── */}
      <Field label="Notes">
        <textarea
          key={`notes-${product.id}`}
          defaultValue={product.notes ?? ''}
          placeholder="Notes sur ce produit..."
          rows={3}
          onChange={(e) => save({ notes: e.target.value || undefined })}
          className="w-full text-xs bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-lg px-2.5 py-1.5 text-[var(--text-primary)] focus:border-[var(--accent-cyan)] focus:outline-none transition-colors resize-none leading-relaxed"
        />
      </Field>

      {/* ── Facturation produit ─────────────────────────────────────────── */}
      <div className="rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)] p-3 space-y-3">
        <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
          Facturation
        </p>

        {/* Devis */}
        <BillingFieldRow
          label="Devis"
          amountKey="quoteAmount"
          dateKey="quoteDate"
          product={product}
          onSave={saveImmediate}
        />

        {/* Acompte */}
        <BillingFieldRow
          label="Acompte"
          amountKey="depositAmount"
          dateKey="depositDate"
          product={product}
          onSave={saveImmediate}
        />

        {/* Avancements */}
        {(product.progressAmounts ?? []).map((amt, i) => (
          <div key={i} className="grid grid-cols-[1fr_auto_auto] gap-2 items-center">
            <label className="text-[10px] text-[var(--text-muted)]">
              Avancement {(product.progressAmounts?.length ?? 0) > 1 ? i + 1 : ''}
            </label>
            <input
              type="text"
              defaultValue={amt ? formatEuro(amt) : ''}
              placeholder="0 €"
              onBlur={(e) => {
                const amounts = [...(product.progressAmounts ?? [])];
                amounts[i] = parseEur(e.target.value);
                saveImmediate({ progressAmounts: amounts });
              }}
              className="text-[10px] bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded px-1.5 py-1 text-[var(--text-primary)] focus:border-[var(--accent-cyan)] focus:outline-none transition-colors w-24 text-right"
            />
            <input
              type="date"
              defaultValue={product.progressDates?.[i] ?? ''}
              onChange={(e) => {
                const dates = [...(product.progressDates ?? [])];
                dates[i] = e.target.value;
                saveImmediate({ progressDates: dates });
              }}
              className="text-[10px] bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded px-1.5 py-1 text-[var(--text-primary)] focus:border-[var(--accent-cyan)] focus:outline-none transition-colors w-32"
            />
          </div>
        ))}

        {/* Bouton ajouter avancement */}
        <button
          type="button"
          onClick={() => {
            saveImmediate({
              progressAmounts: [...(product.progressAmounts ?? []), 0],
              progressDates: [...(product.progressDates ?? []), ''],
            });
          }}
          className="text-[10px] text-[var(--accent-cyan)] hover:underline cursor-pointer"
        >
          + Ajouter un avancement
        </button>

        {/* Solde */}
        <BillingFieldRow
          label="Solde"
          amountKey="balanceAmount"
          dateKey="balanceDate"
          product={product}
          onSave={saveImmediate}
        />

        {/* Total calculé */}
        {(() => {
          const total =
            (product.depositAmount ?? 0) +
            (product.progressAmounts ?? []).reduce((s, a) => s + a, 0) +
            (product.balanceAmount ?? 0);
          if (total <= 0) return null;
          return (
            <div className="pt-2 mt-2 border-t border-dashed border-[var(--border-subtle)] flex justify-between text-xs font-semibold">
              <span className="text-[var(--text-primary)]">Total facturé</span>
              <span className="text-[#22c55e]">{formatEuro(total)}</span>
            </div>
          );
        })()}
      </div>

      {/* ── Supprimer ───────────────────────────────────────────────────── */}
      <div className="pt-2">
        <button
          type="button"
          onClick={() => {
            if (window.confirm(`Supprimer "${product.name}" ?`)) {
              deleteDeliverable(product.id);
            }
          }}
          className="text-[10px] text-[var(--accent-coral)] hover:underline cursor-pointer"
        >
          Supprimer ce produit
        </button>
      </div>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1">
        {label}
      </label>
      {children}
    </div>
  );
}

function BillingFieldRow({
  label,
  amountKey,
  dateKey,
  product,
  onSave,
}: {
  label: string;
  amountKey: keyof Deliverable;
  dateKey: keyof Deliverable;
  product: Deliverable;
  onSave: (data: Partial<Deliverable>) => void;
}) {
  const amount = product[amountKey] as number | undefined;
  const date = product[dateKey] as string | undefined;
  return (
    <div className="grid grid-cols-[1fr_auto_auto] gap-2 items-center">
      <label className="text-[10px] text-[var(--text-muted)]">{label}</label>
      <input
        key={`${amountKey}-${product.id}`}
        type="text"
        defaultValue={amount ? formatEuro(amount) : ''}
        placeholder="0 €"
        onBlur={(e) => onSave({ [amountKey]: parseEur(e.target.value) } as Partial<Deliverable>)}
        className="text-[10px] bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded px-1.5 py-1 text-[var(--text-primary)] focus:border-[var(--accent-cyan)] focus:outline-none transition-colors w-24 text-right"
      />
      <input
        key={`${dateKey}-${product.id}`}
        type="date"
        defaultValue={date ?? ''}
        onChange={(e) => onSave({ [dateKey]: e.target.value } as Partial<Deliverable>)}
        className="text-[10px] bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded px-1.5 py-1 text-[var(--text-primary)] focus:border-[var(--accent-cyan)] focus:outline-none transition-colors w-32"
      />
    </div>
  );
}

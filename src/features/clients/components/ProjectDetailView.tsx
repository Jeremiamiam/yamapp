'use client';

import { useState, useMemo, useCallback, useRef } from 'react';
import type { Project, Client, Deliverable, DocumentType } from '@/types';
import { useAppStore } from '@/lib/store';
import { useModal } from '@/hooks';
import { toast } from '@/lib/toast';
import {
  computeProjectBilling,
  formatEuro,
  PROJECT_BILLING_LABELS,
  PROJECT_BILLING_COLORS,
} from '@/lib/project-billing';
import { PlaudLogo } from '@/components/ui';
import type { BillingStatus } from '@/types';

// ─── Icons ────────────────────────────────────────────────────────────────────

const ArrowLeft = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M12 19l-7-7 7-7"/>
  </svg>
);

const Package = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/>
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
    <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
  </svg>
);

const FileText = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
  </svg>
);

const CreditCard = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
    <line x1="1" y1="10" x2="23" y2="10"/>
  </svg>
);

const Plus = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const FileIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
);

// ─── SectionCard ──────────────────────────────────────────────────────────────

function SectionCard({
  icon: Icon,
  title,
  count,
  onAdd,
  addTitle,
  accentColor = 'var(--accent-cyan)',
  className = '',
  children,
}: {
  icon: React.ElementType;
  title: string;
  count?: number;
  onAdd?: () => void;
  addTitle?: string;
  accentColor?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] overflow-hidden ${className}`}>
      <div className="flex items-center gap-2 px-3 py-2.5" style={{ borderBottom: `1px solid color-mix(in srgb, ${accentColor} 15%, transparent)` }}>
        <span style={{ color: accentColor }}><Icon /></span>
        <span className="text-[10px] font-bold uppercase tracking-wider flex-1" style={{ color: accentColor }}>
          {title}
        </span>
        {count != null && (
          <span className="text-[10px] text-[var(--text-muted)] bg-[var(--bg-tertiary)] px-1.5 py-0.5 rounded-full font-medium">
            {count}
          </span>
        )}
        {onAdd && (
          <button
            type="button"
            onClick={onAdd}
            title={addTitle}
            className="p-1 rounded-md transition-colors cursor-pointer"
            style={{ color: accentColor }}
          >
            <Plus />
          </button>
        )}
      </div>
      <div>{children}</div>
    </div>
  );
}

// ─── Doc helpers ──────────────────────────────────────────────────────────────

const DOC_TYPE_BADGE: Record<DocumentType, { label: string; color: string; bg: string }> = {
  'brief':             { label: 'Brief',     color: 'text-[var(--accent-cyan)]',    bg: 'bg-[var(--accent-cyan)]/15' },
  'report':            { label: 'Report',    color: 'text-[var(--accent-amber)]',   bg: 'bg-[var(--accent-amber)]/15' },
  'note':              { label: 'Note',      color: 'text-[var(--accent-lime)]',    bg: 'bg-[var(--accent-lime)]/15' },
  'creative-strategy': { label: 'Stratégie', color: 'text-[var(--accent-violet)]',  bg: 'bg-[var(--accent-violet)]/15' },
  'web-brief':         { label: 'Web Brief', color: 'text-[var(--accent-coral)]',   bg: 'bg-[var(--accent-coral)]/15' },
  'social-brief':      { label: 'Social',    color: 'text-[var(--accent-magenta)]', bg: 'bg-[var(--accent-magenta)]/15' },
};

// ─── Billing helpers ──────────────────────────────────────────────────────────

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

// ─── Props ────────────────────────────────────────────────────────────────────

interface ProjectDetailViewProps {
  project: Project;
  client: Client;
  deliverables: Deliverable[];
  onBack: () => void;
}

// ─── Main Component ──────────────────────────────────────────────────────────

type ProjectTab = 'produits' | 'documents' | 'facturation';

export function ProjectDetailView({ project, client, deliverables, onBack }: ProjectDetailViewProps) {
  const openDocument = useAppStore((state) => state.openDocument);
  const openModal = useAppStore((state) => state.openModal);
  const { openReportUploadModal } = useModal();

  const [activeTab, setActiveTab] = useState<ProjectTab>('produits');

  const projectDeliverables = useMemo(
    () => deliverables.filter((d) => d.projectId === project.id),
    [deliverables, project.id]
  );

  const projectDocs = useMemo(
    () => client.documents.filter((d) => d.projectId === project.id),
    [client.documents, project.id]
  );

  const billing = useMemo(
    () => computeProjectBilling(project, deliverables),
    [project, deliverables]
  );

  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    projectDeliverables[0]?.id ?? null
  );

  const selectedProduct = projectDeliverables.find((d) => d.id === selectedProductId) ?? null;

  const tabs: { key: ProjectTab; label: string; count?: number }[] = [
    { key: 'produits', label: 'Produits', count: projectDeliverables.length },
    { key: 'documents', label: 'Documents', count: projectDocs.length },
    { key: 'facturation', label: 'Facturation' },
  ];

  return (
    <div className="h-full flex flex-col">

      {/* ── Header projet ────────────────────────────────────────────── */}
      <div className="flex-shrink-0 flex items-center gap-3 px-5 py-3 border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)]/30">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors group flex-shrink-0 cursor-pointer"
        >
          <span className="group-hover:-translate-x-0.5 transition-transform">
            <ArrowLeft />
          </span>
          <span className="text-xs font-medium">Projets</span>
        </button>

        <h2 className="text-base font-semibold text-[var(--text-primary)] truncate flex-1">
          {project.name}
        </h2>

        {project.quoteAmount != null && project.quoteAmount > 0 && (
          <span className="text-xs text-[var(--text-muted)] flex-shrink-0">
            {formatEuro(project.quoteAmount)}
          </span>
        )}

        {billing.status !== 'none' && (
          <span
            className={`flex-shrink-0 text-[10px] font-bold uppercase px-2 py-0.5 rounded
                       ${PROJECT_BILLING_COLORS[billing.status].bg}
                       ${PROJECT_BILLING_COLORS[billing.status].text}`}
          >
            {PROJECT_BILLING_LABELS[billing.status]}
          </span>
        )}
      </div>

      {/* ── Onglets ──────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 flex border-b border-[var(--border-subtle)] px-5">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider border-b-2
                       transition-colors cursor-pointer -mb-px
                       ${activeTab === tab.key
                         ? 'border-[var(--accent-cyan)] text-[var(--accent-cyan)]'
                         : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                       }`}
          >
            {tab.label}
            {tab.count != null && tab.count > 0 && (
              <span className="ml-1.5 text-[9px] font-bold opacity-60">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Contenu des onglets ───────────────────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-hidden">

        {activeTab === 'produits' && (
          <div className="h-full flex flex-col">
            {/* Barre d'action produits */}
            <div className="flex-shrink-0 flex items-center justify-between px-5 py-2 border-b border-[var(--border-subtle)]">
              <span className="text-xs text-[var(--text-muted)]">
                {projectDeliverables.length} produit{projectDeliverables.length !== 1 ? 's' : ''}
              </span>
              <button
                type="button"
                onClick={() => openModal({ type: 'deliverable', mode: 'create', clientId: client.id })}
                className="flex items-center gap-1 text-xs font-medium text-[var(--accent-cyan)] hover:text-[var(--accent-cyan)]/80 transition-colors cursor-pointer"
              >
                <Plus />
                Ajouter
              </button>
            </div>
            <div className="flex-1 min-h-0">
              <ProductsMasterDetail
                products={projectDeliverables}
                selectedProduct={selectedProduct}
                selectedProductId={selectedProductId}
                onSelectProduct={setSelectedProductId}
                clientId={client.id}
              />
            </div>
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="h-full overflow-y-auto">
            {/* Import PLAUD */}
            <div className="px-5 py-3 border-b border-[var(--border-subtle)]">
              <button
                type="button"
                onClick={() => openReportUploadModal(client.id, project.id)}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold bg-[var(--accent-violet)]/10 text-[var(--accent-violet)] hover:bg-[var(--accent-violet)]/20 transition-colors cursor-pointer w-full"
                title="Importer un enregistrement PLAUD"
              >
                <PlaudLogo className="w-4 h-4" />
                Import PLAUD
              </button>
            </div>

            {projectDocs.length === 0 ? (
              <div className="flex items-center justify-center py-16">
                <p className="text-sm text-[var(--text-muted)]">Aucun document</p>
              </div>
            ) : (
              <div className="divide-y divide-[var(--border-subtle)]">
                {projectDocs.map((doc) => {
                  const badge = DOC_TYPE_BADGE[doc.type] ?? DOC_TYPE_BADGE['note'];
                  return (
                    <button
                      key={doc.id}
                      type="button"
                      onClick={() => openDocument(doc)}
                      className="w-full text-left px-5 py-3 flex items-center gap-3 hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer"
                    >
                      <span className={`flex-shrink-0 text-[10px] font-bold uppercase px-2 py-0.5 rounded ${badge.bg} ${badge.color}`}>
                        {badge.label}
                      </span>
                      <span className="text-sm text-[var(--text-primary)] truncate flex-1">
                        {doc.title}
                      </span>
                      <span className="flex-shrink-0 text-xs text-[var(--text-muted)]">
                        {new Date(doc.updatedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'facturation' && (
          <div className="h-full overflow-y-auto p-5">
            <BillingCardContent
              project={project}
              billing={billing}
              projectDeliverables={projectDeliverables}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── ProductsMasterDetail ─────────────────────────────────────────────────────

function ProductsMasterDetail({
  products,
  selectedProduct,
  selectedProductId,
  onSelectProduct,
  clientId,
}: {
  products: Deliverable[];
  selectedProduct: Deliverable | null;
  selectedProductId: string | null;
  onSelectProduct: (id: string) => void;
  clientId: string;
}) {
  const openModal = useAppStore((state) => state.openModal);
  const team = useAppStore((state) => state.team);
  const [isEditing, setIsEditing] = useState(false);

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <p className="text-sm text-[var(--text-muted)]">Aucun produit</p>
        <button
          type="button"
          onClick={() => openModal({ type: 'deliverable', mode: 'create', clientId })}
          className="text-sm font-medium px-4 py-2 rounded-lg bg-[var(--accent-cyan)]/10 text-[var(--accent-cyan)] hover:bg-[var(--accent-cyan)]/20 transition-colors cursor-pointer"
        >
          + Ajouter un produit
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Liste produits — 1/3 */}
      <div className="w-1/3 border-r border-[var(--border-subtle)] overflow-y-auto flex-shrink-0">
        <div className="p-2 space-y-0.5">
          {products.map((d) => {
            const isSelected = d.id === selectedProductId;
            const assignee = team.find((m) => m.id === d.assigneeId);
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => { onSelectProduct(d.id); setIsEditing(false); }}
                className={`w-full text-left px-4 py-3 rounded-lg transition-colors cursor-pointer
                           ${isSelected
                             ? 'bg-[var(--accent-cyan)]/10 border border-[var(--accent-cyan)]/30'
                             : 'hover:bg-[var(--bg-secondary)] border border-transparent'
                           }`}
              >
                <div className="flex items-center gap-2">
                  <p className={`text-sm font-medium truncate flex-1 ${isSelected ? 'text-[var(--accent-cyan)]' : 'text-[var(--text-primary)]'}`}>
                    {d.name}
                  </p>
                  {assignee && (
                    <span
                      className="flex-shrink-0 w-6 h-6 rounded-full text-[8px] font-bold flex items-center justify-center"
                      style={{ backgroundColor: assignee.color, color: '#000' }}
                      title={assignee.name}
                    >
                      {assignee.initials}
                    </span>
                  )}
                </div>
                <span className={`inline-block mt-1.5 text-xs px-2 py-0.5 rounded font-medium ${STATUS_COLOR[d.status]}`}>
                  {STATUS_LABEL[d.status]}
                </span>
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => openModal({ type: 'deliverable', mode: 'create', clientId })}
            className="w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium text-[var(--accent-cyan)]
                       hover:bg-[var(--accent-cyan)]/10 transition-colors cursor-pointer border border-dashed border-[var(--border-subtle)]"
          >
            + Ajouter
          </button>
        </div>
      </div>

      {/* Détail produit — 2/3 */}
      <div className="w-2/3 overflow-y-auto">
        {selectedProduct ? (
          isEditing ? (
            <ProductDetailInline product={selectedProduct} onClose={() => setIsEditing(false)} />
          ) : (
            <ProductDetailReadOnly product={selectedProduct} onEdit={() => setIsEditing(true)} />
          )
        ) : (
          <div className="flex items-center justify-center h-full py-8">
            <p className="text-sm text-[var(--text-muted)]">Sélectionnez un produit</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── ProductDetailReadOnly ────────────────────────────────────────────────────

const PencilIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

function ProductDetailReadOnly({ product, onEdit }: { product: Deliverable; onEdit: () => void }) {
  const team = useAppStore((state) => state.team);
  const assignee = team.find((m) => m.id === product.assigneeId);

  const hasBilling = (product.quoteAmount ?? 0) > 0 || (product.depositAmount ?? 0) > 0
    || (product.progressAmounts ?? []).some((a) => a > 0) || (product.balanceAmount ?? 0) > 0;

  const totalInvoiced = (product.depositAmount ?? 0)
    + (product.progressAmounts ?? []).reduce((s, a) => s + a, 0)
    + (product.balanceAmount ?? 0);

  return (
    <div className="p-5 space-y-5">
      {/* Header: nom + bouton edit */}
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold text-[var(--text-primary)]">{product.name}</h3>
        <button
          type="button"
          onClick={onEdit}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold
                     bg-[var(--accent-cyan)]/10 text-[var(--accent-cyan)]
                     hover:bg-[var(--accent-cyan)]/20 transition-colors cursor-pointer flex-shrink-0"
          title="Modifier ce produit"
        >
          <PencilIcon />
          Modifier
        </button>
      </div>

      {/* Badges row: statut + potentiel + assignee */}
      <div className="flex items-center gap-2.5 flex-wrap">
        <span className={`text-xs px-2.5 py-1 rounded font-semibold ${STATUS_COLOR[product.status]}`}>
          {STATUS_LABEL[product.status]}
        </span>
        {(product.margePotentielle ?? 0) > 0 && (
          <span className="text-xs px-2.5 py-1 rounded font-semibold bg-[var(--accent-violet)]/15 text-[var(--accent-violet)]">
            Pot. {formatEuro(product.margePotentielle!)}
          </span>
        )}
        {assignee && (
          <span
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{ backgroundColor: `color-mix(in srgb, ${assignee.color} 20%, transparent)`, color: assignee.color }}
          >
            <span
              className="w-5 h-5 rounded-full text-[8px] font-bold flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: assignee.color, color: '#000' }}
            >
              {assignee.initials}
            </span>
            {assignee.name}
          </span>
        )}
      </div>

      {/* Notes */}
      {product.notes && (
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed bg-[var(--bg-secondary)] rounded-lg px-4 py-3">
          {product.notes}
        </p>
      )}

      {/* Financier résumé */}
      {((product.prixFacturé ?? 0) > 0 || (product.coutSousTraitance ?? 0) > 0) && (
        <div className="rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)] px-4 py-3 space-y-2">
          {(product.prixFacturé ?? 0) > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-[var(--text-muted)]">Prix facturé</span>
              <span className="font-semibold text-[#22c55e]">{formatEuro(product.prixFacturé!)}</span>
            </div>
          )}
          {(product.coutSousTraitance ?? 0) > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-[var(--text-muted)]">
                Sous-traitance{product.externalContractor ? ` (${product.externalContractor})` : ''}
              </span>
              <span className="font-semibold text-[var(--accent-coral)]">{formatEuro(product.coutSousTraitance!)}</span>
            </div>
          )}
          {(product.prixFacturé ?? 0) > 0 && (product.coutSousTraitance ?? 0) > 0 && (
            <div className="flex justify-between text-sm pt-1.5 border-t border-dashed border-[var(--border-subtle)]">
              <span className="text-[var(--text-muted)]">Marge</span>
              <span className="font-semibold text-[var(--accent-violet)]">
                {formatEuro((product.prixFacturé ?? 0) - (product.coutSousTraitance ?? 0))}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Facturation résumé */}
      {hasBilling && (
        <div className="rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)] px-4 py-3 space-y-1.5">
          <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">Facturation</p>
          {(product.quoteAmount ?? 0) > 0 && (
            <ReadOnlyRow label="Devis" amount={product.quoteAmount!} date={product.quoteDate} />
          )}
          {(product.depositAmount ?? 0) > 0 && (
            <ReadOnlyRow label="Acompte" amount={product.depositAmount!} date={product.depositDate} />
          )}
          {(product.progressAmounts ?? []).map((amt, i) =>
            amt > 0 ? (
              <ReadOnlyRow
                key={i}
                label={`Avt ${(product.progressAmounts?.length ?? 0) > 1 ? i + 1 : ''}`}
                amount={amt}
                date={product.progressDates?.[i]}
              />
            ) : null
          )}
          {(product.balanceAmount ?? 0) > 0 && (
            <ReadOnlyRow label="Solde" amount={product.balanceAmount!} date={product.balanceDate} />
          )}
          {totalInvoiced > 0 && (
            <div className="flex justify-between text-sm font-semibold pt-2 border-t border-dashed border-[var(--border-subtle)]">
              <span className="text-[var(--text-primary)]">Total</span>
              <span className="text-[#22c55e]">{formatEuro(totalInvoiced)}</span>
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!hasBilling && (product.prixFacturé ?? 0) === 0 && !product.notes && !assignee && (
        <div className="text-center py-6">
          <p className="text-sm text-[var(--text-muted)]">Aucune info — cliquez Modifier pour compléter</p>
        </div>
      )}
    </div>
  );
}

function ReadOnlyRow({ label, amount, date }: { label: string; amount: number; date?: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-[var(--text-muted)]">{label}</span>
      <div className="flex items-center gap-3">
        {date && (
          <span className="text-[var(--text-muted)]">
            {new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
          </span>
        )}
        <span className="font-medium text-[var(--text-primary)]">{formatEuro(amount)}</span>
      </div>
    </div>
  );
}

// ─── Product status helpers ───────────────────────────────────────────────────

import type { DeliverableStatus } from '@/types';

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

function parseEur(raw: string): number {
  const cleaned = raw.replace(/[^\d,.\-]/g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
}

// ─── ProductDetailInline ─────────────────────────────────────────────────────

function ProductDetailInline({ product, onClose }: { product: Deliverable; onClose: () => void }) {
  const updateDeliverable = useAppStore((state) => state.updateDeliverable);
  const deleteDeliverable = useAppStore((state) => state.deleteDeliverable);
  const team = useAppStore((state) => state.team);

  // Local draft state — accumulate changes, persist only on explicit save
  const draftRef = useRef<Partial<Deliverable>>({});
  const [isDirty, setIsDirty] = useState(false);

  const draft = useCallback((data: Partial<Deliverable>) => {
    draftRef.current = { ...draftRef.current, ...data };
    setIsDirty(true);
  }, []);

  // Merged view: product + local draft (for computed fields like marge, solde)
  const merged = { ...product, ...draftRef.current };

  const handleSave = useCallback(() => {
    const data = draftRef.current;
    if (Object.keys(data).length === 0) return;

    // Recalculate billingStatus + totalInvoiced from merged state
    const final = { ...product, ...data };
    const deposit = final.depositAmount ?? 0;
    const progress = (final.progressAmounts ?? []).reduce((s: number, a: number) => s + a, 0);
    const balance = final.balanceAmount ?? 0;

    let billingStatus: BillingStatus = 'pending';
    if (balance > 0) billingStatus = 'balance';
    else if (progress > 0) billingStatus = 'progress';
    else if (deposit > 0) billingStatus = 'deposit';

    const totalInvoiced = deposit + progress + balance;

    updateDeliverable(product.id, { ...data, billingStatus, totalInvoiced });
    draftRef.current = {};
    setIsDirty(false);
    toast.success(`"${final.name}" enregistré`);
  }, [product, updateDeliverable]);

  return (
    <div className="p-5 space-y-5">
      {/* Header: Enregistrer + Fermer */}
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="text-sm font-semibold px-3 py-2 rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
        >
          Fermer
        </button>
        <button
          type="button"
          onClick={() => { handleSave(); onClose(); }}
          disabled={!isDirty}
          className={`text-sm font-semibold px-4 py-2 rounded-lg transition-colors
            ${isDirty
              ? 'bg-[var(--accent-cyan)] text-white hover:opacity-90 cursor-pointer'
              : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)]/40 cursor-not-allowed'
            }`}
        >
          Enregistrer
        </button>
      </div>

      {/* Nom */}
      <input
        key={`name-${product.id}`}
        type="text"
        defaultValue={product.name}
        onChange={(e) => draft({ name: e.target.value })}
        className="w-full text-base font-semibold text-[var(--text-primary)] bg-transparent border-b border-transparent
                   hover:border-[var(--border-subtle)] focus:border-[var(--accent-cyan)] focus:outline-none transition-colors py-1.5"
      />

      {/* Statut + Potentiel */}
      <div className="grid grid-cols-2 gap-3">
        <MiniField label="Statut">
          <select
            key={`status-${product.id}`}
            defaultValue={product.status}
            onChange={(e) => draft({ status: e.target.value as DeliverableStatus })}
            className="w-full text-sm bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-[var(--text-primary)] focus:border-[var(--accent-cyan)] focus:outline-none transition-colors"
          >
            {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </MiniField>
        <MiniField label="Potentiel">
          <div className="relative">
            <input
              key={`potentiel-${product.id}`}
              type="text"
              defaultValue={product.margePotentielle ? formatEuro(product.margePotentielle) : ''}
              placeholder="0 €"
              onBlur={(e) => draft({ margePotentielle: parseEur(e.target.value) })}
              className="w-full text-sm bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-[var(--accent-violet)] focus:border-[var(--accent-cyan)] focus:outline-none transition-colors pr-7"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--text-muted)]">€</span>
          </div>
        </MiniField>
      </div>

      {/* Assigné — Team chips */}
      <MiniField label="Assigné">
        <div className="flex flex-wrap gap-2">
          {team.map((member) => {
            const isSelected = (draftRef.current.assigneeId !== undefined ? draftRef.current.assigneeId : product.assigneeId) === member.id;
            return (
              <button
                key={member.id}
                type="button"
                onClick={() => draft({ assigneeId: isSelected ? undefined : member.id })}
                className="inline-flex items-center justify-center w-8 h-8 rounded-full text-[10px] font-bold transition-all cursor-pointer border hover:opacity-80"
                style={{
                  backgroundColor: isSelected ? member.color : 'transparent',
                  color: isSelected ? '#000' : member.color,
                  borderColor: member.color,
                }}
                title={member.name}
              >
                {member.initials}
              </button>
            );
          })}
          {team.length === 0 && (
            <p className="text-sm text-[var(--text-muted)]">Aucun membre</p>
          )}
        </div>
      </MiniField>

      {/* Notes */}
      <MiniField label="Notes">
        <textarea
          key={`notes-${product.id}`}
          defaultValue={product.notes ?? ''}
          placeholder="Notes..."
          rows={3}
          onChange={(e) => draft({ notes: e.target.value || undefined })}
          className="w-full text-sm bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-[var(--text-primary)] focus:border-[var(--accent-cyan)] focus:outline-none transition-colors resize-none leading-relaxed"
        />
      </MiniField>

      {/* Facturation produit */}
      <div className="rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)] p-4 space-y-3">
        <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
          Facturation
        </p>

        {/* Prix facturé */}
        <div className="grid grid-cols-[1fr_auto] gap-3 items-center">
          <label className="text-sm text-[var(--text-muted)]">Prix facturé</label>
          <div className="relative">
            <input
              key={`prix-${product.id}`}
              type="text"
              defaultValue={product.prixFacturé ? formatEuro(product.prixFacturé) : ''}
              placeholder="0 €"
              onBlur={(e) => draft({ prixFacturé: parseEur(e.target.value) })}
              className="text-sm bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-[#22c55e] focus:border-[var(--accent-cyan)] focus:outline-none transition-colors w-28 text-right"
            />
          </div>
        </div>

        {/* Coût sous-traitance */}
        <div className="grid grid-cols-[1fr_auto] gap-3 items-center">
          <label className="text-sm text-[var(--text-muted)]">Sous-traitance</label>
          <div className="relative">
            <input
              key={`st-${product.id}`}
              type="text"
              defaultValue={product.coutSousTraitance ? formatEuro(product.coutSousTraitance) : ''}
              placeholder="0 €"
              onBlur={(e) => draft({ coutSousTraitance: parseEur(e.target.value) })}
              className="text-sm bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-[var(--accent-coral)] focus:border-[var(--accent-cyan)] focus:outline-none transition-colors w-28 text-right"
            />
          </div>
        </div>

        {/* Prestataire */}
        <div className="grid grid-cols-[1fr_auto] gap-3 items-center">
          <label className="text-sm text-[var(--text-muted)]">Prestataire</label>
          <input
            key={`ext-${product.id}`}
            type="text"
            defaultValue={product.externalContractor ?? ''}
            placeholder="Nom"
            onChange={(e) => draft({ externalContractor: e.target.value || undefined })}
            className="text-sm bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-[var(--text-primary)] focus:border-[var(--accent-cyan)] focus:outline-none transition-colors w-28"
          />
        </div>

        {/* Marge */}
        {(merged.prixFacturé ?? 0) > 0 && (
          <div className="flex items-center justify-between text-sm pt-2 border-t border-dashed border-[var(--border-subtle)]">
            <span className="text-[var(--text-muted)]">Marge</span>
            <span className="font-semibold text-[var(--accent-violet)]">
              {formatEuro((merged.prixFacturé ?? 0) - (merged.coutSousTraitance ?? 0))}
            </span>
          </div>
        )}

        <div className="border-t border-[var(--border-subtle)] my-1" />

        <DraftBillingFieldRow label="Devis" amountKey="quoteAmount" dateKey="quoteDate" product={merged} onDraft={draft} />
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <DraftBillingFieldRow label="Acompte" amountKey="depositAmount" dateKey="depositDate" product={merged} onDraft={draft} />
          </div>
          {(merged.quoteAmount ?? 0) > 0 && (
            <button
              type="button"
              onClick={() => draft({ depositAmount: Math.round((merged.quoteAmount ?? 0) * 0.3) })}
              className="flex-shrink-0 text-xs font-semibold px-2 py-1 rounded bg-[var(--accent-cyan)]/10 text-[var(--accent-cyan)] hover:bg-[var(--accent-cyan)]/20 transition-colors cursor-pointer"
              title="30% du devis"
            >
              30%
            </button>
          )}
        </div>

        {(merged.progressAmounts ?? []).map((amt, i) => (
          <div key={i} className="grid grid-cols-[1fr_auto_auto_auto] gap-3 items-center">
            <label className="text-sm text-[var(--text-muted)]">
              Avancement {(merged.progressAmounts?.length ?? 0) > 1 ? i + 1 : ''}
            </label>
            <input
              type="text"
              defaultValue={amt ? formatEuro(amt) : ''}
              placeholder="0 €"
              onBlur={(e) => {
                const amounts = [...(merged.progressAmounts ?? [])];
                amounts[i] = parseEur(e.target.value);
                draft({ progressAmounts: amounts });
              }}
              className="text-sm bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-[var(--text-primary)] focus:border-[var(--accent-cyan)] focus:outline-none transition-colors w-24 text-right"
            />
            <input
              type="date"
              defaultValue={merged.progressDates?.[i] ?? ''}
              onChange={(e) => {
                const dates = [...(merged.progressDates ?? [])];
                dates[i] = e.target.value;
                draft({ progressDates: dates });
              }}
              className="text-sm bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-[var(--text-primary)] focus:border-[var(--accent-cyan)] focus:outline-none transition-colors w-36"
            />
            <button
              type="button"
              onClick={() => {
                const amounts = [...(merged.progressAmounts ?? [])];
                const dates = [...(merged.progressDates ?? [])];
                amounts.splice(i, 1);
                dates.splice(i, 1);
                draft({ progressAmounts: amounts, progressDates: dates });
              }}
              className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--accent-coral)] transition-colors cursor-pointer"
              title="Supprimer cet avancement"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={() => {
            draft({
              progressAmounts: [...(merged.progressAmounts ?? []), 0],
              progressDates: [...(merged.progressDates ?? []), ''],
            });
          }}
          className="text-sm text-[var(--accent-cyan)] hover:underline cursor-pointer"
        >
          + Avancement
        </button>

        {/* Solde — bouton pour solder automatiquement */}
        {(() => {
          const quoteAmt = merged.quoteAmount ?? 0;
          const stCost = merged.coutSousTraitance ?? 0;
          const deposit = merged.depositAmount ?? 0;
          const progress = (merged.progressAmounts ?? []).reduce((s: number, a: number) => s + a, 0);
          const balance = merged.balanceAmount ?? 0;
          const alreadyPaid = deposit + progress;
          const soldeCalc = Math.max(0, quoteAmt - stCost - alreadyPaid);
          const isSolde = balance > 0;
          const canSolder = quoteAmt > 0 && !isSolde && soldeCalc > 0;

          return (
            <div className="grid grid-cols-[1fr_auto_auto] gap-3 items-center">
              <label className="text-sm text-[var(--text-muted)]">Solde</label>
              {isSolde ? (
                <>
                  <span className="text-sm font-semibold text-[#22c55e] text-right w-24">
                    {formatEuro(balance)}
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      key={`balanceDate-${product.id}`}
                      type="date"
                      defaultValue={merged.balanceDate ?? ''}
                      onChange={(e) => draft({ balanceDate: e.target.value })}
                      className="text-sm bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-[var(--text-primary)] focus:border-[var(--accent-cyan)] focus:outline-none transition-colors w-36"
                    />
                    <button
                      type="button"
                      onClick={() => draft({ balanceAmount: 0, balanceDate: undefined })}
                      className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--accent-coral)] transition-colors cursor-pointer"
                      title="Annuler le solde"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                </>
              ) : (
                <button
                  type="button"
                  disabled={!canSolder}
                  onClick={() => {
                    const today = new Date().toISOString().slice(0, 10);
                    draft({ balanceAmount: soldeCalc, balanceDate: today });
                  }}
                  className={`col-span-2 text-sm font-semibold px-4 py-2 rounded-lg border border-dashed transition-colors
                    ${canSolder
                      ? 'border-[var(--accent-lime)]/40 text-[var(--accent-lime)] bg-[var(--accent-lime)]/5 hover:bg-[var(--accent-lime)]/15 cursor-pointer'
                      : 'border-[var(--border-subtle)] text-[var(--text-muted)]/40 cursor-not-allowed'
                    }`}
                  title={!quoteAmt ? 'Renseignez un devis d\'abord' : soldeCalc <= 0 ? 'Rien à solder' : `Solder ${formatEuro(soldeCalc)}`}
                >
                  {canSolder ? `Solder · ${formatEuro(soldeCalc)}` : 'Solder'}
                </button>
              )}
            </div>
          );
        })()}

        {/* Total */}
        {(() => {
          const total =
            (merged.depositAmount ?? 0) +
            (merged.progressAmounts ?? []).reduce((s, a) => s + a, 0) +
            (merged.balanceAmount ?? 0);
          if (total <= 0) return null;
          return (
            <div className="pt-3 mt-2 border-t border-dashed border-[var(--border-subtle)] flex justify-between text-sm font-semibold">
              <span className="text-[var(--text-primary)]">Total</span>
              <span className="text-[#22c55e]">{formatEuro(total)}</span>
            </div>
          );
        })()}
      </div>

      {/* Supprimer */}
      <div className="pt-2">
        <button
          type="button"
          onClick={() => {
            if (window.confirm(`Supprimer "${product.name}" ?`)) {
              deleteDeliverable(product.id);
            }
          }}
          className="text-xs text-[var(--accent-coral)] hover:underline cursor-pointer"
        >
          Supprimer ce produit
        </button>
      </div>
    </div>
  );
}

// Draft-aware billing field row (reads from merged state, writes to draft)
function DraftBillingFieldRow({
  label,
  amountKey,
  dateKey,
  product,
  onDraft,
}: {
  label: string;
  amountKey: keyof Deliverable;
  dateKey: keyof Deliverable;
  product: Partial<Deliverable> & Deliverable;
  onDraft: (data: Partial<Deliverable>) => void;
}) {
  const amount = product[amountKey] as number | undefined;
  const date = product[dateKey] as string | undefined;
  return (
    <div className="grid grid-cols-[1fr_auto_auto] gap-3 items-center">
      <label className="text-sm text-[var(--text-muted)]">{label}</label>
      <input
        key={`${String(amountKey)}-${product.id}`}
        type="text"
        defaultValue={amount ? formatEuro(amount) : ''}
        placeholder="0 €"
        onBlur={(e) => onDraft({ [amountKey]: parseEur(e.target.value) } as Partial<Deliverable>)}
        className="text-sm bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-[var(--text-primary)] focus:border-[var(--accent-cyan)] focus:outline-none transition-colors w-24 text-right"
      />
      <input
        key={`${String(dateKey)}-${product.id}`}
        type="date"
        defaultValue={date ?? ''}
        onChange={(e) => onDraft({ [dateKey]: e.target.value } as Partial<Deliverable>)}
        className="text-sm bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-[var(--text-primary)] focus:border-[var(--accent-cyan)] focus:outline-none transition-colors w-36"
      />
    </div>
  );
}

// ─── BillingCardContent ──────────────────────────────────────────────────────

function BillingCardContent({
  project,
  billing,
  projectDeliverables,
}: {
  project: Project;
  billing: ReturnType<typeof computeProjectBilling>;
  projectDeliverables: Deliverable[];
}) {
  const updateProject = useAppStore((state) => state.updateProject);
  const hasQuote = project.quoteAmount != null && project.quoteAmount > 0;

  const saveProject = useCallback(
    (data: Partial<Project>) => {
      updateProject(project.id, data);
      toast.success('Facturation projet mise à jour');
    },
    [project.id, updateProject]
  );

  return (
    <div className="space-y-6">
      {/* Niveau Projet */}
      <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Projet</span>
            {hasQuote && (
              <span
                className={`text-xs px-2.5 py-1 rounded font-medium
                           ${PROJECT_BILLING_COLORS[billing.status].bg}
                           ${PROJECT_BILLING_COLORS[billing.status].text}`}
              >
                {PROJECT_BILLING_LABELS[billing.status]}
              </span>
            )}
          </div>

          {hasQuote && billing.progressPercent > 0 && (
            <div className="mb-4">
              <div className="h-2 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[var(--accent-cyan)] transition-all"
                  style={{ width: `${Math.min(100, billing.progressPercent)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-[var(--text-muted)] mt-1">
                <span>{billing.progressPercent}%</span>
                <span>Reste : {formatEuro(billing.remaining)}</span>
              </div>
            </div>
          )}

          {/* Editable project billing fields */}
          <div className="rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)] p-4 space-y-3">
            {/* Potentiel — montant pipeline */}
            <div className="grid grid-cols-[1fr_auto] gap-3 items-center">
              <label className="text-sm text-[var(--accent-violet)]">Potentiel</label>
              <input
                key={`potentiel-${project.id}`}
                type="text"
                defaultValue={project.potentiel ? formatEuro(project.potentiel) : ''}
                placeholder="0 €"
                onBlur={(e) => saveProject({ potentiel: parseEur(e.target.value) })}
                className="text-sm bg-[var(--bg-secondary)] border border-[var(--accent-violet)]/30 rounded-lg px-3 py-2 text-[var(--accent-violet)] focus:border-[var(--accent-violet)] focus:outline-none transition-colors w-24 text-right placeholder:text-[var(--text-muted)]"
              />
            </div>

            <div className="border-t border-[var(--border-subtle)]" />

            <BillingFieldRow label="Devis" amountKey="quoteAmount" dateKey="quoteDate" product={project as unknown as Deliverable} onSave={(data) => saveProject(data as Partial<Project>)} />

            {hasQuote && (
              <>
                <BillingFieldRow label="Acompte" amountKey="depositAmount" dateKey="depositDate" product={project as unknown as Deliverable} onSave={(data) => saveProject(data as Partial<Project>)} />

                {(project.progressAmounts ?? []).map((amt, i) => (
                  <div key={`adv-${i}-${amt}`} className="grid grid-cols-[1fr_auto_auto_auto] gap-3 items-center">
                    <label className="text-sm text-[var(--text-muted)]">
                      Avancement {(project.progressAmounts?.length ?? 0) > 1 ? i + 1 : ''}
                    </label>
                    <input
                      key={`adv-amt-${i}-${project.progressAmounts?.length}`}
                      type="text"
                      defaultValue={amt ? formatEuro(amt) : ''}
                      placeholder="0 €"
                      onBlur={(e) => {
                        const amounts = [...(project.progressAmounts ?? [])];
                        amounts[i] = parseEur(e.target.value);
                        saveProject({ progressAmounts: amounts });
                      }}
                      className="text-sm bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-[var(--text-primary)] focus:border-[var(--accent-cyan)] focus:outline-none transition-colors w-24 text-right"
                    />
                    <input
                      key={`adv-date-${i}-${project.progressAmounts?.length}`}
                      type="date"
                      defaultValue={project.progressDates?.[i] ?? ''}
                      onChange={(e) => {
                        const dates = [...(project.progressDates ?? [])];
                        dates[i] = e.target.value;
                        saveProject({ progressDates: dates });
                      }}
                      className="text-sm bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-[var(--text-primary)] focus:border-[var(--accent-cyan)] focus:outline-none transition-colors w-36"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const amounts = [...(project.progressAmounts ?? [])];
                        const dates = [...(project.progressDates ?? [])];
                        amounts.splice(i, 1);
                        dates.splice(i, 1);
                        saveProject({ progressAmounts: amounts, progressDates: dates });
                      }}
                      className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--accent-coral)] transition-colors cursor-pointer"
                      title="Supprimer cet avancement"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => {
                    saveProject({
                      progressAmounts: [...(project.progressAmounts ?? []), 0],
                      progressDates: [...(project.progressDates ?? []), ''],
                    });
                  }}
                  className="text-sm text-[var(--accent-cyan)] hover:underline cursor-pointer"
                >
                  + Avancement
                </button>

                {/* Solde — bouton intelligent */}
                {(() => {
                  const devis = project.quoteAmount ?? 0;
                  const acompte = project.depositAmount ?? 0;
                  const avancements = (project.progressAmounts ?? []).reduce((s, v) => s + (v || 0), 0);
                  const soldeCalc = devis - acompte - avancements;
                  const hasBalance = (project.balanceAmount ?? 0) > 0;

                  if (hasBalance) {
                    return (
                      <div className="grid grid-cols-[1fr_auto_auto_auto] gap-3 items-center">
                        <label className="text-sm text-[var(--text-muted)]">Solde</label>
                        <span className="text-sm font-semibold text-[#22c55e] w-24 text-right">
                          {formatEuro(project.balanceAmount!)}
                        </span>
                        <input
                          key={`bal-date-${project.balanceAmount}`}
                          type="date"
                          defaultValue={project.balanceDate ?? ''}
                          onChange={(e) => saveProject({ balanceDate: e.target.value })}
                          className="text-sm bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-[var(--text-primary)] focus:border-[var(--accent-cyan)] focus:outline-none transition-colors w-36"
                        />
                        <button
                          type="button"
                          onClick={() => saveProject({ balanceAmount: 0, balanceDate: '' })}
                          className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--accent-coral)] transition-colors cursor-pointer"
                          title="Annuler le solde"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                      </div>
                    );
                  }

                  if (soldeCalc <= 0) return null;

                  return (
                    <button
                      type="button"
                      onClick={() => {
                        const today = new Date().toISOString().slice(0, 10);
                        saveProject({ balanceAmount: soldeCalc, balanceDate: today });
                      }}
                      className="w-full text-sm font-semibold text-[var(--accent-lime)] bg-[var(--accent-lime)]/10 hover:bg-[var(--accent-lime)]/20 border border-[var(--accent-lime)]/30 rounded-lg px-4 py-2.5 transition-colors cursor-pointer"
                    >
                      Solder · {formatEuro(soldeCalc)}
                    </button>
                  );
                })()}
              </>
            )}

            {!hasQuote && (
              <p className="text-sm text-[var(--text-muted)]">Renseignez un devis pour débloquer la facturation projet.</p>
            )}
          </div>

          {hasQuote && (
            <div className="mt-3 flex justify-between text-sm">
              <span className="text-[var(--text-muted)]">Total encaissé</span>
              <span className="font-semibold text-[#22c55e]">{formatEuro(billing.totalPaid)}</span>
            </div>
          )}
        </div>

      {/* Niveau Produits */}
      {projectDeliverables.length > 0 && (
        <div>
          <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
            Produits ({projectDeliverables.length})
          </span>
          <div className="mt-3 space-y-2">
            {projectDeliverables.map((d) => (
              <div key={d.id} className="flex items-center justify-between text-sm rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)] px-4 py-2.5">
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${BILLING_STATUS_DOT[d.billingStatus]}`} />
                  <span className="text-[var(--text-primary)] truncate">{d.name}</span>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-[var(--text-muted)]">{BILLING_STATUS_LABEL[d.billingStatus]}</span>
                  {d.totalInvoiced != null && d.totalInvoiced > 0 && (
                    <span className="font-semibold text-[#22c55e]">{formatEuro(d.totalInvoiced)}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function MiniField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1">
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
    <div className="grid grid-cols-[1fr_auto_auto] gap-3 items-center">
      <label className="text-sm text-[var(--text-muted)]">{label}</label>
      <input
        key={`${String(amountKey)}-${product.id}`}
        type="text"
        defaultValue={amount ? formatEuro(amount) : ''}
        placeholder="0 €"
        onBlur={(e) => onSave({ [amountKey]: parseEur(e.target.value) } as Partial<Deliverable>)}
        className="text-sm bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-[var(--text-primary)] focus:border-[var(--accent-cyan)] focus:outline-none transition-colors w-24 text-right"
      />
      <input
        key={`${String(dateKey)}-${product.id}`}
        type="date"
        defaultValue={date ?? ''}
        onChange={(e) => onSave({ [dateKey]: e.target.value } as Partial<Deliverable>)}
        className="text-sm bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-[var(--text-primary)] focus:border-[var(--accent-cyan)] focus:outline-none transition-colors w-36"
      />
    </div>
  );
}

function MiniRow({
  label,
  amount,
  date,
  highlight = false,
}: {
  label: string;
  amount: number | undefined;
  date?: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5 text-sm">
      <span className={highlight ? 'font-semibold text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}>
        {label}
      </span>
      <div className="flex items-center gap-3">
        {date && <span className="text-[var(--text-muted)]">{formatDate(date)}</span>}
        {amount != null && amount > 0 && (
          <span className={`font-semibold ${highlight ? 'text-[var(--text-primary)]' : 'text-[var(--text-primary)]'}`}>
            {formatEuro(amount)}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── OrphanProductsView ─────────────────────────────────────────────────────

interface OrphanProductsViewProps {
  client: Client;
  deliverables: Deliverable[];
  onBack: () => void;
}

export function OrphanProductsView({ client, deliverables, onBack }: OrphanProductsViewProps) {
  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    deliverables[0]?.id ?? null
  );
  const selectedProduct = deliverables.find((d) => d.id === selectedProductId) ?? null;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center gap-3 px-5 py-3 border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)]/30">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors group flex-shrink-0 cursor-pointer"
        >
          <span className="group-hover:-translate-x-0.5 transition-transform">
            <ArrowLeft />
          </span>
          <span className="text-xs font-medium">Projets</span>
        </button>

        <h2 className="text-base font-semibold text-[var(--text-primary)] truncate flex-1">
          Divers
        </h2>

        <span className="text-xs text-[var(--text-muted)] flex-shrink-0">
          {deliverables.length} produit{deliverables.length !== 1 ? 's' : ''} sans projet
        </span>
      </div>

      {/* Products master-detail */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {deliverables.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-[var(--text-muted)]">Aucun produit orphelin</p>
          </div>
        ) : (
          <ProductsMasterDetail
            products={deliverables}
            selectedProduct={selectedProduct}
            selectedProductId={selectedProductId}
            onSelectProduct={setSelectedProductId}
            clientId={client.id}
          />
        )}
      </div>
    </div>
  );
}

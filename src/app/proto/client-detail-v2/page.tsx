'use client';

/**
 * PROTO — Layout Phase 11 : Hiérarchie CLIENT > PROJETS > PRODUITS > PRODUIT
 *
 * - Fil d'Ariane au-dessus de sidebar projet + zone (jamais au-dessus sidebar client)
 * - Docs projet en sidebar (mode fixe)
 * - Barres "PROJETS" / "PRODUITS" pour indentation visuelle de la hiérarchie
 */

import { useState } from 'react';
import Link from 'next/link';

// ─── Mock Data ────────────────────────────────────────────────────────────────

interface MockContact { id: string; name: string; role: string; }
interface MockLink { id: string; title: string; url: string; }
interface MockDoc { id: string; type: string; title: string; }
interface MockProject {
  id: string; name: string; clientId: string; archived?: boolean;
  quoteAmount?: number; quoteDate?: string;
  depositAmount?: number; depositDate?: string;
  progressAmounts?: number[]; progressDates?: string[];
  balanceDate?: string;
}
interface MockTeamMember { id: string; name: string; initials: string; color: string; }
interface MockDeliverable {
  id: string; name: string; projectId?: string; status: string; dueDate?: string;
  prixFacturé?: number; coutSousTraitance?: number; margePotentielle?: number;
  deliveredAt?: string; externalContractor?: string; notes?: string; assigneeId?: string;
  // Facturation produit
  quoteAmount?: number; quoteDate?: string;
  depositAmount?: number; depositDate?: string;
  progressAmounts?: number[]; progressDates?: string[];
  balanceAmount?: number; balanceDate?: string;
  totalInvoiced?: number; billingStatus?: string;
  stHorsFacture?: boolean;
}

const MOCK_TEAM: MockTeamMember[] = [
  { id: 't1', name: 'Jérémy', initials: 'JD', color: '#22c55e' },
  { id: 't2', name: 'Marie', initials: 'MP', color: '#3b82f6' },
];

const MOCK_CLIENT = {
  id: 'sms',
  name: 'SMS',
  status: 'client' as const,
};

const MOCK_CONTACTS: MockContact[] = [
  { id: 'c1', name: 'Sophie Martin', role: 'Directrice marketing' },
  { id: 'c2', name: 'Thomas Leroy', role: 'Chef de projet' },
];

const MOCK_LINKS: MockLink[] = [
  { id: 'l1', title: 'Figma', url: '#' },
  { id: 'l2', title: 'Site internet', url: '#' },
];

const MOCK_DOCS: MockDoc[] = [
  { id: 'd1', type: 'brief', title: 'Brief créatif Re-branding' },
  { id: 'd2', type: 'report', title: 'CR Réunion 15 janv.' },
];

const MOCK_PROJECTS: MockProject[] = [
  { id: 'pr1', name: 'Re-branding 2026', clientId: 'sms', quoteAmount: 25000, quoteDate: '2025-11-15', depositAmount: 7500, depositDate: '2025-12-01', progressAmounts: [5000], progressDates: ['2026-02-01'], balanceDate: undefined },
  { id: 'pr2', name: 'Communication interne', clientId: 'sms' }, // Pas de devis global = facturation produit
];

const MOCK_DELIVERABLES: MockDeliverable[] = [
  { id: 'dl1', name: 'Direction artistique', projectId: 'pr1', status: 'completed', dueDate: '2026-02-15', prixFacturé: 8500, deliveredAt: '2026-02-14', assigneeId: 't1', notes: 'Livré en avance, validation client OK.',
    quoteAmount: 8500, quoteDate: '2025-11-20', depositAmount: 2550, depositDate: '2025-12-10', progressAmounts: [3000], progressDates: ['2026-01-15'], balanceAmount: 2950, balanceDate: '2026-02-14', totalInvoiced: 8500, billingStatus: 'balance', stHorsFacture: false },
  { id: 'dl2', name: 'Création pitch deck', projectId: 'pr1', status: 'in-progress', dueDate: '2026-03-01', prixFacturé: 3200, coutSousTraitance: 400, assigneeId: 't2', notes: 'En attente illustrations.',
    quoteAmount: 3200, quoteDate: '2025-12-01', depositAmount: 960, depositDate: '2026-01-10', totalInvoiced: 960, billingStatus: 'deposit' },
  { id: 'dl3', name: 'Site pré-lancement', projectId: 'pr1', status: 'pending', dueDate: '2026-03-15', prixFacturé: 12000, externalContractor: 'Agence web Partenaire', assigneeId: 't1',
    quoteAmount: 12000, quoteDate: '2026-01-20', totalInvoiced: 0, billingStatus: 'quoted' },
  { id: 'dl4', name: 'Charte éditoriale', projectId: 'pr2', status: 'pending', prixFacturé: 2100, quoteAmount: 2100, quoteDate: '2026-02-01', totalInvoiced: 0, billingStatus: 'quoted' },
  { id: 'dl5', name: 'Cartes de visite', status: 'completed', dueDate: '2026-01-20', prixFacturé: 1200, coutSousTraitance: 380, deliveredAt: '2026-01-18', externalContractor: 'Imprimerie Léo', margePotentielle: 420,
    quoteAmount: 1200, quoteDate: '2025-12-15', depositAmount: 360, depositDate: '2026-01-05', balanceAmount: 840, balanceDate: '2026-01-18', totalInvoiced: 1200, billingStatus: 'balance', stHorsFacture: true },
];

const MOCK_PROJECT_DOCS: Record<string, MockDoc[]> = {
  pr1: [
    { id: 'pd1', type: 'report', title: 'CR Atelier stratégie' },
    { id: 'pd2', type: 'brief', title: 'Brief web pré-lancement' },
  ],
  pr2: [
    { id: 'pd3', type: 'note', title: 'Notes réunion interne' },
  ],
};

// ─── Icons ────────────────────────────────────────────────────────────────────

const ArrowLeft = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M12 19l-7-7 7-7"/>
  </svg>
);

const ChevronRight = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);

const ChevronDown = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);

const formatEur = (n?: number) => n != null ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n) : null;

/** Simulation computeProjectBilling (aligné project-billing.ts) */
function computeMockProjectBilling(project: MockProject) {
  if (!project.quoteAmount || project.quoteAmount <= 0) return null;
  const projectProducts = MOCK_DELIVERABLES.filter(d => d.projectId === project.id);
  const totalProductInvoiced = projectProducts.reduce((s, d) => s + (d.totalInvoiced ?? 0), 0);
  const depositTotal = project.depositAmount ?? 0;
  const progressTotal = (project.progressAmounts ?? []).reduce((s, a) => s + a, 0);
  const totalProjectPayments = depositTotal + progressTotal;
  const totalPaid = totalProjectPayments + totalProductInvoiced;
  const remaining = Math.max(0, project.quoteAmount - totalPaid);
  const progressPercent = project.quoteAmount > 0 ? Math.min(100, Math.round((totalPaid / project.quoteAmount) * 100)) : 0;
  return { totalPaid, progressPercent, remaining, totalProductInvoiced, totalProjectPayments };
}

const BILLING_STATUS_LABEL: Record<string, string> = { pending: 'En attente', quoted: 'Devisé', deposit: 'Acompte', progress: 'Avancement', balance: 'Soldé' };
const BILLING_STATUS_DOT: Record<string, string> = { pending: 'bg-[var(--text-muted)]', quoted: 'bg-[var(--accent-cyan)]', deposit: 'bg-[var(--accent-amber)]', progress: 'bg-[var(--accent-violet)]', balance: 'bg-[var(--accent-lime)]' };

const User = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

const LinkIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
  </svg>
);

const File = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
    <line x1="10" y1="9" x2="8" y2="9"/>
  </svg>
);

const Folder = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </svg>
);

const Package = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/>
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
    <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
  </svg>
);

const BarChart = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"/>
    <line x1="12" y1="20" x2="12" y2="4"/>
    <line x1="6" y1="20" x2="6" y2="14"/>
  </svg>
);

function statusStyle(s: string) {
  if (s === 'completed') return 'bg-[var(--accent-lime)]/20 text-[var(--accent-lime)]';
  if (s === 'in-progress') return 'bg-[var(--accent-cyan)]/20 text-[var(--accent-cyan)]';
  return 'bg-[var(--text-muted)]/20 text-[var(--text-muted)]';
}

// ─── Section Card ─────────────────────────────────────────────────────────────

function SectionCard({ icon: Icon, title, count, children }: { icon: React.ElementType; title: string; count?: number; children: React.ReactNode }) {
  return (
    <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-subtle)] overflow-hidden">
      <div className="px-4 py-3 border-b border-[var(--border-subtle)] flex items-center gap-2">
        <Icon />
        <h3 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider">{title}</h3>
        {count != null && (
          <span className="text-xs text-[var(--text-muted)] bg-[var(--bg-tertiary)] px-2 py-0.5 rounded-full">{count}</span>
        )}
      </div>
      <div className="divide-y divide-[var(--border-subtle)]">{children}</div>
    </div>
  );
}

// ─── Billing cell (simulation BillingForm) ──────────────────────────────────────

/** Simulation des cellules BillingForm — aspect input, readOnly pour proto */
function BillingCell({ label, amount, date, validated }: { label: string; amount?: number; date?: string; validated?: boolean }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 border-t first:border-t-0 border-[var(--border-subtle)]">
      <div className="text-xs font-bold uppercase tracking-wider flex-shrink-0 text-[var(--text-muted)] w-20">{label}</div>
      <div className="flex-1 relative">
        <input
          type="text"
          readOnly
          value={amount != null ? amount.toLocaleString('fr-FR') : ''}
          placeholder="0"
          className={`w-full px-3 py-2 rounded-lg text-sm font-medium pr-8 transition-all ${validated ? 'bg-[#22c55e]/10 border-2 border-[#22c55e]' : 'bg-[var(--bg-secondary)] border border-[var(--border-subtle)]'} text-[var(--text-primary)] cursor-default`}
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-xs pointer-events-none">€</span>
      </div>
      {date != null && (
        <input type="date" readOnly value={date} className="flex-shrink-0 w-28 px-2 py-1.5 rounded-lg text-xs border border-[var(--border-subtle)] bg-[var(--bg-secondary)] text-[var(--text-primary)] cursor-default" />
      )}
    </div>
  );
}

// ─── ProjectEditOverlay — simulation ProjectModal (onglets Projet | Facturation) ──

function ProjectEditOverlay({ project, deliverables, onClose }: { project: MockProject; deliverables: MockDeliverable[]; onClose: () => void }) {
  const [tab, setTab] = useState<'projet' | 'facturation'>('projet');
  return (
    <div className="absolute inset-0 z-10 flex flex-col bg-[var(--bg-primary)] border-l-2 border-l-[var(--accent-cyan)]">
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)]/50">
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">{project.name}</h2>
        <button type="button" onClick={onClose} className="p-2 rounded hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)]" aria-label="Fermer">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div className="flex-shrink-0 flex gap-0 border-b border-[var(--border-subtle)]">
        <button type="button" onClick={() => setTab('projet')} className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider border-b-2 -mb-px ${tab === 'projet' ? 'border-[var(--accent-cyan)] text-[var(--accent-cyan)]' : 'border-transparent text-[var(--text-muted)]'}`}>
          Projet & produits
        </button>
        <button type="button" onClick={() => setTab('facturation')} className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider border-b-2 -mb-px ${tab === 'facturation' ? 'border-[var(--accent-cyan)] text-[var(--accent-cyan)]' : 'border-transparent text-[var(--text-muted)]'}`}>
          Facturation
        </button>
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        {tab === 'projet' && (
          <div className="flex-1 overflow-y-auto p-4 max-w-xl space-y-4 min-h-0">
            <p className="text-xs text-[var(--text-muted)]">Nom, client, devis global, sélection produits — formulaire édition projet (proto placeholder)</p>
            <div className="rounded-xl border border-[var(--border-subtle)] p-4 bg-[var(--bg-card)]">
              <p className="text-sm text-[var(--text-primary)]">Devis global: {project.quoteAmount ? formatEur(project.quoteAmount) : '—'}</p>
              <p className="text-xs text-[var(--text-muted)] mt-2">{deliverables.length} produit{deliverables.length !== 1 ? 's' : ''} dans ce projet</p>
            </div>
          </div>
        )}
        {tab === 'facturation' && (
          <ProjectFacturationView project={project} deliverables={deliverables} />
        )}
      </div>
    </div>
  );
}

// ─── ProjectFacturationView — aligné sur ProjectModal tab Facturation ─────────────

function ProjectFacturationView({ project, deliverables }: { project: MockProject; deliverables: MockDeliverable[] }) {
  const billing = computeMockProjectBilling(project);
  const hasQuote = project.quoteAmount && project.quoteAmount > 0;
  const overBudget = hasQuote && billing && billing.totalPaid > project.quoteAmount!;

  if (!hasQuote) {
    return (
      <div className="flex-1 overflow-y-auto p-6 min-h-0">
        <div className="max-w-xl rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6 text-center">
          <p className="text-sm text-[var(--text-muted)]">
            Ce projet n&apos;a pas de devis global. C&apos;est un simple regroupement — la facturation reste individuelle par produit.
          </p>
        </div>
      </div>
    );
  }

  if (!billing) return null;

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 min-h-0">
      <div className="max-w-4xl space-y-6">
        {/* Barre progression */}
        <div className="py-4 border-b border-[var(--border-subtle)]">
          <div className="flex justify-between mb-2">
            <span className="text-xs text-[var(--text-muted)]">Progression de facturation</span>
            <span className={`text-sm font-bold ${overBudget ? 'text-red-400' : 'text-[var(--text-primary)]'}`}>
              {formatEur(billing.totalPaid)} / {formatEur(project.quoteAmount)}
              {overBudget && <span className="text-xs ml-1 text-red-400">(dépassé de {formatEur(billing.totalPaid! - project.quoteAmount!)})</span>}
            </span>
          </div>
          <div className="h-2 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
            <div className={`h-full rounded-full transition-all ${overBudget ? 'bg-red-500' : 'bg-[var(--accent-cyan)]'}`} style={{ width: `${Math.min(100, billing.progressPercent)}%` }} />
          </div>
          <div className="flex justify-between text-[10px] text-[var(--text-muted)] mt-1">
            <span>{billing.progressPercent}%</span>
            <span>Restant : {formatEur(billing.remaining)}</span>
          </div>
        </div>

        {/* Grid 2 colonnes : Produits | Facturation projet */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 md:divide-x divide-[var(--border-subtle)]">
          <div className="p-4 space-y-2">
            <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">Produits ({deliverables.length})</h3>
            {deliverables.length === 0 ? (
              <p className="text-xs text-[var(--text-muted)] text-center py-6">Aucun produit dans ce projet</p>
            ) : (
              <div className="space-y-1">
                {deliverables.map(d => (
                  <div key={d.id} className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${BILLING_STATUS_DOT[d.billingStatus ?? 'pending']}`} />
                    <span className="text-xs font-medium text-[var(--text-primary)] truncate flex-1">{d.name}</span>
                    {d.prixFacturé != null && d.prixFacturé > 0 && (
                      <span className="text-[10px] font-semibold text-[#22c55e]">{formatEur(d.prixFacturé)}</span>
                    )}
                    <span className="text-[9px] text-[var(--text-muted)]">{BILLING_STATUS_LABEL[d.billingStatus ?? 'pending']}</span>
                    {d.totalInvoiced != null && d.totalInvoiced > 0 && (
                      <span className="text-[9px] font-medium text-[var(--accent-cyan)]">{formatEur(d.totalInvoiced)} facturé</span>
                    )}
                  </div>
                ))}
                <div className="flex justify-between text-[10px] text-[var(--text-muted)] pt-2 border-t border-[var(--border-subtle)] mt-2 px-2.5">
                  <span>Total facturé produits</span>
                  <span className="font-semibold text-[var(--accent-cyan)]">{formatEur(billing.totalProductInvoiced)}</span>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 space-y-3">
            <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">Facturation projet</h3>
            <div className="space-y-2 rounded-lg border border-[var(--border-subtle)] overflow-hidden divide-y divide-[var(--border-subtle)]">
              <BillingCell label="DEVIS" amount={project.quoteAmount} date={project.quoteDate} validated />
              <BillingCell label="ACOMPTE" amount={project.depositAmount} date={project.depositDate} validated={!!project.depositAmount} />
              {(project.progressAmounts ?? []).map((amt, i) => (
                <BillingCell key={i} label={`AVA. ${i + 1}`} amount={amt} date={project.progressDates?.[i]} validated />
              ))}
              {billing.remaining <= 0.01 && (
                <BillingCell
                  label="SOLDE"
                  amount={Math.max(0, (project.quoteAmount ?? 0) - (project.depositAmount ?? 0) - (project.progressAmounts ?? []).reduce((s, a) => s + a, 0))}
                  date={project.balanceDate}
                  validated
                />
              )}
            </div>
            <div className="pt-3 border-t border-[var(--border-subtle)] space-y-1.5">
              <div className="flex justify-between text-[10px]">
                <span className="text-[var(--text-muted)]">Paiements projet</span>
                <span className="font-medium text-[var(--text-primary)]">{formatEur(billing.totalProjectPayments)}</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-[var(--text-muted)]">Facturé produits</span>
                <span className="font-medium text-[var(--accent-cyan)]">{formatEur(billing.totalProductInvoiced)}</span>
              </div>
              <div className="flex justify-between text-xs font-semibold pt-1 border-t border-dashed border-[var(--border-subtle)]">
                <span className="text-[var(--text-primary)]">Total payé</span>
                <span className={overBudget ? 'text-red-400' : 'text-[#22c55e]'}>{formatEur(billing.totalPaid)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── ProductDetailView — aligné sur DeliverableForm ─────────────────────────────

function ProductDetailView({ product, productProject, getAssignee }: {
  product: MockDeliverable;
  productProject: MockProject | null;
  getAssignee: (id?: string) => MockTeamMember | null;
}) {
  const assignee = getAssignee(product.assigneeId);
  const hasProjectQuote = productProject?.quoteAmount && productProject.quoteAmount > 0;

  return (
    <div className="p-4 sm:p-6 max-w-2xl space-y-6">
      {/* Card principale : infos produit */}
      <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-subtle)] overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--border-subtle)] flex items-center gap-2">
          <Package />
          <h2 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider">{product.name}</h2>
        </div>
        <div className="px-4 py-4 space-y-4">
          {/* Client + Projet */}
          <div className="flex flex-wrap gap-4 text-sm">
            <span className="font-semibold text-[var(--text-muted)]">Client:</span>
            <span className="text-[var(--text-primary)]">{MOCK_CLIENT.name}</span>
            {productProject && (
              <>
                <span className="text-[var(--text-muted)]">·</span>
                <span className="font-semibold text-[var(--text-muted)]">Projet:</span>
                <span className="text-[var(--text-primary)]">{productProject.name}</span>
              </>
            )}
          </div>
          {/* Statut + Échéance */}
          <div className="flex flex-wrap gap-4 items-center">
            <div>
              <span className="font-semibold text-[var(--text-muted)] text-sm">Statut:</span>{' '}
              <span className={`inline-block text-[10px] px-1.5 py-0.5 rounded ${statusStyle(product.status)}`}>{product.status}</span>
            </div>
            {product.dueDate && (
              <>
                <span className="text-[var(--text-muted)] text-sm">·</span>
                <span className="text-sm text-[var(--text-primary)]">
                  <span className="font-semibold text-[var(--text-muted)]">Échéance:</span> {product.dueDate}
                </span>
              </>
            )}
          </div>
          {/* Assigné à */}
          {assignee && (
            <div className="flex items-center gap-2 text-sm">
              <span className="font-semibold text-[var(--text-muted)]">Assigné à:</span>
              <span className="inline-flex items-center gap-1.5" title={assignee.name}>
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ backgroundColor: assignee.color }}>{assignee.initials}</span>
                <span className="text-[var(--text-primary)]">{assignee.name}</span>
              </span>
            </div>
          )}
          {/* Budget */}
          <div className="space-y-1 text-sm">
            <div className="font-semibold text-[var(--text-muted)]">Budget</div>
            <div className="flex flex-wrap gap-3">
              {product.prixFacturé != null && (
                <span className="text-[var(--text-primary)]">{formatEur(product.prixFacturé)} facturé</span>
              )}
              {product.coutSousTraitance != null && product.coutSousTraitance > 0 && (
                <span className="text-red-400/80">− {formatEur(product.coutSousTraitance)} sous-traitance</span>
              )}
              {product.margePotentielle != null && product.margePotentielle > 0 && (
                <span className="text-[var(--accent-lime)]">Marge: {formatEur(product.margePotentielle)}</span>
              )}
            </div>
          </div>
          {/* Livré le */}
          {product.deliveredAt && (
            <div className="text-sm">
              <span className="font-semibold text-[var(--text-muted)]">Livré le:</span>{' '}
              <span className="text-[var(--text-primary)]">{product.deliveredAt}</span>
            </div>
          )}
          {/* Prestataire */}
          {product.externalContractor && (
            <div className="text-sm">
              <span className="font-semibold text-[var(--text-muted)]">Prestataire:</span>{' '}
              <span className="text-[var(--text-primary)]">{product.externalContractor}</span>
            </div>
          )}
          {/* Notes */}
          {product.notes && (
            <div className="text-sm pt-2 border-t border-[var(--border-subtle)]">
              <span className="font-semibold text-[var(--text-muted)] block mb-1">Notes</span>
              <p className="text-[var(--text-primary)] whitespace-pre-wrap">{product.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Facturation produit — uniquement quand facturation individuelle (pas de devis projet) */}
      {!hasProjectQuote && (
        <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-subtle)] overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--border-subtle)] flex items-center gap-2">
            <span className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider">💰 Facturation produit</span>
          </div>
          <div className="divide-y divide-[var(--border-subtle)]">
            <div className="rounded-lg overflow-hidden divide-y divide-[var(--border-subtle)]">
              <BillingCell label="DEVIS" amount={product.quoteAmount ?? undefined} date={product.quoteDate} validated={!!product.quoteAmount} />
              <BillingCell label="ACOMPTE" amount={product.depositAmount} date={product.depositDate} validated={!!product.depositAmount} />
              {(product.progressAmounts ?? []).map((amt, i) => (
                <BillingCell key={i} label={`AVA. ${i + 1}`} amount={amt} date={product.progressDates?.[i]} validated />
              ))}
              {product.balanceAmount != null && product.balanceAmount > 0 ? (
                <BillingCell label="SOLDE" amount={product.balanceAmount} date={product.balanceDate} validated />
              ) : (() => {
                const devis = product.quoteAmount ?? 0;
                const acompte = product.depositAmount ?? 0;
                const avancementsTotal = (product.progressAmounts ?? []).reduce((s, a) => s + a, 0);
                const soldeCalcule = Math.max(0, devis - acompte - avancementsTotal);
                return (
                  <div className="flex items-center gap-2 px-3 py-2 border-t border-[var(--border-subtle)]">
                    <div className="text-xs font-bold uppercase tracking-wider flex-shrink-0 text-[var(--text-muted)] w-20">SOLDE</div>
                    <div className={`flex-1 px-3 py-2 rounded-lg text-xs border ${soldeCalcule > 0 ? 'border-dashed border-[var(--accent-cyan)]/50 text-[var(--accent-cyan)]' : 'border-dashed border-[var(--border-subtle)] text-[var(--text-muted)]'} bg-[var(--bg-secondary)]`}>
                      {soldeCalcule > 0 ? `Solder · ${soldeCalcule.toFixed(0)} €` : 'Solde · 0 €'}
                    </div>
                  </div>
                );
              })()}
              <BillingCell label="S-T" amount={product.coutSousTraitance} validated={!!product.coutSousTraitance} />
            </div>
            {product.coutSousTraitance != null && product.coutSousTraitance > 0 && (
              <div className="px-3 py-2 flex items-center justify-end gap-2">
                <span className="text-[10px] text-[var(--text-muted)]">Mode</span>
                <div className="flex items-center gap-1.5 text-[10px] font-medium">
                  <div className={`w-6 h-3.5 rounded-full ${product.stHorsFacture ? 'bg-[var(--accent-lime)]' : 'bg-red-500'}`} />
                  <span className={product.stHorsFacture ? 'text-[var(--accent-lime)]' : 'text-red-500'}>
                    {product.stHorsFacture ? 'Hors' : 'Déduit'}
                  </span>
                </div>
              </div>
            )}
            {product.margePotentielle != null && !product.quoteAmount && !product.depositAmount && !(product.progressAmounts?.length ?? 0) && (
              <div className="px-3 py-2 bg-[var(--accent-violet)]/5 rounded-lg border border-[var(--accent-violet)]/20">
                <span className="text-[10px] text-[var(--text-muted)] uppercase">Marge potentielle</span>
                <span className="text-sm font-medium text-[var(--accent-violet)] ml-2">{formatEur(product.margePotentielle)}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Breadcrumb : CLIENT > PROJETS > [Projet] > PRODUITS > [Produit] ───────────

function Breadcrumb({
  level,
  selectedProject,
  selectedProduct,
  onClient,
  onProject,
}: {
  level: 'client' | 'project' | 'product';
  selectedProject: MockProject | null;
  selectedProduct: MockDeliverable | null;
  onClient: () => void;
  onProject: () => void;
}) {
  const link = (label: string, onClick: () => void) => (
    <button type="button" onClick={onClick} className="text-[var(--accent-cyan)] hover:underline">
      {label}
    </button>
  );
  const sep = () => <ChevronRight />;
  const current = (label: string) => <span className="font-semibold text-[var(--text-primary)]">{label}</span>;

  return (
    <nav className="flex items-center gap-2 text-sm text-[var(--text-muted)]" aria-label="Fil d'Ariane">
      {link(MOCK_CLIENT.name, onClient)}
      {sep()}
      {level === 'client' ? (
        current('Projets')
      ) : (
        <>
          {level === 'project' && selectedProject ? (
            <>
              {link('Projets', onClient)}
              {sep()}
              {current(selectedProject.name)}
            </>
          ) : level === 'product' && selectedProduct ? (
            <>
              {link('Projets', onClient)}
              {sep()}
              {selectedProject ? (
                <>
                  {link(selectedProject.name, onProject)}
                  {sep()}
                </>
              ) : (
                <>
                  <span>Sans projet</span>
                  {sep()}
                </>
              )}
              <span className="text-[var(--text-muted)]">Produits</span>
              {sep()}
              {current(selectedProduct.name)}
            </>
          ) : null}
        </>
      )}
    </nav>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ClientDetailV2ProtoPage() {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [projectEditOpen, setProjectEditOpen] = useState(false);
  const [collapsedProjectIds, setCollapsedProjectIds] = useState<Set<string>>(new Set());

  const selectedProject = selectedProjectId ? MOCK_PROJECTS.find(p => p.id === selectedProjectId) : null;
  const selectedProduct = selectedProductId ? MOCK_DELIVERABLES.find(d => d.id === selectedProductId) : null;
  const projectDeliverables = selectedProjectId ? MOCK_DELIVERABLES.filter(d => d.projectId === selectedProjectId) : [];
  const projectDocs = selectedProjectId ? (MOCK_PROJECT_DOCS[selectedProjectId] ?? []) : [];

  const projectsWithProducts = MOCK_PROJECTS.map(p => ({
    ...p,
    products: MOCK_DELIVERABLES.filter(d => d.projectId === p.id),
  }));
  const orphanProducts = MOCK_DELIVERABLES.filter(d => !d.projectId);
  const productProject = selectedProduct?.projectId ? MOCK_PROJECTS.find(p => p.id === selectedProduct.projectId) ?? null : null;
  const getAssignee = (id?: string) => id ? MOCK_TEAM.find(t => t.id === id) : null;

  const isProjectView = !!selectedProjectId;
  const toggleCollapse = (id: string) => setCollapsedProjectIds(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  });
  const breadcrumbLevel: 'client' | 'project' | 'product' =
    selectedProductId ? 'product' : selectedProjectId ? 'project' : 'client';

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-primary)]">
      {/* Header — Retour + Client */}
      <header className="flex-shrink-0 px-4 sm:px-6 py-3 border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)]/50">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors group"
          >
            <span className="group-hover:-translate-x-0.5 transition-transform"><ArrowLeft /></span>
            <span className="text-xs font-medium">Retour</span>
          </Link>
          <h1 className="text-lg font-semibold text-[var(--text-primary)] truncate">{MOCK_CLIENT.name}</h1>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[var(--accent-cyan)]/20 text-[var(--accent-cyan)]">
            Client
          </span>
          <span className="text-[var(--accent-violet)]/60 text-[10px] uppercase tracking-wider">· proto</span>
        </div>
      </header>

      {/* Corps : Sidebar client | Main */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        <aside className="flex-shrink-0 w-72 xl:w-80 border-r border-[var(--border-subtle)] bg-[var(--bg-secondary)]/30 overflow-y-auto">
          <div className="p-4 space-y-6">
            <SectionCard icon={User} title="Contacts" count={MOCK_CONTACTS.length}>
              {MOCK_CONTACTS.map(c => (
                <div key={c.id} className="px-4 py-2.5">
                  <span className="font-semibold text-[var(--text-primary)]">{c.name}</span>
                  <span className="text-xs text-[var(--text-muted)] ml-2">{c.role}</span>
                </div>
              ))}
            </SectionCard>
            <SectionCard icon={LinkIcon} title="Liens" count={MOCK_LINKS.length}>
              {MOCK_LINKS.map(l => (
                <a key={l.id} href={l.url} className="block px-4 py-2.5 text-[var(--accent-cyan)] hover:underline truncate">
                  {l.title}
                </a>
              ))}
            </SectionCard>
            <SectionCard icon={File} title="Documents" count={MOCK_DOCS.length}>
              {MOCK_DOCS.map(d => (
                <div key={d.id} className="px-4 py-2.5 text-sm text-[var(--text-primary)] truncate">{d.title}</div>
              ))}
            </SectionCard>
          </div>
        </aside>

        <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
          {/* Fil d'Ariane : CLIENT > PROJETS > [Projet] > PRODUITS > [Produit] — au-dessus de la zone (jamais sidebar client) */}
          <div className="flex-shrink-0 px-4 py-3 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]">
              <Breadcrumb
                level={breadcrumbLevel}
                selectedProject={selectedProject}
                selectedProduct={selectedProduct ?? null}
                onClient={() => { setSelectedProjectId(null); setSelectedProductId(null); }}
                onProject={() => setSelectedProductId(null)}
              />
            </div>

          <div className="flex-1 flex min-h-0 overflow-hidden relative">
            {/* Sidebar projet — cascade : projets en haut, docs en dessous */}
            {isProjectView && selectedProject && (
              <aside className="flex-shrink-0 w-56 xl:w-64 border-r border-[var(--border-subtle)] bg-[var(--bg-secondary)]/30 overflow-y-auto">
                <div className="p-4 space-y-4">
                  <SectionCard icon={Folder} title="Projets" count={MOCK_PROJECTS.length}>
                    {MOCK_PROJECTS.map(p => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => { setSelectedProjectId(p.id); setSelectedProductId(null); setProjectEditOpen(false); }}
                        className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${selectedProjectId === p.id ? 'bg-[var(--accent-cyan)]/15 text-[var(--accent-cyan)] font-semibold border-l-2 border-[var(--accent-cyan)]' : 'text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'}`}
                      >
                        {p.name}
                      </button>
                    ))}
                  </SectionCard>
                  <SectionCard icon={File} title="Documents projet" count={projectDocs.length}>
                    {projectDocs.map(d => (
                      <div key={d.id} className="px-4 py-2.5 text-sm text-[var(--text-primary)] truncate">{d.title}</div>
                    ))}
                  </SectionCard>
                </div>
              </aside>
            )}

            <div className="flex-1 min-w-0 flex overflow-hidden">
            {/* Vue Client : PROJETS — hiérarchie niveau 2 */}
            {!selectedProjectId && !selectedProductId && (
              <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                <div className="max-w-4xl space-y-4">
                  <div className="px-4 py-2 text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest border-l-2 border-[var(--accent-cyan)]">
                    Projets
                  </div>
                  <div className="space-y-4">
                      {projectsWithProducts.map(p => {
                        const isCollapsed = collapsedProjectIds.has(p.id);
                        const totalBudget = p.products.reduce((sum, d) => sum + (d.prixFacturé ?? 0), 0);
                        return (
                          <div
                            key={p.id}
                            className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-subtle)] overflow-hidden"
                          >
                            <button
                              type="button"
                              onClick={() => { setSelectedProjectId(p.id); setProjectEditOpen(false); }}
                              className="w-full flex items-center gap-2 px-5 py-3 text-left hover:bg-[var(--bg-secondary)] transition-colors"
                            >
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); toggleCollapse(p.id); }}
                                className="p-0.5 -ml-1 rounded hover:bg-[var(--bg-tertiary)]"
                              >
                                <span className={`inline-block transition-transform ${isCollapsed ? '-rotate-90' : ''}`}>
                                  <ChevronDown />
                                </span>
                              </button>
                              <Folder className="text-[var(--accent-cyan)]" />
                              <span className="text-sm font-semibold text-[var(--accent-cyan)] uppercase tracking-wider flex-1 text-left">{p.name}</span>
                              <span className="text-[10px] text-[var(--text-muted)]">{p.products.length} produit{p.products.length !== 1 ? 's' : ''}</span>
                              {totalBudget > 0 && (
                                <span className="text-xs font-semibold text-[var(--text-primary)] tabular-nums">
                                  {formatEur(totalBudget)}
                                </span>
                              )}
                            </button>
                            {!isCollapsed && (
                              <div className="border-t border-[var(--border-subtle)] bg-[var(--bg-secondary)]/20 divide-y divide-[var(--border-subtle)]">
                                {p.products.map(d => (
                                  <button
                                    key={d.id}
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); setSelectedProjectId(p.id); setSelectedProductId(d.id); setProjectEditOpen(false); }}
                                    className="w-full px-6 py-2 flex items-center justify-between text-left hover:bg-[var(--bg-secondary)]/50 transition-colors"
                                  >
                                    <span className="text-xs text-[var(--text-primary)]">{d.name}</span>
                                    <span className="flex items-center gap-2">
                                      {(d.prixFacturé != null || d.coutSousTraitance != null) && (
                                        <span className="text-[10px] text-[var(--text-muted)]">
                                          {d.prixFacturé != null && formatEur(d.prixFacturé)}
                                          {d.coutSousTraitance != null && d.coutSousTraitance > 0 && (
                                            <span className="text-red-400/80 ml-1">−{formatEur(d.coutSousTraitance)}</span>
                                          )}
                                        </span>
                                      )}
                                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${statusStyle(d.status)}`}>{d.status}</span>
                                    </span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {orphanProducts.length > 0 && (
                        <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-subtle)] overflow-hidden">
                          <div className="px-5 py-3 border-b border-[var(--border-subtle)] flex items-center justify-between">
                            <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase">Sans projet</span>
                            <span className="text-[10px] text-[var(--text-muted)]">{orphanProducts.length} produit{orphanProducts.length !== 1 ? 's' : ''}</span>
                          </div>
                          <div className="divide-y divide-[var(--border-subtle)]">
                            {orphanProducts.map(d => (
                              <button
                                key={d.id}
                                type="button"
                                onClick={() => setSelectedProductId(d.id)}
                                className="w-full px-6 py-2 flex items-center justify-between text-left hover:bg-[var(--bg-secondary)]/50 transition-colors"
                              >
                                <span className="text-xs text-[var(--text-primary)]">{d.name}</span>
                                <span className="flex items-center gap-2">
                                  {(d.prixFacturé != null || d.coutSousTraitance != null) && (
                                    <span className="text-[10px] text-[var(--text-muted)]">
                                      {d.prixFacturé != null && formatEur(d.prixFacturé)}
                                      {d.coutSousTraitance != null && d.coutSousTraitance > 0 && (
                                        <span className="text-red-400/80 ml-1">−{formatEur(d.coutSousTraitance)}</span>
                                      )}
                                    </span>
                                  )}
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${statusStyle(d.status)}`}>{d.status}</span>
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                  </div>
                </div>
              </div>
            )}

            {/* Vue Projet : produits + détail. Facturation = via "Modifier" (ProjectModal) */}
            {selectedProjectId && selectedProject && !projectEditOpen && (
              <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
                <div className="flex-shrink-0 px-4 py-2.5 flex items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)]/20 border-l-2 border-l-[var(--accent-cyan)]">
                  <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">Produits</span>
                  <button
                    type="button"
                    onClick={() => setProjectEditOpen(true)}
                    className="text-xs font-semibold text-[var(--accent-cyan)] hover:underline"
                  >
                    Modifier
                  </button>
                </div>
                <div className="flex-1 flex min-h-0 overflow-hidden">
                  <div className="flex-shrink-0 overflow-y-auto border-r border-[var(--border-subtle)] w-72 xl:w-80">
                    <div className="p-4 space-y-4">
                      <SectionCard icon={Package} title="Liste" count={projectDeliverables.length}>
                        {projectDeliverables.map(d => (
                          <button
                            key={d.id}
                            type="button"
                            onClick={() => setSelectedProductId(selectedProductId === d.id ? null : d.id)}
                            className={`w-full px-4 py-2 flex items-center justify-between text-left transition-colors cursor-pointer ${selectedProductId === d.id ? 'bg-[var(--accent-cyan)]/15 border-l-2 border-[var(--accent-cyan)]' : 'hover:bg-[var(--bg-secondary)]'}`}
                          >
                            <span className="text-xs text-[var(--text-primary)]">{d.name}</span>
                            <span className="flex items-center gap-2">
                              {(d.prixFacturé != null || d.coutSousTraitance != null) && (
                                <span className="text-[10px] text-[var(--text-muted)]">
                                  {d.prixFacturé != null && formatEur(d.prixFacturé)}
                                  {d.coutSousTraitance != null && d.coutSousTraitance > 0 && (
                                    <span className="text-red-400/80 ml-1">−{formatEur(d.coutSousTraitance)}</span>
                                  )}
                                </span>
                              )}
                              <span className={`text-[10px] px-1.5 py-0.5 rounded ${statusStyle(d.status)}`}>{d.status}</span>
                            </span>
                          </button>
                        ))}
                      </SectionCard>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 overflow-y-auto bg-[var(--bg-primary)]">
                    {selectedProduct ? (
                      <ProductDetailView product={selectedProduct} productProject={productProject} getAssignee={getAssignee} />
                    ) : (
                      <div className="flex-1 flex items-center justify-center p-8">
                        <p className="text-sm text-[var(--text-muted)]">Sélectionne un produit dans la liste</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Overlay édition projet (simulation ProjectModal) — Projet | Facturation */}
            {selectedProjectId && selectedProject && projectEditOpen && (
              <ProjectEditOverlay project={selectedProject} deliverables={projectDeliverables} onClose={() => setProjectEditOpen(false)} />
            )}

            {/* Produit orphelin : détail seul (breadcrumb déjà au-dessus) */}
            {selectedProductId && !selectedProjectId && selectedProduct && (
              <div className="flex-1 overflow-y-auto">
                <ProductDetailView product={selectedProduct} productProject={null} getAssignee={getAssignee} />
              </div>
            )}
          </div>
          </div>
        </main>
      </div>

      {/* Rétroplanning — niveau client, footer full width (plusieurs projets) */}
      <footer className="flex-shrink-0 border-t border-[var(--border-subtle)] bg-[var(--bg-secondary)]/30">
        <div className="px-4 sm:px-6 py-4">
          <div className="flex items-center gap-2 mb-3">
            <BarChart />
            <h2 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Rétroplanning</h2>
          </div>
          <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-subtle)] py-12 text-center text-xs text-[var(--text-muted)]">
            Gantt simplifié — niveau client (tous les projets)
          </div>
        </div>
      </footer>
    </div>
  );
}

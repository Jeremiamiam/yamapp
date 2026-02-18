'use client';

/**
 * PROTO — Vue Production avec groupement "nomProjet"
 * Layout identique à ProductionView.tsx
 * Ajouts proto : ProjetModal + ProductModal + boutons démo
 */

import { useState, useMemo } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

type ProdStatus = 'to_quote' | 'pending' | 'in-progress' | 'completed';
type BillingStatus = 'to_quote' | 'quoted' | 'deposit' | 'balance';

interface MockDeliverable {
  id: string;
  clientId: string;
  clientName: string;
  nomProjet?: string;
  depositAmount?: number;
  depositDate?: string;
  name: string;
  status: ProdStatus;
  prixFacturé?: number;
  margePotentielle?: number;
  billingStatus: BillingStatus;
  isOption?: boolean;
  assigneeInitials?: string;
  assigneeColor?: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const CLIENT_COLOR: Record<string, string> = {
  sms:  '#6366f1',
  cci:  '#06b6d4',
  acme: '#f59e0b',
};

interface MockContact { name: string; role: string; email: string; phone?: string; }
interface MockLink { label: string; url: string; icon: string; }
interface MockClient {
  id: string; name: string; status: 'client' | 'prospect';
  contacts: MockContact[]; links: MockLink[];
}

const MOCK_CLIENTS: Record<string, MockClient> = {
  sms: {
    id: 'sms', name: 'SMS', status: 'client',
    contacts: [
      { name: 'Sophie Martin',  role: 'Directrice marketing', email: 'sophie@sms.fr',    phone: '+33 6 12 34 56 78' },
      { name: 'Thomas Leroy',   role: 'Chef de projet',       email: 'thomas@sms.fr' },
    ],
    links: [
      { label: 'Figma',          url: '#', icon: 'figma'  },
      { label: 'Site internet',  url: '#', icon: 'globe'  },
      { label: 'Drive',          url: '#', icon: 'folder' },
    ],
  },
  cci: {
    id: 'cci', name: 'CCI', status: 'client',
    contacts: [
      { name: 'Marie Dupont',   role: 'Responsable communication', email: 'marie@cci.fr', phone: '+33 6 98 76 54 32' },
    ],
    links: [
      { label: 'Site internet',  url: '#', icon: 'globe'  },
      { label: 'Notion',         url: '#', icon: 'file'   },
    ],
  },
  acme: {
    id: 'acme', name: 'Acme Corp', status: 'prospect',
    contacts: [
      { name: 'Jean Durand',    role: 'CEO',                email: 'jean@acme.com',   phone: '+33 7 11 22 33 44' },
      { name: 'Claire Petit',   role: 'Office manager',     email: 'claire@acme.com' },
    ],
    links: [
      { label: 'Proto web',      url: '#', icon: 'globe'  },
    ],
  },
};

const MOCK: MockDeliverable[] = [
  // SMS · Re-branding 2026
  { id:'p1', clientId:'sms', clientName:'SMS', nomProjet:'Re-branding 2026', depositAmount:4350, depositDate:'2025-11-01',
    name:'Honoraires agence stratégie',       status:'completed',   prixFacturé:3000, margePotentielle:3000, billingStatus:'balance',  assigneeInitials:'JH', assigneeColor:'#ec4899' },
  { id:'p2', clientId:'sms', clientName:'SMS', nomProjet:'Re-branding 2026',
    name:'Direction artistique / Identité',   status:'completed',   prixFacturé:3500, margePotentielle:3500, billingStatus:'balance',  assigneeInitials:'JH', assigneeColor:'#ec4899' },
  { id:'p3', clientId:'sms', clientName:'SMS', nomProjet:'Re-branding 2026',
    name:'Création pitch deck',                status:'pending',     prixFacturé:3000, margePotentielle:3000, billingStatus:'quoted',   assigneeInitials:'CE', assigneeColor:'#06b6d4' },
  { id:'p4', clientId:'sms', clientName:'SMS', nomProjet:'Re-branding 2026',
    name:'Site internet de pré-lancement',     status:'in-progress', prixFacturé:3500, margePotentielle:3500, billingStatus:'quoted',   assigneeInitials:'CE', assigneeColor:'#06b6d4' },
  { id:'p5', clientId:'sms', clientName:'SMS', nomProjet:'Re-branding 2026',
    name:'Plateforme de marque',               status:'to_quote',    prixFacturé:1500, margePotentielle:1500, billingStatus:'to_quote', isOption:true, assigneeInitials:'JH', assigneeColor:'#ec4899' },
  // SMS · solo
  { id:'p6', clientId:'sms', clientName:'SMS',
    name:'Cartes de visite',                   status:'completed',   prixFacturé:250,  margePotentielle:250,  billingStatus:'balance',  assigneeInitials:'CE', assigneeColor:'#06b6d4' },
  // CCI · Stratégie digitale Q1
  { id:'p7', clientId:'cci', clientName:'CCI', nomProjet:'Stratégie digitale Q1', depositAmount:1000, depositDate:'2026-01-15',
    name:'Audit digital',                      status:'completed',   prixFacturé:1200, margePotentielle:1200, billingStatus:'balance',  assigneeInitials:'JH', assigneeColor:'#ec4899' },
  { id:'p8', clientId:'cci', clientName:'CCI', nomProjet:'Stratégie digitale Q1',
    name:'Stratégie réseaux sociaux',          status:'in-progress', prixFacturé:2000, margePotentielle:2000, billingStatus:'quoted',   assigneeInitials:'JH', assigneeColor:'#ec4899' },
  // CCI · solo
  { id:'p9',  clientId:'cci',  clientName:'CCI',
    name:'Bannières publicitaires',             status:'pending',     prixFacturé:450,  margePotentielle:450,  billingStatus:'quoted',   assigneeInitials:'CE', assigneeColor:'#06b6d4' },
  // Acme · solos
  { id:'p10', clientId:'acme', clientName:'Acme Corp',
    name:'Refonte logo',                        status:'to_quote',    prixFacturé:1800, margePotentielle:1800, billingStatus:'to_quote', assigneeInitials:'JH', assigneeColor:'#ec4899' },
  { id:'p11', clientId:'acme', clientName:'Acme Corp',
    name:'Pitch deck investisseurs',            status:'pending',     prixFacturé:2500, margePotentielle:2500, billingStatus:'quoted',   assigneeInitials:'CE', assigneeColor:'#06b6d4' },
];

// ─── Colonnes ─────────────────────────────────────────────────────────────────

const COLUMNS: { id: ProdStatus; label: string; color: string }[] = [
  { id: 'to_quote',    label: 'À deviser',  color: 'var(--accent-coral)'  },
  { id: 'pending',     label: 'À faire',    color: 'var(--accent-violet)' },
  { id: 'in-progress', label: 'En attente', color: 'var(--accent-cyan)'   },
  { id: 'completed',   label: 'Terminé',    color: 'var(--accent-lime)'   },
];

const LOCK_ICON = (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

// ─── Helpers visuels ──────────────────────────────────────────────────────────

const PROD_STATUS_LABEL: Record<ProdStatus, string> = {
  to_quote: 'À deviser', pending: 'À faire', 'in-progress': 'En attente', completed: 'Terminé',
};
const PROD_STATUS_COLOR: Record<ProdStatus, string> = {
  to_quote: 'text-[var(--accent-coral)] bg-[var(--accent-coral)]/10',
  pending: 'text-[var(--accent-violet)] bg-[var(--accent-violet)]/10',
  'in-progress': 'text-[var(--accent-cyan)] bg-[var(--accent-cyan)]/10',
  completed: 'text-[var(--accent-lime)] bg-[var(--accent-lime)]/10',
};
const BILLING_LABEL: Record<BillingStatus, string> = {
  to_quote: 'À deviser', quoted: 'Devisé', deposit: 'Acompte', balance: 'Soldé',
};
const BILLING_COLOR: Record<BillingStatus, string> = {
  to_quote: 'text-[var(--text-muted)] bg-[var(--bg-tertiary)]',
  quoted: 'text-blue-400 bg-blue-400/10',
  deposit: 'text-amber-400 bg-amber-400/10',
  balance: 'text-[#22c55e] bg-[#22c55e]/10',
};

function StatusPill({ status }: { status: ProdStatus }) {
  return <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${PROD_STATUS_COLOR[status]}`}>{PROD_STATUS_LABEL[status]}</span>;
}
function BillingPill({ status }: { status: BillingStatus }) {
  return <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${BILLING_COLOR[status]}`}>{BILLING_LABEL[status]}</span>;
}

// ─── ProductionCard — copie exacte de ProductionView.tsx ─────────────────────

function ProductionCard({ name, clientName, prixFacturé, assigneeInitials, assigneeColor, isCompact, isFirst, isLast, isOption, onClick }: {
  name: string; clientName: string; prixFacturé?: number;
  assigneeInitials?: string; assigneeColor?: string;
  isCompact: boolean; isFirst: boolean; isLast: boolean;
  isOption?: boolean; onClick: () => void;
}) {
  if (isCompact) {
    const r = isFirst && isLast ? 'rounded' : isFirst ? 'rounded-t rounded-b-none' : isLast ? 'rounded-b rounded-t-none' : 'rounded-none';
    return (
      <div onClick={onClick}
        className={`flex items-center gap-2 px-2 py-1 bg-[var(--bg-tertiary)]/50 hover:bg-[var(--bg-tertiary)] cursor-pointer transition-colors text-[10px] group ${r} ${!isFirst ? '-mt-px' : ''}`}>
        {isFirst
          ? <span className="truncate text-[var(--text-muted)]/60 max-w-[60px] flex-shrink-0 font-semibold">{clientName}</span>
          : <span className="w-[60px] flex-shrink-0" />
        }
        <span className="truncate flex-1 text-[var(--text-muted)] group-hover:text-[var(--text-primary)]">{name}</span>
        {prixFacturé != null && prixFacturé > 0 && (
          <span className="text-[#22c55e]/80 flex-shrink-0 font-medium">{prixFacturé.toLocaleString('fr-FR')} €</span>
        )}
      </div>
    );
  }

  const r = isFirst && isLast ? 'rounded-lg' : isFirst ? 'rounded-t-lg rounded-b-none' : isLast ? 'rounded-b-lg rounded-t-none' : 'rounded-none';
  return (
    <div onClick={onClick}
      className={`px-2.5 py-2 bg-[var(--bg-secondary)] border border-[var(--border-subtle)] hover:border-[var(--accent-cyan)]/50 cursor-pointer transition-all hover:shadow-md group ${r} ${!isFirst ? '-mt-px' : ''} ${isOption ? 'border-dashed opacity-70' : ''}`}>
      {isFirst && clientName && (
        <div className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider truncate mb-0.5">
          {clientName}
        </div>
      )}
      <div className="flex items-center gap-2">
        <span className="text-[13px] font-medium text-[var(--text-primary)] truncate flex-1 group-hover:text-[var(--accent-cyan)]">
          {name}
        </span>
        {prixFacturé != null && prixFacturé > 0 && (
          <span className="text-[11px] font-semibold text-[#22c55e] flex-shrink-0">{prixFacturé.toLocaleString('fr-FR')} €</span>
        )}
        {assigneeInitials && (
          <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0"
            style={{ backgroundColor: assigneeColor }}>
            {assigneeInitials}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Bandeau projet ───────────────────────────────────────────────────────────

const FOLDER_ICON_OPEN = (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
    <line x1="2" y1="13" x2="22" y2="13"/>
  </svg>
);
const FOLDER_ICON_CLOSED = (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
  </svg>
);

function ProjetBandeau({ nomProjet, clientId, clientName, deposit, collapsed, onToggle, onOpenModal, onOpenClient }: {
  nomProjet: string; clientId: string; clientName: string; deposit?: number;
  collapsed: boolean; onToggle: () => void; onOpenModal: () => void; onOpenClient: () => void;
}) {
  const color = CLIENT_COLOR[clientId] ?? '#9ca3af';
  return (
    <div className="flex items-center gap-0.5 mb-0.5 group">
      {/* Icône folder + clic projet */}
      <button onClick={onOpenModal}
        className="flex items-center gap-1.5 px-1.5 py-1 rounded flex-1 min-w-0 hover:bg-[var(--bg-secondary)] transition-colors text-left">
        <span style={{ color }} className="flex-shrink-0">
          {collapsed ? FOLDER_ICON_CLOSED : FOLDER_ICON_OPEN}
        </span>
        {/* Nom client cliquable → modale client */}
        <span
          onClick={e => { e.stopPropagation(); onOpenClient(); }}
          className="text-[10px] font-semibold flex-shrink-0 uppercase tracking-wider hover:underline cursor-pointer"
          style={{ color }}>
          {clientName}
        </span>
        <span className="text-[var(--text-muted)]/30 text-[10px] flex-shrink-0">/</span>
        {/* Nom projet → modale projet */}
        <span className="text-[11px] font-semibold truncate flex-1 text-[var(--text-primary)] hover:text-[var(--accent-cyan)]">
          {nomProjet}
        </span>
        {deposit != null && (
          <span className="text-[9px] text-[#3b82f6] bg-[#3b82f6]/10 px-1.5 py-0.5 rounded flex-shrink-0">
            ac. {deposit.toLocaleString('fr-FR')} €
          </span>
        )}
      </button>
      {/* Flèche collapse */}
      <button onClick={onToggle}
        className="p-1 rounded hover:bg-[var(--bg-secondary)] text-[var(--text-muted)]/40 hover:text-[var(--text-muted)] transition-colors flex-shrink-0">
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
          className={`transition-transform ${collapsed ? '-rotate-90' : ''}`}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
    </div>
  );
}

// ─── Modale Projet — zone chips ───────────────────────────────────────────────

type ProgressInvoice = { id: string; label: string; amount: string; pct: number | null; date: string; encaissé: boolean };

const PCT_PRESETS = [20, 25, 30, 40, 50];

function ProjetModal({ nomProjet, clientId, clientName, products, onClose, onOpenProduct }: {
  nomProjet: string; clientId: string; clientName: string;
  products: MockDeliverable[]; onClose: () => void;
  onOpenProduct: (p: MockDeliverable) => void;
}) {
  const color = CLIENT_COLOR[clientId] ?? '#9ca3af';
  const totalBrut = products.reduce((s, p) => s + (p.prixFacturé || p.margePotentielle || 0), 0);

  // Statut global production
  const allCompleted = products.every(p => p.status === 'completed');
  const anyInProgress = products.some(p => p.status === 'in-progress');
  const anyPending = products.some(p => p.status === 'pending');
  const globalStatus: ProdStatus = allCompleted ? 'completed' : anyInProgress ? 'in-progress' : anyPending ? 'pending' : 'to_quote';

  // ── State chips produits (activé = facturé unitairement)
  const [activatedProducts, setActivatedProducts] = useState<Set<string>>(
    new Set(products.filter(p => p.billingStatus === 'balance').map(p => p.id))
  );
  const [productDates, setProductDates] = useState<Record<string, string>>({});

  // ── State chips billing projet
  const initDeposit = products.find(p => p.depositAmount);
  const [acompte, setAcompte] = useState({
    active: !!initDeposit,
    amount: initDeposit ? String(initDeposit.depositAmount) : '',
    pct: null as number | null,
    date: initDeposit?.depositDate ?? '',
    encaissé: !!initDeposit,
    custom: !initDeposit, // true = mode saisie libre
  });
  const [avancements, setAvancements] = useState<ProgressInvoice[]>([
    { id: 'av1', label: 'Avancement 1', amount: '2500', pct: 25, date: '2026-01-15', encaissé: true },
  ]);
  const [solde, setSolde] = useState({ active: false, date: '', encaissé: false });

  // ── Calculs
  const productChipsTotal = products
    .filter(p => activatedProducts.has(p.id))
    .reduce((s, p) => s + (p.prixFacturé || p.margePotentielle || 0), 0);

  const acompteTotal = acompte.active ? (parseFloat(acompte.amount) || 0) : 0;
  const avancementsTotal = avancements.reduce((s, a) => s + (parseFloat(a.amount) || 0), 0);
  const soldeAuto = Math.max(0, totalBrut - productChipsTotal - acompteTotal - avancementsTotal);
  const totalFacturé = productChipsTotal + acompteTotal + avancementsTotal + (solde.active ? soldeAuto : 0);
  const isOverBudget = totalFacturé > totalBrut + 0.01;
  const pct = Math.min(100, Math.round((totalFacturé / totalBrut) * 100));

  const toggleProduct = (id: string) => {
    setActivatedProducts(prev => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  };

  const addAvancement = () => {
    const n = avancements.length + 1;
    setAvancements(prev => [...prev, { id: `av${Date.now()}`, label: `Avancement ${n}`, amount: '', pct: null, date: '', encaissé: false }]);
  };
  const updateAvancement = (id: string, field: keyof ProgressInvoice, val: string | boolean) => {
    setAvancements(prev => prev.map(a => a.id === id ? { ...a, [field]: val } : a));
  };
  const removeAvancement = (id: string) => setAvancements(prev => prev.filter(a => a.id !== id));

  // Couleurs progress bar
  const barColor = isOverBudget ? '#ef4444' : pct === 100 ? '#22c55e' : '#3b82f6';

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-2xl w-full max-w-xl shadow-2xl flex flex-col max-h-[92vh]"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex-shrink-0 flex items-center gap-3 px-5 py-4 border-b border-[var(--border-subtle)]">
          <span style={{ color }} className="flex-shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
              <line x1="2" y1="13" x2="22" y2="13"/>
            </svg>
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color }}>{clientName}</span>
              <span className="text-[var(--text-muted)]/30 text-[10px]">/</span>
              <span className="text-base font-semibold text-[var(--text-primary)] truncate">{nomProjet}</span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <StatusPill status={globalStatus} />
              <span className="text-[10px] text-[var(--text-muted)]">{products.length} produit{products.length > 1 ? 's' : ''}</span>
            </div>
          </div>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors flex-shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Barre de progression */}
        <div className="flex-shrink-0 px-5 pt-4 pb-3 border-b border-[var(--border-subtle)]">
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider">Facturé</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-bold" style={{ color: barColor }}>
                {totalFacturé.toLocaleString('fr-FR')} €
              </span>
              <span className="text-[11px] text-[var(--text-muted)]">/ {totalBrut.toLocaleString('fr-FR')} €</span>
              <span className="text-[11px] font-semibold" style={{ color: barColor }}>{pct}%</span>
            </div>
          </div>
          <div className="h-2 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, pct)}%`, backgroundColor: barColor }} />
          </div>
          {isOverBudget && (
            <p className="text-[10px] text-red-400 mt-1.5 flex items-center gap-1">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              Dépassement — total facturé supérieur au devis ({(totalFacturé - totalBrut).toLocaleString('fr-FR')} € de trop)
            </p>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

          {/* ── Zone chips produits */}
          <div>
            <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-2.5 flex items-center gap-2">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
              Produits — cliquer pour facturer unitairement
            </div>
            <div className="flex flex-wrap gap-2">
              {products.map(p => {
                const isActive = activatedProducts.has(p.id);
                const amount = (p.prixFacturé || p.margePotentielle || 0);
                return (
                  <div key={p.id} className="flex flex-col gap-1">
                    <button
                      onClick={() => toggleProduct(p.id)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-[12px] font-medium transition-all ${
                        isActive
                          ? 'bg-[#22c55e]/10 border-[#22c55e]/50 text-[#22c55e]'
                          : 'bg-[var(--bg-secondary)] border-dashed border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--accent-cyan)]/40'
                      } ${p.isOption ? 'opacity-60' : ''}`}
                    >
                      {isActive && (
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="flex-shrink-0">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      )}
                      <span className="truncate max-w-[130px]">{p.name}</span>
                      {p.isOption && <span className="text-[9px] opacity-60">opt.</span>}
                      <span className={`text-[10px] font-bold flex-shrink-0 ${isActive ? 'text-[#22c55e]' : 'text-[var(--text-muted)]'}`}>
                        {amount.toLocaleString('fr-FR')} €
                      </span>
                      <StatusPill status={p.status} />
                    </button>
                    {isActive && (
                      <input
                        type="date"
                        value={productDates[p.id] ?? ''}
                        onChange={e => setProductDates(prev => ({ ...prev, [p.id]: e.target.value }))}
                        className="text-[10px] bg-[var(--bg-secondary)] border border-[#22c55e]/30 rounded-lg px-2 py-1 text-[var(--text-primary)] focus:outline-none focus:border-[#22c55e]/60"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Zone chips billing projet */}
          <div>
            <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-2.5 flex items-center gap-2">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
              Facturation projet — acompte, avancements, solde
            </div>
            <div className="space-y-2">

              {/* Acompte */}
              <div className={`rounded-xl border transition-all ${
                acompte.active ? 'border-amber-400/50 bg-amber-400/5' : 'border-dashed border-[var(--border-subtle)] bg-[var(--bg-secondary)]'
              }`}>
                {/* Ligne 1 : toggle + montant calculé + date + enc */}
                <div className="flex items-center gap-2 px-3 py-2">
                  <button onClick={() => setAcompte(a => ({ ...a, active: !a.active }))}
                    className={`flex items-center gap-2 text-left ${acompte.active ? 'text-amber-400' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}>
                    {acompte.active
                      ? <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                      : <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                    }
                    <span className="text-[12px] font-semibold">Acompte</span>
                  </button>
                  {acompte.active && (
                    <div className="flex items-center gap-1.5 flex-1 justify-end">
                      {/* Montant — lecture si % sélectionné, saisie si custom */}
                      {acompte.custom ? (
                        <div className="relative">
                          <input value={acompte.amount} onChange={e => setAcompte(a => ({ ...a, amount: e.target.value, pct: null }))}
                            placeholder="Montant" autoFocus
                            className="w-24 bg-transparent border border-amber-400/30 rounded-lg pl-2.5 pr-5 py-1 text-[12px] text-amber-300 focus:outline-none focus:border-amber-400/60" />
                          <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-amber-400/60">€</span>
                        </div>
                      ) : (
                        <span className="text-[13px] font-bold text-amber-300 min-w-[72px] text-right">
                          {acompte.amount ? `${parseFloat(acompte.amount).toLocaleString('fr-FR')} €` : '—'}
                        </span>
                      )}
                      <input type="date" value={acompte.date} onChange={e => setAcompte(a => ({ ...a, date: e.target.value }))}
                        className="bg-transparent border border-amber-400/30 rounded-lg px-2 py-1 text-[11px] text-amber-300 focus:outline-none" />
                      <button onClick={() => setAcompte(a => ({ ...a, encaissé: !a.encaissé }))}
                        className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition-colors flex-shrink-0 ${acompte.encaissé ? 'bg-[#22c55e]/20 text-[#22c55e]' : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)]'}`}>
                        {acompte.encaissé ? '✓ enc.' : 'enc.?'}
                      </button>
                    </div>
                  )}
                </div>
                {/* Ligne 2 : pills % (si actif) */}
                {acompte.active && (
                  <div className="flex items-center gap-1.5 px-3 pb-2.5 flex-wrap">
                    {PCT_PRESETS.map(p => {
                      const computed = Math.round(totalBrut * p / 100);
                      const isSelected = acompte.pct === p;
                      return (
                        <button key={p}
                          onClick={() => setAcompte(a => ({ ...a, pct: p, amount: String(computed), custom: false }))}
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold transition-all ${
                            isSelected
                              ? 'bg-amber-400 text-black'
                              : 'bg-amber-400/10 text-amber-400/70 hover:bg-amber-400/20 hover:text-amber-400'
                          }`}>
                          {p}%
                          <span className="ml-1 opacity-60 font-normal">{computed.toLocaleString('fr-FR')}</span>
                        </button>
                      );
                    })}
                    <button
                      onClick={() => setAcompte(a => ({ ...a, pct: null, custom: true }))}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold transition-all ${
                        acompte.custom
                          ? 'bg-amber-400 text-black'
                          : 'bg-amber-400/10 text-amber-400/70 hover:bg-amber-400/20 hover:text-amber-400'
                      }`}>
                      perso
                    </button>
                  </div>
                )}
              </div>

              {/* Avancements */}
              {avancements.map((av) => (
                <div key={av.id} className={`rounded-xl border transition-all ${av.encaissé ? 'border-blue-400/50 bg-blue-400/5' : 'border-dashed border-[var(--border-subtle)] bg-[var(--bg-secondary)]'}`}>
                  {/* Ligne 1 */}
                  <div className="flex items-center gap-2 px-3 py-2">
                    <span className={`flex-shrink-0 ${av.encaissé ? 'text-blue-400' : 'text-[var(--text-muted)]'}`}>
                      {av.encaissé
                        ? <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                        : <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/></svg>
                      }
                    </span>
                    <input value={av.label} onChange={e => updateAvancement(av.id, 'label', e.target.value)}
                      className={`text-[12px] font-semibold bg-transparent w-28 focus:outline-none ${av.encaissé ? 'text-blue-300' : 'text-[var(--text-primary)]'}`} />
                    <div className="flex items-center gap-1.5 flex-1 justify-end">
                      {av.pct === null ? (
                        <div className="relative">
                          <input value={av.amount} onChange={e => updateAvancement(av.id, 'amount', e.target.value)}
                            placeholder="Montant" autoFocus
                            className={`w-24 bg-transparent border rounded-lg pl-2.5 pr-5 py-1 text-[12px] focus:outline-none ${av.encaissé ? 'border-blue-400/30 text-blue-300' : 'border-[var(--border-subtle)] text-[var(--text-muted)]'}`} />
                          <span className={`absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] ${av.encaissé ? 'text-blue-400/60' : 'text-[var(--text-muted)]'}`}>€</span>
                        </div>
                      ) : (
                        <span className={`text-[13px] font-bold min-w-[72px] text-right ${av.encaissé ? 'text-blue-300' : 'text-[var(--text-muted)]'}`}>
                          {av.amount ? `${parseFloat(av.amount).toLocaleString('fr-FR')} €` : '—'}
                        </span>
                      )}
                      <input type="date" value={av.date} onChange={e => updateAvancement(av.id, 'date', e.target.value)}
                        className={`bg-transparent border rounded-lg px-2 py-1 text-[11px] focus:outline-none ${av.encaissé ? 'border-blue-400/30 text-blue-300' : 'border-[var(--border-subtle)] text-[var(--text-muted)]'}`} />
                      <button onClick={() => updateAvancement(av.id, 'encaissé', !av.encaissé)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition-colors flex-shrink-0 ${av.encaissé ? 'bg-[#22c55e]/20 text-[#22c55e]' : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)]'}`}>
                        {av.encaissé ? '✓ enc.' : 'enc.?'}
                      </button>
                      <button onClick={() => removeAvancement(av.id)} className="text-[var(--text-muted)]/40 hover:text-red-400 transition-colors flex-shrink-0">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                    </div>
                  </div>
                  {/* Ligne 2 : pills % */}
                  <div className="flex items-center gap-1.5 px-3 pb-2.5 flex-wrap">
                    {PCT_PRESETS.map(p => {
                      const computed = Math.round(totalBrut * p / 100);
                      const isSelected = av.pct === p;
                      return (
                        <button key={p}
                          onClick={() => updateAvancement(av.id, 'pct', p) || updateAvancement(av.id, 'amount', String(computed))}
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold transition-all ${
                            isSelected
                              ? 'bg-blue-400 text-black'
                              : 'bg-blue-400/10 text-blue-400/70 hover:bg-blue-400/20 hover:text-blue-400'
                          }`}>
                          {p}%
                          <span className="ml-1 opacity-60 font-normal">{computed.toLocaleString('fr-FR')}</span>
                        </button>
                      );
                    })}
                    <button
                      onClick={() => { updateAvancement(av.id, 'pct', null); updateAvancement(av.id, 'amount', ''); }}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold transition-all ${
                        av.pct === null
                          ? 'bg-blue-400 text-black'
                          : 'bg-blue-400/10 text-blue-400/70 hover:bg-blue-400/20 hover:text-blue-400'
                      }`}>
                      perso
                    </button>
                  </div>
                </div>
              ))}

              {/* Bouton + Avancement */}
              <button onClick={addAvancement}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl border border-dashed border-[var(--border-subtle)] text-[11px] text-[var(--text-muted)] hover:text-blue-400 hover:border-blue-400/40 transition-colors">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Ajouter un avancement
              </button>

              {/* Solde auto */}
              <div className={`rounded-xl border transition-all ${
                solde.active
                  ? 'border-[#22c55e]/50 bg-[#22c55e]/5'
                  : 'border-dashed border-[var(--border-subtle)] bg-[var(--bg-secondary)]'
              } ${soldeAuto <= 0 && !solde.active ? 'opacity-40' : ''}`}>
                <div className="flex items-center gap-2 px-3 py-2">
                  <button
                    onClick={() => soldeAuto > 0 && setSolde(s => ({ ...s, active: !s.active }))}
                    disabled={soldeAuto <= 0}
                    className={`flex items-center gap-2 flex-1 text-left ${solde.active ? 'text-[#22c55e]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'} disabled:cursor-not-allowed`}>
                    {solde.active
                      ? <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                      : <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                    }
                    <span className="text-[12px] font-semibold">Solde</span>
                    <span className={`text-[12px] font-bold ml-auto ${solde.active ? 'text-[#22c55e]' : 'text-[var(--text-muted)]'}`}>
                      {soldeAuto.toLocaleString('fr-FR')} € <span className="text-[9px] opacity-60">auto</span>
                    </span>
                  </button>
                  {solde.active && (
                    <div className="flex items-center gap-1.5">
                      <input type="date" value={solde.date} onChange={e => setSolde(s => ({ ...s, date: e.target.value }))}
                        className="bg-transparent border border-[#22c55e]/30 rounded-lg px-2 py-1 text-[11px] text-[#22c55e] focus:outline-none focus:border-[#22c55e]/60" />
                      <button onClick={() => setSolde(s => ({ ...s, encaissé: !s.encaissé }))}
                        className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition-colors ${solde.encaissé ? 'bg-[#22c55e]/20 text-[#22c55e]' : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)]'}`}>
                        {solde.encaissé ? '✓ enc.' : 'enc. ?'}
                      </button>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 flex justify-between items-center px-5 py-4 border-t border-[var(--border-subtle)]">
          <button onClick={onClose} className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer">Fermer</button>
          <button className="px-4 py-2 bg-[var(--accent-cyan)]/10 border border-[var(--accent-cyan)]/30 text-[var(--accent-cyan)] text-sm font-medium rounded-lg hover:bg-[var(--accent-cyan)]/20 cursor-pointer">
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Modale Produit ───────────────────────────────────────────────────────────

function ProductModal({ product, allNomsProjets, onClose }: {
  product: MockDeliverable; allNomsProjets: string[]; onClose: () => void;
}) {
  const [nomProjet, setNomProjet] = useState(product.nomProjet ?? '');
  const [showSugg, setShowSugg] = useState(false);
  const suggestions = allNomsProjets.filter(n =>
    n !== nomProjet && n.toLowerCase().includes(nomProjet.toLowerCase())
  );
  const color = CLIENT_COLOR[product.clientId] ?? '#9ca3af';

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-2xl w-full max-w-md shadow-2xl"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[var(--border-subtle)]">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] font-medium" style={{ color }}>{product.clientName}</span>
              {product.nomProjet && (
                <>
                  <span className="text-[var(--text-muted)]/30 text-[10px]">/</span>
                  <span className="text-[10px] text-[var(--text-muted)]">{product.nomProjet}</span>
                </>
              )}
            </div>
            <div className="text-lg font-semibold text-[var(--text-primary)] truncate">{product.name}</div>
            <div className="flex items-center gap-2 mt-1">
              <StatusPill status={product.status} />
              <BillingPill status={product.billingStatus} />
            </div>
          </div>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors flex-shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Nom du produit */}
          <div>
            <label className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1 block">Nom</label>
            <input defaultValue={product.name}
              className="w-full bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-cyan)]/50" />
          </div>

          {/* Projet */}
          <div>
            <label className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">
              Projet <span className="normal-case opacity-50">(optionnel)</span>
            </label>
            <div className="relative">
              <input value={nomProjet}
                onChange={e => { setNomProjet(e.target.value); setShowSugg(true); }}
                onFocus={() => setShowSugg(true)}
                onBlur={() => setTimeout(() => setShowSugg(false), 150)}
                placeholder="Ex: Re-branding 2026"
                className="w-full bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-cyan)]/50" />
              {nomProjet && (
                <button onClick={() => setNomProjet('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              )}
              {showSugg && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-lg overflow-hidden shadow-lg z-10">
                  {suggestions.map(s => (
                    <button key={s} onMouseDown={() => { setNomProjet(s); setShowSugg(false); }}
                      className="w-full text-left px-3 py-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors flex items-center gap-2">
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-50">
                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                      </svg>
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Prix + acompte */}
          <div className={`grid gap-3 ${nomProjet ? 'grid-cols-2' : 'grid-cols-1'}`}>
            <div>
              <label className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1 block">Prix HT</label>
              <div className="relative">
                <input defaultValue={product.prixFacturé}
                  className="w-full bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-lg pl-3 pr-6 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-cyan)]/50" />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[var(--text-muted)]">€</span>
              </div>
            </div>
            {nomProjet && (
              <div>
                <label className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1 block">
                  Acompte projet
                </label>
                <div className="relative">
                  <input defaultValue={product.depositAmount ?? ''} placeholder="—"
                    className="w-full bg-[var(--bg-secondary)] border border-[#3b82f6]/30 rounded-lg pl-3 pr-6 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-blue-400/50" />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#3b82f6]/60">€</span>
                </div>
              </div>
            )}
          </div>

          {/* Option toggle */}
          <div className="flex items-center justify-between py-2 px-3 bg-[var(--bg-secondary)] rounded-lg">
            <span className="text-sm text-[var(--text-muted)]">Produit optionnel</span>
            <div className={`w-9 h-5 rounded-full transition-colors cursor-pointer ${product.isOption ? 'bg-[var(--accent-cyan)]' : 'bg-[var(--bg-tertiary)]'}`}>
              <div className={`w-4 h-4 rounded-full bg-white shadow mt-0.5 transition-transform ${product.isOption ? 'translate-x-4' : 'translate-x-0.5'}`} />
            </div>
          </div>
        </div>

        <div className="flex justify-between px-5 py-4 border-t border-[var(--border-subtle)]">
          <button onClick={onClose} className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer">Fermer</button>
          <button className="px-4 py-2 bg-[var(--accent-cyan)]/10 border border-[var(--accent-cyan)]/30 text-[var(--accent-cyan)] text-sm font-medium rounded-lg hover:bg-[var(--accent-cyan)]/20 cursor-pointer">
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Modale Client ───────────────────────────────────────────────────────────

function LinkIcon({ type }: { type: string }) {
  if (type === 'figma') return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 5.5A3.5 3.5 0 0 1 8.5 2H12v7H8.5A3.5 3.5 0 0 1 5 5.5z"/>
      <path d="M12 2h3.5a3.5 3.5 0 1 1 0 7H12V2z"/>
      <path d="M12 12.5a3.5 3.5 0 1 1 7 0 3.5 3.5 0 1 1-7 0z"/>
      <path d="M5 19.5A3.5 3.5 0 0 1 8.5 16H12v3.5a3.5 3.5 0 1 1-7 0z"/>
      <path d="M5 12.5A3.5 3.5 0 0 1 8.5 9H12v7H8.5A3.5 3.5 0 0 1 5 12.5z"/>
    </svg>
  );
  if (type === 'globe') return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  );
  if (type === 'folder') return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
    </svg>
  );
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
    </svg>
  );
}

function ClientModal({ clientId, onClose, onOpenProduct, onOpenProjet }: {
  clientId: string; onClose: () => void;
  onOpenProduct: (p: MockDeliverable) => void;
  onOpenProjet: (nomProjet: string, clientId: string) => void;
}) {
  const client = MOCK_CLIENTS[clientId];
  const color = CLIENT_COLOR[clientId] ?? '#9ca3af';
  const products = MOCK.filter(p => p.clientId === clientId);

  // Grouper les produits du client par projet
  const groups = useMemo(() => {
    const map = new Map<string, MockDeliverable[]>();
    products.forEach(p => {
      const key = p.nomProjet ?? '__solo__';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    });
    return map;
  }, [products]);

  const totalSoldé   = products.filter(p => p.billingStatus === 'balance').reduce((s, p) => s + (p.prixFacturé || 0), 0);
  const totalPipeline= products.filter(p => ['quoted','deposit'].includes(p.billingStatus)).reduce((s, p) => s + (p.prixFacturé || 0), 0);

  if (!client) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[92vh]"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex-shrink-0 flex items-center gap-3 px-6 py-4 border-b border-[var(--border-subtle)]">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
            style={{ backgroundColor: color }}>
            {client.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">{client.name}</h2>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                client.status === 'prospect'
                  ? 'bg-amber-400/20 text-amber-400'
                  : 'bg-[var(--accent-cyan)]/20 text-[var(--accent-cyan)]'
              }`}>
                {client.status === 'prospect' ? 'Prospect' : 'Client'}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-0.5 text-[11px] text-[var(--text-muted)]">
              {totalSoldé > 0 && <span className="text-[#22c55e]">Soldé <strong>{totalSoldé.toLocaleString('fr-FR')} €</strong></span>}
              {totalPipeline > 0 && <span className="text-blue-400">Pipeline <strong>{totalPipeline.toLocaleString('fr-FR')} €</strong></span>}
              <span>{products.length} produit{products.length > 1 ? 's' : ''}</span>
            </div>
          </div>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors flex-shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Body — 2 colonnes comme ClientDetail */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 md:divide-x divide-[var(--border-subtle)]">

            {/* Colonne gauche : contacts + liens */}
            <div className="md:col-span-1 p-5 space-y-5">
              {/* Contacts */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--text-muted)]">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                  </svg>
                  <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Contacts</span>
                </div>
                <div className="space-y-3">
                  {client.contacts.map((c, i) => (
                    <div key={i} className="p-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
                      <div className="font-medium text-[13px] text-[var(--text-primary)]">{c.name}</div>
                      <div className="text-[11px] text-[var(--text-muted)] mt-0.5">{c.role}</div>
                      <div className="mt-1.5 space-y-0.5">
                        <a href={`mailto:${c.email}`} className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)] hover:text-[var(--accent-cyan)] transition-colors">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                          {c.email}
                        </a>
                        {c.phone && (
                          <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.19 11.9a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.12 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21 16.92z"/></svg>
                            {c.phone}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  <button className="w-full py-1.5 text-[11px] text-[var(--text-muted)] hover:text-[var(--accent-cyan)] border border-dashed border-[var(--border-subtle)] hover:border-[var(--accent-cyan)]/40 rounded-lg transition-colors">
                    + Ajouter un contact
                  </button>
                </div>
              </div>

              {/* Liens */}
              {client.links.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--text-muted)]">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                    </svg>
                    <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Liens</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {client.links.map((l, i) => (
                      <a key={i} href={l.url}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)] hover:border-[var(--accent-cyan)]/40 text-[11px] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                        <span className="text-[var(--text-muted)]"><LinkIcon type={l.icon} /></span>
                        {l.label}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Colonne droite : produits groupés par projet */}
            <div className="md:col-span-2 p-5 space-y-4">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--text-muted)]">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                  </svg>
                  <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Produits</span>
                </div>
                <button className="text-[10px] text-[var(--accent-cyan)] hover:underline">+ Ajouter</button>
              </div>

              {Array.from(groups.entries()).map(([key, prods]) => {
                const isProjet = key !== '__solo__';
                const deposit = isProjet ? prods.find(p => p.depositAmount)?.depositAmount : undefined;
                const projetTotal = prods.reduce((s, p) => s + (p.prixFacturé || p.margePotentielle || 0), 0);

                return (
                  <div key={key}>
                    {/* En-tête groupe projet */}
                    {isProjet && (
                      <button onClick={() => { onClose(); onOpenProjet(key, clientId); }}
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors mb-1 group text-left">
                        <span style={{ color }} className="flex-shrink-0">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                            <line x1="2" y1="13" x2="22" y2="13"/>
                          </svg>
                        </span>
                        <span className="text-[12px] font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent-cyan)] truncate flex-1">{key}</span>
                        {deposit && (
                          <span className="text-[9px] text-[#3b82f6] bg-[#3b82f6]/10 px-1.5 py-0.5 rounded flex-shrink-0">
                            ac. {deposit.toLocaleString('fr-FR')} €
                          </span>
                        )}
                        <span className="text-[11px] font-semibold text-[var(--text-muted)] flex-shrink-0">
                          {projetTotal.toLocaleString('fr-FR')} €
                        </span>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--text-muted)]/40 flex-shrink-0 group-hover:text-[var(--accent-cyan)]">
                          <path d="M9 18l6-6-6-6"/>
                        </svg>
                      </button>
                    )}

                    {/* Liste des produits */}
                    <div className={isProjet ? 'pl-4 border-l border-[var(--border-subtle)] space-y-1' : 'space-y-1'}>
                      {prods.map(p => (
                        <button key={p.id} onClick={() => { onClose(); onOpenProduct(p); }}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors group text-left">
                          <span className="flex-1 text-[12px] text-[var(--text-primary)] truncate group-hover:text-[var(--accent-cyan)]">
                            {p.name}
                            {p.isOption && <span className="ml-1.5 text-[9px] text-[var(--text-muted)] border border-[var(--border-subtle)] rounded px-1">opt.</span>}
                          </span>
                          <StatusPill status={p.status} />
                          <BillingPill status={p.billingStatus} />
                          <span className={`text-[11px] font-semibold flex-shrink-0 w-16 text-right ${
                            p.billingStatus === 'balance' ? 'text-[#22c55e]' :
                            p.billingStatus === 'to_quote' ? 'text-[var(--accent-violet)]' : 'text-[var(--text-muted)]'
                          }`}>
                            {(p.prixFacturé || p.margePotentielle || 0).toLocaleString('fr-FR')} €
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 flex justify-between items-center px-6 py-4 border-t border-[var(--border-subtle)]">
          <button onClick={onClose} className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer">Fermer</button>
          <button className="px-4 py-2 bg-[var(--accent-cyan)]/10 border border-[var(--accent-cyan)]/30 text-[var(--accent-cyan)] text-sm font-medium rounded-lg hover:bg-[var(--accent-cyan)]/20 cursor-pointer">
            Modifier le client
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function ProtoProjectsPage() {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [openProduct, setOpenProduct] = useState<MockDeliverable | null>(null);
  const [openProjet, setOpenProjet] = useState<{ nomProjet: string; clientId: string } | null>(null);
  const [openClient, setOpenClient] = useState<string | null>(null);
  const toggle = (k: string) => setCollapsed(p => ({ ...p, [k]: !p[k] }));

  const allNomsProjets = useMemo(() =>
    [...new Set(MOCK.filter(p => p.nomProjet).map(p => p.nomProjet!))], []);

  // Totaux globaux
  const { totalPotentiel, pipelineConfirme, totalEncaisse } = useMemo(() => ({
    totalPotentiel:   MOCK.filter(p => p.status === 'to_quote').reduce((s, p) => s + (p.margePotentielle || 0), 0),
    pipelineConfirme: MOCK.filter(p => ['pending','in-progress'].includes(p.status)).reduce((s, p) => s + (p.prixFacturé || 0), 0),
    totalEncaisse:    MOCK.filter(p => p.status === 'completed').reduce((s, p) => s + (p.prixFacturé || 0), 0),
  }), []);

  // Groupement pour une colonne
  function buildGroups(status: ProdStatus) {
    const items = MOCK.filter(p => p.status === status);
    const groups = new Map<string, MockDeliverable[]>();
    items.forEach(p => {
      const key = p.nomProjet ? `${p.clientId}||${p.nomProjet}` : `${p.clientId}||__solo__`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(p);
    });
    return groups;
  }

  // Produits d'un projet (toutes colonnes)
  const projetProducts = openProjet
    ? MOCK.filter(p => p.clientId === openProjet.clientId && p.nomProjet === openProjet.nomProjet)
    : [];

  return (
    <div className="flex-1 flex flex-col overflow-hidden p-4 md:p-6">

      {/* Header */}
      <div className="flex-shrink-0 mb-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <div>
            <h1 className="text-lg font-semibold text-[var(--text-primary)]">Production</h1>
            <p className="text-xs text-[var(--text-muted)]">
              {MOCK.length} produits
              <span className="ml-2 text-[var(--accent-violet)]/60 text-[10px] uppercase tracking-wider">· proto</span>
            </p>
          </div>
          <div className="hidden md:flex items-center gap-4 text-[11px]">
            {totalPotentiel > 0 && (
              <div className="flex items-baseline gap-1">
                <span className="text-[var(--text-muted)] uppercase tracking-wider">Potentiel</span>
                <span className="text-sm font-bold text-[var(--accent-violet)]">{totalPotentiel.toLocaleString('fr-FR')} €</span>
              </div>
            )}
            {pipelineConfirme > 0 && (
              <div className="flex items-baseline gap-1">
                <span className="text-[var(--text-muted)] uppercase tracking-wider">Pipeline</span>
                <span className="text-sm font-bold text-[#22c55e]">{pipelineConfirme.toLocaleString('fr-FR')} €</span>
              </div>
            )}
            {totalEncaisse > 0 && (
              <div className="flex items-baseline gap-1">
                <span className="text-[var(--text-muted)] uppercase tracking-wider">Encaissé</span>
                <span className="text-sm font-bold text-[#22c55e]">{totalEncaisse.toLocaleString('fr-FR')} €</span>
              </div>
            )}
          </div>
        </div>

        {/* Boutons démo modales */}
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider">Préview :</span>
          <button
            onClick={() => setOpenProduct(MOCK[2])}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[var(--border-subtle)] text-[10px] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--accent-cyan)]/40 transition-colors">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/></svg>
            Modale produit
          </button>
          <button
            onClick={() => setOpenProjet({ nomProjet: 'Re-branding 2026', clientId: 'sms' })}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[var(--border-subtle)] text-[10px] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--accent-cyan)]/40 transition-colors">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
            </svg>
            Modale projet
          </button>
          <button
            onClick={() => setOpenClient('sms')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[var(--border-subtle)] text-[10px] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--accent-cyan)]/40 transition-colors">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
            Modale client
          </button>
        </div>
      </div>

      {/* Kanban */}
      <div className="flex-1 flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map(column => {
          const isCompleted = column.id === 'completed';
          const groups = buildGroups(column.id);
          const allItems = MOCK.filter(p => p.status === column.id);

          const columnTotal = column.id === 'to_quote'
            ? allItems.reduce((s, p) => s + (p.margePotentielle || 0), 0)
            : allItems.reduce((s, p) => s + (p.prixFacturé || 0), 0);

          return (
            <div key={column.id}
              className="flex-shrink-0 flex flex-col rounded-xl bg-[var(--bg-secondary)]/30 border border-[var(--border-subtle)]"
              style={{ width: isCompleted ? 200 : 260 }}>

              {/* En-tête colonne */}
              <div className="flex-shrink-0 px-3 py-2 border-b border-[var(--border-subtle)]">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: column.color }} />
                  <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-primary)]">{column.label}</span>
                  {isCompleted && <span className="text-[var(--text-muted)]/60 ml-1">{LOCK_ICON}</span>}
                  <span className="text-[10px] text-[var(--text-muted)] ml-auto">{allItems.length}</span>
                </div>
                {columnTotal > 0 && (
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-base font-bold" style={{ color: column.id === 'to_quote' ? 'var(--accent-violet)' : '#22c55e' }}>
                      {columnTotal.toLocaleString('fr-FR')}
                    </span>
                    <span className="text-[10px]" style={{ color: column.id === 'to_quote' ? 'var(--accent-violet)' : '#22c55e', opacity: 0.7 }}>
                      €{column.id === 'to_quote' ? ' estimé' : ''}
                    </span>
                  </div>
                )}
              </div>

              {/* Contenu */}
              <div className={`flex-1 overflow-y-auto p-2 ${isCompleted ? 'space-y-2' : 'space-y-3'}`}>
                {allItems.length === 0 ? (
                  <div className="text-center py-8 text-[var(--text-muted)] text-xs">Aucun produit</div>
                ) : (
                  Array.from(groups.entries()).map(([key, prods]) => {
                    const [clientId, projetOrSolo] = key.split('||');
                    const hasProjet = projetOrSolo !== '__solo__';
                    const nomProjet = hasProjet ? projetOrSolo : undefined;
                    const deposit = hasProjet ? prods.find(p => p.depositAmount)?.depositAmount : undefined;
                    const isCollapsed = collapsed[key] ?? false;

                    return (
                      <div key={key}>
                        {hasProjet && (
                          <ProjetBandeau
                            nomProjet={nomProjet!}
                            clientId={clientId}
                            clientName={prods[0].clientName}
                            deposit={deposit}
                            collapsed={isCollapsed}
                            onToggle={() => toggle(key)}
                            onOpenModal={() => setOpenProjet({ nomProjet: nomProjet!, clientId })}
                            onOpenClient={() => setOpenClient(clientId)}
                          />
                        )}
                        {!isCollapsed && (
                          <div className={hasProjet ? 'pl-3 border-l border-[var(--border-subtle)]' : ''}>
                            {prods.map((p, i) => (
                              <ProductionCard
                                key={p.id}
                                name={p.name}
                                clientName={hasProjet ? '' : p.clientName}
                                prixFacturé={p.prixFacturé}
                                assigneeInitials={isCompleted ? undefined : p.assigneeInitials}
                                assigneeColor={p.assigneeColor}
                                isCompact={isCompleted}
                                isFirst={i === 0}
                                isLast={i === prods.length - 1}
                                isOption={p.isOption}
                                onClick={() => setOpenProduct(p)}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modales */}
      {openProduct && (
        <ProductModal
          product={openProduct}
          allNomsProjets={allNomsProjets}
          onClose={() => setOpenProduct(null)}
        />
      )}
      {openProjet && (
        <ProjetModal
          nomProjet={openProjet.nomProjet}
          clientId={openProjet.clientId}
          clientName={projetProducts[0]?.clientName ?? ''}
          products={projetProducts}
          onClose={() => setOpenProjet(null)}
          onOpenProduct={p => setOpenProduct(p)}
        />
      )}
      {openClient && (
        <ClientModal
          clientId={openClient}
          onClose={() => setOpenClient(null)}
          onOpenProduct={p => { setOpenClient(null); setOpenProduct(p); }}
          onOpenProjet={(nomProjet, cid) => { setOpenClient(null); setOpenProjet({ nomProjet, clientId: cid }); }}
        />
      )}
    </div>
  );
}

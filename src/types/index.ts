// YAM Dashboard - Core Types

export type ClientStatus = 'prospect' | 'client';

export type DeliverableType = 'creative' | 'document' | 'other';

/** Catégorie pour afficher / filtrer : print (ex. cartes de visite), digital (ex. site), autre */
export type DeliverableCategory = 'print' | 'digital' | 'other';

export type DeliverableStatus = 'to_quote' | 'pending' | 'in-progress' | 'completed';

export type BillingStatus =
  | 'pending'       // En attente de facturation
  | 'deposit'       // Acompte facturé
  | 'progress'      // Avancement facturé
  | 'balance';      // Soldé (facturé et payé)

export type TeamMemberRole = 'founder' | 'employee' | 'freelance';

export interface TeamMember {
  id: string;
  name: string;
  initials: string;
  role: TeamMemberRole;
  color: string; // Pour l'avatar
  email?: string;
}

export interface Contact {
  id: string;
  name: string;
  role: string;
  email: string;
  phone?: string;
}

export type DocumentType = 'brief' | 'report' | 'note' | 'creative-strategy' | 'web-brief' | 'social-brief';

export interface ClientDocument {
  id: string;
  type: DocumentType;
  title: string;
  content: string;
  projectId?: string; // undefined = doc client, string = doc projet
  createdAt: Date;
  updatedAt: Date;
}

/** Lien externe sur une fiche client (Figma, site, proto, etc.) */
export interface ClientLink {
  id: string;
  title: string;
  url: string;
}

/** Labels suggérés pour "Ajouter une URL" sur la fiche client */
export const LINK_SUGGESTED_LABELS = [
  'Figma',
  'Prez Figma',
  'Zoning',
  'Site internet',
  'Proto web',
  'Maquette',
] as const;

export type LinkSuggestedLabel = (typeof LINK_SUGGESTED_LABELS)[number];

export interface Client {
  id: string;
  name: string;
  status: ClientStatus;
  links?: ClientLink[];
  contacts: Contact[];
  documents: ClientDocument[];
  createdAt: Date;
  updatedAt: Date;
}

export interface BillingHistory {
  id: string;
  deliverableId: string;
  status: BillingStatus;
  amount?: number;        // Montant facturé (optionnel)
  notes?: string;         // Notes (ex: "Acompte 30%")
  changedAt: Date;
  changedBy?: string;     // user_id
}

// ─── Projects ──────────────────────────────────────────────────────

export type ProjectBillingStatus = 'none' | 'quoted' | 'deposit' | 'progress' | 'balanced';

export interface Project {
  id: string;
  clientId: string;
  name: string;
  quoteAmount?: number | null;
  quoteDate?: string;
  depositAmount?: number;
  depositDate?: string;
  progressAmounts: number[];
  progressDates: string[];
  balanceDate?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectBillingInfo {
  status: ProjectBillingStatus;
  totalProductInvoiced: number;
  totalProjectPayments: number;
  totalPaid: number;
  remaining: number;
  progressPercent: number;
}

// ─── Deliverables ──────────────────────────────────────────────────

export interface Deliverable {
  id: string;
  /** Optionnel : produit créé depuis le backlog sans client assigné */
  clientId?: string;
  /** Optionnel : produit rattaché à un projet */
  projectId?: string;
  name: string;
  /** Optionnel : date de deadline sur la timeline */
  dueDate?: Date;
  /** Si true, le produit apparaît dans le backlog "À planifier". Par défaut false. */
  inBacklog?: boolean;
  type: DeliverableType;
  status: DeliverableStatus;
  assigneeId?: string; // TeamMember id
  createdAt: Date;
  // Détails optionnels (ex. cartes de visite: coût, date livraison; site: prestataire, prix)
  category?: DeliverableCategory; // print | digital | other
  cost?: number; // @deprecated — utiliser prixFacturé / coutSousTraitance
  deliveredAt?: Date; // date effective de livraison
  externalContractor?: string; // prestataire extérieur
  notes?: string;
  /** Prix facturé au client (entrée) — € */
  prixFacturé?: number;
  /** Coût sous-traitance : impression, freelance, etc. (sortie) — € */
  coutSousTraitance?: number;
  /** Si true : ST facture le client directement (hors notre facture), sinon ST nous facture (déduit de la marge) */
  stHorsFacture?: boolean;
  /** Si true : produit potentiel (pipeline), affiché en Compta Potentiel. Sinon : produit réel (facturé). Modifiable à tout moment. */
  isPotentiel?: boolean;
  // Facturation
  billingStatus: BillingStatus;
  quoteAmount?: number | null; // Montant total devisé (null = effacement explicite en base)
  quoteDate?: string;         // Date devis (YYYY-MM-DD)
  depositAmount?: number;     // Montant acompte
  depositDate?: string;       // Date acompte (YYYY-MM-DD)
  progressAmounts?: number[]; // Montants des avancements (peut y en avoir plusieurs)
  progressDates?: string[];   // Dates des avancements
  balanceAmount?: number;     // Montant solde
  balanceDate?: string;       // Date solde (YYYY-MM-DD)
  totalInvoiced?: number;     // Total facturé (auto-calculé)
  /** Marge potentielle Yam — note libre indépendante du calcul facturation — € */
  margePotentielle?: number;
}

/** Type d'événement : appel classique ou présentation client (affichage icône sur la timeline) */
export type CallType = 'call' | 'presentation';

export interface Call {
  id: string;
  /** Optionnel : appel créé depuis le backlog sans client assigné */
  clientId?: string;
  title: string;
  /** Optionnel : si absent, l'appel est dans le backlog (à planifier) */
  scheduledAt?: Date;
  duration: number; // minutes
  assigneeId?: string; // TeamMember id
  /** Détermine l'icône sur la timeline : téléphone vs présentation */
  callType?: CallType;
  notes?: string;
  createdAt: Date;
}

/** Todo du jour : tant qu'elle n'est pas cochée, elle reste affichée (même le lendemain) */
export interface DayTodo {
  id: string;
  text: string;
  forDate: Date; // jour pour lequel la todo a été créée
  done: boolean;
  createdAt: Date;
  scheduledAt?: Date; // si planifiée dans la timeline
  assigneeId?: string; // membre assigné
}

// Timeline item for unified display
export interface TimelineItem {
  id: string;
  clientId: string;
  type: 'deliverable' | 'call';
  date: Date;
  label: string;
  status?: DeliverableStatus;
  deliverableType?: DeliverableType;
}

// Retroplanning
export type RetroplanningTaskColor = 'cyan' | 'lime' | 'violet' | 'coral' | 'amber' | 'magenta';

export interface RetroplanningTask {
  id: string;
  label: string;
  startDate: string;      // ISO YYYY-MM-DD (computed)
  endDate: string;        // ISO YYYY-MM-DD (computed)
  durationDays: number;
  color: RetroplanningTaskColor;
}

export interface RetroplanningPlan {
  id?: string;            // Supabase row id
  clientId: string;
  deadline: string;       // ISO YYYY-MM-DD
  tasks: RetroplanningTask[];
  generatedAt: string;    // ISO datetime
  updatedAt: string;      // ISO datetime
}

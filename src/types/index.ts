// YAM Dashboard - Core Types

export type ClientStatus = 'prospect' | 'client';

export type DeliverableType = 'creative' | 'document' | 'other';

/** Catégorie pour afficher / filtrer : print (ex. cartes de visite), digital (ex. site), autre */
export type DeliverableCategory = 'print' | 'digital' | 'other';

export type DeliverableStatus = 'pending' | 'in-progress' | 'completed';

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

export type DocumentType = 'brief' | 'report' | 'note';

export interface ClientDocument {
  id: string;
  type: DocumentType;
  title: string;
  content: string;
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

export interface Deliverable {
  id: string;
  /** Optionnel : livrable créé depuis le backlog sans client assigné */
  clientId?: string;
  name: string;
  /** Optionnel : si absent, le livrable est dans le backlog (à planifier) */
  dueDate?: Date;
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
  /** Si true : livrable potentiel (pipeline), affiché en Compta Potentiel. Sinon : livrable réel (facturé). Modifiable à tout moment. */
  isPotentiel?: boolean;
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

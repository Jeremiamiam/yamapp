/**
 * Schema TypeScript pour seed.json — structure normalisée (prête pour migration Supabase).
 * Toutes les dates sont en string ISO dans le JSON.
 */

export type ClientStatus = 'prospect' | 'client';
export type DeliverableType = 'creative' | 'document' | 'other';
export type DeliverableCategory = 'print' | 'digital' | 'other';
export type DeliverableStatus = 'pending' | 'in-progress' | 'completed';
export type TeamMemberRole = 'founder' | 'employee' | 'freelance';
export type DocumentType = 'brief' | 'report' | 'note';
export type CallType = 'call' | 'presentation';

export interface SeedTeamMember {
  id: string;
  name: string;
  initials: string;
  role: TeamMemberRole;
  color: string;
  email?: string;
}

export interface SeedClient {
  id: string;
  name: string;
  status: ClientStatus;
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

export interface SeedContact {
  id: string;
  clientId: string;
  name: string;
  role: string;
  email: string;
  phone?: string;
}

export interface SeedClientLink {
  id: string;
  clientId: string;
  title: string;
  url: string;
}

export interface SeedDocument {
  id: string;
  clientId: string;
  type: DocumentType;
  title: string;
  content: string;
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

export interface SeedDeliverable {
  id: string;
  clientId?: string;
  name: string;
  dueDate?: string; // ISO
  type: DeliverableType;
  status: DeliverableStatus;
  assigneeId?: string;
  category?: DeliverableCategory;
  deliveredAt?: string; // ISO
  externalContractor?: string;
  notes?: string;
  prixFacturé?: number;
  coutSousTraitance?: number;
  createdAt: string; // ISO
}

export interface SeedCall {
  id: string;
  clientId?: string;
  title: string;
  scheduledAt?: string; // ISO
  duration: number;
  assigneeId?: string;
  callType?: CallType;
  notes?: string;
  createdAt: string; // ISO
}

export interface SeedComptaMonth {
  month: string;
  year: number;
  entrées: number;
  sorties: number;
  soldeCumulé: number;
}

export interface SeedData {
  team: SeedTeamMember[];
  clients: SeedClient[];
  contacts: SeedContact[];
  clientLinks: SeedClientLink[];
  documents: SeedDocument[];
  deliverables: SeedDeliverable[];
  calls: SeedCall[];
  comptaMonthly: SeedComptaMonth[];
}

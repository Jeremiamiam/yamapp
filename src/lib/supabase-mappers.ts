/**
 * Mappers Supabase (snake_case) ↔ App (camelCase).
 * Utilisé par le store pour loadData() et les CRUD async.
 */

import type {
  Client,
  Deliverable,
  Call,
  Contact,
  ClientDocument,
  ClientLink,
  TeamMember,
} from '@/types';

// Types pour les rows Supabase (snake_case)
interface TeamRow {
  id: string;
  name: string;
  initials: string;
  role: string;
  color: string;
  email?: string | null;
}

interface ClientRow {
  id: string;
  name: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface ContactRow {
  id: string;
  client_id: string;
  name: string;
  role: string;
  email: string;
  phone?: string | null;
}

interface ClientLinkRow {
  id: string;
  client_id: string;
  title: string;
  url: string;
}

interface DocumentRow {
  id: string;
  client_id: string;
  type: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

interface DeliverableRow {
  id: string;
  client_id?: string | null;
  name: string;
  due_date?: string | null;
  type: string;
  status: string;
  assignee_id?: string | null;
  category?: string | null;
  delivered_at?: string | null;
  external_contractor?: string | null;
  notes?: string | null;
  prix_facture?: number | null;
  cout_sous_traitance?: number | null;
  is_potentiel?: boolean | null;
  created_at: string;
}

interface CallRow {
  id: string;
  client_id?: string | null;
  title: string;
  scheduled_at?: string | null;
  duration: number;
  assignee_id?: string | null;
  call_type?: string | null;
  notes?: string | null;
  created_at: string;
}

// --- Supabase → App ---

export function mapTeamRow(row: TeamRow): TeamMember {
  return {
    id: row.id,
    name: row.name,
    initials: row.initials,
    role: row.role as TeamMember['role'],
    color: row.color,
    email: row.email ?? undefined,
  };
}

export function mapClientRow(row: ClientRow): Omit<Client, 'contacts' | 'documents' | 'links'> {
  return {
    id: row.id,
    name: row.name,
    status: row.status as Client['status'],
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export function mapContactRow(row: ContactRow): Contact {
  return {
    id: row.id,
    name: row.name,
    role: row.role,
    email: row.email,
    phone: row.phone ?? undefined,
  };
}

export function mapClientLinkRow(row: ClientLinkRow): ClientLink {
  return {
    id: row.id,
    title: row.title,
    url: row.url,
  };
}

export function mapDocumentRow(row: DocumentRow): ClientDocument {
  return {
    id: row.id,
    type: row.type as ClientDocument['type'],
    title: row.title,
    content: row.content,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export function mapDeliverableRow(row: DeliverableRow): Deliverable {
  return {
    id: row.id,
    clientId: row.client_id ?? undefined,
    name: row.name,
    dueDate: row.due_date ? new Date(row.due_date) : undefined,
    type: row.type as Deliverable['type'],
    status: row.status as Deliverable['status'],
    assigneeId: row.assignee_id ?? undefined,
    category: (row.category as Deliverable['category']) ?? undefined,
    deliveredAt: row.delivered_at ? new Date(row.delivered_at) : undefined,
    externalContractor: row.external_contractor ?? undefined,
    notes: row.notes ?? undefined,
    prixFacturé: row.prix_facture != null ? Number(row.prix_facture) : undefined,
    coutSousTraitance: row.cout_sous_traitance != null ? Number(row.cout_sous_traitance) : undefined,
    isPotentiel: row.is_potentiel === true,
    createdAt: new Date(row.created_at),
  };
}

export function mapCallRow(row: CallRow): Call {
  return {
    id: row.id,
    clientId: row.client_id ?? undefined,
    title: row.title,
    scheduledAt: row.scheduled_at ? new Date(row.scheduled_at) : undefined,
    duration: row.duration,
    assigneeId: row.assignee_id ?? undefined,
    callType: (row.call_type as Call['callType']) ?? undefined,
    notes: row.notes ?? undefined,
    createdAt: new Date(row.created_at),
  };
}

// --- App → Supabase (pour insert/update) ---

export function toSupabaseClient(data: Pick<Client, 'name' | 'status'>) {
  return {
    name: data.name.trim(),
    status: data.status,
  };
}

export function toSupabaseContact(data: Omit<Contact, 'id'>) {
  return {
    name: data.name,
    role: data.role,
    email: data.email,
    phone: data.phone ?? null,
  };
}

export function toSupabaseClientLink(data: Omit<ClientLink, 'id'>) {
  return {
    title: data.title,
    url: data.url,
  };
}

export function toSupabaseDocument(data: Partial<ClientDocument> & { type: ClientDocument['type']; title: string; content: string }) {
  return {
    type: data.type,
    title: data.title,
    content: data.content ?? '',
  };
}

export function toSupabaseDeliverable(data: Partial<Deliverable>) {
  return {
    client_id: data.clientId ?? null,
    name: data.name,
    due_date: data.dueDate ? data.dueDate.toISOString() : null,
    type: data.type,
    status: data.status,
    assignee_id: data.assigneeId ?? null,
    category: data.category ?? null,
    delivered_at: data.deliveredAt ? data.deliveredAt.toISOString() : null,
    external_contractor: data.externalContractor ?? null,
    notes: data.notes ?? null,
    prix_facture: data.prixFacturé ?? null,
    cout_sous_traitance: data.coutSousTraitance ?? null,
    is_potentiel: data.isPotentiel === true,
  };
}

export function toSupabaseCall(data: Partial<Call>) {
  return {
    client_id: data.clientId ?? null,
    title: data.title,
    scheduled_at: data.scheduledAt ? data.scheduledAt.toISOString() : null,
    duration: data.duration ?? 30,
    assignee_id: data.assigneeId ?? null,
    call_type: data.callType ?? 'call',
    notes: data.notes ?? null,
  };
}

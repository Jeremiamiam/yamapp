import type { Client, Deliverable, Call, TeamMember, ClientDocument, Contact, ClientLink } from '@/types';
import type { SeedData } from '@/lib/seed-types';

import seed from './seed.json';

const data = seed as SeedData;

/** Date d’ancrage du seed (ex. 2025-02-14). On décale les dueDate/scheduledAt pour que “aujourd’hui” du seed devienne le vrai aujourd’hui. */
const SEED_ANCHOR = new Date('2025-02-14T00:00:00.000Z');
const SEED_ANCHOR_MS = SEED_ANCHOR.getTime();

function getTimelineDateOffsetMs(): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today.getTime() - SEED_ANCHOR_MS;
}

function parseDate(s: string | undefined): Date | undefined {
  if (s == null || s === '') return undefined;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

/** Décale une date pour qu’elle tombe dans la plage “aujourd’hui + N jours” par rapport à la vraie date. */
function shiftTimelineDate(date: Date | undefined, offsetMs: number): Date | undefined {
  if (date == null) return undefined;
  return new Date(date.getTime() + offsetMs);
}

function hydrateDeliverables(): Deliverable[] {
  const offsetMs = getTimelineDateOffsetMs();
  return data.deliverables.map((d) => ({
    id: d.id,
    clientId: d.clientId,
    name: d.name,
    dueDate: shiftTimelineDate(parseDate(d.dueDate), offsetMs),
    type: d.type,
    status: d.status,
    assigneeId: d.assigneeId,
    category: d.category,
    deliveredAt: parseDate(d.deliveredAt),
    externalContractor: d.externalContractor,
    notes: d.notes,
    prixFacturé: d.prixFacturé,
    coutSousTraitance: d.coutSousTraitance,
    createdAt: parseDate(d.createdAt)!,
  }));
}

function hydrateCalls(): Call[] {
  const offsetMs = getTimelineDateOffsetMs();
  return data.calls.map((c) => ({
    id: c.id,
    clientId: c.clientId,
    title: c.title,
    scheduledAt: shiftTimelineDate(parseDate(c.scheduledAt), offsetMs),
    duration: c.duration,
    assigneeId: c.assigneeId,
    callType: c.callType,
    notes: c.notes,
    createdAt: parseDate(c.createdAt)!,
  }));
}

function hydrateClients(): Client[] {
  return data.clients.map((c) => {
    const contacts: Contact[] = data.contacts
      .filter((ct) => ct.clientId === c.id)
      .map((ct) => ({
        id: ct.id,
        name: ct.name,
        role: ct.role,
        email: ct.email,
        phone: ct.phone,
      }));
    const documents: ClientDocument[] = data.documents
      .filter((doc) => doc.clientId === c.id)
      .map((doc) => ({
        id: doc.id,
        type: doc.type,
        title: doc.title,
        content: doc.content,
        createdAt: parseDate(doc.createdAt)!,
        updatedAt: parseDate(doc.updatedAt)!,
      }));
    const links: ClientLink[] = (data.clientLinks ?? [])
      .filter((l) => l.clientId === c.id)
      .map((l) => ({ id: l.id, title: l.title, url: l.url }));
    return {
      id: c.id,
      name: c.name,
      status: c.status,
      contacts,
      documents,
      links: links.length > 0 ? links : undefined,
      createdAt: parseDate(c.createdAt)!,
      updatedAt: parseDate(c.updatedAt)!,
    };
  });
}

// Team: no dates, use as-is with type assertion
export const mockTeam: TeamMember[] = data.team as TeamMember[];

export const mockClients: Client[] = hydrateClients();
export const mockDeliverables: Deliverable[] = hydrateDeliverables();
export const mockCalls: Call[] = hydrateCalls();

export const mockComptaMonthly = data.comptaMonthly;

export type MonthlyComptaData = {
  month: string;
  year: number;
  entrées: number;
  sorties: number;
  soldeCumulé: number;
};

export const getClientById = (id: string): Client | undefined =>
  mockClients.find((c) => c.id === id);

export const getTeamMemberById = (id: string): TeamMember | undefined =>
  mockTeam.find((m) => m.id === id);

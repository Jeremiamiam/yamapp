import { create } from 'zustand';
import { Client, ClientLink, ClientStatus, Deliverable, Call, CallType, TeamMember, Contact, ClientDocument, DeliverableStatus } from '@/types';
import { handleError, AppError } from './error-handler';
import { createClient } from '@/lib/supabase/client';
import {
  mapTeamRow,
  mapClientRow,
  mapContactRow,
  mapClientLinkRow,
  mapDocumentRow,
  mapDeliverableRow,
  mapCallRow,
  toSupabaseClient,
  toSupabaseContact,
  toSupabaseClientLink,
  toSupabaseDocument,
  toSupabaseDeliverable,
  toSupabaseCall,
} from './supabase-mappers';

type ViewType = 'timeline' | 'clients' | 'client-detail' | 'compta';

// Filter types
type ClientStatusFilter = 'all' | 'prospect' | 'client';

interface TimelineFilters {
  clientStatus: ClientStatusFilter;
  teamMemberId: string | null; // null = tous
}

// Modal types for CRUD operations
type ModalType = 
  | { type: 'contact'; mode: 'create' | 'edit'; clientId: string; contact?: Contact }
  | { type: 'document'; mode: 'create' | 'edit'; clientId: string; document?: ClientDocument }
  | { type: 'deliverable'; mode: 'create' | 'edit'; clientId?: string; deliverable?: Deliverable }
  | { type: 'call'; mode: 'create' | 'edit'; clientId?: string; call?: Call; presetCallType?: CallType }
  | { type: 'client'; mode: 'create' | 'edit'; client?: Client }
  | null;

interface AppState {
  // Data
  clients: Client[];
  deliverables: Deliverable[];
  calls: Call[];
  team: TeamMember[];
  comptaMonthly: { month: string; year: number; entrées: number; sorties: number; soldeCumulé: number }[];
  isLoading: boolean;
  loadingError: string | null;

  loadData: () => Promise<void>;

  // UI State
  currentView: ViewType;
  selectedClientId: string | null;
  selectedDocument: ClientDocument | null;
  activeModal: ModalType;
  filters: TimelineFilters;
  timelineRange: {
    start: Date;
    end: Date;
  };
  
  // Navigation Actions
  navigateToClient: (clientId: string) => void;
  navigateToTimeline: () => void;
  navigateToClients: () => void;
  navigateToCompta: () => void;
  openDocument: (doc: ClientDocument) => void;
  closeDocument: () => void;
  
  // Modal Actions
  openModal: (modal: ModalType) => void;
  closeModal: () => void;
  
  // CRUD Actions - Contacts (async Supabase)
  addContact: (clientId: string, contact: Omit<Contact, 'id'>) => Promise<void>;
  updateContact: (clientId: string, contactId: string, data: Partial<Contact>) => Promise<void>;
  deleteContact: (clientId: string, contactId: string) => Promise<void>;

  // CRUD Actions - Clients (async Supabase)
  addClient: (data: Pick<Client, 'name' | 'status'>) => Promise<void>;
  updateClient: (id: string, data: Partial<Pick<Client, 'name' | 'status'>>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;

  // CRUD Actions - Client links (async Supabase)
  addClientLink: (clientId: string, link: Omit<ClientLink, 'id'>) => Promise<void>;
  deleteClientLink: (clientId: string, linkId: string) => Promise<void>;

  // CRUD Actions - Documents (async Supabase)
  addDocument: (clientId: string, doc: Omit<ClientDocument, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateDocument: (clientId: string, docId: string, data: Partial<ClientDocument>) => Promise<void>;
  deleteDocument: (clientId: string, docId: string) => Promise<void>;

  // CRUD Actions - Deliverables (async Supabase)
  addDeliverable: (deliverable: Omit<Deliverable, 'id' | 'createdAt'>) => Promise<void>;
  updateDeliverable: (id: string, data: Partial<Deliverable>) => Promise<void>;
  deleteDeliverable: (id: string) => Promise<void>;
  toggleDeliverableStatus: (id: string) => Promise<void>;

  // CRUD Actions - Calls (async Supabase)
  addCall: (call: Omit<Call, 'id' | 'createdAt'>) => Promise<void>;
  updateCall: (id: string, data: Partial<Call>) => Promise<void>;
  deleteCall: (id: string) => Promise<void>;
  
  // Filter Actions
  setClientStatusFilter: (status: ClientStatusFilter) => void;
  setTeamMemberFilter: (memberId: string | null) => void;
  resetFilters: () => void;
  
  // Other Actions
  setTimelineRange: (start: Date, end: Date) => void;
  
  // Data helpers
  getClientById: (id: string) => Client | undefined;
  getTeamMemberById: (id: string) => TeamMember | undefined;
  getDeliverablesByClientId: (clientId: string) => Deliverable[];
  getCallsByClientId: (clientId: string) => Call[];
  getBacklogDeliverables: () => Deliverable[];
  getBacklogCalls: () => Call[];
  /** Sélecteurs optimisés : deliverables/calls filtrés par plage timeline + filtres (clientStatus, teamMemberId) */
  getFilteredDeliverables: () => Deliverable[];
  getFilteredCalls: () => Call[];
}

// Default timeline range: aujourd'hui à gauche, 90 jours en avant (3 mois)
const getDefaultTimelineRange = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  
  const end = new Date();
  end.setDate(end.getDate() + 90);
  end.setHours(23, 59, 59, 999);
  
  return { start, end };
};

export const useAppStore = create<AppState>((set, get) => ({
  clients: [],
  deliverables: [],
  calls: [],
  team: [],
  comptaMonthly: [],
  isLoading: false,
  loadingError: null,

  loadData: async () => {
    set({ isLoading: true, loadingError: null });
    try {
      const supabase = createClient();
      const [teamRes, clientsRes, contactsRes, linksRes, docsRes, delivRes, callsRes, comptaRes] = await Promise.all([
        supabase.from('team').select('id,name,initials,role,color,email'),
        supabase.from('clients').select('*'),
        supabase.from('contacts').select('*'),
        supabase.from('client_links').select('*'),
        supabase.from('documents').select('*'),
        supabase.from('deliverables').select('*'),
        supabase.from('calls').select('*'),
        supabase.from('compta_monthly').select('month,year,entrees,sorties,solde_cumule'),
      ]);
      if (teamRes.error) throw teamRes.error;
      if (clientsRes.error) throw clientsRes.error;
      if (contactsRes.error) throw contactsRes.error;
      if (linksRes.error) throw linksRes.error;
      if (docsRes.error) throw docsRes.error;
      if (delivRes.error) throw delivRes.error;
      if (callsRes.error) throw callsRes.error;
      if (comptaRes.error) throw comptaRes.error;

      const teamRows = teamRes.data ?? [];
      const clientsData = clientsRes.data ?? [];
      const contactsData = contactsRes.data ?? [];
      const linksData = linksRes.data ?? [];
      const docsData = docsRes.data ?? [];
      const delivData = delivRes.data ?? [];
      const callsData = callsRes.data ?? [];
      const comptaData = comptaRes.data ?? [];

      const team = teamRows.map(mapTeamRow);
      const clients: Client[] = clientsData.map((row) => {
        const base = mapClientRow(row);
        return {
          ...base,
          contacts: contactsData.filter((c: { client_id: string }) => c.client_id === row.id).map(mapContactRow),
          documents: docsData.filter((d: { client_id: string }) => d.client_id === row.id).map(mapDocumentRow),
          links: linksData.filter((l: { client_id: string }) => l.client_id === row.id).map(mapClientLinkRow),
        };
      });
      const deliverables = delivData.map(mapDeliverableRow);
      const calls = callsData.map(mapCallRow);
      const comptaMonthly = comptaData.map((m: { month: string; year: number; entrees: number; sorties: number; solde_cumule: number }) => ({
        month: m.month,
        year: m.year,
        entrées: Number(m.entrees),
        sorties: Number(m.sorties),
        soldeCumulé: Number(m.solde_cumule),
      }));

      set({
        team,
        clients,
        deliverables,
        calls,
        comptaMonthly,
        isLoading: false,
        loadingError: null,
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      set({ isLoading: false, loadingError: message });
      handleError(new AppError(message, 'LOAD_DATA_FAILED', 'Impossible de charger les données'));
    }
  },

  // UI State
  currentView: 'timeline',
  selectedClientId: null,
  selectedDocument: null,
  activeModal: null,
  filters: {
    clientStatus: 'all',
    teamMemberId: null,
  },
  timelineRange: getDefaultTimelineRange(),
  
  // Navigation Actions
  navigateToClient: (clientId) => set({ 
    currentView: 'client-detail', 
    selectedClientId: clientId 
  }),
  navigateToTimeline: () => set({ 
    currentView: 'timeline', 
    selectedClientId: null 
  }),
  navigateToClients: () => set({ 
    currentView: 'clients', 
    selectedClientId: null 
  }),
  navigateToCompta: () => set({ 
    currentView: 'compta', 
    selectedClientId: null 
  }),
  openDocument: (doc) => set({ selectedDocument: doc }),
  closeDocument: () => set({ selectedDocument: null }),
  
  // Modal Actions
  openModal: (modal) => set({ activeModal: modal }),
  closeModal: () => set({ activeModal: null }),
  
  // CRUD Actions - Contacts (async Supabase)
  addContact: async (clientId, contactData) => {
    try {
      const id = `contact-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const supabase = createClient();
      const { error } = await supabase.from('contacts').insert({
        id,
        client_id: clientId,
        ...toSupabaseContact(contactData),
      });
      if (error) throw error;
      const contact: Contact = { ...contactData, id };
      set((state) => ({
        clients: state.clients.map((client) =>
          client.id === clientId
            ? { ...client, contacts: [...client.contacts, contact], updatedAt: new Date() }
            : client
        ),
      }));
    } catch (e) {
      handleError(new AppError(String(e), 'CONTACT_ADD_FAILED', "Impossible d'ajouter le contact"));
    }
  },

  updateContact: async (clientId, contactId, data) => {
    try {
      const supabase = createClient();
      const payload: Record<string, unknown> = {};
      if (data.name !== undefined) payload.name = data.name;
      if (data.role !== undefined) payload.role = data.role;
      if (data.email !== undefined) payload.email = data.email;
      if (data.phone !== undefined) payload.phone = data.phone;
      const { error } = await supabase.from('contacts').update(payload).eq('id', contactId).eq('client_id', clientId);
      if (error) throw error;
      set((state) => ({
        clients: state.clients.map((client) =>
          client.id === clientId
            ? {
                ...client,
                contacts: client.contacts.map((c) => (c.id === contactId ? { ...c, ...data } : c)),
                updatedAt: new Date(),
              }
            : client
        ),
      }));
    } catch (e) {
      handleError(new AppError(String(e), 'CONTACT_UPDATE_FAILED', "Impossible de modifier le contact"));
    }
  },

  deleteContact: async (clientId, contactId) => {
    try {
      const supabase = createClient();
      const { error } = await supabase.from('contacts').delete().eq('id', contactId).eq('client_id', clientId);
      if (error) throw error;
      set((state) => ({
        clients: state.clients.map((client) =>
          client.id === clientId
            ? { ...client, contacts: client.contacts.filter((c) => c.id !== contactId), updatedAt: new Date() }
            : client
        ),
      }));
    } catch (e) {
      handleError(new AppError(String(e), 'CONTACT_DELETE_FAILED', "Impossible de supprimer le contact"));
    }
  },

  addClientLink: async (clientId, linkData) => {
    try {
      const id = `link-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const supabase = createClient();
      const { error } = await supabase.from('client_links').insert({
        id,
        client_id: clientId,
        ...toSupabaseClientLink(linkData),
      });
      if (error) throw error;
      const link: ClientLink = { ...linkData, id };
      set((state) => ({
        clients: state.clients.map((client) =>
          client.id === clientId
            ? { ...client, links: [...(client.links ?? []), link], updatedAt: new Date() }
            : client
        ),
      }));
    } catch (e) {
      handleError(new AppError(String(e), 'LINK_ADD_FAILED', "Impossible d'ajouter le lien"));
    }
  },

  deleteClientLink: async (clientId, linkId) => {
    try {
      const supabase = createClient();
      const { error } = await supabase.from('client_links').delete().eq('id', linkId).eq('client_id', clientId);
      if (error) throw error;
      set((state) => ({
        clients: state.clients.map((client) =>
          client.id === clientId
            ? { ...client, links: (client.links ?? []).filter((l) => l.id !== linkId), updatedAt: new Date() }
            : client
        ),
      }));
    } catch (e) {
      handleError(new AppError(String(e), 'LINK_DELETE_FAILED', "Impossible de supprimer le lien"));
    }
  },

  addClient: async (data: { name: string; status: ClientStatus }) => {
    try {
      const id = `client-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const supabase = createClient();
      const { error } = await supabase.from('clients').insert({
        id,
        ...toSupabaseClient(data),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
      const client: Client = {
        id,
        name: data.name.trim(),
        status: data.status,
        contacts: [],
        documents: [],
        links: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      set((state) => ({ clients: [...state.clients, client] }));
    } catch (e) {
      handleError(new AppError(String(e), 'CLIENT_ADD_FAILED', "Impossible d'ajouter le client"));
    }
  },

  updateClient: async (id, data) => {
    try {
      const supabase = createClient();
      const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (data.name !== undefined) payload.name = data.name.trim();
      if (data.status !== undefined) payload.status = data.status;
      const { error } = await supabase.from('clients').update(payload).eq('id', id);
      if (error) throw error;
      set((state) => ({
        clients: state.clients.map((c) => (c.id === id ? { ...c, ...data, updatedAt: new Date() } : c)),
      }));
    } catch (e) {
      handleError(new AppError(String(e), 'CLIENT_UPDATE_FAILED', "Impossible de modifier le client"));
    }
  },

  deleteClient: async (id) => {
    try {
      const supabase = createClient();
      const { error } = await supabase.from('clients').delete().eq('id', id);
      if (error) throw error;
      set((state) => ({
        clients: state.clients.filter((c) => c.id !== id),
        deliverables: state.deliverables.filter((d) => d.clientId !== id),
        calls: state.calls.filter((c) => c.clientId !== id),
        selectedClientId: state.selectedClientId === id ? null : state.selectedClientId,
      }));
    } catch (e) {
      handleError(new AppError(String(e), 'CLIENT_DELETE_FAILED', "Impossible de supprimer le client"));
    }
  },

  // CRUD Actions - Documents (async Supabase)
  addDocument: async (clientId, docData) => {
    try {
      const id = `doc-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const now = new Date();
      const supabase = createClient();
      const { error } = await supabase.from('documents').insert({
        id,
        client_id: clientId,
        ...toSupabaseDocument(docData),
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      });
      if (error) throw error;
      const doc: ClientDocument = { ...docData, id, createdAt: now, updatedAt: now };
      set((state) => ({
        clients: state.clients.map((client) =>
          client.id === clientId ? { ...client, documents: [...client.documents, doc], updatedAt: now } : client
        ),
      }));
    } catch (e) {
      handleError(new AppError(String(e), 'DOC_ADD_FAILED', "Impossible d'ajouter le document"));
    }
  },

  updateDocument: async (clientId, docId, data) => {
    try {
      const supabase = createClient();
      const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (data.type !== undefined) payload.type = data.type;
      if (data.title !== undefined) payload.title = data.title;
      if (data.content !== undefined) payload.content = data.content;
      const { error } = await supabase.from('documents').update(payload).eq('id', docId).eq('client_id', clientId);
      if (error) throw error;
      set((state) => ({
        clients: state.clients.map((client) =>
          client.id === clientId
            ? {
                ...client,
                documents: client.documents.map((d) => (d.id === docId ? { ...d, ...data, updatedAt: new Date() } : d)),
                updatedAt: new Date(),
              }
            : client
        ),
        selectedDocument:
          state.selectedDocument?.id === docId ? { ...state.selectedDocument, ...data, updatedAt: new Date() } : state.selectedDocument,
      }));
    } catch (e) {
      handleError(new AppError(String(e), 'DOC_UPDATE_FAILED', "Impossible de modifier le document"));
    }
  },

  deleteDocument: async (clientId, docId) => {
    try {
      const supabase = createClient();
      const { error } = await supabase.from('documents').delete().eq('id', docId).eq('client_id', clientId);
      if (error) throw error;
      set((state) => ({
        clients: state.clients.map((client) =>
          client.id === clientId
            ? { ...client, documents: client.documents.filter((d) => d.id !== docId), updatedAt: new Date() }
            : client
        ),
        selectedDocument: state.selectedDocument?.id === docId ? null : state.selectedDocument,
      }));
    } catch (e) {
      handleError(new AppError(String(e), 'DOC_DELETE_FAILED', "Impossible de supprimer le document"));
    }
  },
  
  // CRUD Actions - Deliverables (async Supabase)
  addDeliverable: async (deliverableData) => {
    try {
      const id = `deliv-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const now = new Date();
      const supabase = createClient();
      const { error } = await supabase.from('deliverables').insert({
        id,
        ...toSupabaseDeliverable(deliverableData),
        created_at: now.toISOString(),
      });
      if (error) throw error;
      const deliv: Deliverable = { ...deliverableData, id, createdAt: now };
      set((state) => ({ deliverables: [...state.deliverables, deliv] }));
    } catch (e) {
      handleError(new AppError(String(e), 'DELIV_ADD_FAILED', "Impossible d'ajouter le livrable"));
    }
  },

  updateDeliverable: async (id, data) => {
    try {
      const supabase = createClient();
      const payload = toSupabaseDeliverable(data);
      const dbPayload: Record<string, unknown> = {};
      Object.entries(payload).forEach(([k, v]) => {
        if (v !== undefined) dbPayload[k] = v;
      });
      const { error } = await supabase.from('deliverables').update(dbPayload).eq('id', id);
      if (error) throw error;
      set((state) => ({
        deliverables: state.deliverables.map((d) => (d.id === id ? { ...d, ...data } : d)),
      }));
    } catch (e) {
      handleError(new AppError(String(e), 'DELIV_UPDATE_FAILED', "Impossible de modifier le livrable"));
    }
  },

  deleteDeliverable: async (id) => {
    try {
      const supabase = createClient();
      const { error } = await supabase.from('deliverables').delete().eq('id', id);
      if (error) throw error;
      set((state) => ({ deliverables: state.deliverables.filter((d) => d.id !== id) }));
    } catch (e) {
      handleError(new AppError(String(e), 'DELIV_DELETE_FAILED', "Impossible de supprimer le livrable"));
    }
  },

  toggleDeliverableStatus: async (id) => {
    const state = get();
    const d = state.deliverables.find((x) => x.id === id);
    if (!d) return;
    const statusOrder: DeliverableStatus[] = ['pending', 'in-progress', 'completed'];
    const nextStatus = statusOrder[(statusOrder.indexOf(d.status) + 1) % statusOrder.length];
    try {
      const supabase = createClient();
      const { error } = await supabase.from('deliverables').update({ status: nextStatus }).eq('id', id);
      if (error) throw error;
      set((s) => ({
        deliverables: s.deliverables.map((x) => (x.id === id ? { ...x, status: nextStatus } : x)),
      }));
    } catch (e) {
      handleError(new AppError(String(e), 'DELIV_UPDATE_FAILED', "Impossible de modifier le statut"));
    }
  },

  // CRUD Actions - Calls (async Supabase)
  addCall: async (callData) => {
    try {
      const id = `call-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const now = new Date();
      const supabase = createClient();
      const { error } = await supabase.from('calls').insert({
        id,
        ...toSupabaseCall(callData),
        created_at: now.toISOString(),
      });
      if (error) throw error;
      const call: Call = { ...callData, id, createdAt: now };
      set((state) => ({ calls: [...state.calls, call] }));
    } catch (e) {
      handleError(new AppError(String(e), 'CALL_ADD_FAILED', "Impossible d'ajouter l'appel"));
    }
  },

  updateCall: async (id, data) => {
    try {
      const supabase = createClient();
      const payload = toSupabaseCall(data);
      const dbPayload: Record<string, unknown> = {};
      Object.entries(payload).forEach(([k, v]) => {
        if (v !== undefined) dbPayload[k] = v;
      });
      const { error } = await supabase.from('calls').update(dbPayload).eq('id', id);
      if (error) throw error;
      set((state) => ({
        calls: state.calls.map((c) => (c.id === id ? { ...c, ...data } : c)),
      }));
    } catch (e) {
      handleError(new AppError(String(e), 'CALL_UPDATE_FAILED', "Impossible de modifier l'appel"));
    }
  },

  deleteCall: async (id) => {
    try {
      const supabase = createClient();
      const { error } = await supabase.from('calls').delete().eq('id', id);
      if (error) throw error;
      set((state) => ({ calls: state.calls.filter((c) => c.id !== id) }));
    } catch (e) {
      handleError(new AppError(String(e), 'CALL_DELETE_FAILED', "Impossible de supprimer l'appel"));
    }
  },
  
  // Filter Actions
  setClientStatusFilter: (status) => set(state => ({
    filters: { ...state.filters, clientStatus: status }
  })),
  setTeamMemberFilter: (memberId) => set(state => ({
    filters: { ...state.filters, teamMemberId: memberId }
  })),
  resetFilters: () => set({
    filters: { clientStatus: 'all', teamMemberId: null }
  }),
  
  // Other Actions
  setTimelineRange: (start, end) => set({ timelineRange: { start, end } }),
  
  // Data helpers
  getClientById: (id) => get().clients.find(c => c.id === id),
  getTeamMemberById: (id) => get().team.find(m => m.id === id),
  getDeliverablesByClientId: (clientId) => get().deliverables.filter(d => d.clientId === clientId),
  getCallsByClientId: (clientId) => get().calls.filter(c => c.clientId === clientId),
  getBacklogDeliverables: () => get().deliverables.filter(d => d.dueDate == null),
  getBacklogCalls: () => get().calls.filter(c => c.scheduledAt == null),

  getFilteredDeliverables: () => {
    const state = get();
    const { deliverables, filters, timelineRange, getClientById } = state;
    return deliverables.filter((d) => {
      if (!d.dueDate) return false;
      if (d.dueDate < timelineRange.start || d.dueDate > timelineRange.end) return false;
      const client = d.clientId ? getClientById(d.clientId) : null;
      if (d.clientId && !client) return false;
      if (client) {
        if (filters.clientStatus !== 'all' && client.status !== filters.clientStatus) return false;
        if (filters.teamMemberId && d.assigneeId !== filters.teamMemberId) return false;
      }
      return true;
    });
  },

  getFilteredCalls: () => {
    const state = get();
    const { calls, filters, timelineRange, getClientById } = state;
    return calls.filter((c) => {
      if (!c.scheduledAt) return false;
      if (c.scheduledAt < timelineRange.start || c.scheduledAt > timelineRange.end) return false;
      const client = c.clientId ? getClientById(c.clientId) : null;
      if (c.clientId && !client) return false;
      if (client) {
        if (filters.clientStatus !== 'all' && client.status !== filters.clientStatus) return false;
        if (filters.teamMemberId && c.assigneeId !== filters.teamMemberId) return false;
      }
      return true;
    });
  },
}));

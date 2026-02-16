import { create } from 'zustand';
import { Client, ClientLink, ClientStatus, Deliverable, Call, CallType, TeamMember, Contact, ClientDocument, DeliverableStatus, DayTodo, BillingHistory, BillingStatus } from '@/types';
import { handleError, AppError, getErrorMessage } from './error-handler';
import { createClient } from '@/lib/supabase/client';
import {
  mapTeamRow,
  mapClientRow,
  mapContactRow,
  mapClientLinkRow,
  mapDocumentRow,
  mapDeliverableRow,
  mapCallRow,
  mapDayTodoRow,
  mapBillingHistoryRow,
  toSupabaseClient,
  toSupabaseContact,
  toSupabaseClientLink,
  toSupabaseDocument,
  toSupabaseDeliverable,
  toSupabaseCall,
  toSupabaseDayTodo,
} from './supabase-mappers';

type ViewType = 'timeline' | 'clients' | 'client-detail' | 'compta' | 'admin';

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
  | { type: 'client'; mode: 'create' | 'edit'; client?: Client; presetStatus?: ClientStatus }
  | null;

type AppRole = 'admin' | 'member' | null;

interface AppState {
  // Data
  clients: Client[];
  deliverables: Deliverable[];
  calls: Call[];
  team: TeamMember[];
  dayTodos: DayTodo[];
  billingHistory: Map<string, BillingHistory[]>; // deliverableId → history entries
  comptaMonthly: { month: string; year: number; entrées: number; sorties: number; soldeCumulé: number }[];
  isLoading: boolean;
  loadingError: string | null;

  // User
  currentUserRole: AppRole;
  setUserRole: (role: AppRole) => void;

  loadData: () => Promise<void>;

  // UI State
  currentView: ViewType;
  previousView: ViewType | null;
  selectedClientId: string | null;
  selectedDocument: ClientDocument | null;
  activeModal: ModalType;
  filters: TimelineFilters;
  timelineRange: {
    start: Date;
    end: Date;
  };
  comptaYear: number;
  setComptaYear: (year: number) => void;

  // Navigation Actions
  navigateToClient: (clientId: string) => void;
  navigateToTimeline: () => void;
  navigateToClients: () => void;
  navigateToCompta: () => void;
  navigateToAdmin: () => void;
  navigateBack: () => void;
  restoreViewFromStorage: () => void;
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
  addClient: (data: Pick<Client, 'name' | 'status'>) => Promise<Client | undefined>;
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
  updateDeliverableBillingStatus: (id: string, newStatus: BillingStatus, amount?: number, notes?: string) => Promise<void>;
  updateBillingHistoryEntry: (historyId: string, deliverableId: string, amount?: number, notes?: string) => Promise<void>;
  deleteBillingHistoryEntry: (historyId: string, deliverableId: string) => Promise<void>;
  loadBillingHistory: (deliverableId: string) => Promise<void>;
  getBillingHistory: (deliverableId: string) => BillingHistory[];

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

  // Timeline vue 1 sem. / 2 sem. (persistée en localStorage)
  compactWeeks: boolean;
  setCompactWeeks: (value: boolean) => void;
  
  // Data helpers
  getClientById: (id: string) => Client | undefined;
  getTeamMemberById: (id: string) => TeamMember | undefined;
  getDeliverablesByClientId: (clientId: string) => Deliverable[];
  getCallsByClientId: (clientId: string) => Call[];
  getBacklogDeliverables: () => Deliverable[];
  getBacklogCalls: () => Call[];
  getIncompleteDayTodos: () => DayTodo[];

  addDayTodo: (text: string, assigneeId?: string) => Promise<void>;
  updateDayTodo: (id: string, data: Partial<Pick<DayTodo, 'text' | 'done' | 'scheduledAt' | 'assigneeId'>>) => Promise<void>;
  deleteDayTodo: (id: string) => Promise<void>;
  updateTeamMember: (id: string, data: Partial<Pick<TeamMember, 'name' | 'initials' | 'color'>>) => Promise<void>;
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

// Persist view to localStorage (sera appelé uniquement côté client)
const persistView = (view: ViewType) => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('yam-current-view', view);
    } catch (_) {}
  }
};

export const useAppStore = create<AppState>((set, get) => ({
  clients: [],
  deliverables: [],
  calls: [],
  team: [],
  dayTodos: [],
  billingHistory: new Map(),
  comptaMonthly: [],
  isLoading: false,
  loadingError: null,
  currentUserRole: null,

  setUserRole: (role) => set({ currentUserRole: role }),

  loadData: async () => {
    const CACHE_KEY = 'yam_dashboard_cache';
    const CACHE_TIMESTAMP_KEY = 'yam_dashboard_cache_ts';
    const CACHE_MAX_AGE = 5 * 60 * 1000; // 5 minutes

    // Helper pour reconvertir les strings ISO en Date
    const rehydrateDates = (data: Record<string, unknown>) => {
      // Deliverables
      const deliverables = (data.deliverables as Deliverable[] || []).map(d => ({
        ...d,
        dueDate: d.dueDate ? new Date(d.dueDate) : null,
        createdAt: d.createdAt ? new Date(d.createdAt) : new Date(),
      })) as Deliverable[];
      
      // Calls
      const calls = (data.calls as Call[] || []).map(c => ({
        ...c,
        scheduledAt: c.scheduledAt ? new Date(c.scheduledAt) : null,
        createdAt: c.createdAt ? new Date(c.createdAt) : new Date(),
      })) as Call[];
      
      // DayTodos
      const dayTodos = (data.dayTodos as DayTodo[] || []).map(t => ({
        ...t,
        forDate: t.forDate ? new Date(t.forDate) : new Date(),
        scheduledAt: t.scheduledAt ? new Date(t.scheduledAt) : null,
        createdAt: t.createdAt ? new Date(t.createdAt) : new Date(),
      })) as DayTodo[];
      
      // Clients (avec documents qui ont des dates)
      const clients = (data.clients as Client[] || []).map(client => ({
        ...client,
        createdAt: client.createdAt ? new Date(client.createdAt) : new Date(),
        updatedAt: client.updatedAt ? new Date(client.updatedAt) : new Date(),
        documents: (client.documents || []).map(doc => ({
          ...doc,
          createdAt: doc.createdAt ? new Date(doc.createdAt) : new Date(),
          updatedAt: doc.updatedAt ? new Date(doc.updatedAt) : new Date(),
        })),
      })) as Client[];
      
      return { deliverables, calls, dayTodos, clients };
    };

    // 1. Essayer de charger depuis le cache d'abord (affichage instantané)
    try {
      const cachedData = localStorage.getItem(CACHE_KEY);
      const cachedTimestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
      
      if (cachedData && cachedTimestamp) {
        const cacheAge = Date.now() - parseInt(cachedTimestamp, 10);
        const parsed = JSON.parse(cachedData);
        const rehydrated = rehydrateDates(parsed);
        
        // Charger le cache immédiatement (pas de loading spinner)
        set({
          team: parsed.team || [],
          clients: rehydrated.clients,
          deliverables: rehydrated.deliverables,
          calls: rehydrated.calls,
          dayTodos: rehydrated.dayTodos,
          comptaMonthly: parsed.comptaMonthly || [],
          currentUserRole: parsed.currentUserRole,
          isLoading: false,
          loadingError: null,
        });
        
        // Si le cache est récent, pas besoin de recharger
        if (cacheAge < CACHE_MAX_AGE) {
          return;
        }
        // Sinon, on continue pour revalider en background (sans spinner)
      } else {
        // Pas de cache, afficher le loading
        set({ isLoading: true, loadingError: null });
      }
    } catch {
      // Erreur de parsing du cache, on charge normalement
      set({ isLoading: true, loadingError: null });
    }

    // 2. Charger les données fraîches depuis Supabase
    try {
      const supabase = createClient();

      // Récupérer le rôle de l'utilisateur en même temps que les données
      const { data: { user } } = await supabase.auth.getUser();
      let userRole: AppRole = null;

      if (user) {
        // 1. Essayer user_roles
        const { data: roleRow } = await supabase
          .from('user_roles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();

        if (roleRow?.role) {
          userRole = roleRow.role as 'admin' | 'member';
        } else {
          // 2. Fallback : team.app_role
          const { data: teamRow } = await supabase
            .from('team')
            .select('app_role')
            .eq('auth_user_id', user.id)
            .maybeSingle();
          userRole = teamRow?.app_role === 'admin' ? 'admin' : 'member';
        }
      }

      const [teamRes, clientsRes, contactsRes, linksRes, docsRes, delivRes, callsRes, comptaRes, todosRes] = await Promise.all([
        supabase.from('team').select('id,name,initials,role,color,email'),
        supabase.from('clients').select('*'),
        supabase.from('contacts').select('*'),
        supabase.from('client_links').select('*'),
        supabase.from('documents').select('*'),
        supabase.from('deliverables').select('*'),
        supabase.from('calls').select('*'),
        supabase.from('compta_monthly').select('month,year,entrees,sorties,solde_cumule'),
        supabase.from('day_todos').select('id,text,for_date,done,created_at,scheduled_at,assignee_id'),
      ]);
      if (teamRes.error) throw teamRes.error;
      if (clientsRes.error) throw clientsRes.error;
      if (contactsRes.error) throw contactsRes.error;
      if (linksRes.error) throw linksRes.error;
      if (docsRes.error) throw docsRes.error;
      if (delivRes.error) throw delivRes.error;
      if (callsRes.error) throw callsRes.error;
      if (comptaRes.error) throw comptaRes.error;
      if (todosRes.error) throw todosRes.error;

      const teamRows = teamRes.data ?? [];
      const clientsData = clientsRes.data ?? [];
      const contactsData = contactsRes.data ?? [];
      const linksData = linksRes.data ?? [];
      const docsData = docsRes.data ?? [];
      const delivData = delivRes.data ?? [];
      const callsData = callsRes.data ?? [];
      const comptaData = comptaRes.data ?? [];
      const todosData = todosRes.data ?? [];

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
      const dayTodos = todosData.map(mapDayTodoRow);
      const comptaMonthly = comptaData.map((m: { month: string; year: number; entrees: number; sorties: number; solde_cumule: number }) => ({
        month: m.month,
        year: m.year,
        entrées: Number(m.entrees),
        sorties: Number(m.sorties),
        soldeCumulé: Number(m.solde_cumule),
      }));

      // Sauvegarder en cache pour le prochain refresh
      try {
        const cacheData = {
          team,
          clients,
          deliverables,
          calls,
          dayTodos,
          comptaMonthly,
          currentUserRole: userRole,
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
        localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
      } catch {
        // Erreur de sauvegarde du cache (quota dépassé, etc.), on ignore
      }

      set({
        team,
        clients,
        deliverables,
        calls,
        dayTodos,
        comptaMonthly,
        currentUserRole: userRole,
        isLoading: false,
        loadingError: null,
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      set({ isLoading: false, loadingError: message });
      handleError(new AppError(message, 'LOAD_DATA_FAILED', 'Impossible de charger les données'));
    }
  },

  // UI State - toujours 'timeline' au SSR pour éviter hydration mismatch
  currentView: 'timeline',
  previousView: null,
  selectedClientId: null,
  selectedDocument: null,
  activeModal: null,
  filters: {
    clientStatus: 'all',
    teamMemberId: null,
  },
  timelineRange: getDefaultTimelineRange(),
  comptaYear: new Date().getFullYear(),
  setComptaYear: (year) => set({ comptaYear: year }),

  // Navigation Actions
  navigateToClient: (clientId) => {
    const current = get().currentView;
    persistView('client-detail');
    set({
      currentView: 'client-detail',
      previousView: current,
      selectedClientId: clientId
    });
  },
  navigateToTimeline: () => {
    const current = get().currentView;
    persistView('timeline');
    set({
      currentView: 'timeline',
      previousView: current,
      selectedClientId: null
    });
  },
  navigateToClients: () => {
    const current = get().currentView;
    persistView('clients');
    set({
      currentView: 'clients',
      previousView: current,
      selectedClientId: null
    });
  },
  navigateToCompta: () => {
    const current = get().currentView;
    persistView('compta');
    set({
      currentView: 'compta',
      previousView: current,
      selectedClientId: null
    });
  },
  navigateToAdmin: () => {
    const current = get().currentView;
    persistView('admin');
    set({
      currentView: 'admin',
      previousView: current,
      selectedClientId: null
    });
  },
  navigateBack: () => {
    const { previousView } = get();
    const targetView = previousView === 'client-detail' ? 'clients' : (previousView || 'timeline');
    persistView(targetView);
    set({
      currentView: targetView,
      previousView: null,
      selectedClientId: null
    });
  },
  restoreViewFromStorage: () => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('yam-current-view');
        if (saved && ['timeline', 'clients', 'compta', 'admin'].includes(saved)) {
          // Ne pas restaurer 'client-detail' car pas de selectedClientId
          set({ currentView: saved as ViewType });
        }
      } catch (_) {}
    }
  },
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
      handleError(new AppError(getErrorMessage(e), 'CONTACT_ADD_FAILED', "Impossible d'ajouter le contact"));
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
      handleError(new AppError(getErrorMessage(e), 'CONTACT_UPDATE_FAILED', "Impossible de modifier le contact"));
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
      handleError(new AppError(getErrorMessage(e), 'CONTACT_DELETE_FAILED', "Impossible de supprimer le contact"));
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
      handleError(new AppError(getErrorMessage(e), 'LINK_ADD_FAILED', "Impossible d'ajouter le lien"));
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
      handleError(new AppError(getErrorMessage(e), 'LINK_DELETE_FAILED', "Impossible de supprimer le lien"));
    }
  },

  addClient: async (data: { name: string; status: ClientStatus }): Promise<{ client: Client; isExisting: boolean } | undefined> => {
    try {
      const trimmedName = data.name.trim().toLowerCase();
      
      // Vérifier si un client avec ce nom existe déjà (insensible à la casse)
      const existingClient = get().clients.find(
        (c) => c.name.trim().toLowerCase() === trimmedName
      );
      
      if (existingClient) {
        // Client existe déjà, on le retourne avec un flag
        return { client: existingClient, isExisting: true };
      }
      
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
      return { client, isExisting: false };
    } catch (e) {
      handleError(new AppError(getErrorMessage(e), 'CLIENT_ADD_FAILED', "Impossible d'ajouter le client"));
      return undefined;
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
      handleError(new AppError(getErrorMessage(e), 'CLIENT_UPDATE_FAILED', "Impossible de modifier le client"));
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
      handleError(new AppError(getErrorMessage(e), 'CLIENT_DELETE_FAILED', "Impossible de supprimer le client"));
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
      handleError(new AppError(getErrorMessage(e), 'DOC_ADD_FAILED', "Impossible d'ajouter le document"));
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
      handleError(new AppError(getErrorMessage(e), 'DOC_UPDATE_FAILED', "Impossible de modifier le document"));
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
      handleError(new AppError(getErrorMessage(e), 'DOC_DELETE_FAILED', "Impossible de supprimer le document"));
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
      handleError(new AppError(getErrorMessage(e), 'DELIV_ADD_FAILED', "Impossible d'ajouter le produit"));
    }
  },

  updateDeliverable: async (id, data) => {
    const prev = get().deliverables.find((d) => d.id === id);
    if (!prev) return;
    set((state) => ({
      deliverables: state.deliverables.map((d) => (d.id === id ? { ...d, ...data } : d)),
    }));
    try {
      const supabase = createClient();
      const payload = toSupabaseDeliverable(data);
      const dbPayload: Record<string, unknown> = {};
      Object.entries(payload).forEach(([k, v]) => {
        // Ne pas envoyer undefined ni null pour éviter d'écraser des colonnes NOT NULL (ex. billing_status)
        if (v !== undefined && v !== null) dbPayload[k] = v;
      });
      const { error } = await supabase.from('deliverables').update(dbPayload).eq('id', id);
      if (error) throw error;

      // Auto-promote prospect → client when billing progresses
      const billingProgressed = data.billingStatus && data.billingStatus !== 'pending' && prev.billingStatus === 'pending';
      if (billingProgressed && prev.clientId) {
        const client = get().clients.find((c) => c.id === prev.clientId);
        if (client && client.status === 'prospect') {
          get().updateClient(prev.clientId, { status: 'client' });
        }
      }
    } catch (e) {
      set((state) => ({
        deliverables: state.deliverables.map((d) => (d.id === id ? prev : d)),
      }));
      handleError(new AppError(getErrorMessage(e), 'DELIV_UPDATE_FAILED', "Impossible de modifier le produit"));
    }
  },

  deleteDeliverable: async (id) => {
    try {
      const supabase = createClient();
      const { error } = await supabase.from('deliverables').delete().eq('id', id);
      if (error) throw error;
      set((state) => ({ deliverables: state.deliverables.filter((d) => d.id !== id) }));
    } catch (e) {
      handleError(new AppError(getErrorMessage(e), 'DELIV_DELETE_FAILED', "Impossible de supprimer le produit"));
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
      handleError(new AppError(getErrorMessage(e), 'DELIV_UPDATE_FAILED', "Impossible de modifier le statut"));
    }
  },

  updateDeliverableBillingStatus: async (id, newStatus, amount, notes) => {
    const prev = get().deliverables.find((d) => d.id === id);
    if (!prev) return;
    try {
      const supabase = createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      console.log('Auth user:', user?.id, 'Auth error:', authError);

      // Update deliverable billing status
      const { error: updateError } = await supabase
        .from('deliverables')
        .update({ billing_status: newStatus })
        .eq('id', id);
      if (updateError) {
        console.error('Billing update error:', updateError);
        throw updateError;
      }

      // Insert billing history entry
      const historyId = crypto.randomUUID();
      const historyPayload = {
        id: historyId,
        deliverable_id: id,
        status: newStatus,
        amount: amount ?? null,
        notes: notes ?? null,
        changed_at: new Date().toISOString(),
        changed_by: user?.id ?? null,
      };

      console.log('Inserting billing history:', historyPayload);

      const { data: insertedData, error: historyError } = await supabase
        .from('billing_history')
        .insert(historyPayload)
        .select();

      console.log('Insert result - data:', insertedData, 'error:', historyError);

      if (historyError) {
        console.error('Billing history insert error:', historyError);
        throw historyError;
      }

      // Update local state
      set((state) => ({
        deliverables: state.deliverables.map((d) =>
          d.id === id ? { ...d, billingStatus: newStatus } : d
        ),
      }));

      // Reload history for this deliverable
      await get().loadBillingHistory(id);

      // Auto-promote prospect → client when billing progresses
      if (newStatus !== 'pending' && prev.billingStatus === 'pending' && prev.clientId) {
        const client = get().clients.find((c) => c.id === prev.clientId);
        if (client && client.status === 'prospect') {
          get().updateClient(prev.clientId, { status: 'client' });
        }
      }
    } catch (e) {
      const message = e && typeof e === 'object' && 'message' in e ? String(e.message) : String(e);
      console.error('updateDeliverableBillingStatus error:', e);
      handleError(new AppError(message, 'BILLING_UPDATE_FAILED', "Impossible de modifier le statut de facturation"));
    }
  },

  updateBillingHistoryEntry: async (historyId, deliverableId, amount, notes) => {
    try {
      const supabase = createClient();

      const payload: Record<string, unknown> = {};
      if (amount !== undefined) payload.amount = amount;
      if (notes !== undefined) payload.notes = notes;

      const { error } = await supabase
        .from('billing_history')
        .update(payload)
        .eq('id', historyId);

      if (error) {
        console.error('Update billing history error:', error);
        throw error;
      }

      // Reload history
      await get().loadBillingHistory(deliverableId);
    } catch (e) {
      const message = e && typeof e === 'object' && 'message' in e ? String(e.message) : String(e);
      console.error('updateBillingHistoryEntry error:', e);
      handleError(new AppError(message, 'BILLING_HISTORY_UPDATE_FAILED', "Impossible de modifier l'entrée d'historique"));
    }
  },

  deleteBillingHistoryEntry: async (historyId, deliverableId) => {
    console.log('🔧 deleteBillingHistoryEntry called', { historyId, deliverableId });
    try {
      const supabase = createClient();

      // Get current deliverable to check if we're deleting the most recent entry
      const currentDeliverable = get().deliverables.find(d => d.id === deliverableId);
      console.log('📦 Current deliverable:', currentDeliverable?.name);
      if (!currentDeliverable) {
        console.error('❌ Deliverable not found');
        return;
      }

      // Get the entry we're about to delete
      console.log('🔍 Fetching entry to delete...');
      const { data: entryToDelete, error: fetchError } = await supabase
        .from('billing_history')
        .select('*')
        .eq('id', historyId)
        .single();

      console.log('📄 Entry to delete:', entryToDelete, 'Error:', fetchError);
      if (fetchError) throw fetchError;

      // Get all current history entries
      const { data: allHistory, error: historyError } = await supabase
        .from('billing_history')
        .select('*')
        .eq('deliverable_id', deliverableId)
        .order('changed_at', { ascending: false });

      if (historyError) throw historyError;

      const isMostRecent = allHistory && allHistory.length > 0 && allHistory[0].id === historyId;
      console.log('🎯 Is most recent entry?', isMostRecent);

      // Delete the history entry
      console.log('🗑️ Attempting to delete entry from database...');
      const { error: deleteError } = await supabase
        .from('billing_history')
        .delete()
        .eq('id', historyId);

      console.log('🗑️ Delete result - Error:', deleteError);
      if (deleteError) {
        console.error('❌ Delete billing history error:', deleteError);
        throw deleteError;
      }
      console.log('✅ Entry deleted successfully from database');

      // Only update deliverable status if we deleted the most recent entry
      if (isMostRecent) {
        // Get remaining history to find previous status
        const { data: remainingHistory, error: remainingError } = await supabase
          .from('billing_history')
          .select('*')
          .eq('deliverable_id', deliverableId)
          .order('changed_at', { ascending: false })
          .limit(1);

        if (remainingError) throw remainingError;

        // Determine previous status (last entry in history, or 'pending' if no history)
        const previousStatus: BillingStatus = remainingHistory && remainingHistory.length > 0
          ? (remainingHistory[0].status as BillingStatus)
          : 'pending';

        // Update deliverable status
        const { error: updateError } = await supabase
          .from('deliverables')
          .update({ billing_status: previousStatus })
          .eq('id', deliverableId);

        if (updateError) throw updateError;

        // Update local state
        set((state) => ({
          deliverables: state.deliverables.map((d) =>
            d.id === deliverableId ? { ...d, billingStatus: previousStatus } : d
          ),
        }));
      }

      // Reload history
      await get().loadBillingHistory(deliverableId);
    } catch (e) {
      const message = e && typeof e === 'object' && 'message' in e ? String(e.message) : String(e);
      console.error('deleteBillingHistoryEntry error:', e);
      handleError(new AppError(message, 'BILLING_HISTORY_DELETE_FAILED', "Impossible de supprimer l'entrée d'historique"));
    }
  },

  loadBillingHistory: async (deliverableId) => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('billing_history')
        .select('*')
        .eq('deliverable_id', deliverableId)
        .order('changed_at', { ascending: true });

      if (error) {
        console.error('Load billing history error:', error);
        throw error;
      }

      const history = (data ?? []).map(mapBillingHistoryRow);
      set((state) => {
        const newMap = new Map(state.billingHistory);
        newMap.set(deliverableId, history);
        return { billingHistory: newMap };
      });
    } catch (e) {
      const message = e && typeof e === 'object' && 'message' in e ? String(e.message) : String(e);
      console.error('loadBillingHistory error:', e);
      handleError(new AppError(message, 'BILLING_HISTORY_LOAD_FAILED', "Impossible de charger l'historique de facturation"));
    }
  },

  getBillingHistory: (deliverableId) => {
    return get().billingHistory.get(deliverableId) ?? [];
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
      handleError(new AppError(getErrorMessage(e), 'CALL_ADD_FAILED', "Impossible d'ajouter l'appel"));
    }
  },

  updateCall: async (id, data) => {
    const prev = get().calls.find((c) => c.id === id);
    if (!prev) return;
    set((state) => ({
      calls: state.calls.map((c) => (c.id === id ? { ...c, ...data } : c)),
    }));
    try {
      const supabase = createClient();
      const payload = toSupabaseCall(data);
      const dbPayload: Record<string, unknown> = {};
      Object.entries(payload).forEach(([k, v]) => {
        if (v !== undefined) dbPayload[k] = v;
      });
      const { error } = await supabase.from('calls').update(dbPayload).eq('id', id);
      if (error) throw error;
    } catch (e) {
      set((state) => ({
        calls: state.calls.map((c) => (c.id === id ? prev : c)),
      }));
      handleError(new AppError(getErrorMessage(e), 'CALL_UPDATE_FAILED', "Impossible de modifier l'appel"));
    }
  },

  deleteCall: async (id) => {
    try {
      const supabase = createClient();
      const { error } = await supabase.from('calls').delete().eq('id', id);
      if (error) throw error;
      set((state) => ({ calls: state.calls.filter((c) => c.id !== id) }));
    } catch (e) {
      handleError(new AppError(getErrorMessage(e), 'CALL_DELETE_FAILED', "Impossible de supprimer l'appel"));
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

  compactWeeks: false,
  setCompactWeeks: (value) => {
    try {
      localStorage.setItem('yam-timeline-compact', String(value));
    } catch (_) {}
    set({ compactWeeks: value });
  },

  // Data helpers
  getClientById: (id) => get().clients.find(c => c.id === id),
  getTeamMemberById: (id) => get().team.find(m => m.id === id),
  getDeliverablesByClientId: (clientId) => get().deliverables.filter(d => d.clientId === clientId),
  getCallsByClientId: (clientId) => get().calls.filter(c => c.clientId === clientId),
  getBacklogDeliverables: () => get().deliverables.filter(d => d.inBacklog === true),
  getBacklogCalls: () => get().calls.filter(c => c.scheduledAt == null),
  getIncompleteDayTodos: () => get().dayTodos.filter(t => !t.done),

  addDayTodo: async (text, assigneeId) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non connecté');
      const forDate = new Date();
      forDate.setHours(0, 0, 0, 0);
      // Auto-assign to current user if no assignee provided
      const finalAssigneeId = assigneeId !== undefined ? assigneeId : user.id;
      const payload = {
        ...toSupabaseDayTodo({ text: trimmed, forDate, done: false, assigneeId: finalAssigneeId }),
        user_id: user.id
      };
      const { data, error } = await supabase.from('day_todos').insert(payload).select('id,text,for_date,done,created_at,scheduled_at,assignee_id').single();
      if (error) throw error;
      const newTodo = mapDayTodoRow(data);
      set((state) => ({ dayTodos: [...state.dayTodos, newTodo] }));
    } catch (e) {
      handleError(new AppError(getErrorMessage(e), 'DAY_TODO_ADD_FAILED', 'Impossible d\'ajouter la todo'));
    }
  },

  updateDayTodo: async (id, data) => {
    try {
      const supabase = createClient();
      const payload: Record<string, unknown> = {};
      if (data.text !== undefined) payload.text = data.text.trim();
      if (data.done !== undefined) payload.done = data.done;
      if (data.scheduledAt !== undefined) {
        payload.scheduled_at = data.scheduledAt ? data.scheduledAt.toISOString() : null;
      }
      if (data.assigneeId !== undefined) {
        payload.assignee_id = data.assigneeId || null;
      }
      if (Object.keys(payload).length === 0) return;
      const { data: row, error } = await supabase.from('day_todos').update(payload).eq('id', id).select('id,text,for_date,done,created_at,scheduled_at,assignee_id').single();
      if (error) throw error;
      const updated = mapDayTodoRow(row);
      set((state) => ({ dayTodos: state.dayTodos.map((t) => (t.id === id ? updated : t)) }));
    } catch (e) {
      handleError(new AppError(getErrorMessage(e), 'DAY_TODO_UPDATE_FAILED', 'Impossible de modifier la todo'));
    }
  },

  deleteDayTodo: async (id) => {
    try {
      const supabase = createClient();
      const { error } = await supabase.from('day_todos').delete().eq('id', id);
      if (error) throw error;
      set((state) => ({ dayTodos: state.dayTodos.filter((t) => t.id !== id) }));
    } catch (e) {
      handleError(new AppError(getErrorMessage(e), 'DAY_TODO_DELETE_FAILED', 'Impossible de supprimer la todo'));
    }
  },

  updateTeamMember: async (id, data) => {
    try {
      const supabase = createClient();
      const payload: Record<string, unknown> = {};
      if (data.name !== undefined) payload.name = data.name.trim();
      if (data.initials !== undefined) payload.initials = data.initials.trim();
      if (data.color !== undefined) payload.color = data.color;
      if (Object.keys(payload).length === 0) return;
      const { error } = await supabase.from('team').update(payload).eq('id', id);
      if (error) throw error;
      set((state) => ({
        team: state.team.map((m) => (m.id === id ? { ...m, ...data } : m)),
      }));
    } catch (e) {
      handleError(new AppError(getErrorMessage(e), 'TEAM_MEMBER_UPDATE_FAILED', 'Impossible de modifier le membre'));
    }
  },

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

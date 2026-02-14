import { create } from 'zustand';
import { Client, ClientLink, ClientStatus, Deliverable, Call, CallType, TeamMember, Contact, ClientDocument, DeliverableStatus } from '@/types';
import { mockClients, mockDeliverables, mockCalls, mockTeam } from './mock-data';
import { handleError, AppError } from './error-handler';

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
  
  // CRUD Actions - Contacts
  addContact: (clientId: string, contact: Omit<Contact, 'id'>) => void;
  updateContact: (clientId: string, contactId: string, data: Partial<Contact>) => void;
  deleteContact: (clientId: string, contactId: string) => void;
  
  // CRUD Actions - Clients
  addClient: (data: Pick<Client, 'name' | 'status'>) => void;
  updateClient: (id: string, data: Partial<Pick<Client, 'name' | 'status'>>) => void;
  deleteClient: (id: string) => void;

  // CRUD Actions - Client links (URLs avec label)
  addClientLink: (clientId: string, link: Omit<ClientLink, 'id'>) => void;
  deleteClientLink: (clientId: string, linkId: string) => void;

  // CRUD Actions - Documents
  addDocument: (clientId: string, doc: Omit<ClientDocument, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateDocument: (clientId: string, docId: string, data: Partial<ClientDocument>) => void;
  deleteDocument: (clientId: string, docId: string) => void;
  
  // CRUD Actions - Deliverables
  addDeliverable: (deliverable: Omit<Deliverable, 'id' | 'createdAt'>) => void;
  updateDeliverable: (id: string, data: Partial<Deliverable>) => void;
  deleteDeliverable: (id: string) => void;
  toggleDeliverableStatus: (id: string) => void;
  
  // CRUD Actions - Calls
  addCall: (call: Omit<Call, 'id' | 'createdAt'>) => void;
  updateCall: (id: string, data: Partial<Call>) => void;
  deleteCall: (id: string) => void;
  
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

// Generate unique IDs
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const useAppStore = create<AppState>((set, get) => ({
  // Initialize with mock data
  clients: mockClients,
  deliverables: mockDeliverables,
  calls: mockCalls,
  team: mockTeam,
  
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
  
  // CRUD Actions - Contacts
  addContact: (clientId, contactData) => {
    try {
      set(state => ({
        clients: state.clients.map(client =>
          client.id === clientId 
            ? { 
                ...client, 
                contacts: [...client.contacts, { ...contactData, id: generateId() }],
                updatedAt: new Date()
              }
            : client
        )
      }));
    } catch (e) {
      handleError(new AppError(String(e), 'CONTACT_ADD_FAILED', "Impossible d'ajouter le contact"));
    }
  },
  
  updateContact: (clientId, contactId, data) => {
    try {
      set(state => ({
        clients: state.clients.map(client => 
          client.id === clientId 
            ? { 
                ...client, 
                contacts: client.contacts.map(c => c.id === contactId ? { ...c, ...data } : c),
                updatedAt: new Date()
              }
            : client
        )
      }));
    } catch (e) {
      handleError(new AppError(String(e), 'CONTACT_UPDATE_FAILED', "Impossible de modifier le contact"));
    }
  },
  
  deleteContact: (clientId, contactId) => {
    try {
      set(state => ({
        clients: state.clients.map(client => 
          client.id === clientId 
            ? { 
                ...client, 
                contacts: client.contacts.filter(c => c.id !== contactId),
                updatedAt: new Date()
              }
            : client
        )
      }));
    } catch (e) {
      handleError(new AppError(String(e), 'CONTACT_DELETE_FAILED', "Impossible de supprimer le contact"));
    }
  },

  addClientLink: (clientId, linkData) => set(state => ({
    clients: state.clients.map(client =>
      client.id === clientId
        ? {
            ...client,
            links: [...(client.links ?? []), { ...linkData, id: generateId() }],
            updatedAt: new Date(),
          }
        : client
    ),
  })),

  deleteClientLink: (clientId, linkId) => set(state => ({
    clients: state.clients.map(client =>
      client.id === clientId
        ? {
            ...client,
            links: (client.links ?? []).filter(l => l.id !== linkId),
            updatedAt: new Date(),
          }
        : client
    ),
  })),

  addClient: (data: { name: string; status: ClientStatus }) => set(state => ({
    clients: [
      ...state.clients,
      {
        id: generateId(),
        name: data.name.trim(),
        status: data.status,
        contacts: [],
        documents: [],
        links: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
  })),
  updateClient: (id, data) => set(state => ({
    clients: state.clients.map(c => (c.id === id ? { ...c, ...data, updatedAt: new Date() } : c)),
  })),
  deleteClient: (id) => set(state => ({
    clients: state.clients.filter(c => c.id !== id),
    deliverables: state.deliverables.filter(d => d.clientId !== id),
    calls: state.calls.filter(c => c.clientId !== id),
    selectedClientId: state.selectedClientId === id ? null : state.selectedClientId,
  })),

  // CRUD Actions - Documents
  addDocument: (clientId, docData) => {
    try {
      set(state => ({
    clients: state.clients.map(client => 
      client.id === clientId 
        ? { 
            ...client, 
            documents: [...client.documents, { 
              ...docData, 
              id: generateId(), 
              createdAt: new Date(), 
              updatedAt: new Date() 
            }],
            updatedAt: new Date()
          }
        : client
    )
  }));
    } catch (e) {
      handleError(new AppError(String(e), 'DOC_ADD_FAILED', "Impossible d'ajouter le document"));
    }
  },
  
  updateDocument: (clientId, docId, data) => {
    try {
      set(state => ({
    clients: state.clients.map(client => 
      client.id === clientId 
        ? { 
            ...client, 
            documents: client.documents.map(d => 
              d.id === docId ? { ...d, ...data, updatedAt: new Date() } : d
            ),
            updatedAt: new Date()
          }
        : client
    ),
    // Also update selectedDocument if it's the one being edited
    selectedDocument: state.selectedDocument?.id === docId 
      ? { ...state.selectedDocument, ...data, updatedAt: new Date() }
      : state.selectedDocument
  }));
    } catch (e) {
      handleError(new AppError(String(e), 'DOC_UPDATE_FAILED', "Impossible de modifier le document"));
    }
  },
  
  deleteDocument: (clientId, docId) => {
    try {
      set(state => ({
    clients: state.clients.map(client => 
      client.id === clientId 
        ? { 
            ...client, 
            documents: client.documents.filter(d => d.id !== docId),
            updatedAt: new Date()
          }
        : client
    ),
    selectedDocument: state.selectedDocument?.id === docId ? null : state.selectedDocument
  }));
    } catch (e) {
      handleError(new AppError(String(e), 'DOC_DELETE_FAILED', "Impossible de supprimer le document"));
    }
  },
  
  // CRUD Actions - Deliverables
  addDeliverable: (deliverableData) => {
    try {
      set(state => ({
    deliverables: [...state.deliverables, { 
      ...deliverableData, 
      id: generateId(), 
      createdAt: new Date() 
    }]
  }));
    } catch (e) {
      handleError(new AppError(String(e), 'DELIV_ADD_FAILED', "Impossible d'ajouter le livrable"));
    }
  },
  
  updateDeliverable: (id, data) => {
    try {
      set(state => ({
        deliverables: state.deliverables.map(d => d.id === id ? { ...d, ...data } : d)
      }));
    } catch (e) {
      handleError(new AppError(String(e), 'DELIV_UPDATE_FAILED', "Impossible de modifier le livrable"));
    }
  },
  
  deleteDeliverable: (id) => {
    try {
      set(state => ({
        deliverables: state.deliverables.filter(d => d.id !== id)
      }));
    } catch (e) {
      handleError(new AppError(String(e), 'DELIV_DELETE_FAILED', "Impossible de supprimer le livrable"));
    }
  },
  
  toggleDeliverableStatus: (id) => set(state => ({
    deliverables: state.deliverables.map(d => {
      if (d.id !== id) return d;
      const statusOrder: DeliverableStatus[] = ['pending', 'in-progress', 'completed'];
      const currentIndex = statusOrder.indexOf(d.status);
      const nextStatus = statusOrder[(currentIndex + 1) % statusOrder.length];
      return { ...d, status: nextStatus };
    })
  })),
  
  // CRUD Actions - Calls
  addCall: (callData) => {
    try {
      set(state => ({
    calls: [...state.calls, { 
      ...callData, 
      id: generateId(), 
      createdAt: new Date() 
    }]
  }));
    } catch (e) {
      handleError(new AppError(String(e), 'CALL_ADD_FAILED', "Impossible d'ajouter l'appel"));
    }
  },
  
  updateCall: (id, data) => {
    try {
      set(state => ({
        calls: state.calls.map(c => c.id === id ? { ...c, ...data } : c)
      }));
    } catch (e) {
      handleError(new AppError(String(e), 'CALL_UPDATE_FAILED', "Impossible de modifier l'appel"));
    }
  },
  
  deleteCall: (id) => {
    try {
      set(state => ({
        calls: state.calls.filter(c => c.id !== id)
      }));
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

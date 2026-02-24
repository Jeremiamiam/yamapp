import type { Client, ClientLink, ClientStatus, Deliverable, Call, CallType, TeamMember, Contact, ClientDocument, DocumentVersion, DayTodo, BillingHistory, BillingStatus, Project, RetroplanningPlan } from '@/types';

export type ViewType = 'timeline' | 'clients' | 'client-detail' | 'compta' | 'admin' | 'production' | 'creative-board' | 'wiki';
export type ClientStatusFilter = 'all' | 'prospect' | 'client';
export type AppRole = 'admin' | 'member' | 'pending' | null;

export interface TimelineFilters {
  clientStatus: ClientStatusFilter;
  teamMemberId: string | null;
}

export type ModalType =
  | { type: 'contact'; mode: 'create' | 'edit'; clientId: string; contact?: Contact; presetContact?: Partial<Contact> }
  | { type: 'document'; mode: 'create' | 'edit'; clientId: string; document?: ClientDocument; projectId?: string }
  | { type: 'report-upload'; clientId: string; projectId?: string }
  | { type: 'deliverable'; mode: 'create' | 'edit'; clientId?: string; projectId?: string; deliverable?: Deliverable }
  | { type: 'call'; mode: 'create' | 'edit'; clientId?: string; call?: Call; presetCallType?: CallType }
  | { type: 'client'; mode: 'create' | 'edit'; client?: Client; presetStatus?: ClientStatus }
  | { type: 'project'; presetClientId?: string; project?: Project; initialTab?: 'projet' | 'billing' }
  | null;

export interface AppState {
  // Data
  clients: Client[];
  deliverables: Deliverable[];
  calls: Call[];
  team: TeamMember[];
  projects: Project[];
  dayTodos: DayTodo[];
  billingHistory: Map<string, BillingHistory[]>;
  comptaMonthly: { month: string; year: number; entrées: number; sorties: number; soldeCumulé: number }[];
  isLoading: boolean;
  loadingError: string | null;

  // User
  currentUserRole: AppRole;
  setUserRole: (role: AppRole) => void;
  simulateAsMember: boolean;
  setSimulateAsMember: (value: boolean) => void;

  loadData: () => Promise<void>;

  // UI State
  currentView: ViewType;
  previousView: ViewType | null;
  selectedClientId: string | null;
  selectedProjectId: string | null;
  setSelectedProjectId: (projectId: string | null) => void;
  selectedDocument: ClientDocument | null;
  activeModal: ModalType;
  filters: TimelineFilters;
  timelineRange: { start: Date; end: Date };
  comptaYear: number;
  setComptaYear: (year: number) => void;

  // Navigation Actions
  navigateToClient: (clientId: string, projectId?: string) => void;
  navigateToTimeline: () => void;
  navigateToClients: () => void;
  navigateToCompta: () => void;
  navigateToAdmin: () => void;
  navigateToProduction: () => void;
  navigateToCreativeBoard: () => void;
  navigateToWiki: () => void;
  navigateBack: () => void;
  restoreViewFromStorage: () => void;
  openDocument: (doc: ClientDocument) => void;
  closeDocument: () => void;

  // Modal Actions
  openModal: (modal: ModalType) => void;
  closeModal: () => void;

  // CRUD Actions - Contacts
  addContact: (clientId: string, contact: Omit<Contact, 'id'>) => Promise<void>;
  updateContact: (clientId: string, contactId: string, data: Partial<Contact>) => Promise<void>;
  deleteContact: (clientId: string, contactId: string) => Promise<void>;

  // CRUD Actions - Clients
  addClient: (data: Pick<Client, 'name' | 'status'>) => Promise<{ client: Client; isExisting: boolean } | undefined>;
  updateClient: (id: string, data: Partial<Pick<Client, 'name' | 'status'>>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;

  // CRUD Actions - Client links
  addClientLink: (clientId: string, link: Omit<ClientLink, 'id'>) => Promise<void>;
  deleteClientLink: (clientId: string, linkId: string) => Promise<void>;

  // CRUD Actions - Documents
  addDocument: (clientId: string, doc: Omit<ClientDocument, 'id' | 'createdAt' | 'updatedAt'>, projectId?: string) => Promise<ClientDocument>;
  updateDocument: (clientId: string, docId: string, data: Partial<ClientDocument>) => Promise<void>;
  deleteDocument: (clientId: string, docId: string) => Promise<void>;

  // Document Versioning
  saveDocumentVersion: (docId: string, currentContent: string, label?: string) => Promise<DocumentVersion>;
  updateDocumentVersion: (versionId: string, content: string) => Promise<void>;
  loadDocumentVersions: (docId: string) => Promise<DocumentVersion[]>;

  // CRUD Actions - Deliverables
  addDeliverable: (deliverable: Omit<Deliverable, 'id' | 'createdAt'>) => Promise<void>;
  updateDeliverable: (id: string, data: Partial<Deliverable>) => Promise<void>;
  deleteDeliverable: (id: string) => Promise<void>;
  toggleDeliverableStatus: (id: string) => Promise<void>;
  updateDeliverableBillingStatus: (id: string, newStatus: BillingStatus, amount?: number, notes?: string) => Promise<void>;
  updateBillingHistoryEntry: (historyId: string, deliverableId: string, amount?: number, notes?: string) => Promise<void>;
  deleteBillingHistoryEntry: (historyId: string, deliverableId: string) => Promise<void>;
  loadBillingHistory: (deliverableId: string) => Promise<void>;
  getBillingHistory: (deliverableId: string) => BillingHistory[];

  // CRUD Actions - Projects
  addProject: (data: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'progressAmounts' | 'progressDates'> & { progressAmounts?: number[]; progressDates?: string[] }) => Promise<Project | undefined>;
  updateProject: (id: string, data: Partial<Omit<Project, 'id' | 'createdAt'>>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  assignDeliverableToProject: (deliverableId: string, projectId: string | null) => Promise<void>;
  getProjectsByClientId: (clientId: string) => Project[];
  getDeliverablesByProjectId: (projectId: string) => Deliverable[];

  // CRUD Actions - Calls
  addCall: (call: Omit<Call, 'id' | 'createdAt'>) => Promise<void>;
  updateCall: (id: string, data: Partial<Call>) => Promise<void>;
  deleteCall: (id: string) => Promise<void>;

  // Filter Actions
  setClientStatusFilter: (status: ClientStatusFilter) => void;
  setTeamMemberFilter: (memberId: string | null) => void;
  resetFilters: () => void;

  // Other Actions
  setTimelineRange: (start: Date, end: Date) => void;
  compactWeeks: boolean;
  setCompactWeeks: (value: boolean) => void;

  // Data helpers
  getClientById: (id: string) => Client | undefined;
  getTeamMemberById: (id: string) => TeamMember | undefined;
  getDeliverablesByClientId: (clientId: string) => Deliverable[];
  getCallsByClientId: (clientId: string) => Call[];
  getBacklogDeliverables: () => Deliverable[];
  getBacklogCalls: () => Call[];
  getBacklogProjects: () => Project[];
  getIncompleteDayTodos: () => DayTodo[];
  addDayTodo: (text: string, assigneeId?: string) => Promise<void>;
  updateDayTodo: (id: string, data: Partial<Pick<DayTodo, 'text' | 'done' | 'scheduledAt' | 'assigneeId'>>) => Promise<void>;
  deleteDayTodo: (id: string) => Promise<void>;
  updateTeamMember: (id: string, data: Partial<Pick<TeamMember, 'name' | 'initials' | 'color'>>) => Promise<void>;
  getFilteredDeliverables: () => Deliverable[];
  getFilteredCalls: () => Call[];

  // Retroplanning
  retroplanning: Map<string, RetroplanningPlan>;
  loadRetroplanning: (clientId: string) => Promise<void>;
  saveRetroplanning: (clientId: string, plan: RetroplanningPlan) => Promise<void>;
  deleteRetroplanning: (clientId: string) => Promise<void>;
  getRetroplanningByClientId: (clientId: string) => RetroplanningPlan | undefined;
}

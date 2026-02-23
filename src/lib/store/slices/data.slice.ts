import type { StateCreator } from 'zustand';
import type { AppState, AppRole } from '../types';
import type { Client, Deliverable, Call, TeamMember, DayTodo, BillingHistory } from '@/types';
import { handleError, AppError } from '@/lib/error-handler';
import { createClient } from '@/lib/supabase/client';
import { CACHE_KEY, CACHE_TIMESTAMP_KEY } from '@/lib/cache';
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
  mapProjectRow,
} from '@/lib/supabase-mappers';

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`Chargement trop long (${ms / 1000}s). Vérifiez votre connexion.`)), ms)
  );
  return Promise.race([promise, timeout]);
}

/** Ordre d'affichage des membres à côté du logo : JH (admin) puis CE, MP, CG, puis les autres */
const TEAM_DISPLAY_ORDER = ['JH', 'CE', 'MP', 'CG'];

function sortTeamByDisplayOrder(team: TeamMember[]): TeamMember[] {
  return [...team].sort((a, b) => {
    const idxA = TEAM_DISPLAY_ORDER.indexOf(a.initials);
    const idxB = TEAM_DISPLAY_ORDER.indexOf(b.initials);
    if (idxA >= 0 && idxB >= 0) return idxA - idxB;
    if (idxA >= 0) return -1;
    if (idxB >= 0) return 1;
    return (a.initials || '').localeCompare(b.initials || '');
  });
}

type DataSliceKeys =
  | 'clients' | 'deliverables' | 'calls' | 'team' | 'projects' | 'dayTodos'
  | 'billingHistory' | 'comptaMonthly' | 'isLoading' | 'loadingError'
  | 'loadData'
  | 'getClientById' | 'getTeamMemberById' | 'getDeliverablesByClientId' | 'getCallsByClientId'
  | 'getBacklogDeliverables' | 'getBacklogCalls' | 'getIncompleteDayTodos'
  | 'getFilteredDeliverables' | 'getFilteredCalls';

export const createDataSlice: StateCreator<AppState, [], [], Pick<AppState, DataSliceKeys>> = (set, get) => ({
  clients: [],
  deliverables: [],
  calls: [],
  team: [],
  projects: [],
  dayTodos: [],
  billingHistory: new Map<string, BillingHistory[]>(),
  comptaMonthly: [],
  isLoading: false,
  loadingError: null,

  loadData: async () => {
    const rehydrateDates = (data: Record<string, unknown>) => {
      const deliverables = (data.deliverables as Deliverable[] || []).map(d => ({
        ...d,
        dueDate: d.dueDate ? new Date(d.dueDate) : null,
        createdAt: d.createdAt ? new Date(d.createdAt) : new Date(),
      })) as Deliverable[];

      const calls = (data.calls as Call[] || []).map(c => ({
        ...c,
        scheduledAt: c.scheduledAt ? new Date(c.scheduledAt) : null,
        createdAt: c.createdAt ? new Date(c.createdAt) : new Date(),
      })) as Call[];

      const dayTodos = (data.dayTodos as DayTodo[] || []).map(t => ({
        ...t,
        forDate: t.forDate ? new Date(t.forDate) : new Date(),
        scheduledAt: t.scheduledAt ? new Date(t.scheduledAt) : null,
        createdAt: t.createdAt ? new Date(t.createdAt) : new Date(),
      })) as DayTodo[];

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
        const parsed: unknown = JSON.parse(cachedData);

        const isValid =
          parsed !== null &&
          typeof parsed === 'object' &&
          Array.isArray((parsed as Record<string, unknown>).clients) &&
          Array.isArray((parsed as Record<string, unknown>).deliverables) &&
          Array.isArray((parsed as Record<string, unknown>).calls) &&
          Array.isArray((parsed as Record<string, unknown>).projects);

        if (!isValid) {
          localStorage.removeItem(CACHE_KEY);
          localStorage.removeItem(CACHE_TIMESTAMP_KEY);
          set({ isLoading: true, loadingError: null });
        } else {
          type CachedState = {
            team: TeamMember[];
            projects?: { id: string; clientId: string; name: string; quoteAmount?: number; quoteDate?: string; depositAmount?: number; depositDate?: string; progressAmounts?: number[]; progressDates?: string[]; balanceAmount?: number; balanceDate?: string; potentiel?: number; createdAt: string; updatedAt: string }[];
            comptaMonthly: { month: string; year: number; entrées: number; sorties: number; soldeCumulé: number }[];
            currentUserRole: AppRole;
          };
          const p = parsed as CachedState;
          const rehydrated = rehydrateDates(parsed as Parameters<typeof rehydrateDates>[0]);
          const projects = (p.projects || []).map((proj) => ({
            ...proj,
            progressAmounts: proj.progressAmounts ?? [],
            progressDates: proj.progressDates ?? [],
            createdAt: proj.createdAt ? new Date(proj.createdAt) : new Date(),
            updatedAt: proj.updatedAt ? new Date(proj.updatedAt) : new Date(),
          }));

          set({
            team: sortTeamByDisplayOrder(p.team || []),
            clients: rehydrated.clients,
            deliverables: rehydrated.deliverables,
            calls: rehydrated.calls,
            dayTodos: rehydrated.dayTodos,
            projects,
            comptaMonthly: p.comptaMonthly || [],
            currentUserRole: p.currentUserRole,
            isLoading: false,
            loadingError: null,
          });

          // Stale-while-revalidate : on a affiché le cache, on refetch en arrière-plan
          // (pas de return → on continue vers le bloc Supabase ci-dessous)
        }
      } else {
        set({ isLoading: true, loadingError: null });
      }
    } catch {
      set({ isLoading: true, loadingError: null });
    }

    // 2. Charger les données fraîches depuis Supabase
    try {
      const supabase = createClient();

      const { data: { user } } = await supabase.auth.getUser();
      let userRole: AppRole = null;

      if (user) {
        const { data: roleRow } = await supabase
          .from('user_roles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();

        if (roleRow?.role) {
          userRole = roleRow.role as 'admin' | 'member' | 'pending';
        } else {
          const { data: teamRow } = await supabase
            .from('team')
            .select('app_role')
            .eq('auth_user_id', user.id)
            .maybeSingle();
          const ar = teamRow?.app_role;
          userRole = ar === 'admin' ? 'admin' : ar === 'pending' ? 'pending' : 'member';
        }
      }

      const [teamRes, clientsRes, contactsRes, linksRes, docsRes, delivRes, callsRes, comptaRes, todosRes, projectsRes] = await withTimeout(
        Promise.all([
          supabase.from('team').select('id,name,initials,role,color,email'),
          supabase.from('clients').select('*'),
          supabase.from('contacts').select('*'),
          supabase.from('client_links').select('*'),
          supabase.from('documents').select('*'),
          supabase.from('deliverables').select('*'),
          supabase.from('calls').select('*'),
          supabase.from('compta_monthly').select('month,year,entrees,sorties,solde_cumule'),
          supabase.from('day_todos').select('id,text,for_date,done,created_at,scheduled_at,assignee_id'),
          supabase.from('projects').select('*'),
        ]),
        10000
      );

      if (teamRes.error) throw teamRes.error;
      if (clientsRes.error) throw clientsRes.error;
      if (contactsRes.error) throw contactsRes.error;
      if (linksRes.error) throw linksRes.error;
      if (docsRes.error) throw docsRes.error;
      if (delivRes.error) throw delivRes.error;
      if (callsRes.error) throw callsRes.error;
      if (comptaRes.error) throw comptaRes.error;
      if (todosRes.error) throw todosRes.error;
      if (projectsRes.error) throw projectsRes.error;

      const teamRows = teamRes.data ?? [];
      const clientsData = clientsRes.data ?? [];
      const contactsData = contactsRes.data ?? [];
      const linksData = linksRes.data ?? [];
      const docsData = docsRes.data ?? [];
      const delivData = delivRes.data ?? [];
      const callsData = callsRes.data ?? [];
      const comptaData = comptaRes.data ?? [];
      const todosData = todosRes.data ?? [];
      const projectsData = projectsRes.data ?? [];

      const team = sortTeamByDisplayOrder(teamRows.map(mapTeamRow));
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
      const projects = projectsData.map(mapProjectRow);
      const comptaMonthly = comptaData.map((m: { month: string; year: number; entrees: number; sorties: number; solde_cumule: number }) => ({
        month: m.month,
        year: m.year,
        entrées: Number(m.entrees),
        sorties: Number(m.sorties),
        soldeCumulé: Number(m.solde_cumule),
      }));

      try {
        const cacheData = { team, clients, deliverables, calls, dayTodos, projects, comptaMonthly, currentUserRole: userRole };
        localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
        localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
      } catch {
        // Quota dépassé, on ignore
      }

      set({ team, clients, deliverables, calls, dayTodos, projects, comptaMonthly, currentUserRole: userRole, isLoading: false, loadingError: null });
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      set({ isLoading: false, loadingError: message });
      handleError(new AppError(message, 'LOAD_DATA_FAILED', 'Impossible de charger les données'));
    }
  },

  getClientById: (id) => get().clients.find(c => c.id === id),
  getTeamMemberById: (id) => get().team.find(m => m.id === id),
  getDeliverablesByClientId: (clientId) => get().deliverables.filter(d => d.clientId === clientId),
  getCallsByClientId: (clientId) => get().calls.filter(c => c.clientId === clientId),
  getBacklogDeliverables: () => get().deliverables.filter(d => d.inBacklog === true),
  getBacklogCalls: () => get().calls.filter(c => c.scheduledAt == null),
  getIncompleteDayTodos: () => get().dayTodos.filter(t => !t.done),

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
});

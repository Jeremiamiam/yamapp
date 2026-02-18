import type { StateCreator } from 'zustand';
import type { AppState, ViewType, TimelineFilters, ModalType, ClientStatusFilter } from '../types';
import type { ClientDocument } from '@/types';

const getDefaultTimelineRange = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setDate(end.getDate() + 90);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

const persistView = (view: ViewType) => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('yam-current-view', view);
    } catch (_) {}
  }
};

type UiSliceKeys =
  | 'currentView' | 'previousView' | 'selectedClientId' | 'selectedDocument'
  | 'activeModal' | 'filters' | 'timelineRange' | 'comptaYear' | 'compactWeeks'
  | 'setComptaYear' | 'setCompactWeeks'
  | 'navigateToClient' | 'navigateToTimeline' | 'navigateToClients' | 'navigateToCompta'
  | 'navigateToAdmin' | 'navigateToProduction' | 'navigateBack' | 'restoreViewFromStorage'
  | 'openDocument' | 'closeDocument'
  | 'openModal' | 'closeModal'
  | 'setClientStatusFilter' | 'setTeamMemberFilter' | 'resetFilters' | 'setTimelineRange';

export const createUiSlice: StateCreator<AppState, [], [], Pick<AppState, UiSliceKeys>> = (set, get) => ({
  currentView: 'timeline',
  previousView: null,
  selectedClientId: null,
  selectedDocument: null,
  activeModal: null as ModalType,
  filters: {
    clientStatus: 'all' as ClientStatusFilter,
    teamMemberId: null,
  } as TimelineFilters,
  timelineRange: getDefaultTimelineRange(),
  comptaYear: new Date().getFullYear(),
  compactWeeks: false,

  setComptaYear: (year) => set({ comptaYear: year }),

  setCompactWeeks: (value) => {
    try {
      localStorage.setItem('yam-timeline-compact', String(value));
    } catch (_) {}
    set({ compactWeeks: value });
  },

  navigateToClient: (clientId) => {
    const current = get().currentView;
    persistView('client-detail');
    set({ currentView: 'client-detail', previousView: current, selectedClientId: clientId });
  },

  navigateToTimeline: () => {
    const current = get().currentView;
    persistView('timeline');
    set({ currentView: 'timeline', previousView: current, selectedClientId: null });
  },

  navigateToClients: () => {
    const current = get().currentView;
    persistView('clients');
    set({ currentView: 'clients', previousView: current, selectedClientId: null });
  },

  navigateToCompta: () => {
    const current = get().currentView;
    persistView('compta');
    set({ currentView: 'compta', previousView: current, selectedClientId: null });
  },

  navigateToAdmin: () => {
    const current = get().currentView;
    persistView('admin');
    set({ currentView: 'admin', previousView: current, selectedClientId: null });
  },

  navigateToProduction: () => {
    const current = get().currentView;
    persistView('production');
    set({ currentView: 'production', previousView: current, selectedClientId: null });
  },

  navigateBack: () => {
    const { previousView } = get();
    const targetView = previousView === 'client-detail' ? 'clients' : (previousView || 'timeline');
    persistView(targetView);
    set({ currentView: targetView, previousView: null, selectedClientId: null });
  },

  restoreViewFromStorage: () => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('yam-current-view');
        if (saved && ['timeline', 'production', 'clients', 'compta', 'admin'].includes(saved)) {
          set({ currentView: saved as ViewType });
        }
      } catch (_) {}
    }
  },

  openDocument: (doc: ClientDocument) => set({ selectedDocument: doc }),
  closeDocument: () => set({ selectedDocument: null }),

  openModal: (modal: ModalType) => set({ activeModal: modal }),
  closeModal: () => set({ activeModal: null }),

  setClientStatusFilter: (status) => set((state) => ({
    filters: { ...state.filters, clientStatus: status },
  })),

  setTeamMemberFilter: (memberId) => set((state) => ({
    filters: { ...state.filters, teamMemberId: memberId },
  })),

  resetFilters: () => set({ filters: { clientStatus: 'all', teamMemberId: null } }),

  setTimelineRange: (start, end) => set({ timelineRange: { start, end } }),
});

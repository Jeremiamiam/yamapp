import { create } from 'zustand';
import type { AppState } from './types';
import { createAuthSlice } from './slices/auth.slice';
import { createUiSlice } from './slices/ui.slice';
import { createDataSlice } from './slices/data.slice';
import { createClientsActions } from './actions/clients';
import { createDeliverablesActions } from './actions/deliverables';
import { createBillingActions } from './actions/billing';
import { createCallsActions } from './actions/calls';
import { createTodosActions } from './actions/todos';
import { createProjectActions } from './actions/projects';

export const useAppStore = create<AppState>()((set, get, api) => ({
  ...createAuthSlice(set, get, api),
  ...createUiSlice(set, get, api),
  ...createDataSlice(set, get, api),
  ...createClientsActions(set, get, api),
  ...createDeliverablesActions(set, get, api),
  ...createBillingActions(set, get, api),
  ...createCallsActions(set, get, api),
  ...createTodosActions(set, get, api),
  ...createProjectActions(set, get),
}));

export type { AppState, AppRole, ViewType, ModalType, TimelineFilters } from './types';

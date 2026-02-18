import type { StateCreator } from 'zustand';
import type { AppState, AppRole } from '../types';

export const createAuthSlice: StateCreator<
  AppState,
  [],
  [],
  Pick<AppState, 'currentUserRole' | 'setUserRole'>
> = (set) => ({
  currentUserRole: null,
  setUserRole: (role: AppRole) => set({ currentUserRole: role }),
});

import type { StateCreator } from 'zustand';
import type { AppState, AppRole } from '../types';

const SIMULATE_KEY = 'yam-simulate-as-member';

function getStoredSimulate(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(SIMULATE_KEY) === 'true';
  } catch {
    return false;
  }
}

export const createAuthSlice: StateCreator<
  AppState,
  [],
  [],
  Pick<AppState, 'currentUserRole' | 'setUserRole' | 'simulateAsMember' | 'setSimulateAsMember'>
> = (set) => ({
  currentUserRole: null,
  setUserRole: (role: AppRole) => set({ currentUserRole: role }),
  simulateAsMember: getStoredSimulate(),
  setSimulateAsMember: (value: boolean) => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(SIMULATE_KEY, String(value));
      }
    } catch {}
    set({ simulateAsMember: value });
  },
});

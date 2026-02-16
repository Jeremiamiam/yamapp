'use client';

import { useAppStore } from '@/lib/store';

export type AppRole = 'admin' | 'member' | null;

interface UserRoleState {
  role: AppRole;
  loading: boolean;
  isAdmin: boolean;
  isMember: boolean;
}

/**
 * Rôle de l'utilisateur connecté.
 * Lit depuis le store global (chargé une seule fois au démarrage).
 * - admin : accès total (Compta, Settings, champs prix)
 * - member : accès tout sauf Compta et prix
 */
export function useUserRole(): UserRoleState {
  const role = useAppStore((s) => s.currentUserRole);
  const isLoading = useAppStore((s) => s.isLoading);

  return {
    role,
    loading: isLoading && role === null, // Loading only if store is loading AND role not yet set
    isAdmin: role === 'admin',
    isMember: role === 'member',
  };
}

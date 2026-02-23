'use client';

import { useAppStore } from '@/lib/store';

export type AppRole = 'admin' | 'member' | 'pending' | null;

interface UserRoleState {
  role: AppRole;
  loading: boolean;
  isAdmin: boolean;
  isMember: boolean;
  isPending: boolean;
  simulateAsMember: boolean;
}

/**
 * Rôle de l'utilisateur connecté.
 * Lit depuis le store global (chargé une seule fois au démarrage).
 * - admin : accès total (Compta, Settings, champs prix)
 * - member : accès tout sauf Compta et prix
 * - pending : en attente d'autorisation admin
 */
export function useUserRole(): UserRoleState {
  const role = useAppStore((s) => s.currentUserRole);
  const isLoading = useAppStore((s) => s.isLoading);
  const simulateAsMember = useAppStore((s) => s.simulateAsMember);

  return {
    role,
    loading: isLoading && role === null, // Loading only if store is loading AND role not yet set
    isAdmin: role === 'admin' && !simulateAsMember,
    isMember: role === 'member' || (role === 'admin' && simulateAsMember),
    isPending: role === 'pending',
    simulateAsMember,
  };
}

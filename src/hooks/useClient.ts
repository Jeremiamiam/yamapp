import { useAppStore } from '@/lib/store';
import type { Client } from '@/types';

/**
 * Hook pour accéder à un client par ID avec mémoisation automatique
 * Évite les re-calculs inutiles
 */
export function useClient(clientId: string | null | undefined): Client | null {
  const client = useAppStore((state) =>
    clientId ? state.getClientById(clientId) : undefined
  );
  return client ?? null;
}

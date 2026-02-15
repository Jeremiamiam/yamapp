'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export type AppRole = 'admin' | 'member' | null;

interface UserRoleState {
  role: AppRole;
  loading: boolean;
  isAdmin: boolean;
  isMember: boolean;
}

/**
 * Rôle de l'utilisateur connecté.
 * Lit d'abord la table user_roles (Phase 7.2) ; si absent, fallback sur team.app_role (editor → member).
 * - admin : accès total (Compta, Settings, champs prix)
 * - member : accès tout sauf Compta et prix
 */
export function useUserRole(): UserRoleState {
  const [role, setRole] = useState<AppRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    async function fetchRole() {
      const { data: { user } } = await supabase.auth.getUser();
      if (cancelled || !user) {
        setLoading(false);
        return;
      }

      // 1. Essayer user_roles (Phase 7.2)
      const { data: roleRow } = await supabase
        .from('user_roles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      if (!cancelled && roleRow?.role) {
        setRole(roleRow.role as 'admin' | 'member');
        setLoading(false);
        return;
      }

      // 2. Fallback : team.app_role (admin → admin, editor → member)
      const { data: teamRow } = await supabase
        .from('team')
        .select('app_role')
        .eq('auth_user_id', user.id)
        .maybeSingle();

      if (!cancelled) {
        const r = teamRow?.app_role === 'admin' ? 'admin' : 'member';
        setRole(r);
      }
      setLoading(false);
    }

    fetchRole();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchRole();
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  return {
    role,
    loading,
    isAdmin: role === 'admin',
    isMember: role === 'member',
  };
}

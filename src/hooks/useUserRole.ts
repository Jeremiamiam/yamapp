'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export type AppRole = 'admin' | 'editor' | null;

interface UserRoleState {
  role: AppRole;
  loading: boolean;
}

/**
 * Rôle de l'utilisateur connecté (table profiles).
 * - admin : accès tout (dont Comptabilité)
 * - editor : accès tout sauf Comptabilité
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
      const { data: teamRow } = await supabase
        .from('team')
        .select('app_role')
        .eq('auth_user_id', user.id)
        .maybeSingle();
      if (!cancelled) {
        const r = teamRow?.app_role === 'admin' ? 'admin' : 'editor';
        setRole(r);
      }
      setLoading(false);
    }

    fetchRole();
    return () => { cancelled = true; };
  }, []);

  return { role, loading };
}

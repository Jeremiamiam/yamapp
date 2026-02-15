'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useUserRole } from '@/hooks/useUserRole';
import { createClient } from '@/lib/supabase/client';

interface UserRoleRow {
  id: string;
  email: string;
  role: 'admin' | 'member';
  team_member_id: string | null;
  created_at: string;
}

export default function SettingsPage() {
  const { isAdmin, loading: roleLoading } = useUserRole();
  const [users, setUsers] = useState<UserRoleRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      loadUsers();
    }
  }, [isAdmin]);

  async function loadUsers() {
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from('user_roles')
      .select('id, email, role, team_member_id, created_at')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setUsers(data as UserRoleRow[]);
    }
    setLoading(false);
  }

  async function toggleRole(userId: string, currentRole: string) {
    const newRole = currentRole === 'admin' ? 'member' : 'admin';
    const supabase = createClient();
    const { error } = await supabase
      .from('user_roles')
      .update({ role: newRole })
      .eq('id', userId);

    if (!error) {
      loadUsers();
    } else {
      alert('Erreur: ' + error.message);
    }
  }

  if (roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
        <div className="h-12 w-12 rounded-full border-2 border-[var(--accent-lime)] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
        <div className="text-center max-w-sm px-6">
          <div className="text-6xl mb-4" aria-hidden>🔒</div>
          <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">Accès refusé</h2>
          <p className="text-[var(--text-muted)] mb-6">
            Vous devez être admin pour accéder aux paramètres.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-primary)] font-medium hover:bg-[var(--accent-lime)]/10 transition-colors"
          >
            ← Retour au tableau de bord
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] p-8">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] mb-6 transition-colors"
        >
          ← Retour au tableau de bord
        </Link>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Gestion de l&apos;équipe</h1>
        <p className="text-[var(--text-muted)] mb-8">
          Gérez les rôles. Les admins ont accès à la comptabilité et aux champs prix.
        </p>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-10 w-10 rounded-full border-2 border-[var(--accent-lime)] border-t-transparent animate-spin" />
          </div>
        ) : (
          <ul className="space-y-3">
            {users.map((user) => (
              <li
                key={user.id}
                className="flex items-center justify-between gap-4 p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:border-[var(--border-subtle)]/80 transition-colors"
              >
                <div>
                  <p className="font-medium text-[var(--text-primary)]">{user.email}</p>
                  <p className="text-sm text-[var(--text-muted)] mt-0.5">
                    {user.role === 'admin' ? '👑 Admin' : '👤 Member'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleRole(user.id, user.role)}
                  className={`shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    user.role === 'admin'
                      ? 'bg-[var(--accent-lime)] text-[var(--bg-primary)] hover:opacity-90'
                      : 'bg-[var(--bg-tertiary)] text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]/80'
                  }`}
                >
                  {user.role === 'admin' ? 'Retirer admin' : 'Rendre admin'}
                </button>
              </li>
            ))}
          </ul>
        )}

        {users.length === 0 && !loading && (
          <p className="text-center py-12 text-[var(--text-muted)]">Aucun utilisateur dans user_roles.</p>
        )}
      </div>
    </div>
  );
}

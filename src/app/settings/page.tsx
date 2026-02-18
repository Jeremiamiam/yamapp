'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useUserRole } from '@/hooks/useUserRole';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store';

interface TeamRow {
  name: string | null;
  initials: string | null;
  color: string | null;
}

interface UserRoleRow {
  id: string;
  email: string;
  role: 'admin' | 'member';
  team_member_id: string | null;
  created_at: string;
  team: TeamRow | null;
}

const PRESET_COLORS = [
  '#84cc16', // lime (accent principal)
  '#3b82f6', // blue
  '#ef4444', // red
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#10b981', // emerald
  '#f97316', // orange
  '#06b6d4', // cyan
  '#a855f7', // purple
  '#eab308', // yellow
  '#14b8a6', // teal
];

export default function SettingsPage() {
  const { isAdmin, loading: roleLoading } = useUserRole();
  const [users, setUsers] = useState<UserRoleRow[]>([]);
  const [loading, setLoading] = useState(false);
  const { updateTeamMember } = useAppStore();
  const [editingMember, setEditingMember] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ name: string; initials: string; color: string }>({ name: '', initials: '', color: '' });

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
      .select('id, email, role, team_member_id, created_at, team(name, initials, color)')
      .order('created_at', { ascending: false });

    if (!error && data) {
      // Normalize: Supabase returns team as array, but we expect single object
      type RawRow = Omit<UserRoleRow, 'team'> & { team: TeamRow[] | TeamRow | null };
      const normalized = (data as RawRow[]).map((row) => ({
        ...row,
        team: Array.isArray(row.team) ? (row.team[0] ?? null) : row.team,
      }));
      setUsers(normalized as UserRoleRow[]);
    }
    setLoading(false);
  }

  function displayName(user: UserRoleRow): string {
    if (user.team?.name?.trim()) return user.team.name.trim();
    if (user.email) {
      const beforeAt = user.email.split('@')[0];
      if (beforeAt) return beforeAt.charAt(0).toUpperCase() + beforeAt.slice(1).toLowerCase();
    }
    return 'Utilisateur';
  }

  function initials(user: UserRoleRow): string {
    if (user.team?.initials?.trim()) return user.team.initials.trim().slice(0, 2).toUpperCase();
    const name = displayName(user);
    if (name.length >= 2) return name.slice(0, 2).toUpperCase();
    return name.slice(0, 1).toUpperCase() || '?';
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

  function startEditingMember(memberId: string, user: UserRoleRow) {
    if (user.team) {
      setEditingMember(memberId);
      setEditValues({
        name: user.team.name || '',
        initials: user.team.initials || '',
        color: user.team.color || '#84cc16'
      });
    }
  }

  async function saveMemberEdit(memberId: string) {
    await updateTeamMember(memberId, editValues);
    setEditingMember(null);
    loadUsers(); // Reload to show updated values
  }

  function cancelEdit() {
    setEditingMember(null);
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
          Modifiez les noms, initiales, couleurs et rôles des membres de l&apos;équipe.
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
                className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:border-[var(--border-subtle)]/80 transition-colors"
              >
                {editingMember === user.team_member_id ? (
                  <>
                    {/* Editing mode */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-4">
                        <div
                          className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                          style={{ backgroundColor: editValues.color, color: '#000' }}
                        >
                          {editValues.initials.slice(0, 2).toUpperCase() || '?'}
                        </div>
                        <div className="flex-1 grid grid-cols-2 gap-3">
                          <input
                            type="text"
                            value={editValues.name}
                            onChange={(e) => setEditValues({ ...editValues, name: e.target.value })}
                            placeholder="Nom"
                            className="px-3 py-2 text-sm rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-lime)]/50"
                          />
                          <input
                            type="text"
                            value={editValues.initials}
                            onChange={(e) => setEditValues({ ...editValues, initials: e.target.value.slice(0, 2) })}
                            placeholder="Init."
                            maxLength={2}
                            className="px-3 py-2 text-sm rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-lime)]/50 uppercase"
                          />
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => user.team_member_id && saveMemberEdit(user.team_member_id)}
                            className="px-4 py-2 rounded-lg text-sm font-medium bg-[var(--accent-lime)] text-[var(--bg-primary)] hover:opacity-90 transition-opacity"
                          >
                            OK
                          </button>
                          <button
                            type="button"
                            onClick={cancelEdit}
                            className="px-3 py-2 rounded-lg text-sm font-medium bg-[var(--bg-tertiary)] text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]/80 transition-colors"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                      {/* Color palette */}
                      <div className="flex items-center gap-2 pl-14">
                        <span className="text-xs text-[var(--text-muted)] font-medium">Couleur:</span>
                        <div className="flex gap-2 flex-wrap">
                          {PRESET_COLORS.map((color) => (
                            <button
                              key={color}
                              type="button"
                              onClick={() => setEditValues({ ...editValues, color })}
                              className={`w-8 h-8 rounded-full transition-all hover:scale-110 ${
                                editValues.color === color
                                  ? 'ring-2 ring-[var(--accent-lime)] ring-offset-2 ring-offset-[var(--bg-card)]'
                                  : ''
                              }`}
                              style={{ backgroundColor: color }}
                              title={color}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Display mode */}
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                          style={{ backgroundColor: user.team?.color || '#64748b', color: '#000' }}
                        >
                          {initials(user)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-[var(--text-primary)] truncate">{displayName(user)}</p>
                          <p className="text-sm text-[var(--text-muted)] truncate">{user.email}</p>
                          <p className="text-xs text-[var(--text-muted)] mt-0.5">
                            {user.role === 'admin' ? '👑 Admin' : '👤 Member'}
                            {user.team && <span className="ml-2">• {user.team.initials} • {user.team.color}</span>}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {user.team_member_id && (
                          <button
                            type="button"
                            onClick={() => startEditingMember(user.team_member_id!, user)}
                            className="px-3 py-2 rounded-lg text-sm font-medium bg-[var(--bg-tertiary)] text-[var(--text-primary)] hover:bg-[var(--accent-lime)]/10 transition-colors"
                          >
                            Modifier
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => toggleRole(user.id, user.role)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            user.role === 'admin'
                              ? 'bg-[var(--accent-lime)] text-[var(--bg-primary)] hover:opacity-90'
                              : 'bg-[var(--bg-tertiary)] text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]/80'
                          }`}
                        >
                          {user.role === 'admin' ? 'Retirer admin' : 'Rendre admin'}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}

        {users.length === 0 && !loading && (
          <p className="text-center py-12 text-[var(--text-muted)]">Aucun membre dans l&apos;équipe.</p>
        )}
      </div>
    </div>
  );
}

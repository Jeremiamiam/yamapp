'use client';

import { useState, useEffect } from 'react';
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
  role: 'admin' | 'member' | 'pending';
  team_member_id: string | null;
  created_at: string;
  team: TeamRow | null;
}

const PRESET_COLORS = [
  '#84cc16', '#3b82f6', '#ef4444', '#f59e0b', '#8b5cf6', '#ec4899',
  '#10b981', '#f97316', '#06b6d4', '#a855f7', '#eab308', '#14b8a6',
];

export function SettingsView() {
  const { role, loading: roleLoading } = useUserRole();
  const loadData = useAppStore((s) => s.loadData);
  const simulateAsMember = useAppStore((s) => s.simulateAsMember);
  const setSimulateAsMember = useAppStore((s) => s.setSimulateAsMember);
  const navigateToTimeline = useAppStore((s) => s.navigateToTimeline);
  const [users, setUsers] = useState<UserRoleRow[]>([]);
  const [loading, setLoading] = useState(false);
  const { updateTeamMember } = useAppStore();
  const [editingMember, setEditingMember] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ name: string; initials: string; color: string }>({ name: '', initials: '', color: '#84cc16' });

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (role === 'admin') {
      loadUsers();
    }
  }, [role]);

  async function loadUsers() {
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from('user_roles')
      .select('id, email, role, team_member_id, created_at, team(name, initials, color)')
      .order('created_at', { ascending: false });

    if (!error && data) {
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

  async function approveUser(teamMemberId: string) {
    const supabase = createClient();
    const { error } = await supabase.from('team').update({ app_role: 'editor' }).eq('id', teamMemberId);
    if (!error) loadUsers();
    else alert('Erreur: ' + error.message);
  }

  async function toggleRole(userId: string, currentRole: string) {
    const newRole = currentRole === 'admin' ? 'member' : 'admin';
    const supabase = createClient();
    const { error } = await supabase.from('user_roles').update({ role: newRole }).eq('id', userId);
    if (!error) loadUsers();
    else alert('Erreur: ' + error.message);
  }

  function startEditingMember(memberId: string, user: UserRoleRow) {
    if (user.team) {
      setEditingMember(memberId);
      setEditValues({
        name: user.team.name || '',
        initials: user.team.initials || '',
        color: user.team.color || '#84cc16',
      });
    }
  }

  async function saveMemberEdit(memberId: string) {
    await updateTeamMember(memberId, editValues);
    setEditingMember(null);
    loadUsers();
  }

  if (roleLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-0">
        <div className="h-10 w-10 rounded-full border-2 border-[var(--accent-lime)] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (role !== 'admin') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-0 p-6">
        <p className="text-[var(--text-muted)] mb-4">Accès réservé aux administrateurs.</p>
        <button
          type="button"
          onClick={navigateToTimeline}
          className="px-4 py-2 rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-primary)] font-medium"
        >
          Retour au calendrier
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Gestion de l&apos;équipe</h1>
        <p className="text-[var(--text-muted)] mb-6">
          Modifiez les noms, initiales, couleurs et rôles des membres de l&apos;équipe.
        </p>

        <div className="mb-8 p-4 rounded-xl bg-[var(--accent-violet)]/10 border border-[var(--accent-violet)]/20">
          <p className="text-sm font-medium text-[var(--text-primary)] mb-2">Mode simulation</p>
          <p className="text-xs text-[var(--text-muted)] mb-3">
            Voir l&apos;application comme un membre (sans Compta, sans accès admin).
          </p>
          <button
            type="button"
            onClick={() => setSimulateAsMember(!simulateAsMember)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              simulateAsMember ? 'bg-[var(--accent-violet)] text-white' : 'bg-[var(--bg-tertiary)] text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]/80'
            }`}
          >
            {simulateAsMember ? '✓ Vue member activée' : 'Simuler vue member'}
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-10 w-10 rounded-full border-2 border-[var(--accent-lime)] border-t-transparent animate-spin" />
          </div>
        ) : (
          <>
            {users.filter((u) => u.role === 'pending').length > 0 && (
              <section className="mb-8">
                <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--accent-amber)] mb-3">
                  Demandes d&apos;accès en attente
                </h2>
                <ul className="space-y-3 mb-6">
                  {users.filter((u) => u.role === 'pending').map((user) => (
                    <li key={user.id} className="p-4 rounded-xl bg-[var(--accent-amber)]/5 border border-[var(--accent-amber)]/20">
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
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => user.team_member_id && approveUser(user.team_member_id)}
                          className="px-4 py-2 rounded-lg text-sm font-semibold bg-[var(--accent-lime)] text-[var(--bg-primary)] hover:opacity-90 transition-opacity flex-shrink-0"
                        >
                          Autoriser
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3">
              Membres de l&apos;équipe
            </h2>
            <ul className="space-y-3">
              {users.filter((u) => u.role !== 'pending').map((user) => (
                <li
                  key={user.id}
                  className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:border-[var(--border-subtle)]/80 transition-colors"
                >
                  {editingMember === user.team_member_id ? (
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
                            onClick={() => setEditingMember(null)}
                            className="px-3 py-2 rounded-lg text-sm font-medium bg-[var(--bg-tertiary)] text-[var(--text-primary)]"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 pl-14">
                        <span className="text-xs text-[var(--text-muted)] font-medium">Couleur:</span>
                        <div className="flex gap-2 flex-wrap">
                          {PRESET_COLORS.map((color) => (
                            <button
                              key={color}
                              type="button"
                              onClick={() => setEditValues({ ...editValues, color })}
                              className={`w-8 h-8 rounded-full transition-all hover:scale-110 ${
                                editValues.color === color ? 'ring-2 ring-[var(--accent-lime)] ring-offset-2 ring-offset-[var(--bg-card)]' : ''
                              }`}
                              style={{ backgroundColor: color }}
                              title={color}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
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
                  )}
                </li>
              ))}
            </ul>
          </>
        )}

        {users.length === 0 && !loading && (
          <p className="text-center py-12 text-[var(--text-muted)]">Aucun membre dans l&apos;équipe.</p>
        )}
      </div>
    </div>
  );
}

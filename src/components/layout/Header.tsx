'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { TimelineFilters } from '@/features/timeline/components/TimelineFilters';
import { createClient } from '@/lib/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';
import { Deliverable, Call } from '@/types';

// Icons
const ChartIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"/>
    <line x1="12" y1="20" x2="12" y2="4"/>
    <line x1="6" y1="20" x2="6" y2="14"/>
  </svg>
);

const CalendarIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

const GridIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"/>
    <rect x="14" y="3" width="7" height="7"/>
    <rect x="14" y="14" width="7" height="7"/>
    <rect x="3" y="14" width="7" height="7"/>
  </svg>
);

const KanbanIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="5" height="18" rx="1"/>
    <rect x="10" y="3" width="5" height="12" rx="1"/>
    <rect x="17" y="3" width="5" height="8" rx="1"/>
  </svg>
);

const LogoutIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

const SettingsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
);

const BookOpenIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
  </svg>
);

const MagicWandIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 4V2"/>
    <path d="M15 16v-2"/>
    <path d="M8 9h2"/>
    <path d="M20 9h2"/>
    <path d="M17.8 11.8L19 13"/>
    <path d="M17.8 6.2L19 5"/>
    <path d="M3 21 12 12"/>
    <path d="m12.2 6.2-1.2-1.2"/>
    <path d="M3 12 5.5 9.5"/>
    <path d="M3 9 5.5 6.5"/>
  </svg>
);

/** Affiche le prénom ou la partie avant @ de l'email */
function displayName(email: string | undefined, fullName: string | undefined): string {
  if (fullName?.trim()) return fullName.trim();
  if (email) {
    const beforeAt = email.split('@')[0];
    if (beforeAt) return beforeAt.charAt(0).toUpperCase() + beforeAt.slice(1).toLowerCase();
  }
  return 'Compte';
}

/** Initiales depuis le displayName (ex: "Jeremy" → "JE", "Jean Dupont" → "JD") */
function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase().slice(0, 2);
  }
  const s = parts[0] || '';
  return s.length >= 2 ? (s[0] + s[1]).toUpperCase() : s[0]?.toUpperCase() || '?';
}

// Formatte le temps restant en "dans X min" ou "dans X h"
function formatTimeUntil(date: Date): string {
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  if (diffMs < 0) return 'maintenant';
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 60) return `dans ${diffMin} min`;
  const diffHours = Math.floor(diffMin / 60);
  const remainingMin = diffMin % 60;
  if (remainingMin === 0) return `dans ${diffHours}h`;
  return `dans ${diffHours}h${remainingMin.toString().padStart(2, '0')}`;
}

// Formatte l'heure "14:30"
function formatTime(date: Date): string {
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }).replace(':', 'h');
}

export function Header() {
  const router = useRouter();
  const { isAdmin, role } = useUserRole();
  const [userDisplayName, setUserDisplayName] = useState<string>('');
  const [currentTeamMember, setCurrentTeamMember] = useState<{ name: string; initials: string; color: string } | null>(null);
  const [now, setNow] = useState(() => new Date());
  const { currentView, navigateToTimeline, navigateToClients, navigateToCompta, navigateToProduction, navigateToCreativeBoard, navigateToWiki, navigateToAdmin, deliverables, calls, getClientById, getTeamMemberById } = useAppStore();
  const canAccessCompta = isAdmin;

  // Rafraîchir "now" toutes les 30 secondes pour mettre à jour le countdown
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(interval);
  }, []);

  // Trouver le prochain événement (deliverable ou call) AUJOURD'HUI uniquement
  const nextEvent = useMemo(() => {
    const nowTime = now.getTime();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const todayEnd = todayStart + 24 * 60 * 60 * 1000; // Fin de journée
    
    // Collecter tous les événements avec date AUJOURD'HUI et dans le futur
    const events: { type: 'deliverable' | 'call'; date: Date; clientId?: string; label: string; assigneeId?: string }[] = [];
    
    deliverables.forEach((d: Deliverable) => {
      if (d.dueDate && d.clientId) {
        const dateTime = d.dueDate.getTime();
        // Seulement si c'est aujourd'hui ET dans le futur
        if (dateTime > nowTime && dateTime < todayEnd) {
          events.push({
            type: 'deliverable',
            date: d.dueDate,
            clientId: d.clientId,
            label: d.name,
            assigneeId: d.assigneeId,
          });
        }
      }
    });
    
    calls.forEach((c: Call) => {
      if (c.scheduledAt && c.clientId) {
        const dateTime = c.scheduledAt.getTime();
        // Seulement si c'est aujourd'hui ET dans le futur
        if (dateTime > nowTime && dateTime < todayEnd) {
          events.push({
            type: 'call',
            date: c.scheduledAt,
            clientId: c.clientId,
            label: c.title,
            assigneeId: c.assigneeId,
          });
        }
      }
    });
    
    if (events.length === 0) return null;
    
    // Trier par date et prendre le premier
    events.sort((a, b) => a.date.getTime() - b.date.getTime());
    const next = events[0];
    
    const client = next.clientId ? getClientById(next.clientId) : null;
    const assignee = next.assigneeId ? getTeamMemberById(next.assigneeId) : undefined;
    
    return {
      ...next,
      clientName: client?.name || 'Sans client',
      assignee,
    };
  }, [deliverables, calls, getClientById, getTeamMemberById, now]);

  useEffect(() => {
    const supabase = createClient();
    async function loadUserAndTeamMember(user: { id: string; email?: string; user_metadata?: Record<string, unknown> }) {
      const name = (user.user_metadata?.full_name as string) || (user.user_metadata?.name as string);
      setUserDisplayName(displayName(user.email ?? undefined, name));
      const { data: teamRow } = await supabase
        .from('team')
        .select('name, initials, color')
        .eq('auth_user_id', user.id)
        .maybeSingle();
      if (teamRow?.initials && teamRow?.color) {
        setCurrentTeamMember({
          name: (teamRow.name as string) || displayName(user.email ?? undefined, name),
          initials: teamRow.initials as string,
          color: teamRow.color as string,
        });
      } else {
        setCurrentTeamMember(null);
      }
    }
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) loadUserAndTeamMember(user);
      else setCurrentTeamMember(null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      const u = session?.user;
      if (u) loadUserAndTeamMember(u);
      else {
        setUserDisplayName('');
        setCurrentTeamMember(null);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <header className="flex-shrink-0 px-3 sm:px-4 md:px-5 py-2 md:py-3 border-b border-[var(--border-subtle)] relative z-10 bg-[var(--bg-primary)]/80 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-3 sm:gap-6">
        {/* Logo à gauche */}
        <div className="flex-shrink-0">
          <h1 className="flex items-center">
            <img
              src="/icons/yamboard_logo.svg"
              alt="Yamboard"
              className="h-[48px] w-auto"
            />
          </h1>
        </div>
        
        {/* Zone centrale : Filtres équipe + Prochain événement (flex-1 pour prendre tout l'espace) */}
        <div className="flex-1 min-w-0 hidden md:flex items-center gap-4">
          {/* Filters équipe — toujours visible, grisé si pas sur timeline */}
          <div className={`flex-shrink-0 transition-opacity ${currentView !== 'timeline' ? 'opacity-40 pointer-events-none' : ''}`}>
            <TimelineFilters />
          </div>

          {/* Prochain événement — prend le reste de l'espace */}
          <div className="flex-1 min-w-0 hidden lg:flex items-center justify-center gap-3 px-4 py-1.5 rounded-lg bg-[var(--bg-secondary)]/60 border border-[var(--border-subtle)]">
            {nextEvent ? (
              <>
                {/* Label "Prochain event" avec marquee */}
                <div className="flex-shrink-0 overflow-hidden w-24">
                  <span 
                    className={`inline-block text-[10px] font-medium uppercase tracking-wider whitespace-nowrap animate-marquee ${nextEvent.type === 'call' ? 'text-[var(--accent-cyan)]' : 'text-[var(--accent-violet)]'}`}
                  >
                    Prochain event • Prochain event • Prochain event • 
                  </span>
                </div>
                <span className="flex-shrink-0 w-px h-4 bg-[var(--border-subtle)]" />
                {/* Client + Label */}
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-[10px] text-[var(--text-muted)] truncate">
                    {nextEvent.clientName}
                  </span>
                  <span className="text-xs font-medium text-[var(--text-primary)] truncate">
                    {nextEvent.label}
                  </span>
                </div>
                {/* Heure + countdown */}
                <div className="flex flex-col items-end flex-shrink-0">
                  <span className="text-[10px] font-mono text-[var(--text-muted)]">
                    {formatTime(nextEvent.date)}
                  </span>
                  <span className="text-[10px] font-medium text-[var(--accent-lime)]">
                    {formatTimeUntil(nextEvent.date)}
                  </span>
                </div>
                {/* Assignee avatar */}
                {nextEvent.assignee && (
                  <div
                    className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                    style={{ backgroundColor: nextEvent.assignee.color }}
                    title={nextEvent.assignee.name}
                  >
                    {nextEvent.assignee.initials}
                  </div>
                )}
              </>
            ) : (
              <span className="text-[11px] text-[var(--text-muted)]">
                Pas d'autre événement prévu aujourd'hui
              </span>
            )}
          </div>
        </div>
        
        {/* À droite : view switcher (desktop) + user + settings (toujours) */}
        <div className="flex-shrink-0 flex items-center gap-2 sm:gap-3 md:gap-4">
          {/* View switcher — desktop uniquement */}
          <div className="hidden md:flex p-1 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-subtle)]">
            <button
              onClick={navigateToTimeline}
              aria-label="Vue Calendrier"
              className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2 sm:py-1.5 rounded-md text-xs font-medium transition-all touch-manipulation min-h-[44px] sm:min-h-0 ${
                currentView === 'timeline'
                  ? 'bg-[var(--bg-tertiary)] text-[var(--text-primary)] shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <CalendarIcon />
              <span className="hidden sm:inline">Calendrier</span>
            </button>
            <button
              onClick={navigateToProduction}
              aria-label="Vue Production"
              className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2 sm:py-1.5 rounded-md text-xs font-medium transition-all touch-manipulation min-h-[44px] sm:min-h-0 ${
                currentView === 'production'
                  ? 'bg-[var(--bg-tertiary)] text-[var(--text-primary)] shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <KanbanIcon />
              <span className="hidden sm:inline">Production</span>
            </button>
            <button
              onClick={navigateToClients}
              aria-label="Vue Clients"
              className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2 sm:py-1.5 rounded-md text-xs font-medium transition-all touch-manipulation min-h-[44px] sm:min-h-0 ${
                currentView === 'clients'
                  ? 'bg-[var(--bg-tertiary)] text-[var(--text-primary)] shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <GridIcon />
              <span className="hidden sm:inline">Clients</span>
            </button>
            {canAccessCompta && (
              <button
                onClick={navigateToCompta}
                aria-label="Vue Comptabilité"
                className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2 sm:py-1.5 rounded-md text-xs font-medium transition-all touch-manipulation min-h-[44px] sm:min-h-0 ${
                  currentView === 'compta'
                    ? 'bg-[var(--bg-tertiary)] text-[var(--text-primary)] shadow-sm'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                <ChartIcon />
                <span className="hidden sm:inline">Comptabilité</span>
              </button>
            )}
          </div>
          {/* User chip dynamique (TeamMember) ou fallback auth */}
          {userDisplayName && (
            <div
              className="flex-shrink-0 w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center text-[10px] md:text-xs font-bold text-white"
              style={{ backgroundColor: currentTeamMember?.color ?? 'var(--accent-cyan)' }}
              title={currentTeamMember?.name ?? userDisplayName}
            >
              {currentTeamMember?.initials ?? initialsFromName(userDisplayName)}
            </div>
          )}
          <div className="flex items-center gap-0.5 md:gap-1 pl-2 md:pl-3 border-l border-[var(--border-subtle)]">
            <button
              type="button"
              onClick={navigateToCreativeBoard}
              className={`p-1.5 md:p-2 rounded-md transition-colors touch-manipulation min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 flex items-center justify-center ${currentView === 'creative-board' ? 'text-[var(--accent-lime)] bg-[var(--accent-lime)]/10' : 'text-[var(--accent-lime)] hover:bg-[var(--accent-lime)]/10'}`}
              title="Creative Board"
              aria-label="Creative Board"
            >
              <MagicWandIcon />
            </button>
            <button
              type="button"
              onClick={navigateToWiki}
              className={`p-1.5 md:p-2 rounded-md transition-colors touch-manipulation min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 flex items-center justify-center ${currentView === 'wiki' ? 'text-[var(--accent-violet)] bg-[var(--accent-violet)]/10' : 'text-[var(--text-muted)] hover:text-[var(--accent-violet)] hover:bg-[var(--accent-violet)]/10'}`}
              title="Wiki / Guide (⌘⇧D)"
              aria-label="Wiki"
            >
              <BookOpenIcon />
            </button>
            {role === 'admin' && (
              <button
                type="button"
                onClick={navigateToAdmin}
                className={`p-1.5 md:p-2 rounded-md transition-colors touch-manipulation min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 flex items-center justify-center ${currentView === 'admin' ? 'text-[var(--accent-violet)] bg-[var(--accent-violet)]/10' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'}`}
                title="Paramètres et gestion des rôles"
                aria-label="Paramètres"
              >
                <SettingsIcon />
              </button>
            )}
            <button
              type="button"
              onClick={handleLogout}
              className="p-1.5 md:p-2 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors touch-manipulation min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 flex items-center justify-center"
              title="Se déconnecter"
              aria-label="Se déconnecter"
            >
              <LogoutIcon />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

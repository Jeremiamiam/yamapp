'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { TimelineFilters } from '@/features/timeline/components/TimelineFilters';
import { createClient } from '@/lib/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';

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

/** Affiche le prénom ou la partie avant @ de l'email */
function displayName(email: string | undefined, fullName: string | undefined): string {
  if (fullName?.trim()) return fullName.trim();
  if (email) {
    const beforeAt = email.split('@')[0];
    if (beforeAt) return beforeAt.charAt(0).toUpperCase() + beforeAt.slice(1).toLowerCase();
  }
  return 'Compte';
}

export function Header() {
  const router = useRouter();
  const { isAdmin } = useUserRole();
  const [userDisplayName, setUserDisplayName] = useState<string>('');
  const { currentView, navigateToTimeline, navigateToClients, navigateToCompta } = useAppStore();
  const canAccessCompta = isAdmin;

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        const name = (user.user_metadata?.full_name as string) || (user.user_metadata?.name as string);
        setUserDisplayName(displayName(user.email ?? undefined, name));
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      const u = session?.user;
      if (u) setUserDisplayName(displayName(u.email ?? undefined, u.user_metadata?.full_name ?? u.user_metadata?.name));
      else setUserDisplayName('');
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
    <header className="flex-shrink-0 px-4 sm:px-6 md:px-8 py-3 sm:py-4 border-b border-[var(--border-subtle)] relative z-10 bg-[var(--bg-primary)]/80 backdrop-blur-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-6">
        <div className="animate-slide-in flex-shrink-0">
          <h1 className="text-lg font-bold tracking-tight leading-tight" style={{ fontFamily: 'var(--font-display)' }}>
            <span className="text-[var(--text-primary)] block">dashboard</span>
            <span className="text-[var(--text-primary)]">yam</span>
            <span className="text-[var(--accent-lime)]">.</span>
          </h1>
        </div>
        
        {/* Filters — hidden on compta */}
        <div className="flex-1 min-w-0 w-full sm:w-auto">
          {currentView !== 'compta' && (
            <div className="animate-slide-in" style={{ animationDelay: '0.05s' }}>
              <TimelineFilters />
            </div>
          )}
        </div>
        
        <div className="animate-slide-in flex-shrink-0 flex items-center gap-3 sm:gap-4" style={{ animationDelay: '0.1s' }}>
          {/* View Switcher — à droite avant l'utilisateur */}
          <div className="flex p-1 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-subtle)]">
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
          {/* Utilisateur connecté + zone compte */}
          {userDisplayName && (
            <span className="text-sm font-medium text-[var(--text-primary)]" title="Connecté">
              {userDisplayName}
            </span>
          )}
          <div className="flex items-center gap-1 pl-3 border-l border-[var(--border-subtle)]">
            {isAdmin && (
              <button
                type="button"
                onClick={() => router.push('/settings')}
                className="p-2 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                title="Paramètres et gestion des rôles"
                aria-label="Paramètres"
              >
                <SettingsIcon />
              </button>
            )}
            <button
              type="button"
              onClick={handleLogout}
              className="p-2 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
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

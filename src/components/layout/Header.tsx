'use client';

import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { formatHeaderDate } from '@/lib/date-utils';
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

export function Header() {
  const router = useRouter();
  const { role } = useUserRole();
  const { currentView, navigateToTimeline, navigateToClients, navigateToCompta } = useAppStore();
  const canAccessCompta = role === 'admin';

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <header className="flex-shrink-0 px-8 py-4 border-b border-[var(--border-subtle)] relative z-10 bg-[var(--bg-primary)]/80 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-6">
        <div className="animate-slide-in flex-shrink-0 flex items-center gap-8">
          <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
            <span className="text-[var(--text-primary)]">YAM</span>
            <span className="text-[var(--accent-lime)]">.</span>
          </h1>

          {/* View Switcher */}
          <div className="flex p-1 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-subtle)]">
            <button
              onClick={navigateToTimeline}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                currentView === 'timeline'
                  ? 'bg-[var(--bg-tertiary)] text-[var(--text-primary)] shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <CalendarIcon />
              Calendrier
            </button>
            <button
              onClick={navigateToClients}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                currentView === 'clients'
                  ? 'bg-[var(--bg-tertiary)] text-[var(--text-primary)] shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <GridIcon />
              Clients
            </button>
            {canAccessCompta && (
              <button
                onClick={navigateToCompta}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  currentView === 'compta'
                    ? 'bg-[var(--bg-tertiary)] text-[var(--text-primary)] shadow-sm'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                <ChartIcon />
                Comptabilité
              </button>
            )}
          </div>
        </div>
        
        {/* Filters — hidden on compta */}
        <div className="flex-1">
          {currentView !== 'compta' && (
            <div className="animate-slide-in" style={{ animationDelay: '0.05s' }}>
              <TimelineFilters />
            </div>
          )}
        </div>
        
        <div className="text-right animate-slide-in flex-shrink-0 flex items-center gap-4" style={{ animationDelay: '0.1s' }}>
          <div className="text-sm text-[var(--text-muted)] uppercase tracking-wider">
            {formatHeaderDate(new Date())}
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
            title="Se déconnecter"
          >
            <LogoutIcon />
            Déconnexion
          </button>
        </div>
      </div>
    </header>
  );
}

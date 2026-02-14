'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { formatHeaderDate } from '@/lib/date-utils';
import { TimelineFilters } from '@/features/timeline/components/TimelineFilters';
import { createClient } from '@/lib/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';
import { useIsMobile } from '@/hooks/useMediaQuery';

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

const FilterIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
  </svg>
);

export function Header() {
  const router = useRouter();
  const { role } = useUserRole();
  const { currentView, navigateToTimeline, navigateToClients, navigateToCompta } = useAppStore();
  const canAccessCompta = role === 'admin';
  const isMobile = useIsMobile();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const hasActiveFilters = useAppStore((s) => 
    s.filters.clientStatus !== 'all' || s.filters.teamMemberId !== null
  );

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  const navButtonClass = (active: boolean) =>
    `flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2 sm:py-1.5 rounded-md text-xs font-medium transition-all min-h-[44px] sm:min-h-0 min-w-[44px] sm:min-w-0 ${
      active
        ? 'bg-[var(--bg-tertiary)] text-[var(--text-primary)] shadow-sm'
        : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
    }`;

  return (
    <header className="flex-shrink-0 px-4 sm:px-6 md:px-8 py-3 sm:py-4 border-b border-[var(--border-subtle)] relative z-10 bg-[var(--bg-primary)]/80 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-2 sm:gap-6">
        <div className="animate-slide-in flex-shrink-0 flex items-center gap-4 sm:gap-8 min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight flex-shrink-0" style={{ fontFamily: 'var(--font-display)' }}>
            <span className="text-[var(--text-primary)]">YAM</span>
            <span className="text-[var(--accent-lime)]">.</span>
          </h1>

          {/* View Switcher — compact on mobile */}
          <div className="flex p-1 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-subtle)]">
            <button
              onClick={navigateToTimeline}
              className={navButtonClass(currentView === 'timeline')}
              title="Calendrier"
            >
              <CalendarIcon />
              <span className="hidden sm:inline">Calendrier</span>
            </button>
            <button
              onClick={navigateToClients}
              className={navButtonClass(currentView === 'clients')}
              title="Clients"
            >
              <GridIcon />
              <span className="hidden sm:inline">Clients</span>
            </button>
            {canAccessCompta && (
              <button
                onClick={navigateToCompta}
                className={navButtonClass(currentView === 'compta')}
                title="Comptabilité"
              >
                <ChartIcon />
                <span className="hidden sm:inline">Compta</span>
              </button>
            )}
          </div>
        </div>

        {/* Filters — drawer on mobile, inline on desktop */}
        {currentView !== 'compta' && (
          <>
            {isMobile ? (
              <>
                <button
                  type="button"
                  onClick={() => setFiltersOpen((o) => !o)}
                  className={`flex-shrink-0 relative p-2.5 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors ${
                    filtersOpen
                      ? 'bg-[var(--bg-tertiary)] text-[var(--text-primary)]'
                      : 'text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]'
                  }`}
                  title={hasActiveFilters ? 'Filtres actifs' : 'Filtres'}
                  aria-expanded={filtersOpen}
                >
                  <FilterIcon />
                  {hasActiveFilters && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[var(--accent-lime)]" />
                  )}
                </button>
                {filtersOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40 bg-black/50"
                      onClick={() => setFiltersOpen(false)}
                      aria-hidden="true"
                    />
                    <div className="fixed top-[60px] left-0 right-0 z-50 p-4 bg-[var(--bg-card)] border-b border-[var(--border-subtle)] shadow-xl animate-fade-in-up">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-semibold text-[var(--text-primary)]">Filtres</span>
                        <button
                          type="button"
                          onClick={() => setFiltersOpen(false)}
                          className="p-2 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)]"
                        >
                          ×
                        </button>
                      </div>
                      <TimelineFilters />
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="flex-1 min-w-0 flex items-center justify-end sm:justify-center overflow-hidden">
                <div className="animate-slide-in max-w-full" style={{ animationDelay: '0.05s' }}>
                  <TimelineFilters />
                </div>
              </div>
            )}
          </>
        )}

        <div className="text-right animate-slide-in flex-shrink-0 flex items-center gap-2 sm:gap-4" style={{ animationDelay: '0.1s' }}>
          <div className="hidden sm:block text-sm text-[var(--text-muted)] uppercase tracking-wider">
            {formatHeaderDate(new Date())}
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-1.5 sm:gap-2 p-2.5 sm:px-2.5 sm:py-1.5 rounded-md text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 justify-center"
            title="Se déconnecter"
          >
            <LogoutIcon />
            <span className="hidden sm:inline">Déconnexion</span>
          </button>
        </div>
      </div>
    </header>
  );
}

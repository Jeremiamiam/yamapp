'use client';

import { useAppStore } from '@/lib/store';

// Icons
const Users = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const X = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

export function TimelineFilters() {
  const { 
    filters, 
    team, 
    clients,
    setClientStatusFilter, 
    setTeamMemberFilter, 
    resetFilters 
  } = useAppStore();

  const hasActiveFilters = filters.clientStatus !== 'all' || filters.teamMemberId !== null;
  
  // Compter les clients/prospects pour les badges
  const prospectCount = clients.filter(c => c.status === 'prospect').length;
  const clientCount = clients.filter(c => c.status === 'client').length;
  
  // Trouver le membre sélectionné
  const selectedMember = filters.teamMemberId 
    ? team.find(m => m.id === filters.teamMemberId) 
    : null;

  const filterBtnClass = (active: boolean) =>
    `px-3 py-2 rounded-lg text-xs font-semibold transition-all min-h-[44px] flex items-center justify-center ${
      active
        ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm'
        : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
    }`;

  return (
    <div className="flex items-center gap-2 sm:gap-3 flex-wrap overflow-x-auto overflow-y-hidden py-1 -my-1 min-w-0">
      {/* Filtre Statut Client */}
      <div className="flex items-center gap-1 bg-[var(--bg-secondary)] rounded-xl p-1 flex-shrink-0">
        <button
          onClick={() => setClientStatusFilter('all')}
          className={filterBtnClass(filters.clientStatus === 'all')}
        >
          Tous
        </button>
        <button
          onClick={() => setClientStatusFilter('client')}
          className={`${filterBtnClass(filters.clientStatus === 'client')} flex items-center gap-1.5`}
        >
          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
            filters.clientStatus === 'client' ? 'bg-[var(--accent-cyan)]' : 'bg-current opacity-50'
          }`} />
          Clients
          <span className="opacity-60">{clientCount}</span>
        </button>
        <button
          onClick={() => setClientStatusFilter('prospect')}
          className={`${filterBtnClass(filters.clientStatus === 'prospect')} flex items-center gap-1.5`}
        >
          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
            filters.clientStatus === 'prospect' ? 'bg-[var(--accent-amber)]' : 'bg-current opacity-50'
          }`} />
          Prospects
          <span className="opacity-60">{prospectCount}</span>
        </button>
      </div>

      {/* Séparateur */}
      <div className="h-6 w-px bg-[var(--border-subtle)] flex-shrink-0" />

      {/* Filtre Équipe */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-[var(--text-muted)]">
          <Users />
        </span>
        
        {selectedMember ? (
          // Membre sélectionné - afficher comme chip
          <button
            onClick={() => setTeamMemberFilter(null)}
            className="flex items-center gap-2 pl-2 pr-3 py-2 rounded-lg min-h-[44px] bg-[var(--accent-violet)]/20 text-[var(--accent-violet)] text-xs font-semibold group"
          >
            <div 
              className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
              style={{ backgroundColor: selectedMember.color, color: '#000' }}
            >
              {selectedMember.initials}
            </div>
            <span>{selectedMember.name.split(' ')[0]}</span>
            <span className="opacity-60 group-hover:opacity-100 transition-opacity">
              <X />
            </span>
          </button>
        ) : (
          // Liste des membres
          <div className="flex items-center gap-1">
            {team.map(member => (
              <button
                key={member.id}
                onClick={() => setTeamMemberFilter(member.id)}
                className="w-11 h-11 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-[10px] font-bold ring-2 ring-transparent hover:ring-[var(--accent-violet)]/50 transition-[box-shadow] min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0"
                style={{ backgroundColor: member.color, color: '#000' }}
                title={member.name}
              >
                {member.initials}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Reset — toujours en layout pour éviter shift au clic */}
      <div className="h-6 w-px bg-[var(--border-subtle)] flex-shrink-0" />
      <button
        onClick={resetFilters}
        className={`text-xs flex items-center gap-1 min-w-[4.5rem] min-h-[44px] sm:min-h-0 justify-end transition-opacity duration-150 py-2 sm:py-0 ${
          hasActiveFilters
            ? 'text-[var(--text-muted)] hover:text-[var(--accent-coral)] opacity-100'
            : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden={!hasActiveFilters}
        tabIndex={hasActiveFilters ? 0 : -1}
      >
        <X />
        Reset
      </button>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/lib/store';

// Icons
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
    setTeamMemberFilter, 
    resetFilters 
  } = useAppStore();
  
  // État pour l'animation staggered
  const [visibleIndexes, setVisibleIndexes] = useState<number[]>([]);

  const hasActiveFilters = filters.teamMemberId !== null;
  
  // Trouver le membre sélectionné
  const selectedMember = filters.teamMemberId 
    ? team.find(m => m.id === filters.teamMemberId) 
    : null;
    
  // Animation staggered au mount
  useEffect(() => {
    if (!selectedMember && team.length > 0) {
      setVisibleIndexes([]);
      team.forEach((_, index) => {
        setTimeout(() => {
          setVisibleIndexes(prev => [...prev, index]);
        }, index * 80);
      });
    }
  }, [selectedMember, team]);

  return (
    <div className="flex items-center gap-2 animate-fade-in">
      {/* Filtre Équipe */}
      {selectedMember ? (
        // Membre sélectionné - afficher comme chip avec fond coloré
        <button
          onClick={() => setTeamMemberFilter(null)}
          className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg text-xs font-semibold group cursor-pointer hover:opacity-80 transition-opacity"
          style={{ backgroundColor: `${selectedMember.color}33` }}
        >
          <div 
            className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
            style={{ backgroundColor: selectedMember.color, color: '#000' }}
          >
            {selectedMember.initials}
          </div>
          <span style={{ color: selectedMember.color }}>{selectedMember.name.split(' ')[0]}</span>
          <span className="opacity-60 group-hover:opacity-100 transition-opacity" style={{ color: selectedMember.color }}>
            <X />
          </span>
        </button>
      ) : (
        // Liste des membres
        <div className="flex items-center gap-1">
          {team.map((member, index) => {
            const isVisible = visibleIndexes.includes(index);
            return (
              <button
                key={member.id}
                onClick={() => setTeamMemberFilter(member.id)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold border hover:opacity-80 cursor-pointer"
                style={{ 
                  backgroundColor: 'transparent', 
                  color: member.color,
                  borderColor: member.color,
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? 'translateY(0)' : 'translateY(-12px)',
                  transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
                }}
                title={member.name}
              >
                {member.initials}
              </button>
            );
          })}
        </div>
      )}

      {/* Reset */}
      {hasActiveFilters && (
        <button
          onClick={resetFilters}
          className="text-xs flex items-center gap-1 text-[var(--text-muted)] hover:text-[var(--accent-magenta)] transition-colors cursor-pointer"
        >
          <X />
          Reset
        </button>
      )}
    </div>
  );
}

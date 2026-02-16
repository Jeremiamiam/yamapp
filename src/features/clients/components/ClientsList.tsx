'use client';

import { useMemo } from 'react';
import { useAppStore } from '@/lib/store';
import { useModal } from '@/hooks';
import { formatDate } from '@/lib/date-utils';
import { Client, Deliverable, Call } from '@/types';

// Icons
const User = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

const Calendar = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

const Phone = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
);

const ArrowRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14"/>
    <path d="M12 5l7 7-7 7"/>
  </svg>
);

export function ClientsList() {
  const { clients, deliverables, calls, filters, navigateToClient } = useAppStore();
  const { openClientModal } = useModal();

  const { clientsColumn, prospectsColumn } = useMemo(() => {
    const filtered = clients.filter(c => {
      if (filters.clientStatus !== 'all' && c.status !== filters.clientStatus) return false;
      if (filters.teamMemberId) {
        const hasDeliverables = deliverables.some(d => d.clientId === c.id && d.assigneeId === filters.teamMemberId);
        const hasCalls = calls.some(call => call.clientId === c.id && call.assigneeId === filters.teamMemberId);
        if (!hasDeliverables && !hasCalls) return false;
      }
      return true;
    });
    const sorted = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
    return {
      clientsColumn: sorted.filter(c => c.status === 'client'),
      prospectsColumn: sorted.filter(c => c.status === 'prospect'),
    };
  }, [clients, deliverables, calls, filters]);

  const getClientData = (clientId: string) => {
    const now = new Date();
    
    // Prochain livrable (avec date uniquement)
    const nextDeliverable = deliverables
      .filter(d => d.clientId === clientId && d.dueDate != null && d.status !== 'completed' && new Date(d.dueDate) >= now)
      .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())[0];

    // Dernier appel (avec date uniquement)
    const lastCall = calls
      .filter(c => c.clientId === clientId && c.scheduledAt != null && new Date(c.scheduledAt) < now)
      .sort((a, b) => new Date(b.scheduledAt!).getTime() - new Date(a.scheduledAt!).getTime())[0];

    return { nextDeliverable, lastCall };
  };

  function renderCard(client: Client) {
    const { nextDeliverable, lastCall } = getClientData(client.id);
    const isProspect = client.status === 'prospect';
    return (
      <div
        key={client.id}
        onClick={() => navigateToClient(client.id)}
        className="group bg-[var(--bg-card)] rounded-2xl border border-[var(--border-subtle)] hover:border-[var(--accent-cyan)] transition-all duration-200 cursor-pointer overflow-hidden flex flex-col h-[220px]"
      >
        <div className="p-5 border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)]/30">
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-display font-bold text-lg text-[var(--text-primary)] truncate group-hover:text-[var(--accent-cyan)] transition-colors">
              {client.name}
            </h3>
            <span className={`flex-shrink-0 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
              isProspect ? 'bg-[var(--accent-amber)]/20 text-[var(--accent-amber)]' : 'bg-[var(--accent-cyan)]/20 text-[var(--accent-cyan)]'
            }`}>
              {isProspect ? 'Prospect' : 'Client'}
            </span>
          </div>
        </div>
        <div className="p-5 flex-1 flex flex-col justify-between gap-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="text-[var(--accent-violet)] mt-0.5"><Calendar /></span>
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-semibold mb-0.5">Prochain livrable</p>
                {nextDeliverable ? (
                  <p className="text-sm text-[var(--text-secondary)] truncate">
                    {nextDeliverable.name}
                    <span className="text-[var(--text-muted)] ml-1.5">• {nextDeliverable.dueDate ? formatDate(new Date(nextDeliverable.dueDate)) : ''}</span>
                  </p>
                ) : (
                  <p className="text-sm text-[var(--text-muted)] italic">Rien de prévu</p>
                )}
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-[var(--accent-lime)] mt-0.5"><Phone /></span>
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-semibold mb-0.5">Dernier échange</p>
                {lastCall ? (
                  <p className="text-sm text-[var(--text-secondary)] truncate">
                    {lastCall.title}
                    <span className="text-[var(--text-muted)] ml-1.5">• {lastCall.scheduledAt ? formatDate(new Date(lastCall.scheduledAt)) : ''}</span>
                  </p>
                ) : (
                  <p className="text-sm text-[var(--text-muted)] italic">Aucun appel</p>
                )}
              </div>
            </div>
          </div>
          {client.contacts.length > 0 && (
            <div className="flex items-center gap-2 pt-3 border-t border-[var(--border-subtle)]">
              <div className="w-5 h-5 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center text-[var(--text-muted)]">
                <User />
              </div>
              <span className="text-xs text-[var(--text-muted)] truncate">{client.contacts[0].name}</span>
              <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-[var(--accent-cyan)]">
                <ArrowRight />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  const addClientCard = (
    <div
      role="button"
      tabIndex={0}
      onClick={() => openClientModal()}
      onKeyDown={e => e.key === 'Enter' && openClientModal()}
      className="border border-dashed border-[var(--border-subtle)] rounded-2xl flex flex-col items-center justify-center p-6 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--text-muted)] transition-colors cursor-pointer h-[220px] min-h-[220px]"
    >
      <span className="text-2xl mb-2">+</span>
      <span className="text-sm font-medium">Ajouter un client</span>
    </div>
  );

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8">
      <div className="flex flex-col lg:flex-row max-w-6xl mx-auto gap-0">
        {/* Colonne gauche : Clients */}
        <div className="flex-1 flex flex-col gap-4 lg:pr-8 lg:border-r-2 border-[var(--border-subtle)]">
          <h2 className="text-lg font-bold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--accent-cyan)]" />
            Clients
            <span className="text-sm font-normal normal-case text-[var(--text-muted)]">({clientsColumn.length})</span>
          </h2>
          <div className="flex flex-col gap-4">
            {clientsColumn.map(renderCard)}
            {addClientCard}
          </div>
        </div>

        {/* Colonne droite : Prospects */}
        <div className="flex-1 flex flex-col gap-4 lg:pl-8 mt-8 lg:mt-0">
          <h2 className="text-lg font-bold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--accent-amber)]" />
            Prospects
            <span className="text-sm font-normal normal-case text-[var(--text-muted)]">({prospectsColumn.length})</span>
          </h2>
          <div className="flex flex-col gap-4">
            {prospectsColumn.map(renderCard)}
          </div>
        </div>
      </div>
    </div>
  );
}

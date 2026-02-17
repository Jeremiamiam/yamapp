'use client';

import { useEffect, useMemo } from 'react';
import { useAppStore } from '@/lib/store';
import { useClient, useModal } from '@/hooks';
import { formatDateShort, formatTime, isToday, isPast } from '@/lib/date-utils';
import {
  ContactsSection,
  DocumentsSection,
  LinksSection,
  DeliverablesSection,
} from './sections';

const ArrowLeft = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M12 19l-7-7 7-7"/>
  </svg>
);

const Pencil = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

// Icons
const CalendarIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

const PhoneIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
);

const PackageIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
  </svg>
);

export function ClientDetail() {
  const selectedClientId = useAppStore((state) => state.selectedClientId);
  const navigateBack = useAppStore((state) => state.navigateBack);
  const openModal = useAppStore((state) => state.openModal);
  const { getDeliverablesByClientId, getCallsByClientId, getTeamMemberById } = useAppStore();
  const client = useClient(selectedClientId);
  const { openDeliverableModal, openCallModal } = useModal();

  // Prochain événement (deliverable ou call)
  const nextEvent = useMemo(() => {
    if (!client) return null;
    
    const deliverables = getDeliverablesByClientId(client.id);
    const calls = getCallsByClientId(client.id);
    const now = new Date();
    
    type EventItem = {
      id: string;
      type: 'deliverable' | 'call';
      title: string;
      date: Date;
      assigneeId?: string;
    };
    
    const events: EventItem[] = [];
    
    deliverables
      .filter(d => d.dueDate && new Date(d.dueDate) >= now && d.status !== 'completed')
      .forEach(d => {
        events.push({
          id: d.id,
          type: 'deliverable',
          title: d.name,
          date: new Date(d.dueDate!),
          assigneeId: d.assigneeId,
        });
      });
    
    calls
      .filter(c => c.scheduledAt && new Date(c.scheduledAt) >= now)
      .forEach(c => {
        events.push({
          id: c.id,
          type: 'call',
          title: c.title,
          date: new Date(c.scheduledAt!),
          assigneeId: c.assigneeId,
        });
      });
    
    events.sort((a, b) => a.date.getTime() - b.date.getTime());
    return events[0] || null;
  }, [client, getDeliverablesByClientId, getCallsByClientId]);

  // Listener pour la touche Échap
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        navigateBack();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigateBack]);

  if (!client) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-[var(--text-muted)]">Client non trouvé</p>
      </div>
    );
  }

  const isProspect = client.status === 'prospect';

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Barre contextuelle client */}
      <div className="flex-shrink-0 px-4 sm:px-6 py-4 border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)]/50">
        <div className="flex items-center gap-4">
          <button
            onClick={navigateBack}
            className="flex items-center gap-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors group"
          >
            <span className="group-hover:-translate-x-0.5 transition-transform">
              <ArrowLeft />
            </span>
            <span className="text-xs font-medium">Retour</span>
          </button>

          <h1 className="text-xl font-semibold text-[var(--text-primary)] truncate">
            {client.name}
          </h1>
          
          <span
            className={`
              flex-shrink-0 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider
              ${isProspect
                ? 'bg-[var(--accent-amber)]/20 text-[var(--accent-amber)]'
                : 'bg-[var(--accent-cyan)]/20 text-[var(--accent-cyan)]'
              }
            `}
          >
            {isProspect ? 'Prospect' : 'Client'}
          </span>
          
          <button
            type="button"
            onClick={() => openModal({ type: 'client', mode: 'edit', client })}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] transition-colors ml-auto"
            title="Modifier"
          >
            <Pencil />
          </button>
        </div>
      </div>

      {/* Contenu scrollable */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Colonne gauche - infos client */}
            <section className="lg:col-span-1 space-y-5">
              <ContactsSection clientId={client.id} />

              {/* Prochain événement */}
              <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-subtle)] overflow-hidden">
                <div className="px-4 py-3 border-b border-[var(--border-subtle)] flex items-center gap-2">
                  <CalendarIcon />
                  <h2 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                    Prochain événement
                  </h2>
                </div>
                {nextEvent ? (
                  <div 
                    className="p-4 cursor-pointer hover:bg-[var(--bg-secondary)] transition-colors"
                    onClick={() => {
                      if (nextEvent.type === 'deliverable') {
                        const d = getDeliverablesByClientId(client.id).find(x => x.id === nextEvent.id);
                        if (d) openDeliverableModal(client.id, d);
                      } else {
                        const c = getCallsByClientId(client.id).find(x => x.id === nextEvent.id);
                        if (c) openCallModal(client.id, c);
                      }
                    }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`p-1 rounded ${nextEvent.type === 'call' ? 'bg-[var(--accent-coral)]/20 text-[var(--accent-coral)]' : 'bg-[var(--accent-cyan)]/20 text-[var(--accent-cyan)]'}`}>
                        {nextEvent.type === 'call' ? <PhoneIcon /> : <PackageIcon />}
                      </span>
                      <span className={`text-[10px] font-bold uppercase ${isToday(nextEvent.date) ? 'text-[var(--accent-lime)]' : 'text-[var(--text-muted)]'}`}>
                        {isToday(nextEvent.date) ? "Aujourd'hui" : formatDateShort(nextEvent.date)}
                      </span>
                      <span className="text-[10px] text-[var(--text-muted)]">
                        {formatTime(nextEvent.date)}
                      </span>
                    </div>
                    <p className="font-medium text-[var(--text-primary)] text-sm truncate">
                      {nextEvent.title}
                    </p>
                    {nextEvent.assigneeId && (
                      <div className="mt-2">
                        {(() => {
                          const assignee = getTeamMemberById(nextEvent.assigneeId);
                          return assignee ? (
                            <span 
                              className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded"
                              style={{ backgroundColor: `${assignee.color}20`, color: assignee.color }}
                            >
                              {assignee.initials}
                            </span>
                          ) : null;
                        })()}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 text-center">
                    <p className="text-xs text-[var(--text-muted)] mb-3">Aucun événement prévu</p>
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={() => openDeliverableModal(client.id)}
                        className="text-[10px] px-2 py-1 rounded bg-[var(--accent-cyan)]/10 text-[var(--accent-cyan)] hover:bg-[var(--accent-cyan)]/20"
                      >
                        + Produit
                      </button>
                      <button
                        onClick={() => openCallModal(client.id, undefined, 'call')}
                        className="text-[10px] px-2 py-1 rounded bg-[var(--accent-coral)]/10 text-[var(--accent-coral)] hover:bg-[var(--accent-coral)]/20"
                      >
                        + Appel
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <LinksSection clientId={client.id} />
              <DocumentsSection clientId={client.id} />
            </section>

            {/* Colonne droite - produits (focus principal) */}
            <section className="lg:col-span-2">
              <DeliverablesSection clientId={client.id} />
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useMemo } from 'react';
import { useAppStore } from '@/lib/store';
import { useClient, useModal } from '@/hooks';
import { formatDateShort, formatTime, isPast, isToday } from '@/lib/date-utils';
import { getStatusStyle } from '@/lib/styles';
import type { Deliverable, Call } from '@/types';

const Activity = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
  </svg>
);

const Plus = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const Phone = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
);

const Check = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const Clock = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
);

interface ActivitySectionProps {
  clientId: string;
}

type ActivityItem = {
  id: string;
  type: 'deliverable' | 'call';
  title: string;
  date: Date;
  status?: 'pending' | 'in-progress' | 'completed';
  assigneeId?: string;
  duration?: number;
  originalDeliverable?: Deliverable;
  originalCall?: Call;
};

export function ActivitySection({ clientId }: ActivitySectionProps) {
  const {
    getDeliverablesByClientId,
    getCallsByClientId,
    getTeamMemberById,
    toggleDeliverableStatus,
  } = useAppStore();
  const client = useClient(clientId);
  const {
    openDeliverableModal,
    openCallModal,
  } = useModal();
  const deliverables = client ? getDeliverablesByClientId(client.id) : [];
  const calls = client ? getCallsByClientId(client.id) : [];

  const activityTimeline = useMemo(() => {
    const items: ActivityItem[] = [];

    deliverables.filter((d) => d.dueDate != null).forEach((d) => {
      items.push({
        id: d.id,
        type: 'deliverable',
        title: d.name,
        date: d.dueDate!,
        status: d.status,
        assigneeId: d.assigneeId,
        originalDeliverable: d,
      });
    });

    calls.filter((c) => c.scheduledAt != null).forEach((c) => {
      items.push({
        id: c.id,
        type: 'call',
        title: c.title,
        date: c.scheduledAt!,
        assigneeId: c.assigneeId,
        duration: c.duration,
        originalCall: c,
      });
    });

    return items.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [deliverables, calls]);

  if (!client) return null;

  return (
    <div className="bg-[var(--bg-card)] rounded-xl sm:rounded-2xl border border-[var(--border-subtle)] overflow-hidden">
      <div className="px-4 sm:px-5 py-4 border-b border-[var(--border-subtle)]">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2">
            <Activity />
            <h2 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider">
              Timeline
            </h2>
            <span className="text-xs text-[var(--text-muted)] bg-[var(--bg-tertiary)] px-2 py-0.5 rounded-full">
              {activityTimeline.length}
            </span>
          </div>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <button
              onClick={() => openDeliverableModal(clientId)}
              className="px-3 py-2 sm:py-1.5 rounded-lg bg-[var(--accent-cyan)]/10 text-[var(--accent-cyan)] hover:bg-[var(--accent-cyan)]/20 transition-colors text-xs font-semibold flex items-center gap-1.5 touch-manipulation min-h-[44px] sm:min-h-0"
              title="Livrable (logo, prez, site…)"
            >
              <Plus />
              Livrable
            </button>
            <button
              onClick={() => openCallModal(clientId, undefined, 'call')}
              className="px-3 py-2 sm:py-1.5 rounded-lg bg-[var(--accent-coral)]/10 text-[var(--accent-coral)] hover:bg-[var(--accent-coral)]/20 transition-colors text-xs font-semibold flex items-center gap-1.5 touch-manipulation min-h-[44px] sm:min-h-0"
              title="Appel téléphonique / visio"
            >
              <Plus />
              Appel
            </button>
            <button
              onClick={() => openCallModal(clientId, undefined, 'presentation')}
              className="px-3 py-2 sm:py-1.5 rounded-lg bg-[var(--accent-violet)]/10 text-[var(--accent-violet)] hover:bg-[var(--accent-violet)]/20 transition-colors text-xs font-semibold flex items-center gap-1.5 touch-manipulation min-h-[44px] sm:min-h-0"
              title="Présentation en physique"
            >
              <Plus />
              Présentation
            </button>
          </div>
        </div>
      </div>

      <div className="divide-y divide-[var(--border-subtle)]">
        {activityTimeline.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <p className="text-[var(--text-muted)] text-sm mb-4">Aucune activité</p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => openDeliverableModal(clientId)}
                className="px-4 py-2 rounded-lg bg-[var(--accent-cyan)]/10 text-[var(--accent-cyan)] hover:bg-[var(--accent-cyan)]/20 transition-colors text-sm font-medium"
              >
                + Livrable
              </button>
              <button
                onClick={() => openCallModal(clientId, undefined, 'call')}
                className="px-4 py-2 rounded-lg bg-[var(--accent-coral)]/10 text-[var(--accent-coral)] hover:bg-[var(--accent-coral)]/20 transition-colors text-sm font-medium"
              >
                + Appel
              </button>
              <button
                onClick={() => openCallModal(clientId, undefined, 'presentation')}
                className="px-4 py-2 rounded-lg bg-[var(--accent-violet)]/10 text-[var(--accent-violet)] hover:bg-[var(--accent-violet)]/20 transition-colors text-sm font-medium"
              >
                + Présentation
              </button>
            </div>
          </div>
        ) : (
          activityTimeline.map((item, index) => {
            const assignee = item.assigneeId ? getTeamMemberById(item.assigneeId) : null;
            const past = isPast(item.date) && !isToday(item.date);
            const today = isToday(item.date);
            const statusStyle = item.status ? getStatusStyle(item.status) : null;
            const isCall = item.type === 'call';

            const handleItemClick = () => {
              if (item.type === 'deliverable' && item.originalDeliverable) {
                openDeliverableModal(clientId, item.originalDeliverable);
              } else if (item.type === 'call' && item.originalCall) {
                openCallModal(clientId, item.originalCall);
              }
            };

            return (
              <div
                key={item.id}
                className={`px-4 sm:px-5 py-3 sm:py-4 transition-colors animate-fade-in-up flex items-center gap-3 sm:gap-4 cursor-pointer group ${
                  past ? 'opacity-50' : 'hover:bg-[var(--bg-secondary)]'
                } ${today ? 'bg-[var(--accent-lime)]/5' : ''}`}
                style={{ animationDelay: `${index * 0.03}s` }}
                onClick={handleItemClick}
              >
                <div className="flex-shrink-0 w-14 sm:w-20 text-right">
                  <p className={`text-xs font-medium ${today ? 'text-[var(--accent-lime)]' : 'text-[var(--text-muted)]'}`}>
                    {today ? "Aujourd'hui" : formatDateShort(item.date)}
                  </p>
                  <p className="text-[10px] text-[var(--text-muted)] font-mono">
                    {formatTime(item.date)}
                  </p>
                </div>

                <div className="flex flex-col items-center flex-shrink-0">
                  <div
                    className={`w-3 h-3 rounded-full flex-shrink-0 ${
                      isCall
                        ? 'bg-[var(--accent-coral)]'
                        : item.status === 'completed'
                          ? 'bg-[var(--accent-lime)]'
                          : item.status === 'in-progress'
                            ? 'bg-[var(--accent-violet)]'
                            : 'bg-[var(--accent-cyan)]'
                    } ${today ? 'animate-pulse-glow' : ''}`}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    {isCall && (
                      <span className="text-[var(--accent-coral)]">
                        <Phone />
                      </span>
                    )}
                    <p className="font-semibold text-[var(--text-primary)] truncate group-hover:text-[var(--accent-cyan)] transition-colors">
                      {item.title}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {isCall ? (
                      <span className="text-xs text-[var(--accent-coral)]">
                        {item.duration} min
                      </span>
                    ) : (
                      statusStyle && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleDeliverableStatus(item.id);
                          }}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${statusStyle.bg} ${statusStyle.text} hover:opacity-80 transition-opacity cursor-pointer`}
                          title="Cliquer pour changer le statut"
                        >
                          {item.status === 'completed' && <Check />}
                          {item.status === 'in-progress' && <Clock />}
                          {statusStyle.label}
                        </button>
                      )
                    )}
                  </div>
                </div>

                {assignee && (
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ring-2 ring-black/20 flex-shrink-0"
                    style={{ backgroundColor: assignee.color, color: '#000' }}
                    title={assignee.name}
                  >
                    {assignee.initials}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

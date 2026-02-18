'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAppStore } from '@/lib/store';
import type { ReportPlaudTemplate } from '@/types/document-templates';
import type { Call, Deliverable } from '@/types';

// Icons
const Calendar = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

const Phone = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
);

const Package = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16.5 9.4 7.55 4.24"/>
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
    <polyline points="3.29 7 12 12 20.71 7"/>
    <line x1="12" y1="22" x2="12" y2="12"/>
  </svg>
);

const Sparkle = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z"/>
  </svg>
);

const Check = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const UserPlus = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="8.5" cy="7" r="4"/>
    <line x1="20" y1="8" x2="20" y2="14"/>
    <line x1="23" y1="11" x2="17" y2="11"/>
  </svg>
);

function formatDateFr(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

function sameDay(a: Date | string | null | undefined, b: string): boolean {
  if (a == null) return false;
  const d1 = new Date(a);
  const d2 = new Date(b);
  return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
}

const EXCLUDED_INTERVENANT_NAMES = /christophe|yam|agence/i;
const LOOKS_LIKE_TEAM_OR_COMPANY = /\(.*\)|conseil|associes|agence\s|equipe/i;

interface ReportViewProps {
  data: ReportPlaudTemplate;
  clientId?: string;
  onAddDeliverable?: (d: Omit<Deliverable, 'id' | 'createdAt'>) => void;
  onSuggestContact?: (name: string) => void;
  onAddCall?: (call: Omit<Call, 'id' | 'createdAt'>) => void;
  onEventAdded?: (eventKey: string) => void;
  onBackfillAddedEventKeys?: (keys: string[]) => void;
}

export function ReportView({
  data,
  clientId,
  onAddDeliverable,
  onSuggestContact,
  onAddCall,
  onEventAdded,
  onBackfillAddedEventKeys,
}: ReportViewProps) {
  const [added, setAdded] = useState<Set<string>>(new Set());
  const [addedEvents, setAddedEvents] = useState<Set<string>>(new Set());

  const storeDeliverables = useAppStore((s) => s.deliverables);
  const storeCalls = useAppStore((s) => s.calls);
  const storeClients = useAppStore((s) => s.clients);

  const client = useMemo(
    () => (clientId ? storeClients.find((c) => c.id === clientId) ?? null : null),
    [clientId, storeClients]
  );
  const deliverables = useMemo(
    () => (clientId ? storeDeliverables.filter((d) => d.clientId === clientId) : []),
    [clientId, storeDeliverables]
  );
  const calls = useMemo(
    () => (clientId ? storeCalls.filter((c) => c.clientId === clientId) : []),
    [clientId, storeCalls]
  );
  const contacts = client?.contacts ?? [];

  const eventKey = (ev: { type: string; label: string; date: string }) => `${ev.type}-${ev.label}-${ev.date}`;
  const isEventInStore = (ev: { type: string; label: string; date: string }) =>
    ev.type === 'deliverable'
      ? deliverables.some((d) => d.name === ev.label && sameDay(d.dueDate, ev.date))
      : calls.some((c) => c.title === ev.label && sameDay(c.scheduledAt, ev.date));

  useEffect(() => {
    if (!data.suggestedEvents?.length || !clientId || !onBackfillAddedEventKeys) return;
    const keysToAdd = data.suggestedEvents
      .filter((ev) => isEventInStore(ev) && !data.addedEventKeys?.includes(eventKey(ev)))
      .map(eventKey);
    if (keysToAdd.length > 0) onBackfillAddedEventKeys(keysToAdd);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.suggestedEvents, data.addedEventKeys, clientId, deliverables, calls]);

  const suggestedIntervenants = (data.participants || [])
    .map((p) => p.trim())
    .filter(
      (name) =>
        name.length > 0 &&
        !EXCLUDED_INTERVENANT_NAMES.test(name) &&
        !LOOKS_LIKE_TEAM_OR_COMPANY.test(name)
    );

  const isDeliverableInStore = (name: string) => deliverables.some((d) => d.name === name);
  const isEventAdded = (ev: { type: string; label: string; date: string }) =>
    isEventInStore(ev) || (data.addedEventKeys != null && data.addedEventKeys.includes(eventKey(ev)));
  const isContactInStore = (name: string) => contacts.some((c) => c.name === name);

  const handleAdd = (name: string, type: 'creative' | 'document' | 'other') => {
    if (!onAddDeliverable || !clientId || added.has(name) || isDeliverableInStore(name)) return;
    onAddDeliverable({ clientId, name, type, status: 'to_quote', billingStatus: 'pending' });
    setAdded(prev => new Set(prev).add(name));
  };

  const handleAddEvent = (ev: { type: 'deliverable' | 'call'; label: string; date: string }) => {
    if (!clientId || addedEvents.has(eventKey(ev)) || isEventAdded(ev)) return;
    const dateStr = ev.date.includes('T') ? ev.date : `${ev.date}T12:00:00`;
    const d = new Date(dateStr);
    if (ev.type === 'deliverable' && onAddDeliverable) {
      onAddDeliverable({ clientId, name: ev.label, dueDate: d, inBacklog: false, type: 'other', status: 'to_quote', billingStatus: 'pending' });
    } else if (ev.type === 'call' && onAddCall) {
      onAddCall({ clientId, title: ev.label, scheduledAt: d, duration: 30, notes: '' });
    }
    setAddedEvents(prev => new Set(prev).add(eventKey(ev)));
    onEventAdded?.(eventKey(ev));
  };

  const hasRightColumn = (data.suggestedEvents?.length ?? 0) > 0 || (data.suggestedDeliverables?.length ?? 0) > 0 || suggestedIntervenants.length > 0;

  return (
    <div className={`grid gap-8 ${hasRightColumn ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1 max-w-xl'}`}>
      {/* COLONNE GAUCHE : Synthese */}
      <div className="space-y-5">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-5 rounded-full bg-[var(--accent-amber)]" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">Synthese</h3>
        </div>

        <div className="p-5 rounded-2xl bg-[var(--bg-secondary)]/50 border border-[var(--border-subtle)] space-y-4">
          {/* Date + duree */}
          <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-[var(--bg-tertiary)]">
              <Calendar />
              {formatDateFr(data.date)}
            </span>
            {data.duration != null && <span>{data.duration} min</span>}
            {data.participants?.length ? <span className="truncate">{data.participants.join(', ')}</span> : null}
          </div>

          {/* Resume */}
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{data.summary}</p>

          {/* Points cles */}
          {data.keyPoints.length > 0 && (
            <div className="pt-3 border-t border-[var(--border-subtle)] space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Points cles</p>
              <ul className="space-y-1.5">
                {data.keyPoints.slice(0, 6).map((p, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                    <span className="mt-1.5 text-[var(--accent-amber)]"><Sparkle /></span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Actions */}
          {data.actionItems?.length > 0 && (
            <div className="pt-3 border-t border-[var(--border-subtle)] space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Actions</p>
              <ul className="space-y-1.5">
                {data.actionItems.map((a, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                    <span className="mt-0.5 text-[var(--accent-lime)]">-</span>
                    <span>{a.text}</span>
                    {a.assignee && <span className="text-[var(--text-muted)]">- {a.assignee}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Prochaines etapes */}
          {data.nextSteps && (
            <div className="pt-3 border-t border-[var(--border-subtle)]">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2">Prochaines etapes</p>
              <p className="text-sm text-[var(--text-secondary)]">{data.nextSteps}</p>
            </div>
          )}
        </div>
      </div>

      {/* COLONNE DROITE : A ajouter */}
      {hasRightColumn && (
        <div className="space-y-5">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-5 rounded-full bg-[var(--accent-lime)]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">A ajouter</h3>
          </div>

          {/* Evenements */}
          {data.suggestedEvents && data.suggestedEvents.length > 0 && (
            <div className="space-y-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                <Calendar />
                Evenements timeline
              </p>
              <ul className="space-y-2">
                {data.suggestedEvents.map((ev, i) => {
                  const key = eventKey(ev);
                  const isAdded = addedEvents.has(key) || isEventAdded(ev);
                  const isCall = ev.type === 'call';
                  return (
                    <li
                      key={i}
                      className={`flex items-center gap-3 py-2.5 px-3 rounded-xl border transition-colors ${
                        isAdded
                          ? 'bg-[var(--accent-lime)]/5 border-[var(--accent-lime)]/30'
                          : 'bg-[var(--bg-tertiary)]/60 border-[var(--border-subtle)] hover:border-[var(--accent-lime)]/40'
                      }`}
                    >
                      <span className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center ${
                        isCall ? 'bg-[var(--accent-cyan)]/15 text-[var(--accent-cyan)]' : 'bg-[var(--accent-violet)]/15 text-[var(--accent-violet)]'
                      }`}>
                        {isCall ? <Phone /> : <Package />}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--text-primary)] truncate">{ev.label}</p>
                        <p className="text-[10px] text-[var(--text-muted)]">{formatDateFr(ev.date)}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAddEvent(ev)}
                        disabled={isAdded || !clientId}
                        className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                          isAdded
                            ? 'bg-[var(--accent-lime)]/20 text-[var(--accent-lime)] cursor-default'
                            : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--accent-lime)]/20 hover:text-[var(--accent-lime)]'
                        }`}
                      >
                        {isAdded ? <Check /> : 'Ajouter'}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Livrables */}
          {data.suggestedDeliverables && data.suggestedDeliverables.length > 0 && (
            <div className="space-y-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                <Package />
                Livrables (backlog)
              </p>
              <ul className="space-y-2">
                {data.suggestedDeliverables.map((s, i) => {
                  const isAdded = added.has(s.name) || isDeliverableInStore(s.name);
                  return (
                    <li
                      key={i}
                      className={`flex items-center gap-3 py-2.5 px-3 rounded-xl border transition-colors ${
                        isAdded
                          ? 'bg-[var(--accent-lime)]/5 border-[var(--accent-lime)]/30'
                          : 'bg-[var(--bg-tertiary)]/60 border-[var(--border-subtle)] hover:border-[var(--accent-lime)]/40'
                      }`}
                    >
                      <span className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center bg-[var(--accent-amber)]/15 text-[var(--accent-amber)]">
                        <Package />
                      </span>
                      <p className="flex-1 min-w-0 text-sm font-medium text-[var(--text-primary)] truncate">{s.name}</p>
                      <button
                        type="button"
                        onClick={() => handleAdd(s.name, s.type)}
                        disabled={isAdded || !clientId}
                        className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                          isAdded
                            ? 'bg-[var(--accent-lime)]/20 text-[var(--accent-lime)] cursor-default'
                            : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--accent-lime)]/20 hover:text-[var(--accent-lime)]'
                        }`}
                      >
                        {isAdded ? <Check /> : 'Ajouter'}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Contacts suggeres */}
          {suggestedIntervenants.length > 0 && (
            <div className="space-y-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                <UserPlus />
                Contacts suggeres
              </p>
              <ul className="space-y-2">
                {suggestedIntervenants.map((name, i) => {
                  const contactAdded = isContactInStore(name);
                  return (
                    <li
                      key={i}
                      className={`flex items-center gap-3 py-2.5 px-3 rounded-xl border transition-colors ${
                        contactAdded
                          ? 'bg-[var(--accent-cyan)]/5 border-[var(--accent-cyan)]/30'
                          : 'bg-[var(--bg-tertiary)]/60 border-[var(--border-subtle)] hover:border-[var(--accent-cyan)]/40'
                      }`}
                    >
                      <span className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center bg-[var(--accent-cyan)]/15 text-[var(--accent-cyan)]">
                        <UserPlus />
                      </span>
                      <p className="flex-1 min-w-0 text-sm font-medium text-[var(--text-primary)] truncate">{name}</p>
                      <button
                        type="button"
                        onClick={() => onSuggestContact?.(name)}
                        disabled={contactAdded || !clientId || !onSuggestContact}
                        className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                          contactAdded
                            ? 'bg-[var(--accent-cyan)]/20 text-[var(--accent-cyan)] cursor-default'
                            : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--accent-cyan)]/20 hover:text-[var(--accent-cyan)]'
                        }`}
                      >
                        {contactAdded ? <Check /> : 'Ajouter'}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

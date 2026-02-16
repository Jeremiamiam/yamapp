'use client';

import { useMemo, useState, useRef, useCallback, useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useAppStore } from '@/lib/store';
import { useFilteredTimeline, useIsMobile } from '@/hooks';
import type { Deliverable, Call, DayTodo } from '@/types';

interface EventDot {
  id: string;
  date: Date;
  type: 'deliverable' | 'call' | 'todo';
  clientName?: string;
  label: string;
  color: string;
  data: Deliverable | Call | DayTodo;
}

interface EventCluster {
  date: Date;
  dateKey: string;
  events: EventDot[];
  position: number; // position X sur la timeline
}

const TIMELINE_HEIGHT = 3; // Épaisseur de la ligne de base
const CLUSTER_SPACING = 200; // Espace entre les clusters (px)
const CARD_WIDTH = 180; // Largeur des mini-cards
const CARD_GAP = 8; // Espace vertical entre les cards
const VIEWPORT_PADDING = 40; // Padding gauche/droite
const SIDEBAR_WIDTH = 240; // Largeur de la sidebar gauche (DayTodoZone + Backlog)

// Couleurs par type
const EVENT_COLORS = {
  deliverable: 'rgb(132, 204, 22)', // lime
  call: 'rgb(6, 182, 212)', // cyan
  todo: 'rgb(251, 146, 60)', // orange
} as const;

export function HorizontalEventTimeline() {
  const isMobile = useIsMobile();
  const { filteredDeliverables, filteredCalls } = useFilteredTimeline();
  const { dayTodos, filters, getClientById, getTeamMemberById, navigateToClient } = useAppStore(
    useShallow((s) => ({
      dayTodos: s.dayTodos,
      filters: s.filters,
      getClientById: s.getClientById,
      getTeamMemberById: s.getTeamMemberById,
      navigateToClient: s.navigateToClient,
    }))
  );

  const [hoveredEvent, setHoveredEvent] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  // Measure container width
  useEffect(() => {
    const updateWidth = () => {
      if (scrollContainerRef.current) {
        setContainerWidth(scrollContainerRef.current.clientWidth);
      }
    };
    updateWidth();
    const resizeObserver = new ResizeObserver(updateWidth);
    if (scrollContainerRef.current) {
      resizeObserver.observe(scrollContainerRef.current);
    }
    return () => resizeObserver.disconnect();
  }, []);

  // Filter scheduled todos (same logic as main timeline)
  const scheduledTodos = useMemo(
    () => dayTodos.filter(t => {
      if (t.done || !t.scheduledAt) return false;
      if (filters.teamMemberId && t.assigneeId !== filters.teamMemberId) return false;
      return true;
    }),
    [dayTodos, filters.teamMemberId]
  );

  // Build event dots
  const eventDots = useMemo(() => {
    const dots: EventDot[] = [];

    // Deliverables
    filteredDeliverables.forEach(d => {
      if (!d.dueDate) return;
      const client = d.clientId ? getClientById(d.clientId) : null;
      dots.push({
        id: `deliv-${d.id}`,
        date: d.dueDate,
        type: 'deliverable',
        clientName: client?.name,
        label: d.name,
        color: EVENT_COLORS.deliverable,
        data: d,
      });
    });

    // Calls
    filteredCalls.forEach(c => {
      if (!c.scheduledAt) return;
      const client = c.clientId ? getClientById(c.clientId) : null;
      dots.push({
        id: `call-${c.id}`,
        date: c.scheduledAt,
        type: 'call',
        clientName: client?.name,
        label: c.title,
        color: EVENT_COLORS.call,
        data: c,
      });
    });

    // Todos
    scheduledTodos.forEach(t => {
      if (!t.scheduledAt) return;
      dots.push({
        id: `todo-${t.id}`,
        date: t.scheduledAt,
        type: 'todo',
        label: t.text,
        color: EVENT_COLORS.todo,
        data: t,
      });
    });

    return dots.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [filteredDeliverables, filteredCalls, scheduledTodos, getClientById]);

  // Group events by day into clusters
  const clusters = useMemo(() => {
    const clusterMap = new Map<string, EventDot[]>();

    eventDots.forEach(dot => {
      const dateKey = dot.date.toDateString();
      if (!clusterMap.has(dateKey)) {
        clusterMap.set(dateKey, []);
      }
      clusterMap.get(dateKey)!.push(dot);
    });

    // Convert to array and calculate positions
    const clusterArray: EventCluster[] = [];
    let position = VIEWPORT_PADDING;

    Array.from(clusterMap.entries())
      .sort(([keyA], [keyB]) => new Date(keyA).getTime() - new Date(keyB).getTime())
      .forEach(([dateKey, events]) => {
        const date = new Date(dateKey);
        clusterArray.push({
          date,
          dateKey,
          events,
          position,
        });
        position += CLUSTER_SPACING;
      });

    return clusterArray;
  }, [eventDots]);

  const totalWidth = clusters.length > 0
    ? clusters[clusters.length - 1].position + VIEWPORT_PADDING
    : Math.max(containerWidth, 1000); // Minimum width for empty state

  const handleEventClick = useCallback((dot: EventDot) => {
    if (dot.type === 'deliverable' || dot.type === 'call') {
      const clientId = (dot.data as Deliverable | Call).clientId;
      if (clientId) {
        navigateToClient(clientId);
      }
    }
  }, [navigateToClient]);

  const formatDate = (date: Date) => {
    const day = date.getDate();
    const month = date.toLocaleDateString('fr-FR', { month: 'short' });
    return `${day} ${month}`;
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // Scroll to today on mount
  useEffect(() => {
    if (scrollContainerRef.current && clusters.length > 0) {
      const todayCluster = clusters.find(c => isToday(c.date));
      if (todayCluster) {
        const scrollTo = todayCluster.position - containerWidth / 2;
        scrollContainerRef.current.scrollLeft = Math.max(0, scrollTo);
      }
    }
  }, [clusters, containerWidth]);

  return (
    <div className="w-full h-full flex flex-col bg-[var(--bg-primary)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)]">
        <div>
          <h2 className="text-lg font-bold text-[var(--text-primary)]">Event Horizon</h2>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            {clusters.length} période{clusters.length > 1 ? 's' : ''} • {eventDots.length} événement{eventDots.length > 1 ? 's' : ''}
          </p>
        </div>

        {/* Legend */}
        <div className="flex gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: EVENT_COLORS.deliverable }} />
            <span className="text-[var(--text-muted)]">Produits</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: EVENT_COLORS.call }} />
            <span className="text-[var(--text-muted)]">Appels</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: EVENT_COLORS.todo }} />
            <span className="text-[var(--text-muted)]">Todos</span>
          </div>
        </div>
      </div>

      {/* Timeline Container */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-x-auto overflow-y-hidden relative"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: 'var(--border-subtle) transparent',
        }}
      >
        <div
          className="relative h-full"
          style={{ width: totalWidth, minWidth: '100%' }}
        >
          {/* Main timeline line - positioned at bottom with padding */}
          <div
            className="absolute left-0 right-0 bg-[var(--border-subtle)]"
            style={{
              height: TIMELINE_HEIGHT,
              bottom: 100, // Distance du bas
              borderRadius: TIMELINE_HEIGHT / 2,
            }}
          />

          {/* Clusters */}
          {clusters.map((cluster) => {
            const today = isToday(cluster.date);

            return (
              <div
                key={cluster.dateKey}
                className="absolute"
                style={{
                  left: cluster.position,
                  bottom: 80,
                  width: CARD_WIDTH,
                  height: '100%',
                  transform: 'translateX(-50%)',
                }}
              >
                {/* Date label + indicator on timeline */}
                <div
                  className="absolute left-1/2 -translate-x-1/2 text-center"
                  style={{ bottom: 20 }}
                >
                  {/* Dot indicator on timeline */}
                  <div
                    className="absolute left-1/2 -translate-x-1/2 w-3 h-3 rounded-full transition-all"
                    style={{
                      bottom: -26,
                      backgroundColor: today ? 'var(--accent-lime)' : cluster.events[0]?.color,
                      boxShadow: today
                        ? '0 0 12px var(--accent-lime)'
                        : `0 0 8px ${cluster.events[0]?.color}60`,
                    }}
                  />

                  <div className={`text-xs font-medium whitespace-nowrap ${
                    today
                      ? 'text-[var(--accent-lime)] font-bold'
                      : 'text-[var(--text-muted)]'
                  }`}>
                    {formatDate(cluster.date)}
                  </div>
                  {today && (
                    <div className="text-[10px] text-[var(--accent-lime)] uppercase tracking-wider mt-0.5">
                      Aujourd'hui
                    </div>
                  )}
                </div>

                {/* Event cards stacked vertically */}
                <div
                  className="absolute left-0 right-0 flex flex-col-reverse gap-2"
                  style={{ bottom: 60 }}
                >
                  {cluster.events.map((event) => {
                    const isHovered = hoveredEvent === event.id;

                    return (
                      <div
                        key={event.id}
                        className="relative cursor-pointer transition-all duration-200"
                        onMouseEnter={() => setHoveredEvent(event.id)}
                        onMouseLeave={() => setHoveredEvent(null)}
                        onClick={() => handleEventClick(event)}
                        style={{
                          transform: isHovered ? 'scale(1.02) translateY(-2px)' : 'scale(1)',
                        }}
                      >
                        {/* Mini card */}
                        <div
                          className="rounded-lg p-2.5 border backdrop-blur-sm transition-all"
                          style={{
                            backgroundColor: isHovered
                              ? 'rgba(30, 30, 30, 0.95)'
                              : 'rgba(30, 30, 30, 0.85)',
                            borderColor: isHovered ? event.color : 'var(--border-subtle)',
                            borderLeftWidth: 3,
                            borderLeftColor: event.color,
                            boxShadow: isHovered
                              ? `0 4px 20px ${event.color}40, inset 0 0 0 1px ${event.color}20`
                              : '0 2px 8px rgba(0, 0, 0, 0.3)',
                          }}
                        >
                          {/* Client name first (most important) */}
                          {event.clientName ? (
                            <div className="text-xs font-bold text-[var(--text-primary)] truncate mb-1.5">
                              {event.clientName}
                            </div>
                          ) : (
                            <div className="text-xs font-bold text-[var(--text-muted)] truncate mb-1.5">
                              Sans client
                            </div>
                          )}

                          {/* Event label */}
                          <div className="text-[11px] text-[var(--text-secondary)] truncate mb-2">
                            {event.label}
                          </div>

                          {/* Type badge + time */}
                          <div className="flex items-center justify-between gap-2">
                            <span
                              className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                              style={{
                                backgroundColor: `${event.color}20`,
                                color: event.color,
                              }}
                            >
                              {event.type === 'deliverable' ? 'Produit' : event.type === 'call' ? 'Appel' : 'Todo'}
                            </span>
                            <span className="text-[10px] text-[var(--text-muted)] font-mono">
                              {event.date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Empty state */}
          {clusters.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl mb-4 opacity-20">📅</div>
                <div className="text-[var(--text-muted)] text-sm">
                  Aucun événement planifié
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

'use client';

import { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useAppStore } from '@/lib/store';
import { formatHeaderDate } from '@/lib/date-utils';
import { useFilteredTimeline, useModal, useIsMobile } from '@/hooks';
import { TimelineCard, TimelineCardItem } from './TimelineCard';
import { BACKLOG_DRAG_TYPE } from './BacklogSidebar';
import { DayTodoZone, TODO_DRAG_TYPE } from './DayTodoZone';
import { DayTodoDrawer } from './DayTodoDrawer';

// Timeline dimensions
const HEADER_HEIGHT = 56;
const MONTH_ROW_HEIGHT = 38; // Bande mois au-dessus des jours (scroll X)
const TOTAL_HEADER_HEIGHT = MONTH_ROW_HEIGHT + HEADER_HEIGHT;
const TODO_COLUMN_WIDTH = 240; // Colonne todo (sticky left)
const HOURS_COLUMN_WIDTH = 64; // Colonne horaires (toggle 1 sem. / 2 sem. dans le footer)
const MIN_HOUR_HEIGHT = 48;
const DEFAULT_HOUR_HEIGHT = 96;
const START_HOUR = 8;
const END_HOUR = 19; // Grille jusqu'à 20h (créneau 19h–20h visible)
const LUNCH_START_HOUR = 12; // Bande visuelle 12h (séparation matin / PM)
const WEEKEND_RATIO = 0.12;
const GRID_PADDING_TOP = 12; // Espace au-dessus de la ligne 8h
/** Espace en bas de la grille pour que les cartes 19h ne touchent pas le bord du navigateur (pas de scroll vertical) */
const BOTTOM_SPACER = 80;
/** Largeur réservée à droite pour la carte backlog (w-72 + marges) — 5 jours ouvrés doivent tenir dans la zone visible à gauche */
const BACKLOG_OVERLAY_WIDTH = 240;

/** Snap minutes to 0 or 30 */
function snapTo30Min(date: Date): Date {
  const d = new Date(date);
  const m = d.getMinutes();
  const snapped = Math.round(m / 30) * 30;
  d.setMinutes(snapped, 0, 0);
  return d;
}

type TimelineProps = { className?: string };

const TODO_FAB_ICON = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
    <path d="M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2v0z" />
    <line x1="9" y1="12" x2="15" y2="12" />
    <line x1="9" y1="16" x2="15" y2="16" />
  </svg>
);

export function Timeline({ className }: TimelineProps) {
  const isMobile = useIsMobile();
  const [dayTodoDrawerOpen, setDayTodoDrawerOpen] = useState(false);
  const { filteredDeliverables, filteredCalls } = useFilteredTimeline();
  const { timelineRange, navigateToClient, getClientById, getTeamMemberById, updateDeliverable, updateCall, dayTodos, updateDayTodo, filters } = useAppStore(
    useShallow((s) => ({
      timelineRange: s.timelineRange,
      navigateToClient: s.navigateToClient,
      getClientById: s.getClientById,
      getTeamMemberById: s.getTeamMemberById,
      updateDeliverable: s.updateDeliverable,
      updateCall: s.updateCall,
      dayTodos: s.dayTodos,
      updateDayTodo: s.updateDayTodo,
      filters: s.filters,
    }))
  );
  const scheduledTodos = useMemo(
    () => dayTodos.filter(t => {
      if (t.done || !t.scheduledAt) return false;
      // Apply team member filter if set
      if (filters.teamMemberId && t.assigneeId !== filters.teamMemberId) return false;
      return true;
    }),
    [dayTodos, filters.teamMemberId]
  );
  const { openDeliverableModal, openCallModal } = useModal();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const lastWidthRef = useRef(0);
  const lastHeightRef = useRef(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  type DragItem = TimelineCardItem & { hour?: number; minutes?: number };
  const [dragState, setDragState] = useState<{ item: DragItem; type: 'deliverable' | 'call' | 'todo'; x: number; y: number } | null>(null);
  const [backlogDragPos, setBacklogDragPos] = useState<{ x: number; y: number } | null>(null);
  const [lastDroppedId, setLastDroppedId] = useState<string | null>(null);
  const skipClickAfterDragRef = useRef<string | null>(null);

  const compactWeeks = useAppStore((s) => s.compactWeeks);

  const setJustLanded = useCallback((id: string) => {
    setLastDroppedId(id);
    const t = setTimeout(() => setLastDroppedId(null), 320);
    return () => clearTimeout(t);
  }, []);

  // Quand un drag backlog ou todo se termine (sans drop sur la timeline), retirer la ligne de repère
  useEffect(() => {
    const onDragEnd = () => setBacklogDragPos(null);
    window.addEventListener('backlog-drag-end', onDragEnd);
    window.addEventListener('todo-drag-end', onDragEnd);
    return () => {
      window.removeEventListener('backlog-drag-end', onDragEnd);
      window.removeEventListener('todo-drag-end', onDragEnd);
    };
  }, []);

  // Measure container width + height (hauteur utilisée pour caler 8h–19h sur toute la hauteur)
  useEffect(() => {
    const MIN_DELTA = 3;
    const updateSize = () => {
      if (!scrollContainerRef.current) return;
      const { clientWidth: w, clientHeight: h } = scrollContainerRef.current;
      if (Math.abs(w - lastWidthRef.current) >= MIN_DELTA || lastWidthRef.current === 0) {
        lastWidthRef.current = w;
        setContainerWidth(w);
      }
      if (Math.abs(h - lastHeightRef.current) >= MIN_DELTA || lastHeightRef.current === 0) {
        lastHeightRef.current = h;
        setContainerHeight(h);
      }
    };
    updateSize();
    const resizeObserver = new ResizeObserver(updateSize);
    if (scrollContainerRef.current) {
      resizeObserver.observe(scrollContainerRef.current);
    }
    return () => resizeObserver.disconnect();
  }, []);

  const hourHeight = useMemo(() => {
    if (containerHeight <= 0) return DEFAULT_HOUR_HEIGHT;
    const gridHeight = containerHeight - TOTAL_HEADER_HEIGHT - GRID_PADDING_TOP - BOTTOM_SPACER;
    const hoursCount = END_HOUR - START_HOUR + 1;
    const h = gridHeight / hoursCount;
    return Math.max(MIN_HOUR_HEIGHT, Math.floor(h));
  }, [containerHeight]);

  const effectiveTodoColumnWidth = isMobile ? 0 : TODO_COLUMN_WIDTH;
  const effectiveBacklogWidth = isMobile ? 0 : BACKLOG_OVERLAY_WIDTH;

  // Calculate day widths : 5 ou 10 jours ouvrés dans la zone visible selon compactWeeks (1 sem. vs 2 sem.)
  const dayWidths = useMemo(() => {
    if (containerWidth === 0) return { weekday: 160, weekend: 30 };
    const visibleWidth = Math.max(200, containerWidth - effectiveBacklogWidth - effectiveTodoColumnWidth - HOURS_COLUMN_WIDTH);
    const weekdayCount = compactWeeks ? 10 : 5;
    const totalUnits = weekdayCount + 2 * WEEKEND_RATIO;
    const unitWidth = visibleWidth / totalUnits;
    return {
      weekday: unitWidth,
      weekend: unitWidth * WEEKEND_RATIO,
    };
  }, [containerWidth, compactWeeks, effectiveTodoColumnWidth, effectiveBacklogWidth]);

  // Generate dates with widths
  const datesWithWidth = useMemo(() => {
    const result: Date[] = [];
    const current = new Date(timelineRange.start);
    while (current <= timelineRange.end) {
      result.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    let position = 0;
    return result.map(date => {
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      const width = isWeekend ? dayWidths.weekend : dayWidths.weekday;
      const item = { date, width, isWeekend, position };
      position += width;
      return item;
    });
  }, [timelineRange, dayWidths]);

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  /** From mouse position (viewport), compute drop date/time snapped to 30 min. Returns null if outside grid. */
  const getDropTarget = useCallback(
    (clientX: number, clientY: number): { date: Date; hour: number; minutes: number } | null => {
      const el = scrollContainerRef.current;
      if (!el || datesWithWidth.length === 0) return null;
      const rect = el.getBoundingClientRect();
      const contentX = clientX - rect.left + el.scrollLeft - effectiveTodoColumnWidth - HOURS_COLUMN_WIDTH;
      const contentY = clientY - rect.top + el.scrollTop;
      const timeY = contentY - TOTAL_HEADER_HEIGHT - GRID_PADDING_TOP;
      if (timeY < 0) return null;
      const totalMinutesFromStart = (timeY / hourHeight) * 60;
      const slot30 = Math.round(totalMinutesFromStart / 30) * 30;
      const maxMinutes = (END_HOUR - START_HOUR) * 60;
      const clampedSlot = Math.max(0, Math.min(maxMinutes, slot30));
      const hour = START_HOUR + Math.floor(clampedSlot / 60);
      const minutes = clampedSlot % 60;
      let position = 0;
      for (let i = 0; i < datesWithWidth.length; i++) {
        const w = datesWithWidth[i].width;
        if (contentX >= position && contentX < position + w && !datesWithWidth[i].isWeekend) {
          const d = new Date(datesWithWidth[i].date);
          d.setHours(hour, minutes, 0, 0);
          return { date: d, hour, minutes };
        }
        position += w;
      }
      return null;
    },
    [datesWithWidth, hourHeight, effectiveTodoColumnWidth]
  );

  const handleCardMove = useCallback(
    (itemId: string, type: 'deliverable' | 'call' | 'todo', newDate: Date) => {
      setDragState(null);
      setJustLanded(itemId);
      const snapped = snapTo30Min(newDate);
      if (type === 'deliverable') {
        updateDeliverable(itemId, { dueDate: snapped });
      } else if (type === 'call') {
        updateCall(itemId, { scheduledAt: snapped });
      } else if (type === 'todo') {
        updateDayTodo(itemId, { scheduledAt: snapped });
      }
    },
    [updateDeliverable, updateCall, updateDayTodo, setJustLanded]
  );

  /** Viewport Y (px) of the drop slot line — alignée sur le DÉBUT du créneau (comme la colonne des heures). */
  const getDropSlotViewportY = useCallback(
    (clientX: number, clientY: number): number | null => {
      const target = getDropTarget(clientX, clientY);
      if (!target) return null;
      const el = scrollContainerRef.current;
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      const slotTop =
        TOTAL_HEADER_HEIGHT + GRID_PADDING_TOP + ((target.hour - START_HOUR) * 60 + target.minutes) / 60 * hourHeight;
      return rect.top + (slotTop - el.scrollTop);
    },
    [getDropTarget, hourHeight]
  );

  const onDragStart = useCallback((item: DragItem, type: 'deliverable' | 'call' | 'todo', x: number, y: number) => {
    setDragState({ item, type, x, y });
  }, []);
  const onDragMove = useCallback((x: number, y: number) => {
    setDragState((prev) => (prev ? { ...prev, x, y } : null));
  }, []);
  const onDragEnd = useCallback(() => {
    setDragState(null);
  }, []);

  /** Drop d’un item backlog : même logique que les cartes (getDropTarget + snap 30 min) */
  const handleBacklogDrop = useCallback(
    (e: React.DragEvent, fallbackDayDate: Date) => {
      const raw = e.dataTransfer.getData(BACKLOG_DRAG_TYPE);
      if (!raw) return;
      e.preventDefault();
      setBacklogDragPos(null);
      let payload: { type: 'deliverable' | 'call'; id: string };
      try {
        payload = JSON.parse(raw);
      } catch {
        return;
      }
      const target = getDropTarget(e.clientX, e.clientY);
      const dateToUse = target
        ? snapTo30Min(target.date)
        : (() => {
            const d = new Date(fallbackDayDate);
            d.setHours(10, 0, 0, 0);
            return d;
          })();
      setJustLanded(payload.id);
      if (payload.type === 'deliverable') {
        updateDeliverable(payload.id, { dueDate: dateToUse });
      } else {
        updateCall(payload.id, { scheduledAt: dateToUse });
      }
    },
    [getDropTarget, updateDeliverable, updateCall, setJustLanded]
  );

  /** Drop d'une todo : planifier dans la timeline */
  const handleTodoDrop = useCallback(
    (e: React.DragEvent, fallbackDayDate: Date) => {
      const raw = e.dataTransfer.getData(TODO_DRAG_TYPE);
      if (!raw) return;
      e.preventDefault();
      setBacklogDragPos(null);
      let payload: { type: 'todo'; id: string };
      try {
        payload = JSON.parse(raw);
      } catch {
        return;
      }
      const target = getDropTarget(e.clientX, e.clientY);
      const dateToUse = target
        ? snapTo30Min(target.date)
        : (() => {
            const d = new Date(fallbackDayDate);
            d.setHours(10, 0, 0, 0);
            return d;
          })();
      updateDayTodo(payload.id, { scheduledAt: dateToUse });
    },
    [getDropTarget, updateDayTodo]
  );

  // Scroll to today
  useEffect(() => {
    if (scrollContainerRef.current && datesWithWidth.length > 0) {
      const todayIndex = datesWithWidth.findIndex(d => isToday(d.date));
      if (todayIndex > 0) {
        const scrollTo = datesWithWidth[todayIndex].position - dayWidths.weekday * 0.5;
        scrollContainerRef.current.scrollLeft = Math.max(0, scrollTo);
      }
    }
  }, [datesWithWidth, dayWidths]);

  // Group items by date (using filtered data)
  const itemsByDate = useMemo(() => {
    const map = new Map<string, (TimelineCardItem & { hour: number; minutes: number })[]>();

    filteredDeliverables.forEach(d => {
      if (d.dueDate == null) return; // backlog: pas sur la timeline
      const dateKey = d.dueDate.toDateString();
      const client = d.clientId ? getClientById(d.clientId) : null;
      
      const hour = d.dueDate.getHours();
      const minutes = d.dueDate.getMinutes();
      const assignee = d.assigneeId ? getTeamMemberById(d.assigneeId) : undefined;
      
      if (!map.has(dateKey)) map.set(dateKey, []);
      map.get(dateKey)!.push({
        id: d.id,
        type: 'deliverable',
        clientId: d.clientId ?? '',
        clientName: client?.name ?? 'Sans client',
        clientStatus: client?.status ?? 'prospect',
        label: d.name,
        time: `${hour}h${minutes > 0 ? minutes.toString().padStart(2, '0') : ''}`,
        hour,
        minutes,
        status: d.status,
        assignee,
        deliverableType: d.type,
      });
    });

    filteredCalls.forEach(c => {
      if (c.scheduledAt == null) return; // backlog: pas sur la timeline
      const dateKey = c.scheduledAt.toDateString();
      const client = c.clientId ? getClientById(c.clientId) : null;

      const hour = c.scheduledAt.getHours();
      const minutes = c.scheduledAt.getMinutes();
      const assignee = c.assigneeId ? getTeamMemberById(c.assigneeId) : undefined;

      if (!map.has(dateKey)) map.set(dateKey, []);
      map.get(dateKey)!.push({
        id: c.id,
        type: 'call',
        clientId: c.clientId ?? '',
        clientName: client?.name ?? 'Sans client',
        clientStatus: client?.status ?? 'prospect',
        label: c.title,
        time: `${hour}h${minutes > 0 ? minutes.toString().padStart(2, '0') : ''}`,
        hour,
        minutes,
        assignee,
        isPresentation: c.callType === 'presentation',
      });
    });

    // Add scheduled todos
    scheduledTodos.forEach(t => {
      if (!t.scheduledAt) return;
      const dateKey = t.scheduledAt.toDateString();
      const hour = t.scheduledAt.getHours();
      const minutes = t.scheduledAt.getMinutes();
      const assignee = t.assigneeId ? getTeamMemberById(t.assigneeId) : undefined;

      if (!map.has(dateKey)) map.set(dateKey, []);
      map.get(dateKey)!.push({
        id: t.id,
        type: 'todo',
        clientId: '',
        clientName: '',
        clientStatus: 'prospect',
        label: t.text,
        time: `${hour}h${minutes > 0 ? minutes.toString().padStart(2, '0') : ''}`,
        hour,
        minutes,
        assignee,
      } as TimelineCardItem & { hour: number; minutes: number });
    });

    map.forEach(items => {
      items.sort((a, b) => (a.hour * 60 + a.minutes) - (b.hour * 60 + b.minutes));
    });

    return map;
  }, [filteredDeliverables, filteredCalls, scheduledTodos, getClientById, getTeamMemberById]);

  const hours = useMemo(() => {
    const result: number[] = [];
    for (let h = START_HOUR; h <= END_HOUR; h++) {
      result.push(h);
    }
    return result;
  }, []);

  const totalHeight = (END_HOUR - START_HOUR + 1) * hourHeight;
  const totalWidth = datesWithWidth.reduce((sum, d) => sum + d.width, 0);

  /** Bandes mois pour le header (scroll X) : un bloc par mois avec largeur cumulée */
  const monthRanges = useMemo(() => {
    const map = new Map<string, { label: string; width: number; key: string }>();
    for (const d of datesWithWidth) {
      const key = `${d.date.getFullYear()}-${d.date.getMonth()}`;
      const existing = map.get(key);
      const w = existing ? existing.width + d.width : d.width;
      const label = d.date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
      map.set(key, { label: existing?.label ?? label, width: w, key });
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, v]) => v);
  }, [datesWithWidth]);

  const todayDate = useMemo(() => new Date(), []);
  const currentMonthKey = `${todayDate.getFullYear()}-${todayDate.getMonth()}`;

  const formatDay = (date: Date) => {
    const days = ['DIM', 'LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM'];
    return days[date.getDay()];
  };

  return (
    <div className={['flex flex-col overflow-hidden h-full w-full', className].filter(Boolean).join(' ')}>
      {/* Timeline Content */}
      <div className="flex-1 flex overflow-hidden relative z-10">
        {/* Scrollable timeline : horaires + colonnes jours scrollent ensemble en Y ; en X la colonne horaires reste fixe (sticky) */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-x-auto overflow-y-hidden timeline-scroll"
          style={{ transform: 'translateZ(0)' }}
        >
          <div className="flex flex-row min-h-0" style={{ width: totalWidth + HOURS_COLUMN_WIDTH + effectiveTodoColumnWidth, transform: 'translateZ(0)' }}>
            {/* Colonne todo : desktop only ; sur mobile → drawer */}
            {!isMobile && (
              <div
                className="flex flex-col flex-shrink-0 border-r-2 border-[var(--border-subtle)] bg-[var(--bg-primary)] sticky left-0 z-30 overflow-y-auto"
                style={{ width: TODO_COLUMN_WIDTH, height: TOTAL_HEADER_HEIGHT + totalHeight + GRID_PADDING_TOP + BOTTOM_SPACER }}
              >
                <div className="flex-1 min-h-0">
                  <DayTodoZone />
                </div>
                <div aria-hidden className="flex-shrink-0 bg-[var(--bg-primary)]" style={{ height: BOTTOM_SPACER }} />
              </div>
            )}

            {/* Colonne horaires : sticky après la colonne todo (ou à gauche sur mobile) ; spacer en bas */}
            <div
              className="flex-shrink-0 border-r border-[var(--border-subtle)] bg-[var(--bg-primary)]/95 backdrop-blur-sm sticky z-20 flex flex-col"
              style={{ width: HOURS_COLUMN_WIDTH, left: effectiveTodoColumnWidth, height: TOTAL_HEADER_HEIGHT + totalHeight + GRID_PADDING_TOP + BOTTOM_SPACER }}
            >
              <div style={{ height: MONTH_ROW_HEIGHT }} className="border-b border-[var(--border-subtle)] flex-shrink-0" />
              <div style={{ height: HEADER_HEIGHT }} className="border-b border-[var(--border-subtle)] flex-shrink-0" />
              <div className="relative flex-shrink-0" style={{ height: totalHeight + GRID_PADDING_TOP }}>
                {/* Bande 12h–14h : pause déjeuner */}
                {LUNCH_START_HOUR >= START_HOUR && LUNCH_START_HOUR + 1 < END_HOUR && (
                  <div
                    className="absolute left-0 right-0 border-y-2 border-[var(--accent-lime)]/20 bg-[var(--accent-lime)]/5 pointer-events-none"
                    style={{
                      top: GRID_PADDING_TOP + (LUNCH_START_HOUR - START_HOUR) * hourHeight,
                      height: hourHeight * 2,
                      boxShadow: 'inset 0 0 20px rgba(132, 204, 22, 0.08)'
                    }}
                  />
                )}
                {hours.map((hour, i) => (
                  <div
                    key={hour}
                    className="absolute left-0 right-0 text-xs text-[var(--text-muted)] font-mono text-right pr-3 flex items-center justify-end"
                    style={{
                      top: GRID_PADDING_TOP + i * hourHeight - 10,
                      height: 20
                    }}
                  >
                    {hour.toString().padStart(2, '0')} h
                  </div>
                ))}
              </div>
              <div aria-hidden className="flex-shrink-0 bg-[var(--bg-primary)]/95" style={{ height: BOTTOM_SPACER }} />
            </div>

            {/* Colonnes jours : bande mois + lignes des jours + spacer en bas */}
            <div className="flex flex-shrink-0 flex-col" style={{ width: totalWidth, minHeight: TOTAL_HEADER_HEIGHT + totalHeight + GRID_PADDING_TOP + BOTTOM_SPACER }}>
              {/* Bande mois — sticky au scroll Y, left pour ne pas passer derrière la colonne todo + horaires */}
              <div
                className="flex flex-shrink-0 sticky top-0 z-20 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]/95 backdrop-blur-sm shadow-sm"
                style={{ height: MONTH_ROW_HEIGHT, left: effectiveTodoColumnWidth + HOURS_COLUMN_WIDTH, width: totalWidth, minWidth: totalWidth }}
              >
                {monthRanges.map((m, i) => {
                  const isCurrentMonth = m.key === currentMonthKey;
                  return (
                    <div
                      key={i}
                      className="flex-shrink-0 border-r border-[var(--border-subtle)] last:border-r-0 bg-[var(--bg-secondary)]/40 relative"
                      style={{ width: m.width, minWidth: m.width }}
                    >
                      <div
                        className="sticky flex items-center gap-3 h-full pointer-events-none z-10"
                        style={{ left: effectiveTodoColumnWidth + HOURS_COLUMN_WIDTH, width: 'fit-content', maxWidth: m.width }}
                      >
                        <span className="text-xs font-semibold text-white tracking-wider px-3 py-1 bg-[var(--bg-primary)]/95 backdrop-blur-sm rounded-full border border-[var(--border-subtle)] shadow-lg uppercase shrink-0">
                          {m.label.toUpperCase()}
                        </span>
                        {isCurrentMonth && (
                          <span className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-wider">
                            {formatHeaderDate(todayDate)}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Ligne des jours (numéro + jour) */}
            <div className="flex flex-shrink-0" style={{ width: totalWidth }}>
            {datesWithWidth.map((d, index) => {
              const dateKey = d.date.toDateString();
              const items = itemsByDate.get(dateKey) || [];
              const today = isToday(d.date);
              const showMonth = d.date.getDate() === 1 || index === 0;
              const dropTarget = dragState ? getDropTarget(dragState.x, dragState.y) : null;
              const isDropColumn =
                    !!dragState && !d.isWeekend && dropTarget && dateKey === dropTarget.date.toDateString();
              const backlogTarget = backlogDragPos ? getDropTarget(backlogDragPos.x, backlogDragPos.y) : null;
              const isBacklogDropColumn =
                    !d.isWeekend && backlogTarget && dateKey === backlogTarget.date.toDateString();

              return (
                <div
                  key={d.date.toISOString()}
                  className={`flex-shrink-0 border-r border-[var(--border-subtle)] transition-colors duration-150 ${
                    d.isWeekend ? 'bg-[var(--bg-secondary)]/50' : ''
                  } ${isDropColumn || isBacklogDropColumn ? 'bg-[var(--accent-lime)]/10' : ''}`}
                  style={{ width: d.width }}
                  onDragOver={e => {
                    if (!d.isWeekend && (e.dataTransfer.types.includes(BACKLOG_DRAG_TYPE) || e.dataTransfer.types.includes(TODO_DRAG_TYPE))) {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'move';
                      setBacklogDragPos({ x: e.clientX, y: e.clientY });
                    }
                  }}
                  onDrop={e => {
                    if (!d.isWeekend) {
                      if (e.dataTransfer.types.includes(BACKLOG_DRAG_TYPE)) {
                        handleBacklogDrop(e, d.date);
                      } else if (e.dataTransfer.types.includes(TODO_DRAG_TYPE)) {
                        handleTodoDrop(e, d.date);
                      }
                    }
                  }}
                >
                  {/* Day header — sticky sous la bande mois, left pour ne pas passer derrière la colonne todo + horaires */}
                  <div 
                    className={`sticky z-10 flex flex-col items-center justify-center border-b border-[var(--border-subtle)] backdrop-blur-sm transition-colors duration-150 ${
                      isDropColumn || isBacklogDropColumn
                        ? 'bg-[var(--accent-lime)]/20'
                        : today 
                          ? 'bg-[var(--accent-lime-dim)]' 
                          : d.isWeekend 
                            ? 'bg-[var(--bg-tertiary)]/80' 
                            : 'bg-[var(--bg-secondary)]/80'
                    } ${d.date.getDate() === 1 ? 'border-l-2 border-l-[var(--accent-cyan)]/50' : ''}`}
                    style={{ height: HEADER_HEIGHT, top: MONTH_ROW_HEIGHT, left: effectiveTodoColumnWidth + HOURS_COLUMN_WIDTH + d.position, width: d.width, minWidth: d.width }}
                  >
                    {!d.isWeekend && (
                      <>
                        {showMonth && (
                          <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
                            {d.date.toLocaleDateString('fr-FR', { month: 'short' }).replace('.', '')}
                          </span>
                        )}
                        <span className={`text-lg font-bold ${
                          today 
                            ? 'text-[var(--bg-primary)] bg-[var(--accent-lime)] rounded-full w-8 h-8 flex items-center justify-center' 
                            : 'text-[var(--text-primary)]'
                        }`}>
                          {d.date.getDate()}
                        </span>
                        <span className={`text-[10px] font-semibold tracking-wider ${
                          today ? 'text-[var(--accent-lime)]' : 'text-[var(--text-muted)]'
                        }`}>
                          {formatDay(d.date)}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Day content — grille 8h–19h + spacer en bas (lignes prolongées) */}
                  <div className="relative" style={{ height: totalHeight + GRID_PADDING_TOP + BOTTOM_SPACER }}>
                    {/* Bande 12h–14h : pause déjeuner */}
                    {LUNCH_START_HOUR >= START_HOUR && LUNCH_START_HOUR + 1 < END_HOUR && !d.isWeekend && (
                      <div
                        className="absolute left-0 right-0 border-y-2 border-[var(--accent-lime)]/20 bg-[var(--accent-lime)]/5 pointer-events-none"
                        style={{
                          top: GRID_PADDING_TOP + (LUNCH_START_HOUR - START_HOUR) * hourHeight,
                          height: hourHeight * 2,
                          boxShadow: 'inset 0 0 20px rgba(132, 204, 22, 0.08)'
                        }}
                      />
                    )}
                    {/* Lignes horaires (8h → 19h) + ligne de fermeture sous 19h */}
                    {hours.map((hour, i) => (
                      <div
                        key={hour}
                        className="absolute left-0 right-0 border-t border-[var(--border-subtle)]"
                        style={{ top: GRID_PADDING_TOP + i * hourHeight }}
                      />
                    ))}
                    <div
                      className="absolute left-0 right-0 border-t border-[var(--border-subtle)]"
                      style={{ top: GRID_PADDING_TOP + totalHeight }}
                      aria-hidden
                    />

                    {/* Now line - only show if current time is within grid hours */}
                    {today && (() => {
                      const now = new Date();
                      const currentHour = now.getHours();
                      const isWithinGridHours = currentHour >= START_HOUR && currentHour <= END_HOUR;
                      if (!isWithinGridHours) return null;
                      return (
                        <div
                          className="absolute left-0 right-0 z-10 flex items-center"
                          style={{
                            top: GRID_PADDING_TOP + ((currentHour - START_HOUR) + now.getMinutes() / 60) * hourHeight
                          }}
                        >
                          <div className="w-2 h-2 rounded-full bg-[var(--accent-coral)] animate-pulse-glow" />
                          <div className="flex-1 h-[2px] bg-[var(--accent-coral)]" />
                        </div>
                      );
                    })()}

                    {/* Items */}
                    {!d.isWeekend && items.map((item, itemIndex) => {
                      const top = GRID_PADDING_TOP + ((item.hour - START_HOUR) + item.minutes / 60) * hourHeight + 4;
                      const handleCardClick = () => {
                        if (item.clientId) {
                          navigateToClient(item.clientId);
                        } else {
                          if (item.type === 'deliverable') {
                            const deliverable = filteredDeliverables.find(x => x.id === item.id);
                            if (deliverable) openDeliverableModal(deliverable.clientId, deliverable);
                          } else {
                            const call = filteredCalls.find(x => x.id === item.id);
                            if (call) openCallModal(call.clientId, call);
                          }
                        }
                      };
                      return (
                        <TimelineCard
                          key={item.id}
                          item={item}
                          top={top}
                          index={itemIndex}
                          onClick={handleCardClick}
                          getDropTarget={getDropTarget}
                          onMove={handleCardMove}
                          onDragStart={onDragStart}
                          onDragMove={onDragMove}
                          onDragEnd={onDragEnd}
                          skipClickAfterDragRef={skipClickAfterDragRef}
                          isDragging={dragState?.item.id === item.id}
                          justLanded={lastDroppedId === item.id}
                          compact={compactWeeks}
                          allowDragToBacklog={item.type !== 'todo'}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
            </div>
          </div>
        </div>
      </div>
      </div>

      {/* Drag feedback: ligne de repère + ghost (carte timeline) ou idem pour backlog */}
      {(dragState || backlogDragPos) && (() => {
        const x = dragState ? dragState.x : backlogDragPos!.x;
        const y = dragState ? dragState.y : backlogDragPos!.y;
        const target = getDropTarget(x, y);
        const lineY = getDropSlotViewportY(x, y);
        const timeLabel = target
          ? `${target.hour.toString().padStart(2, '0')}h${target.minutes === 0 ? '00' : '30'}`
          : null;
        // Ghost : afficher l’heure du créneau cible sur la card (mise à jour en temps réel au déplacement)
        const ghostItem = dragState && target
          ? { ...dragState.item, time: `${target.hour}h${target.minutes > 0 ? target.minutes.toString().padStart(2, '0') : ''}` }
          : dragState?.item;
        return (
          <>
            {lineY != null && (
              <div
                className="fixed left-0 right-0 z-[9998] pointer-events-none flex items-center"
                style={{ top: lineY - 1 }}
              >
                {timeLabel && (
                  <span
                    className="absolute left-4 px-2 py-0.5 rounded text-xs font-bold bg-[var(--accent-lime)] text-[var(--bg-primary)]"
                    style={{ transform: 'translateY(-50%)' }}
                  >
                    {timeLabel}
                  </span>
                )}
                <div
                  className="flex-1 h-[2px]"
                  style={{
                    background: 'var(--accent-lime)',
                    boxShadow: '0 0 8px var(--accent-lime)',
                  }}
                />
              </div>
            )}
            {dragState && ghostItem && (
              <div
                className="fixed z-[9999] pointer-events-none w-[220px]"
                style={{
                  left: dragState.x - 110,
                  // Quand on a un créneau valide : le haut du ghost = ligne de repère (limite haute de la card)
                  top: lineY != null ? lineY : dragState.y - 28,
                }}
              >
                <TimelineCard
                  item={ghostItem}
                  top={0}
                  index={0}
                  isGhost
                  compact={compactWeeks}
                />
              </div>
            )}
          </>
        );
      })()}

      {/* Mobile: FAB pour ouvrir le drawer Todo du jour */}
      {isMobile && (
        <>
          <button
            type="button"
            onClick={() => setDayTodoDrawerOpen(true)}
            className="fixed bottom-4 left-4 z-[55] w-14 h-14 rounded-full bg-[var(--accent-lime)] text-[var(--bg-primary)] shadow-lg hover:scale-105 active:scale-95 transition-transform flex items-center justify-center touch-manipulation"
            aria-label="Ouvrir Todo du jour"
          >
            {TODO_FAB_ICON}
          </button>
          <DayTodoDrawer
            isOpen={dayTodoDrawerOpen}
            onClose={() => setDayTodoDrawerOpen(false)}
          />
        </>
      )}
    </div>
  );
}

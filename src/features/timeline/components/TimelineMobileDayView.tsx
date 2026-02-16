'use client';

import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useAppStore } from '@/lib/store';
import { formatDateLong } from '@/lib/date-utils';
import { useFilteredTimeline, useModal, useIsMobile } from '@/hooks';
import { TimelineCard, TimelineCardItem } from './TimelineCard';

const HEADER_HEIGHT = 44;
const HOURS_COLUMN_WIDTH = 56;
const MIN_HOUR_HEIGHT = 28;
const START_HOUR = 8;
const END_HOUR = 19;
const LUNCH_START_HOUR = 12;
const GRID_PADDING_TOP = 4;
const BOTTOM_SPACER = 8;
const SWIPE_THRESHOLD = 60;

const ChevronLeft = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 18l-6-6 6-6" />
  </svg>
);
const ChevronRight = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18l6-6-6-6" />
  </svg>
);

function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

export function TimelineMobileDayView() {
  const isMobile = useIsMobile();
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      if (el) setContainerHeight(el.clientHeight);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const { filteredDeliverables, filteredCalls } = useFilteredTimeline();
  const {
    timelineRange,
    navigateToClient,
    getClientById,
    getTeamMemberById,
    updateDeliverable,
    updateCall,
    dayTodos,
    updateDayTodo,
    filters,
  } = useAppStore(
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

  const scheduledTodos = dayTodos.filter((t) => {
    if (t.done || !t.scheduledAt) return false;
    if (filters.teamMemberId && t.assigneeId !== filters.teamMemberId) return false;
    return true;
  });

  const { openDeliverableModal, openCallModal } = useModal();

  const dateKey = selectedDate.toDateString();
  const isWeekend = selectedDate.getDay() === 0 || selectedDate.getDay() === 6;
  const isToday =
    selectedDate.getDate() === new Date().getDate() &&
    selectedDate.getMonth() === new Date().getMonth() &&
    selectedDate.getFullYear() === new Date().getFullYear();

  const rangeStart = new Date(timelineRange.start);
  rangeStart.setHours(0, 0, 0, 0);
  const rangeEnd = new Date(timelineRange.end);
  rangeEnd.setHours(23, 59, 59, 999);
  const canGoPrev = selectedDate.getTime() > rangeStart.getTime();
  const canGoNext = selectedDate.getTime() < rangeEnd.getTime();

  const goPrev = useCallback(() => {
    if (canGoPrev) setSelectedDate((d) => addDays(d, -1));
  }, [canGoPrev]);
  const goNext = useCallback(() => {
    if (canGoNext) setSelectedDate((d) => addDays(d, 1));
  }, [canGoNext]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    const deltaX = e.touches[0].clientX - touchStartX.current;
    const deltaY = e.touches[0].clientY - touchStartY.current;
    if (Math.abs(deltaX) > Math.abs(deltaY) && ((deltaX > 0 && canGoPrev) || (deltaX < 0 && canGoNext))) {
      setSwipeOffset(deltaX * 0.3);
    }
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const endX = e.changedTouches[0].clientX;
    const delta = endX - touchStartX.current;
    setSwipeOffset(0);
    if (delta > SWIPE_THRESHOLD && canGoPrev) goPrev();
    else if (delta < -SWIPE_THRESHOLD && canGoNext) goNext();
  };

  const itemsByDate = useMemo(() => {
    const map = new Map<string, (TimelineCardItem & { hour: number; minutes: number })[]>();

    filteredDeliverables?.forEach((d) => {
      if (!d.dueDate) return;
      const key = d.dueDate.toDateString();
      const client = d.clientId ? getClientById(d.clientId) : null;
      const hour = d.dueDate.getHours();
      const minutes = d.dueDate.getMinutes();
      const assignee = d.assigneeId ? getTeamMemberById(d.assigneeId) : undefined;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push({
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

    filteredCalls?.forEach((c) => {
      if (!c.scheduledAt) return;
      const key = c.scheduledAt.toDateString();
      const client = c.clientId ? getClientById(c.clientId) : null;
      const hour = c.scheduledAt.getHours();
      const minutes = c.scheduledAt.getMinutes();
      const assignee = c.assigneeId ? getTeamMemberById(c.assigneeId) : undefined;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push({
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

    scheduledTodos.forEach((t) => {
      if (!t.scheduledAt) return;
      const key = t.scheduledAt.toDateString();
      const hour = t.scheduledAt.getHours();
      const minutes = t.scheduledAt.getMinutes();
      const assignee = t.assigneeId ? getTeamMemberById(t.assigneeId) : undefined;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push({
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

    map.forEach((items) => {
      items.sort((a, b) => a.hour * 60 + a.minutes - (b.hour * 60 + b.minutes));
    });
    return map;
  }, [filteredDeliverables, filteredCalls, scheduledTodos, getClientById, getTeamMemberById]);

  const items = itemsByDate.get(dateKey) || [];
  const hours = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);
  const gridHeight = Math.max(0, containerHeight - HEADER_HEIGHT - GRID_PADDING_TOP - BOTTOM_SPACER);
  const hourHeight = containerHeight > 0
    ? Math.max(MIN_HOUR_HEIGHT, Math.floor(gridHeight / (END_HOUR - START_HOUR + 1)))
    : MIN_HOUR_HEIGHT;
  const totalHeight = (END_HOUR - START_HOUR + 1) * hourHeight;

  if (!isMobile) return null;

  return (
    <div
      ref={containerRef}
      className="flex flex-col h-full w-full overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={() => setSwipeOffset(0)}
    >
      {/* Header jour + nav - compact */}
      <div className="flex-shrink-0 flex items-center justify-between px-3 py-2 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]">
        <button
          type="button"
          onClick={goPrev}
          disabled={!canGoPrev}
          className="p-2 -m-2 rounded-full text-[var(--text-muted)] disabled:opacity-30 touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Jour précédent"
        >
          <ChevronLeft />
        </button>
        <button
          type="button"
          onClick={() => setSelectedDate(new Date())}
          className="flex-1 text-center min-w-0 px-2 py-2 -m-2 rounded-lg active:bg-[var(--bg-secondary)] transition-colors"
        >
          <p className="text-base font-bold text-[var(--text-primary)] truncate">
            {formatDateLong(selectedDate)}
          </p>
          {isToday ? (
            <span className="text-xs font-semibold text-[var(--accent-lime)] uppercase tracking-wider">
              Aujourd'hui
            </span>
          ) : (
            <span className="text-xs text-[var(--text-muted)]">Appuyer pour aujourd'hui</span>
          )}
        </button>
        <button
          type="button"
          onClick={goNext}
          disabled={!canGoNext}
          className="p-2 -m-2 rounded-full text-[var(--text-muted)] disabled:opacity-30 touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Jour suivant"
        >
          <ChevronRight />
        </button>
      </div>

      {/* Grille jour unique */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Colonne horaires */}
        <div
          className="flex-shrink-0 border-r border-[var(--border-subtle)] bg-[var(--bg-primary)]/95 flex flex-col"
          style={{ width: HOURS_COLUMN_WIDTH }}
        >
          <div style={{ height: HEADER_HEIGHT }} className="flex-shrink-0" />
          <div className="relative flex-1" style={{ height: totalHeight + GRID_PADDING_TOP }}>
            {hours.map((hour, i) => (
              <div
                key={hour}
                className="absolute left-0 right-0 text-xs text-[var(--text-muted)] font-mono text-right pr-2 flex items-center justify-end"
                style={{ top: GRID_PADDING_TOP + i * hourHeight - 8, height: 20 }}
              >
                {hour}h
              </div>
            ))}
          </div>
        </div>

        {/* Colonne jour - overflow-hidden pour full height, pas de scroll vertical */}
        <div
          className="flex-1 min-w-0 overflow-hidden overflow-x-hidden"
          style={{
            transform: swipeOffset !== 0 ? `translateX(${swipeOffset}px)` : undefined,
            transition: swipeOffset === 0 ? 'transform 0.2s ease-out' : 'none',
          }}
        >
          <div
            className={`${isWeekend ? 'bg-[var(--bg-secondary)]/50' : ''}`}
            style={{ minHeight: HEADER_HEIGHT + totalHeight + GRID_PADDING_TOP + BOTTOM_SPACER }}
          >
            {/* Spacer header */}
            <div style={{ height: HEADER_HEIGHT }} className="flex-shrink-0" />

            {/* Grille */}
            <div className="relative" style={{ height: totalHeight + GRID_PADDING_TOP + BOTTOM_SPACER }}>
              {LUNCH_START_HOUR >= START_HOUR && LUNCH_START_HOUR + 1 < END_HOUR && !isWeekend && (
                <div
                  className="absolute left-0 right-0 border-y-2 border-[var(--accent-lime)]/20 bg-[var(--accent-lime)]/5 pointer-events-none"
                  style={{
                    top: GRID_PADDING_TOP + (LUNCH_START_HOUR - START_HOUR) * hourHeight,
                    height: hourHeight * 2,
                  }}
                />
              )}
              {hours.map((hour, i) => (
                <div
                  key={hour}
                  className="absolute left-0 right-0 border-t border-[var(--border-subtle)]"
                  style={{ top: GRID_PADDING_TOP + i * hourHeight }}
                />
              ))}

              {isToday && (() => {
                const now = new Date();
                const currentHour = now.getHours();
                if (currentHour < START_HOUR || currentHour > END_HOUR) return null;
                return (
                  <div
                    className="absolute left-0 right-0 z-10 flex items-center"
                    style={{
                      top: GRID_PADDING_TOP + ((currentHour - START_HOUR) + now.getMinutes() / 60) * hourHeight,
                    }}
                  >
                    <div className="w-2 h-2 rounded-full bg-[var(--accent-coral)] animate-pulse-glow" />
                    <div className="flex-1 h-[2px] bg-[var(--accent-coral)]" />
                  </div>
                );
              })()}

              {/* Cards */}
              {!isWeekend &&
                items.map((item, itemIndex) => {
                  const top = GRID_PADDING_TOP + ((item.hour - START_HOUR) + item.minutes / 60) * hourHeight + 4;
                  const handleCardClick = () => {
                    if (item.clientId) {
                      navigateToClient(item.clientId);
                    } else {
                      if (item.type === 'deliverable') {
                        const d = filteredDeliverables?.find((x) => x.id === item.id);
                        if (d) openDeliverableModal(d.clientId, d);
                      } else {
                        const c = filteredCalls?.find((x) => x.id === item.id);
                        if (c) openCallModal(c.clientId, c);
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
                      compact
                    />
                  );
                })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

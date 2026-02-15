'use client';

import { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useAppStore } from '@/lib/store';
import { useFilteredTimeline, useModal } from '@/hooks';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { TimelineCard, TimelineCardItem } from './TimelineCard';
import { BACKLOG_DRAG_TYPE } from './BacklogSidebar';

// Timeline dimensions — plus compact sur mobile
const HEADER_HEIGHT = 56; // Hauteur ligne des jours (numéro + LUN/MAR...)
const MONTH_ROW_HEIGHT = 38; // Bande mois
const TOTAL_HEADER_HEIGHT = MONTH_ROW_HEIGHT + HEADER_HEIGHT;
const HOUR_HEIGHT_DESKTOP = 96;
const WEEKEND_RATIO = 0.12;
const START_HOUR = 8;
const END_HOUR = 20; // Grille jusqu’à 20h (créneau 19h–20h visible)
const LUNCH_START_HOUR = 12; // Bande visuelle 12h (séparation matin / PM)

/** Snap minutes to 0 or 30 */
function snapTo30Min(date: Date): Date {
  const d = new Date(date);
  const m = d.getMinutes();
  const snapped = Math.round(m / 30) * 30;
  d.setMinutes(snapped, 0, 0);
  return d;
}

export function Timeline() {
  const { filteredDeliverables, filteredCalls } = useFilteredTimeline();
  const { timelineRange, navigateToClient, getClientById, getTeamMemberById, updateDeliverable, updateCall } = useAppStore(
    useShallow((s) => ({
      timelineRange: s.timelineRange,
      navigateToClient: s.navigateToClient,
      getClientById: s.getClientById,
      getTeamMemberById: s.getTeamMemberById,
      updateDeliverable: s.updateDeliverable,
      updateCall: s.updateCall,
    }))
  );
  const { openDeliverableModal, openCallModal } = useModal();
  const isMobile = useIsMobile();
  const timelineContainerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  // Mobile: hauteur dynamique pour tenir la journée (8h-20h) dans le viewport
  const HOUR_HEIGHT = useMemo(() => {
    if (!isMobile || containerHeight < 200) return HOUR_HEIGHT_DESKTOP;
    const gridHeight = containerHeight - TOTAL_HEADER_HEIGHT;
    const hoursCount = END_HOUR - START_HOUR + 1;
    return Math.max(36, Math.floor(gridHeight / hoursCount));
  }, [isMobile, containerHeight]);
  const lastWidthRef = useRef(0);
  const [containerWidth, setContainerWidth] = useState(0);
  type DragItem = TimelineCardItem & { hour?: number; minutes?: number };
  const [dragState, setDragState] = useState<{ item: DragItem; type: 'deliverable' | 'call'; x: number; y: number } | null>(null);
  const [backlogDragPos, setBacklogDragPos] = useState<{ x: number; y: number } | null>(null);
  const skipClickAfterDragRef = useRef<string | null>(null);

  // Quand un drag backlog se termine (sans drop sur la timeline), retirer la ligne de repère
  useEffect(() => {
    const onBacklogDragEnd = () => setBacklogDragPos(null);
    window.addEventListener('backlog-drag-end', onBacklogDragEnd);
    return () => window.removeEventListener('backlog-drag-end', onBacklogDragEnd);
  }, []);

  // Measure container width (ignorer les micro-variations au scroll, ex. apparition scrollbar)
  useEffect(() => {
    const MIN_WIDTH_DELTA = 3;
    const updateWidth = () => {
      if (!scrollContainerRef.current) return;
      const w = scrollContainerRef.current.clientWidth;
      if (Math.abs(w - lastWidthRef.current) < MIN_WIDTH_DELTA && lastWidthRef.current !== 0) return;
      lastWidthRef.current = w;
      setContainerWidth(w);
    };
    updateWidth();
    const resizeObserver = new ResizeObserver(updateWidth);
    if (scrollContainerRef.current) {
      resizeObserver.observe(scrollContainerRef.current);
    }
    return () => resizeObserver.disconnect();
  }, []);

  // Measure container height pour mobile (vh dynamique : journée complète visible)
  useEffect(() => {
    const el = timelineContainerRef.current;
    if (!el) return;
    const updateHeight = () => {
      const h = el.clientHeight;
      if (h > 0) setContainerHeight(h);
    };
    updateHeight();
    const ro = new ResizeObserver(updateHeight);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Calculate day widths — mobile: colonnes plus étroites, min 72px pour lisibilité
  const dayWidths = useMemo(() => {
    if (containerWidth === 0) return { weekday: 160, weekend: 30 };
    const totalUnits = 5 + 2 * WEEKEND_RATIO;
    const unitWidth = containerWidth / totalUnits;
    const minWeekday = isMobile ? 72 : 100;
    return {
      weekday: Math.max(minWeekday, unitWidth),
      weekend: unitWidth * WEEKEND_RATIO,
    };
  }, [containerWidth, isMobile]);

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
      const contentX = clientX - rect.left + el.scrollLeft;
      const contentY = clientY - rect.top + el.scrollTop;
      const timeY = contentY - TOTAL_HEADER_HEIGHT;
      if (timeY < 0) return null;
      const totalMinutesFromStart = (timeY / HOUR_HEIGHT) * 60;
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
    [datesWithWidth, HOUR_HEIGHT]
  );

  const handleCardMove = useCallback(
    (itemId: string, type: 'deliverable' | 'call', newDate: Date) => {
      const snapped = snapTo30Min(newDate);
      if (type === 'deliverable') updateDeliverable(itemId, { dueDate: snapped });
      else updateCall(itemId, { scheduledAt: snapped });
    },
    [updateDeliverable, updateCall]
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
        TOTAL_HEADER_HEIGHT + ((target.hour - START_HOUR) * 60 + target.minutes) / 60 * HOUR_HEIGHT;
      return rect.top + (slotTop - el.scrollTop);
    },
    [getDropTarget, HOUR_HEIGHT]
  );

  const onDragStart = useCallback((item: DragItem, type: 'deliverable' | 'call', x: number, y: number) => {
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
      if (payload.type === 'deliverable') {
        updateDeliverable(payload.id, { dueDate: dateToUse });
      } else {
        updateCall(payload.id, { scheduledAt: dateToUse });
      }
    },
    [getDropTarget, updateDeliverable, updateCall]
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

    map.forEach(items => {
      items.sort((a, b) => (a.hour * 60 + a.minutes) - (b.hour * 60 + b.minutes));
    });

    return map;
  }, [filteredDeliverables, filteredCalls]);

  const hours = useMemo(() => {
    const result: number[] = [];
    for (let h = START_HOUR; h <= END_HOUR; h++) {
      result.push(h);
    }
    return result;
  }, []);

  const totalHeight = (END_HOUR - START_HOUR + 1) * HOUR_HEIGHT;
  const totalWidth = datesWithWidth.reduce((sum, d) => sum + d.width, 0);

  /** Bandes mois pour le header (scroll X) : un bloc par mois avec largeur cumulée + position de début */
  const monthRanges = useMemo(() => {
    const map = new Map<string, { label: string; width: number }>();
    for (const d of datesWithWidth) {
      const key = `${d.date.getFullYear()}-${d.date.getMonth()}`;
      const existing = map.get(key);
      const w = existing ? existing.width + d.width : d.width;
      const label = d.date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
      map.set(key, { label: existing?.label ?? label, width: w });
    }
    const sorted = Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
    let pos = 0;
    return sorted.map(([, v]) => {
      const item = { ...v, position: pos };
      pos += v.width;
      return item;
    });
  }, [datesWithWidth]);

  // Mois actif (celui visible à gauche) — mis à jour au scroll horizontal
  const [scrollLeft, setScrollLeft] = useState(0);
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const onScroll = () => setScrollLeft(el.scrollLeft);
    onScroll(); // init
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  const activeMonth = useMemo(() => {
    if (monthRanges.length === 0) return null;
    // Mois dont la zone contient le bord gauche visible (scrollLeft)
    for (let i = monthRanges.length - 1; i >= 0; i--) {
      const m = monthRanges[i];
      if (scrollLeft >= m.position) return m;
    }
    return monthRanges[0];
  }, [monthRanges, scrollLeft]);

  const formatDay = (date: Date) => {
    const days = ['DIM', 'LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM'];
    return days[date.getDay()];
  };

  return (
    <div ref={timelineContainerRef} className="flex-1 flex flex-col relative overflow-hidden min-h-0">
      {/* Timeline Content */}
      <div className="flex-1 flex overflow-hidden relative z-10 min-h-0">
        {/* Scrollable timeline : horaires + colonnes jours scrollent ensemble en Y ; en X la colonne horaires reste fixe (sticky) */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-x-auto overflow-y-auto timeline-scroll touch-pan-x touch-pan-y"
          style={{ transform: 'translateZ(0)', WebkitOverflowScrolling: 'touch' }}
        >
          <div className="flex flex-row min-h-0" style={{ width: totalWidth + 64, transform: 'translateZ(0)' }}>
            {/* Colonne horaires : sticky left pour rester visible au scroll X, scroll en Y avec le contenu */}
            <div
              className="flex-shrink-0 w-12 sm:w-16 border-r border-[var(--border-subtle)] bg-[var(--bg-primary)] sticky left-0 z-[60] shadow-[4px_0_12px_rgba(0,0,0,0.3)]"
              style={{ height: TOTAL_HEADER_HEIGHT + totalHeight }}
            >
              <div style={{ height: MONTH_ROW_HEIGHT }} className="border-b border-[var(--border-subtle)]" />
              <div style={{ height: HEADER_HEIGHT }} className="border-b border-[var(--border-subtle)]" />
              <div className="relative" style={{ height: totalHeight }}>
                {/* Bande 13h–14h : séparation matin / PM (discret) */}
                {LUNCH_START_HOUR >= START_HOUR && LUNCH_START_HOUR < END_HOUR && (
                  <div
                    className="absolute left-0 right-0 border-t border-[var(--border-subtle)]/80 bg-[var(--bg-secondary)]/30 pointer-events-none"
                    style={{
                      top: (LUNCH_START_HOUR - START_HOUR) * HOUR_HEIGHT,
                      height: HOUR_HEIGHT
                    }}
                  />
                )}
                {hours.map((hour, i) => (
                  <div
                    key={hour}
                    className="absolute left-0 right-0 text-xs text-[var(--text-muted)] font-mono text-right pr-3 flex items-center justify-end"
                    style={{
                      top: i * HOUR_HEIGHT - 10,
                      height: 20
                    }}
                  >
                    {hour.toString().padStart(2, '0')} h
                  </div>
                ))}
              </div>
            </div>

            {/* Colonnes jours : index heures + bande mois + lignes des jours */}
            <div className="flex flex-shrink-0 flex-col" style={{ width: totalWidth }}>
              {/* Mois actif — sticky à gauche (zone des jours), se met à jour au scroll */}
              <div
                className="flex flex-row flex-shrink-0 sticky top-0 z-30 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]/90 backdrop-blur-sm"
                style={{ height: MONTH_ROW_HEIGHT, width: totalWidth }}
              >
                {activeMonth && (
                  <div
                    className="flex-shrink-0 flex items-center justify-center border-r border-[var(--border-subtle)] bg-[var(--bg-secondary)]/40 sticky left-12 sm:left-16 z-40 w-[120px] sm:w-[140px]"
                  >
                    <span className="text-xs font-semibold text-[var(--text-primary)] tracking-wider truncate px-2 capitalize">
                      {activeMonth.label.charAt(0).toUpperCase() + activeMonth.label.slice(1)}
                    </span>
                  </div>
                )}
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
                    if (!d.isWeekend && e.dataTransfer.types.includes(BACKLOG_DRAG_TYPE)) {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'move';
                      setBacklogDragPos({ x: e.clientX, y: e.clientY });
                    }
                  }}
                  onDrop={e => {
                    if (!d.isWeekend && e.dataTransfer.types.includes(BACKLOG_DRAG_TYPE)) {
                      handleBacklogDrop(e, d.date);
                    }
                  }}
                >
                  {/* Day header — sticky sous la bande mois au scroll Y */}
                  <div 
                    className={`sticky z-30 flex flex-col items-center justify-center border-b border-[var(--border-subtle)] backdrop-blur-sm transition-colors duration-150 ${
                      isDropColumn || isBacklogDropColumn
                        ? 'bg-[var(--accent-lime)]/20'
                        : today 
                          ? 'bg-[var(--accent-lime-dim)]' 
                          : d.isWeekend 
                            ? 'bg-[var(--bg-tertiary)]/80' 
                            : 'bg-[var(--bg-secondary)]/80'
                    } ${d.date.getDate() === 1 ? 'border-l-2 border-l-[var(--accent-cyan)]/50' : ''}`}
                    style={{ height: HEADER_HEIGHT, top: MONTH_ROW_HEIGHT }}
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

                  {/* Day content */}
                  <div className="relative" style={{ height: totalHeight }}>
                    {/* Bande 13h–14h : séparation matin / PM (discret) */}
                    {LUNCH_START_HOUR >= START_HOUR && LUNCH_START_HOUR < END_HOUR && !d.isWeekend && (
                      <div
                        className="absolute left-0 right-0 border-t border-[var(--border-subtle)]/80 bg-[var(--bg-secondary)]/30 pointer-events-none"
                        style={{
                          top: (LUNCH_START_HOUR - START_HOUR) * HOUR_HEIGHT,
                          height: HOUR_HEIGHT
                        }}
                      />
                    )}
                    {/* Hour lines */}
                    {hours.map((hour, i) => (
                      <div
                        key={hour}
                        className="absolute left-0 right-0 border-t border-[var(--border-subtle)]"
                        style={{ top: i * HOUR_HEIGHT }}
                      />
                    ))}

                    {/* Now line */}
                    {today && (
                      <div
                        className="absolute left-0 right-0 z-10 flex items-center"
                        style={{
                          top: ((new Date().getHours() - START_HOUR) + new Date().getMinutes() / 60) * HOUR_HEIGHT
                        }}
                      >
                        <div className="w-2 h-2 rounded-full bg-[var(--accent-coral)] animate-pulse-glow" />
                        <div className="flex-1 h-[2px] bg-[var(--accent-coral)]" />
                      </div>
                    )}

                    {/* Items */}
                    {!d.isWeekend && items.map((item, itemIndex) => {
                      const top = ((item.hour - START_HOUR) + item.minutes / 60) * HOUR_HEIGHT + 4;
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
                className="fixed left-0 right-0 z-[9999] pointer-events-none flex items-center"
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
                className="fixed z-[9998] pointer-events-none w-[220px]"
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
                />
              </div>
            )}
          </>
        );
      })()}
    </div>
  );
}

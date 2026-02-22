'use client';

import { useRef, useState, useCallback } from 'react';
import type { RetroplanningTask, RetroplanningTaskColor } from '@/types';
import { daysBetween } from '@/lib/retroplanning-utils';

// ─── Color map ──────────────────────────────────────────────────────────────

const COLOR_MAP: Record<RetroplanningTaskColor, string> = {
  cyan:    'var(--accent-cyan)',
  lime:    'var(--accent-lime)',
  violet:  'var(--accent-violet)',
  coral:   'var(--accent-coral)',
  amber:   'var(--accent-amber)',
  magenta: 'var(--accent-magenta)',
};

// ─── Date helpers ──────────────────────────────────────────────────────────

function addDays(dateStr: string, days: number): string {
  const MS_PER_DAY = 86400000;
  const d = new Date(dateStr);
  const utcMs = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) + days * MS_PER_DAY;
  const result = new Date(utcMs);
  const y = result.getUTCFullYear();
  const m = String(result.getUTCMonth() + 1).padStart(2, '0');
  const day = String(result.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function todayString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function clampDelta(task: RetroplanningTask, delta: number, projectStart: string, deadline: string): number {
  const MS_PER_DAY = 86400000;
  const startMs = new Date(task.startDate).getTime();
  const endMs = new Date(task.endDate).getTime();
  const projectStartMs = new Date(projectStart).getTime();
  const deadlineMs = new Date(deadline).getTime();
  const deltaMs = delta * MS_PER_DAY;
  const clampedDelta = Math.min(
    Math.max(deltaMs, projectStartMs - startMs),
    deadlineMs - endMs
  );
  return Math.round(clampedDelta / MS_PER_DAY);
}

// ─── Month markers ──────────────────────────────────────────────────────────

interface MonthMarker {
  label: string;
  percent: number; // position as % of total width
}

function computeMonthMarkers(projectStart: string, totalDays: number): MonthMarker[] {
  const markers: MonthMarker[] = [];
  const d = new Date(projectStart);
  let year = d.getUTCFullYear();
  let month = d.getUTCMonth();

  // Start from the first day of the next month after projectStart
  month += 1;
  if (month > 11) { month = 0; year += 1; }

  while (true) {
    const firstOfMonth = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const daysFromStart = daysBetween(projectStart, firstOfMonth);
    if (daysFromStart >= totalDays) break;

    markers.push({
      label: new Date(Date.UTC(year, month, 1)).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit', timeZone: 'UTC' }),
      percent: (daysFromStart / totalDays) * 100,
    });

    month += 1;
    if (month > 11) { month = 0; year += 1; }
  }

  return markers;
}

// ─── Format date for display ─────────────────────────────────────────────────

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', timeZone: 'UTC' });
}

// ─── Types ─────────────────────────────────────────────────────────────────

interface RetroplanningGanttProps {
  tasks: RetroplanningTask[];
  deadline: string;
  onTaskUpdate: (task: RetroplanningTask) => void;
  onTaskClick: (task: RetroplanningTask) => void;
}

type DragMode = 'move' | 'resize';

interface DragState {
  taskId: string;
  mode: DragMode;
  startX: number;
  originalTask: RetroplanningTask;
  containerWidth: number;
  totalDays: number;
  hasMoved: boolean;
}

// ─── Component ─────────────────────────────────────────────────────────────

export function RetroplanningGantt({ tasks, deadline, onTaskUpdate, onTaskClick }: RetroplanningGanttProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const previewRef = useRef<RetroplanningTask | null>(null);
  const [previewTask, setPreviewTask] = useState<RetroplanningTask | null>(null);

  // Compute project range (expand to include tasks that go beyond deadline)
  const projectStart = tasks.reduce(
    (earliest, t) => t.startDate < earliest ? t.startDate : earliest,
    tasks[0]?.startDate ?? deadline
  );
  const projectEnd = tasks.reduce(
    (latest, t) => t.endDate > latest ? t.endDate : latest,
    deadline
  );
  const totalDays = Math.max(1, daysBetween(projectStart, projectEnd));
  const today = todayString();
  const todayInRange = today >= projectStart && today <= deadline;
  const todayPercent = todayInRange ? (daysBetween(projectStart, today) / totalDays) * 100 : null;
  const deadlinePercent = projectEnd > deadline ? (daysBetween(projectStart, deadline) / totalDays) * 100 : null;

  const monthMarkers = computeMonthMarkers(projectStart, totalDays);

  // ── Pointer Handlers ──────────────────────────────────────────────────────

  const handleBarPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>, task: RetroplanningTask) => {
    if (!containerRef.current) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);

    dragRef.current = {
      taskId: task.id,
      mode: 'move',
      startX: e.clientX,
      originalTask: { ...task },
      containerWidth: containerRef.current.getBoundingClientRect().width,
      totalDays,
      hasMoved: false,
    };
  }, [totalDays]);

  const handleResizePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>, task: RetroplanningTask) => {
    if (!containerRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);

    dragRef.current = {
      taskId: task.id,
      mode: 'resize',
      startX: e.clientX,
      originalTask: { ...task },
      containerWidth: containerRef.current.getBoundingClientRect().width,
      totalDays,
      hasMoved: false,
    };
  }, [totalDays]);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    const { mode, startX, originalTask, containerWidth, totalDays: td } = dragRef.current;

    const deltaPixels = e.clientX - startX;
    const pixelsPerDay = containerWidth / td;
    const rawDelta = Math.round(deltaPixels / pixelsPerDay);

    if (rawDelta !== 0) dragRef.current.hasMoved = true;

    if (mode === 'move') {
      const clampedDelta = clampDelta(originalTask, rawDelta, projectStart, projectEnd);
      if (clampedDelta !== 0 || dragRef.current.hasMoved) {
        const newStartDate = addDays(originalTask.startDate, clampedDelta);
        const newEndDate = addDays(originalTask.endDate, clampedDelta);
        const updated = { ...originalTask, startDate: newStartDate, endDate: newEndDate };
        previewRef.current = updated;
        setPreviewTask(updated);
      }
    } else {
      const newDelta = Math.max(1 - originalTask.durationDays, rawDelta);
      const newEndDate = addDays(originalTask.endDate, newDelta);
      const clampedEnd = newEndDate > projectEnd ? projectEnd : newEndDate;
      const newDuration = Math.max(1, daysBetween(originalTask.startDate, clampedEnd));
      const updated = { ...originalTask, endDate: clampedEnd, durationDays: newDuration };
      previewRef.current = updated;
      setPreviewTask(updated);
    }
  }, [projectStart, deadline]);

  const handlePointerUp = useCallback(() => {
    if (!dragRef.current) return;
    const { hasMoved } = dragRef.current;
    const currentPreview = previewRef.current;

    if (hasMoved && currentPreview) {
      onTaskUpdate(currentPreview);
    }

    dragRef.current = null;
    previewRef.current = null;
    setPreviewTask(null);
  }, [onTaskUpdate]);

  const handleBarClick = useCallback((e: React.MouseEvent, task: RetroplanningTask) => {
    if (dragRef.current?.hasMoved) return;
    onTaskClick(task);
  }, [onTaskClick]);

  // ── Render helpers ────────────────────────────────────────────────────────

  function getDisplayTask(task: RetroplanningTask): RetroplanningTask {
    if (previewTask && previewTask.id === task.id) return previewTask;
    return task;
  }

  function getBarPosition(task: RetroplanningTask): { left: number; width: number; isNarrow: boolean } {
    const dt = getDisplayTask(task);
    const startOffset = daysBetween(projectStart, dt.startDate);
    const duration = daysBetween(dt.startDate, dt.endDate);
    const widthPct = Math.max(2, (duration / totalDays) * 100);
    return {
      left: (startOffset / totalDays) * 100,
      width: widthPct,
      isNarrow: widthPct < 12, // bar too small to fit label inside
    };
  }

  // First month label (projectStart month)
  const startMonthLabel = new Date(projectStart).toLocaleDateString('fr-FR', {
    month: 'short', year: '2-digit', timeZone: 'UTC',
  });

  return (
    <div className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] overflow-x-auto overflow-y-hidden">
      {/* Timeline header with month markers */}
      <div className="relative h-7 border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
        {/* Start month */}
        <span
          className="absolute text-[10px] font-medium text-[var(--text-muted)] capitalize"
          style={{ left: 8, top: '50%', transform: 'translateY(-50%)' }}
        >
          {startMonthLabel}
        </span>

        {/* Month markers */}
        {monthMarkers.map((marker, i) => (
          <div key={i} className="absolute top-0 bottom-0" style={{ left: `${marker.percent}%` }}>
            <div className="h-full border-l border-[var(--border-subtle)]" />
            <span
              className="absolute text-[10px] font-medium text-[var(--text-muted)] capitalize whitespace-nowrap"
              style={{ left: 6, top: '50%', transform: 'translateY(-50%)' }}
            >
              {marker.label}
            </span>
          </div>
        ))}

        {/* Deadline marker in header (only when timeline extends past deadline) */}
        {deadlinePercent !== null && (
          <div
            className="absolute top-0 bottom-0 w-0.5"
            style={{ left: `${deadlinePercent}%`, backgroundColor: 'var(--accent-amber)', opacity: 0.6, zIndex: 4 }}
          />
        )}

        {/* Today indicator in header */}
        {todayPercent !== null && (
          <div
            className="absolute top-0 bottom-0 w-0.5"
            style={{ left: `${todayPercent}%`, backgroundColor: '#ef4444', opacity: 0.7, zIndex: 5 }}
          />
        )}
      </div>

      {/* Task rows */}
      <div
        ref={containerRef}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="relative"
      >
        {tasks.map((task) => {
          const { left, width, isNarrow } = getBarPosition(task);
          const color = COLOR_MAP[task.color] || 'var(--accent-amber)';
          const dt = getDisplayTask(task);
          const isDragging = dragRef.current?.taskId === task.id;
          const barRight = left + width; // % from left edge where bar ends

          return (
            <div
              key={task.id}
              className="relative border-b border-[var(--border-subtle)] last:border-b-0"
              style={{ height: 44 }}
            >
              {/* Month grid lines (subtle) */}
              {monthMarkers.map((marker, i) => (
                <div
                  key={`ml-${i}`}
                  className="absolute top-0 bottom-0 border-l border-[var(--border-subtle)] opacity-40"
                  style={{ left: `${marker.percent}%`, pointerEvents: 'none' }}
                />
              ))}

              {/* Deadline marker (when timeline extends past) */}
              {deadlinePercent !== null && (
                <div
                  className="absolute top-0 bottom-0 w-0.5"
                  style={{
                    left: `${deadlinePercent}%`,
                    backgroundColor: 'var(--accent-amber)',
                    opacity: 0.25,
                    pointerEvents: 'none',
                    zIndex: 4,
                  }}
                />
              )}

              {/* Today indicator */}
              {todayPercent !== null && (
                <div
                  className="absolute top-0 bottom-0 w-0.5"
                  style={{
                    left: `${todayPercent}%`,
                    backgroundColor: '#ef4444',
                    opacity: 0.35,
                    pointerEvents: 'none',
                    zIndex: 5,
                  }}
                />
              )}

              {/* Bar */}
              <div
                className="absolute top-1 bottom-1 rounded-md flex items-center select-none"
                style={{
                  left: `${left}%`,
                  width: `${width}%`,
                  backgroundColor: `color-mix(in srgb, ${color} 20%, transparent)`,
                  borderLeft: `3px solid ${color}`,
                  cursor: isDragging ? 'grabbing' : 'grab',
                  zIndex: isDragging ? 10 : 1,
                  opacity: isDragging ? 0.85 : 1,
                  transition: isDragging ? 'none' : 'opacity 0.15s',
                  overflow: 'hidden',
                }}
                onPointerDown={(e) => handleBarPointerDown(e, task)}
                onClick={(e) => handleBarClick(e, dt)}
              >
                {/* Label inside bar (only if wide enough) */}
                {!isNarrow && (
                  <div className="flex items-center gap-2 px-2 min-w-0 w-full">
                    <span
                      className="text-[11px] font-semibold truncate"
                      style={{ color, filter: 'brightness(1.3)' }}
                    >
                      {dt.label}
                    </span>
                    <span className="text-[9px] text-[var(--text-muted)] opacity-70 whitespace-nowrap ml-auto hidden sm:inline">
                      {formatShortDate(dt.startDate)} → {formatShortDate(dt.endDate)}
                    </span>
                  </div>
                )}

                {/* Resize handle */}
                <div
                  className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize rounded-r hover:opacity-100 transition-opacity"
                  style={{ borderRight: `2px solid ${color}`, opacity: 0.5 }}
                  onPointerDown={(e) => handleResizePointerDown(e, task)}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>

              {/* Label outside bar (when bar is too narrow) */}
              {isNarrow && (
                <span
                  className="absolute text-[11px] font-semibold whitespace-nowrap pointer-events-none"
                  style={{
                    ...(barRight > 75
                      ? { right: `${100 - left + 0.5}%` } // label to the left if bar is near right edge
                      : { left: `${barRight + 0.5}%` }),   // label to the right otherwise
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color,
                    filter: 'brightness(1.3)',
                  }}
                >
                  {dt.label}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

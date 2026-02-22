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

/** Add `days` calendar days to an ISO YYYY-MM-DD string */
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

/** Return today as YYYY-MM-DD (local date) */
function todayString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Clamp delta so task doesn't go before projectStart or after deadline */
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

// ─── Month label computation ────────────────────────────────────────────────

interface MonthSegment {
  label: string;
  startCol: number; // 1-based CSS grid column
  span: number;     // number of days in this month within range
}

function computeMonthSegments(projectStart: string, totalDays: number): MonthSegment[] {
  const segments: MonthSegment[] = [];
  let current = projectStart;
  let col = 1;

  while (col <= totalDays) {
    const d = new Date(current);
    const year = d.getUTCFullYear();
    const month = d.getUTCMonth();

    // End of this month (last day of the month in UTC)
    const lastOfMonth = new Date(Date.UTC(year, month + 1, 0));
    const lastStr = `${lastOfMonth.getUTCFullYear()}-${String(lastOfMonth.getUTCMonth() + 1).padStart(2, '0')}-${String(lastOfMonth.getUTCDate()).padStart(2, '0')}`;

    // Days from `current` to end of month (inclusive, capped by remaining totalDays)
    const daysInSegment = Math.min(daysBetween(current, lastStr), totalDays - col + 1);

    segments.push({
      label: new Date(current).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit', timeZone: 'UTC' }),
      startCol: col,
      span: daysInSegment,
    });

    col += daysInSegment;
    current = addDays(lastStr, 1);
  }

  return segments;
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

  // Local preview state for dragged bar (avoids re-rendering whole list)
  const [previewTask, setPreviewTask] = useState<RetroplanningTask | null>(null);

  // Compute project range
  const projectStart = tasks.reduce((earliest, t) => t.startDate < earliest ? t.startDate : earliest, tasks[0]?.startDate ?? deadline);
  const totalDays = daysBetween(projectStart, deadline);
  const today = todayString();
  const todayInRange = today >= projectStart && today <= deadline;
  const todayCol = todayInRange ? daysBetween(projectStart, today) : null;

  const monthSegments = computeMonthSegments(projectStart, totalDays);

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
      const clampedDelta = clampDelta(originalTask, rawDelta, projectStart, deadline);
      if (clampedDelta !== 0 || dragRef.current.hasMoved) {
        const newStartDate = addDays(originalTask.startDate, clampedDelta);
        const newEndDate = addDays(originalTask.endDate, clampedDelta);
        setPreviewTask({ ...originalTask, startDate: newStartDate, endDate: newEndDate });
      }
    } else {
      // Resize right edge → adjust endDate
      const newDelta = Math.max(1 - originalTask.durationDays, rawDelta);
      const newEndDate = addDays(originalTask.endDate, newDelta);
      // Clamp endDate to deadline
      const clampedEnd = newEndDate > deadline ? deadline : newEndDate;
      const newDuration = Math.max(1, daysBetween(originalTask.startDate, clampedEnd));
      setPreviewTask({ ...originalTask, endDate: clampedEnd, durationDays: newDuration });
    }
  }, [projectStart, deadline]);

  const handlePointerUp = useCallback(() => {
    if (!dragRef.current) return;
    const { hasMoved } = dragRef.current;

    if (hasMoved && previewTask) {
      onTaskUpdate(previewTask);
    }

    dragRef.current = null;
    setPreviewTask(null);
  }, [previewTask, onTaskUpdate]);

  const handleBarClick = useCallback((e: React.MouseEvent, task: RetroplanningTask) => {
    if (dragRef.current?.hasMoved) return; // was a drag, not a click
    onTaskClick(task);
  }, [onTaskClick]);

  // ── Render helpers ────────────────────────────────────────────────────────

  function getDisplayTask(task: RetroplanningTask): RetroplanningTask {
    if (previewTask && previewTask.id === task.id) return previewTask;
    return task;
  }

  function getBarCols(task: RetroplanningTask): { start: number; end: number } {
    const dt = getDisplayTask(task);
    const start = daysBetween(projectStart, dt.startDate);
    const end = start + daysBetween(dt.startDate, dt.endDate); // exclusive end for CSS grid
    return { start, end: end + 1 }; // CSS grid is 1-based
  }

  const LABEL_WIDTH = 160;

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)]">
      <div style={{ minWidth: Math.max(600, totalDays * 20 + LABEL_WIDTH) }}>
        {/* Time axis header */}
        <div className="flex border-b border-[var(--border-subtle)]">
          {/* Label column spacer */}
          <div style={{ width: LABEL_WIDTH, flexShrink: 0 }} className="border-r border-[var(--border-subtle)] px-3 py-2">
            <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Étape</span>
          </div>

          {/* Month labels using CSS grid */}
          <div
            className="flex-1 relative"
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${totalDays}, 1fr)`,
            }}
          >
            {monthSegments.map((seg, i) => (
              <div
                key={i}
                style={{
                  gridColumn: `${seg.startCol} / span ${seg.span}`,
                  borderRight: i < monthSegments.length - 1 ? '1px solid var(--border-subtle)' : undefined,
                }}
                className="px-2 py-2 text-[10px] font-medium text-[var(--text-muted)] capitalize"
              >
                {seg.label}
              </div>
            ))}

            {/* Week lines overlay */}
            {Array.from({ length: Math.floor(totalDays / 7) }, (_, i) => {
              const col = (i + 1) * 7;
              return col < totalDays ? (
                <div
                  key={`week-${i}`}
                  style={{
                    gridColumn: `${col} / ${col + 1}`,
                    gridRow: '1',
                    borderRight: '1px solid var(--border-subtle)',
                    height: '100%',
                    position: 'absolute',
                    left: `${(col / totalDays) * 100}%`,
                    top: 0,
                    bottom: 0,
                    width: 1,
                    opacity: 0.5,
                  }}
                />
              ) : null;
            })}
          </div>
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
            const { start, end } = getBarCols(task);
            const color = COLOR_MAP[task.color] || 'var(--accent-amber)';
            const dt = getDisplayTask(task);
            const isDragging = dragRef.current?.taskId === task.id;

            return (
              <div key={task.id} className="flex border-b border-[var(--border-subtle)] last:border-b-0 items-center" style={{ height: 44 }}>
                {/* Label column */}
                <div
                  style={{ width: LABEL_WIDTH, flexShrink: 0 }}
                  className="border-r border-[var(--border-subtle)] px-3 flex items-center overflow-hidden"
                >
                  <span className="text-xs text-[var(--text-primary)] truncate font-medium">{task.label}</span>
                </div>

                {/* Gantt bar area */}
                <div
                  className="flex-1 relative"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${totalDays}, 1fr)`,
                    height: '100%',
                    alignItems: 'center',
                  }}
                >
                  {/* Grid lines (every 7 days) */}
                  {Array.from({ length: Math.floor(totalDays / 7) }, (_, i) => {
                    const col = (i + 1) * 7;
                    return col < totalDays ? (
                      <div
                        key={`gl-${i}`}
                        style={{
                          position: 'absolute',
                          left: `${(col / totalDays) * 100}%`,
                          top: 0,
                          bottom: 0,
                          width: 1,
                          backgroundColor: 'var(--border-subtle)',
                          opacity: 0.5,
                          pointerEvents: 'none',
                        }}
                      />
                    ) : null;
                  })}

                  {/* Today indicator */}
                  {todayCol && (
                    <div
                      style={{
                        position: 'absolute',
                        left: `${((todayCol - 1) / totalDays) * 100}%`,
                        top: 0,
                        bottom: 0,
                        width: 2,
                        backgroundColor: '#ef4444',
                        opacity: 0.7,
                        pointerEvents: 'none',
                        zIndex: 5,
                      }}
                    />
                  )}

                  {/* The actual bar */}
                  <div
                    style={{
                      gridColumn: `${start} / ${end}`,
                      backgroundColor: color.replace(')', ', 0.25)').replace('var(', 'color-mix(in srgb, ').replace(', 0.25)', ' 25%, transparent)'),
                      borderLeft: `4px solid ${color}`,
                      cursor: isDragging ? 'grabbing' : 'grab',
                      position: 'relative',
                      userSelect: 'none',
                      zIndex: isDragging ? 10 : 1,
                      opacity: isDragging ? 0.85 : 1,
                    }}
                    className="h-8 mx-0.5 rounded flex items-center px-2 overflow-hidden select-none"
                    onPointerDown={(e) => handleBarPointerDown(e, task)}
                    onClick={(e) => handleBarClick(e, dt)}
                  >
                    <span className="text-[11px] font-medium truncate" style={{ color, filter: 'brightness(1.4)' }}>
                      {dt.label}
                    </span>

                    {/* Resize handle */}
                    <div
                      style={{
                        position: 'absolute',
                        right: 0,
                        top: 0,
                        bottom: 0,
                        width: 8,
                        cursor: 'ew-resize',
                        borderRight: `2px solid ${color}`,
                        opacity: 0.6,
                      }}
                      className="rounded-r hover:opacity-100 transition-opacity"
                      onPointerDown={(e) => handleResizePointerDown(e, task)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </div>
              </div>
            );
          })}

          {/* Today line spanning full height (drawn over all rows) — duplicated at task level but also full height */}
          {todayCol && tasks.length > 0 && (
            <div
              style={{
                position: 'absolute',
                left: `calc(${LABEL_WIDTH}px + ${((todayCol - 1) / totalDays) * (100)}%)`,
                top: 0,
                bottom: 0,
                width: 2,
                backgroundColor: '#ef4444',
                opacity: 0.35,
                pointerEvents: 'none',
                zIndex: 20,
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

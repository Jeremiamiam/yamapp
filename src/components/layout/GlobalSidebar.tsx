'use client';

import { useAppStore } from '@/lib/store';
import { DayTodoZone } from '@/features/timeline/components/DayTodoZone';
import { BacklogSidebar } from '@/features/timeline/components/BacklogSidebar';

const SIDEBAR_WIDTH = 240;
const BACKLOG_OVERLAP = 12; // Pixels de chevauchement visuel

interface GlobalSidebarProps {
  /** Hauteur totale disponible (pour calculer la répartition DayZone/Backlog) */
  height?: number;
}

export function GlobalSidebar({ height = 800 }: GlobalSidebarProps) {
  const getBacklogDeliverables = useAppStore((s) => s.getBacklogDeliverables);
  const getBacklogCalls = useAppStore((s) => s.getBacklogCalls);

  // Calculer le nombre d'items dans le backlog
  const backlogDeliverables = getBacklogDeliverables();
  const backlogCalls = getBacklogCalls();
  const backlogItemsCount = backlogDeliverables.length + backlogCalls.length;

  // Calculs de hauteur pour la répartition DayZone / Backlog
  const ESTIMATED_CARD_HEIGHT = 72;
  const BACKLOG_HEADER_HEIGHT = 48;
  const availableHeight = height;

  // Calculate needed height for backlog based on items count
  const backlogHeightNeeded = BACKLOG_HEADER_HEIGHT + (backlogItemsCount * ESTIMATED_CARD_HEIGHT);
  const minBacklogHeight = availableHeight * 0.25; // Minimum 25%
  const maxBacklogHeight = availableHeight * 0.5;  // Maximum 50%

  // Backlog height between 25% and 50%, dynamic based on content
  const backlogHeight = Math.min(Math.max(backlogHeightNeeded, minBacklogHeight), maxBacklogHeight);

  // DayZone takes the full height (backlog will overlap)
  const dayZoneHeight = availableHeight - backlogHeight + BACKLOG_OVERLAP;

  return (
    <div
      className="relative flex-shrink-0 border-r border-[var(--border-subtle)] bg-[var(--bg-primary)]"
      style={{ width: SIDEBAR_WIDTH, height: availableHeight }}
    >
      {/* DayTodo Zone - fond */}
      <div
        className="absolute top-0 left-0 right-0 overflow-y-auto"
        style={{ height: dayZoneHeight }}
      >
        <DayTodoZone />
      </div>

      {/* Backlog Sidebar - flottant au-dessus */}
      <div
        className="absolute bottom-0 left-0 right-0 z-10 overflow-hidden rounded-t-xl bg-[var(--bg-card)] border-t border-x border-[var(--border-subtle)] shadow-[0_-4px_20px_rgba(0,0,0,0.3)]"
        style={{ height: backlogHeight }}
      >
        <BacklogSidebar />
      </div>
    </div>
  );
}

export { SIDEBAR_WIDTH };

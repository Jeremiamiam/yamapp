import { useMemo } from 'react';
import { useAppStore } from '@/lib/store';
import type { Deliverable, Call } from '@/types';

/**
 * Hook pour récupérer les deliverables et calls filtrés (filtres + plage timeline)
 * Encapsule toute la logique de filtrage pour Timeline
 */
export function useFilteredTimeline() {
  const deliverables = useAppStore((state) => state.deliverables);
  const calls = useAppStore((state) => state.calls);
  const filters = useAppStore((state) => state.filters);
  const timelineRange = useAppStore((state) => state.timelineRange);
  const getClientById = useAppStore((state) => state.getClientById);

  const filteredDeliverables = useMemo(() => {
    return deliverables.filter((d) => {
      if (!d.dueDate) return false;
      if (d.dueDate < timelineRange.start || d.dueDate > timelineRange.end) return false;

      const client = d.clientId ? getClientById(d.clientId) : null;
      if (d.clientId && !client) return false;
      if (client) {
        if (filters.clientStatus !== 'all' && client.status !== filters.clientStatus) return false;
        if (filters.teamMemberId && d.assigneeId !== filters.teamMemberId) return false;
      }
      return true;
    });
  }, [deliverables, filters, timelineRange, getClientById]);

  const filteredCalls = useMemo(() => {
    return calls.filter((c) => {
      if (!c.scheduledAt) return false;
      if (c.scheduledAt < timelineRange.start || c.scheduledAt > timelineRange.end) return false;

      const client = c.clientId ? getClientById(c.clientId) : null;
      if (c.clientId && !client) return false;
      if (client) {
        if (filters.clientStatus !== 'all' && client.status !== filters.clientStatus) return false;
        if (filters.teamMemberId && c.assigneeId !== filters.teamMemberId) return false;
      }
      return true;
    });
  }, [calls, filters, timelineRange, getClientById]);

  return { filteredDeliverables, filteredCalls };
}

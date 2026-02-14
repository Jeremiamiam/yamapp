import { useMemo } from 'react';
import { useAppStore } from '@/lib/store';

/**
 * Hook pour récupérer les deliverables et calls filtrés (filtres + plage timeline).
 * Délègue au store (getFilteredDeliverables / getFilteredCalls) et mémoise pour éviter recalculs.
 */
export function useFilteredTimeline() {
  const deliverables = useAppStore((state) => state.deliverables);
  const calls = useAppStore((state) => state.calls);
  const filters = useAppStore((state) => state.filters);
  const timelineRange = useAppStore((state) => state.timelineRange);
  const getFilteredDeliverables = useAppStore((state) => state.getFilteredDeliverables);
  const getFilteredCalls = useAppStore((state) => state.getFilteredCalls);

  const filteredDeliverables = useMemo(
    () => getFilteredDeliverables(),
    [getFilteredDeliverables, deliverables, filters, timelineRange]
  );
  const filteredCalls = useMemo(
    () => getFilteredCalls(),
    [getFilteredCalls, calls, filters, timelineRange]
  );

  return { filteredDeliverables, filteredCalls };
}

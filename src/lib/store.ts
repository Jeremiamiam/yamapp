// Re-export pour rétrocompatibilité — le store est découpé dans src/lib/store/
export { useAppStore } from './store/index';
export type { AppState, AppRole, ViewType, ModalType, TimelineFilters } from './store/index';

'use client';

import { useAppStore } from '@/lib/store';

const CalendarIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const GridIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
  </svg>
);

const KanbanIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="5" height="18" rx="1"/>
    <rect x="10" y="3" width="5" height="12" rx="1"/>
    <rect x="17" y="3" width="5" height="8" rx="1"/>
  </svg>
);

const ChartIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);

const TodoIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
    <path d="M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2v0z" />
    <line x1="9" y1="12" x2="15" y2="12" />
    <line x1="9" y1="16" x2="15" y2="16" />
  </svg>
);

const BacklogIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
);

interface MobileBottomNavProps {
  onOpenTodo: () => void;
  onOpenBacklog: () => void;
  canAccessCompta: boolean;
}

export function MobileBottomNav({ onOpenTodo, onOpenBacklog, canAccessCompta }: MobileBottomNavProps) {
  const { currentView, navigateToTimeline, navigateToProduction, navigateToClients, navigateToCompta } = useAppStore();

  const NavTab = ({
    onClick,
    active,
    icon,
    label,
  }: {
    onClick: () => void;
    active: boolean;
    icon: React.ReactNode;
    label: string;
  }) => (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center justify-center flex-1 py-1.5 gap-0.5 min-h-[48px] touch-manipulation transition-colors ${
        active ? 'text-[var(--accent-cyan)]' : 'text-[var(--text-muted)] active:text-[var(--text-primary)]'
      }`}
      aria-label={label}
      aria-current={active ? 'page' : undefined}
    >
      {icon}
      <span className="text-[10px] font-semibold uppercase tracking-wider">{label}</span>
    </button>
  );

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden flex items-stretch border-t border-[var(--border-subtle)] bg-[var(--bg-primary)]/95 backdrop-blur-lg safe-area-pb"
      role="navigation"
      aria-label="Navigation principale"
    >
      {/* Vues principales */}
      <div className="flex flex-1">
        <NavTab
          onClick={navigateToTimeline}
          active={currentView === 'timeline'}
          icon={<CalendarIcon />}
          label="Calendrier"
        />
        <NavTab
          onClick={navigateToProduction}
          active={currentView === 'production'}
          icon={<KanbanIcon />}
          label="Prod"
        />
        <NavTab
          onClick={navigateToClients}
          active={currentView === 'clients'}
          icon={<GridIcon />}
          label="Clients"
        />
        {canAccessCompta && (
          <NavTab
            onClick={navigateToCompta}
            active={currentView === 'compta'}
            icon={<ChartIcon />}
            label="Compta"
          />
        )}
      </div>

      {/* Actions Timeline : Todo + Backlog */}
      <div className="flex items-center gap-1 border-l border-[var(--border-subtle)] px-2">
        <button
          type="button"
          onClick={onOpenTodo}
          className="flex flex-col items-center justify-center p-1.5 rounded-xl min-h-[44px] min-w-[44px] text-[var(--accent-lime)] hover:bg-[var(--accent-lime)]/10 active:scale-95 transition-all touch-manipulation"
          aria-label="Todo du jour"
        >
          <TodoIcon />
          <span className="text-[8px] font-semibold leading-tight">Todo</span>
        </button>
        <button
          type="button"
          onClick={onOpenBacklog}
          className="flex flex-col items-center justify-center p-1.5 rounded-xl min-h-[44px] min-w-[44px] text-[var(--accent-violet)] hover:bg-[var(--accent-violet)]/10 active:scale-95 transition-all touch-manipulation"
          aria-label="À planifier"
        >
          <BacklogIcon />
          <span className="text-[8px] font-semibold leading-tight">Backlog</span>
        </button>
      </div>
    </nav>
  );
}

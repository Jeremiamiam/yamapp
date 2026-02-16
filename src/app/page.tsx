'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
// Note: useCallback est utilisé pour navigateView
import { useAppStore } from '@/lib/store';
import { useUserRole } from '@/hooks/useUserRole';
import { useIsMobile } from '@/hooks';
import { Timeline, BacklogDrawer } from '@/features/timeline/components';
import { HorizontalEventTimeline } from '@/features/timeline/components/HorizontalEventTimeline';
import { Header } from '@/components/layout/Header';
import { GlobalSidebar } from '@/components/layout/GlobalSidebar';
import { ModalManager } from '@/components/ModalManager';
import { ClientDetail, ClientsList, DocumentModal } from '@/features/clients/components';
import { ComptaView } from '@/features/compta/components';
import { DayTodoDrawer } from '@/features/timeline/components/DayTodoDrawer';

// Ordre des vues pour la navigation clavier (sans client-detail qui est une vue modale)
const VIEW_ORDER = ['timeline', 'clients', 'compta'] as const;
type MainView = typeof VIEW_ORDER[number];

const BACKLOG_FAB_ICON = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
);

const TODO_FAB_ICON = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
    <path d="M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2v0z" />
    <line x1="9" y1="12" x2="15" y2="12" />
    <line x1="9" y1="16" x2="15" y2="16" />
  </svg>
);

export default function Home() {
  const loadData = useAppStore((state) => state.loadData);
  const restoreViewFromStorage = useAppStore((state) => state.restoreViewFromStorage);
  const currentView = useAppStore((state) => state.currentView);
  const navigateToTimeline = useAppStore((state) => state.navigateToTimeline);
  const navigateToClients = useAppStore((state) => state.navigateToClients);
  const navigateToCompta = useAppStore((state) => state.navigateToCompta);
  const isLoading = useAppStore((state) => state.isLoading);
  const loadingError = useAppStore((state) => state.loadingError);
  const { role, loading } = useUserRole();
  const isMobile = useIsMobile();
  const [backlogDrawerOpen, setBacklogDrawerOpen] = useState(false);
  const [todoDrawerOpen, setTodoDrawerOpen] = useState(false);
  const [useHorizontalTimeline, setUseHorizontalTimeline] = useState(false);
  const mainContentRef = useRef<HTMLDivElement>(null);
  const [sidebarHeight, setSidebarHeight] = useState(800);

  // Restaurer la vue depuis localStorage après hydratation
  useEffect(() => {
    restoreViewFromStorage();
  }, [restoreViewFromStorage]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Member qui tente d'accéder à la compta → redirection Calendrier
  useEffect(() => {
    if (!loading && role !== 'admin' && currentView === 'compta') {
      navigateToTimeline();
    }
  }, [loading, role, currentView, navigateToTimeline]);

  // Calculer la hauteur disponible pour la sidebar
  useEffect(() => {
    const updateHeight = () => {
      if (mainContentRef.current) {
        setSidebarHeight(mainContentRef.current.clientHeight);
      }
    };
    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  // Navigation clavier avec flèches gauche/droite
  const navigateView = useCallback((direction: 'prev' | 'next') => {
    // Ne pas naviguer si on est sur client-detail ou si une modale est ouverte
    if (currentView === 'client-detail') return;
    
    // Vérifier si un input/textarea est focus (ne pas interférer avec la saisie)
    const activeEl = document.activeElement;
    if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || (activeEl as HTMLElement).isContentEditable)) {
      return;
    }
    
    const currentIndex = VIEW_ORDER.indexOf(currentView as MainView);
    if (currentIndex === -1) return;
    
    // Filtrer les vues accessibles (compta uniquement pour admin)
    const accessibleViews = VIEW_ORDER.filter(v => v !== 'compta' || role === 'admin');
    const accessibleIndex = accessibleViews.indexOf(currentView as MainView);
    
    let newIndex: number;
    if (direction === 'next') {
      newIndex = (accessibleIndex + 1) % accessibleViews.length;
    } else {
      newIndex = (accessibleIndex - 1 + accessibleViews.length) % accessibleViews.length;
    }
    
    const newView = accessibleViews[newIndex];
    if (newView === 'timeline') navigateToTimeline();
    else if (newView === 'clients') navigateToClients();
    else if (newView === 'compta') navigateToCompta();
  }, [currentView, role, navigateToTimeline, navigateToClients, navigateToCompta]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorer si une modale est ouverte (vérifier si un élément avec role="dialog" existe)
      if (document.querySelector('[role="dialog"]')) return;
      
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        navigateView('next');
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        navigateView('prev');
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigateView]);

  if (isLoading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gradient-mesh relative">
        <div className="noise-overlay" />
        <div className="relative z-10 flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-full border-2 border-[var(--accent-lime)] border-t-transparent animate-spin" />
          <p className="text-[var(--text-secondary)]">Chargement des données…</p>
        </div>
      </div>
    );
  }

  if (loadingError) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gradient-mesh relative p-6">
        <div className="noise-overlay" />
        <div className="relative z-10 text-center max-w-md">
          <p className="text-[var(--accent-coral)] mb-4">{loadingError}</p>
          <button
            type="button"
            onClick={() => loadData()}
            className="px-4 py-2 rounded-lg bg-[var(--accent-lime)] text-[var(--bg-primary)] font-medium"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }


  // Fonction pour rendre une vue
  const renderView = (view: string) => {
    switch (view) {
      case 'timeline':
        return (
          <div className="flex-1 relative min-h-0 h-full">
            {useHorizontalTimeline ? (
              <HorizontalEventTimeline />
            ) : (
              <Timeline className="absolute inset-0" hideSidebar />
            )}
            {/* Toggle Timeline Mode - Floating button */}
            <button
              type="button"
              onClick={() => setUseHorizontalTimeline(!useHorizontalTimeline)}
              className="absolute top-4 right-4 z-50 flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-subtle)] hover:border-[var(--accent-lime)] transition-all shadow-lg backdrop-blur-sm group"
              title={useHorizontalTimeline ? "Vue calendrier classique" : "Vue Event Horizon"}
            >
              <span className="text-xs font-medium text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors">
                {useHorizontalTimeline ? "📅 Calendrier" : "🌊 Horizon"}
              </span>
              <div className="w-10 h-5 rounded-full bg-[var(--bg-tertiary)] relative transition-all">
                <div
                  className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-[var(--accent-lime)] transition-transform duration-200"
                  style={{ transform: useHorizontalTimeline ? 'translateX(20px)' : 'translateX(0)' }}
                />
              </div>
            </button>
          </div>
        );
      case 'clients':
        return <ClientsList />;
      case 'compta':
        return <ComptaView />;
      case 'client-detail':
        return <ClientDetail />;
      default:
        return null;
    }
  };

  return (
    <div className="h-screen flex flex-col gradient-mesh relative">
      <div className="noise-overlay" />
      <Header />
      <div ref={mainContentRef} className="flex-1 flex min-h-0">
        {/* Sidebar globale (desktop only) - visible sur toutes les vues */}
        {!isMobile && (
          <GlobalSidebar height={sidebarHeight} />
        )}

        {/* Contenu principal */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {renderView(currentView)}
        </div>

        {/* Mobile: FABs + drawers */}
        {isMobile && (
          <>
            {/* FAB Todo */}
            <button
              type="button"
              onClick={() => setTodoDrawerOpen(true)}
              className="fixed bottom-4 left-4 z-[55] w-14 h-14 rounded-full bg-[var(--accent-lime)] text-[var(--bg-primary)] shadow-lg hover:scale-105 active:scale-95 transition-transform flex items-center justify-center touch-manipulation"
              aria-label="Ouvrir Todo du jour"
            >
              {TODO_FAB_ICON}
            </button>
            <DayTodoDrawer
              isOpen={todoDrawerOpen}
              onClose={() => setTodoDrawerOpen(false)}
            />

            {/* FAB Backlog */}
            <button
              type="button"
              onClick={() => setBacklogDrawerOpen(true)}
              className="fixed bottom-4 right-4 z-[55] w-14 h-14 rounded-full bg-[var(--accent-violet)] text-[var(--bg-primary)] shadow-lg hover:scale-105 active:scale-95 transition-transform flex items-center justify-center touch-manipulation"
              aria-label="Ouvrir À planifier"
            >
              {BACKLOG_FAB_ICON}
            </button>
            <BacklogDrawer
              isOpen={backlogDrawerOpen}
              onClose={() => setBacklogDrawerOpen(false)}
            />
          </>
        )}
      </div>
      <DocumentModal />
      <ModalManager />
    </div>
  );
}

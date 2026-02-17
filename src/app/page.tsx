'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
// Note: useCallback est utilisé pour navigateView
import { useAppStore } from '@/lib/store';
import { useUserRole } from '@/hooks/useUserRole';
import { useIsMobile } from '@/hooks';
import { Timeline, BacklogDrawer } from '@/features/timeline/components';
import { Header } from '@/components/layout/Header';
import { GlobalSidebar } from '@/components/layout/GlobalSidebar';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { ModalManager } from '@/components/ModalManager';
import { ClientDetail, ClientsList, DocumentModal } from '@/features/clients/components';
import { ComptaView } from '@/features/compta/components';
import { DayTodoDrawer } from '@/features/timeline/components/DayTodoDrawer';

// Ordre des vues pour la navigation clavier (sans client-detail qui est une vue modale)
const VIEW_ORDER = ['timeline', 'clients', 'compta'] as const;
type MainView = typeof VIEW_ORDER[number];

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
          <div className="flex-1 relative min-h-0 h-full overflow-hidden">
            <Timeline className="absolute inset-0" hideSidebar />
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
    <div className="min-h-[100dvh] h-screen flex flex-col gradient-mesh relative">
      <div className="noise-overlay" />
      <Header />
      <div ref={mainContentRef} className="flex-1 flex min-h-0">
        {/* Sidebar globale (desktop only) - visible sur toutes les vues */}
        {!isMobile && (
          <GlobalSidebar height={sidebarHeight} />
        )}

        {/* Contenu principal — padding-bottom = hauteur bottom nav pour que 8h-19h reste visible */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden content-pb-for-nav md:pb-0">
          {renderView(currentView)}
        </div>

        {/* Mobile: barre de navigation en bas */}
        <MobileBottomNav
          onOpenTodo={() => setTodoDrawerOpen(true)}
          onOpenBacklog={() => setBacklogDrawerOpen(true)}
          canAccessCompta={role === 'admin'}
        />

        <DayTodoDrawer
            isOpen={todoDrawerOpen}
            onClose={() => setTodoDrawerOpen(false)}
          />
          <BacklogDrawer
            isOpen={backlogDrawerOpen}
            onClose={() => setBacklogDrawerOpen(false)}
          />
      </div>
      <DocumentModal />
      <ModalManager />
    </div>
  );
}

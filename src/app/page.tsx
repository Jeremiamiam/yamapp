'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/lib/store';
import { useUserRole } from '@/hooks/useUserRole';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { Timeline, BacklogSidebar } from '@/features/timeline/components';
import { Header } from '@/components/layout/Header';
import { ModalManager } from '@/components/ModalManager';
import { ClientDetail, ClientsList, DocumentModal } from '@/features/clients/components';
import { ComptaView } from '@/features/compta/components';

const PACKAGE_ICON = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
);

export default function Home() {
  const loadData = useAppStore((state) => state.loadData);
  const currentView = useAppStore((state) => state.currentView);
  const navigateToTimeline = useAppStore((state) => state.navigateToTimeline);
  const isLoading = useAppStore((state) => state.isLoading);
  const loadingError = useAppStore((state) => state.loadingError);
  const { role, loading } = useUserRole();
  const isMobile = useIsMobile();
  const [backlogOpen, setBacklogOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Éditeur qui tente d'accéder à la compta → redirection Calendrier
  useEffect(() => {
    if (!loading && role === 'editor' && currentView === 'compta') {
      navigateToTimeline();
    }
  }, [loading, role, currentView, navigateToTimeline]);

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

  if (currentView === 'client-detail') {
    return (
      <>
        <ClientDetail />
        <DocumentModal />
        <ModalManager />
      </>
    );
  }

  return (
    <div className="h-screen flex flex-col gradient-mesh relative">
      <div className="noise-overlay" />
      <Header />
      <div className="flex-1 flex flex-col min-h-0">
        {currentView === 'timeline' && (
          <div className="flex-1 flex min-h-0 relative">
            <Timeline />
            <BacklogSidebar
              isMobileOverlay={isMobile}
              isOpen={isMobile ? backlogOpen : true}
              onClose={isMobile ? () => setBacklogOpen(false) : undefined}
            />
            {isMobile && (
              <button
                type="button"
                onClick={() => setBacklogOpen(true)}
                className="fixed bottom-6 right-6 z-30 w-14 h-14 rounded-full bg-[var(--accent-violet)] text-black flex items-center justify-center shadow-lg hover:bg-[var(--accent-violet)]/90 active:scale-95 transition-all min-h-[44px] min-w-[44px]"
                title="Ouvrir le backlog"
              >
                {PACKAGE_ICON}
              </button>
            )}
          </div>
        )}
        {currentView === 'clients' && <ClientsList />}
        {currentView === 'compta' && role === 'admin' && <ComptaView />}
      </div>
      <DocumentModal />
      <ModalManager />
    </div>
  );
}

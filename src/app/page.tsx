'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { useUserRole } from '@/hooks/useUserRole';
import { Timeline, BacklogSidebar } from '@/features/timeline/components';
import { Header } from '@/components/layout/Header';
import { ModalManager } from '@/components/ModalManager';
import { ClientDetail, ClientsList, DocumentModal } from '@/features/clients/components';
import { ComptaView } from '@/features/compta/components';

export default function Home() {
  const loadData = useAppStore((state) => state.loadData);
  const currentView = useAppStore((state) => state.currentView);
  const navigateToTimeline = useAppStore((state) => state.navigateToTimeline);
  const isLoading = useAppStore((state) => state.isLoading);
  const loadingError = useAppStore((state) => state.loadingError);
  const { role, loading } = useUserRole();

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Member qui tente d'accéder à la compta → redirection Calendrier
  useEffect(() => {
    if (!loading && role !== 'admin' && currentView === 'compta') {
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
          <div className="flex-1 flex min-h-0">
            <Timeline />
            <BacklogSidebar />
          </div>
        )}
        {currentView === 'clients' && <ClientsList />}
        {currentView === 'compta' && <ComptaView />}
      </div>
      <DocumentModal />
      <ModalManager />
    </div>
  );
}

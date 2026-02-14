'use client';

import { useAppStore } from '@/lib/store';
import { Timeline, BacklogSidebar } from '@/features/timeline/components';
import { Header } from '@/components/layout/Header';
import { ModalManager } from '@/components/ModalManager';
import { ClientDetail, ClientsList, DocumentModal } from '@/features/clients/components';
import { ComptaView } from '@/features/compta/components';

export default function Home() {
  const currentView = useAppStore((state) => state.currentView);

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

'use client';

import { useAppStore } from '@/lib/store';
import { useClient } from '@/hooks';
import {
  ContactsSection,
  DocumentsSection,
  LinksSection,
  ActivitySection,
  DeliverablesSection,
} from './sections';

const ArrowLeft = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M12 19l-7-7 7-7"/>
  </svg>
);

const Pencil = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

export function ClientDetail() {
  const selectedClientId = useAppStore((state) => state.selectedClientId);
  const navigateToTimeline = useAppStore((state) => state.navigateToTimeline);
  const openModal = useAppStore((state) => state.openModal);
  const client = useClient(selectedClientId);

  if (!client) {
    return (
      <div className="h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <p className="text-[var(--text-muted)]">Client non trouvé</p>
      </div>
    );
  }

  const isProspect = client.status === 'prospect';

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] gradient-mesh">
      <div className="noise-overlay" />

      <header className="sticky top-0 z-50 bg-[var(--bg-primary)]/80 backdrop-blur-xl border-b border-[var(--border-subtle)]">
        <div className="px-4 sm:px-6 md:px-8 py-4 sm:py-5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
            <button
              onClick={navigateToTimeline}
              className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors group self-start touch-manipulation min-h-[44px] -ml-1"
            >
              <span className="group-hover:-translate-x-1 transition-transform">
                <ArrowLeft />
              </span>
              <span className="text-sm font-medium">Timeline</span>
            </button>

            <div className="hidden sm:block h-6 w-px bg-[var(--border-subtle)] flex-shrink-0" />

            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl font-display font-bold text-[var(--text-primary)] truncate">
                {client.name}
              </h1>
              <span
                className={`
                  flex-shrink-0 px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider
                  ${isProspect
                    ? 'bg-[var(--accent-amber)]/20 text-[var(--accent-amber)]'
                    : 'bg-[var(--accent-cyan)]/20 text-[var(--accent-cyan)]'
                  }
                `}
              >
                {isProspect ? 'Prospect' : 'Client'}
              </span>
              <button
                type="button"
                onClick={() => openModal({ type: 'client', mode: 'edit', client })}
                className="p-2 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] transition-colors flex-shrink-0 touch-manipulation min-h-[44px] min-w-[44px]"
                title="Modifier ou supprimer le client"
              >
                <Pencil />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="p-4 sm:p-6 md:p-8 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          <section className="lg:col-span-1 space-y-6">
            <ContactsSection clientId={client.id} />
            <LinksSection clientId={client.id} />
            <DocumentsSection clientId={client.id} />
          </section>

          <section className="lg:col-span-2 space-y-6">
            <ActivitySection clientId={client.id} />
            <DeliverablesSection clientId={client.id} />
          </section>
        </div>
      </main>
    </div>
  );
}

'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useAppStore } from '@/lib/store';
import { useClient } from '@/hooks';
import {
  ContactsSection,
  DocumentsSection,
  LinksSection,
  DeliverablesSection,
  RetroplanningSection,
} from './sections';

const ArrowLeft = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M12 19l-7-7 7-7"/>
  </svg>
);

const Pencil = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

export function ClientDetail() {
  const selectedClientId = useAppStore((state) => state.selectedClientId);
  const navigateBack = useAppStore((state) => state.navigateBack);
  const openModal = useAppStore((state) => state.openModal);
  const client = useClient(selectedClientId);

  // Listener pour la touche Échap
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        navigateBack();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigateBack]);

  if (!client) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-[var(--text-muted)]">Client non trouvé</p>
      </div>
    );
  }

  const isProspect = client.status === 'prospect';

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Barre contextuelle client */}
      <div className="flex-shrink-0 px-4 sm:px-6 py-4 border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)]/50">
        <div className="flex items-center gap-4">
          <button
            onClick={navigateBack}
            className="flex items-center gap-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors group"
          >
            <span className="group-hover:-translate-x-0.5 transition-transform">
              <ArrowLeft />
            </span>
            <span className="text-xs font-medium">Retour</span>
          </button>

          <h1 className="text-xl font-semibold text-[var(--text-primary)] truncate">
            {client.name}
          </h1>
          
          <span
            className={`
              flex-shrink-0 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider
              ${isProspect
                ? 'bg-[var(--accent-amber)]/20 text-[var(--accent-amber)]'
                : 'bg-[var(--accent-cyan)]/20 text-[var(--accent-cyan)]'
              }
            `}
          >
            {isProspect ? 'Prospect' : 'Client'}
          </span>
          
          <div className="flex items-center gap-1 ml-auto">
          <Link
            href="/proto/client-detail-v2"
            className="text-[10px] font-medium text-[var(--accent-violet)]/80 hover:text-[var(--accent-violet)] px-2 py-1 rounded border border-[var(--accent-violet)]/30 hover:border-[var(--accent-violet)]/50 transition-colors"
            title="Voir le proto du nouveau layout"
          >
            Voir proto
          </Link>
          <button
            type="button"
            onClick={() => openModal({ type: 'client', mode: 'edit', client })}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] transition-colors"
            title="Modifier"
          >
            <Pencil />
          </button>
        </div>
        </div>
      </div>

      {/* Contenu scrollable */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Colonne gauche - infos client */}
            <section className="lg:col-span-1 space-y-5">
              <ContactsSection clientId={client.id} />
              <LinksSection clientId={client.id} />
              <DocumentsSection clientId={client.id} />
            </section>

            {/* Colonne droite - produits (focus principal) */}
            <section className="lg:col-span-2">
              <DeliverablesSection clientId={client.id} />
            </section>
          </div>

          {/* Retroplanning — full width below the grid */}
          <div className="mt-6">
            <RetroplanningSection clientId={client.id} />
          </div>
        </div>
      </div>
    </div>
  );
}

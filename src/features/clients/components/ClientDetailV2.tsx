'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { useClient } from '@/hooks';
import { ClientSidebarSection } from './sections/ClientSidebarSection';
import { ProjectsListSection } from './sections/ProjectsListSection';
import { RetroplanningSection } from './sections/RetroplanningSection';
import { ProjectDrawer } from './ProjectDrawer';

// ─── Icons ───────────────────────────────────────────────────────────────────

const ArrowLeft = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M12 19l-7-7 7-7"/>
  </svg>
);

const ChevronRight = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);

const Pencil = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

// ─── Component ───────────────────────────────────────────────────────────────

export function ClientDetailV2() {
  const selectedClientId = useAppStore((state) => state.selectedClientId);
  const navigateBack = useAppStore((state) => state.navigateBack);
  const openModal = useAppStore((state) => state.openModal);
  const getProjectsByClientId = useAppStore((state) => state.getProjectsByClientId);
  const deliverables = useAppStore((state) => state.deliverables);

  const client = useClient(selectedClientId);

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // Escape key: close project selection first, then navigate back
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedProjectId) {
          setSelectedProjectId(null);
        } else {
          navigateBack();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigateBack, selectedProjectId]);

  if (!client) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-[var(--text-muted)]">Client non trouvé</p>
      </div>
    );
  }

  const clientProjects = getProjectsByClientId(client.id);
  const selectedProject = selectedProjectId
    ? clientProjects.find((p) => p.id === selectedProjectId) ?? null
    : null;

  const isProspect = client.status === 'prospect';

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-primary)]">

      {/* ── Header: bouton retour + nom client + badge statut ────────────── */}
      <header className="flex-shrink-0 flex items-center gap-3 px-4 py-3 border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)]/50">
        <button
          type="button"
          onClick={navigateBack}
          className="flex items-center gap-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors group flex-shrink-0"
        >
          <span className="group-hover:-translate-x-0.5 transition-transform">
            <ArrowLeft />
          </span>
          <span className="text-xs font-medium">Retour</span>
        </button>

        <h1 className="text-lg font-semibold text-[var(--text-primary)] truncate flex-1">
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

        <button
          type="button"
          onClick={() => openModal({ type: 'client', mode: 'edit', client })}
          className="flex-shrink-0 p-1.5 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] transition-colors"
          title="Modifier le client"
        >
          <Pencil />
        </button>
      </header>

      {/* ── Breadcrumb: toujours visible ─────────────────────────────────── */}
      <nav
        className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 text-xs text-[var(--text-secondary)] border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]"
        aria-label="Fil d'Ariane"
      >
        <button
          type="button"
          onClick={() => setSelectedProjectId(null)}
          className={`transition-colors ${selectedProjectId ? 'text-[var(--accent-cyan)] hover:underline' : 'text-[var(--text-muted)] cursor-default'}`}
        >
          {client.name}
        </button>
        <ChevronRight />
        <button
          type="button"
          onClick={() => setSelectedProjectId(null)}
          className={`transition-colors ${selectedProjectId ? 'text-[var(--accent-cyan)] hover:underline' : 'font-semibold text-[var(--text-primary)] cursor-default'}`}
        >
          Projets
        </button>
        {selectedProject && (
          <>
            <ChevronRight />
            <span className="font-semibold text-[var(--text-primary)] truncate max-w-[200px]">
              {selectedProject.name}
            </span>
          </>
        )}
      </nav>

      {/* ── Corps: sidebar fixe + zone principale ────────────────────────── */}
      <div className="flex-1 flex min-h-0 overflow-hidden">

        {/* Sidebar client fixe */}
        <aside className="flex-shrink-0 w-72 xl:w-80 border-r border-[var(--border-subtle)] overflow-y-auto">
          <ClientSidebarSection client={client} />
        </aside>

        {/* Zone principale */}
        <main className="flex-1 min-w-0 flex flex-col overflow-hidden relative">

          {/* Liste projets — dimmée quand drawer ouvert (Plan 03 ajoutera le drawer) */}
          <div
            className={`flex-1 overflow-y-auto transition-opacity duration-200 ${
              selectedProjectId ? 'opacity-30 pointer-events-none' : ''
            }`}
          >
            <ProjectsListSection
              client={client}
              projects={clientProjects}
              onSelectProject={setSelectedProjectId}
              selectedProjectId={selectedProjectId}
            />
          </div>

          {/* ProjectDrawer — slides in from the right when a project is selected */}
          {selectedProjectId && selectedProject && (
            <ProjectDrawer
              project={selectedProject}
              client={client}
              deliverables={deliverables}
              onClose={() => setSelectedProjectId(null)}
            />
          )}

        </main>
      </div>

      {/* ── Footer retroplanning full-width ──────────────────────────────── */}
      <footer className="flex-shrink-0 border-t border-[var(--border-subtle)] bg-[var(--bg-secondary)]/30 p-4 sm:p-6">
        <RetroplanningSection clientId={client.id} />
      </footer>
    </div>
  );
}

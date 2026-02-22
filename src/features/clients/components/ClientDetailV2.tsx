'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { useClient } from '@/hooks';
import { ClientSidebarSection } from './sections/ClientSidebarSection';
import { ProjectsListSection } from './sections/ProjectsListSection';
import { RetroplanningSection } from './sections/RetroplanningSection';
import { ProjectDetailView, OrphanProductsView } from './ProjectDetailView';

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
  const projects = useAppStore((state) => state.projects);
  const deliverables = useAppStore((state) => state.deliverables);

  const client = useClient(selectedClientId);

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [retroExpanded, setRetroExpanded] = useState(false);

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

  // Clear selection when project was deleted (e.g. from ProjectModal)
  useEffect(() => {
    if (!client || !selectedProjectId || selectedProjectId === '__divers__') return;
    const exists = projects.some(
      (p) => p.clientId === client.id && p.id === selectedProjectId
    );
    if (!exists) setSelectedProjectId(null);
  }, [selectedProjectId, projects, client]);

  if (!client) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-[var(--text-muted)]">Client non trouvé</p>
      </div>
    );
  }

  const clientProjects = projects.filter((p) => p.clientId === client.id);
  const selectedProject = selectedProjectId
    ? clientProjects.find((p) => p.id === selectedProjectId) ?? null
    : null;

  const isProspect = client.status === 'prospect';

  return (
    <div className="h-full flex flex-col bg-[var(--bg-primary)]">

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

      {/* ── Corps: sidebar fixe + zone principale ────────────────────────── */}
      <div className="flex-1 flex min-h-0 overflow-hidden">

        {/* Sidebar client fixe */}
        <aside className="flex-shrink-0 w-60 xl:w-64 border-r border-[var(--border-subtle)] overflow-y-auto">
          <ClientSidebarSection
            client={client}
            onRetroClick={() => setRetroExpanded((prev) => !prev)}
            retroOpen={retroExpanded}
          />
        </aside>

        {/* Zone principale */}
        <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
          {selectedProject ? (
            <ProjectDetailView
              project={selectedProject}
              client={client}
              deliverables={deliverables}
              onBack={() => setSelectedProjectId(null)}
            />
          ) : selectedProjectId === '__divers__' ? (
            <OrphanProductsView
              client={client}
              deliverables={deliverables.filter((d) => d.clientId === client.id && !d.projectId)}
              onBack={() => setSelectedProjectId(null)}
            />
          ) : (
            <div className="flex-1 overflow-y-auto">
              <ProjectsListSection
                client={client}
                projects={clientProjects}
                onSelectProject={setSelectedProjectId}
                selectedProjectId={selectedProjectId}
              />
            </div>
          )}
        </main>
      </div>

      {/* ── Retroplanning overlay footer ─────────────────────────────────── */}
      {retroExpanded && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/30 z-40"
            onClick={() => setRetroExpanded(false)}
          />
          {/* Panel */}
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--bg-primary)] border-t-2 border-[var(--accent-amber)]/40 shadow-[0_-8px_30px_rgba(0,0,0,0.3)]">
            {/* Header bar */}
            <div className="flex items-center gap-2 px-5 py-3 border-b border-[var(--border-subtle)]">
              <span className="text-[var(--accent-amber)]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--accent-amber)] flex-1">
                Retroplanning
              </span>
              <button
                type="button"
                onClick={() => setRetroExpanded(false)}
                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors cursor-pointer"
                title="Fermer"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            {/* Content */}
            <div className="max-h-[50vh] overflow-y-auto px-5 py-4">
              <RetroplanningSection clientId={client.id} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

'use client';

import { useAppStore } from '@/lib/store';
import { useModal } from '@/hooks';
import { computeProjectBilling, PROJECT_BILLING_LABELS, PROJECT_BILLING_COLORS } from '@/lib/project-billing';
import type { Client, Project } from '@/types';

// ─── Icons ───────────────────────────────────────────────────────────────────

const Folder = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </svg>
);

const Plus = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const Package = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/>
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
    <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
  </svg>
);

// ─── Icons (Divers group) ─────────────────────────────────────────────────────

const Archive = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="21 8 21 21 3 21 3 8"/>
    <rect x="1" y="3" width="22" height="5"/>
    <line x1="10" y1="12" x2="14" y2="12"/>
  </svg>
);

// ─── Props ────────────────────────────────────────────────────────────────────

interface ProjectsListSectionProps {
  client: Client;
  projects: Project[];
  onSelectProject: (projectId: string) => void;
  selectedProjectId: string | null;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function ProjectsListSection({
  client,
  projects,
  onSelectProject,
  selectedProjectId,
}: ProjectsListSectionProps) {
  const deliverables = useAppStore((state) => state.deliverables);
  const { openProjectModal } = useModal();

  // Orphan deliverables: belong to this client but have no projectId
  const orphanDeliverables = deliverables.filter(
    (d) => d.clientId === client.id && !d.projectId
  );

  // Check if a "Divers" project already exists for this client
  const hasDiversProject = projects.some(
    (p) => p.name.toLowerCase() === 'divers'
  );

  // Show virtual Divers group only if there are orphan deliverables AND no real Divers project
  const showDiversGroup = orphanDeliverables.length > 0 && !hasDiversProject;

  return (
    <div className="p-4 sm:p-6">
      {/* Section header */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-[var(--text-muted)]"><Folder /></span>
        <h2 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider flex-1">
          Projets
        </h2>
        <span className="text-xs text-[var(--text-muted)] bg-[var(--bg-tertiary)] px-2 py-0.5 rounded-full">
          {projects.length}
        </span>
        <button
          type="button"
          onClick={() => openProjectModal(client.id)}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-[var(--accent-cyan)]/10 text-[var(--accent-cyan)] hover:bg-[var(--accent-cyan)]/20 transition-colors"
          title="Nouveau projet"
        >
          <Plus />
          <span>Nouveau projet</span>
        </button>
      </div>

      {/* Empty state */}
      {projects.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <div className="text-[var(--text-muted)] mb-3 opacity-40">
            <Folder />
          </div>
          <p className="text-sm text-[var(--text-muted)] mb-1">Aucun projet</p>
          <p className="text-xs text-[var(--text-muted)] opacity-60 mb-4">
            Créer un premier projet pour ce client
          </p>
          <button
            type="button"
            onClick={() => openProjectModal(client.id)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-[var(--accent-cyan)] text-[var(--bg-primary)] hover:opacity-90 transition-opacity"
          >
            <Plus />
            Créer un projet
          </button>
        </div>
      )}

      {/* Projects grid */}
      {(projects.length > 0 || showDiversGroup) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {projects.map((project) => {
            const projectDeliverables = deliverables.filter((d) => d.projectId === project.id);
            const billing = computeProjectBilling(project, deliverables);
            const isSelected = selectedProjectId === project.id;
            const billingLabel = PROJECT_BILLING_LABELS[billing.status];
            const billingColor = PROJECT_BILLING_COLORS[billing.status];

            return (
              <button
                key={project.id}
                type="button"
                onClick={() => onSelectProject(project.id)}
                className={`
                  text-left p-4 rounded-xl border transition-all
                  bg-[var(--bg-card)]
                  ${isSelected
                    ? 'border-[var(--accent-cyan)] ring-1 ring-[var(--accent-cyan)]/40 shadow-[0_0_0_1px_var(--accent-cyan)]/20'
                    : 'border-[var(--border-subtle)] hover:border-[var(--accent-cyan)]/40 hover:bg-[var(--bg-secondary)]'
                  }
                `}
              >
                {/* Project name */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h3 className={`text-sm font-semibold truncate flex-1 ${isSelected ? 'text-[var(--accent-cyan)]' : 'text-[var(--text-primary)]'}`}>
                    {project.name}
                  </h3>
                  {isSelected && (
                    <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-[var(--accent-cyan)] mt-1.5" />
                  )}
                </div>

                {/* Meta row: products count + billing badge */}
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Products count */}
                  <span className="flex items-center gap-1 text-[10px] text-[var(--text-muted)]">
                    <Package />
                    {projectDeliverables.length} produit{projectDeliverables.length !== 1 ? 's' : ''}
                  </span>

                  {/* Billing badge — only show if there's meaningful billing info */}
                  {billing.status !== 'none' && (
                    <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${billingColor.bg} ${billingColor.text}`}>
                      {billingLabel}
                    </span>
                  )}
                </div>

                {/* Progress bar — only when quote exists */}
                {billing.status !== 'none' && billing.progressPercent > 0 && (
                  <div className="mt-2 h-1 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[var(--accent-cyan)] transition-all"
                      style={{ width: `${Math.min(100, billing.progressPercent)}%` }}
                    />
                  </div>
                )}
              </button>
            );
          })}

          {/* Divers group: orphan deliverables not attached to any project */}
          {showDiversGroup && (
            <div
              className="text-left p-4 rounded-xl border border-dashed border-[var(--border-subtle)]
                         bg-[var(--bg-card)]/50 opacity-70"
              title="Produits sans projet — créez un projet pour les organiser"
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <h3 className="text-sm font-semibold truncate flex-1 text-[var(--text-muted)]">
                  Divers
                </h3>
                <span className="text-[var(--text-muted)] flex-shrink-0 mt-0.5">
                  <Archive />
                </span>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-[var(--text-muted)]">
                <Package />
                {orphanDeliverables.length} produit{orphanDeliverables.length !== 1 ? 's' : ''} sans projet
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

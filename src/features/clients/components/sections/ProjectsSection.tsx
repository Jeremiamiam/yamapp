'use client';

import { useAppStore } from '@/lib/store';
import { useClient, useModal } from '@/hooks';
import { computeProjectBilling, formatEuro, PROJECT_BILLING_LABELS, PROJECT_BILLING_COLORS } from '@/lib/project-billing';
import type { ProjectBillingStatus } from '@/types';

const Folder = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </svg>
);

const Plus = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

interface ProjectsSectionProps {
  clientId: string;
}

export function ProjectsSection({ clientId }: ProjectsSectionProps) {
  const { getProjectsByClientId, getDeliverablesByProjectId, deliverables } = useAppStore();
  const client = useClient(clientId);
  const { openProjectModal } = useModal();
  const projects = client ? getProjectsByClientId(client.id) : [];

  if (!client) return null;

  return (
    <div className="bg-[var(--bg-card)] rounded-xl sm:rounded-2xl border border-[var(--border-subtle)] overflow-hidden">
      <div className="px-4 sm:px-5 py-4 border-b border-[var(--border-subtle)] flex items-center gap-2">
        <Folder />
        <h2 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider">
          Projets
        </h2>
        <span className="text-xs text-[var(--text-muted)] bg-[var(--bg-tertiary)] px-2 py-0.5 rounded-full">
          {projects.length}
        </span>
        <button
          onClick={() => openProjectModal(clientId)}
          className="ml-auto p-1.5 rounded-lg bg-[var(--accent-cyan)]/10 text-[var(--accent-cyan)] hover:bg-[var(--accent-cyan)]/20 transition-colors"
          title="Ajouter un projet"
        >
          <Plus />
        </button>
      </div>
      <div className="divide-y divide-[var(--border-subtle)]">
        {projects.length === 0 ? (
          <button
            onClick={() => openProjectModal(clientId)}
            className="w-full px-5 py-8 text-center text-[var(--text-muted)] text-sm hover:bg-[var(--bg-secondary)] hover:text-[var(--accent-cyan)] transition-colors"
          >
            + Ajouter un projet
          </button>
        ) : (
          projects.map((project) => {
            const projectDeliverables = getDeliverablesByProjectId(project.id);
            const billing = computeProjectBilling(project, deliverables);
            const colors = PROJECT_BILLING_COLORS[billing.status as ProjectBillingStatus];
            return (
              <button
                key={project.id}
                type="button"
                onClick={() => openProjectModal(undefined, project)}
                className="w-full px-5 py-4 text-left hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-[var(--text-primary)] text-sm truncate flex-1">
                    {project.name}
                  </span>
                  {billing.status !== 'none' && (
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0 ${colors.bg} ${colors.text}`}>
                      {PROJECT_BILLING_LABELS[billing.status as ProjectBillingStatus]}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--text-muted)]">
                  <span>{projectDeliverables.length} produit{projectDeliverables.length !== 1 ? 's' : ''}</span>
                  {project.quoteAmount != null && project.quoteAmount > 0 && (
                    <span className="tabular-nums">
                      {formatEuro(billing.totalPaid)} / {formatEuro(project.quoteAmount)}
                    </span>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

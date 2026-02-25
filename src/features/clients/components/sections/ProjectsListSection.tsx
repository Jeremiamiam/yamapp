'use client';

import { useState } from 'react';
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

const ChevronDown = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);

const ChevronUp = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="18 15 12 9 6 15"/>
  </svg>
);

const GripVertical = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/>
    <circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/>
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
  const assignDeliverableToProject = useAppStore((s) => s.assignDeliverableToProject);
  const { openProjectModal, openDeliverableModal } = useModal();

  const [diversOpen, setDiversOpen] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overProjectId, setOverProjectId] = useState<string | null>(null);

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

  const isDragging = draggingId !== null;

  return (
    <div className="p-3 sm:p-4 md:p-6">
      {/* Section header */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="text-[var(--text-muted)]"><Folder /></span>
        <h2 className="text-xs sm:text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider flex-1 min-w-0">
          Projets
        </h2>
        <span className="text-[10px] sm:text-xs text-[var(--text-muted)] bg-[var(--bg-tertiary)] px-2 py-0.5 rounded-full">
          {projects.length}
        </span>
        <button
          type="button"
          onClick={() => openProjectModal(client.id)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-[var(--accent-cyan)]/10 text-[var(--accent-cyan)] hover:bg-[var(--accent-cyan)]/20 transition-colors flex-shrink-0"
          title="Nouveau projet"
        >
          <Plus />
          <span className="hidden sm:inline">Nouveau projet</span>
        </button>
      </div>

      {/* Empty state */}
      {projects.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 sm:py-16 px-4 text-center">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
          {projects.map((project) => {
            const projectDeliverables = deliverables.filter((d) => d.projectId === project.id);
            const billing = computeProjectBilling(project, deliverables);
            const isSelected = selectedProjectId === project.id;
            const billingLabel = PROJECT_BILLING_LABELS[billing.status];
            const billingColor = PROJECT_BILLING_COLORS[billing.status];
            const isDropTarget = overProjectId === project.id;
            const isOtherCard = isDragging && !isDropTarget;

            return (
              <div
                key={project.id}
                className={`
                  relative text-left p-3 sm:p-4 rounded-xl border transition-all cursor-pointer
                  bg-[var(--bg-card)]
                  ${isDropTarget
                    ? 'border-[var(--accent-cyan)] ring-2 ring-[var(--accent-cyan)]/40 bg-[var(--accent-cyan)]/5'
                    : isSelected
                      ? 'border-[var(--accent-cyan)] ring-1 ring-[var(--accent-cyan)]/40 shadow-[0_0_0_1px_var(--accent-cyan)]/20'
                      : 'border-[var(--border-subtle)] hover:border-[var(--accent-cyan)]/40 hover:bg-[var(--bg-secondary)]'
                  }
                  ${isOtherCard ? 'opacity-60' : ''}
                `}
                onClick={() => !isDragging && onSelectProject(project.id)}
                onDragOver={isDragging ? (e) => { e.preventDefault(); setOverProjectId(project.id); } : undefined}
                onDragLeave={isDragging ? () => setOverProjectId(null) : undefined}
                onDrop={isDragging ? (e) => {
                  e.preventDefault();
                  const id = e.dataTransfer.getData('text/plain');
                  if (id) assignDeliverableToProject(id, project.id);
                  setDraggingId(null);
                  setOverProjectId(null);
                } : undefined}
              >
                {/* Drop hint overlay */}
                {isDropTarget && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-xl pointer-events-none">
                    <span className="text-[10px] font-bold text-[var(--accent-cyan)] bg-[var(--accent-cyan)]/10 px-2 py-1 rounded-full border border-[var(--accent-cyan)]/30">
                      ↓ Déposer ici
                    </span>
                  </div>
                )}

                {/* Project name */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h3 className={`text-sm font-semibold truncate flex-1 ${isSelected || isDropTarget ? 'text-[var(--accent-cyan)]' : 'text-[var(--text-primary)]'}`}>
                    {project.name}
                  </h3>
                  {isSelected && !isDropTarget && (
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
              </div>
            );
          })}

          {/* Divers group: orphan deliverables not attached to any project */}
          {showDiversGroup && (
            <div
              className={`
                text-left p-3 sm:p-4 rounded-xl border border-dashed transition-all
                bg-[var(--bg-card)]/50
                ${selectedProjectId === '__divers__'
                  ? 'border-[var(--accent-amber)] ring-1 ring-[var(--accent-amber)]/40'
                  : 'border-[var(--border-subtle)] hover:border-[var(--accent-amber)]/40'
                }
                ${isDragging ? 'opacity-40' : ''}
              `}
            >
              {/* Header row */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => onSelectProject('__divers__')}
                  className="flex-1 text-left min-w-0"
                >
                  <h3 className={`text-sm font-semibold truncate ${selectedProjectId === '__divers__' ? 'text-[var(--accent-amber)]' : 'text-[var(--text-muted)]'}`}>
                    Divers
                  </h3>
                </button>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span className="text-[var(--text-muted)] mt-0.5">
                    <Archive />
                  </span>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setDiversOpen((v) => !v); }}
                    className="text-[var(--text-muted)] hover:text-[var(--accent-amber)] transition-colors p-0.5 rounded"
                    title={diversOpen ? 'Réduire' : 'Voir les produits'}
                  >
                    {diversOpen ? <ChevronUp /> : <ChevronDown />}
                  </button>
                </div>
              </div>

              {/* Product count */}
              <div className="flex items-center gap-1 text-[10px] text-[var(--text-muted)]">
                <Package />
                {orphanDeliverables.length} produit{orphanDeliverables.length !== 1 ? 's' : ''} sans projet
              </div>

              {/* Expanded orphan list */}
              {diversOpen && (
                <div className="mt-3 pt-3 border-t border-dashed border-[var(--border-subtle)] space-y-1">
                  {orphanDeliverables.map((d) => (
                    <div
                      key={d.id}
                      className={`
                        flex items-center gap-2 px-2 py-1.5 rounded-lg
                        hover:bg-[var(--bg-secondary)] transition-colors group
                        ${draggingId === d.id ? 'opacity-40' : ''}
                      `}
                    >
                      <span
                        draggable
                        onDragStart={(e) => {
                          setDraggingId(d.id);
                          e.dataTransfer.setData('text/plain', d.id);
                          e.dataTransfer.effectAllowed = 'move';
                        }}
                        onDragEnd={() => { setDraggingId(null); setOverProjectId(null); }}
                        className="text-[var(--text-muted)] flex-shrink-0 cursor-grab active:cursor-grabbing p-0.5 -m-0.5 rounded hover:bg-[var(--bg-tertiary)]"
                        title="Glisser vers un projet"
                      >
                        <GripVertical />
                      </span>
                      <button
                        type="button"
                        onClick={() => openDeliverableModal(client.id, d)}
                        className="text-[11px] text-[var(--text-primary)] flex-1 truncate text-left hover:text-[var(--accent-cyan)] transition-colors cursor-pointer"
                        title="Ouvrir pour modifier ou supprimer"
                      >
                        {d.name}
                      </button>
                      {d.type && (
                        <span className="text-[9px] font-medium text-[var(--text-muted)] bg-[var(--bg-tertiary)] px-1.5 py-0.5 rounded flex-shrink-0">
                          {d.type}
                        </span>
                      )}
                    </div>
                  ))}
                  <p className="text-[9px] text-[var(--text-muted)] opacity-60 pt-1 text-center">
                    Glisser le grip vers un projet pour assigner · clic sur le nom pour modifier
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

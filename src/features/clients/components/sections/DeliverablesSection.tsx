'use client';

import { useMemo } from 'react';
import { useAppStore } from '@/lib/store';
import { useClient, useModal } from '@/hooks';
import { formatDateShort } from '@/lib/date-utils';
import { getStatusStyle } from '@/lib/styles';
import type { Deliverable } from '@/types';

const Package = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/>
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
    <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
    <line x1="12" y1="22.08" x2="12" y2="12"/>
  </svg>
);

const Plus = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const Folder = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </svg>
);

const FolderPlus = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    <line x1="12" y1="11" x2="12" y2="17" />
    <line x1="9" y1="14" x2="15" y2="14" />
  </svg>
);

const formatEur = (n?: number) =>
  n != null ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n) : null;

interface DeliverablesSectionProps {
  clientId: string;
}

type ProjectGroup = { type: 'project'; projectId: string; projectName: string; items: Deliverable[] };
type OrphanGroup = { type: 'orphan'; items: Deliverable[] };

function sortDeliverables(items: Deliverable[]) {
  return [...items].sort((a, b) => {
    if (a.dueDate == null && b.dueDate == null) return 0;
    if (a.dueDate == null) return 1;
    if (b.dueDate == null) return -1;
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });
}

export function DeliverablesSection({ clientId }: DeliverablesSectionProps) {
  const { getDeliverablesByClientId, getTeamMemberById, projects } = useAppStore();
  const client = useClient(clientId);
  const { openDeliverableModal, openProjectModal } = useModal();
  const deliverables = client ? getDeliverablesByClientId(client.id) : [];

  const groups = useMemo((): (ProjectGroup | OrphanGroup)[] => {
    if (!client) return [];
    const clientProjects = projects.filter((p) => p.clientId === client.id);
    const result: (ProjectGroup | OrphanGroup)[] = [];
    const withProject: Deliverable[] = [];
    const withoutProject: Deliverable[] = [];
    deliverables.forEach((d) => {
      if (d.projectId) withProject.push(d);
      else withoutProject.push(d);
    });
    clientProjects.forEach((proj) => {
      const items = withProject.filter((d) => d.projectId === proj.id);
      if (items.length > 0) {
        result.push({ type: 'project', projectId: proj.id, projectName: proj.name, items: sortDeliverables(items) });
      }
    });
    if (withoutProject.length > 0) {
      result.push({ type: 'orphan', items: sortDeliverables(withoutProject) });
    }
    return result;
  }, [client, projects, deliverables]);

  if (!client) return null;

  return (
    <div className="bg-[var(--bg-card)] rounded-xl sm:rounded-2xl border border-[var(--border-subtle)] overflow-hidden">
      <div className="px-4 sm:px-5 py-4 border-b border-[var(--border-subtle)] flex items-center gap-2">
        <Package />
        <h2 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider">
          Produits
        </h2>
        <span className="text-xs text-[var(--text-muted)] bg-[var(--bg-tertiary)] px-2 py-0.5 rounded-full">
          {deliverables.length}
        </span>
        <div className="ml-auto flex items-center gap-1">
          <button
            onClick={() => openProjectModal(clientId)}
            className="p-1.5 rounded-lg bg-[var(--accent-cyan)]/10 text-[var(--accent-cyan)] hover:bg-[var(--accent-cyan)]/20 transition-colors"
            title="Ajouter un projet"
          >
            <FolderPlus />
          </button>
          <button
            onClick={() => openDeliverableModal(clientId)}
            className="p-1.5 rounded-lg bg-[var(--accent-violet)]/10 text-[var(--accent-violet)] hover:bg-[var(--accent-violet)]/20 transition-colors"
            title="Ajouter un produit"
          >
            <Plus />
          </button>
        </div>
      </div>
      <div className="divide-y divide-[var(--border-subtle)]">
        {deliverables.length === 0 ? (
          <button
            onClick={() => openDeliverableModal(clientId)}
            className="w-full px-5 py-8 text-center text-[var(--text-muted)] text-sm hover:bg-[var(--bg-secondary)] hover:text-[var(--accent-violet)] transition-colors"
          >
            + Ajouter un produit
          </button>
        ) : groups.length === 0 ? (
          <div className="px-5 py-6 text-center text-xs text-[var(--text-muted)]">
            Aucun produit
          </div>
        ) : (
          groups.map((group) => (
            <div key={group.type === 'project' ? group.projectId : 'orphan'} className="py-2">
              {group.type === 'project' ? (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); openProjectModal(undefined, projects.find((p) => p.id === group.projectId)); }}
                  className="w-full flex items-center gap-2 px-5 py-2 text-left hover:bg-[var(--bg-secondary)]/50 transition-colors cursor-pointer"
                >
                  <span className="text-[var(--accent-cyan)]"><Folder /></span>
                  <span className="text-xs font-semibold text-[var(--accent-cyan)] uppercase tracking-wider">
                    {group.projectName}
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)]">
                    {group.items.length} produit{group.items.length !== 1 ? 's' : ''}
                  </span>
                </button>
              ) : (
                <div className="flex items-center gap-2 px-5 py-2">
                  <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                    Sans projet
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)]">
                    {group.items.length} produit{group.items.length !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
              <div className="border-t border-[var(--border-subtle)]">
                {group.items.map((d, index) => (
                  <ProductRow
                    key={d.id}
                    deliverable={d}
                    clientId={clientId}
                    onOpen={() => openDeliverableModal(clientId, d)}
                    getTeamMemberById={getTeamMemberById}
                    index={index}
                    indent={group.type === 'project'}
                    isLast={index === group.items.length - 1}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

interface ProductRowProps {
  deliverable: Deliverable;
  clientId: string;
  onOpen: () => void;
  getTeamMemberById: (id: string) => { name: string; color?: string } | null | undefined;
  index: number;
  indent: boolean;
  isLast?: boolean;
}

function ProductRow({ deliverable: d, clientId, onOpen, getTeamMemberById, index, indent, isLast = false }: ProductRowProps) {
  const statusStyle = getStatusStyle(d.status);
  const assignee = d.assigneeId ? getTeamMemberById(d.assigneeId) : null;
  const hasPrix = (d.prixFacturé != null && d.prixFacturé > 0) || (d.coutSousTraitance != null && d.coutSousTraitance > 0);

  const planningLabel = d.dueDate != null
    ? formatDateShort(d.dueDate)
    : 'Non planifié';
  const planningStyle = d.dueDate != null
    ? 'bg-[var(--accent-lime)]/15 text-[var(--accent-lime)]'
    : 'bg-[var(--text-muted)]/10 text-[var(--text-muted)]';

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(); } }}
      className={`
        px-5 py-3 hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer
        ${indent ? 'pl-10 border-l-2 border-[var(--accent-cyan)]/30' : ''}
        ${!isLast ? 'border-b border-[var(--border-subtle)]' : ''}
      `}
    >
      <div className="flex items-center gap-2 flex-wrap mb-1.5">
        <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${statusStyle.bg} ${statusStyle.text}`}>
          {statusStyle.label}
        </span>
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium ${planningStyle}`}>
          {d.dueDate != null && (
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          )}
          {planningLabel}
        </span>
      </div>
      <p className="font-medium text-[var(--text-primary)] text-sm">
        {d.name}
      </p>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-[var(--text-muted)]">
        {d.prixFacturé != null && d.prixFacturé > 0 && (
          <span className="text-[#22c55e]" title="Prix facturé">{formatEur(d.prixFacturé)}</span>
        )}
        {d.coutSousTraitance != null && d.coutSousTraitance > 0 && (
          <span className="text-[#ef4444]" title="Sous-traitance">− {formatEur(d.coutSousTraitance)}</span>
        )}
        {d.margePotentielle != null && d.margePotentielle > 0 && (
          <span className="text-[var(--accent-violet)]" title="Rentrée potentielle">{formatEur(d.margePotentielle)}</span>
        )}
        {!hasPrix && d.cost != null && <span className="text-[var(--accent-lime)]">{formatEur(d.cost)}</span>}
        {d.deliveredAt != null && (
          <span className="text-[var(--accent-lime)]">Livré le {formatDateShort(d.deliveredAt)}</span>
        )}
        {d.externalContractor != null && d.externalContractor !== '' && (
          <span>Prestataire: {d.externalContractor}</span>
        )}
        {assignee != null && <span>{assignee.name}</span>}
      </div>
    </div>
  );
}

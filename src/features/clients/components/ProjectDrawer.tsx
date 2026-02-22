'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Project, Client, Deliverable } from '@/types';
import {
  computeProjectBilling,
  formatEuro,
  PROJECT_BILLING_LABELS,
  PROJECT_BILLING_COLORS,
} from '@/lib/project-billing';
import { ProjectDrawerProductsTab } from './ProjectDrawerProductsTab';
import { ProjectDrawerDocsTab } from './ProjectDrawerDocsTab';
import { ProjectDrawerBillingTab } from './ProjectDrawerBillingTab';

// ─── Icons ────────────────────────────────────────────────────────────────────

const XIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// ─── Types ────────────────────────────────────────────────────────────────────

type DrawerTab = 'produits' | 'docs' | 'facturation';

interface ProjectDrawerProps {
  project: Project;
  client: Client;
  deliverables: Deliverable[];
  onClose: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ProjectDrawer({ project, client, deliverables, onClose }: ProjectDrawerProps) {
  const [activeTab, setActiveTab] = useState<DrawerTab>('produits');

  // Auto-select first product when project changes
  const projectDeliverables = useMemo(
    () => deliverables.filter((d) => d.projectId === project.id),
    [deliverables, project.id]
  );

  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    projectDeliverables[0]?.id ?? null
  );

  // Reset state when project changes (Pitfall 3: stale state between projects)
  useEffect(() => {
    setActiveTab('produits');
    setSelectedProductId(projectDeliverables[0]?.id ?? null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.id]);

  // Keyboard close on Escape
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Billing summary for header badge
  const billing = useMemo(
    () => computeProjectBilling(project, deliverables),
    [project, deliverables]
  );

  const tabs: { key: DrawerTab; label: string }[] = [
    { key: 'produits', label: 'Produits' },
    { key: 'docs', label: 'Docs' },
    { key: 'facturation', label: 'Facturation' },
  ];

  return (
    <>
      {/* Overlay semi-transparent cliquable */}
      <div
        className="absolute inset-0 bg-black/40 z-10 transition-opacity"
        onClick={onClose}
        aria-label="Fermer le drawer"
      />

      {/* Drawer glissant depuis la droite */}
      <div
        className="absolute inset-y-0 right-0 z-20 w-[820px] max-w-[90vw]
                   bg-[var(--bg-primary)] border-l-2 border-l-[var(--accent-cyan)]
                   flex flex-col transform transition-transform duration-200 ease-out"
        role="dialog"
        aria-modal="true"
        aria-label={`Projet : ${project.name}`}
      >
        {/* Header permanent */}
        <div
          className="flex-shrink-0 flex items-center justify-between px-4 py-3
                     border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)]/50"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-[var(--text-primary)] truncate">
                {project.name}
              </h2>
              {project.quoteAmount && project.quoteAmount > 0 ? (
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  {formatEuro(project.quoteAmount)}
                </p>
              ) : (
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  Facturation produit
                </p>
              )}
            </div>

            {/* Badge statut facturation */}
            {billing.status !== 'none' && (
              <span
                className={`flex-shrink-0 text-[10px] px-2 py-0.5 rounded-full font-medium
                           ${PROJECT_BILLING_COLORS[billing.status].bg}
                           ${PROJECT_BILLING_COLORS[billing.status].text}`}
              >
                {PROJECT_BILLING_LABELS[billing.status]}
              </span>
            )}
          </div>

          {/* Bouton fermeture */}
          <button
            type="button"
            onClick={onClose}
            className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg
                       text-[var(--text-secondary)] hover:text-[var(--text-primary)]
                       hover:bg-[var(--bg-tertiary)] transition-colors cursor-pointer ml-2"
            aria-label="Fermer"
          >
            <XIcon />
          </button>
        </div>

        {/* Tabs : Produits | Docs | Facturation */}
        <div className="flex-shrink-0 flex border-b border-[var(--border-subtle)] px-4">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-3 text-xs font-semibold uppercase tracking-wider border-b-2
                         transition-colors cursor-pointer -mb-px
                         ${
                           activeTab === tab.key
                             ? 'border-[var(--accent-cyan)] text-[var(--accent-cyan)]'
                             : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                         }`}
            >
              {tab.label}
              {tab.key === 'produits' && projectDeliverables.length > 0 && (
                <span className="ml-1.5 text-[9px] font-bold opacity-60">
                  {projectDeliverables.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Contenu des onglets */}
        <div className="flex-1 overflow-auto">
          {activeTab === 'produits' && (
            <ProjectDrawerProductsTab
              project={project}
              client={client}
              deliverables={deliverables}
              selectedProductId={selectedProductId}
              onSelectProduct={setSelectedProductId}
            />
          )}
          {activeTab === 'docs' && (
            <ProjectDrawerDocsTab
              project={project}
              client={client}
            />
          )}
          {activeTab === 'facturation' && (
            <ProjectDrawerBillingTab
              project={project}
              client={client}
              deliverables={deliverables}
            />
          )}
        </div>
      </div>
    </>
  );
}

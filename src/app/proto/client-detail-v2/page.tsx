'use client';

/**
 * PROTO — Layout Phase 11 : Sidebar + Main + ProjectDrawer
 * Mock data uniquement. Validation du layout avant migration vers ClientDetail.
 */

import { useState } from 'react';
import Link from 'next/link';

// ─── Mock Data ────────────────────────────────────────────────────────────────

interface MockContact { id: string; name: string; role: string; }
interface MockLink { id: string; title: string; url: string; }
interface MockDoc { id: string; type: string; title: string; }
interface MockProject { id: string; name: string; clientId: string; }
interface MockDeliverable { id: string; name: string; projectId?: string; status: string; dueDate?: string; }

const MOCK_CLIENT = {
  id: 'sms',
  name: 'SMS',
  status: 'client' as const,
};

const MOCK_CONTACTS: MockContact[] = [
  { id: 'c1', name: 'Sophie Martin', role: 'Directrice marketing' },
  { id: 'c2', name: 'Thomas Leroy', role: 'Chef de projet' },
];

const MOCK_LINKS: MockLink[] = [
  { id: 'l1', title: 'Figma', url: '#' },
  { id: 'l2', title: 'Site internet', url: '#' },
];

const MOCK_DOCS: MockDoc[] = [
  { id: 'd1', type: 'brief', title: 'Brief créatif Re-branding' },
  { id: 'd2', type: 'report', title: 'CR Réunion 15 janv.' },
];

const MOCK_PROJECTS: MockProject[] = [
  { id: 'pr1', name: 'Re-branding 2026', clientId: 'sms' },
  { id: 'pr2', name: 'Communication interne', clientId: 'sms' },
];

const MOCK_DELIVERABLES: MockDeliverable[] = [
  { id: 'dl1', name: 'Direction artistique', projectId: 'pr1', status: 'completed', dueDate: '2026-02-15' },
  { id: 'dl2', name: 'Création pitch deck', projectId: 'pr1', status: 'in-progress', dueDate: '2026-03-01' },
  { id: 'dl3', name: 'Site pré-lancement', projectId: 'pr1', status: 'pending', dueDate: '2026-03-15' },
  { id: 'dl4', name: 'Charte éditoriale', projectId: 'pr2', status: 'pending' },
  { id: 'dl5', name: 'Cartes de visite', status: 'completed', dueDate: '2026-01-20' },
];

const MOCK_PROJECT_DOCS: Record<string, MockDoc[]> = {
  pr1: [
    { id: 'pd1', type: 'report', title: 'CR Atelier stratégie' },
    { id: 'pd2', type: 'brief', title: 'Brief web pré-lancement' },
  ],
  pr2: [
    { id: 'pd3', type: 'note', title: 'Notes réunion interne' },
  ],
};

// ─── Icons ────────────────────────────────────────────────────────────────────

const ArrowLeft = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M12 19l-7-7 7-7"/>
  </svg>
);

const User = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

const LinkIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
  </svg>
);

const File = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
    <line x1="10" y1="9" x2="8" y2="9"/>
  </svg>
);

const Folder = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </svg>
);

const Package = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/>
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
    <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
  </svg>
);

const X = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const BarChart = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"/>
    <line x1="12" y1="20" x2="12" y2="4"/>
    <line x1="6" y1="20" x2="6" y2="14"/>
  </svg>
);

// ─── Section Card ─────────────────────────────────────────────────────────────

function SectionCard({ icon: Icon, title, count, children }: { icon: React.ElementType; title: string; count?: number; children: React.ReactNode }) {
  return (
    <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-subtle)] overflow-hidden">
      <div className="px-4 py-3 border-b border-[var(--border-subtle)] flex items-center gap-2">
        <Icon />
        <h3 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider">{title}</h3>
        {count != null && (
          <span className="text-xs text-[var(--text-muted)] bg-[var(--bg-tertiary)] px-2 py-0.5 rounded-full">{count}</span>
        )}
      </div>
      <div className="divide-y divide-[var(--border-subtle)]">{children}</div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ClientDetailV2ProtoPage() {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const selectedProject = selectedProjectId ? MOCK_PROJECTS.find(p => p.id === selectedProjectId) : null;
  const projectDeliverables = selectedProjectId ? MOCK_DELIVERABLES.filter(d => d.projectId === selectedProjectId) : [];
  const projectDocs = selectedProjectId ? (MOCK_PROJECT_DOCS[selectedProjectId] ?? []) : [];

  const projectsWithDeliverables = MOCK_PROJECTS.map(p => ({
    ...p,
    items: MOCK_DELIVERABLES.filter(d => d.projectId === p.id),
  })).filter(p => p.items.length > 0);
  const orphanDeliverables = MOCK_DELIVERABLES.filter(d => !d.projectId);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-primary)]">
      {/* Header */}
      <div className="flex-shrink-0 px-4 sm:px-6 py-4 border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)]/50">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors group"
          >
            <span className="group-hover:-translate-x-0.5 transition-transform">
              <ArrowLeft />
            </span>
            <span className="text-xs font-medium">Retour</span>
          </Link>
          <h1 className="text-xl font-semibold text-[var(--text-primary)] truncate">{MOCK_CLIENT.name}</h1>
          <span className="flex-shrink-0 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[var(--accent-cyan)]/20 text-[var(--accent-cyan)]">
            Client
          </span>
          <span className="ml-2 text-[var(--accent-violet)]/60 text-[10px] uppercase tracking-wider">· proto</span>
        </div>
      </div>

      {/* Content: Sidebar + Main */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Sidebar */}
        <aside className="flex-shrink-0 w-72 xl:w-80 border-r border-[var(--border-subtle)] bg-[var(--bg-secondary)]/30 overflow-y-auto overflow-x-hidden">
          <div className="p-4 space-y-6">
            <SectionCard icon={User} title="Contacts" count={MOCK_CONTACTS.length}>
              {MOCK_CONTACTS.map(c => (
                <div key={c.id} className="px-4 py-2.5">
                  <span className="font-semibold text-[var(--text-primary)]">{c.name}</span>
                  <span className="text-xs text-[var(--text-muted)] ml-2">{c.role}</span>
                </div>
              ))}
            </SectionCard>

            <SectionCard icon={LinkIcon} title="Liens" count={MOCK_LINKS.length}>
              {MOCK_LINKS.map(l => (
                <a key={l.id} href={l.url} className="block px-4 py-2.5 text-[var(--accent-cyan)] hover:underline truncate">
                  {l.title}
                </a>
              ))}
            </SectionCard>

            <SectionCard icon={File} title="Documents" count={MOCK_DOCS.length}>
              {MOCK_DOCS.map(d => (
                <div key={d.id} className="px-4 py-2.5 text-sm text-[var(--text-primary)] truncate">
                  {d.title}
                </div>
              ))}
            </SectionCard>

            <SectionCard icon={BarChart} title="Rétroplanning">
              <div className="px-4 py-6 text-center text-xs text-[var(--text-muted)]">
                Gantt simplifié (placeholder)
              </div>
            </SectionCard>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 min-w-0 overflow-y-auto p-4 sm:p-6">
          <div className="max-w-6xl space-y-6">
            {/* Projets */}
            <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-subtle)] overflow-hidden">
              <div className="px-4 py-4 border-b border-[var(--border-subtle)] flex items-center gap-2">
                <Folder />
                <h2 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider">Projets</h2>
                <span className="text-xs text-[var(--text-muted)] bg-[var(--bg-tertiary)] px-2 py-0.5 rounded-full">
                  {MOCK_PROJECTS.length}
                </span>
              </div>
              <div className="divide-y divide-[var(--border-subtle)]">
                {projectsWithDeliverables.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedProjectId(p.id)}
                    className="w-full px-5 py-4 text-left hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-[var(--text-primary)] text-sm truncate flex-1">{p.name}</span>
                      <span className="text-xs text-[var(--text-muted)]">
                        {p.items.length} produit{p.items.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Produits groupés */}
            <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-subtle)] overflow-hidden">
              <div className="px-4 py-4 border-b border-[var(--border-subtle)] flex items-center gap-2">
                <Package />
                <h2 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider">Produits</h2>
                <span className="text-xs text-[var(--text-muted)] bg-[var(--bg-tertiary)] px-2 py-0.5 rounded-full">
                  {MOCK_DELIVERABLES.length}
                </span>
              </div>
              <div className="divide-y divide-[var(--border-subtle)]">
                {projectsWithDeliverables.map(p => (
                  <div key={p.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedProjectId(p.id)}
                      className="w-full flex items-center gap-2 px-5 py-2 text-left hover:bg-[var(--bg-secondary)]/50 transition-colors cursor-pointer"
                    >
                      <span className="text-[var(--accent-cyan)]"><Folder /></span>
                      <span className="text-xs font-semibold text-[var(--accent-cyan)] uppercase tracking-wider">
                        {p.name}
                      </span>
                      <span className="text-[10px] text-[var(--text-muted)]">{p.items.length} produit{p.items.length !== 1 ? 's' : ''}</span>
                    </button>
                    <div className="border-t border-[var(--border-subtle)]">
                      {p.items.map(d => (
                        <div key={d.id} className="px-5 py-2.5 flex items-center justify-between">
                          <span className="text-sm text-[var(--text-primary)]">{d.name}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${d.status === 'completed' ? 'bg-[var(--accent-lime)]/20 text-[var(--accent-lime)]' : d.status === 'in-progress' ? 'bg-[var(--accent-cyan)]/20 text-[var(--accent-cyan)]' : 'bg-[var(--text-muted)]/20 text-[var(--text-muted)]'}`}>
                            {d.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {orphanDeliverables.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 px-5 py-2">
                      <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Sans projet</span>
                      <span className="text-[10px] text-[var(--text-muted)]">{orphanDeliverables.length} produit{orphanDeliverables.length !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="border-t border-[var(--border-subtle)]">
                      {orphanDeliverables.map(d => (
                        <div key={d.id} className="px-5 py-2.5 text-sm text-[var(--text-primary)]">{d.name}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>

        {/* ProjectDrawer proto */}
        {selectedProject && (
          <div
            className="fixed inset-y-0 right-0 w-full sm:w-[420px] lg:w-[480px] max-w-[95vw] z-50 bg-[var(--bg-primary)] border-l border-[var(--border-subtle)] shadow-xl flex flex-col"
            role="dialog"
            aria-label="Détail projet"
          >
            <div className="flex-shrink-0 px-4 py-4 border-b border-[var(--border-subtle)] flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[var(--text-primary)] truncate">{selectedProject.name}</h2>
              <button
                type="button"
                onClick={() => setSelectedProjectId(null)}
                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] transition-colors"
                aria-label="Fermer"
              >
                <X />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              <SectionCard icon={Package} title="Produits" count={projectDeliverables.length}>
                {projectDeliverables.map(d => (
                  <div key={d.id} className="px-4 py-2.5 text-sm text-[var(--text-primary)]">{d.name}</div>
                ))}
              </SectionCard>
              <SectionCard icon={File} title="Documents projet" count={projectDocs.length}>
                {projectDocs.map(d => (
                  <div key={d.id} className="px-4 py-2.5 text-sm text-[var(--text-primary)]">{d.title}</div>
                ))}
              </SectionCard>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

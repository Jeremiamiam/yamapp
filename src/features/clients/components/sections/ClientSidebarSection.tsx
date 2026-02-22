'use client';

import { useModal } from '@/hooks';
import { PlaudLogo } from '@/components/ui';
import type { Client, DocumentType } from '@/types';

// ─── Icons ───────────────────────────────────────────────────────────────────

const User = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

const LinkIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
  </svg>
);

const FileText = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
    <polyline points="10 9 9 9 8 9"/>
  </svg>
);

const Plus = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

// ─── Document badge colors per type ──────────────────────────────────────────

const DOC_TYPE_BADGE: Record<DocumentType, { label: string; color: string; bg: string }> = {
  'brief':             { label: 'Brief',     color: 'text-[var(--accent-cyan)]',    bg: 'bg-[var(--accent-cyan)]/15' },
  'report':            { label: 'Report',    color: 'text-[var(--accent-amber)]',   bg: 'bg-[var(--accent-amber)]/15' },
  'note':              { label: 'Note',      color: 'text-[var(--accent-lime)]',    bg: 'bg-[var(--accent-lime)]/15' },
  'creative-strategy': { label: 'Stratégie', color: 'text-[var(--accent-violet)]',  bg: 'bg-[var(--accent-violet)]/15' },
  'web-brief':         { label: 'Web Brief', color: 'text-[var(--accent-coral)]',   bg: 'bg-[var(--accent-coral)]/15' },
  'social-brief':      { label: 'Social',    color: 'text-[var(--accent-magenta)]', bg: 'bg-[var(--accent-magenta)]/15' },
};

// ─── Section header ───────────────────────────────────────────────────────────

function SidebarSectionHeader({
  icon: Icon,
  title,
  count,
  onAdd,
  addTitle,
}: {
  icon: React.ElementType;
  title: string;
  count?: number;
  onAdd?: () => void;
  addTitle?: string;
}) {
  return (
    <div className="flex items-center gap-2 px-3 py-2.5 border-b border-[var(--border-subtle)]">
      <span className="text-[var(--text-muted)]"><Icon /></span>
      <span className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider flex-1">
        {title}
      </span>
      {count != null && (
        <span className="text-[10px] text-[var(--text-muted)] bg-[var(--bg-tertiary)] px-1.5 py-0.5 rounded-full">
          {count}
        </span>
      )}
      {onAdd && (
        <button
          type="button"
          onClick={onAdd}
          title={addTitle}
          className="p-1 rounded text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition-colors"
        >
          <Plus />
        </button>
      )}
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface ClientSidebarSectionProps {
  client: Client;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function ClientSidebarSection({ client }: ClientSidebarSectionProps) {
  const { openContactModal, openDocumentModal, openReportUploadModal } = useModal();

  // Only documents that are NOT attached to a project
  const clientDocuments = client.documents.filter((d) => !d.projectId);
  const links = client.links ?? [];

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-[var(--bg-secondary)]/30">

      {/* ── Contacts ────────────────────────────────────────────────────────── */}
      <div className="border-b border-[var(--border-subtle)]">
        <SidebarSectionHeader
          icon={User}
          title="Contacts"
          count={client.contacts.length}
          onAdd={() => openContactModal(client.id)}
          addTitle="Ajouter un contact"
        />
        <div className="divide-y divide-[var(--border-subtle)]">
          {client.contacts.length === 0 ? (
            <button
              type="button"
              onClick={() => openContactModal(client.id)}
              className="w-full px-3 py-4 text-center text-xs text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] hover:text-[var(--accent-cyan)] transition-colors"
            >
              + Ajouter un contact
            </button>
          ) : (
            client.contacts.map((contact) => (
              <button
                key={contact.id}
                type="button"
                onClick={() => openContactModal(client.id, contact)}
                className="w-full text-left px-3 py-2 flex items-baseline gap-2 hover:bg-[var(--bg-secondary)] transition-colors group"
              >
                <span className="text-xs font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent-cyan)] transition-colors truncate">
                  {contact.name}
                </span>
                {contact.role && (
                  <span className="text-[10px] text-[var(--text-muted)] truncate flex-shrink-0">
                    {contact.role}
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* ── Liens ───────────────────────────────────────────────────────────── */}
      <div className="border-b border-[var(--border-subtle)]">
        <SidebarSectionHeader
          icon={LinkIcon}
          title="Liens"
          count={links.length}
          onAdd={() => openDocumentModal(client.id)}
          addTitle="Ajouter un lien"
        />
        <div className="divide-y divide-[var(--border-subtle)]">
          {links.length === 0 ? (
            <p className="px-3 py-4 text-xs text-center text-[var(--text-muted)]">Aucun lien</p>
          ) : (
            links.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block px-3 py-2 text-xs text-[var(--accent-violet)] hover:text-[var(--accent-cyan)] hover:underline truncate transition-colors"
                title={link.url}
              >
                {link.title}
              </a>
            ))
          )}
        </div>
      </div>

      {/* ── Documents client ────────────────────────────────────────────────── */}
      <div className="flex-1">
        <SidebarSectionHeader
          icon={FileText}
          title="Documents"
          count={clientDocuments.length}
          addTitle="Ajouter un document"
        />

        {/* Import PLAUD button — creates a client doc (no projectId) */}
        <div className="px-3 py-2 border-b border-[var(--border-subtle)]">
          <button
            type="button"
            onClick={() => openReportUploadModal(client.id)}
            className="w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold bg-[var(--accent-violet)]/10 text-[var(--accent-violet)] hover:bg-[var(--accent-violet)]/20 transition-colors"
            title="Importer un enregistrement PLAUD"
          >
            <PlaudLogo className="w-3 h-3" />
            Import PLAUD
          </button>
        </div>

        <div className="divide-y divide-[var(--border-subtle)]">
          {clientDocuments.length === 0 ? (
            <button
              type="button"
              onClick={() => openDocumentModal(client.id)}
              className="w-full px-3 py-4 text-center text-xs text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] hover:text-[var(--accent-amber)] transition-colors"
            >
              + Ajouter un document
            </button>
          ) : (
            clientDocuments.map((doc) => {
              const badge = DOC_TYPE_BADGE[doc.type] ?? DOC_TYPE_BADGE['note'];
              return (
                <div
                  key={doc.id}
                  className="px-3 py-2 flex items-center gap-2 hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer"
                >
                  <span className={`flex-shrink-0 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${badge.bg} ${badge.color}`}>
                    {badge.label}
                  </span>
                  <span className="text-xs text-[var(--text-primary)] truncate flex-1">
                    {doc.title}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useModal } from '@/hooks';
import { useAppStore } from '@/lib/store';
import { PlaudLogo } from '@/components/ui';
import { LINK_SUGGESTED_LABELS } from '@/types';
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
  'link':              { label: 'Lien',     color: 'text-[var(--accent-coral)]',   bg: 'bg-[var(--accent-coral)]/15' },
  'creative-strategy': { label: 'Stratégie', color: 'text-[var(--accent-violet)]',  bg: 'bg-[var(--accent-violet)]/15' },
  'web-brief':         { label: 'Web Brief', color: 'text-[var(--accent-coral)]',   bg: 'bg-[var(--accent-coral)]/15' },
  'social-brief':      { label: 'Social',    color: 'text-[var(--accent-magenta)]', bg: 'bg-[var(--accent-magenta)]/15' },
};

// ─── SectionCard ─────────────────────────────────────────────────────────────

function SectionCard({
  icon: Icon,
  title,
  count,
  onAdd,
  addTitle,
  accentColor = 'var(--accent-cyan)',
  children,
}: {
  icon: React.ElementType;
  title: string;
  count?: number;
  onAdd?: () => void;
  addTitle?: string;
  accentColor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] overflow-hidden">
      {/* Card header */}
      <div className="flex items-center gap-2 px-3 py-2.5" style={{ borderBottom: `1px solid color-mix(in srgb, ${accentColor} 15%, transparent)` }}>
        <span style={{ color: accentColor }}><Icon /></span>
        <span className="text-[10px] font-bold uppercase tracking-wider flex-1" style={{ color: accentColor }}>
          {title}
        </span>
        {count != null && (
          <span className="text-[10px] text-[var(--text-muted)] bg-[var(--bg-tertiary)] px-1.5 py-0.5 rounded-full font-medium">
            {count}
          </span>
        )}
        {onAdd && (
          <button
            type="button"
            onClick={onAdd}
            title={addTitle}
            className="p-1 rounded-md transition-colors cursor-pointer"
            style={{ color: accentColor }}
          >
            <Plus />
          </button>
        )}
      </div>
      {/* Card body */}
      <div>{children}</div>
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

const CalendarRange = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

interface ClientSidebarSectionProps {
  client: Client;
  onRetroClick?: () => void;
  retroOpen?: boolean;
}

// ─── Component ───────────────────────────────────────────────────────────────

const TrashIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
    <line x1="10" y1="11" x2="10" y2="17"/>
    <line x1="14" y1="11" x2="14" y2="17"/>
  </svg>
);

export function ClientSidebarSection({ client, onRetroClick, retroOpen }: ClientSidebarSectionProps) {
  const { openContactModal, openDocumentModal, openReportUploadModal } = useModal();
  const openDocument = useAppStore((state) => state.openDocument);
  const deleteDocument = useAppStore((state) => state.deleteDocument);
  const { addClientLink, deleteClientLink } = useAppStore();

  const clientDocuments = client.documents.filter((d) => !d.projectId);
  const links = client.links ?? [];

  // Inline link form state
  const [isAddingLink, setIsAddingLink] = useState(false);
  const [linkLabel, setLinkLabel] = useState<string>(LINK_SUGGESTED_LABELS[0]);
  const [linkCustomLabel, setLinkCustomLabel] = useState('');
  const [linkUrl, setLinkUrl] = useState('');

  const resetLinkForm = () => {
    setIsAddingLink(false);
    setLinkUrl('');
    setLinkCustomLabel('');
    setLinkLabel(LINK_SUGGESTED_LABELS[0]);
  };

  const handleAddLink = () => {
    const title = linkLabel === 'Autre' ? linkCustomLabel.trim() : linkLabel;
    if (title && linkUrl.trim()) {
      addClientLink(client.id, { title, url: linkUrl.trim() });
      resetLinkForm();
    }
  };

  return (
    <div className="flex flex-col gap-3 p-3 h-full overflow-y-auto">

      {/* ── Card Contacts ──────────────────────────────────────────────── */}
      <SectionCard
        icon={User}
        title="Contacts"
        count={client.contacts.length}
        onAdd={() => openContactModal(client.id)}
        addTitle="Ajouter un contact"
        accentColor="var(--accent-cyan)"
      >
        {client.contacts.length === 0 ? (
          <button
            type="button"
            onClick={() => openContactModal(client.id)}
            className="w-full px-3 py-3 text-center text-xs text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] hover:text-[var(--accent-cyan)] transition-colors cursor-pointer"
          >
            + Ajouter un contact
          </button>
        ) : (
          <div className="divide-y divide-[var(--border-subtle)]">
            {client.contacts.map((contact) => (
              <button
                key={contact.id}
                type="button"
                onClick={() => openContactModal(client.id, contact)}
                className="w-full text-left px-3 py-2 flex items-baseline gap-2 hover:bg-[var(--bg-secondary)] transition-colors group cursor-pointer"
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
            ))}
          </div>
        )}
      </SectionCard>

      {/* ── Card Liens ─────────────────────────────────────────────────── */}
      <SectionCard
        icon={LinkIcon}
        title="Liens"
        count={links.length}
        onAdd={() => setIsAddingLink(true)}
        addTitle="Ajouter un lien"
        accentColor="var(--accent-lime)"
      >
        {/* Inline add form */}
        {isAddingLink && (
          <div className="px-3 py-2.5 space-y-2 bg-[var(--bg-secondary)] border-b border-[var(--border-subtle)]">
            <select
              value={linkLabel}
              onChange={(e) => setLinkLabel(e.target.value)}
              className="w-full text-[10px] bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] rounded-lg px-2 py-1.5 text-[var(--text-primary)] focus:border-[var(--accent-lime)] focus:outline-none transition-colors"
            >
              {LINK_SUGGESTED_LABELS.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
              <option value="Autre">Autre</option>
            </select>
            {linkLabel === 'Autre' && (
              <input
                type="text"
                value={linkCustomLabel}
                onChange={(e) => setLinkCustomLabel(e.target.value)}
                placeholder="Label personnalisé"
                className="w-full text-[10px] bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] rounded-lg px-2 py-1.5 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-lime)] focus:outline-none transition-colors"
              />
            )}
            <input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://…"
              className="w-full text-[10px] bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] rounded-lg px-2 py-1.5 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-lime)] focus:outline-none transition-colors"
              onKeyDown={(e) => { if (e.key === 'Enter') handleAddLink(); }}
            />
            <div className="flex gap-1.5">
              <button
                type="button"
                disabled={!linkUrl.trim() || (linkLabel === 'Autre' && !linkCustomLabel.trim())}
                onClick={handleAddLink}
                className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-[var(--accent-lime)] text-[var(--bg-primary)] hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity cursor-pointer"
              >
                Ajouter
              </button>
              <button
                type="button"
                onClick={resetLinkForm}
                className="px-2.5 py-1 rounded-lg text-[10px] text-[var(--text-muted)] bg-[var(--bg-tertiary)] hover:bg-[var(--border-subtle)] transition-colors cursor-pointer"
              >
                Annuler
              </button>
            </div>
          </div>
        )}

        {links.length === 0 && !isAddingLink ? (
          <button
            type="button"
            onClick={() => setIsAddingLink(true)}
            className="w-full px-3 py-3 text-center text-xs text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] hover:text-[var(--accent-lime)] transition-colors cursor-pointer"
          >
            + Ajouter un lien
          </button>
        ) : (
          <div className="divide-y divide-[var(--border-subtle)]">
            {links.map((link) => (
              <div key={link.id} className="flex items-center group">
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 min-w-0 px-3 py-2 text-xs text-[var(--accent-lime)] hover:text-[var(--text-primary)] hover:underline truncate transition-colors"
                  title={link.url}
                >
                  {link.title}
                </a>
                <button
                  type="button"
                  onClick={() => deleteClientLink(client.id, link.id)}
                  className="flex-shrink-0 p-1 mr-2 rounded text-[var(--text-muted)] hover:text-[var(--accent-coral)] opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                  title="Supprimer"
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* ── Card Documents client ──────────────────────────────────────── */}
      <SectionCard
        icon={FileText}
        title="Documents"
        count={clientDocuments.length}
        onAdd={() => openDocumentModal(client.id)}
        addTitle="Ajouter un document"
        accentColor="var(--accent-amber)"
      >
        {/* Import PLAUD button */}
        <div className="px-3 py-2 border-b border-[var(--border-subtle)]">
          <button
            type="button"
            onClick={() => openReportUploadModal(client.id)}
            className="w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold bg-[var(--accent-violet)]/10 text-[var(--accent-violet)] hover:bg-[var(--accent-violet)]/20 transition-colors cursor-pointer"
            title="Importer un enregistrement PLAUD"
          >
            <PlaudLogo className="w-3 h-3" />
            Import PLAUD
          </button>
        </div>

        {clientDocuments.length === 0 ? (
          <button
            type="button"
            onClick={() => openDocumentModal(client.id)}
            className="w-full px-3 py-3 text-center text-xs text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] hover:text-[var(--accent-amber)] transition-colors cursor-pointer"
          >
            + Ajouter un document
          </button>
        ) : (
          <div className="divide-y divide-[var(--border-subtle)]">
            {clientDocuments.map((doc) => {
              const badge = DOC_TYPE_BADGE[doc.type] ?? DOC_TYPE_BADGE['note'];
              const handleClick = () => {
                if (doc.type === 'link' && doc.content.trim()) {
                  window.open(doc.content.trim(), '_blank');
                } else {
                  openDocument(doc);
                }
              };
              return (
                <div
                  key={doc.id}
                  className="group flex items-center gap-2 px-3 py-2 hover:bg-[var(--bg-secondary)] transition-colors"
                >
                  <button
                    type="button"
                    onClick={handleClick}
                    className="flex-1 min-w-0 flex items-center gap-2 text-left cursor-pointer"
                  >
                    <span className={`flex-shrink-0 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${badge.bg} ${badge.color}`}>
                      {badge.label}
                    </span>
                    <span className="text-xs text-[var(--text-primary)] truncate flex-1">
                      {doc.title}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(`Supprimer "${doc.title}" ?`)) {
                        deleteDocument(client.id, doc.id);
                      }
                    }}
                    className="flex-shrink-0 p-1 rounded text-[var(--text-muted)] hover:text-[var(--accent-coral)] hover:bg-[var(--accent-coral)]/10 opacity-60 group-hover:opacity-100 transition-colors"
                    title="Supprimer"
                  >
                    <TrashIcon />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>

      {/* ── Card Retroplanning ─────────────────────────────────────────── */}
      {onRetroClick && (
        <button
          type="button"
          onClick={onRetroClick}
          className={`w-full rounded-xl border overflow-hidden transition-colors cursor-pointer text-left
                     ${retroOpen
                       ? 'border-[var(--accent-amber)]/40 bg-[var(--accent-amber)]/5'
                       : 'border-[var(--border-subtle)] bg-[var(--bg-card)] hover:border-[var(--accent-amber)]/30'
                     }`}
        >
          <div className="flex items-center gap-2 px-3 py-2.5">
            <span className="text-[var(--accent-amber)]"><CalendarRange /></span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent-amber)] flex-1">
              Retroplanning
            </span>
            <svg
              width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              className={`text-[var(--accent-amber)] transition-transform ${retroOpen ? 'rotate-90' : ''}`}
            >
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </div>
        </button>
      )}
    </div>
  );
}

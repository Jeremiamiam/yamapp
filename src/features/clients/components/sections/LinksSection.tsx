'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { useClient } from '@/hooks';
import { LINK_SUGGESTED_LABELS } from '@/types';

const LinkIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
  </svg>
);

const Plus = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const Trash = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
    <line x1="10" y1="11" x2="10" y2="17"/>
    <line x1="14" y1="11" x2="14" y2="17"/>
  </svg>
);

const OTHER_LABEL = 'Autre';

interface LinksSectionProps {
  clientId: string;
}

export function LinksSection({ clientId }: LinksSectionProps) {
  const { addClientLink, deleteClientLink } = useAppStore();
  const client = useClient(clientId);
  const [isAddingLink, setIsAddingLink] = useState(false);
  const [linkLabelChoice, setLinkLabelChoice] = useState<string>(LINK_SUGGESTED_LABELS[0]);
  const [linkCustomLabel, setLinkCustomLabel] = useState('');
  const [linkUrl, setLinkUrl] = useState('');

  if (!client) return null;

  const links = client.links ?? [];

  return (
    <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-subtle)] overflow-hidden">
      <div className="px-5 py-4 border-b border-[var(--border-subtle)] flex items-center gap-2">
        <LinkIcon />
        <h2 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider">
          Liens
        </h2>
        <span className="text-xs text-[var(--text-muted)] bg-[var(--bg-tertiary)] px-2 py-0.5 rounded-full">
          {links.length}
        </span>
        {!isAddingLink && (
          <button
            onClick={() => setIsAddingLink(true)}
            className="ml-auto p-1.5 rounded-lg bg-[var(--accent-lime)]/10 text-[var(--accent-lime)] hover:bg-[var(--accent-lime)]/20 transition-colors"
            title="Ajouter une URL"
          >
            <Plus />
          </button>
        )}
      </div>
      <div className="divide-y divide-[var(--border-subtle)]">
        {links.map((link) => (
          <div
            key={link.id}
            className="px-5 py-3 flex items-center gap-3 group"
          >
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 min-w-0 flex items-center gap-2 text-sm text-[var(--text-primary)] hover:text-[var(--accent-cyan)] transition-colors truncate"
            >
              <span className="font-medium text-[var(--accent-violet)] shrink-0">{link.title}</span>
              <span className="truncate text-[var(--text-muted)]">
                {(() => {
                  try {
                    return new URL(link.url).hostname;
                  } catch {
                    return link.url;
                  }
                })()}
              </span>
            </a>
            <button
              type="button"
              onClick={() => deleteClientLink(clientId, link.id)}
              className="p-1.5 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
              title="Supprimer le lien"
            >
              <Trash />
            </button>
          </div>
        ))}
        {isAddingLink && (
          <div className="px-5 py-4 space-y-3 bg-[var(--bg-secondary)]">
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Label</label>
              <select
                value={linkLabelChoice}
                onChange={(e) => setLinkLabelChoice(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-cyan)]"
              >
                {LINK_SUGGESTED_LABELS.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
                <option value={OTHER_LABEL}>{OTHER_LABEL}</option>
              </select>
              {linkLabelChoice === OTHER_LABEL && (
                <input
                  type="text"
                  value={linkCustomLabel}
                  onChange={(e) => setLinkCustomLabel(e.target.value)}
                  placeholder="Ex: Drive, Moodboard…"
                  className="mt-2 w-full px-3 py-2 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-cyan)]"
                />
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">URL</label>
              <input
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://…"
                className="w-full px-3 py-2 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-cyan)]"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={
                  !linkUrl.trim() ||
                  (linkLabelChoice === OTHER_LABEL && !linkCustomLabel.trim())
                }
                onClick={() => {
                  const title = linkLabelChoice === OTHER_LABEL ? linkCustomLabel.trim() : linkLabelChoice;
                  if (title && linkUrl.trim()) {
                    addClientLink(clientId, { title, url: linkUrl.trim() });
                    setIsAddingLink(false);
                    setLinkUrl('');
                    setLinkCustomLabel('');
                    setLinkLabelChoice(LINK_SUGGESTED_LABELS[0]);
                  }
                }}
                className="px-3 py-1.5 rounded-lg bg-[var(--accent-lime)] text-[var(--bg-primary)] text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Enregistrer
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAddingLink(false);
                  setLinkUrl('');
                  setLinkCustomLabel('');
                  setLinkLabelChoice(LINK_SUGGESTED_LABELS[0]);
                }}
                className="px-3 py-1.5 rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-muted)] text-sm hover:bg-[var(--border-subtle)]"
              >
                Annuler
              </button>
            </div>
          </div>
        )}
        {!isAddingLink && links.length === 0 && (
          <button
            onClick={() => setIsAddingLink(true)}
            className="w-full px-5 py-8 text-center text-[var(--text-muted)] text-sm hover:bg-[var(--bg-secondary)] hover:text-[var(--accent-lime)] transition-colors"
          >
            + Ajouter une URL
          </button>
        )}
      </div>
    </div>
  );
}

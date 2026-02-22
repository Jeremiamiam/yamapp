'use client';

import { useState, useCallback, useEffect } from 'react';
import type { AddedPage } from '@/types/web-brief';

/**
 * Modal pour ajouter une page non prévue à l'architecture (added_pages).
 * Label + slug uniquement — le prompting se fait sur la page vide après ajout.
 */
export function AddPageModal({
  onConfirm,
  onClose,
  existingSlugs,
}: {
  onConfirm: (payload: AddedPage) => void;
  onClose: () => void;
  existingSlugs: string[];
}) {
  const [label, setLabel] = useState('');
  const [slug, setSlug] = useState('');

  // Escape key closes this modal (and stops propagation to parent modals)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        e.stopImmediatePropagation();
        onClose();
      }
    };
    document.addEventListener('keydown', handler, true); // capture phase
    return () => document.removeEventListener('keydown', handler, true);
  }, [onClose]);

  const slugFromLabel = (s: string) =>
    s
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

  const handleLabelChange = (v: string) => {
    setLabel(v);
    if (!slug || slug === slugFromLabel(label)) {
      setSlug(slugFromLabel(v));
    }
  };

  const slugError =
    existingSlugs.includes(slug) ? `Le slug "${slug}" existe déjà.` : '';

  const handleSubmit = useCallback(() => {
    if (!label.trim() || !slug.trim()) return;
    if (existingSlugs.includes(slug)) return;
    onConfirm({
      page: label.trim(),
      slug: slug.trim(),
      agent_brief: '',
    });
    onClose();
  }, [label, slug, existingSlugs, onConfirm, onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-page-title"
    >
      <div
        className="w-full max-w-md rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-xl p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="add-page-title" className="text-lg font-bold text-[var(--text-primary)]">
          Ajouter une page
        </h2>
        <p className="text-sm text-[var(--text-secondary)]">
          Page non prévue par l&apos;architecte. Tu pourras briefer l&apos;agent sur la page vide après ajout.
        </p>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">
            Label (affiché dans le menu)
          </label>
          <input
            type="text"
            value={label}
            onChange={(e) => handleLabelChange(e.target.value)}
            placeholder="ex. Tarifs"
            className="w-full px-3 py-2 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-cyan)]/50"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">
            Slug (URL)
          </label>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="ex. pricing"
            className={`w-full px-3 py-2 rounded-lg bg-[var(--bg-tertiary)] border text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none ${
              slugError ? 'border-red-500/50' : 'border-[var(--border-subtle)] focus:border-[var(--accent-cyan)]/50'
            }`}
          />
          {slugError && (
            <p className="mt-1 text-xs text-red-500">{slugError}</p>
          )}
        </div>

        <div className="flex gap-2 justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-[var(--border-subtle)] text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!label.trim() || !slug.trim() || !!slugError}
            className="px-4 py-2 rounded-lg bg-[var(--accent-cyan)] text-black text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
          >
            Ajouter la page
          </button>
        </div>
      </div>
    </div>
  );
}

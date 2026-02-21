'use client';

import { useState, useCallback } from 'react';
import type { WebBriefData } from '@/types/web-brief';
import type { HomepageSection } from '@/types/web-brief';

/**
 * Vue layout du menu + homepage.
 * Neutre (gris, typo système) — pas de branding.
 * Responsive.
 */
export function WebBriefView({
  data,
  onSectionRewrite,
}: {
  data: WebBriefData;
  onSectionRewrite?: (sectionIndex: number, customPrompt: string) => Promise<void>;
}) {
  const { architecture, homepage } = data;
  const [rewritingIndex, setRewritingIndex] = useState<number | null>(null);
  const [promptForIndex, setPromptForIndex] = useState<number | null>(null);
  const [promptValue, setPromptValue] = useState('');

  const handleRewriteClick = useCallback(
    (index: number) => {
      if (promptForIndex === index) {
        setPromptForIndex(null);
        setPromptValue('');
      } else {
        setPromptForIndex(index);
        setPromptValue('');
      }
    },
    [promptForIndex]
  );

  const handleRewriteSubmit = useCallback(
    async (index: number) => {
      if (!onSectionRewrite || !promptValue.trim()) return;
      setRewritingIndex(index);
      try {
        await onSectionRewrite(index, promptValue.trim());
        setPromptForIndex(null);
        setPromptValue('');
      } finally {
        setRewritingIndex(null);
      }
    },
    [onSectionRewrite, promptValue]
  );

  const sections = [...(homepage.sections ?? [])].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-10">
      {/* ── Menu proposé ─────────────────────────────────────────────── */}
      <section>
        <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] mb-4">
          Menu proposé
        </h2>
        <div className="space-y-3">
          <div className="text-sm text-[var(--text-secondary)] space-y-1">
            <p><strong>Type de site :</strong> {architecture.site_type}</p>
            <p><strong>Objectif :</strong> {architecture.primary_objective}</p>
            <p><strong>Cible :</strong> {architecture.target_visitor}</p>
          </div>
          <div className="border border-[var(--border-subtle)] rounded-xl overflow-hidden">
            <div className="px-4 py-2 bg-[var(--bg-tertiary)] border-b border-[var(--border-subtle)] text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Navigation principale
            </div>
            <ul className="divide-y divide-[var(--border-subtle)]">
              {(architecture.navigation?.primary ?? []).map((item, i) => (
                <li key={i} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <span className="font-medium text-[var(--text-primary)]">{item.page}</span>
                    <code className="text-xs text-[var(--text-muted)]">{item.slug}</code>
                  </div>
                  {item.justification && (
                    <p className="text-xs text-[var(--text-secondary)] mt-1">{item.justification}</p>
                  )}
                  {item.children && item.children.length > 0 && (
                    <ul className="mt-2 ml-4 space-y-1 border-l-2 border-[var(--border-subtle)] pl-3">
                      {item.children.map((ch, j) => (
                        <li key={j} className="text-xs">
                          <span className="font-medium">{ch.page}</span>
                          <span className="text-[var(--text-muted)] ml-1">/{ch.slug}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </div>
          {((architecture.navigation?.footer_only) ?? []).length > 0 && (
            <div className="border border-[var(--border-subtle)] rounded-xl overflow-hidden">
              <div className="px-4 py-2 bg-[var(--bg-tertiary)] border-b border-[var(--border-subtle)] text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Footer
              </div>
              <ul className="divide-y divide-[var(--border-subtle)]">
                {(architecture.navigation?.footer_only ?? []).map((item, i) => (
                  <li key={i} className="px-4 py-2 flex items-center justify-between gap-2">
                    <span className="text-sm text-[var(--text-primary)]">{item.page}</span>
                    <code className="text-[10px] text-[var(--text-muted)]">{item.slug}</code>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      {/* ── Homepage (layout sections) ───────────────────────────────── */}
      <section>
        <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] mb-4">
          Homepage — layout
        </h2>
        <div className="text-sm text-[var(--text-secondary)] mb-4 space-y-1">
          <p><strong>Objectif :</strong> {homepage.strategic_intent}</p>
          {homepage.narrative_arc && <p><strong>Arc narratif :</strong> {homepage.narrative_arc}</p>}
        </div>
        <div className="space-y-6">
          {sections.map((section, i) => (
            <HomepageSectionBlock
              key={i}
              section={section}
              index={i}
              onRewrite={
                onSectionRewrite
                  ? () => handleRewriteClick(i)
                  : undefined
              }
              isExpanded={promptForIndex === i}
              isRewriting={rewritingIndex === i}
              promptValue={promptForIndex === i ? promptValue : ''}
              onPromptChange={setPromptValue}
              onPromptSubmit={() => handleRewriteSubmit(i)}
              onPromptCancel={() => {
                setPromptForIndex(null);
                setPromptValue('');
              }}
            />
          ))}
        </div>
        {(homepage.cross_links ?? []).length > 0 && (
          <div className="mt-6 pt-6 border-t border-[var(--border-subtle)]">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">Liens homepage → pages du menu</h3>
            <ul className="text-xs text-[var(--text-secondary)] space-y-1">
              {(homepage.cross_links ?? []).map((cl, i) => (
                <li key={i}><code className="text-[var(--accent-cyan)]">{cl.from_section}</code> → <code>{cl.to_page}</code> — {cl.purpose}</li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}

function HomepageSectionBlock({
  section,
  index,
  onRewrite,
  isExpanded,
  isRewriting,
  promptValue,
  onPromptChange,
  onPromptSubmit,
  onPromptCancel,
}: {
  section: HomepageSection;
  index: number;
  onRewrite?: () => void;
  isExpanded?: boolean;
  isRewriting?: boolean;
  promptValue?: string;
  onPromptChange?: (v: string) => void;
  onPromptSubmit?: () => void;
  onPromptCancel?: () => void;
}) {
  const role = section.role;
  const content = section.content || {};
  const title = (content.title as string) || (content.section_title as string) || `Section ${role}`;

  return (
    <div className="border border-[var(--border-subtle)] rounded-xl overflow-hidden bg-[var(--bg-secondary)]">
      <div className="px-4 py-2 bg-[var(--bg-tertiary)] border-b border-[var(--border-subtle)] flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
            {role}
          </span>
          <span className="text-[10px] text-[var(--text-muted)] truncate">{section.intent}</span>
        </div>
        {onRewrite && (
          <button
            type="button"
            onClick={onRewrite}
            disabled={isRewriting}
            className="shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-semibold border border-[var(--accent-cyan)]/30 bg-[var(--accent-cyan)]/10 text-[var(--accent-cyan)] hover:bg-[var(--accent-cyan)]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isRewriting ? '…' : 'Réécrire'}
          </button>
        )}
      </div>
      <div className="p-4 md:p-5 space-y-3">
        <h3 className="text-base font-semibold text-[var(--text-primary)]">{title}</h3>
        {content.subtitle != null && String(content.subtitle) !== '' ? (
          <p className="text-sm text-[var(--text-secondary)]">{String(content.subtitle)}</p>
        ) : null}
        {content.text != null && String(content.text) !== '' ? (
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{String(content.text)}</p>
        ) : null}
        {Array.isArray(content.items) ? (
          <ul className="space-y-2">
            {(content.items as { title?: string; text?: string }[]).map((item, j) => (
              <li key={j} className="text-sm">
                <span className="font-medium text-[var(--text-primary)]">{item.title}</span>
                {item.text ? <span className="text-[var(--text-secondary)]"> — {item.text}</span> : null}
              </li>
            ))}
          </ul>
        ) : null}
        {(content.cta_primary || content.cta_secondary) ? (
          <div className="flex flex-wrap gap-2 pt-2">
            {content.cta_primary ? (
              <span className="px-3 py-1.5 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] text-sm font-medium text-[var(--text-primary)]" title={(content.cta_primary as { url?: string }).url}>
                CTA : {(content.cta_primary as { label?: string }).label || String(content.cta_primary)}
                {(content.cta_primary as { url?: string }).url ? <code className="ml-1.5 text-[10px] text-[var(--text-muted)]">→ {(content.cta_primary as { url?: string }).url}</code> : null}
              </span>
            ) : null}
            {content.cta_secondary ? (
              <span className="px-3 py-1.5 rounded-lg border border-[var(--border-subtle)] text-sm text-[var(--text-muted)]" title={(content.cta_secondary as { url?: string }).url}>
                {(content.cta_secondary as { label?: string }).label || 'Secondary'}
                {(content.cta_secondary as { url?: string }).url ? <code className="ml-1.5 text-[10px]">→ {(content.cta_secondary as { url?: string }).url}</code> : null}
              </span>
            ) : null}
          </div>
        ) : null}
        {Array.isArray(content.quotes) ? (
          <div className="space-y-2 pt-2">
            {(content.quotes as { text?: string; author_name?: string }[]).map((q, j) => (
              <blockquote key={j} className="border-l-2 border-[var(--border-medium)] pl-3 text-sm italic text-[var(--text-secondary)]">
                &quot;{q.text}&quot;
                {q.author_name ? <footer className="text-xs not-italic mt-1">— {q.author_name}</footer> : null}
              </blockquote>
            ))}
          </div>
        ) : null}
        {content.single_quote ? (
          <blockquote className="border-l-2 border-[var(--border-medium)] pl-3 text-sm italic text-[var(--text-secondary)]">
            &quot;{(content.single_quote as { text?: string }).text}&quot;
          </blockquote>
        ) : null}
        {Array.isArray(content.items) && role === 'faq' ? (
          <div className="space-y-2">
            {(content.items as { question?: string; answer?: string }[]).map((item, j) => (
              <div key={j}>
                <p className="font-medium text-[var(--text-primary)]">{item.question}</p>
                <p className="text-[var(--text-secondary)] text-sm">{item.answer}</p>
              </div>
            ))}
          </div>
        ) : null}
        {isExpanded && onPromptChange != null && onPromptSubmit != null && onPromptCancel != null ? (
          <div className="mt-4 pt-4 border-t border-[var(--border-subtle)] space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] block">
              Prompt custom
            </label>
            <textarea
              value={promptValue ?? ''}
              onChange={(e) => onPromptChange(e.target.value)}
              placeholder="Ex : plus punchy, ton B2B, accent sur les bénéfices..."
              rows={2}
              className="w-full px-3 py-2 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] resize-none focus:outline-none focus:border-[var(--accent-cyan)]/40"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onPromptSubmit}
                disabled={isRewriting || !(promptValue ?? '').trim()}
                className="px-3 py-1.5 rounded-lg bg-[var(--accent-cyan)] text-black text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
              >
                {isRewriting ? 'Génération…' : 'Générer'}
              </button>
              <button
                type="button"
                onClick={onPromptCancel}
                disabled={isRewriting}
                className="px-3 py-1.5 rounded-lg border border-[var(--border-subtle)] text-xs text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] disabled:opacity-50"
              >
                Annuler
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

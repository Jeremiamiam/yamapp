'use client';

import type { WebBriefData } from '@/types/web-brief';

/**
 * Vue layout du menu + homepage.
 * Neutre (gris, typo système) — pas de branding.
 * Responsive.
 */
export function WebBriefView({ data }: { data: WebBriefData }) {
  const { architecture, homepage } = data;

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
          {(homepage.sections ?? [])
            .sort((a, b) => a.order - b.order)
            .map((section, i) => (
              <HomepageSectionBlock key={i} section={section} />
            ))}
        </div>
      </section>
    </div>
  );
}

function HomepageSectionBlock({ section }: { section: { role: string; intent: string; content: Record<string, unknown>; da_notes?: string } }) {
  const role = section.role;
  const content = section.content || {};
  const title = (content.title as string) || (content.section_title as string) || `Section ${role}`;

  return (
    <div className="border border-[var(--border-subtle)] rounded-xl overflow-hidden bg-[var(--bg-secondary)]">
      <div className="px-4 py-2 bg-[var(--bg-tertiary)] border-b border-[var(--border-subtle)] flex items-center justify-between gap-2 flex-wrap">
        <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
          {role}
        </span>
        <span className="text-[10px] text-[var(--text-muted)]">{section.intent}</span>
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
        {content.cta_primary ? (
          <div className="flex flex-wrap gap-2 pt-2">
            <span className="px-3 py-1.5 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] text-sm font-medium text-[var(--text-primary)]">
              CTA : {(content.cta_primary as { label?: string }).label || String(content.cta_primary)}
            </span>
            {content.cta_secondary ? (
              <span className="px-3 py-1.5 rounded-lg border border-[var(--border-subtle)] text-sm text-[var(--text-muted)]">
                {(content.cta_secondary as { label?: string }).label || 'Secondary'}
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
        {section.da_notes ? (
          <p className="text-[10px] text-[var(--text-muted)] pt-2 border-t border-[var(--border-subtle)]">
            <strong>DA :</strong> {section.da_notes}
          </p>
        ) : null}
      </div>
    </div>
  );
}

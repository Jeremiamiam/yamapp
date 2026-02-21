'use client';

import { useEffect, useCallback, useMemo, useState } from 'react';
import { useAppStore } from '@/lib/store';
import { formatDocDate } from '@/lib/date-utils';
import { getDocumentTypeStyle } from '@/lib/styles';
import { DocumentType } from '@/types';
import type { Call, ClientDocument, Deliverable } from '@/types';
import {
  parseStructuredDocument,
  isBriefTemplate,
  isCreativeBriefTemplate,
  creativeBriefToBoardInput,
} from '@/types/document-templates';
import { downloadDocumentAsMarkdown } from '@/lib/document-to-markdown';
import type { BriefTemplate, CreativeBriefTemplate, ReportPlaudTemplate } from '@/types/document-templates';
import { toast } from '@/lib/toast';
import { PlaudLogo } from '@/components/ui';
import { ReportView } from './ReportView';
import { SocialBriefView } from './SocialBriefView';
import { WebBriefDocumentContent } from './WebBriefDocumentContent';
import type { WebBriefData } from '@/types/web-brief';
import type { SocialBriefData } from '@/types/social-brief';

// Icons
const X = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const Briefcase = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
  </svg>
);

const StickyNote = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15.5 3H5a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2V8.5L15.5 3Z"/>
    <path d="M15 3v6h6"/>
  </svg>
);

const Edit = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

const Trash = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
    <line x1="10" y1="11" x2="10" y2="17"/>
    <line x1="14" y1="11" x2="14" y2="17"/>
  </svg>
);

const Download = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);

function BriefTemplatedView({ data }: { data: BriefTemplate }) {
  return (
    <div className="space-y-5 text-[var(--text-secondary)]">
      {data.clientContext && (
        <section>
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--accent-cyan)] mb-2">Contexte client</h3>
          <p className="text-sm leading-relaxed">{data.clientContext}</p>
        </section>
      )}
      <section>
        <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--accent-cyan)] mb-2">Objectifs</h3>
        <ul className="list-disc list-inside space-y-1 text-sm">{data.objectives.map((o, i) => <li key={i}>{o}</li>)}</ul>
      </section>
      {data.targetAudience && (
        <section>
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--accent-cyan)] mb-2">Cible</h3>
          <p className="text-sm">{data.targetAudience}</p>
        </section>
      )}
      <section>
        <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--accent-cyan)] mb-2">Produits</h3>
        <ul className="list-disc list-inside space-y-1 text-sm">{data.deliverables.map((d, i) => <li key={i}>{d}</li>)}</ul>
      </section>
      {data.constraints && (
        <section>
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--accent-cyan)] mb-2">Contraintes</h3>
          <p className="text-sm">{data.constraints}</p>
        </section>
      )}
      {(data.deadline || data.tone || data.references || data.notes) && (
        <div className="flex flex-wrap gap-3 text-xs text-[var(--text-muted)] pt-2 border-t border-[var(--border-subtle)]">
          {data.deadline && <span>Echeance : {data.deadline}</span>}
          {data.tone && <span>Ton : {data.tone}</span>}
          {data.references && <span>References : {data.references}</span>}
          {data.notes && <span>{data.notes}</span>}
        </div>
      )}
    </div>
  );
}

/** Découpe le contenu texte du brief (template MARQUE / CIBLE / …) en sections pour affichage lisible. */
function parseBriefSections(content: string): { title: string; body: string }[] {
  const lines = content.split('\n');
  const sections: { title: string; body: string }[] = [];
  let current: { title: string; body: string } | null = null;
  const isSectionHeader = (line: string) => /^[A-ZÀ-Ÿ][A-ZÀ-Ÿ0-9\s]+$/.test(line.trim()) && line.trim().length > 1;
  for (const line of lines) {
    if (isSectionHeader(line)) {
      if (current) sections.push(current);
      current = { title: line.trim(), body: '' };
    } else if (current) {
      current.body += (current.body ? '\n' : '') + line;
    }
  }
  if (current) sections.push(current);
  return sections;
}

const CREATIVE_BRIEF_FIELDS: { key: keyof CreativeBriefTemplate; label: string }[] = [
  { key: 'marque', label: 'Marque' },
  { key: 'personnalitePerque', label: 'Personnalité perçue' },
  { key: 'cible', label: 'Cible' },
  { key: 'tensionComportementale', label: 'Tension comportementale' },
  { key: 'projet', label: 'Projet' },
  { key: 'vraiProbleme', label: 'Le vrai problème' },
  { key: 'contexteConcurrentiel', label: 'Contexte concurrentiel' },
  { key: 'contraintes', label: 'Contraintes' },
  { key: 'ambition', label: 'Ambition' },
  { key: 'tonInterdit', label: 'Ton interdit' },
  { key: 'supports', label: 'Supports / canaux' },
  { key: 'contraintesOperationnelles', label: 'Contraintes opérationnelles' },
  { key: 'angleSecteur', label: 'Angle secteur' },
];

function CreativeBriefView({ data }: { data: CreativeBriefTemplate }) {
  return (
    <div className="space-y-5 text-[var(--text-secondary)]">
      {CREATIVE_BRIEF_FIELDS.map(({ key, label }) => {
        const val = data[key];
        if (val == null || val === '') return null;
        const content = Array.isArray(val) ? (
          <ul className="text-[15px] leading-[1.7] list-disc list-inside space-y-1">
            {val.map((item, i) => (
              <li key={i}>{typeof item === 'object' ? JSON.stringify(item) : String(item)}</li>
            ))}
          </ul>
        ) : (
          <p className="text-[15px] leading-[1.7] whitespace-pre-wrap">{String(val)}</p>
        );
        return (
          <section key={key}>
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">{label}</h3>
            {content}
          </section>
        );
      })}
      {data.competitiveLandscape && (
        <section>
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent-cyan)] mb-2">Paysage concurrentiel (web)</h3>
          <div className="bg-[var(--accent-cyan)]/5 p-4 rounded-xl border border-[var(--accent-cyan)]/15">
            <p className="text-[15px] leading-[1.7] mb-3">{data.competitiveLandscape.resume}</p>
            {data.competitiveLandscape.tendances?.length ? (
              <div className="mb-2">
                <span className="text-[10px] font-bold uppercase text-[var(--text-muted)]">Tendances</span>
                <ul className="mt-1 list-disc list-inside text-sm">{data.competitiveLandscape.tendances.map((t, i) => <li key={i}>{t}</li>)}</ul>
              </div>
            ) : null}
            {data.competitiveLandscape.sources?.length ? (
              <p className="text-[11px] text-[var(--text-muted)]">Sources : {data.competitiveLandscape.sources.slice(0, 3).join(', ')}</p>
            ) : null}
          </div>
        </section>
      )}
      {data.targetSegments?.length ? (
        <section>
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent-cyan)] mb-2">Segments cibles</h3>
          <div className="space-y-3">
            {data.targetSegments.map((seg, i) => (
              <div key={i} className="p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-primary)]/40">
                <p className="font-semibold text-[var(--text-primary)]">{seg.segment}</p>
                {seg.besoin && <p className="text-sm mt-1">Besoin : {seg.besoin}</p>}
                {seg.objection && <p className="text-sm text-[var(--text-muted)]">Objection : {seg.objection}</p>}
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function BriefContentView({ content }: { content: string }) {
  const sections = parseBriefSections(content);
  if (sections.length === 0) {
    return (
      <p className="text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap text-[15px]">
        {content}
      </p>
    );
  }
  return (
    <div className="space-y-8 max-w-[65ch]">
      {sections.map((sec, i) => (
        <section key={i}>
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-[var(--accent-cyan)] mb-2.5">
            {sec.title}
          </h3>
          <p className="text-[15px] leading-[1.7] text-[var(--text-secondary)] whitespace-pre-wrap">
            {sec.body.trim()}
          </p>
        </section>
      ))}
    </div>
  );
}

function getDocTypeStyle(type: DocumentType) {
  const base = getDocumentTypeStyle(type);
  const icon =
    type === 'brief' ? <Briefcase /> :
    type === 'report' ? <PlaudLogo className="w-4 h-4" /> :
    type === 'creative-strategy' ? (
      <span className="text-base font-bold" style={{ color: 'var(--accent-lime)' }}>⬡</span>
    ) : type === 'web-brief' ? (
      <span className="text-base font-bold" style={{ color: 'var(--accent-cyan)' }}>🌐</span>
    ) : type === 'social-brief' ? (
      <span className="text-base font-bold" style={{ color: 'var(--accent-magenta)' }}>📱</span>
    ) : <StickyNote />;
  return { ...base, icon };
}

/** Parse le rapport final du Creative Board (## Synthèse, ### Tension stratégique, etc.) */
function parseStrategySections(text: string): { title: string; body: string }[] {
  const cleaned = text.replace(/^##\s+.*\n?/m, '').trim();
  const parts = cleaned.split(/\n###\s+/);
  const sections: { title: string; body: string }[] = [];
  for (const part of parts) {
    if (!part.trim()) continue;
    const firstLine = part.indexOf('\n');
    const title = firstLine === -1 ? part.trim() : part.slice(0, firstLine).trim();
    const body = firstLine === -1 ? '' : part.slice(firstLine + 1).trim();
    if (title) sections.push({ title, body });
  }
  return sections;
}

const STRATEGY_CARD_STYLES: Record<string, { color: string; icon: string; bg: string }> = {
  'Tension stratégique':  { color: 'var(--accent-cyan)',   icon: '◈', bg: 'var(--accent-cyan-dim)'   },
  'Angle retenu':         { color: 'var(--accent-amber)',  icon: '⬡', bg: 'var(--accent-amber-dim)'  },
  'Plateforme de Marque': { color: 'var(--accent-violet)', icon: '◇', bg: 'var(--accent-violet-dim)' },
  'Territoire & Copy':    { color: 'var(--accent-lime)',   icon: '✦', bg: 'var(--accent-lime-dim)'   },
  'Points de vigilance':  { color: 'var(--accent-coral)', icon: '◉', bg: 'var(--accent-coral-dim)'  },
  'Touche Yam':           { color: 'var(--accent-magenta)', icon: '◆', bg: 'var(--accent-magenta-dim)'  },
};

// ─── Brand Platform Types & Component ───

interface BrandPlatformData {
  the_battlefield: { status_quo: string; the_enemy: string; the_gap: string };
  the_hero_and_villain: { the_cult_member: string; the_anti_persona: string };
  core_identity: { origin_story: string; radical_promise: string; archetype_mix: { dominant: string; twist: string } };
  expression_matrix: {
    is_vs_is_not: { is: string; is_not: string }[];
    vocabulary_trigger_words: string[];
    banned_words: string[];
  };
  the_manifesto: { part_1_frustration: string; part_2_belief: string; part_3_solution: string };
}

const TAG_LIMIT = 8;

function TagCloud({ words, color, borderColor, bgColor, label }: {
  words: string[];
  color: string;
  borderColor: string;
  bgColor: string;
  label: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasMore = words.length > TAG_LIMIT;
  const visible = expanded ? words : words.slice(0, TAG_LIMIT);

  return (
    <div>
      <span className="text-[10px] font-bold uppercase tracking-wider block mb-2.5" style={{ color }}>{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {visible.map((w, i) => (
          <span
            key={i}
            className="px-2.5 py-1 rounded-md text-xs font-medium border"
            style={{ background: bgColor, color, borderColor }}
          >
            {w}
          </span>
        ))}
        {hasMore && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="px-2.5 py-1 rounded-md text-xs font-medium border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--border-medium)] transition-colors"
          >
            {expanded ? 'Moins' : `+${words.length - TAG_LIMIT}`}
          </button>
        )}
      </div>
    </div>
  );
}

function BrandPlatformView({ data }: { data: BrandPlatformData }) {
  return (
    <div className="space-y-10 animate-fade-in-up">
      {/* ── Le Champ de Bataille ── */}
      <section>
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-1 h-4 rounded-full bg-[var(--accent-coral)]" />
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Le Champ de Bataille</h3>
        </div>
        <div className="grid md:grid-cols-3 gap-3">
          <div className="bg-[var(--bg-tertiary)]/40 p-5 rounded-xl border border-[var(--border-subtle)] relative">
            <span className="absolute top-3 right-3.5 text-[10px] font-bold text-[var(--text-muted)]/40 md:hidden">1/3</span>
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2.5">Status Quo</h4>
            <p className="text-sm leading-relaxed text-[var(--text-secondary)]">{data.the_battlefield.status_quo}</p>
          </div>
          <div className="bg-[var(--accent-coral)]/5 p-5 rounded-xl border border-[var(--accent-coral)]/15 relative">
            <span className="absolute top-3 right-3.5 text-[10px] font-bold text-[var(--accent-coral)]/30 md:hidden">2/3</span>
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent-coral)] mb-2.5">L'Ennemi</h4>
            <p className="text-sm leading-relaxed text-[var(--text-secondary)]">{data.the_battlefield.the_enemy}</p>
          </div>
          <div className="bg-[var(--accent-lime)]/5 p-5 rounded-xl border border-[var(--accent-lime)]/15 relative">
            <span className="absolute top-3 right-3.5 text-[10px] font-bold text-[var(--accent-lime)]/30 md:hidden">3/3</span>
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent-lime)] mb-2.5">Le Gap</h4>
            <p className="text-sm leading-relaxed text-[var(--text-secondary)]">{data.the_battlefield.the_gap}</p>
          </div>
        </div>
        {/* Flèches de progression (desktop only) */}
        <div className="hidden md:flex items-center justify-center gap-2 mt-3 text-[var(--text-muted)]/30">
          <div className="h-px flex-1 bg-[var(--border-subtle)]" />
          <span className="text-[10px] tracking-widest">DISRUPTION</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-40"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          <div className="h-px flex-1 bg-[var(--border-subtle)]" />
        </div>
      </section>

      {/* ── Identité & Casting ── */}
      <section className="grid md:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-1 h-4 rounded-full bg-[var(--accent-violet)]" />
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Identite Profonde</h3>
          </div>
          <div className="bg-[var(--bg-primary)]/40 p-6 rounded-xl border border-[var(--border-subtle)] space-y-5 h-full">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Histoire d'origine</span>
              <p className="text-sm leading-relaxed mt-1.5 text-[var(--text-secondary)]">{data.core_identity.origin_story}</p>
            </div>
            <div className="py-4 border-y border-[var(--border-subtle)]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent-violet)]">Promesse Radicale</span>
              <p className="text-lg font-bold text-[var(--text-primary)] mt-2 leading-snug">&ldquo;{data.core_identity.radical_promise}&rdquo;</p>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Archetypes</span>
              <div className="flex items-center gap-2 mt-2">
                <span className="px-3 py-1.5 rounded-lg bg-[var(--accent-violet)]/10 text-[var(--accent-violet)] text-xs font-bold border border-[var(--accent-violet)]/20">
                  {data.core_identity.archetype_mix.dominant}
                </span>
                <span className="text-xs text-[var(--text-muted)]">+</span>
                <span className="px-3 py-1.5 rounded-lg bg-[var(--bg-tertiary)] text-xs font-medium text-[var(--text-secondary)] border border-[var(--border-subtle)]">
                  {data.core_identity.archetype_mix.twist}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-1 h-4 rounded-full bg-[var(--accent-cyan)]" />
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Casting</h3>
          </div>
          <div className="grid gap-3 h-[calc(100%-2rem)]">
            <div className="bg-[var(--accent-cyan)]/5 p-5 rounded-xl border border-[var(--accent-cyan)]/15">
              <div className="flex items-center gap-2.5 mb-3">
                <span className="w-7 h-7 rounded-lg bg-[var(--accent-cyan)]/15 flex items-center justify-center text-sm">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent-cyan)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </span>
                <h4 className="text-xs font-bold text-[var(--accent-cyan)]">Le Client Ideal</h4>
              </div>
              <p className="text-sm leading-relaxed text-[var(--text-secondary)]">{data.the_hero_and_villain.the_cult_member}</p>
            </div>
            <div className="bg-[var(--bg-tertiary)]/40 p-5 rounded-xl border border-[var(--border-subtle)]">
              <div className="flex items-center gap-2.5 mb-3">
                <span className="w-7 h-7 rounded-lg bg-[var(--bg-tertiary)] flex items-center justify-center text-sm">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/><line x1="2" y1="2" x2="22" y2="22"/></svg>
                </span>
                <h4 className="text-xs font-bold text-[var(--text-muted)]">L'Anti-Persona</h4>
              </div>
              <p className="text-sm leading-relaxed text-[var(--text-muted)]">{data.the_hero_and_villain.the_anti_persona}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Matrice d'Expression ── */}
      <section>
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-1 h-4 rounded-full bg-[var(--accent-lime)]" />
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Matrice d'Expression</h3>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            {data.expression_matrix.is_vs_is_not.map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-3.5 rounded-lg bg-[var(--bg-primary)]/40 border border-[var(--border-subtle)] group hover:border-[var(--accent-lime)]/20 transition-colors">
                <span className="font-medium text-sm text-[var(--accent-lime)] flex-1">{item.is}</span>
                <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]/50 flex-shrink-0 px-2">vs</span>
                <span className="font-medium text-sm text-[var(--text-muted)] line-through decoration-[var(--accent-coral)]/40 flex-1 text-right">{item.is_not}</span>
              </div>
            ))}
          </div>
          <div className="space-y-5">
            <TagCloud
              words={data.expression_matrix.vocabulary_trigger_words}
              color="var(--accent-cyan)"
              borderColor="rgba(34, 211, 238, 0.2)"
              bgColor="rgba(34, 211, 238, 0.08)"
              label="Mots-cles"
            />
            <TagCloud
              words={data.expression_matrix.banned_words}
              color="#f87171"
              borderColor="rgba(248, 113, 113, 0.2)"
              bgColor="rgba(248, 113, 113, 0.08)"
              label="Mots Interdits"
            />
          </div>
        </div>
      </section>

      {/* ── Manifeste ── */}
      <section>
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-1 h-4 rounded-full bg-[var(--accent-amber)]" />
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Le Manifeste</h3>
        </div>
        <div className="bg-[var(--bg-primary)]/60 p-8 rounded-xl border border-[var(--border-subtle)] relative overflow-hidden">
          {/* Subtle gradient accent */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
            background: 'linear-gradient(135deg, var(--accent-coral) 0%, transparent 40%, transparent 60%, var(--accent-lime) 100%)'
          }} />
          <div className="space-y-6 relative z-10">
            <div className="border-l-2 border-[var(--accent-coral)]/40 pl-5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent-coral)]/60 block mb-2">La Frustration</span>
              <p className="text-[15px] leading-[1.8] text-[var(--text-secondary)]">{data.the_manifesto.part_1_frustration}</p>
            </div>
            <div className="border-l-2 border-[var(--accent-cyan)]/40 pl-5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent-cyan)]/60 block mb-2">La Conviction</span>
              <p className="text-[15px] leading-[1.8] text-[var(--text-secondary)]">{data.the_manifesto.part_2_belief}</p>
            </div>
            <div className="border-l-3 border-[var(--accent-lime)] pl-5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent-lime)]/60 block mb-2">La Reponse</span>
              <p className="text-lg font-bold leading-[1.6] text-[var(--accent-lime)]">{data.the_manifesto.part_3_solution}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

/** Map section title -> confidence key */
const SECTION_TO_CONFIDENCE: Record<string, 'strategist' | 'architect' | 'copywriter' | 'devil' | 'yam'> = {
  'Tension stratégique': 'strategist',
  'Plateforme de Marque': 'architect',
  'Territoire & Copy': 'copywriter',
  'Points de vigilance': 'devil',
  'Touche Yam': 'yam',
};

interface SectionConfidence {
  score: number;
  flags: string[];
  factCheck?: string;
}

interface CreativeStrategyData {
  version?: number;
  strategist?: { sections: { heading: string; body: string; quote?: string }[] } | string | null;
  selectedIdea?: { title: string; body: string } | null;
  architect?: Record<string, unknown> | string | null;
  copywriter?: { territory: string; manifesto: string; taglines: { text: string; note?: string }[] } | string | null;
  devil?: { points: string[]; questions: { question: string; piste: string }[] } | string | null;
  yam?: Record<string, unknown> | string | null;
  confidence?: {
    strategist?: SectionConfidence;
    architect?: SectionConfidence;
    copywriter?: SectionConfidence;
    devil?: SectionConfidence;
    yam?: SectionConfidence;
  };
}

// ─── Vues structurées JSON (style Plateforme de marque) ───

function StrategistStructuredView({ data }: { data: { sections: { heading: string; body: string; quote?: string }[] } }) {
  return (
    <div className="space-y-8 animate-fade-in-up">
      {data.sections.map((sec, i) => (
        <section key={i}>
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-1 h-4 rounded-full" style={{ background: 'var(--accent-cyan)' }} />
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">{sec.heading}</h3>
          </div>
          <div className="bg-[var(--bg-primary)]/40 p-6 rounded-xl border border-[var(--border-subtle)]">
            <p className="text-[15px] leading-[1.8] text-[var(--text-secondary)] whitespace-pre-wrap">{sec.body}</p>
            {sec.quote && (
              <blockquote className="mt-5 pl-5 border-l-2 border-[var(--accent-cyan)]/40 italic text-[var(--text-secondary)]">
                {sec.quote}
              </blockquote>
            )}
          </div>
        </section>
      ))}
    </div>
  );
}

function SelectedIdeaStructuredView({ data }: { data: { title: string; body: string } }) {
  return (
    <div className="animate-fade-in-up">
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-1 h-4 rounded-full" style={{ background: 'var(--accent-amber)' }} />
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Angle retenu</h3>
      </div>
      <div className="bg-[var(--accent-amber)]/5 p-8 rounded-xl border border-[var(--accent-amber)]/20">
        <h4 className="text-xl font-bold text-[var(--accent-amber)] mb-4 leading-snug">{data.title}</h4>
        <p className="text-[15px] leading-[1.8] text-[var(--text-secondary)] whitespace-pre-wrap">{data.body}</p>
      </div>
    </div>
  );
}

function CopywriterStructuredView({ data }: { data: { territory: string; manifesto: string; taglines: { text: string; note?: string }[] } }) {
  return (
    <div className="space-y-8 animate-fade-in-up">
      <section>
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-1 h-4 rounded-full" style={{ background: 'var(--accent-lime)' }} />
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Territoire de ton</h3>
        </div>
        <div className="bg-[var(--bg-primary)]/40 p-6 rounded-xl border border-[var(--border-subtle)]">
          <p className="text-[15px] leading-[1.8] text-[var(--text-secondary)] whitespace-pre-wrap">{data.territory}</p>
        </div>
      </section>
      <section>
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-1 h-4 rounded-full" style={{ background: 'var(--accent-lime)' }} />
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Manifeste</h3>
        </div>
        <div className="bg-[var(--accent-lime)]/5 p-6 rounded-xl border border-[var(--accent-lime)]/20">
          <p className="text-[15px] leading-[1.8] text-[var(--text-primary)] whitespace-pre-wrap font-medium">{data.manifesto}</p>
        </div>
      </section>
      {data.taglines && data.taglines.length > 0 && (
        <section>
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-1 h-4 rounded-full" style={{ background: 'var(--accent-lime)' }} />
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Taglines</h3>
          </div>
          <div className="space-y-3">
            {data.taglines.map((t, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-4 rounded-xl bg-[var(--bg-primary)]/40 border border-[var(--border-subtle)]"
              >
                <span className="text-lg font-bold text-[var(--accent-lime)] flex-shrink-0">&ldquo;</span>
                <div>
                  <p className="text-[15px] font-semibold text-[var(--text-primary)]">{t.text}</p>
                  {t.note && <p className="text-[13px] text-[var(--text-muted)] mt-1">{t.note}</p>}
                </div>
                <span className="text-lg font-bold text-[var(--accent-lime)] flex-shrink-0">&rdquo;</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function YamStructuredView({
  data,
}: {
  data: {
    touches?: { concept?: string; visuel?: string; accroche?: string; pourquoi?: string }[];
    commentaire?: string;
  };
}) {
  const touches = data.touches ?? [];
  if (touches.length === 0) return null;
  return (
    <div className="space-y-8 animate-fade-in-up">
      {touches.map((t, i) => {
        const hasAccroche = t.accroche?.trim();
        if (!hasAccroche) return null;
        return (
          <section key={i} className="p-6 rounded-xl bg-[var(--accent-magenta)]/5 border border-[var(--accent-magenta)]/15">
            {t.concept?.trim() && (
              <>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--accent-magenta)] mb-2">Concept</p>
                <p className="text-[15px] text-[var(--text-secondary)] mb-4">{t.concept}</p>
              </>
            )}
            {t.visuel?.trim() && (
              <>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2">Visuel</p>
                <p className="text-[14px] text-[var(--text-secondary)] mb-4">{t.visuel}</p>
              </>
            )}
            <p className="text-lg font-bold text-[var(--accent-magenta)] mb-3">&ldquo;{t.accroche}&rdquo;</p>
            {t.pourquoi?.trim() && (
              <p className="text-[13px] text-[var(--text-muted)] italic">{t.pourquoi}</p>
            )}
          </section>
        );
      })}
      {data.commentaire && (
        <p className="text-[14px] text-[var(--text-secondary)] pt-4 border-t border-[var(--border-subtle)]">
          {data.commentaire}
        </p>
      )}
    </div>
  );
}

function DevilStructuredView({ data }: { data: { points: string[]; questions: { question: string; piste: string }[] } }) {
  return (
    <div className="space-y-8 animate-fade-in-up">
      {data.points && data.points.length > 0 && (
        <section>
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-1 h-4 rounded-full" style={{ background: 'var(--accent-coral)' }} />
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Points de vigilance</h3>
          </div>
          <ul className="space-y-2">
            {data.points.map((p, i) => (
              <li key={i} className="flex items-start gap-3 p-3 rounded-lg bg-[var(--accent-coral)]/5 border border-[var(--accent-coral)]/15">
                <span className="text-[var(--accent-coral)] mt-0.5">◉</span>
                <span className="text-[15px] text-[var(--text-secondary)]">{p}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
      {data.questions && data.questions.length > 0 && (
        <section>
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-1 h-4 rounded-full" style={{ background: 'var(--accent-coral)' }} />
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Questions pour le client</h3>
          </div>
          <div className="space-y-4">
            {data.questions.map((q, i) => (
              <div key={i} className="p-5 rounded-xl bg-[var(--bg-primary)]/40 border border-[var(--border-subtle)]">
                <p className="text-[15px] font-semibold text-[var(--text-primary)] mb-2">{q.question}</p>
                <p className="text-[14px] text-[var(--text-secondary)] pl-3 border-l-2 border-[var(--accent-coral)]/30">
                  <span className="text-[var(--text-muted)]">Piste : </span>
                  {q.piste}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function strategyDataToDisplaySections(data: CreativeStrategyData): { title: string; body: string }[] {
  const sections: { title: string; body: string }[] = [];
  const strat = data.strategist;
  if (strat) {
    if (typeof strat === 'object' && strat.sections?.length) {
      sections.push({
        title: 'Tension stratégique',
        body: strat.sections.map((s) => `### ${s.heading}\n${s.body}${s.quote ? `\n> ${s.quote}` : ''}`).join('\n\n'),
      });
    } else {
      sections.push({ title: 'Tension stratégique', body: String(strat) });
    }
  }
  const idea = data.selectedIdea;
  if (idea) {
    sections.push({ title: 'Angle retenu', body: `${idea.title}\n\n${idea.body}` });
  }
  const arch = data.architect;
  if (arch) {
    sections.push({
      title: 'Plateforme de Marque',
      body: typeof arch === 'object' ? JSON.stringify(arch) : String(arch),
    });
  }
  const copy = data.copywriter;
  if (copy) {
    if (typeof copy === 'object') {
      sections.push({
        title: 'Territoire & Copy',
        body: `${copy.territory}\n\n**Manifeste**\n${copy.manifesto}\n\n**Taglines**\n${(copy.taglines ?? []).map((t) => `- ${t.text}${t.note ? ` (${t.note})` : ''}`).join('\n')}`,
      });
    } else {
      sections.push({ title: 'Territoire & Copy', body: String(copy) });
    }
  }
  const dev = data.devil;
  if (dev) {
    if (typeof dev === 'object') {
      const pts = (dev.points ?? []).map((p) => `- ${p}`).join('\n');
      const qs = (dev.questions ?? []).map((q) => `**${q.question}**\n${q.piste}`).join('\n\n');
      sections.push({ title: 'Points de vigilance', body: `${pts}\n\n${qs}` });
    } else {
      sections.push({ title: 'Points de vigilance', body: String(dev) });
    }
  }
  const yam = data.yam;
  if (yam) {
    sections.push({
      title: 'Touche Yam',
      body: typeof yam === 'object' ? JSON.stringify(yam) : String(yam),
    });
  }
  return sections;
}

function extractPlatformFromData(data: CreativeStrategyData): BrandPlatformData | null {
  const arch = data.architect;
  if (!arch || typeof arch !== 'object') return null;
  return arch as unknown as BrandPlatformData;
}

/** Tente d'extraire du JSON structuré (BrandPlatform) depuis le body markdown */
function extractPlatformJson(body: string): BrandPlatformData | null {
  // Nettoyage : enlever les fences markdown
  const cleaned = body.replace(/```json\n?|\n?```/g, '');
  // Stratégie 1 : chercher l'objet JSON le plus large
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) return null;
  try {
    return JSON.parse(cleaned.substring(firstBrace, lastBrace + 1));
  } catch {
    return null;
  }
}

function strategyDataToText(data: CreativeStrategyData, field: 'strategist' | 'copywriter'): string {
  const val = field === 'strategist' ? data.strategist : data.copywriter;
  if (!val) return '';
  if (typeof val === 'string') return val;
  if (field === 'strategist' && 'sections' in val) {
    return (val as { sections: { heading: string; body: string; quote?: string }[] }).sections
      .map((s) => `### ${s.heading}\n${s.body}${s.quote ? `\n> ${s.quote}` : ''}`)
      .join('\n\n');
  }
  if (field === 'copywriter' && 'territory' in val) {
    const c = val as { territory: string; manifesto: string; taglines?: { text: string; note?: string }[] };
    return `${c.territory}\n\n${c.manifesto}\n\n${(c.taglines ?? []).map((t) => `- ${t.text}`).join('\n')}`;
  }
  return '';
}

function CreativeStrategyView({
  content,
  onGenerateWebBrief,
  onGenerateSmmBrief,
  isGeneratingWeb,
  isGeneratingSmm,
}: {
  content: string;
  onGenerateWebBrief?: (payload: { brandPlatform: unknown; strategyText: string; copywriterText: string }) => void;
  onGenerateSmmBrief?: (payload: { brandPlatform: unknown; strategyText: string; copywriterText: string; reportContent?: string }) => void;
  isGeneratingWeb?: boolean;
  isGeneratingSmm?: boolean;
}) {
  let displaySections: { title: string; body: string }[];
  let platformData: BrandPlatformData | null;
  let strategyText: string;
  let copywriterText: string;
  let parsedData: CreativeStrategyData | null = null;

  try {
    const parsed = JSON.parse(content) as CreativeStrategyData;
    if (parsed?.version === 2) {
      parsedData = parsed;
      displaySections = strategyDataToDisplaySections(parsed);
      platformData = extractPlatformFromData(parsed);
      strategyText = strategyDataToText(parsed, 'strategist');
      copywriterText = strategyDataToText(parsed, 'copywriter');
    } else {
      throw new Error('Not v2');
    }
  } catch {
    const sections = parseStrategySections(content);
    displaySections = sections.length > 0
      ? sections
      : [{ title: 'Synthese', body: content.replace(/^##\s+.*\n?/m, '').trim() || content }];
    const strategySection = sections.find((s) => s.title === 'Tension stratégique');
    const copySection = sections.find((s) => s.title === 'Territoire & Copy');
    strategyText = strategySection?.body ?? '';
    copywriterText = copySection?.body ?? '';
    const activeSectionForPlatform = displaySections.find((s) => s.title === 'Plateforme de Marque');
    platformData = activeSectionForPlatform ? extractPlatformJson(activeSectionForPlatform.body) : null;
  }

  const defaultStyle = { color: 'var(--accent-lime)', icon: '◆', bg: 'var(--accent-lime-dim)' };
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const activeSection = displaySections[activeTabIndex] || displaySections[0];
  const activeStyle = STRATEGY_CARD_STYLES[activeSection.title] ?? defaultStyle;

  const isPlatformSection = activeSection.title === 'Plateforme de Marque';
  const effectivePlatformData = platformData ?? (isPlatformSection ? extractPlatformJson(activeSection.body) : null);

  return (
    <div className="space-y-0">
      {/* Sticky header: bg opaque (évite flickering au scroll) */}
      <div className="sticky -top-6 z-10 bg-[var(--bg-card)] -mx-6 px-6 pt-4 pb-0" style={{ backfaceVisibility: 'hidden' }}>
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-1.5 h-4 rounded-full bg-[var(--accent-lime)] flex-shrink-0" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Synthese du Board</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {effectivePlatformData && onGenerateWebBrief && (
              <button
                type="button"
                onClick={() =>
                  onGenerateWebBrief({
                    brandPlatform: effectivePlatformData,
                    strategyText,
                    copywriterText,
                  })
                }
                disabled={isGeneratingWeb || isGeneratingSmm}
                className="px-3 py-2 rounded-xl bg-[var(--accent-cyan)]/15 border border-[var(--accent-cyan)]/30 text-xs font-semibold text-[var(--accent-cyan)] hover:bg-[var(--accent-cyan)]/25 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
              >
                {isGeneratingWeb ? (
                  <>
                    <span className="w-2.5 h-2.5 border-2 border-[var(--accent-cyan)]/30 border-t-[var(--accent-cyan)] rounded-full animate-spin" />
                    <span className="hidden sm:inline">Génération…</span>
                  </>
                ) : (
                  <>🌐 Générer structure du site</>
                )}
              </button>
            )}
            {onGenerateSmmBrief && (
              <button
                type="button"
                onClick={() =>
                  onGenerateSmmBrief({
                    brandPlatform: effectivePlatformData ?? undefined,
                    strategyText,
                    copywriterText,
                    reportContent: content,
                  })
                }
                disabled={isGeneratingWeb || isGeneratingSmm}
                className="px-3 py-2 rounded-xl bg-[var(--accent-magenta)]/15 border border-[var(--accent-magenta)]/30 text-xs font-semibold text-[var(--accent-magenta)] hover:bg-[var(--accent-magenta)]/25 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
              >
                {isGeneratingSmm ? (
                  <>
                    <span className="w-2.5 h-2.5 border-2 border-[var(--accent-magenta)]/30 border-t-[var(--accent-magenta)] rounded-full animate-spin" />
                    <span className="hidden sm:inline">Génération…</span>
                  </>
                ) : (
                  <>📱 Brief Social</>
                )}
              </button>
            )}
          </div>
        </div>
        <div className="flex gap-1 overflow-x-auto pb-px scrollbar-none">
          {displaySections.map((section, i) => {
            const s = STRATEGY_CARD_STYLES[section.title] ?? defaultStyle;
            const isActive = i === activeTabIndex;
            const confKey = SECTION_TO_CONFIDENCE[section.title];
            const conf = confKey && parsedData?.confidence?.[confKey];
            const hasFlags = (conf?.flags?.length ?? 0) > 0;
            return (
              <button
                key={i}
                onClick={() => setActiveTabIndex(i)}
                title={conf?.factCheck ?? (hasFlags ? conf?.flags?.join(', ') : undefined)}
                className={`
                  flex items-center gap-2 px-4 py-2.5 text-sm font-bold transition-all whitespace-nowrap relative flex-shrink-0
                  ${isActive
                    ? ''
                    : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}
                `}
                style={isActive ? { color: s.color } : {}}
              >
                <span className={`text-base ${isActive ? '' : 'opacity-50'}`}>{s.icon}</span>
                <span className="hidden sm:inline">{section.title}</span>
                {conf && (
                  <span
                    className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${hasFlags ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400' : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)]'}`}
                    title={hasFlags ? conf.flags.join(', ') : undefined}
                  >
                    {conf.score}/100
                    {hasFlags ? ' ⚠' : ''}
                  </span>
                )}
                {isActive && (
                  <span
                    className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full"
                    style={{ background: s.color }}
                  />
                )}
              </button>
            );
          })}
        </div>
        <div className="h-px bg-[var(--border-subtle)]" />
      </div>

      {/* Content — pas d'animation au switch tab (évite flickering) */}
      <div
        key={activeTabIndex}
        className="rounded-xl p-6 sm:p-8 border mt-4"
        style={{
          background: activeStyle.bg,
          borderColor: `${activeStyle.color}15`,
          minHeight: (isPlatformSection && effectivePlatformData) || (parsedData && activeSection.title !== 'Synthese') ? '320px' : '240px',
          contain: 'layout paint',
        }}
      >
        <div className="prose prose-invert max-w-none">
          {(() => {
            const confKey = SECTION_TO_CONFIDENCE[activeSection.title];
            const factCheck = confKey && parsedData?.confidence?.[confKey]?.factCheck;
            const FactCheckBlock = factCheck ? (
              <div className="mb-6 p-4 rounded-xl bg-[var(--accent-cyan)]/10 border border-[var(--accent-cyan)]/20">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent-cyan)]">Vérification web</span>
                <p className="text-[14px] text-[var(--text-secondary)] mt-1.5">{factCheck}</p>
              </div>
            ) : null;

            if (activeSection.title === 'Tension stratégique' && parsedData?.strategist && typeof parsedData.strategist === 'object' && parsedData.strategist.sections?.length) {
              return (
                <>
                  {FactCheckBlock}
                  <StrategistStructuredView data={parsedData.strategist} />
                </>
              );
            }
            if (activeSection.title === 'Angle retenu' && parsedData?.selectedIdea) {
              return <SelectedIdeaStructuredView data={parsedData.selectedIdea} />;
            }
            if (isPlatformSection && effectivePlatformData) {
              return (
                <>
                  {FactCheckBlock}
                  <BrandPlatformView data={effectivePlatformData} />
                </>
              );
            }
            if (activeSection.title === 'Territoire & Copy' && parsedData?.copywriter && typeof parsedData.copywriter === 'object') {
              return <CopywriterStructuredView data={parsedData.copywriter} />;
            }
            if (activeSection.title === 'Points de vigilance' && parsedData?.devil && typeof parsedData.devil === 'object' && (parsedData.devil.points?.length || parsedData.devil.questions?.length)) {
              return <DevilStructuredView data={parsedData.devil} />;
            }
            if (activeSection.title === 'Touche Yam' && parsedData?.yam && typeof parsedData.yam === 'object' && 'touches' in parsedData.yam && Array.isArray((parsedData.yam as { touches?: unknown[] }).touches) && (parsedData.yam as { touches: unknown[] }).touches.length > 0) {
              return <YamStructuredView data={parsedData.yam as { touches: { concept: string; visuel: string; accroche: string; pourquoi: string }[]; commentaire?: string }} />;
            }
            return (
              <p className="text-[15px] text-[var(--text-primary)] leading-[1.8] whitespace-pre-wrap font-normal">
                {activeSection.body}
              </p>
            );
          })()}
        </div>
      </div>
    </div>
  );
}

function DocumentModalContent({
  document: selectedDocument,
  structured,
  onClose,
  clientId,
  onAddDeliverable,
  onSuggestContact,
  onAddCall,
  onEditDocument,
  onDeleteDocument,
}: {
  document: ClientDocument;
  structured: BriefTemplate | CreativeBriefTemplate | ReportPlaudTemplate | null;
  onClose: () => void;
  clientId?: string;
  onAddDeliverable?: (d: Omit<Deliverable, 'id' | 'createdAt'>) => void;
  onSuggestContact?: (name: string) => void;
  onAddCall?: (call: Omit<Call, 'id' | 'createdAt'>) => void;
  onEditDocument?: () => void;
  onDeleteDocument?: () => void;
}) {
  const updateDocument = useAppStore((s) => s.updateDocument);
  const addDocument = useAppStore((s) => s.addDocument);
  const openDocument = useAppStore((s) => s.openDocument);
  const navigateToCreativeBoard = useAppStore((s) => s.navigateToCreativeBoard);
  const docStyle = getDocTypeStyle(selectedDocument.type);
  const showTemplated = structured !== null;
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [generatingBrief, setGeneratingBrief] = useState(false);
  const [generatingWeb, setGeneratingWeb] = useState(false);
  const [generatingSmm, setGeneratingSmm] = useState(false);
  const [showTranscriptInput, setShowTranscriptInput] = useState(false);
  const [fallbackTranscript, setFallbackTranscript] = useState('');
  const isWebBrief = selectedDocument.type === 'web-brief';

  const reportData = structured && selectedDocument.type === 'report' ? (structured as ReportPlaudTemplate) : null;
  const onEventAdded = useCallback(
    (eventKey: string) => {
      if (!reportData || !clientId) return;
      const next = { ...reportData, addedEventKeys: [...(reportData.addedEventKeys || []), eventKey] };
      updateDocument(clientId, selectedDocument.id, { content: JSON.stringify(next) });
    },
    [reportData, clientId, selectedDocument.id, updateDocument]
  );
  const onBackfillAddedEventKeys = useCallback(
    (keys: string[]) => {
      if (!reportData || !clientId || keys.length === 0) return;
      const next = { ...reportData, addedEventKeys: [...(reportData.addedEventKeys || []), ...keys] };
      updateDocument(clientId, selectedDocument.id, { content: JSON.stringify(next) });
    },
    [reportData, clientId, selectedDocument.id, updateDocument]
  );

  const runBriefGeneration = useCallback(async (transcript: string) => {
    setGeneratingBrief(true);
    try {
      const res = await fetch('/api/brief-from-plaud', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawTranscript: transcript }),
      });
      const raw = await res.text();
      let data: { brief?: string; error?: string };
      try {
        data = JSON.parse(raw) as { brief?: string; error?: string };
      } catch {
        if (!res.ok) {
          toast.error(`Erreur serveur (${res.status}). Vérifier ANTHROPIC_API_KEY dans Netlify.`);
          return;
        }
        throw new Error('Réponse API invalide');
      }
      if (!res.ok || data.error) {
        toast.error(data.error ?? 'Erreur lors de la génération du brief.');
        return;
      }
      const briefContent = data.brief ?? '';
      let createdDoc: import('@/types').ClientDocument | null = null;
      if (clientId) {
        createdDoc = await addDocument(clientId, {
          type: 'brief',
          title: `Brief - ${reportData?.title ?? 'Plaud'}`,
          content: briefContent,
        });
      }
      onClose();
      if (createdDoc) {
        toast.success('Brief généré', {
          action: { label: 'Voir le brief', onClick: () => openDocument(createdDoc!) },
        });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur inconnue';
      toast.error(`Impossible de générer le brief. ${msg}`);
    } finally {
      setGeneratingBrief(false);
    }
  }, [onClose, clientId, reportData?.title, addDocument, openDocument]);

  const consumeStreamResponse = useCallback(
    async <T,>(res: Response, resultKey: 'architecture' | 'homepage'): Promise<{ data?: T; error?: string }> => {
      if (!res.ok) return { error: `${resultKey === 'architecture' ? 'Architecte web' : 'Homepage'} : ${res.status}` };
      const reader = res.body?.getReader();
      if (!reader) return { error: 'Stream invalide' };
      const decoder = new TextDecoder();
      let buffer = '';
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const json = JSON.parse(line.slice(6).trim()) as { t: string; error?: string; architecture?: unknown; homepage?: unknown };
                if (json.t === 'error') return { error: json.error ?? 'Erreur inconnue' };
                if (json.t === 'done' && (json.architecture || json.homepage)) {
                  return { data: (json[resultKey] ?? json.architecture ?? json.homepage) as T };
                }
              } catch {
                /* ignorer lignes invalides */
              }
            }
          }
        }
        return { error: `Réponse incomplète (${resultKey})` };
      } finally {
        reader.releaseLock();
      }
    },
    []
  );

  const runWebGeneration = useCallback(
    async (payload: { brandPlatform: unknown; strategyText: string; copywriterText: string }) => {
      if (!clientId) {
        toast.error('Client requis pour générer l\'architecture web.');
        return;
      }
      setGeneratingWeb(true);
      const showError = (msg: string) => toast.error(msg, { duration: 10000 });
      try {
        const archRes = await fetch('/api/web-architect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reportContent: selectedDocument.content,
            brandPlatform: payload.brandPlatform,
            strategyText: payload.strategyText,
            copywriterText: payload.copywriterText,
          }),
        });
        const archResult = await consumeStreamResponse<WebBriefData['architecture']>(archRes, 'architecture');
        if (archResult.error) {
          showError(`Architecte web : ${archResult.error}`);
          return;
        }
        const archData = archResult.data!;
        const homeRes = await fetch('/api/homepage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reportContent: selectedDocument.content,
            brandPlatform: payload.brandPlatform,
            copywriterText: payload.copywriterText,
            siteArchitecture: archData,
          }),
        });
        const homeResult = await consumeStreamResponse<WebBriefData['homepage']>(homeRes, 'homepage');
        if (homeResult.error) {
          showError(`Homepage : ${homeResult.error}`);
          return;
        }
        const homeData = homeResult.data!;
        const webBrief: WebBriefData = {
          version: 1,
          architecture: archData,
          homepage: homeData,
          generatedAt: new Date().toISOString(),
        };
        const createdDoc = await addDocument(clientId, {
          type: 'web-brief',
          title: `Structure site - ${new Date().toLocaleDateString('fr-FR')}`,
          content: JSON.stringify(webBrief),
        });
        onClose();
        openDocument(createdDoc);
        toast.success('Structure du site générée');
      } catch (err) {
        let msg = 'Erreur inconnue';
        if (err instanceof Error) msg = err.message;
        else if (typeof err === 'string') msg = err;
        else if (err && typeof err === 'object') {
          const o = err as Record<string, unknown>;
          if (typeof o.message === 'string') msg = o.message;
          else if (typeof o.error === 'string') msg = o.error;
          else if (Object.keys(o).length > 0) msg = JSON.stringify(o);
        }
        showError(`Impossible de générer : ${msg}`);
      } finally {
        setGeneratingWeb(false);
      }
    },
    [clientId, selectedDocument.content, addDocument, openDocument, onClose, consumeStreamResponse]
  );

  const runSmmGeneration = useCallback(
    async (payload: { brandPlatform?: unknown; strategyText: string; copywriterText: string; reportContent?: string }) => {
      if (!clientId) {
        toast.error('Client requis pour générer le brief social.');
        return;
      }
      setGeneratingSmm(true);
      const showError = (msg: string) => toast.error(msg, { duration: 10000 });
      try {
        const res = await fetch('/api/smm-brief', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            brandPlatform: payload.brandPlatform,
            strategyText: payload.strategyText,
            copywriterText: payload.copywriterText,
            reportContent: payload.reportContent ?? '',
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({})) as { error?: string };
          showError(err.error ?? 'Erreur API');
          return;
        }
        const reader = res.body?.getReader();
        if (!reader) {
          showError('Réponse vide');
          return;
        }
        const decoder = new TextDecoder();
        let buffer = '';
        let socialBrief: SocialBriefData | null = null;
        let errorMessage: string | null = null;
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const obj = JSON.parse(line.slice(6)) as { t?: string; socialBrief?: SocialBriefData; message?: string };
                if (obj.t === 'done' && obj.socialBrief) {
                  socialBrief = obj.socialBrief;
                } else if (obj.t === 'error' && obj.message) {
                  errorMessage = obj.message;
                }
              } catch {
                // ignore malformed lines
              }
            }
          }
        }
        if (errorMessage) {
          showError(errorMessage);
          return;
        }
        if (!socialBrief) {
          showError('Réponse incomplète');
          return;
        }
        const createdDoc = await addDocument(clientId, {
          type: 'social-brief',
          title: `Brief Social - ${new Date().toLocaleDateString('fr-FR')}`,
          content: JSON.stringify(socialBrief),
        });
        onClose();
        openDocument(createdDoc);
        toast.success('Brief social généré');
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erreur inconnue';
        showError(`Impossible de générer : ${msg}`);
      } finally {
        setGeneratingSmm(false);
      }
    },
    [clientId, addDocument, openDocument, onClose]
  );

  const handleGenerateBrief = useCallback(() => {
    const transcript = reportData?.rawTranscript;
    if (transcript) {
      runBriefGeneration(transcript);
    } else {
      setShowTranscriptInput((v) => !v);
    }
  }, [reportData, runBriefGeneration]);

  const handleFallbackSubmit = useCallback(() => {
    if (!fallbackTranscript.trim()) return;
    // Persiste rawTranscript dans le document pour les prochaines fois
    if (reportData && clientId) {
      const next = { ...reportData, rawTranscript: fallbackTranscript.trim() };
      updateDocument(clientId, selectedDocument.id, { content: JSON.stringify(next) });
    }
    runBriefGeneration(fallbackTranscript.trim());
  }, [fallbackTranscript, reportData, clientId, selectedDocument.id, updateDocument, runBriefGeneration]);

  const handleDeleteClick = () => setShowDeleteConfirm(true);
  const handleDeleteCancel = () => setShowDeleteConfirm(false);
  const handleDeleteConfirm = () => {
    onDeleteDocument?.();
    setShowDeleteConfirm(false);
    toast.success('Document supprime');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby={isWebBrief ? undefined : 'document-modal-title'}
    >
      <div className={`absolute inset-0 ${isWebBrief ? 'bg-black/60' : 'bg-black/70'}`} />
      <div
        className={`relative overflow-hidden animate-fade-in-up flex flex-col bg-[var(--bg-card)] shadow-2xl ${isWebBrief ? 'max-sm:w-full max-sm:h-full max-sm:m-0 max-sm:rounded-none max-sm:border-0 sm:rounded-2xl sm:border sm:border-[var(--border-subtle)] sm:w-[90vw] sm:max-w-6xl sm:max-h-[90vh] sm:m-4' : 'rounded-2xl border border-[var(--border-subtle)] w-[95vw] sm:w-[90vw] max-w-6xl max-h-[90vh] m-4'}`}
        onClick={e => e.stopPropagation()}
        style={{ animationDuration: '0.2s' }}
      >
        {/* Web-brief : composant dédié avec header enrichi + WebBriefView */}
        {isWebBrief ? (
          <WebBriefDocumentContent
            selectedDocument={selectedDocument}
            clientId={clientId}
            onClose={onClose}
            onEditDocument={onEditDocument}
          />
        ) : (
          <>
        <div className="flex-shrink-0 border-b border-[var(--border-subtle)] flex items-start justify-between gap-4 px-6 py-5">
          <div className="flex items-start gap-4 min-w-0 flex-1">
            <span className={`p-2.5 rounded-xl ${docStyle.bg} ${docStyle.text} flex-shrink-0`}>
              {docStyle.icon}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className={`text-[10px] font-bold uppercase tracking-wider ${docStyle.text}`}>
                  {docStyle.label}
                </span>
                <span className="text-[10px] text-[var(--text-muted)]">-</span>
                <span className="text-[10px] text-[var(--text-muted)]">
                  {formatDocDate(selectedDocument.createdAt)}
                </span>
                {(() => {
                  try {
                    const parsed = JSON.parse(selectedDocument.content) as { _meta?: { generationCost?: { estimatedUsd?: number } } };
                    const usd = parsed?._meta?.generationCost?.estimatedUsd;
                    if (typeof usd === 'number' && usd > 0) {
                      return (
                        <span className="text-[10px] text-[var(--text-muted)]" title="Coût estimé de génération">
                          ~{(usd < 0.01 ? '<0.01' : usd.toFixed(2))} $
                        </span>
                      );
                    }
                  } catch { /* non-JSON content */ }
                  return null;
                })()}
              </div>
              <h2 id="document-modal-title" className="text-xl font-bold text-[var(--text-primary)] truncate">
                {selectedDocument.title}
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={() => downloadDocumentAsMarkdown(selectedDocument)}
              className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-[var(--accent-cyan)] transition-colors"
              title="Télécharger en .md"
            >
              <Download />
            </button>
            {onEditDocument && (
              <button
                type="button"
                onClick={onEditDocument}
                className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                title="Modifier"
              >
                <Edit />
              </button>
            )}
            {onDeleteDocument && (
              <button
                type="button"
                onClick={handleDeleteClick}
                className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-red-400 transition-colors"
                title="Supprimer"
              >
                <Trash />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              <X />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6 min-h-0">
          {showTemplated && selectedDocument.type === 'brief' && structured && (
            isCreativeBriefTemplate(structured) ? (
              <CreativeBriefView data={structured} />
            ) : isBriefTemplate(structured) ? (
              <BriefTemplatedView data={structured} />
            ) : (
              <BriefContentView content={selectedDocument.content} />
            )
          )}
          {selectedDocument.type === 'social-brief' && (() => {
            try {
              const data = JSON.parse(selectedDocument.content) as SocialBriefData;
              if (data?.version === 1 && Array.isArray(data?.content_pillars) && Array.isArray(data?.channels)) {
                return <SocialBriefView data={data} />;
              }
            } catch {
              // Invalid JSON
            }
            return (
              <p className="text-[var(--text-secondary)] text-sm">Contenu invalide.</p>
            );
          })()}
          {showTemplated && selectedDocument.type === 'report' && (
            <ReportView
              data={structured as ReportPlaudTemplate}
              clientId={clientId}
              onAddDeliverable={onAddDeliverable}
              onSuggestContact={onSuggestContact}
              onAddCall={onAddCall}
              onEventAdded={onEventAdded}
              onBackfillAddedEventKeys={onBackfillAddedEventKeys}
            />
          )}
          {!showTemplated && (
            selectedDocument.type === 'brief' ? (
              <BriefContentView content={selectedDocument.content} />
            ) : selectedDocument.type === 'creative-strategy' ? (
              <CreativeStrategyView
                content={selectedDocument.content}
                onGenerateWebBrief={clientId ? runWebGeneration : undefined}
                onGenerateSmmBrief={clientId ? runSmmGeneration : undefined}
                isGeneratingWeb={generatingWeb}
                isGeneratingSmm={generatingSmm}
              />
            ) : selectedDocument.type === 'web-brief' || selectedDocument.type === 'social-brief' ? null : (
              <div className="prose prose-invert max-w-none">
                <p className="text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap text-[15px]">
                  {selectedDocument.content}
                </p>
              </div>
            )
          )}
        </div>
        <div className="flex-shrink-0 border-t border-[var(--border-subtle)]">
          {showTranscriptInput && (
            <div className="px-6 pt-4 pb-3 border-b border-[var(--border-subtle)] space-y-2">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-[var(--accent-violet)]">
                Colle le transcript PLAUD pour générer le brief
              </label>
              <textarea
                value={fallbackTranscript}
                onChange={(e) => setFallbackTranscript(e.target.value)}
                placeholder="Colle ici le texte exporté depuis l'app PLAUD…"
                rows={4}
                className="w-full px-3 py-2 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] resize-none focus:outline-none focus:border-[var(--accent-violet)]/40 transition-colors"
                autoFocus
              />
              <button
                onClick={handleFallbackSubmit}
                disabled={!fallbackTranscript.trim() || generatingBrief}
                className="w-full py-2 rounded-lg bg-[var(--accent-violet)] text-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              >
                {generatingBrief ? (
                  <>
                    <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Génération…
                  </>
                ) : (
                  'Générer le brief →'
                )}
              </button>
            </div>
          )}
          <div className="px-6 py-4 flex items-center justify-between gap-3 flex-wrap">
            <span className="text-xs text-[var(--text-muted)]">
              Dernière modification : {formatDocDate(selectedDocument.updatedAt)}
            </span>
            <div className="flex items-center gap-2 flex-1 sm:flex-initial justify-end">
              {selectedDocument.type === 'brief' && (
                <button
                  type="button"
                  onClick={() => {
                    const briefForBoard = (() => {
                      const parsed = parseStructuredDocument(selectedDocument.content, 'brief');
                      if (parsed && isCreativeBriefTemplate(parsed)) {
                        return creativeBriefToBoardInput(parsed);
                      }
                      return selectedDocument.content;
                    })();
                    try {
                      sessionStorage.setItem('creative-board-brief-prefill', briefForBoard);
                      if (clientId) sessionStorage.setItem('creative-board-client-id', clientId);
                    } catch { /* navigation privée — on continue sans prefill */ }
                    navigateToCreativeBoard();
                    onClose();
                  }}
                  className="px-4 py-2 rounded-lg bg-[var(--accent-lime)]/15 border border-[var(--accent-lime)]/30 text-sm font-semibold text-[var(--accent-lime)] hover:bg-[var(--accent-lime)]/25 transition-colors flex items-center gap-2"
                >
                  <span>⬡</span>
                  Envoyer au board
                </button>
              )}
              {reportData && (
                <button
                  onClick={handleGenerateBrief}
                  disabled={generatingBrief}
                  className="px-4 py-2 rounded-lg bg-[var(--accent-violet)]/15 border border-[var(--accent-violet)]/30 text-sm font-semibold text-[var(--accent-violet)] hover:bg-[var(--accent-violet)]/25 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {generatingBrief ? (
                    <>
                      <span className="w-3 h-3 border-2 border-[var(--accent-violet)]/30 border-t-[var(--accent-violet)] rounded-full animate-spin" />
                      Génération…
                    </>
                  ) : (
                    '⬡ Brief Créatif →'
                  )}
                </button>
              )}
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-[var(--bg-tertiary)] text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
          </>
        )}
      </div>

      {showDeleteConfirm && (
        <div
          className="absolute inset-0 z-10 flex items-center justify-center p-4 bg-black/50"
          onClick={handleDeleteCancel}
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-delete-title"
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6 shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <p id="confirm-delete-title" className="text-[var(--text-primary)] font-medium mb-4">
              Supprimer ce document ?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={handleDeleteCancel}
                className="px-4 py-2 rounded-lg bg-[var(--bg-tertiary)] text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function DocumentModal() {
  const openModal = useAppStore((s) => s.openModal);
  const { selectedDocument, closeDocument, selectedClientId, addDeliverable, addCall, deleteDocument } = useAppStore();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeDocument();
    },
    [closeDocument]
  );

  useEffect(() => {
    if (selectedDocument) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [selectedDocument, handleKeyDown]);

  const structured = useMemo(() => {
    if (!selectedDocument || (selectedDocument.type !== 'brief' && selectedDocument.type !== 'report')) return null;
    return parseStructuredDocument(selectedDocument.content, selectedDocument.type);
  }, [selectedDocument?.content, selectedDocument?.type]);

  const onEditDocument = useCallback(() => {
    if (!selectedDocument || !selectedClientId) return;
    closeDocument();
    openModal({
      type: 'document',
      mode: 'edit',
      clientId: selectedClientId,
      document: selectedDocument,
    });
  }, [selectedDocument, selectedClientId, closeDocument, openModal]);

  const onDeleteDocument = useCallback(() => {
    if (!selectedDocument || !selectedClientId) return;
    deleteDocument(selectedClientId, selectedDocument.id);
    closeDocument();
  }, [selectedDocument, selectedClientId, deleteDocument, closeDocument]);

  const handleSuggestContact = useCallback(
    (name: string) => {
      if (!selectedClientId) return;
      closeDocument();
      openModal({
        type: 'contact',
        mode: 'create',
        clientId: selectedClientId,
        presetContact: { name, role: 'Intervenant' },
      });
    },
    [selectedClientId, closeDocument, openModal]
  );
  const handleAddContact = handleSuggestContact;

  const handleAddCall = useCallback(
    (call: Omit<Call, 'id' | 'createdAt'>) => {
      addCall(call);
    },
    [addCall]
  );

  return selectedDocument ? (
    <DocumentModalContent
      document={selectedDocument}
      structured={structured}
      onClose={closeDocument}
      clientId={selectedClientId ?? undefined}
      onAddDeliverable={addDeliverable}
      onSuggestContact={handleAddContact}
      onAddCall={handleAddCall}
      onEditDocument={onEditDocument}
      onDeleteDocument={onDeleteDocument}
    />
  ) : null;
}

'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import type { BoardEvent, AgentId, AgentStyle } from '@/app/api/creative-board/route';
import { useAppStore } from '@/lib/store';
import { toast } from '@/lib/toast';

const AGENT_IDS: AgentId[] = ['strategist', 'bigidea', 'architect', 'copywriter', 'devil', 'yam'];

const STYLE_LABELS: Record<AgentStyle, string> = {
  corporate: 'Corporate',
  audacieux: 'Audacieux',
  subversif: 'Subversif',
};

// ─── Config agents ─────────────────────────────────────────────────────────────

const AGENT_CONFIG: Record<AgentId, { label: string; icon: string; description: string; rawColor: string; rawDim: string }> = {
  strategist: { label: 'Le Stratège',     icon: '◈', description: 'La faille, pas le plan',        rawColor: 'var(--accent-cyan)',   rawDim: 'var(--accent-cyan-dim)'   },
  bigidea:    { label: 'Le Concepteur',   icon: '⬡', description: '3 angles → vous choisissez',   rawColor: 'var(--accent-amber)',  rawDim: 'var(--accent-amber-dim)'  },
  architect:  { label: "L'Architecte",    icon: '🏛️', description: 'Vision, Mission, Valeurs',      rawColor: 'var(--accent-violet)', rawDim: 'var(--accent-violet-dim)' },
  copywriter: { label: 'Le Copywriter',   icon: '✦', description: 'Smart, net, légèrement taquin', rawColor: 'var(--accent-lime)',   rawDim: 'var(--accent-lime-dim)'   },
  devil:      { label: "Devil's Advocate",icon: '◉', description: 'Bullshit audit',                rawColor: 'var(--accent-coral)',  rawDim: 'var(--accent-coral-dim)'  },
  yam:        { label: 'Yam',             icon: '◆', description: 'Relecture et touche Yam',       rawColor: 'var(--accent-magenta)', rawDim: 'var(--accent-magenta-dim)' },
};

// Tailwind literal strings for JIT
const AGENT_TEXT: Record<AgentId, string> = {
  strategist: 'text-[var(--accent-cyan)]',
  bigidea:    'text-[var(--accent-amber)]',
  architect:  'text-[var(--accent-violet)]',
  copywriter: 'text-[var(--accent-lime)]',
  devil:      'text-[var(--accent-coral)]',
  yam:        'text-[var(--accent-magenta)]',
};

// ─── Types ─────────────────────────────────────────────────────────────────────

type TimelineEntryInput =
  | { kind: 'orchestrator'; text: string }
  | { kind: 'handoff'; to: AgentId; reason: string }
  | { kind: 'agent'; agent: AgentId; text: string; done: boolean }
  | { kind: 'selection'; title: string }
  | { kind: 'report'; text: string };

type TimelineEntry = TimelineEntryInput & { id: number };
type BoardPhase = 'idle' | 'phase1' | 'selecting' | 'phase2' | 'done';

// ─── Markdown components ────────────────────────────────────────────────────────

const agentMarkdownComponents: Components = {
  h1: ({ children }) => <h1 className="text-xl font-bold text-[var(--text-primary)] mb-3 leading-snug tracking-tight">{children}</h1>,
  h2: ({ children }) => <h2 className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-primary)] mt-5 mb-2 opacity-90">{children}</h2>,
  h3: ({ children }) => <h3 className="text-sm font-semibold text-[var(--text-secondary)] mt-3.5 mb-1.5">{children}</h3>,
  p:  ({ children }) => <p  className="mb-3.5 leading-relaxed">{children}</p>,
  blockquote: ({ children }) => (
    <blockquote className="my-4 pl-4 border-l-2 border-[var(--border-medium)] text-[var(--text-secondary)] italic leading-relaxed">
      {children}
    </blockquote>
  ),
  strong: ({ children }) => <strong className="font-bold text-[var(--text-primary)]">{children}</strong>,
  ul: ({ children }) => <ul className="my-2.5 pl-5 space-y-1.5 list-disc">{children}</ul>,
  ol: ({ children }) => <ol className="my-2.5 pl-5 space-y-1.5 list-decimal">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  hr: () => <hr className="border-t border-[var(--border-medium)] my-4" />,
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

function BrandPlatformView({ data }: { data: BrandPlatformData }) {
  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Introduction : Le Champ de Bataille */}
      <section className="grid md:grid-cols-3 gap-4">
        <div className="bg-[var(--bg-tertiary)]/50 p-5 rounded-xl border border-[var(--border-subtle)]">
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">Status Quo</h4>
          <p className="text-sm">{data.the_battlefield.status_quo}</p>
        </div>
        <div className="bg-red-500/5 p-5 rounded-xl border border-red-500/20">
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-red-400 mb-2">L'Ennemi</h4>
          <p className="text-sm text-red-200/90">{data.the_battlefield.the_enemy}</p>
        </div>
        <div className="bg-[var(--accent-lime)]/5 p-5 rounded-xl border border-[var(--accent-lime)]/20">
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent-lime)] mb-2">Le Gap</h4>
          <p className="text-sm text-[var(--accent-lime)]/90">{data.the_battlefield.the_gap}</p>
        </div>
      </section>

      {/* Identité & Héros */}
      <section className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase text-[var(--text-secondary)]">Identité Profonde</h3>
          <div className="bg-[var(--bg-card)] p-6 rounded-xl border border-[var(--border-subtle)] space-y-4">
            <div>
              <span className="text-xs text-[var(--text-muted)]">Histoire d'origine</span>
              <p className="text-sm mt-1">{data.core_identity.origin_story}</p>
            </div>
            <div>
              <span className="text-xs text-[var(--text-muted)]">Promesse Radicale</span>
              <p className="text-lg font-bold text-[var(--text-primary)] mt-1">"{data.core_identity.radical_promise}"</p>
            </div>
            <div>
              <span className="text-xs text-[var(--text-muted)]">Archétypes</span>
              <div className="flex gap-2 mt-1">
                <span className="px-2 py-1 rounded bg-[var(--bg-tertiary)] text-xs font-medium">{data.core_identity.archetype_mix.dominant}</span>
                <span className="text-xs text-[var(--text-muted)] self-center">+</span>
                <span className="px-2 py-1 rounded bg-[var(--bg-tertiary)] text-xs font-medium">{data.core_identity.archetype_mix.twist}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase text-[var(--text-secondary)]">Casting</h3>
          <div className="grid gap-4 h-full">
            <div className="bg-[var(--accent-cyan)]/5 p-5 rounded-xl border border-[var(--accent-cyan)]/20">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">🤩</span>
                <h4 className="text-xs font-bold text-[var(--accent-cyan)]">Le Client Idéal</h4>
              </div>
              <p className="text-sm text-[var(--text-secondary)]">{data.the_hero_and_villain.the_cult_member}</p>
            </div>
            <div className="bg-[var(--bg-tertiary)] p-5 rounded-xl border border-[var(--border-subtle)] opacity-70">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">🚫</span>
                <h4 className="text-xs font-bold text-[var(--text-muted)]">L'Anti-Persona</h4>
              </div>
              <p className="text-sm text-[var(--text-muted)]">{data.the_hero_and_villain.the_anti_persona}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Matrice d'Expression */}
      <section>
        <h3 className="text-sm font-bold uppercase text-[var(--text-secondary)] mb-4">Matrice d'Expression</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            {data.expression_matrix.is_vs_is_not.map((item, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-tertiary)]/30 border border-[var(--border-subtle)]">
                <span className="font-medium text-[var(--accent-lime)]">{item.is}</span>
                <span className="text-xs text-[var(--text-muted)]">mais pas</span>
                <span className="font-medium text-[var(--text-muted)] line-through decoration-red-500/50">{item.is_not}</span>
              </div>
            ))}
          </div>
          <div className="space-y-4">
            <div>
              <span className="text-xs text-[var(--text-muted)] block mb-2">Mots Clés</span>
              <div className="flex flex-wrap gap-2">
                {data.expression_matrix.vocabulary_trigger_words.map((w, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-md bg-[var(--accent-cyan)]/10 text-[var(--accent-cyan)] text-xs border border-[var(--accent-cyan)]/20">{w}</span>
                ))}
              </div>
            </div>
            <div>
              <span className="text-xs text-[var(--text-muted)] block mb-2">Mots Interdits</span>
              <div className="flex flex-wrap gap-2">
                {data.expression_matrix.banned_words.map((w, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-md bg-red-500/10 text-red-400 text-xs border border-red-500/20">{w}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Manifeste */}
      <section className="bg-[var(--bg-card)] p-8 rounded-xl border border-[var(--border-subtle)] relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5 text-4xl">📜</div>
        <div className="space-y-6 relative z-10 font-serif text-[var(--text-primary)]">
          <p className="text-lg leading-relaxed border-l-2 border-red-500/50 pl-4">{data.the_manifesto.part_1_frustration}</p>
          <p className="text-lg leading-relaxed border-l-2 border-[var(--accent-cyan)]/50 pl-4">{data.the_manifesto.part_2_belief}</p>
          <p className="text-xl font-bold leading-relaxed border-l-4 border-[var(--accent-lime)] pl-4 text-[var(--accent-lime)]">{data.the_manifesto.part_3_solution}</p>
        </div>
      </section>
    </div>
  );
}

// ─── Composants ────────────────────────────────────────────────────────────────

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1 ml-1.5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1 h-1 rounded-full bg-[var(--text-muted)]"
          style={{ animation: `board-dot 1.2s ease-in-out ${i * 0.2}s infinite` }}
        />
      ))}
    </span>
  );
}

function AgentPane({ agent, text, done }: { agent: AgentId; text: string; done: boolean }) {
  const cfg = AGENT_CONFIG[agent];
  return (
    <div
      className="rounded-xl px-6 py-5 min-h-48 border text-sm leading-relaxed"
      style={{ background: cfg.rawDim, borderColor: `${cfg.rawColor}25` }}
    >
      {!text && <span className="text-[var(--text-muted)]">En attente…</span>}
      {text && !done && <span className="whitespace-pre-wrap">{text}</span>}
      {text && done && (
        <div className="agent-markdown">
          <ReactMarkdown components={agentMarkdownComponents}>{text}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}

function SelectionBadge({ title }: { title: string }) {
  return (
    <div className="mb-4">
      <div className="inline-flex items-center gap-2.5 bg-[var(--accent-amber-dim)] border border-[var(--accent-amber)]/30 rounded-xl px-4 py-2.5">
        <span className="text-[var(--accent-amber)]">⬡</span>
        <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">Angle retenu</span>
        <span className="text-sm font-semibold text-[var(--accent-amber)]">{title}</span>
      </div>
    </div>
  );
}

function IdeaCards({
  ideas,
  scores,
  onSelect,
}: {
  ideas: { title: string; body: string }[];
  scores?: { index: number; total: number; flags?: string[] }[];
  onSelect: (idea: { title: string; body: string }) => void;
}) {
  return (
    <div className="mt-5">
      <div className="flex items-center gap-2 mb-4">
        <span
          className="w-2 h-2 rounded-full bg-[var(--accent-amber)]"
          style={{ animation: 'board-dot 1.2s ease-in-out infinite' }}
        />
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--accent-amber)]">
          Choisissez votre angle de rupture
        </span>
      </div>
      <div className="flex flex-col gap-3 max-h-[320px] overflow-y-auto pr-1">
        {ideas.map((idea, i) => {
          const sc = scores?.[i] ? { total: scores[i].total, flags: scores[i].flags } : null;
          return (
            <button
              key={i}
              onClick={() => onSelect(idea)}
              className="group w-full text-left bg-[var(--bg-card)] border border-[var(--accent-amber)]/20 rounded-xl px-5 py-4 hover:border-[var(--accent-amber)]/50 hover:bg-[var(--accent-amber-dim)] transition-all"
            >
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full border border-[var(--accent-amber)]/40 flex items-center justify-center text-xs text-[var(--accent-amber)] font-bold">
                    {i + 1}
                  </span>
                  <span className="text-sm font-bold text-[var(--accent-amber)] truncate">{idea.title}</span>
                </div>
                {sc && (
                  <span
                    className="flex-shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded bg-[var(--bg-tertiary)] text-[var(--text-muted)]"
                    title={sc.flags?.join(', ')}
                  >
                    {sc.total}/100{sc.flags?.length ? ' ⚠' : ''}
                  </span>
                )}
              </div>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed pl-9">{idea.body}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

type ReportSection = { title: string; body: string };

function parseReportSections(text: string): ReportSection[] {
  const cleaned = text.replace(/^##\s+.*\n?/m, '').trim();
  const parts = cleaned.split(/\n###\s+/);
  const sections: ReportSection[] = [];
  for (const part of parts) {
    if (!part.trim()) continue;
    const firstLine = part.indexOf('\n');
    const title = firstLine === -1 ? part.trim() : part.slice(0, firstLine).trim();
    const body = firstLine === -1 ? '' : part.slice(firstLine + 1).trim();
    if (title) sections.push({ title, body });
  }
  return sections;
}

const REPORT_CARD_STYLES: Record<string, { color: string; icon: string; bg: string }> = {
  'Tension stratégique':  { color: 'var(--accent-cyan)',   icon: '◈', bg: 'var(--accent-cyan-dim)'   },
  'Angle retenu':         { color: 'var(--accent-amber)',  icon: '⬡', bg: 'var(--accent-amber-dim)'  },
  'Plateforme de Marque': { color: 'var(--accent-violet)', icon: '🏛️', bg: 'var(--accent-violet-dim)' },
  'Territoire & Copy':    { color: 'var(--accent-lime)',   icon: '✦', bg: 'var(--accent-lime-dim)'   },
  'Points de vigilance':  { color: 'var(--accent-coral)',  icon: '◉', bg: 'var(--accent-coral-dim)'  },
  'Touche Yam':           { color: 'var(--accent-magenta)', icon: '◆', bg: 'var(--accent-magenta-dim)'  },
};

function ReportBlock({ text }: { text: string }) {
  const sections = parseReportSections(text);
  const defaultStyle = { color: 'var(--accent-lime)', icon: '◆', bg: 'var(--accent-lime-dim)' };
  const displaySections = sections.length > 0
    ? sections
    : [{ title: 'Synthèse', body: text.replace(/^##\s+.*\n?/m, '').trim() || text }];

  return (
    <div className="mt-8">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-1.5 h-4 rounded-full bg-[var(--accent-lime)]" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Synthèse du Board</span>
      </div>
      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
        {displaySections.map(({ title, body }, i) => {
          const s = REPORT_CARD_STYLES[title] ?? defaultStyle;
          
          // Détection auto du JSON pour la Plateforme de Marque
          const isPlatformSection = title === 'Plateforme de Marque';
          let platformData: BrandPlatformData | null = null;
          if (isPlatformSection) {
            try {
              // Extraction plus robuste : chercher le premier { et le dernier }
              const firstBrace = body.indexOf('{');
              const lastBrace = body.lastIndexOf('}');
              if (firstBrace !== -1 && lastBrace !== -1) {
                const jsonCandidate = body.substring(firstBrace, lastBrace + 1);
                platformData = JSON.parse(jsonCandidate);
              } else {
                // Fallback simple
                const cleanJson = body.replace(/```json\n?|\n?```/g, '').trim();
                platformData = JSON.parse(cleanJson);
              }
            } catch {
              // Pas du JSON valide, on affiche le texte brut
            }
          }

          return (
            <div
              key={i}
              className={`rounded-xl p-5 flex flex-col min-h-28 border ${isPlatformSection ? 'col-span-full' : ''}`}
              style={{ background: s.bg, borderColor: `${s.color}20` }}
            >
              <div className="flex items-center gap-2.5 mb-3 pb-3" style={{ borderBottom: `1px solid ${s.color}25` }}>
                <span
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-base font-bold flex-shrink-0"
                  style={{ background: `${s.color}18`, color: s.color }}
                >
                  {s.icon}
                </span>
                <span className="text-sm font-bold" style={{ color: s.color }}>{title}</span>
              </div>
              
              <div className="flex-1">
                {platformData ? (
                  <BrandPlatformView data={platformData} />
                ) : (
                  <p className="text-sm text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap">{body}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Page principale ────────────────────────────────────────────────────────────

export function CreativeBoardPage({ embedded = false }: { embedded?: boolean } = {}) {
  const [brief, setBrief] = useState('');
  const [running, setRunning] = useState(false);
  const [boardPhase, setBoardPhase] = useState<BoardPhase>('idle');
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [pendingIdeas, setPendingIdeas] = useState<{ title: string; body: string }[]>([]);
  const [pendingIdeaScores, setPendingIdeaScores] = useState<{ index: number; total: number; flags?: string[] }[]>([]);

  const [enabledAgents, setEnabledAgents] = useState<AgentId[]>(['strategist', 'bigidea', 'architect', 'copywriter', 'devil', 'yam']);
  const [agentStyles, setAgentStyles] = useState<Record<AgentId, AgentStyle>>({
    strategist: 'audacieux',
    bigidea: 'audacieux',
    architect: 'audacieux',
    copywriter: 'audacieux',
    devil: 'audacieux',
    yam: 'audacieux',
  });
  const [agentPrompts, setAgentPrompts] = useState<Partial<Record<AgentId, string>>>({});
  const [openCustomFor, setOpenCustomFor] = useState<AgentId | null>(null);
  const [presets, setPresets] = useState<Record<AgentId, Record<AgentStyle, string>> | null>(null);
  const [openPresetsFor, setOpenPresetsFor] = useState<AgentId | null>(null);
  const [activeAgentTab, setActiveAgentTab] = useState<AgentId>('strategist');

  const counterRef = useRef(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const userScrolledUpRef = useRef(false);
  const phase1OutputsRef = useRef({ strategist: '', bigidea: '' });
  const storedOutputsRef = useRef<{ strategist: string; bigidea: string } | null>(null);
  const savedReportRef = useRef(false);
  const addDocument = useAppStore((s) => s.addDocument);
  const clientIdRef = useRef<string | null>(null);
  useEffect(() => {
    const cid = sessionStorage.getItem('creative-board-client-id');
    if (cid) clientIdRef.current = cid;
  }, []);

  useEffect(() => {
    const prefill = sessionStorage.getItem('creative-board-brief-prefill');
    if (prefill) {
      setBrief(prefill);
      sessionStorage.removeItem('creative-board-brief-prefill');
    }
    fetch('/api/creative-board')
      .then((r) => r.ok ? r.json() : null)
      .then((data: { agents?: Record<AgentId, { name: string; prompts: Record<AgentStyle, string> }> } | null) => {
        if (data?.agents) {
          const next: Record<AgentId, Record<AgentStyle, string>> = {} as Record<AgentId, Record<AgentStyle, string>>;
          for (const id of AGENT_IDS) {
            if (data.agents[id]?.prompts) next[id] = { ...data.agents[id].prompts };
          }
          if (Object.keys(next).length > 0) setPresets(next);
        }
      })
      .catch(() => {});
  }, []);

  const getScrollContainer = useCallback(() => {
    let el = bottomRef.current?.parentElement;
    while (el) {
      const s = getComputedStyle(el);
      const ov = s.overflow + s.overflowY;
      if (/(auto|scroll|overlay)/.test(ov)) return el;
      el = el.parentElement;
    }
    return document.scrollingElement ?? document.documentElement;
  }, []);

  useEffect(() => {
    const container = getScrollContainer();
    const el = container instanceof Element ? container : (document.scrollingElement ?? document.documentElement);
    const onScroll = () => {
      const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      userScrolledUpRef.current = distFromBottom > 80;
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [getScrollContainer, timeline.length]);

  useEffect(() => {
    if (userScrolledUpRef.current) return;
    const container = getScrollContainer();
    const el = container instanceof Element ? container : (document.scrollingElement ?? document.documentElement);
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (distFromBottom < 80) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [timeline, pendingIdeas, getScrollContainer]);

  const addEntry = useCallback((entry: TimelineEntryInput) => {
    setTimeline((prev) => [...prev, { ...entry, id: ++counterRef.current } as TimelineEntry]);
  }, []);

  const updateLastAgent = useCallback((agent: AgentId, chunk: string) => {
    setTimeline((prev) => {
      const copy = [...prev];
      for (let i = copy.length - 1; i >= 0; i--) {
        if (copy[i].kind === 'agent' && (copy[i] as { agent: AgentId }).agent === agent) {
          const entry = copy[i] as { kind: 'agent'; agent: AgentId; text: string; done: boolean; id: number };
          copy[i] = { ...entry, text: entry.text + chunk };
          return copy;
        }
      }
      return copy;
    });
  }, []);

  const markAgentDone = useCallback((agent: AgentId) => {
    setTimeline((prev) => {
      const copy = [...prev];
      for (let i = copy.length - 1; i >= 0; i--) {
        if (copy[i].kind === 'agent' && (copy[i] as { agent: AgentId }).agent === agent) {
          const entry = copy[i] as { kind: 'agent'; agent: AgentId; text: string; done: boolean; id: number };
          copy[i] = { ...entry, done: true };
          return copy;
        }
      }
      return copy;
    });
  }, []);

  const handleBoardEvent = useCallback((event: BoardEvent) => {
    if (event.type === 'orchestrator') {
      addEntry({ kind: 'orchestrator', text: event.text });
      if (event.text.includes('Vérification des sources')) {
        toast.info(event.text, { duration: 10000 });
      }
    } else if (event.type === 'handoff') {
      addEntry({ kind: 'handoff', to: event.to, reason: event.reason });
      toast.info(`${AGENT_CONFIG[event.to].label} travaille…`);
    } else if (event.type === 'agent_start') {
      addEntry({ kind: 'agent', agent: event.agent, text: '', done: false });
      setActiveAgentTab(event.agent);
    } else if (event.type === 'agent_chunk') {
      updateLastAgent(event.agent, event.text);
      if (event.agent === 'strategist') phase1OutputsRef.current.strategist += event.text;
      if (event.agent === 'bigidea') phase1OutputsRef.current.bigidea += event.text;
    } else if (event.type === 'agent_done') {
      markAgentDone(event.agent);
    } else if (event.type === 'awaiting_selection') {
      storedOutputsRef.current = { ...phase1OutputsRef.current };
      setPendingIdeas(event.ideas);
      setPendingIdeaScores(event.scores ?? []);
      setBoardPhase('selecting');
      toast.info('Choisissez une direction créative ↓');
    } else if (event.type === 'report') {
      addEntry({ kind: 'report', text: event.text });
      const cid = clientIdRef.current ?? useAppStore.getState().selectedClientId;
      if (cid && !savedReportRef.current) {
        savedReportRef.current = true;
        sessionStorage.removeItem('creative-board-client-id');
        const title = `Stratégie créative - ${new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}`;
        const content = event.data ? JSON.stringify(event.data) : event.text;
        addDocument(cid, { type: 'creative-strategy', title, content })
          .then(() => toast.success('Stratégie enregistrée dans la fiche client'))
          .catch((err) => toast.error(`Impossible d'enregistrer : ${err instanceof Error ? err.message : 'Erreur inconnue'}`));
      } else {
        toast.success('Board terminé — Stratégie prête');
      }
    } else if (event.type === 'error') {
      addEntry({ kind: 'orchestrator', text: `Erreur : ${event.message}` });
    }
  }, [addEntry, updateLastAgent, markAgentDone]);

  const processStream = useCallback(async (res: Response) => {
    if (!res.ok || !res.body) {
      addEntry({ kind: 'orchestrator', text: "Erreur lors de la connexion à l'API." });
      return;
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split('\n\n');
      buffer = parts.pop() ?? '';
      for (const part of parts) {
        if (!part.startsWith('data: ')) continue;
        try {
          const event: BoardEvent = JSON.parse(part.slice(6));
          handleBoardEvent(event);
        } catch { /* ignore */ }
      }
    }
  }, [addEntry, handleBoardEvent]);

  const handleSubmit = async () => {
    if (!brief.trim() || running || enabledAgents.length === 0) return;
    setRunning(true);
    setBoardPhase('phase1');
    setTimeline([]);
    setPendingIdeas([]);
    setPendingIdeaScores([]);
    phase1OutputsRef.current = { strategist: '', bigidea: '' };
    storedOutputsRef.current = null;
    counterRef.current = 0;

    const payload: Record<string, unknown> = { brief, phase: 1, enabledAgents, agentStyles };
    const customPrompts = Object.fromEntries(
      Object.entries(agentPrompts).filter(([, v]) => typeof v === 'string' && v.trim() !== '')
    ) as Partial<Record<AgentId, string>>;
    if (Object.keys(customPrompts).length > 0) payload.agentPrompts = customPrompts;
    if (presets) payload.agentPresets = presets;

    const res = await fetch('/api/creative-board', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    await processStream(res);
    setRunning(false);
  };

  const handleSelectIdea = async (idea: { title: string; body: string }) => {
    if (!storedOutputsRef.current) return;
    setBoardPhase('phase2');
    setPendingIdeas([]);
    setRunning(true);
    addEntry({ kind: 'selection', title: idea.title });

    const { strategist, bigidea } = storedOutputsRef.current;
    const payload: Record<string, unknown> = {
      brief, phase: 2,
      selectedIdea: `${idea.title}\n\n${idea.body}`,
      strategistOutput: strategist, bigideaOutput: bigidea,
      enabledAgents, agentStyles,
    };
    const customPrompts = Object.fromEntries(
      Object.entries(agentPrompts).filter(([, v]) => typeof v === 'string' && v.trim() !== '')
    ) as Partial<Record<AgentId, string>>;
    if (Object.keys(customPrompts).length > 0) payload.agentPrompts = customPrompts;
    if (presets) payload.agentPresets = presets;

    const res = await fetch('/api/creative-board', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    await processStream(res);
    setRunning(false);
    setBoardPhase('done');
  };

  const agentOutputs = useMemo(() => {
    const out: Partial<Record<AgentId, { text: string; done: boolean }>> = {};
    for (const entry of timeline) {
      if (entry.kind === 'agent') {
        const e = entry as { agent: AgentId; text: string; done: boolean };
        out[e.agent] = { text: e.text, done: e.done };
      }
    }
    return out;
  }, [timeline]);

  const lastOrchestratorMessage = useMemo(() => {
    for (let i = timeline.length - 1; i >= 0; i--) {
      if (timeline[i].kind === 'orchestrator') return (timeline[i] as { text: string }).text;
    }
    return null;
  }, [timeline]);

  const isBlocked = running || boardPhase === 'selecting';

  const statusLabel =
    running ? 'Session en cours'
    : boardPhase === 'selecting' ? 'Choisissez une direction'
    : boardPhase === 'done' ? 'Session terminée'
    : null;

  const statusColor =
    running ? 'var(--accent-lime)'
    : boardPhase === 'selecting' ? 'var(--accent-amber)'
    : 'var(--text-muted)';

  const content = (
    <>
      <style>{`
        @keyframes board-dot {
          0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1); }
        }
      `}</style>
      <div className="w-full max-w-5xl mx-auto px-6 py-10 space-y-8">
        {!embedded && (
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              ← Retour au tableau de bord
            </Link>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--accent-violet-dim)] border border-[var(--accent-violet)]/25 text-[10px] font-bold uppercase tracking-widest text-[var(--accent-violet)]">
              ⬡ Proto
            </span>
          </div>
        )}

        {/* ── Header ── */}
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">Creative Board</h1>
          <p className="mt-2 text-sm text-[var(--text-muted)]">Choisissez votre équipe et le style de chaque agent</p>
        </div>

        {/* ── Équipe & styles ── */}
        <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-subtle)] overflow-hidden">
          <div className="px-5 py-4 border-b border-[var(--border-subtle)]">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Équipe & styles</span>
          </div>
          <div className="divide-y divide-[var(--border-subtle)]">
            {AGENT_IDS.map((agentId) => {
              const cfg = AGENT_CONFIG[agentId];
              const enabled = enabledAgents.includes(agentId);
              const style = agentStyles[agentId];
              const customOpen = openCustomFor === agentId;
              return (
                <div key={agentId} className="px-5 py-4 space-y-3">
                  <div className="flex items-center flex-wrap gap-2.5">
                    <label className="flex items-center gap-2.5 cursor-pointer min-w-40">
                      <input
                        type="checkbox"
                        checked={enabled}
                        onChange={() => {
                          setEnabledAgents((prev) =>
                            enabled
                              ? prev.filter((id) => id !== agentId)
                              : [...prev, agentId].sort((a, b) => AGENT_IDS.indexOf(a) - AGENT_IDS.indexOf(b))
                          );
                        }}
                        disabled={running}
                        className="w-4 h-4 rounded"
                        style={{ accentColor: cfg.rawColor }}
                      />
                      <span className={`text-sm font-semibold ${AGENT_TEXT[agentId]}`}>
                        {cfg.icon} {cfg.label}
                      </span>
                    </label>
                    <div className="flex gap-1.5">
                      {(['corporate', 'audacieux', 'subversif'] as const).map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setAgentStyles((prev) => ({ ...prev, [agentId]: s }))}
                          disabled={running}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                            style === s
                              ? 'border-2'
                              : 'border border-[var(--border-subtle)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:border-[var(--border-medium)]'
                          }`}
                          style={style === s ? { borderColor: cfg.rawColor, background: cfg.rawDim, color: cfg.rawColor } : undefined}
                        >
                          {STYLE_LABELS[s]}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => setOpenPresetsFor((prev) => prev === agentId ? null : agentId)}
                      disabled={running || presets === null}
                      className="px-3 py-1.5 rounded-lg text-xs border border-[var(--border-subtle)] text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {openPresetsFor === agentId ? '▼ Éditer les 3 styles' : '▶ Éditer les 3 styles'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setOpenCustomFor((prev) => prev === agentId ? null : agentId)}
                      disabled={running}
                      className="px-3 py-1.5 rounded-lg text-xs border border-[var(--border-subtle)] text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {customOpen ? '▼ Personnaliser' : '▶ Personnaliser'}
                    </button>
                  </div>
                  {openPresetsFor === agentId && presets && (
                    <div className="space-y-3 pt-1">
                      {(['corporate', 'audacieux', 'subversif'] as const).map((s) => (
                        <div key={s} className="space-y-1.5">
                          <label className="text-xs font-semibold text-[var(--text-secondary)]">{STYLE_LABELS[s]}</label>
                          <textarea
                            value={presets[agentId]?.[s] ?? ''}
                            onChange={(e) =>
                              setPresets((prev) =>
                                prev ? { ...prev, [agentId]: { ...prev[agentId], [s]: e.target.value } } : prev
                              )
                            }
                            disabled={running}
                            rows={5}
                            className="w-full px-4 py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] resize-vertical focus:outline-none focus:border-[var(--accent-violet)]/40 focus:ring-2 focus:ring-[var(--accent-violet)]/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed leading-relaxed"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                  {customOpen && (
                    <textarea
                      value={agentPrompts[agentId] ?? ''}
                      onChange={(e) => setAgentPrompts((prev) => ({ ...prev, [agentId]: e.target.value }))}
                      placeholder={`Prompt personnalisé pour ${cfg.label} (sinon le style choisi s'applique)`}
                      disabled={running}
                      rows={4}
                      className="w-full px-4 py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] resize-vertical focus:outline-none focus:border-[var(--accent-violet)]/40 focus:ring-2 focus:ring-[var(--accent-violet)]/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed leading-relaxed"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Brief input ── */}
        <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-subtle)] p-5 space-y-4">
          <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
            Brief client
          </label>
          <textarea
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            placeholder="Ex : On veut repositionner notre marque de mobilier haut de gamme pour toucher les 30-45 ans urbains. On a du mal à se différencier de nos concurrents scandinaves…"
            rows={5}
            disabled={isBlocked}
            className="w-full px-4 py-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] resize-vertical focus:outline-none focus:border-[var(--accent-violet)]/40 focus:ring-2 focus:ring-[var(--accent-violet)]/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed leading-relaxed"
          />
          <div className="flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={isBlocked || !brief.trim() || enabledAgents.length === 0}
              className="px-5 py-2.5 rounded-xl bg-[var(--accent-lime)] text-black text-sm font-bold tracking-tight hover:bg-[var(--accent-lime)]/90 disabled:bg-[var(--bg-tertiary)] disabled:text-[var(--text-muted)] disabled:cursor-not-allowed transition-all"
            >
              {running ? 'Board en cours…' : boardPhase === 'selecting' ? 'Choisissez une direction ↓' : 'Lancer le Board →'}
            </button>
          </div>
        </div>

        {timeline.length === 0 && !running && (
          <div className="grid grid-cols-2 gap-3">
            {AGENT_IDS.map((id) => {
              const cfg = AGENT_CONFIG[id];
              return (
                <div key={id} className="flex items-start gap-3 bg-[var(--bg-card)] rounded-xl border border-[var(--border-subtle)] px-4 py-3.5">
                  <span className="text-lg flex-shrink-0 mt-0.5" style={{ color: cfg.rawColor }}>{cfg.icon}</span>
                  <div>
                    <p className="text-xs font-semibold" style={{ color: cfg.rawColor }}>{cfg.label}</p>
                    <p className="text-[11px] text-[var(--text-muted)] mt-0.5">{cfg.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {timeline.length > 0 && (
          <div className="space-y-5">
            {statusLabel && (
              <div className="flex items-center gap-2 pb-4 border-b border-[var(--border-subtle)]">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{
                    background: statusColor,
                    animation: isBlocked ? 'board-dot 1.2s ease-in-out infinite' : 'none',
                  }}
                />
                <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: statusColor }}>
                  {statusLabel}
                </span>
              </div>
            )}
            {lastOrchestratorMessage && (
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5 w-7 h-7 rounded-full bg-[var(--bg-tertiary)] border border-[var(--accent-violet)]/30 flex items-center justify-center text-[11px] text-[var(--accent-violet)]">
                  ⬡
                </div>
                <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-secondary)] italic leading-relaxed max-w-lg">
                  {lastOrchestratorMessage}
                </div>
              </div>
            )}
            <div>
              <div className="flex gap-2 flex-wrap mb-4">
                {AGENT_IDS.map((id) => {
                  const cfg = AGENT_CONFIG[id];
                  const output = agentOutputs[id];
                  const done = output?.done ?? false;
                  const isActive = activeAgentTab === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setActiveAgentTab(id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 text-sm font-bold transition-all ${
                        isActive
                          ? ''
                          : 'border-[var(--border-subtle)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:border-[var(--border-medium)]'
                      }`}
                      style={isActive ? { borderColor: cfg.rawColor, background: cfg.rawDim, color: cfg.rawColor } : undefined}
                    >
                      <span>{cfg.icon}</span>
                      {cfg.label}
                      {done
                        ? <span className="text-[var(--text-muted)] font-normal text-xs ml-0.5">✓</span>
                        : (output && !done ? <TypingDots /> : null)
                      }
                    </button>
                  );
                })}
              </div>
              <AgentPane
                agent={activeAgentTab}
                text={agentOutputs[activeAgentTab]?.text ?? ''}
                done={agentOutputs[activeAgentTab]?.done ?? false}
              />
            </div>
            {timeline.some((e) => e.kind === 'selection') && (
              <SelectionBadge
                title={(timeline.find((e) => e.kind === 'selection') as { title: string } | undefined)?.title ?? ''}
              />
            )}
            {boardPhase === 'selecting' && pendingIdeas.length > 0 && (
              <div className="animate-fade-in-up">
                <IdeaCards ideas={pendingIdeas} scores={pendingIdeaScores} onSelect={handleSelectIdea} />
              </div>
            )}
            {timeline.some((e) => e.kind === 'report') && (
              <ReportBlock
                text={(timeline.find((e) => e.kind === 'report') as { text: string } | undefined)?.text ?? ''}
              />
            )}
            <div ref={bottomRef} />
          </div>
        )}

      </div>
    </>
  );

  if (embedded) return content;
  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {content}
    </div>
  );
}

/** Redirection vers l'app avec la vue Creative Board (liens directs / pipeline PLAUD). */
export default function ProtoCreativeBoardRedirect() {
  const router = useRouter();
  const navigateToCreativeBoard = useAppStore((s) => s.navigateToCreativeBoard);
  useEffect(() => {
    navigateToCreativeBoard();
    router.replace('/');
  }, [navigateToCreativeBoard, router]);
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
      <div className="h-10 w-10 rounded-full border-2 border-[var(--accent-lime)] border-t-transparent animate-spin" />
    </div>
  );
}

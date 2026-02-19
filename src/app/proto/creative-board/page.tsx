'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import type { BoardEvent, AgentId, AgentStyle } from '@/app/api/creative-board/route';

const AGENT_IDS: AgentId[] = ['strategist', 'bigidea', 'copywriter', 'devil'];

const STYLE_LABELS: Record<AgentStyle, string> = {
  corporate: 'Corporate',
  audacieux: 'Audacieux',
  subversif: 'Subversif',
};

// ─── Config agents ─────────────────────────────────────────────────────────────

const AGENT_CONFIG: Record<AgentId, { label: string; icon: string; description: string; rawColor: string; rawDim: string }> = {
  strategist: { label: 'Le Stratège',     icon: '◈', description: 'La faille, pas le plan',        rawColor: 'var(--accent-cyan)',   rawDim: 'var(--accent-cyan-dim)'   },
  bigidea:    { label: 'Le Concepteur',   icon: '⬡', description: '3 angles → vous choisissez',   rawColor: 'var(--accent-amber)',  rawDim: 'var(--accent-amber-dim)'  },
  copywriter: { label: 'Le Copywriter',   icon: '✦', description: 'Smart, net, légèrement taquin', rawColor: 'var(--accent-lime)',   rawDim: 'var(--accent-lime-dim)'   },
  devil:      { label: "Devil's Advocate",icon: '◉', description: 'Bullshit audit',                rawColor: 'var(--accent-coral)',  rawDim: 'var(--accent-coral-dim)'  },
};

// Tailwind literal strings for JIT
const AGENT_TEXT: Record<AgentId, string> = {
  strategist: 'text-[var(--accent-cyan)]',
  bigidea:    'text-[var(--accent-amber)]',
  copywriter: 'text-[var(--accent-lime)]',
  devil:      'text-[var(--accent-coral)]',
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
  onSelect,
}: {
  ideas: { title: string; body: string }[];
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
      <div className="flex flex-col gap-3">
        {ideas.map((idea, i) => (
          <button
            key={i}
            onClick={() => onSelect(idea)}
            className="group w-full text-left bg-[var(--bg-card)] border border-[var(--accent-amber)]/20 rounded-xl px-5 py-4 hover:border-[var(--accent-amber)]/50 hover:bg-[var(--accent-amber-dim)] transition-all"
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="flex-shrink-0 w-6 h-6 rounded-full border border-[var(--accent-amber)]/40 flex items-center justify-center text-xs text-[var(--accent-amber)] font-bold">
                {i + 1}
              </span>
              <span className="text-sm font-bold text-[var(--accent-amber)]">{idea.title}</span>
            </div>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed pl-9">{idea.body}</p>
          </button>
        ))}
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
  'Territoire & Copy':    { color: 'var(--accent-lime)',   icon: '✦', bg: 'var(--accent-lime-dim)'   },
  'Points de vigilance':  { color: 'var(--accent-coral)',  icon: '◉', bg: 'var(--accent-coral-dim)'  },
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
          return (
            <div
              key={i}
              className="rounded-xl p-5 flex flex-col min-h-28 border"
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
              <p className="text-sm text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap flex-1">{body}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Page principale ────────────────────────────────────────────────────────────

export default function CreativeBoardPage() {
  const [brief, setBrief] = useState('');
  const [running, setRunning] = useState(false);
  const [boardPhase, setBoardPhase] = useState<BoardPhase>('idle');
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [pendingIdeas, setPendingIdeas] = useState<{ title: string; body: string }[]>([]);

  const [enabledAgents, setEnabledAgents] = useState<AgentId[]>(['strategist', 'bigidea', 'copywriter', 'devil']);
  const [agentStyles, setAgentStyles] = useState<Record<AgentId, AgentStyle>>({
    strategist: 'audacieux',
    bigidea: 'audacieux',
    copywriter: 'audacieux',
    devil: 'audacieux',
  });
  const [agentPrompts, setAgentPrompts] = useState<Partial<Record<AgentId, string>>>({});
  const [openCustomFor, setOpenCustomFor] = useState<AgentId | null>(null);
  const [presets, setPresets] = useState<Record<AgentId, Record<AgentStyle, string>> | null>(null);
  const [openPresetsFor, setOpenPresetsFor] = useState<AgentId | null>(null);
  const [activeAgentTab, setActiveAgentTab] = useState<AgentId>('strategist');

  const counterRef = useRef(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const phase1OutputsRef = useRef({ strategist: '', bigidea: '' });
  const storedOutputsRef = useRef<{ strategist: string; bigidea: string } | null>(null);

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

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [timeline, pendingIdeas]);

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
    } else if (event.type === 'handoff') {
      addEntry({ kind: 'handoff', to: event.to, reason: event.reason });
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
      setBoardPhase('selecting');
    } else if (event.type === 'report') {
      addEntry({ kind: 'report', text: event.text });
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

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <style>{`
        @keyframes board-dot {
          0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1); }
        }
      `}</style>

      <div className="max-w-3xl mx-auto px-6 py-10 space-y-8">

        {/* ── Navigation ── */}
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

                    {/* Checkbox + nom */}
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

                    {/* Style buttons */}
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

                    {/* Éditer presets */}
                    <button
                      type="button"
                      onClick={() => setOpenPresetsFor((prev) => prev === agentId ? null : agentId)}
                      disabled={running || presets === null}
                      className="px-3 py-1.5 rounded-lg text-xs border border-[var(--border-subtle)] text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {openPresetsFor === agentId ? '▼ Éditer les 3 styles' : '▶ Éditer les 3 styles'}
                    </button>

                    {/* Personnaliser */}
                    <button
                      type="button"
                      onClick={() => setOpenCustomFor((prev) => prev === agentId ? null : agentId)}
                      disabled={running}
                      className="px-3 py-1.5 rounded-lg text-xs border border-[var(--border-subtle)] text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {customOpen ? '▼ Personnaliser' : '▶ Personnaliser'}
                    </button>
                  </div>

                  {/* Presets editor */}
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

                  {/* Prompt custom */}
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

        {/* ── Agents legend (idle) ── */}
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

        {/* ── Session en cours ── */}
        {timeline.length > 0 && (
          <div className="space-y-5">

            {/* Status bar */}
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

            {/* Dernier message orchestrateur */}
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

            {/* Onglets agents */}
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

            {/* Angle retenu */}
            {timeline.some((e) => e.kind === 'selection') && (
              <SelectionBadge
                title={(timeline.find((e) => e.kind === 'selection') as { title: string } | undefined)?.title ?? ''}
              />
            )}

            {/* Choix d'angle */}
            {boardPhase === 'selecting' && pendingIdeas.length > 0 && (
              <div className="animate-fade-in-up">
                <IdeaCards ideas={pendingIdeas} onSelect={handleSelectIdea} />
              </div>
            )}

            {/* Synthèse finale */}
            {timeline.some((e) => e.kind === 'report') && (
              <ReportBlock
                text={(timeline.find((e) => e.kind === 'report') as { text: string } | undefined)?.text ?? ''}
              />
            )}

            <div ref={bottomRef} />
          </div>
        )}

      </div>
    </div>
  );
}

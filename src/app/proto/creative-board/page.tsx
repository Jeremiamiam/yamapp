'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import type { BoardEvent, AgentId } from '@/app/api/creative-board/route';

// ─── Config agents ─────────────────────────────────────────────────────────────

const AGENT_CONFIG: Record<AgentId, { label: string; icon: string; description: string; rawColor: string; rawDim: string }> = {
  strategist: { label: 'Le Stratège',      icon: '◈', description: 'La faille, pas le plan',        rawColor: 'var(--accent-cyan)',   rawDim: 'var(--accent-cyan-dim)'   },
  bigidea:    { label: 'La Big Idea',       icon: '⬡', description: '3 angles → vous choisissez',   rawColor: 'var(--accent-amber)',  rawDim: 'var(--accent-amber-dim)'  },
  copywriter: { label: 'Le Copywriter',     icon: '✦', description: 'Smart, net, légèrement taquin', rawColor: 'var(--accent-lime)',   rawDim: 'var(--accent-lime-dim)'   },
  devil:      { label: "Devil's Advocate",  icon: '◉', description: 'Bullshit audit',                rawColor: 'var(--accent-coral)',  rawDim: 'var(--accent-coral-dim)'  },
};

// Tailwind class strings as literals so JIT picks them up
const AGENT_TEXT_CLASSES: Record<AgentId, string> = {
  strategist: 'text-[var(--accent-cyan)]',
  bigidea:    'text-[var(--accent-amber)]',
  copywriter: 'text-[var(--accent-lime)]',
  devil:      'text-[var(--accent-coral)]',
};

// ─── Types internes ────────────────────────────────────────────────────────────

type TimelineEntryInput =
  | { kind: 'orchestrator'; text: string }
  | { kind: 'handoff'; to: AgentId; reason: string }
  | { kind: 'agent'; agent: AgentId; text: string; done: boolean }
  | { kind: 'selection'; title: string }
  | { kind: 'report'; text: string };

type TimelineEntry = TimelineEntryInput & { id: number };

type BoardPhase = 'idle' | 'phase1' | 'selecting' | 'phase2' | 'done';

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

function OrchestratorBubble({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <div className="flex-shrink-0 mt-0.5 w-7 h-7 rounded-full bg-[var(--bg-tertiary)] border border-[var(--accent-violet)]/30 flex items-center justify-center text-[11px] text-[var(--accent-violet)]">
        ⬡
      </div>
      <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-secondary)] italic max-w-md leading-relaxed">
        {text}
      </div>
    </div>
  );
}

function HandoffRow({ to, reason }: { to: AgentId; reason: string }) {
  const cfg = AGENT_CONFIG[to];
  const textClass = AGENT_TEXT_CLASSES[to];
  return (
    <div className="flex items-center gap-3 pl-10 py-1.5 opacity-60">
      <div className="w-4 h-px" style={{ background: cfg.rawColor }} />
      <span className={`text-[10px] font-bold uppercase tracking-widest ${textClass}`}>
        → {cfg.label}
      </span>
      <span className="text-[11px] text-[var(--text-muted)]">— {reason}</span>
    </div>
  );
}

function AgentBlock({ agent, text, done }: { agent: AgentId; text: string; done: boolean }) {
  const cfg = AGENT_CONFIG[agent];
  const textClass = AGENT_TEXT_CLASSES[agent];
  return (
    <div className="ml-10 mb-3 border-l-2 pl-4" style={{ borderColor: cfg.rawColor }}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm" style={{ color: cfg.rawColor }}>{cfg.icon}</span>
        <span className={`text-[10px] font-bold uppercase tracking-widest ${textClass}`}>
          {cfg.label}
        </span>
        {!done && <TypingDots />}
        {done && <span className="text-[10px] text-[var(--text-muted)] ml-0.5">✓</span>}
      </div>
      <div className="rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap min-h-5" style={{ background: cfg.rawDim }}>
        {text || <span className="text-[var(--text-muted)]">…</span>}
      </div>
    </div>
  );
}

function SelectionBadge({ title }: { title: string }) {
  return (
    <div className="ml-10 mb-3">
      <div className="inline-flex items-center gap-2.5 bg-[var(--accent-amber-dim)] border border-[var(--accent-amber)]/30 rounded-xl px-4 py-2">
        <span className="text-[var(--accent-amber)] text-sm">⬡</span>
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
    <div className="mt-5 ml-10">
      <div className="flex items-center gap-2 mb-4">
        <span
          className="w-1.5 h-1.5 rounded-full bg-[var(--accent-amber)]"
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
              <span className="flex-shrink-0 w-5 h-5 rounded-full border border-[var(--accent-amber)]/40 flex items-center justify-center text-[10px] text-[var(--accent-amber)] font-bold">
                {i + 1}
              </span>
              <span className="text-sm font-semibold text-[var(--accent-amber)]">{idea.title}</span>
            </div>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed pl-8">{idea.body}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

function ReportBlock({ text }: { text: string }) {
  const lines = text.split('\n');
  return (
    <div className="mt-6 bg-[var(--bg-card)] border border-[var(--accent-lime)]/20 rounded-xl px-6 py-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1.5 h-4 rounded-full bg-[var(--accent-lime)]" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--accent-lime)]">
          Synthèse du Board
        </span>
      </div>
      <div className="text-sm text-[var(--text-primary)] leading-relaxed space-y-1">
        {lines.map((line, i) => {
          if (line.startsWith('## ')) return null;
          if (line.startsWith('### ')) {
            return (
              <p key={i} className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] pt-4 pb-1">
                {line.replace('### ', '')}
              </p>
            );
          }
          return <p key={i} className="whitespace-pre-wrap">{line}</p>;
        })}
      </div>
    </div>
  );
}

// ─── Page principale ───────────────────────────────────────────────────────────

export default function CreativeBoardPage() {
  const [brief, setBrief] = useState('');
  const [running, setRunning] = useState(false);
  const [boardPhase, setBoardPhase] = useState<BoardPhase>('idle');
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [pendingIdeas, setPendingIdeas] = useState<{ title: string; body: string }[]>([]);

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
    if (!brief.trim() || running) return;
    setRunning(true);
    setBoardPhase('phase1');
    setTimeline([]);
    setPendingIdeas([]);
    phase1OutputsRef.current = { strategist: '', bigidea: '' };
    storedOutputsRef.current = null;
    counterRef.current = 0;
    const res = await fetch('/api/creative-board', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brief, phase: 1 }),
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
    const res = await fetch('/api/creative-board', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        brief,
        phase: 2,
        selectedIdea: `${idea.title}\n\n${idea.body}`,
        strategistOutput: strategist,
        bigideaOutput: bigidea,
      }),
    });
    await processStream(res);
    setRunning(false);
    setBoardPhase('done');
  };

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
      {/* keyframe défini localement pour les dots de frappe */}
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
          <h1 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight leading-tight">
            Creative Board
          </h1>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            4 agents, 2 phases — vous choisissez votre Big Idea
          </p>
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
            rows={4}
            disabled={isBlocked}
            className="w-full px-4 py-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] resize-none focus:outline-none focus:border-[var(--accent-violet)]/40 focus:ring-2 focus:ring-[var(--accent-violet)]/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed leading-relaxed"
          />
          <div className="flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={isBlocked || !brief.trim()}
              className="px-5 py-2.5 rounded-xl bg-[var(--accent-lime)] text-black text-sm font-bold tracking-tight hover:bg-[var(--accent-lime)]/90 disabled:bg-[var(--bg-tertiary)] disabled:text-[var(--text-muted)] disabled:cursor-not-allowed transition-all"
            >
              {running ? 'Board en cours…' : boardPhase === 'selecting' ? 'Choisissez une direction ↓' : 'Lancer le Board →'}
            </button>
          </div>
        </div>

        {/* ── Agents legend (état idle) ── */}
        {timeline.length === 0 && !running && (
          <div className="grid grid-cols-2 gap-3">
            {(Object.entries(AGENT_CONFIG) as [AgentId, typeof AGENT_CONFIG[AgentId]][]).map(([id, cfg]) => (
              <div
                key={id}
                className="flex items-start gap-3 bg-[var(--bg-card)] rounded-xl border border-[var(--border-subtle)] px-4 py-3.5"
              >
                <span className="text-lg flex-shrink-0 mt-0.5" style={{ color: cfg.rawColor }}>{cfg.icon}</span>
                <div>
                  <p className="text-xs font-semibold" style={{ color: cfg.rawColor }}>{cfg.label}</p>
                  <p className="text-[11px] text-[var(--text-muted)] mt-0.5">{cfg.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Timeline ── */}
        {timeline.length > 0 && (
          <div className="space-y-0.5">

            {/* Status bar */}
            {statusLabel && (
              <div className="flex items-center gap-2 mb-5 pb-4 border-b border-[var(--border-subtle)]">
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    background: statusColor,
                    animation: (running || boardPhase === 'selecting') ? 'board-dot 1.2s ease-in-out infinite' : 'none',
                  }}
                />
                <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: statusColor }}>
                  {statusLabel}
                </span>
              </div>
            )}

            {timeline.map((entry) => {
              if (entry.kind === 'orchestrator') return <OrchestratorBubble key={entry.id} text={entry.text} />;
              if (entry.kind === 'handoff')     return <HandoffRow key={entry.id} to={entry.to} reason={entry.reason} />;
              if (entry.kind === 'agent')       return <AgentBlock key={entry.id} agent={entry.agent} text={entry.text} done={entry.done} />;
              if (entry.kind === 'selection')   return <SelectionBadge key={entry.id} title={entry.title} />;
              if (entry.kind === 'report')      return <ReportBlock key={entry.id} text={entry.text} />;
              return null;
            })}

            {boardPhase === 'selecting' && pendingIdeas.length > 0 && (
              <div className="animate-fade-in-up">
                <IdeaCards ideas={pendingIdeas} onSelect={handleSelectIdea} />
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        )}

      </div>
    </div>
  );
}

'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import type { BoardEvent, AgentId } from '@/app/api/creative-board/route';

// ─── Config agents ────────────────────────────────────────────────────────────

const AGENT_CONFIG: Record<AgentId, { label: string; color: string; accent: string; icon: string }> = {
  strategist: {
    label: 'Le Stratège',
    color: 'var(--accent-cyan)',
    accent: 'var(--accent-cyan-dim)',
    icon: '◈',
  },
  bigidea: {
    label: 'La Big Idea',
    color: 'var(--accent-amber)',
    accent: 'var(--accent-amber-dim)',
    icon: '⬡',
  },
  copywriter: {
    label: 'Le Copywriter',
    color: 'var(--accent-lime)',
    accent: 'var(--accent-lime-dim)',
    icon: '✦',
  },
  devil: {
    label: "Devil's Advocate",
    color: 'var(--accent-coral)',
    accent: 'var(--accent-coral-dim)',
    icon: '◉',
  },
};

// ─── Types internes ───────────────────────────────────────────────────────────

type TimelineEntryInput =
  | { kind: 'orchestrator'; text: string }
  | { kind: 'handoff'; to: AgentId; reason: string }
  | { kind: 'agent'; agent: AgentId; text: string; done: boolean }
  | { kind: 'selection'; title: string }
  | { kind: 'report'; text: string };

type TimelineEntry = TimelineEntryInput & { id: number };

type BoardPhase = 'idle' | 'phase1' | 'selecting' | 'phase2' | 'done';

// ─── Composants ───────────────────────────────────────────────────────────────

function TypingDots() {
  return (
    <span style={{ display: 'inline-flex', gap: 3, alignItems: 'center', marginLeft: 6 }}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: 4,
            height: 4,
            borderRadius: '50%',
            background: 'var(--text-muted)',
            display: 'inline-block',
            animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
    </span>
  );
}

function OrchestratorBubble({ text }: { text: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 0' }}>
      <div style={{
        width: 28,
        height: 28,
        borderRadius: '50%',
        background: 'var(--bg-tertiary)',
        border: '1px solid var(--accent-violet)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 12,
        color: 'var(--accent-violet)',
        flexShrink: 0,
        marginTop: 2,
      }}>
        ⬡
      </div>
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid rgba(167,139,250,0.2)',
        borderRadius: 10,
        padding: '8px 14px',
        fontSize: 13,
        color: 'var(--text-secondary)',
        fontStyle: 'italic',
        maxWidth: 480,
      }}>
        {text}
      </div>
    </div>
  );
}

function HandoffRow({ to, reason }: { to: AgentId; reason: string }) {
  const cfg = AGENT_CONFIG[to];
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '6px 0 6px 38px',
      opacity: 0.7,
    }}>
      <div style={{ width: 20, height: 1, background: cfg.color, opacity: 0.5 }} />
      <span style={{ fontSize: 11, color: cfg.color, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
        → {cfg.label}
      </span>
      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>— {reason}</span>
    </div>
  );
}

function AgentBlock({
  agent,
  text,
  done,
}: {
  agent: AgentId;
  text: string;
  done: boolean;
}) {
  const cfg = AGENT_CONFIG[agent];
  return (
    <div style={{
      marginLeft: 38,
      marginBottom: 8,
      borderLeft: `2px solid ${cfg.color}`,
      paddingLeft: 14,
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginBottom: 6,
      }}>
        <span style={{ color: cfg.color, fontSize: 14 }}>{cfg.icon}</span>
        <span style={{
          fontSize: 11,
          fontWeight: 600,
          color: cfg.color,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}>
          {cfg.label}
        </span>
        {!done && <TypingDots />}
        {done && (
          <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 4 }}>✓</span>
        )}
      </div>
      <div style={{
        background: cfg.accent,
        borderRadius: 8,
        padding: '10px 14px',
        fontSize: 13,
        color: 'var(--text-primary)',
        lineHeight: 1.6,
        whiteSpace: 'pre-wrap',
        minHeight: done ? 'auto' : 20,
      }}>
        {text || <span style={{ color: 'var(--text-muted)' }}>…</span>}
      </div>
    </div>
  );
}

function SelectionBadge({ title }: { title: string }) {
  return (
    <div style={{ marginLeft: 38, marginBottom: 8 }}>
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        background: 'rgba(251,191,36,0.1)',
        border: '1px solid rgba(251,191,36,0.4)',
        borderRadius: 8,
        padding: '7px 14px',
        fontSize: 13,
      }}>
        <span style={{ color: 'var(--accent-amber)' }}>⬡</span>
        <span style={{ color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Angle retenu</span>
        <span style={{ color: 'var(--accent-amber)', fontWeight: 600 }}>{title}</span>
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
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <div style={{ marginTop: 20, marginLeft: 38 }}>
      <div style={{
        fontSize: 11,
        fontWeight: 700,
        color: 'var(--accent-amber)',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        marginBottom: 14,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}>
        <span style={{
          display: 'inline-block',
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: 'var(--accent-amber)',
          animation: 'pulse 1.2s ease-in-out infinite',
        }} />
        Choisissez votre angle de rupture
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {ideas.map((idea, i) => (
          <button
            key={i}
            onClick={() => onSelect(idea)}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            style={{
              background: hovered === i ? 'rgba(251,191,36,0.07)' : 'var(--bg-card)',
              border: `1px solid ${hovered === i ? 'rgba(251,191,36,0.55)' : 'rgba(251,191,36,0.2)'}`,
              borderRadius: 10,
              padding: '14px 18px',
              textAlign: 'left',
              cursor: 'pointer',
              fontFamily: 'Instrument Sans, sans-serif',
              transition: 'all 0.15s',
              color: 'var(--text-primary)',
              width: '100%',
            }}
          >
            <div style={{
              fontSize: 13,
              fontWeight: 700,
              color: 'var(--accent-amber)',
              marginBottom: 6,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}>
              <span style={{
                width: 20,
                height: 20,
                borderRadius: '50%',
                border: '1px solid rgba(251,191,36,0.4)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                flexShrink: 0,
              }}>{i + 1}</span>
              {idea.title}
            </div>
            <div style={{
              fontSize: 13,
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
              paddingLeft: 28,
            }}>
              {idea.body}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function ReportBlock({ text }: { text: string }) {
  const lines = text.split('\n');
  return (
    <div style={{
      marginTop: 24,
      border: '1px solid rgba(212,245,66,0.2)',
      borderRadius: 12,
      padding: '20px 24px',
      background: 'rgba(212,245,66,0.03)',
    }}>
      <div style={{
        fontSize: 11,
        color: 'var(--accent-lime)',
        fontWeight: 700,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        marginBottom: 16,
      }}>
        ◈ Synthèse du Board
      </div>
      <div style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--text-primary)' }}>
        {lines.map((line, i) => {
          if (line.startsWith('## ')) return null;
          if (line.startsWith('### ')) {
            return (
              <div key={i} style={{
                fontSize: 11,
                fontWeight: 700,
                color: 'var(--text-muted)',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                marginTop: 16,
                marginBottom: 6,
              }}>
                {line.replace('### ', '')}
              </div>
            );
          }
          return <div key={i} style={{ whiteSpace: 'pre-wrap' }}>{line}</div>;
        })}
      </div>
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────

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

  // ─── SSE stream processor ─────────────────────────────────────────────────

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
        } catch {
          // ignore parse errors
        }
      }
    }
  }, [addEntry, handleBoardEvent]);

  // ─── Phase 1 ──────────────────────────────────────────────────────────────

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
    // boardPhase is now 'selecting' (set via awaiting_selection event)
  };

  // ─── Phase 2 ──────────────────────────────────────────────────────────────

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

  // ─── Status label ─────────────────────────────────────────────────────────

  const statusLabel = running
    ? 'Session en cours'
    : boardPhase === 'selecting'
    ? 'Choisissez une direction'
    : boardPhase === 'done'
    ? 'Session terminée'
    : null;

  const statusColor = running
    ? 'var(--accent-lime)'
    : boardPhase === 'selecting'
    ? 'var(--accent-amber)'
    : 'var(--text-muted)';

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      fontFamily: 'Instrument Sans, sans-serif',
    }}>
      <style>{`
        @keyframes pulse {
          0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1); }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px' }}>

        {/* Header */}
        <div style={{ marginBottom: 48 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: 'var(--accent-violet-dim)',
            border: '1px solid rgba(167,139,250,0.3)',
            borderRadius: 20,
            padding: '4px 12px',
            marginBottom: 16,
            fontSize: 11,
            color: 'var(--accent-violet)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            fontWeight: 600,
          }}>
            ⬡ Proto — Board Créatif IA
          </div>
          <h1 style={{
            fontFamily: 'Syne, sans-serif',
            fontSize: 32,
            fontWeight: 800,
            margin: 0,
            lineHeight: 1.1,
          }}>
            Creative Board
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 8, marginBottom: 0 }}>
            4 agents, 2 phases — vous choisissez votre Big Idea
          </p>
        </div>

        {/* Brief input */}
        <div style={{ marginBottom: 32 }}>
          <label style={{
            display: 'block',
            fontSize: 11,
            fontWeight: 600,
            color: 'var(--text-muted)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            marginBottom: 10,
          }}>
            Brief client
          </label>
          <textarea
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            placeholder="Ex : On veut repositionner notre marque de mobilier haut de gamme pour toucher les 30-45 ans urbains. On a du mal à se différencier de nos concurrents scandinaves..."
            rows={4}
            style={{
              width: '100%',
              background: 'var(--bg-card)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 10,
              padding: '14px 16px',
              fontSize: 14,
              color: 'var(--text-primary)',
              resize: 'vertical',
              outline: 'none',
              fontFamily: 'Instrument Sans, sans-serif',
              lineHeight: 1.6,
              boxSizing: 'border-box',
              transition: 'border-color 0.2s',
            }}
            onFocus={(e) => e.target.style.borderColor = 'rgba(167,139,250,0.4)'}
            onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
            disabled={running || boardPhase === 'selecting'}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
            <button
              onClick={handleSubmit}
              disabled={running || !brief.trim() || boardPhase === 'selecting'}
              style={{
                background: (running || boardPhase === 'selecting') ? 'var(--bg-tertiary)' : 'var(--accent-lime)',
                color: (running || boardPhase === 'selecting') ? 'var(--text-muted)' : '#0a0a0b',
                border: 'none',
                borderRadius: 8,
                padding: '10px 24px',
                fontSize: 13,
                fontWeight: 700,
                cursor: (running || !brief.trim() || boardPhase === 'selecting') ? 'not-allowed' : 'pointer',
                fontFamily: 'Instrument Sans, sans-serif',
                letterSpacing: '0.02em',
                transition: 'all 0.2s',
              }}
            >
              {running ? 'Board en cours…' : boardPhase === 'selecting' ? 'Choisissez une direction ↓' : 'Lancer le Board →'}
            </button>
          </div>
        </div>

        {/* Agents legend */}
        {timeline.length === 0 && !running && (
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 12,
            padding: '16px',
            background: 'var(--bg-secondary)',
            borderRadius: 10,
            marginBottom: 32,
          }}>
            {(Object.entries(AGENT_CONFIG) as [AgentId, typeof AGENT_CONFIG[AgentId]][]).map(([id, cfg]) => (
              <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 8, flex: '1 1 40%' }}>
                <span style={{ color: cfg.color, fontSize: 16 }}>{cfg.icon}</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: cfg.color }}>{cfg.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {id === 'strategist' && 'La faille, pas le plan'}
                    {id === 'bigidea' && '3 angles → vous choisissez'}
                    {id === 'copywriter' && 'Smart, net, légèrement taquin'}
                    {id === 'devil' && 'Bullshit audit'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Timeline */}
        {timeline.length > 0 && (
          <div>
            <div style={{
              fontSize: 11,
              fontWeight: 600,
              color: statusColor,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}>
              <div style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: statusColor,
                animation: (running || boardPhase === 'selecting') ? 'pulse 1.2s ease-in-out infinite' : 'none',
              }} />
              {statusLabel}
            </div>

            {timeline.map((entry) => {
              if (entry.kind === 'orchestrator') {
                return <OrchestratorBubble key={entry.id} text={entry.text} />;
              }
              if (entry.kind === 'handoff') {
                return <HandoffRow key={entry.id} to={entry.to} reason={entry.reason} />;
              }
              if (entry.kind === 'agent') {
                return (
                  <AgentBlock
                    key={entry.id}
                    agent={entry.agent}
                    text={entry.text}
                    done={entry.done}
                  />
                );
              }
              if (entry.kind === 'selection') {
                return <SelectionBadge key={entry.id} title={entry.title} />;
              }
              if (entry.kind === 'report') {
                return <ReportBlock key={entry.id} text={entry.text} />;
              }
              return null;
            })}

            {/* Idea selection cards */}
            {boardPhase === 'selecting' && pendingIdeas.length > 0 && (
              <div style={{ animation: 'fadeSlideUp 0.3s ease-out' }}>
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

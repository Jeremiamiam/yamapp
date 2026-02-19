'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import type { BoardEvent, AgentId, AgentStyle } from '@/app/api/creative-board/route';

const AGENT_IDS: AgentId[] = ['strategist', 'bigidea', 'copywriter', 'devil'];

const STYLE_LABELS: Record<AgentStyle, string> = {
  corporate: 'Corporate',
  audacieux: 'Audacieux',
  subversif: 'Subversif',
};

// ─── Config agents ────────────────────────────────────────────────────────────

const AGENT_CONFIG: Record<AgentId, { label: string; color: string; accent: string; icon: string }> = {
  strategist: {
    label: 'Le Stratège',
    color: 'var(--accent-cyan)',
    accent: 'var(--accent-cyan-dim)',
    icon: '◈',
  },
  bigidea: {
    label: 'Le Concepteur',
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

// ─── Rendu Markdown des sorties agents ───────────────────────────────────────

const agentMarkdownComponents: Components = {
  h1: ({ children }) => (
    <h1 style={{
      fontSize: 22,
      fontWeight: 700,
      color: 'var(--text-primary)',
      margin: '0 0 12px 0',
      letterSpacing: '-0.02em',
      lineHeight: 1.35,
    }}>
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 style={{
      fontSize: 17,
      fontWeight: 700,
      color: 'var(--text-primary)',
      margin: '20px 0 8px 0',
      letterSpacing: '0.04em',
      textTransform: 'uppercase',
      opacity: 0.95,
    }}>
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 style={{
      fontSize: 15,
      fontWeight: 600,
      color: 'var(--text-secondary)',
      margin: '14px 0 6px 0',
    }}>
      {children}
    </h3>
  ),
  p: ({ children }) => (
    <p style={{ margin: '0 0 14px 0', fontSize: 16, lineHeight: 1.75 }}>
      {children}
    </p>
  ),
  blockquote: ({ children }) => (
    <blockquote style={{
      margin: '16px 0',
      paddingLeft: 18,
      borderLeft: '3px solid var(--border-medium)',
      color: 'var(--text-secondary)',
      fontStyle: 'italic',
      fontSize: 16,
      lineHeight: 1.75,
    }}>
      {children}
    </blockquote>
  ),
  strong: ({ children }) => (
    <strong style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
      {children}
    </strong>
  ),
  ul: ({ children }) => (
    <ul style={{
      margin: '10px 0',
      paddingLeft: 24,
      fontSize: 16,
      lineHeight: 1.75,
    }}>
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol style={{
      margin: '10px 0',
      paddingLeft: 24,
      fontSize: 16,
      lineHeight: 1.75,
    }}>
      {children}
    </ol>
  ),
  li: ({ children }) => (
    <li style={{ marginBottom: 6 }}>
      {children}
    </li>
  ),
  hr: () => (
    <hr style={{
      border: 'none',
      borderTop: '1px solid var(--border-medium)',
      margin: '18px 0',
    }} />
  ),
};

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
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 0' }}>
      <div style={{
        width: 32,
        height: 32,
        borderRadius: '50%',
        background: 'var(--bg-tertiary)',
        border: '1px solid var(--accent-violet)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 14,
        color: 'var(--accent-violet)',
        flexShrink: 0,
        marginTop: 2,
      }}>
        ⬡
      </div>
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid rgba(167,139,250,0.2)',
        borderRadius: 12,
        padding: '12px 18px',
        fontSize: 16,
        lineHeight: 1.7,
        color: 'var(--text-secondary)',
        fontStyle: 'italic',
        maxWidth: 520,
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
      gap: 12,
      padding: '10px 0 10px 42px',
      opacity: 0.85,
    }}>
      <div style={{ width: 24, height: 1, background: cfg.color, opacity: 0.5 }} />
      <span style={{ fontSize: 13, fontWeight: 600, color: cfg.color, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
        → {cfg.label}
      </span>
      <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>— {reason}</span>
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
      marginLeft: 42,
      marginBottom: 16,
      borderLeft: `3px solid ${cfg.color}`,
      paddingLeft: 18,
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        marginBottom: 10,
      }}>
        <span style={{ color: cfg.color, fontSize: 18 }}>{cfg.icon}</span>
        <span style={{
          fontSize: 13,
          fontWeight: 700,
          color: cfg.color,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}>
          {cfg.label}
        </span>
        {!done && <TypingDots />}
        {done && (
          <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 4 }}>✓</span>
        )}
      </div>
      <div style={{
        background: cfg.accent,
        borderRadius: 12,
        padding: '18px 20px',
        fontSize: 16,
        color: 'var(--text-primary)',
        lineHeight: 1.75,
        minHeight: done ? 'auto' : 28,
      }}>
        {!text && <span style={{ color: 'var(--text-muted)', fontSize: 16 }}>…</span>}
        {text && !done && (
          <span style={{ whiteSpace: 'pre-wrap', fontSize: 16, lineHeight: 1.75 }}>{text}</span>
        )}
        {text && done && (
          <div className="agent-markdown">
            <ReactMarkdown components={agentMarkdownComponents}>
              {text}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}

/** Panneau plein largeur pour un agent (vue onglets) */
function AgentPane({
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
      background: cfg.accent,
      border: `1px solid ${cfg.color}25`,
      borderRadius: 14,
      padding: '24px 28px',
      minHeight: 200,
      maxWidth: '100%',
    }}>
      {!text && <span style={{ color: 'var(--text-muted)', fontSize: 16 }}>En attente…</span>}
      {text && !done && (
        <span style={{ whiteSpace: 'pre-wrap', fontSize: 17, lineHeight: 1.75, color: 'var(--text-primary)' }}>{text}</span>
      )}
      {text && done && (
        <div className="agent-markdown" style={{ fontSize: 17, lineHeight: 1.75 }}>
          <ReactMarkdown components={agentMarkdownComponents}>{text}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}

function SelectionBadge({ title }: { title: string }) {
  return (
    <div style={{ marginLeft: 42, marginBottom: 14 }}>
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 10,
        background: 'rgba(251,191,36,0.1)',
        border: '1px solid rgba(251,191,36,0.4)',
        borderRadius: 10,
        padding: '10px 18px',
        fontSize: 15,
      }}>
        <span style={{ color: 'var(--accent-amber)', fontSize: 16 }}>⬡</span>
        <span style={{ color: 'var(--text-muted)', fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Angle retenu</span>
        <span style={{ color: 'var(--accent-amber)', fontWeight: 700 }}>{title}</span>
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
    <div style={{ marginTop: 24, marginLeft: 42 }}>
      <div style={{
        fontSize: 13,
        fontWeight: 700,
        color: 'var(--accent-amber)',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        marginBottom: 18,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}>
        <span style={{
          display: 'inline-block',
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: 'var(--accent-amber)',
          animation: 'pulse 1.2s ease-in-out infinite',
        }} />
        Choisissez votre angle de rupture
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {ideas.map((idea, i) => (
          <button
            key={i}
            onClick={() => onSelect(idea)}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            style={{
              background: hovered === i ? 'rgba(251,191,36,0.07)' : 'var(--bg-card)',
              border: `1px solid ${hovered === i ? 'rgba(251,191,36,0.55)' : 'rgba(251,191,36,0.2)'}`,
              borderRadius: 12,
              padding: '18px 22px',
              textAlign: 'left',
              cursor: 'pointer',
              fontFamily: 'Instrument Sans, sans-serif',
              transition: 'all 0.15s',
              color: 'var(--text-primary)',
              width: '100%',
            }}
          >
            <div style={{
              fontSize: 16,
              fontWeight: 700,
              color: 'var(--accent-amber)',
              marginBottom: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}>
              <span style={{
                width: 26,
                height: 26,
                borderRadius: '50%',
                border: '1px solid rgba(251,191,36,0.4)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 14,
                flexShrink: 0,
              }}>{i + 1}</span>
              {idea.title}
            </div>
            <div style={{
              fontSize: 16,
              color: 'var(--text-secondary)',
              lineHeight: 1.75,
              paddingLeft: 36,
            }}>
              {idea.body}
            </div>
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
  'Tension stratégique': { color: 'var(--accent-cyan)', icon: '◈', bg: 'rgba(34,211,238,0.06)' },
  'Angle retenu': { color: 'var(--accent-amber)', icon: '⬡', bg: 'rgba(251,191,36,0.06)' },
  'Territoire & Copy': { color: 'var(--accent-lime)', icon: '✦', bg: 'rgba(212,245,66,0.06)' },
  'Points de vigilance': { color: 'var(--accent-coral)', icon: '◉', bg: 'rgba(251,113,133,0.06)' },
};

function ReportBlock({ text }: { text: string }) {
  const sections = parseReportSections(text);
  const defaultStyle = { color: 'var(--accent-lime)', icon: '◆', bg: 'rgba(212,245,66,0.05)' };
  const displaySections = sections.length > 0
    ? sections
    : [{ title: 'Synthèse', body: text.replace(/^##\s+.*\n?/m, '').trim() || text }];

  return (
    <div style={{ marginTop: 32 }}>
      <div style={{
        fontSize: 12,
        fontWeight: 700,
        color: 'var(--text-muted)',
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        marginBottom: 20,
      }}>
        Synthèse du Board
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: 16,
      }}>
        {displaySections.map(({ title, body }, i) => {
          const style = REPORT_CARD_STYLES[title] ?? defaultStyle;
          return (
            <div
              key={i}
              style={{
                background: style.bg,
                border: `1px solid ${style.color}20`,
                borderRadius: 14,
                padding: '20px 22px',
                minHeight: 120,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                marginBottom: 14,
                paddingBottom: 12,
                borderBottom: `1px solid ${style.color}25`,
              }}>
                <span style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  background: `${style.color}18`,
                  color: style.color,
                  fontSize: 16,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                }}>
                  {style.icon}
                </span>
                <span style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: style.color,
                  letterSpacing: '0.04em',
                }}>
                  {title}
                </span>
              </div>
              <div style={{
                fontSize: 15,
                lineHeight: 1.7,
                color: 'var(--text-primary)',
                whiteSpace: 'pre-wrap',
                flex: 1,
              }}>
                {body}
              </div>
            </div>
          );
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

  // ─── SSE stream processor ─────────────────────────────────────────────────

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

    const payload: Record<string, unknown> = {
      brief,
      phase: 1,
      enabledAgents,
      agentStyles,
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
  };

  // ─── Phase 2 ──────────────────────────────────────────────────────────────

  const handleSelectIdea = async (idea: { title: string; body: string }) => {
    if (!storedOutputsRef.current) return;

    setBoardPhase('phase2');
    setPendingIdeas([]);
    setRunning(true);

    addEntry({ kind: 'selection', title: idea.title });

    const { strategist, bigidea } = storedOutputsRef.current;

    const payload: Record<string, unknown> = {
      brief,
      phase: 2,
      selectedIdea: `${idea.title}\n\n${idea.body}`,
      strategistOutput: strategist,
      bigideaOutput: bigidea,
      enabledAgents,
      agentStyles,
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

  // ─── Status label ─────────────────────────────────────────────────────────

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

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '56px 28px' }}>

        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            background: 'var(--accent-violet-dim)',
            border: '1px solid rgba(167,139,250,0.3)',
            borderRadius: 20,
            padding: '6px 14px',
            marginBottom: 18,
            fontSize: 13,
            color: 'var(--accent-violet)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            fontWeight: 600,
          }}>
            ⬡ Proto — Board Créatif IA
          </div>
          <h1 style={{
            fontFamily: 'Syne, sans-serif',
            fontSize: 36,
            fontWeight: 800,
            margin: 0,
            lineHeight: 1.15,
          }}>
            Creative Board
          </h1>
          <p style={{ fontSize: 17, color: 'var(--text-muted)', marginTop: 10, marginBottom: 0, lineHeight: 1.5 }}>
            Choisissez votre équipe et le style de chaque agent
          </p>
        </div>

        {/* Équipe & styles */}
        <div style={{
          marginBottom: 36,
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 14,
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-subtle)',
            fontSize: 13,
            fontWeight: 700,
            color: 'var(--text-muted)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}>
            Équipe & styles
          </div>
          <div style={{ padding: '20px 22px' }}>
            {AGENT_IDS.map((agentId) => {
              const cfg = AGENT_CONFIG[agentId];
              const enabled = enabledAgents.includes(agentId);
              const style = agentStyles[agentId];
              const customOpen = openCustomFor === agentId;
              return (
                <div
                  key={agentId}
                  style={{
                    marginBottom: agentId === 'devil' ? 0 : 24,
                    paddingBottom: agentId === 'devil' ? 0 : 24,
                    borderBottom: agentId === 'devil' ? 'none' : '1px solid var(--border-subtle)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', minWidth: 160 }}>
                      <input
                        type="checkbox"
                        checked={enabled}
                        onChange={() => {
                          setEnabledAgents((prev) =>
                            enabled ? prev.filter((id) => id !== agentId) : [...prev, agentId].sort((a, b) => AGENT_IDS.indexOf(a) - AGENT_IDS.indexOf(b))
                          );
                        }}
                        disabled={running}
                        style={{ width: 18, height: 18, accentColor: cfg.color }}
                      />
                      <span style={{ color: cfg.color, fontSize: 16, fontWeight: 600 }}>{cfg.icon} {cfg.label}</span>
                    </label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {(['corporate', 'audacieux', 'subversif'] as const).map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setAgentStyles((prev) => ({ ...prev, [agentId]: s }))}
                          disabled={running}
                          style={{
                            padding: '8px 14px',
                            borderRadius: 10,
                            border: style === s ? `2px solid ${cfg.color}` : '1px solid var(--border-subtle)',
                            background: style === s ? cfg.accent : 'var(--bg-secondary)',
                            color: style === s ? cfg.color : 'var(--text-secondary)',
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: running ? 'not-allowed' : 'pointer',
                            opacity: running ? 0.7 : 1,
                          }}
                        >
                          {STYLE_LABELS[s]}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => setOpenPresetsFor((prev) => (prev === agentId ? null : agentId))}
                      disabled={running || presets === null}
                      style={{
                        padding: '8px 12px',
                        borderRadius: 10,
                        border: '1px solid var(--border-subtle)',
                        background: openPresetsFor === agentId ? 'var(--bg-tertiary)' : 'transparent',
                        color: 'var(--text-muted)',
                        fontSize: 13,
                        cursor: running || presets === null ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {openPresetsFor === agentId ? '▼ Éditer les 3 styles' : '▶ Éditer les 3 styles'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setOpenCustomFor((prev) => (prev === agentId ? null : agentId))}
                      disabled={running}
                      style={{
                        padding: '8px 12px',
                        borderRadius: 10,
                        border: '1px solid var(--border-subtle)',
                        background: customOpen ? 'var(--bg-tertiary)' : 'transparent',
                        color: 'var(--text-muted)',
                        fontSize: 13,
                        cursor: running ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {customOpen ? '▼ Personnaliser' : '▶ Personnaliser'}
                    </button>
                  </div>
                  {openPresetsFor === agentId && presets && (
                    <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {(['corporate', 'audacieux', 'subversif'] as const).map((s) => (
                        <div key={s} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
                            {STYLE_LABELS[s]}
                          </label>
                          <textarea
                            value={presets[agentId]?.[s] ?? ''}
                            onChange={(e) =>
                              setPresets((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      [agentId]: { ...prev[agentId], [s]: e.target.value },
                                    }
                                  : prev
                              )
                            }
                            disabled={running}
                            rows={6}
                            style={{
                              width: '100%',
                              boxSizing: 'border-box',
                              padding: 14,
                              borderRadius: 10,
                              border: '1px solid var(--border-subtle)',
                              background: 'var(--bg-secondary)',
                              fontSize: 15,
                              color: 'var(--text-primary)',
                              resize: 'vertical',
                              fontFamily: 'inherit',
                              lineHeight: 1.6,
                            }}
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
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        padding: 14,
                        borderRadius: 10,
                        border: '1px solid var(--border-subtle)',
                        background: 'var(--bg-secondary)',
                        fontSize: 15,
                        color: 'var(--text-primary)',
                        resize: 'vertical',
                        fontFamily: 'inherit',
                        lineHeight: 1.65,
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Brief input */}
        <div style={{ marginBottom: 36 }}>
          <label style={{
            display: 'block',
            fontSize: 13,
            fontWeight: 700,
            color: 'var(--text-muted)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            marginBottom: 12,
          }}>
            Brief client
          </label>
          <textarea
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            placeholder="Ex : On veut repositionner notre marque de mobilier haut de gamme pour toucher les 30-45 ans urbains. On a du mal à se différencier de nos concurrents scandinaves..."
            rows={5}
            style={{
              width: '100%',
              background: 'var(--bg-card)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 12,
              padding: '18px 20px',
              fontSize: 16,
              color: 'var(--text-primary)',
              resize: 'vertical',
              outline: 'none',
              fontFamily: 'Instrument Sans, sans-serif',
              lineHeight: 1.7,
              boxSizing: 'border-box',
              transition: 'border-color 0.2s',
            }}
            onFocus={(e) => e.target.style.borderColor = 'rgba(167,139,250,0.4)'}
            onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
            disabled={running || boardPhase === 'selecting'}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
            <button
              onClick={handleSubmit}
              disabled={running || !brief.trim() || boardPhase === 'selecting' || enabledAgents.length === 0}
              style={{
                background: (running || boardPhase === 'selecting') ? 'var(--bg-tertiary)' : 'var(--accent-lime)',
                color: (running || boardPhase === 'selecting') ? 'var(--text-muted)' : '#0a0a0b',
                border: 'none',
                borderRadius: 10,
                padding: '12px 28px',
                fontSize: 15,
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
            gap: 16,
            padding: '20px 22px',
            background: 'var(--bg-secondary)',
            borderRadius: 12,
            marginBottom: 36,
          }}>
            {(Object.entries(AGENT_CONFIG) as [AgentId, typeof AGENT_CONFIG[AgentId]][]).map(([id, cfg]) => (
              <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 10, flex: '1 1 40%' }}>
                <span style={{ color: cfg.color, fontSize: 20 }}>{cfg.icon}</span>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: cfg.color }}>{cfg.label}</div>
                  <div style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.4 }}>
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

        {/* Vue horizontale : agents côte à côte */}
        {timeline.length > 0 && (
          <div>
            <div style={{
              fontSize: 13,
              fontWeight: 700,
              color: statusColor,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}>
              <div style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: statusColor,
                animation: (running || boardPhase === 'selecting') ? 'pulse 1.2s ease-in-out infinite' : 'none',
              }} />
              {statusLabel}
            </div>

            {lastOrchestratorMessage && (
              <div style={{
                marginBottom: 16,
                padding: '10px 14px',
                background: 'var(--bg-secondary)',
                borderRadius: 10,
                borderLeft: '3px solid var(--accent-violet)',
                fontSize: 14,
                color: 'var(--text-secondary)',
                fontStyle: 'italic',
              }}>
                {lastOrchestratorMessage}
              </div>
            )}

            <div style={{ marginBottom: 24 }}>
              <div style={{
                display: 'flex',
                gap: 4,
                marginBottom: 16,
                flexWrap: 'wrap',
              }}>
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
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '12px 18px',
                        borderRadius: 12,
                        border: `2px solid ${isActive ? cfg.color : 'var(--border-subtle)'}`,
                        background: isActive ? `${cfg.color}18` : 'var(--bg-secondary)',
                        color: isActive ? cfg.color : 'var(--text-secondary)',
                        fontSize: 14,
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                    >
                      <span style={{ fontSize: 16 }}>{cfg.icon}</span>
                      {cfg.label}
                      {done ? <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}> ✓</span> : (output && !done ? <TypingDots /> : null)}
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
              <div style={{ animation: 'fadeSlideUp 0.3s ease-out', marginTop: 8 }}>
                <IdeaCards ideas={pendingIdeas} onSelect={handleSelectIdea} />
              </div>
            )}

            {timeline.filter((e) => e.kind === 'report').length > 0 && (
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

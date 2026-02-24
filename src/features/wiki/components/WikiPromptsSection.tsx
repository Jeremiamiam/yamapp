'use client';

import { useState, useEffect, useCallback } from 'react';
import type { AgentPromptEntry } from '@/app/api/agent-prompts/route';

// ── Feature config ────────────────────────────────────────────────────────────

type FeatureId = 'creative-board' | 'web-brief' | 'plaud' | 'layout' | 'retroplanning';

const FEATURES: { id: FeatureId; label: string; color: string }[] = [
  { id: 'creative-board', label: 'Creative Board', color: 'var(--accent-lime)' },
  { id: 'web-brief', label: 'Web Brief', color: 'var(--accent-magenta)' },
  { id: 'plaud', label: 'PLAUD', color: 'var(--accent-cyan)' },
  { id: 'layout', label: 'Layouts', color: 'var(--accent-violet)' },
  { id: 'retroplanning', label: 'Retroplanning', color: 'var(--accent-amber)' },
];

const STYLES = ['corporate', 'audacieux', 'subversif'] as const;
type StyleId = typeof STYLES[number];

const STYLE_LABELS: Record<StyleId, string> = {
  corporate: 'Corporate',
  audacieux: 'Audacieux',
  subversif: 'Subversif',
};

// ── Icons ─────────────────────────────────────────────────────────────────────

const PencilIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

const RotateCcwIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

// ── Agent card component ──────────────────────────────────────────────────────

interface AgentCardProps {
  entries: AgentPromptEntry[];
  featureColor: string;
  onSave: (agentId: string, style: string | undefined, content: string) => Promise<void>;
  onReset: (agentId: string, style: string | undefined) => Promise<void>;
}

function AgentCard({ entries, featureColor, onSave, onReset }: AgentCardProps) {
  // Group by agentId to get agent info (all entries have same agentId)
  const first = entries[0];
  const hasStyles = entries.some((e) => e.style !== undefined);

  // Active style tab for multi-style agents
  const [activeStyle, setActiveStyle] = useState<StyleId>('corporate');
  const [editingStyle, setEditingStyle] = useState<StyleId | null>(null);
  const [editContent, setEditContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedStyle, setSavedStyle] = useState<StyleId | null>(null);
  const [expanded, setExpanded] = useState(false);

  const activeEntry = hasStyles
    ? entries.find((e) => e.style === activeStyle) ?? entries[0]
    : entries[0];

  const startEdit = () => {
    const targetStyle = hasStyles ? activeStyle : undefined;
    const entry = hasStyles
      ? entries.find((e) => e.style === activeStyle) ?? entries[0]
      : entries[0];
    setEditContent(entry.currentPrompt);
    setEditingStyle(hasStyles ? activeStyle : (null as unknown as StyleId));
  };

  const cancelEdit = () => {
    setEditingStyle(null);
    setEditContent('');
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const targetStyle = hasStyles ? editingStyle ?? undefined : undefined;
      await onSave(first.agentId, targetStyle, editContent);
      setSavedStyle(editingStyle);
      setTimeout(() => setSavedStyle(null), 2000);
      setEditingStyle(null);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async (style?: StyleId) => {
    const targetStyle = hasStyles ? style ?? activeStyle : undefined;
    const entry = hasStyles
      ? entries.find((e) => e.style === (targetStyle ?? activeStyle)) ?? entries[0]
      : entries[0];
    if (!entry.isCustomized) return;
    await onReset(first.agentId, targetStyle);
  };

  const isEditingThis = hasStyles
    ? editingStyle === activeStyle
    : editingStyle !== null;

  return (
    <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-secondary)]/30 overflow-hidden">
      {/* Agent header */}
      <div className="px-4 py-3 flex items-start gap-3">
        <div
          className="flex-shrink-0 w-2 h-2 rounded-full mt-1.5"
          style={{ backgroundColor: featureColor }}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-[var(--text-primary)]">{first.name}</span>
            {activeEntry.isCustomized && (
              <span className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                style={{ backgroundColor: 'var(--accent-amber)22', color: 'var(--accent-amber)' }}>
                Personnalisé
              </span>
            )}
            {savedStyle !== null && !hasStyles && (
              <span className="text-[10px] px-1.5 py-0.5 rounded font-medium text-[var(--accent-lime)]">
                Sauvegardé
              </span>
            )}
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">{first.description}</p>
        </div>
      </div>

      {/* Style tabs for creative board agents */}
      {hasStyles && (
        <div className="px-4 flex gap-1 pb-2">
          {STYLES.filter((s) => entries.some((e) => e.style === s)).map((s) => {
            const entry = entries.find((e) => e.style === s);
            return (
              <button
                key={s}
                onClick={() => { setActiveStyle(s); setEditingStyle(null); }}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                  activeStyle === s
                    ? 'bg-[var(--bg-card)] text-[var(--text-primary)] border border-[var(--border-subtle)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                }`}
              >
                {STYLE_LABELS[s]}
                {entry?.isCustomized && (
                  <span className="ml-1 w-1.5 h-1.5 rounded-full inline-block align-middle"
                    style={{ backgroundColor: 'var(--accent-amber)' }} />
                )}
                {savedStyle === s && (
                  <span className="ml-1 text-[var(--accent-lime)]"><CheckIcon /></span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Prompt content */}
      <div className="px-4 pb-3">
        {isEditingThis ? (
          // Edit mode
          <div className="space-y-2">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full rounded border border-[var(--border-subtle)] bg-[var(--bg-card)] text-xs font-mono text-[var(--text-primary)] p-3 resize-y focus:outline-none focus:border-[var(--accent-cyan)] leading-relaxed"
              style={{ minHeight: '200px', maxHeight: '500px' }}
              autoFocus
            />
            <div className="flex items-center gap-2">
              <button
                onClick={handleSave}
                disabled={saving || !editContent.trim()}
                className="px-3 py-1.5 rounded text-xs font-medium transition-colors disabled:opacity-50"
                style={{ backgroundColor: featureColor + '22', color: featureColor }}
              >
                {saving ? 'Sauvegarde…' : 'Sauvegarder'}
              </button>
              <button
                onClick={cancelEdit}
                className="px-3 py-1.5 rounded text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
              >
                Annuler
              </button>
              {activeEntry.isCustomized && (
                <button
                  onClick={() => handleReset(hasStyles ? activeStyle : undefined)}
                  className="ml-auto flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[11px] font-medium text-[var(--text-muted)] hover:text-[var(--accent-coral)] transition-colors"
                >
                  <RotateCcwIcon />
                  Restaurer défaut
                </button>
              )}
            </div>
          </div>
        ) : (
          // Preview mode
          <div>
            <div className={`relative ${!expanded ? 'max-h-16 overflow-hidden' : ''}`}>
              <pre className="text-[11px] font-mono text-[var(--text-muted)] leading-relaxed whitespace-pre-wrap break-words">
                {activeEntry.currentPrompt}
              </pre>
              {!expanded && (
                <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-[var(--bg-primary)] to-transparent" />
              )}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-[11px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
              >
                {expanded ? 'Réduire' : 'Voir tout'}
              </button>
              <button
                onClick={startEdit}
                className="ml-auto flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[11px] font-medium border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--border-medium)] transition-colors"
              >
                <PencilIcon />
                Éditer
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main WikiPromptsSection ───────────────────────────────────────────────────

export function WikiPromptsSection() {
  const [activeFeature, setActiveFeature] = useState<FeatureId>('creative-board');
  const [allEntries, setAllEntries] = useState<AgentPromptEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/agent-prompts');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as AgentPromptEntry[];
      setAllEntries(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (agentId: string, style: string | undefined, content: string) => {
    const res = await fetch('/api/agent-prompts', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agentId, style: style ?? null, content }),
    });
    if (!res.ok) throw new Error('Sauvegarde échouée');
    // Refresh
    await load();
  };

  const handleReset = async (agentId: string, style: string | undefined) => {
    const params = new URLSearchParams({ agentId });
    if (style) params.set('style', style);
    const res = await fetch(`/api/agent-prompts?${params}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Reset échoué');
    await load();
  };

  // Group entries by feature and agentId
  const featureEntries = allEntries.filter((e) => e.feature === activeFeature);

  // Group by agentId (preserving order)
  const agentGroups: Map<string, AgentPromptEntry[]> = new Map();
  for (const entry of featureEntries) {
    if (!agentGroups.has(entry.agentId)) agentGroups.set(entry.agentId, []);
    agentGroups.get(entry.agentId)!.push(entry);
  }

  const activeFeatureConfig = FEATURES.find((f) => f.id === activeFeature)!;
  const customizedCount = allEntries.filter((e) => e.isCustomized).length;

  return (
    <div id="section-prompts-ia" className="col-span-full">
      <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)]">
        <div className="h-1 rounded-t-xl bg-gradient-to-r from-[var(--accent-violet)] to-[var(--accent-cyan)]" />
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start gap-3 mb-2">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">Prompts IA</h3>
                {customizedCount > 0 && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                    style={{ backgroundColor: 'var(--accent-amber)22', color: 'var(--accent-amber)' }}>
                    {customizedCount} personnalisé{customizedCount > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Consultez et personnalisez les system prompts de chaque agent IA · Les modifications sont actives immédiatement
              </p>
            </div>
          </div>

          {/* Feature tabs */}
          <div className="flex flex-wrap gap-1.5 mb-5">
            {FEATURES.map((f) => {
              const fCustomized = allEntries.filter((e) => e.feature === f.id && e.isCustomized).length;
              return (
                <button
                  key={f.id}
                  onClick={() => setActiveFeature(f.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    activeFeature === f.id
                      ? 'text-[var(--text-primary)] border-current'
                      : 'border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                  }`}
                  style={activeFeature === f.id ? { color: f.color, borderColor: f.color + '66' } : {}}
                >
                  {f.label}
                  {fCustomized > 0 && (
                    <span className="ml-1.5 w-1.5 h-1.5 rounded-full inline-block align-middle"
                      style={{ backgroundColor: 'var(--accent-amber)' }} />
                  )}
                </button>
              );
            })}
          </div>

          {/* Agents list */}
          {loading ? (
            <div className="text-xs text-[var(--text-muted)] py-8 text-center">Chargement des prompts…</div>
          ) : error ? (
            <div className="text-xs text-[var(--accent-coral)] py-4">{error}</div>
          ) : agentGroups.size === 0 ? (
            <div className="text-xs text-[var(--text-muted)] py-4">Aucun agent dans cette catégorie.</div>
          ) : (
            <div className="space-y-3">
              {Array.from(agentGroups.entries()).map(([agentId, entries]) => (
                <AgentCard
                  key={agentId}
                  entries={entries}
                  featureColor={activeFeatureConfig.color}
                  onSave={handleSave}
                  onReset={handleReset}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

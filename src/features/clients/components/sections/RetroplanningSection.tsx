'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAppStore } from '@/lib/store';
import { useClient } from '@/hooks';
import type { RetroplanningTask } from '@/types';
import { RetroplanningGantt } from '../RetroplanningGantt';
import { RetroplanningTaskForm } from '../RetroplanningTaskForm';

// ─── Icons ──────────────────────────────────────────────────────────────────

const CalendarRange = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
    <line x1="8" y1="14" x2="8" y2="17"/>
    <line x1="12" y1="14" x2="12" y2="17"/>
    <line x1="16" y1="14" x2="16" y2="17"/>
  </svg>
);

const Spinner = () => (
  <svg
    width="16" height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="animate-spin"
  >
    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
  </svg>
);

const Trash2 = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6M14 11v6"/>
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
);

const RefreshCw = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"/>
    <polyline points="1 20 1 14 7 14"/>
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
  </svg>
);

// ─── Brief extraction ────────────────────────────────────────────────────────

function extractBriefContent(client: { documents: Array<{ type: string; content: string; title: string }> }): string | null {
  const BRIEF_TYPES = ['web-brief', 'brief', 'report', 'creative-strategy'];
  const docs = client.documents.filter((d) => BRIEF_TYPES.includes(d.type));
  if (docs.length === 0) return null;

  const parts: string[] = [];

  for (const doc of docs) {
    let content = '';

    if (doc.type === 'web-brief') {
      // Extract only essential fields from JSON web-brief
      try {
        const parsed = JSON.parse(doc.content) as Record<string, unknown>;
        const arch = parsed.architecture as Record<string, unknown> | undefined;
        if (arch) {
          const essentials: Record<string, unknown> = {};
          if (arch.site_type) essentials.site_type = arch.site_type;
          if (arch.primary_objective) essentials.primary_objective = arch.primary_objective;
          if (arch.target_visitor) essentials.target_visitor = arch.target_visitor;

          // Extract homepage section roles + intents (not full content)
          const homepage = parsed.homepage as Record<string, unknown> | undefined;
          if (homepage?.sections && Array.isArray(homepage.sections)) {
            essentials.homepage_sections = (homepage.sections as Array<Record<string, unknown>>).map((s) => ({
              role: s.role,
              intent: s.intent,
            }));
          }

          content = JSON.stringify(essentials, null, 2).slice(0, 4000);
        } else {
          content = doc.content.slice(0, 4000);
        }
      } catch {
        content = doc.content.slice(0, 4000);
      }
    } else {
      content = doc.content.slice(0, 4000);
    }

    parts.push(`=== ${doc.type.toUpperCase()}: ${doc.title} ===\n${content}`);
  }

  return parts.join('\n\n').slice(0, 6000);
}

function hasBriefDocument(client: { documents: Array<{ type: string }> }): boolean {
  const BRIEF_TYPES = ['web-brief', 'brief', 'report', 'creative-strategy'];
  return client.documents.some((d) => BRIEF_TYPES.includes(d.type));
}

// ─── Component ──────────────────────────────────────────────────────────────

interface RetroplanningProps {
  clientId: string;
}

export function RetroplanningSection({ clientId }: RetroplanningProps) {
  const { loadRetroplanning, saveRetroplanning, deleteRetroplanning, getRetroplanningByClientId } = useAppStore();
  const client = useClient(clientId);

  const plan = getRetroplanningByClientId(clientId);

  const [deadline, setDeadline] = useState<string>(plan?.deadline ?? '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<RetroplanningTask | null>(null);

  // Load on mount
  useEffect(() => {
    loadRetroplanning(clientId);
  }, [clientId, loadRetroplanning]);

  // Sync deadline from plan if plan loaded after mount
  useEffect(() => {
    if (plan?.deadline && !deadline) {
      setDeadline(plan.deadline);
    }
  }, [plan?.deadline, deadline]);

  const hasBrief = client ? hasBriefDocument(client) : false;

  // ── Generate ──────────────────────────────────────────────────────────────

  const handleGenerate = useCallback(async () => {
    if (!client || !deadline) return;
    const briefContent = extractBriefContent(client);
    if (!briefContent) return;

    setIsGenerating(true);
    setGenerateError(null);

    try {
      const res = await fetch('/api/retroplanning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ briefContent, deadline, clientName: client.name }),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(err || `Erreur ${res.status}`);
      }

      const data = await res.json() as { tasks: RetroplanningTask[] };
      const now = new Date().toISOString();

      await saveRetroplanning(clientId, {
        clientId,
        deadline,
        tasks: data.tasks,
        generatedAt: plan?.generatedAt ?? now,
        updatedAt: now,
      });
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : 'Erreur lors de la génération');
    } finally {
      setIsGenerating(false);
    }
  }, [client, clientId, deadline, plan, saveRetroplanning]);

  // ── Task update ───────────────────────────────────────────────────────────

  const handleTaskUpdate = useCallback(async (updatedTask: RetroplanningTask) => {
    if (!plan) return;
    const updatedTasks = plan.tasks.map((t) => t.id === updatedTask.id ? updatedTask : t);
    await saveRetroplanning(clientId, { ...plan, tasks: updatedTasks, updatedAt: new Date().toISOString() });
    // Close form if the updated task is currently editing
    if (editingTask?.id === updatedTask.id) {
      setEditingTask(null);
    }
  }, [plan, clientId, saveRetroplanning, editingTask]);

  const handleFormSave = useCallback(async (updatedTask: RetroplanningTask) => {
    await handleTaskUpdate(updatedTask);
    setEditingTask(null);
  }, [handleTaskUpdate]);

  // ── Delete ────────────────────────────────────────────────────────────────

  const handleDelete = useCallback(async () => {
    if (!confirm('Supprimer le retroplanning ? Cette action est irréversible.')) return;
    await deleteRetroplanning(clientId);
    setEditingTask(null);
    setDeadline('');
  }, [clientId, deleteRetroplanning]);

  if (!client) return null;

  return (
    <div className="bg-[var(--bg-card)] rounded-xl sm:rounded-2xl border border-[var(--border-subtle)] overflow-hidden">
      {/* Section header */}
      <div className="px-4 sm:px-5 py-4 border-b border-[var(--border-subtle)] flex items-center gap-2">
        <span style={{ color: 'var(--accent-amber)' }}>
          <CalendarRange />
        </span>
        <h2 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider">
          Retroplanning
        </h2>
        {plan && (
          <span className="text-xs text-[var(--text-muted)] bg-[var(--bg-tertiary)] px-2 py-0.5 rounded-full">
            {plan.tasks.length} étape{plan.tasks.length !== 1 ? 's' : ''}
          </span>
        )}

        {/* Actions when plan exists */}
        {plan && (
          <div className="ml-auto flex items-center gap-2">
            {/* Deadline display */}
            <span className="text-xs text-[var(--text-muted)]">
              Deadline :&nbsp;
              <span className="font-semibold text-[var(--accent-amber)]">
                {new Date(plan.deadline).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })}
              </span>
            </span>

            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium rounded-lg transition-colors disabled:opacity-50"
              style={{ backgroundColor: 'var(--accent-amber)', color: '#000' }}
              title="Regénérer le retroplanning"
            >
              {isGenerating ? <Spinner /> : <RefreshCw />}
              {isGenerating ? 'Génération...' : 'Regénérer'}
            </button>

            <button
              type="button"
              onClick={handleDelete}
              className="p-1.5 rounded-lg text-[var(--text-muted)] hover:bg-red-500/10 hover:text-red-400 transition-colors"
              title="Supprimer le retroplanning"
            >
              <Trash2 />
            </button>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-4 sm:p-5">
        {/* ── No plan ── */}
        {!plan && (
          <>
            {!hasBrief ? (
              /* No brief */
              <div className="py-8 text-center">
                <p className="text-sm text-[var(--text-muted)]">Ajoutez un brief d'abord</p>
                <p className="text-xs text-[var(--text-muted)] mt-1 opacity-60">
                  Le retroplanning nécessite un brief, un rapport ou une stratégie créative.
                </p>
              </div>
            ) : (
              /* Has brief — show generate form */
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="flex-1 space-y-1">
                  <label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                    Deadline du projet
                  </label>
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full sm:w-auto px-3 py-2 text-sm bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-amber)] transition-colors"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={isGenerating || !deadline}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  style={{ backgroundColor: 'var(--accent-amber)', color: '#000' }}
                >
                  {isGenerating ? <Spinner /> : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                    </svg>
                  )}
                  {isGenerating ? 'Génération en cours...' : 'Générer le retroplanning'}
                </button>
              </div>
            )}
          </>
        )}

        {/* ── Has plan — show Gantt ── */}
        {plan && plan.tasks.length > 0 && (
          <>
            <RetroplanningGantt
              tasks={plan.tasks}
              deadline={plan.deadline}
              onTaskUpdate={handleTaskUpdate}
              onTaskClick={(task) => setEditingTask((prev) => prev?.id === task.id ? null : task)}
            />

            {/* Edit form */}
            {editingTask && (
              <RetroplanningTaskForm
                task={editingTask}
                onSave={handleFormSave}
                onClose={() => setEditingTask(null)}
              />
            )}
          </>
        )}

        {/* Error */}
        {generateError && (
          <div className="mt-3 px-3 py-2 text-xs text-red-400 bg-red-500/10 rounded-lg border border-red-500/20">
            {generateError}
          </div>
        )}
      </div>
    </div>
  );
}

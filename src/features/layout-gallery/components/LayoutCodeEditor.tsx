'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

// Standard layout roles — these are read-only in the editor
const STANDARD_ROLES = new Set([
  'navbar',
  'hero',
  'value_proposition',
  'services_teaser',
  'solutions_overview',
  'features',
  'social_proof',
  'testimonial',
  'pricing',
  'faq',
  'cta_final',
  'contact_form',
  'footer',
]);

export interface LayoutCodeEditorProps {
  role: string;
  onClose: () => void;
  onSaved?: () => void;
}

type ActiveTab = 'code' | 'ai';

export function LayoutCodeEditor({ role, onClose, onSaved }: LayoutCodeEditorProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ActiveTab>('code');
  const [code, setCode] = useState('');
  const [isLoadingCode, setIsLoadingCode] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // AI tab state
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Save state
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const isStandardLayout = STANDARD_ROLES.has(role);

  // Load layout code on mount
  useEffect(() => {
    setIsLoadingCode(true);
    setLoadError(null);
    fetch(`/api/read-layout?role=${encodeURIComponent(role)}`)
      .then(async (res) => {
        const data = (await res.json()) as { code?: string; error?: string };
        if (!res.ok) throw new Error(data.error ?? 'Erreur de chargement');
        setCode(data.code ?? '');
      })
      .catch((err: unknown) => {
        setLoadError(err instanceof Error ? err.message : 'Erreur inconnue');
      })
      .finally(() => {
        setIsLoadingCode(false);
      });
  }, [role]);

  const handleSave = useCallback(async () => {
    if (isStandardLayout || isSaving) return;
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    try {
      const res = await fetch('/api/generate-layout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, code }),
      });
      const data = (await res.json()) as { success?: boolean; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Erreur de sauvegarde');
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      router.refresh();
      onSaved?.();
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setIsSaving(false);
    }
  }, [role, code, isStandardLayout, isSaving, router, onSaved]);

  const handleAiEdit = useCallback(async () => {
    if (!aiPrompt.trim() || isAiLoading) return;
    setIsAiLoading(true);
    setAiError(null);
    try {
      const res = await fetch('/api/edit-layout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, existingCode: code, prompt: aiPrompt }),
      });
      const data = (await res.json()) as { code?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Erreur IA');
      setCode(data.code ?? '');
      setAiPrompt('');
      setActiveTab('code');
    } catch (err: unknown) {
      setAiError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setIsAiLoading(false);
    }
  }, [role, code, aiPrompt, isAiLoading]);

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-3xl mx-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] shadow-2xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-subtle)] flex-shrink-0">
          <div className="flex items-center gap-3">
            {/* Code icon */}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-violet)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
            </svg>
            <span className="text-sm font-bold text-[var(--text-primary)]">
              Éditeur de layout
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--accent-violet)]/15 text-[var(--accent-violet)] font-mono">
              {role}
            </span>
            {isStandardLayout && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--bg-tertiary)] text-[var(--text-muted)] border border-[var(--border-subtle)]">
                lecture seule
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
            title="Fermer"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-0 border-b border-[var(--border-subtle)] flex-shrink-0">
          {(['code', 'ai'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-3 text-xs font-semibold transition-colors border-b-2 -mb-px ${
                activeTab === tab
                  ? 'border-[var(--accent-cyan)] text-[var(--accent-cyan)]'
                  : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              {tab === 'code' ? 'Code' : 'IA'}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 min-h-0 overflow-y-auto p-5">
          {isLoadingCode ? (
            <div className="flex items-center justify-center h-32 gap-2 text-[var(--text-muted)] text-sm">
              <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12a9 9 0 11-6.219-8.56" />
              </svg>
              Chargement du code...
            </div>
          ) : loadError ? (
            <div className="flex items-center justify-center h-32 text-red-400 text-sm">
              Erreur : {loadError}
            </div>
          ) : activeTab === 'code' ? (
            <div className="flex flex-col gap-3">
              {isStandardLayout && (
                <p className="text-xs text-[var(--text-muted)] bg-[var(--bg-tertiary)] px-3 py-2 rounded-lg border border-[var(--border-subtle)]">
                  Layout standard — lecture seule. Créez une variante pour modifier ce layout.
                </p>
              )}
              <textarea
                value={code}
                onChange={(e) => !isStandardLayout && setCode(e.target.value)}
                readOnly={isStandardLayout}
                className={`w-full font-mono text-xs leading-relaxed rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-primary)] text-[var(--text-secondary)] px-4 py-3 focus:outline-none resize-none ${
                  isStandardLayout
                    ? 'opacity-70 cursor-default'
                    : 'focus:border-[var(--accent-cyan)]/50'
                }`}
                style={{ minHeight: '300px' }}
                spellCheck={false}
              />
            </div>
          ) : (
            /* AI tab */
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-semibold text-[var(--text-secondary)] block mb-2">
                  Instruction de modification
                </label>
                <textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Décrivez la modification souhaitée..."
                  rows={4}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-magenta)]/50 resize-none"
                />
              </div>
              {aiError && (
                <p className="text-xs text-red-400">{aiError}</p>
              )}
              <p className="text-xs text-[var(--text-muted)]">
                L&apos;IA modifie le code selon votre instruction. Vous pouvez ensuite réviser le résultat dans l&apos;onglet Code avant de sauvegarder.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-[var(--border-subtle)] flex-shrink-0 bg-[var(--bg-primary)]/50">
          <div className="flex items-center gap-2">
            {saveSuccess && (
              <span className="text-xs text-[var(--accent-cyan)] font-medium">
                Sauvegardé avec succès
              </span>
            )}
            {saveError && (
              <span className="text-xs text-red-400">{saveError}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-[var(--border-subtle)] text-xs text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] transition-colors"
            >
              Fermer
            </button>
            {activeTab === 'ai' ? (
              <button
                type="button"
                onClick={handleAiEdit}
                disabled={!aiPrompt.trim() || isAiLoading || isLoadingCode}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--accent-magenta)] text-white text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isAiLoading ? (
                  <>
                    <svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 12a9 9 0 11-6.219-8.56" />
                    </svg>
                    Modification en cours...
                  </>
                ) : (
                  <>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
                    </svg>
                    Modifier via IA
                  </>
                )}
              </button>
            ) : (
              !isStandardLayout && (
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving || isLoadingCode}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--accent-cyan)] text-black text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <>
                      <svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 12a9 9 0 11-6.219-8.56" />
                      </svg>
                      Sauvegarde...
                    </>
                  ) : (
                    'Sauvegarder'
                  )}
                </button>
              )
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

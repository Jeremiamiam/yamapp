'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAppStore } from '@/lib/store';
import { toast } from '@/lib/toast';
import type { DocumentVersion } from '@/types';

const HistoryIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
    <path d="M3 3v5h5"/>
    <path d="M12 7v5l4 2"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

function formatVersionDate(date: Date): string {
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

interface DocumentVersionPanelProps {
  docId: string;
  currentContent: string;
  onRestore: (content: string) => Promise<void>;
  saveTrigger?: number;
}

/**
 * Bouton + panneau flottant de gestion des versions d'un document.
 * S'intègre dans le header du modal ou du web-brief.
 */
export function DocumentVersionPanel({ docId, currentContent, onRestore, saveTrigger }: DocumentVersionPanelProps) {
  const saveDocumentVersion = useAppStore((s) => s.saveDocumentVersion);
  const updateDocumentVersion = useAppStore((s) => s.updateDocumentVersion);
  const loadDocumentVersions = useAppStore((s) => s.loadDocumentVersions);

  const [open, setOpen] = useState(false);
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [confirmRestoreId, setConfirmRestoreId] = useState<string | null>(null);
  const [labelInput, setLabelInput] = useState('');
  const [showLabelInput, setShowLabelInput] = useState(false);
  const [lastAutoSaved, setLastAutoSaved] = useState<Date | null>(null);

  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  // ID de la version "Auto-save" courante — réutilisée à chaque auto-save suivant
  // state pour déclencher le re-render du badge "actuelle", ref pour l'accès dans les callbacks
  const [autoSaveVersionId, setAutoSaveVersionId] = useState<string | null>(null);
  const autoSaveVersionIdRef = useRef<string | null>(null);
  const isFirstTriggerRef = useRef(true);

  // Ferme le panel au clic en dehors
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        panelRef.current && !panelRef.current.contains(e.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        setConfirmRestoreId(null);
        setShowLabelInput(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Sauvegarde déclenchée par "Valider" dans le SectionDrawer
  useEffect(() => {
    if (saveTrigger === undefined) return;
    // Ignore le render initial (saveTrigger = 0)
    if (isFirstTriggerRef.current) { isFirstTriggerRef.current = false; return; }
    if (!currentContent) return;

    const run = async () => {
      try {
        if (autoSaveVersionIdRef.current) {
          await updateDocumentVersion(autoSaveVersionIdRef.current, currentContent);
          setVersions((prev) =>
            prev.map((v) =>
              v.id === autoSaveVersionIdRef.current ? { ...v, content: currentContent, createdAt: new Date() } : v
            )
          );
        } else {
          const version = await saveDocumentVersion(docId, currentContent, 'Auto-save');
          autoSaveVersionIdRef.current = version.id;
          setAutoSaveVersionId(version.id);
          setVersions((prev) => [version, ...prev]);
        }
        setLastAutoSaved(new Date());
      } catch {
        // Silencieux
      }
    };
    run();
  }, [saveTrigger]); // eslint-disable-line react-hooks/exhaustive-deps

  // Charge les versions à l'ouverture du panel
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    loadDocumentVersions(docId)
      .then(setVersions)
      .catch(() => toast.error('Impossible de charger les versions'))
      .finally(() => setLoading(false));
  }, [open, docId, loadDocumentVersions]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const label = labelInput.trim() || undefined;
      const newVersion = await saveDocumentVersion(docId, currentContent, label);
      setVersions((prev) => [newVersion, ...prev]);
      setLabelInput('');
      setShowLabelInput(false);
      // La prochaine auto-save créera une nouvelle version (pas d'écrasement de la version manuelle)
      autoSaveVersionIdRef.current = null;
      setAutoSaveVersionId(null);
      toast.success(`Version ${newVersion.versionNumber} sauvegardée`);
    } catch {
      toast.error('Impossible de sauvegarder la version');
    } finally {
      setSaving(false);
    }
  }, [docId, currentContent, labelInput, saveDocumentVersion]);

  const handleRestore = useCallback(async (version: DocumentVersion) => {
    if (confirmRestoreId !== version.id) {
      setConfirmRestoreId(version.id);
      return;
    }
    setRestoring(version.id);
    setConfirmRestoreId(null);
    try {
      await onRestore(version.content);
      // Reset l'auto-save : le contenu restauré sera la base de la prochaine auto-save
      autoSaveVersionIdRef.current = null;
      setAutoSaveVersionId(null);
      toast.success(`Version ${version.versionNumber} restaurée`);
      setOpen(false);
    } catch {
      toast.error('Impossible de restaurer la version');
    } finally {
      setRestoring(null);
    }
  }, [confirmRestoreId, onRestore]);

  return (
    <div className="relative flex items-center gap-2">
      {lastAutoSaved && !open && (
        <span className="text-[10px] text-[var(--text-muted)]" title={`Auto-sauvegardé à ${lastAutoSaved.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`}>
          • auto
        </span>
      )}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          setConfirmRestoreId(null);
          setShowLabelInput(false);
        }}
        className={`p-2 rounded-lg transition-colors flex items-center gap-1.5 ${
          open
            ? 'bg-[var(--accent-amber)]/15 text-[var(--accent-amber)]'
            : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
        }`}
        title="Versions du document"
      >
        <HistoryIcon />
        {versions.length > 0 && (
          <span className="text-[10px] font-bold">{versions.length}</span>
        )}
      </button>

      {open && (
        <div
          ref={panelRef}
          className="absolute right-0 top-full mt-1 z-[60] w-72 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] shadow-xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header du panel */}
          <div className="px-4 py-3 border-b border-[var(--border-subtle)] flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Versions</span>
            <button
              type="button"
              onClick={() => {
                setShowLabelInput((v) => !v);
                setConfirmRestoreId(null);
              }}
              disabled={saving}
              className="px-2.5 py-1 rounded-lg bg-[var(--accent-amber)]/15 border border-[var(--accent-amber)]/30 text-[10px] font-bold text-[var(--accent-amber)] hover:bg-[var(--accent-amber)]/25 disabled:opacity-50 transition-colors"
            >
              + Sauvegarder
            </button>
          </div>

          {/* Zone de sauvegarde */}
          {showLabelInput && (
            <div className="px-4 py-3 border-b border-[var(--border-subtle)] space-y-2 bg-[var(--accent-amber)]/5">
              <input
                type="text"
                value={labelInput}
                onChange={(e) => setLabelInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setShowLabelInput(false); }}
                placeholder="Label optionnel (ex: structure initiale)"
                className="w-full px-3 py-1.5 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-amber)]/40 transition-colors"
                autoFocus
              />
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="w-full py-1.5 rounded-lg bg-[var(--accent-amber)] text-[var(--bg-primary)] text-[12px] font-bold disabled:opacity-50 hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              >
                {saving ? (
                  <span className="w-3 h-3 border-2 border-[var(--bg-primary)]/30 border-t-[var(--bg-primary)] rounded-full animate-spin" />
                ) : (
                  <CheckIcon />
                )}
                {saving ? 'Sauvegarde…' : 'Confirmer'}
              </button>
            </div>
          )}

          {/* Liste des versions */}
          <div className="max-h-64 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <span className="w-4 h-4 border-2 border-[var(--border-subtle)] border-t-[var(--accent-amber)] rounded-full animate-spin" />
              </div>
            ) : versions.length === 0 ? (
              <p className="text-[12px] text-[var(--text-muted)] text-center py-6 px-4">
                Aucune version sauvegardée
              </p>
            ) : (
              <ul>
                {versions.map((v) => (
                  <li
                    key={v.id}
                    className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border-subtle)] last:border-0 hover:bg-[var(--bg-tertiary)]/40 transition-colors group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-[var(--accent-amber)]">V{v.versionNumber}</span>
                        {v.label === 'Auto-save' ? (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg-tertiary)] text-[var(--text-muted)] font-medium">auto</span>
                        ) : v.label ? (
                          <span className="text-[11px] text-[var(--text-secondary)] truncate">{v.label}</span>
                        ) : null}
                        {v.id === autoSaveVersionId && (
                          <span className="text-[10px] text-[var(--accent-cyan)] font-medium">• actuelle</span>
                        )}
                      </div>
                      <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{formatVersionDate(v.createdAt)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRestore(v)}
                      disabled={restoring === v.id}
                      className={`flex-shrink-0 px-2 py-1 rounded-md text-[10px] font-bold transition-colors ${
                        confirmRestoreId === v.id
                          ? 'bg-[var(--accent-coral)]/20 text-[var(--accent-coral)] border border-[var(--accent-coral)]/30'
                          : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] opacity-0 group-hover:opacity-100'
                      }`}
                      title={confirmRestoreId === v.id ? 'Confirmer la restauration ?' : 'Restaurer cette version'}
                    >
                      {restoring === v.id ? (
                        <span className="w-3 h-3 border-2 border-current/30 border-t-current rounded-full animate-spin inline-block" />
                      ) : confirmRestoreId === v.id ? (
                        'Confirmer ?'
                      ) : (
                        'Restaurer'
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

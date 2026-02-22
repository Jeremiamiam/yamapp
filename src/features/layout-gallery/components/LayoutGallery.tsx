'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { LayoutGalleryGrid } from './LayoutGalleryGrid';
import { LayoutCodeEditor } from './LayoutCodeEditor';

export interface LayoutGalleryProps {
  isOpen: boolean;
  onClose: () => void;
  initialRole?: string;
  onSelectRole?: (role: string) => void;
}

export function LayoutGallery({ isOpen, onClose, initialRole, onSelectRole }: LayoutGalleryProps) {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<string | null>(initialRole ?? null);

  // State for variant creation
  const [variantBaseRole, setVariantBaseRole] = useState<string | null>(null);
  const [variantSuffix, setVariantSuffix] = useState('');
  const [isCreatingVariant, setIsCreatingVariant] = useState(false);

  // Code editor state
  const [editingRole, setEditingRole] = useState<string | null>(null);

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Sync selectedRole when initialRole prop changes
  useEffect(() => {
    setSelectedRole(initialRole ?? null);
  }, [initialRole]);

  // Escape key closes the gallery
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopImmediatePropagation();
        onClose();
      }
    };
    document.addEventListener('keydown', handler, true);
    return () => document.removeEventListener('keydown', handler, true);
  }, [isOpen, onClose]);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const handleApply = useCallback(() => {
    if (!selectedRole || !onSelectRole) return;
    onSelectRole(selectedRole);
    onClose();
  }, [selectedRole, onSelectRole, onClose]);

  const handleCreateVariantClick = useCallback((baseRole: string) => {
    setVariantBaseRole(baseRole);
    setVariantSuffix('');
  }, []);

  const handleVariantConfirm = useCallback(async () => {
    if (!variantBaseRole || !variantSuffix.trim()) return;
    const variantRole = `${variantBaseRole}_${variantSuffix.trim().replace(/\s+/g, '_').toLowerCase()}`;
    setIsCreatingVariant(true);
    try {
      const res = await fetch('/api/generate-layout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: variantRole }),
      });
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        throw new Error(data.error ?? 'Erreur interne');
      }
      showToast(`Variante "${variantRole}" créée avec succès`);
      setVariantBaseRole(null);
      setVariantSuffix('');
      router.refresh();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erreur lors de la création', 'error');
    } finally {
      setIsCreatingVariant(false);
    }
  }, [variantBaseRole, variantSuffix, showToast, router]);

  const handleVariantCancel = useCallback(() => {
    setVariantBaseRole(null);
    setVariantSuffix('');
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-[var(--bg-primary)]/95 backdrop-blur-sm flex flex-col">
      {/* Header bar */}
      <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
        <div className="flex items-center gap-3">
          {/* 4-square grid icon */}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-violet)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
          <h1 className="text-lg font-bold text-[var(--text-primary)]">Galerie de Layouts</h1>
          {selectedRole && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--accent-cyan)]/15 text-[var(--accent-cyan)] font-mono">
              {selectedRole}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {onSelectRole && (
            <button
              type="button"
              onClick={handleApply}
              disabled={!selectedRole}
              className="px-4 py-2 rounded-lg text-sm font-semibold bg-[var(--accent-cyan)] text-black hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Appliquer
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
            title="Fermer (Esc)"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {/* Body — scrollable */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <LayoutGalleryGrid
            onSelectLayout={setSelectedRole}
            selectedRole={selectedRole}
            onCreateVariant={handleCreateVariantClick}
            onEditLayout={(role) => setEditingRole(role)}
          />
        </div>
      </div>

      {/* Code editor panel */}
      {editingRole && (
        <LayoutCodeEditor
          role={editingRole}
          onClose={() => setEditingRole(null)}
          onSaved={() => {
            setEditingRole(null);
            showToast('Layout sauvegardé avec succès');
            router.refresh();
          }}
        />
      )}

      {/* Variant creation inline prompt (modal-within-modal) */}
      {variantBaseRole && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm mx-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] shadow-2xl p-6">
            <h3 className="text-sm font-bold text-[var(--text-primary)] mb-1">
              Créer une variante
            </h3>
            <p className="text-xs text-[var(--text-muted)] mb-4">
              Base : <span className="font-mono text-[var(--text-secondary)]">{variantBaseRole}</span>
            </p>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs text-[var(--text-muted)] font-mono flex-shrink-0">
                {variantBaseRole}_
              </span>
              <input
                type="text"
                value={variantSuffix}
                onChange={(e) => setVariantSuffix(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleVariantConfirm();
                  if (e.key === 'Escape') handleVariantCancel();
                }}
                placeholder="suffixe (ex: v2)"
                autoFocus
                className="flex-1 px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-violet)]/50"
              />
            </div>
            {variantSuffix.trim() && (
              <p className="text-[10px] text-[var(--text-muted)] mb-3 font-mono">
                Rôle créé : {variantBaseRole}_{variantSuffix.trim().replace(/\s+/g, '_').toLowerCase()}
              </p>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleVariantCancel}
                className="flex-1 px-3 py-2 rounded-lg border border-[var(--border-subtle)] text-sm text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleVariantConfirm}
                disabled={!variantSuffix.trim() || isCreatingVariant}
                className="flex-1 px-3 py-2 rounded-lg bg-[var(--accent-violet)] text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isCreatingVariant ? 'Génération…' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast notification */}
      {toast && (
        <div
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[120] px-4 py-3 rounded-lg shadow-lg text-sm font-medium transition-all ${
            toast.type === 'success'
              ? 'bg-[var(--accent-cyan)] text-black'
              : 'bg-red-500 text-white'
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';

interface YamDoc {
  id: string;
  title: string;
  url: string;
  sort_order: number;
}

// Icons
const BookOpen = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
  </svg>
);

const X = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const Plus = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const ExternalLink = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
    <polyline points="15 3 21 3 21 9"/>
    <line x1="10" y1="14" x2="21" y2="3"/>
  </svg>
);

const Pencil = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

const Trash = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
  </svg>
);

interface DocsYamModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DocsYamModal({ isOpen, onClose }: DocsYamModalProps) {
  const { isAdmin } = useUserRole();
  const [docs, setDocs] = useState<YamDoc[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formUrl, setFormUrl] = useState('');

  // Charger depuis Supabase (une seule fois à l'ouverture)
  useEffect(() => {
    let cancelled = false;
    
    if (isOpen && !hasLoaded) {
      const loadDocs = async () => {
        try {
          const supabase = createClient();
          const { data, error } = await supabase
            .from('yam_docs')
            .select('*')
            .order('sort_order', { ascending: true });
          
          if (cancelled) return;
          
          // Si erreur (table n'existe pas encore), on continue avec liste vide
          if (error) {
            console.warn('Table yam_docs non trouvée, migration requise:', error.message);
            setDocs([]);
          } else {
            setDocs(data || []);
          }
        } catch (err) {
          console.error('Erreur chargement yam_docs:', err);
          if (!cancelled) setDocs([]);
        } finally {
          if (!cancelled) setHasLoaded(true);
        }
      };
      loadDocs();
    }
    
    return () => { cancelled = true; };
  }, [isOpen, hasLoaded]);

  const handleAdd = async () => {
    if (!formTitle.trim() || !formUrl.trim()) return;
    
    try {
      const supabase = createClient();
      const newDoc = {
        id: `doc-${Date.now()}`,
        title: formTitle.trim(),
        url: formUrl.trim(),
        sort_order: docs.length,
      };
      
      const { error } = await supabase.from('yam_docs').insert(newDoc);
      if (error) throw error;
      
      setDocs([...docs, newDoc]);
      setFormTitle('');
      setFormUrl('');
      setIsAdding(false);
    } catch (err) {
      console.error('Erreur ajout doc:', err);
    }
  };

  const handleEdit = (id: string) => {
    const doc = docs.find((d) => d.id === id);
    if (doc) {
      setFormTitle(doc.title);
      setFormUrl(doc.url);
      setEditingId(id);
      setIsAdding(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingId || !formTitle.trim() || !formUrl.trim()) return;
    
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('yam_docs')
        .update({ title: formTitle.trim(), url: formUrl.trim(), updated_at: new Date().toISOString() })
        .eq('id', editingId);
      
      if (error) throw error;
      
      setDocs(docs.map((d) =>
        d.id === editingId ? { ...d, title: formTitle.trim(), url: formUrl.trim() } : d
      ));
      setFormTitle('');
      setFormUrl('');
      setEditingId(null);
    } catch (err) {
      console.error('Erreur mise à jour doc:', err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const supabase = createClient();
      const { error } = await supabase.from('yam_docs').delete().eq('id', id);
      if (error) throw error;
      
      setDocs(docs.filter((d) => d.id !== id));
      if (editingId === id) {
        setEditingId(null);
        setFormTitle('');
        setFormUrl('');
      }
    } catch (err) {
      console.error('Erreur suppression doc:', err);
    }
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormTitle('');
    setFormUrl('');
  };

  // Escape pour fermer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        if (isAdding || editingId) {
          handleCancel();
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isAdding, editingId, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/70" />
      
      <div
        className="relative w-full max-w-md bg-[var(--bg-card)] rounded-2xl border border-[var(--border-subtle)] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-[var(--accent-violet)]/10 text-[var(--accent-violet)]">
              <BookOpen />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Docs YAM</h2>
              <p className="text-xs text-[var(--text-muted)]">Liens utiles et ressources</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <X />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[60vh] overflow-y-auto">
          {!hasLoaded ? (
            <div className="px-5 py-8 text-center">
              <p className="text-sm text-[var(--text-muted)]">Chargement...</p>
            </div>
          ) : docs.length === 0 && !isAdding ? (
            <div className="px-5 py-8 text-center">
              <p className="text-sm text-[var(--text-muted)] mb-4">Aucun lien pour le moment</p>
              {isAdmin && (
                <button
                  onClick={() => setIsAdding(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--accent-violet)]/10 text-[var(--accent-violet)] hover:bg-[var(--accent-violet)]/20 transition-colors text-sm font-medium"
                >
                  <Plus />
                  Ajouter un lien
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-[var(--border-subtle)]">
              {docs.map((doc) => (
                <div
                  key={doc.id}
                  className="px-5 py-3 flex items-center gap-3 hover:bg-[var(--bg-secondary)] transition-colors group"
                >
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 min-w-0 flex items-center gap-2"
                  >
                    <span className="font-medium text-[var(--text-primary)] truncate hover:text-[var(--accent-violet)] transition-colors">
                      {doc.title}
                    </span>
                    <ExternalLink />
                  </a>
                  {isAdmin && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEdit(doc.id)}
                        className="p-1.5 rounded text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition-colors"
                        title="Modifier"
                      >
                        <Pencil />
                      </button>
                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="p-1.5 rounded text-[var(--text-muted)] hover:bg-[var(--accent-coral)]/10 hover:text-[var(--accent-coral)] transition-colors"
                        title="Supprimer"
                      >
                        <Trash />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Form ajout/édition */}
          {(isAdding || editingId) && (
            <div className="px-5 py-4 border-t border-[var(--border-subtle)] bg-[var(--bg-secondary)]/50">
              <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-3">
                {editingId ? 'Modifier le lien' : 'Nouveau lien'}
              </p>
              <div className="space-y-3">
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Titre (ex: Questionnaire atelier)"
                  className="w-full px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-violet)]"
                  autoFocus
                />
                <input
                  type="url"
                  value={formUrl}
                  onChange={(e) => setFormUrl(e.target.value)}
                  placeholder="URL (ex: https://...)"
                  className="w-full px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-violet)]"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleCancel}
                    className="flex-1 px-3 py-2 rounded-lg text-sm font-medium text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={editingId ? handleUpdate : handleAdd}
                    disabled={!formTitle.trim() || !formUrl.trim()}
                    className="flex-1 px-3 py-2 rounded-lg text-sm font-medium bg-[var(--accent-violet)] text-white hover:bg-[var(--accent-violet)]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {editingId ? 'Enregistrer' : 'Ajouter'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer - bouton ajouter si liste non vide (admins only) */}
        {isAdmin && docs.length > 0 && !isAdding && !editingId && (
          <div className="px-5 py-3 border-t border-[var(--border-subtle)]">
            <button
              onClick={() => setIsAdding(true)}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              <Plus />
              Ajouter un lien
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

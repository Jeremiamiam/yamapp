'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAppStore } from '@/lib/store';

const SearchIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/>
    <path d="m21 21-4.3-4.3"/>
  </svg>
);

const UserIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

export function Spotlight() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const clients = useAppStore((s) => s.clients);
  const navigateToClient = useAppStore((s) => s.navigateToClient);
  const activeModal = useAppStore((s) => s.activeModal);
  const isLoading = useAppStore((s) => s.isLoading);

  // Filtrer les clients par recherche fuzzy simple
  const filteredClients = useMemo(() => {
    if (!query.trim()) return clients.slice(0, 8); // Afficher les 8 premiers si pas de recherche
    const q = query.toLowerCase();
    return clients
      .filter((c) => c.name.toLowerCase().includes(q))
      .slice(0, 8);
  }, [clients, query]);

  // Reset selection quand les résultats changent
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredClients]);

  // Scroll l'élément sélectionné dans la vue
  useEffect(() => {
    if (listRef.current && filteredClients.length > 0) {
      const selectedEl = listRef.current.children[selectedIndex] as HTMLElement;
      if (selectedEl) {
        selectedEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex, filteredClients.length]);

  const openSpotlight = useCallback((initialQuery = '') => {
    setQuery(initialQuery);
    setSelectedIndex(0);
    setIsOpen(true);
  }, []);

  const closeSpotlight = useCallback(() => {
    setIsOpen(false);
    setQuery('');
    setSelectedIndex(0);
  }, []);

  const selectClient = useCallback((clientId: string) => {
    navigateToClient(clientId);
    closeSpotlight();
  }, [navigateToClient, closeSpotlight]);

  // Focus input quand ouvert
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Listener global pour les touches
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorer si une modale est ouverte ou si données en chargement
      if (activeModal || isLoading) return;
      
      // Ignorer si un dialog est ouvert (ex: DocumentModal) — évite conflit avec édition
      if (!isOpen && document.querySelector('[role="dialog"]')) return;

      const target = e.target as HTMLElement;
      // Ne jamais ouvrir si on est dans un champ éditable (input, textarea, contenteditable)
      // ou à l'intérieur d'un dialog — évite conflit quand on tape pendant l'édition
      const isEditable =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable ||
        target.closest('[role="textbox"]') ||
        target.closest('[role="combobox"]') ||
        target.closest('[role="dialog"]');

      // Cmd+K / Ctrl+K pour ouvrir
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) {
          closeSpotlight();
        } else {
          openSpotlight();
        }
        return;
      }

      // Si spotlight est ouvert, gérer navigation
      if (isOpen) {
        if (e.key === 'Escape') {
          e.preventDefault();
          closeSpotlight();
          return;
        }
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedIndex((i) => Math.min(i + 1, filteredClients.length - 1));
          return;
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedIndex((i) => Math.max(i - 1, 0));
          return;
        }
        if (e.key === 'Enter') {
          e.preventDefault();
          if (filteredClients[selectedIndex]) {
            selectClient(filteredClients[selectedIndex].id);
          }
          return;
        }
        return;
      }

      // Si pas dans un champ éditable et qu'on tape une lettre, ouvrir spotlight
      if (!isEditable && !e.metaKey && !e.ctrlKey && !e.altKey) {
        // Lettres, chiffres
        if (e.key.length === 1 && /[a-zA-Z0-9]/.test(e.key)) {
          e.preventDefault();
          openSpotlight(e.key);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, activeModal, isLoading, filteredClients, selectedIndex, openSpotlight, closeSpotlight, selectClient]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]"
      role="dialog"
      aria-modal="true"
      aria-label="Recherche client"
      onClick={closeSpotlight}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70" />

      {/* Spotlight panel */}
      <div
        className="relative w-full max-w-lg mx-4 bg-[var(--bg-card)] rounded-2xl border border-[var(--border-subtle)] shadow-2xl overflow-hidden"
        style={{ 
          animation: 'spotlight-appear 0.15s ease-out forwards',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border-subtle)]">
          <span className="text-[var(--text-muted)]">
            <SearchIcon />
          </span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un client..."
            className="flex-1 bg-transparent text-[var(--text-primary)] text-lg placeholder:text-[var(--text-muted)] outline-none focus:outline-none focus-visible:outline-none"
            style={{ outline: 'none', boxShadow: 'none' }}
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-[var(--text-muted)] bg-[var(--bg-tertiary)] rounded border border-[var(--border-subtle)]">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[50vh] overflow-y-auto">
          {filteredClients.length === 0 ? (
            <div className="px-4 py-8 text-center text-[var(--text-muted)] text-sm">
              Aucun client trouvé
            </div>
          ) : (
            filteredClients.map((client, index) => {
              const isSelected = index === selectedIndex;
              return (
                <button
                  key={client.id}
                  type="button"
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                    isSelected
                      ? 'bg-[var(--bg-secondary)]'
                      : 'hover:bg-[var(--bg-secondary)]'
                  }`}
                  onClick={() => selectClient(client.id)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <span className="p-2 rounded-lg bg-[var(--accent-cyan)]/10 text-[var(--accent-cyan)]">
                    <UserIcon />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[var(--text-primary)] truncate">
                      {client.name}
                    </p>
                  </div>
                  <span className="flex-shrink-0 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[var(--accent-cyan)]/20 text-[var(--accent-cyan)]">
                    Client
                  </span>
                </button>
              );
            })
          )}
        </div>

        {/* Footer hint */}
        <div className="px-4 py-2 border-t border-[var(--border-subtle)] flex items-center gap-4 text-[10px] text-[var(--text-muted)]">
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-[var(--bg-tertiary)] rounded border border-[var(--border-subtle)]">↑</kbd>
            <kbd className="px-1.5 py-0.5 bg-[var(--bg-tertiary)] rounded border border-[var(--border-subtle)]">↓</kbd>
            naviguer
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-[var(--bg-tertiary)] rounded border border-[var(--border-subtle)]">↵</kbd>
            ouvrir
          </span>
          <span className="flex items-center gap-1 ml-auto">
            <kbd className="px-1.5 py-0.5 bg-[var(--bg-tertiary)] rounded border border-[var(--border-subtle)]">⌘K</kbd>
            recherche
          </span>
        </div>
      </div>
    </div>
  );
}

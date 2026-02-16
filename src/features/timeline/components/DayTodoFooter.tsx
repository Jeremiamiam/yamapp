'use client';

import { useState, useRef, useEffect } from 'react';
import { useAppStore } from '@/lib/store';

const CHECK = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const TRASH = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
);
const PLUS = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

export function DayTodoFooter() {
  const { getIncompleteDayTodos, addDayTodo, updateDayTodo, deleteDayTodo, compactWeeks, setCompactWeeks } = useAppStore();
  const todos = getIncompleteDayTodos();
  const [input, setInput] = useState('');
  const [adding, setAdding] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const setCompactWeeksRef = useRef(setCompactWeeks);
  setCompactWeeksRef.current = setCompactWeeks;

  useEffect(() => {
    if (adding && inputRef.current) inputRef.current.focus();
  }, [adding]);

  useEffect(() => {
    try {
      if (localStorage.getItem('yam-timeline-compact') === 'true') setCompactWeeksRef.current(true);
    } catch (_) {}
    // Tableau de dépendances vide et constant : hydratation une seule fois au montage
  }, []);

  const handleAdd = () => {
    const t = input.trim();
    if (t) {
      addDayTodo(t);
      setInput('');
      setAdding(false);
    } else {
      setAdding(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
    if (e.key === 'Escape') {
      setInput('');
      setAdding(false);
      inputRef.current?.blur();
    }
  };

  return (
    <footer className="flex-shrink-0 border-t border-[var(--border-subtle)] bg-[var(--bg-card)]/90 backdrop-blur-sm px-4 py-3">
      <div className="flex flex-wrap items-center gap-4 gap-y-2">
        <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
          Todo du jour
        </span>
        {todos.length > 0 && (
          <ul className="flex flex-wrap items-center gap-2 list-none">
            {todos.map((todo) => (
              <li
                key={todo.id}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[var(--bg-secondary)]/80 border border-[var(--border-subtle)]/60"
              >
                <button
                  type="button"
                  onClick={() => updateDayTodo(todo.id, { done: true })}
                  className="flex-shrink-0 p-0.5 rounded text-[var(--accent-lime)] hover:bg-[var(--accent-lime)]/20 transition-colors"
                  title="Marquer faite"
                >
                  {CHECK}
                </button>
                <span className="text-sm text-[var(--text-primary)] max-w-[200px] truncate">
                  {todo.text}
                </span>
                <button
                  type="button"
                  onClick={() => deleteDayTodo(todo.id)}
                  className="flex-shrink-0 p-0.5 rounded text-[var(--text-muted)] hover:text-[var(--accent-coral)] hover:bg-[var(--accent-coral)]/10 transition-colors"
                  title="Supprimer"
                >
                  {TRASH}
                </button>
              </li>
            ))}
          </ul>
        )}
        {(adding || (todos.length === 0 && !adding)) && (
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={() => { if (!input.trim()) setAdding(false); }}
              placeholder="Nouvelle todo…"
              className="w-48 px-2.5 py-1.5 text-sm rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-lime)]/50"
            />
            <button
              type="button"
              onClick={handleAdd}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[var(--accent-lime)] bg-[var(--accent-lime)]/10 hover:bg-[var(--accent-lime)]/20 transition-colors"
            >
              {PLUS}
              <span>Ajouter</span>
            </button>
          </div>
        )}
        {!adding && todos.length > 0 && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[var(--text-muted)] hover:text-[var(--accent-lime)] hover:bg-[var(--accent-lime)]/10 transition-colors"
          >
            {PLUS}
            <span>Ajouter une todo du jour</span>
          </button>
        )}
        <div
          role="group"
          aria-label="Affichage calendrier : 1 ou 2 semaines"
          className="flex rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-secondary)]/60 p-0.5 ml-auto"
        >
          <button
            type="button"
            onClick={() => compactWeeks && setCompactWeeks(false)}
            className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-md transition-all ${
              !compactWeeks
                ? 'bg-[var(--accent-lime)] text-[var(--bg-primary)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
            title="1 semaine (5 jours)"
          >
            1 sem.
          </button>
          <button
            type="button"
            onClick={() => !compactWeeks && setCompactWeeks(true)}
            className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-md transition-all ${
              compactWeeks
                ? 'bg-[var(--accent-lime)] text-[var(--bg-primary)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
            title="2 semaines (10 jours)"
          >
            2 sem.
          </button>
        </div>
      </div>
    </footer>
  );
}

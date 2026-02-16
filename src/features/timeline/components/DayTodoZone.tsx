'use client';

import { useState, useRef, useEffect } from 'react';
import { useAppStore } from '@/lib/store';

export const TODO_DRAG_TYPE = 'application/x-yam-todo';

const CHECK_DONE = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const PLUS = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

export function DayTodoZone() {
  const { getIncompleteDayTodos, addDayTodo, deleteDayTodo, team, getTeamMemberById } = useAppStore();
  const todos = getIncompleteDayTodos();
  const [input, setInput] = useState('');
  const [selectedAssigneeIndex, setSelectedAssigneeIndex] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  const handleAdd = () => {
    const t = input.trim();
    if (t) {
      const assigneeId = team[selectedAssigneeIndex]?.id;
      addDayTodo(t, assigneeId);
      setInput('');
    }
  };

  const handleToggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const handleSelectAssignee = (index: number) => {
    setSelectedAssigneeIndex(index);
    setMenuOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
    if (e.key === 'Escape') {
      setInput('');
      inputRef.current?.blur();
    }
  };

  const handleDragStart = (e: React.DragEvent, todoId: string) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData(TODO_DRAG_TYPE, JSON.stringify({ type: 'todo', id: todoId }));
  };

  const handleDragEnd = () => {
    window.dispatchEvent(new CustomEvent('todo-drag-end'));
  };

  return (
    <div className="relative px-2.5 py-3 h-full flex flex-col overflow-hidden">
      {/* Header Todo du jour */}
      <div className="flex items-center gap-1.5 mb-2.5 flex-shrink-0">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-lime)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
          <path d="M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2v0z" />
          <line x1="9" y1="12" x2="15" y2="12" />
          <line x1="9" y1="16" x2="15" y2="16" />
        </svg>
        <h3 className="text-xs font-bold text-[var(--accent-lime)] uppercase tracking-wide truncate">
          Todo du jour
        </h3>
        {todos.length > 0 && (
          <span className="text-[10px] font-semibold text-[var(--text-muted)] bg-[var(--bg-primary)]/40 px-1.5 py-0.5 rounded-full flex-shrink-0">
            {todos.length}
          </span>
        )}
      </div>

{/* Add section - always visible with scroll picker */}
        <div className="flex-shrink-0 mb-3">
          <div className="flex items-center gap-1">
            {/* Input */}
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Todo…"
              className="flex-1 min-w-0 px-2 py-1.5 text-sm rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-primary)]/80 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-lime)]/50"
            />

            {/* Assignee selector with dropdown */}
            {team.length > 0 && (
              <div className="relative flex-shrink-0">
                <button
                  type="button"
                  onClick={handleToggleMenu}
                  className="w-7 h-7 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-secondary)]/60 flex items-center justify-center cursor-pointer select-none overflow-hidden relative hover:border-[var(--accent-lime)]/50 hover:scale-105 active:scale-95 transition-all"
                  title={`${team[selectedAssigneeIndex]?.name || ''}`}
                >
                  <div
                    className="transition-all duration-200 ease-out"
                    style={{
                      backgroundColor: team[selectedAssigneeIndex]?.color || '#84cc16',
                      color: '#000',
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '9px',
                    fontWeight: '700',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                  }}
                >
                  {team[selectedAssigneeIndex]?.initials || '?'}
                </div>
              </button>

              {/* Dropdown menu */}
              {menuOpen && (
                <div
                  ref={menuRef}
                  className="absolute right-0 top-8 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-lg shadow-xl overflow-hidden z-50 py-1"
                  style={{ minWidth: '120px', maxHeight: '240px', overflowY: 'auto' }}
                >
                  {team.map((member, index) => (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => handleSelectAssignee(index)}
                      className={`w-full flex items-center gap-2 px-3 py-2 hover:bg-[var(--bg-secondary)] transition-colors ${
                        index === selectedAssigneeIndex ? 'bg-[var(--accent-lime)]/10' : ''
                      }`}
                    >
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                        style={{ backgroundColor: member.color, color: '#000' }}
                      >
                        {member.initials}
                      </div>
                      <span className="text-sm text-[var(--text-primary)] truncate">{member.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Todos list - scrollable */}
      <div className="flex-1 overflow-y-auto">
        {todos.length > 0 && (
          <ul className="flex flex-col gap-1.5">
            {todos.map((todo) => (
              <li
                key={todo.id}
                draggable
                onDragStart={(e) => handleDragStart(e, todo.id)}
                onDragEnd={handleDragEnd}
                className="flex items-start gap-1.5 p-2 rounded-lg bg-[var(--bg-card)]/80 border border-[var(--border-subtle)]/60 hover:border-[var(--accent-lime)]/30 transition-all cursor-grab active:cursor-grabbing"
              >
                {/* Calendar icon if scheduled */}
                {todo.scheduledAt && (
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--accent-lime)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="flex-shrink-0 mt-0.5"
                    aria-label={`Planifiée le ${todo.scheduledAt.toLocaleString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}`}
                  >
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                )}
                {/* Assignee badge */}
                {todo.assigneeId && (() => {
                  const assignee = getTeamMemberById(todo.assigneeId);
                  if (!assignee) return null;
                  return (
                    <div
                      className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold"
                      style={{ backgroundColor: assignee.color, color: '#000' }}
                      title={assignee.name}
                    >
                      {assignee.initials}
                    </div>
                  );
                })()}
                <span className="flex-1 min-w-0 text-xs text-[var(--text-primary)] leading-snug break-words">
                  {todo.text}
                </span>
                {/* Bouton "c'est géré" - supprime la todo */}
                <button
                  type="button"
                  onClick={() => deleteDayTodo(todo.id)}
                  className="flex-shrink-0 p-0.5 rounded-md text-[var(--accent-lime)] hover:bg-[var(--accent-lime)]/20 transition-colors cursor-pointer"
                  title="C'est géré !"
                >
                  {CHECK_DONE}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

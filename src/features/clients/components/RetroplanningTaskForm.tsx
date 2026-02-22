'use client';

import { useState, useEffect } from 'react';
import type { RetroplanningTask, RetroplanningTaskColor } from '@/types';
import { daysBetween } from '@/lib/retroplanning-utils';

const X = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const COLORS: { value: RetroplanningTaskColor; label: string; css: string }[] = [
  { value: 'cyan',    label: 'Cyan',    css: 'var(--accent-cyan)' },
  { value: 'lime',    label: 'Lime',    css: 'var(--accent-lime)' },
  { value: 'violet',  label: 'Violet',  css: 'var(--accent-violet)' },
  { value: 'coral',   label: 'Corail',  css: 'var(--accent-coral)' },
  { value: 'amber',   label: 'Ambre',   css: 'var(--accent-amber)' },
  { value: 'magenta', label: 'Magenta', css: 'var(--accent-magenta)' },
];

interface RetroplanningTaskFormProps {
  task: RetroplanningTask;
  onSave: (updated: RetroplanningTask) => void;
  onClose: () => void;
}

export function RetroplanningTaskForm({ task, onSave, onClose }: RetroplanningTaskFormProps) {
  const [label, setLabel] = useState(task.label);
  const [startDate, setStartDate] = useState(task.startDate);
  const [endDate, setEndDate] = useState(task.endDate);
  const [color, setColor] = useState<RetroplanningTaskColor>(task.color);

  // Sync form when task prop changes (e.g. after drag)
  useEffect(() => {
    setLabel(task.label);
    setStartDate(task.startDate);
    setEndDate(task.endDate);
    setColor(task.color);
  }, [task.label, task.startDate, task.endDate, task.color]);

  // Auto-compute durationDays from dates
  const durationDays = startDate && endDate ? daysBetween(startDate, endDate) : task.durationDays;

  function handleSave() {
    onSave({
      ...task,
      label: label.trim() || task.label,
      startDate,
      endDate,
      durationDays: Math.max(1, durationDays),
      color,
    });
  }

  return (
    <div
      className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-4 space-y-3 h-full"
      role="form"
      aria-label="Modifier la tâche"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">Modifier la tâche</h3>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
          aria-label="Fermer"
        >
          <X />
        </button>
      </div>

      {/* Label */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
          Libellé
        </label>
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="w-full px-3 py-2 text-sm bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-amber)] transition-colors"
          placeholder="Nom de l'étape"
        />
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
            Début
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-amber)] transition-colors"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
            Fin
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-amber)] transition-colors"
          />
        </div>
      </div>

      {/* Duration (readonly) */}
      <div className="flex items-center gap-2 px-3 py-2 bg-[var(--bg-tertiary)] rounded-lg">
        <span className="text-xs text-[var(--text-muted)]">Durée calculée :</span>
        <span className="text-xs font-semibold text-[var(--accent-amber)]">
          {Math.max(1, durationDays)} jour{durationDays > 1 ? 's' : ''}
        </span>
      </div>

      {/* Color */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
          Couleur
        </label>
        <div className="flex gap-2 flex-wrap">
          {COLORS.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setColor(c.value)}
              className="w-7 h-7 rounded-full transition-all"
              style={{
                backgroundColor: c.css,
                outline: color === c.value ? `2px solid ${c.css}` : '2px solid transparent',
                outlineOffset: '2px',
                opacity: color === c.value ? 1 : 0.5,
              }}
              title={c.label}
              aria-label={c.label}
              aria-pressed={color === c.value}
            />
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onClose}
          className="px-3 py-1.5 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors"
        >
          Annuler
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="px-4 py-1.5 text-xs font-semibold rounded-lg transition-colors"
          style={{ backgroundColor: 'var(--accent-amber)', color: '#000' }}
        >
          Enregistrer
        </button>
      </div>
    </div>
  );
}

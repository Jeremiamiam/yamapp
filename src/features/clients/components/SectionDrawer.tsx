'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, type DropResult, type DraggableProvidedDragHandleProps } from '@hello-pangea/dnd';
import type { HomepageSection } from '@/types/web-brief';
import type { ZonedSection } from '@/types/section-zoning';
import { getLayoutForRoleWithFallback, getAvailableLayouts } from '@/lib/section-registry';
import { LayoutGallery } from '@/features/layout-gallery/components/LayoutGallery';

// ── Helpers ──────────────────────────────────────────────────────────────────

function extractSectionTitle(content: Record<string, unknown>, fallbackRole: string): string {
  for (const key of ['title', 'headline', 'heading', 'name', 'question']) {
    if (typeof content[key] === 'string' && content[key]) return content[key] as string;
  }
  for (const val of Object.values(content)) {
    if (typeof val === 'string' && val.length > 0 && val.length < 100) return val;
  }
  return fallbackRole;
}

function reorder<T>(list: T[], startIndex: number, endIndex: number): T[] {
  const result = [...list];
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result;
}

// ── Field type inference (duplicated from WebBriefView for edit panel) ────────

type FieldType = 'string' | 'text' | 'array-strings' | 'array-objects' | 'object' | 'unknown';

function inferFieldType(value: unknown): FieldType {
  if (typeof value === 'string') {
    return value.length > 80 ? 'text' : 'string';
  }
  if (Array.isArray(value)) {
    if (value.length > 0 && typeof value[0] === 'string') return 'array-strings';
    return 'array-objects';
  }
  if (typeof value === 'object' && value !== null) return 'object';
  return 'unknown';
}

function humanizeKey(key: string): string {
  return key.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
}

// ── StableField ──────────────────────────────────────────────────────────────

function StableField({
  value,
  onChange,
  as = 'input',
  className,
  placeholder,
  rows,
}: {
  value: string;
  onChange: (v: string) => void;
  as?: 'input' | 'textarea';
  className?: string;
  placeholder?: string;
  rows?: number;
}) {
  const [local, setLocal] = useState(value);
  const ref = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    if (document.activeElement !== ref.current) {
      setLocal(value);
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const v = e.target.value;
    setLocal(v);
    onChange(v);
  };

  const common = { value: local, onChange: handleChange, className, placeholder };
  if (as === 'textarea') {
    return <textarea ref={ref as React.RefObject<HTMLTextAreaElement>} rows={rows ?? 3} {...common} />;
  }
  return <input ref={ref as React.RefObject<HTMLInputElement>} type="text" {...common} />;
}

// ── DynamicSectionFields ─────────────────────────────────────────────────────

function DynamicSectionFields({
  content,
  onPatch,
}: {
  content: Record<string, unknown>;
  onPatch: (key: string, value: unknown) => void;
}) {
  const inputCls =
    'w-full mt-1 px-3 py-2 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-cyan)]/50';

  const entries = Object.entries(content);

  return (
    <div className="space-y-4">
      {entries.map(([key, value]) => {
        const type = inferFieldType(value);
        if (type === 'unknown') return null;

        if (type === 'string') {
          return (
            <div key={key}>
              <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                {humanizeKey(key)}
              </label>
              <StableField
                value={(value as string) ?? ''}
                onChange={(v) => onPatch(key, v)}
                className={inputCls}
                placeholder={humanizeKey(key)}
              />
            </div>
          );
        }

        if (type === 'text') {
          return (
            <div key={key}>
              <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                {humanizeKey(key)}
              </label>
              <StableField
                as="textarea"
                value={(value as string) ?? ''}
                onChange={(v) => onPatch(key, v)}
                rows={3}
                className={`${inputCls} resize-none`}
                placeholder={humanizeKey(key)}
              />
            </div>
          );
        }

        if (type === 'object') {
          const obj = value as Record<string, unknown>;
          const hasLabel = 'label' in obj;
          const hasUrl = 'url' in obj;
          if (hasLabel || hasUrl) {
            return (
              <div key={key}>
                <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  {humanizeKey(key)}
                </label>
                <div className="flex gap-2 mt-1">
                  {hasLabel && (
                    <StableField
                      value={(obj.label as string) ?? ''}
                      onChange={(v) => onPatch(key, { ...obj, label: v })}
                      className={`flex-1 ${inputCls} mt-0`}
                      placeholder="Label"
                    />
                  )}
                  {hasUrl && (
                    <StableField
                      value={(obj.url as string) ?? ''}
                      onChange={(v) => onPatch(key, { ...obj, url: v })}
                      className={`flex-1 ${inputCls} mt-0`}
                      placeholder="URL"
                    />
                  )}
                </div>
              </div>
            );
          }
          return (
            <div key={key}>
              <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                {humanizeKey(key)}
              </label>
              <div className="mt-1 pl-2 border-l-2 border-[var(--border-subtle)] space-y-2">
                {Object.entries(obj).map(([subKey, subVal]) => {
                  if (typeof subVal !== 'string' && typeof subVal !== 'number') return null;
                  const subType = inferFieldType(subVal);
                  if (subType === 'text') {
                    return (
                      <div key={subKey}>
                        <label className="text-[10px] text-[var(--text-muted)]">{humanizeKey(subKey)}</label>
                        <StableField
                          as="textarea"
                          value={String(subVal ?? '')}
                          onChange={(v) => onPatch(key, { ...obj, [subKey]: v })}
                          rows={2}
                          className={`${inputCls} resize-none mt-0.5`}
                          placeholder={humanizeKey(subKey)}
                        />
                      </div>
                    );
                  }
                  return (
                    <div key={subKey}>
                      <label className="text-[10px] text-[var(--text-muted)]">{humanizeKey(subKey)}</label>
                      <StableField
                        value={String(subVal ?? '')}
                        onChange={(v) => onPatch(key, { ...obj, [subKey]: v })}
                        className={`${inputCls} mt-0.5`}
                        placeholder={humanizeKey(subKey)}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        }

        if (type === 'array-strings') {
          const arr = value as string[];
          return (
            <div key={key}>
              <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                {humanizeKey(key)}
              </label>
              <div className="mt-1 space-y-1">
                {arr.map((item, idx) => (
                  <div key={idx} className="flex gap-1">
                    <StableField
                      value={item}
                      onChange={(v) => {
                        const next = [...arr];
                        next[idx] = v;
                        onPatch(key, next);
                      }}
                      className={`flex-1 ${inputCls} mt-0`}
                      placeholder={`${humanizeKey(key)} ${idx + 1}`}
                    />
                    <button
                      type="button"
                      onClick={() => onPatch(key, arr.filter((_, i) => i !== idx))}
                      className="px-2 py-1 rounded text-xs text-[var(--text-muted)] hover:text-red-400 hover:bg-red-400/10 transition-colors flex-shrink-0"
                      title="Supprimer"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => onPatch(key, [...arr, ''])}
                  className="px-2 py-1 rounded text-xs text-[var(--accent-cyan)] hover:bg-[var(--accent-cyan)]/10 transition-colors"
                >
                  + Ajouter
                </button>
              </div>
            </div>
          );
        }

        if (type === 'array-objects') {
          const arr = value as Record<string, unknown>[];
          return (
            <div key={key}>
              <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                {humanizeKey(key)}
              </label>
              <div className="mt-1 space-y-3">
                {arr.map((item, idx) => (
                  <div key={idx} className="relative pl-2 border-l-2 border-[var(--border-subtle)] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-[var(--text-muted)]">#{idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => onPatch(key, arr.filter((_, i) => i !== idx))}
                        className="px-1.5 py-0.5 rounded text-[10px] text-[var(--text-muted)] hover:text-red-400 hover:bg-red-400/10 transition-colors"
                        title="Supprimer l'item"
                      >
                        ✕
                      </button>
                    </div>
                    {Object.entries(item).map(([subKey, subVal]) => {
                      if (typeof subVal !== 'string' && typeof subVal !== 'number') return null;
                      const subType = inferFieldType(subVal);
                      if (subType === 'text') {
                        return (
                          <div key={subKey}>
                            <label className="text-[10px] text-[var(--text-muted)]">{humanizeKey(subKey)}</label>
                            <StableField
                              as="textarea"
                              value={String(subVal ?? '')}
                              onChange={(v) => {
                                const next = [...arr];
                                next[idx] = { ...item, [subKey]: v };
                                onPatch(key, next);
                              }}
                              rows={2}
                              className={`${inputCls} resize-none mt-0.5`}
                              placeholder={humanizeKey(subKey)}
                            />
                          </div>
                        );
                      }
                      return (
                        <div key={subKey}>
                          <label className="text-[10px] text-[var(--text-muted)]">{humanizeKey(subKey)}</label>
                          <StableField
                            value={String(subVal ?? '')}
                            onChange={(v) => {
                              const next = [...arr];
                              next[idx] = { ...item, [subKey]: v };
                              onPatch(key, next);
                            }}
                            className={`${inputCls} mt-0.5`}
                            placeholder={humanizeKey(subKey)}
                          />
                        </div>
                      );
                    })}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    const template = arr[0]
                      ? Object.fromEntries(Object.keys(arr[0]).map((k) => [k, '']))
                      : {};
                    onPatch(key, [...arr, template]);
                  }}
                  className="px-2 py-1 rounded text-xs text-[var(--accent-cyan)] hover:bg-[var(--accent-cyan)]/10 transition-colors"
                >
                  + Ajouter
                </button>
              </div>
            </div>
          );
        }

        return null;
      })}
    </div>
  );
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface SectionDrawerProps {
  sections: (HomepageSection | ZonedSection)[];
  activeSectionId?: string;
  onScrollToSection: (sectionId: string) => void;
  onClose?: () => void;
  // Edit mode actions
  onAiRewrite?: (sectionId: string) => void;
  onEditSection?: (sectionId: string) => void;
  onDeleteSection?: (sectionId: string) => void;
  onAddSection?: () => void;
  onReorderSections?: (reordered: (HomepageSection | ZonedSection)[]) => void;
  onGenerateLayout?: (role: string, sampleContent: Record<string, unknown>) => Promise<void>;
  // Edit panel
  editingSectionId?: string | null;
  onCloseEdit?: () => void;
  onContentChange?: (sectionId: string, patch: Record<string, unknown>) => void;
  // Role change (layout picker)
  onRoleChange?: (sectionId: string, newRole: string) => void;
  // AI prompt
  onAiSubmit?: (sectionId: string, customPrompt?: string) => void;
  rewritingSectionId?: string | null;
  // Theme toggle
  previewTheme?: 'dark' | 'light';
  onToggleTheme?: () => void;
}

// ── LayoutPicker (custom dropdown with live preview on ↑/↓) ──────────────────

function LayoutPicker({
  currentRole,
  onChange,
  onOpenGallery,
}: {
  currentRole: string;
  onChange: (newRole: string) => void;
  onOpenGallery?: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const roleBeforeOpen = useRef(currentRole);

  const layouts = getAvailableLayouts();
  const isKnownRole = layouts.some(l => l.role === currentRole);
  const allItems = isKnownRole
    ? layouts
    : [{ role: currentRole, label: currentRole.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase()), group: 'unknown' as const }, ...layouts];

  const currentIndex = allItems.findIndex(l => l.role === currentRole);

  const open = useCallback(() => {
    roleBeforeOpen.current = currentRole;
    setHighlightedIndex(allItems.findIndex(l => l.role === currentRole));
    setIsOpen(true);
  }, [currentRole, allItems]);

  const close = useCallback((confirm: boolean) => {
    if (!confirm) {
      onChange(roleBeforeOpen.current);
    }
    setIsOpen(false);
  }, [onChange]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        close(true);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen, close]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (!isOpen || highlightedIndex < 0) return;
    const list = listRef.current;
    if (!list) return;
    const item = list.children[highlightedIndex] as HTMLElement | undefined;
    item?.scrollIntoView({ block: 'nearest' });
  }, [isOpen, highlightedIndex]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        open();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown': {
        e.preventDefault();
        const next = Math.min(highlightedIndex + 1, allItems.length - 1);
        setHighlightedIndex(next);
        onChange(allItems[next].role);
        break;
      }
      case 'ArrowUp': {
        e.preventDefault();
        const prev = Math.max(highlightedIndex - 1, 0);
        setHighlightedIndex(prev);
        onChange(allItems[prev].role);
        break;
      }
      case 'Enter':
        e.preventDefault();
        close(true);
        break;
      case 'Escape':
        e.preventDefault();
        close(false);
        break;
    }
  }, [isOpen, highlightedIndex, allItems, onChange, open, close]);

  const displayLabel = allItems[currentIndex]?.label ?? currentRole;

  return (
    <div ref={containerRef} className="relative flex items-center gap-1">
      <button
        type="button"
        onClick={() => isOpen ? close(true) : open()}
        onKeyDown={handleKeyDown}
        className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[var(--accent-cyan)] bg-transparent border border-[var(--border-subtle)] rounded-md px-1.5 py-1 cursor-pointer hover:border-[var(--accent-cyan)]/50 focus:outline-none focus:border-[var(--accent-cyan)]/50 max-w-[180px]"
      >
        <span className="truncate">{displayLabel}</span>
        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={`flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {onOpenGallery && (
        <button
          type="button"
          onClick={onOpenGallery}
          className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--accent-cyan)] hover:bg-[var(--accent-cyan)]/10 transition-colors"
          title="Galerie de layouts"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
        </button>
      )}

      {isOpen && (
        <div
          ref={listRef}
          className="absolute top-full left-0 mt-1 w-[200px] max-h-[280px] overflow-y-auto rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-secondary)] shadow-lg z-50"
          role="listbox"
        >
          {allItems.map((item, idx) => {
            const isFirst = idx === 0 || allItems[idx - 1].group !== item.group;
            return (
              <div key={item.role}>
                {isFirst && (
                  <div className="px-2 pt-2 pb-0.5 text-[8px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
                    {item.group === 'custom' ? 'Custom' : item.group === 'unknown' ? 'Actuel' : 'Standard'}
                  </div>
                )}
                <div
                  role="option"
                  aria-selected={idx === highlightedIndex}
                  className={`px-2.5 py-1.5 text-[11px] cursor-pointer transition-colors ${
                    idx === highlightedIndex
                      ? 'bg-[var(--accent-cyan)]/15 text-[var(--accent-cyan)]'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'
                  }`}
                  onMouseEnter={() => {
                    setHighlightedIndex(idx);
                    onChange(item.role);
                  }}
                  onClick={() => {
                    onChange(item.role);
                    close(true);
                  }}
                >
                  {item.label}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── SectionDrawer ────────────────────────────────────────────────────────────

export function SectionDrawer({
  sections,
  activeSectionId,
  onScrollToSection,
  onClose,
  onAiRewrite,
  onEditSection,
  onDeleteSection,
  onAddSection,
  onReorderSections,
  onGenerateLayout,
  editingSectionId,
  onCloseEdit,
  onContentChange,
  onRoleChange,
  onAiSubmit,
  rewritingSectionId,
  previewTheme,
  onToggleTheme,
}: SectionDrawerProps) {
  const [aiPromptSectionId, setAiPromptSectionId] = useState<string | null>(null);
  const [aiPromptValue, setAiPromptValue] = useState('');
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryContextSectionId, setGalleryContextSectionId] = useState<string | null>(null);
  const editPanelRef = useRef<HTMLDivElement>(null);

  const editingSection = editingSectionId
    ? sections.find((s) => {
        const id = (s as HomepageSection).id ?? `${s.role}-${s.order}`;
        return id === editingSectionId;
      })
    : null;

  const handleDragEnd = useCallback(
    (result: DropResult) => {
      if (!result.destination || !onReorderSections) return;
      const { source, destination } = result;
      if (source.index === destination.index) return;
      const reordered = reorder(sections, source.index, destination.index);
      const withOrder = reordered.map((s, i) => ({ ...s, order: i + 1 }));
      onReorderSections(withOrder);
    },
    [sections, onReorderSections]
  );

  // Auto-save: apply each field change immediately
  const handleEditPatch = useCallback((key: string, value: unknown) => {
    if (editingSectionId && onContentChange) {
      onContentChange(editingSectionId, { [key]: value });
    }
  }, [editingSectionId, onContentChange]);

  const handleAiPromptSubmit = useCallback(
    (sectionId: string) => {
      if (!onAiSubmit) return;
      onAiSubmit(sectionId, aiPromptValue.trim() || undefined);
      setAiPromptSectionId(null);
      setAiPromptValue('');
    },
    [onAiSubmit, aiPromptValue]
  );

  // Enter key closes edit panel (when not in input/textarea)
  useEffect(() => {
    if (!editingSectionId || !onCloseEdit) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Enter') return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      e.preventDefault();
      onCloseEdit();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [editingSectionId, onCloseEdit]);

  // Escape closes edit panel first (capture phase, highest priority)
  useEffect(() => {
    if (!editingSectionId || !onCloseEdit) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      e.stopImmediatePropagation();
      onCloseEdit();
    };
    document.addEventListener('keydown', handler, true);
    return () => document.removeEventListener('keydown', handler, true);
  }, [editingSectionId, onCloseEdit]);

  return (
    <>
      {/* Drawer */}
      <div className="hidden md:flex flex-col w-[300px] flex-shrink-0 border-r border-[var(--border-subtle)] bg-[var(--bg-secondary)] animate-drawer-slide-in">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-2.5">
            <span className="text-sm font-semibold text-[var(--text-primary)]">Sections</span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-[var(--bg-tertiary)] text-[var(--text-muted)] font-medium">
              {sections.length}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {onToggleTheme && (
              <button
                type="button"
                onClick={onToggleTheme}
                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                title={previewTheme === 'dark' ? 'Mode clair' : 'Mode sombre'}
              >
                {previewTheme === 'dark' ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                  </svg>
                )}
              </button>
            )}
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                title="Fermer le drawer"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Section list with DnD */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          {onReorderSections ? (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="drawer-sections">
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.droppableProps} className="py-2">
                    {sections.map((section, index) => {
                      const sectionId = (section as HomepageSection).id ?? `${section.role}-${section.order}`;
                      return (
                        <Draggable key={sectionId} draggableId={sectionId} index={index}>
                          {(dragProvided, dragSnapshot) => (
                            <div
                              ref={dragProvided.innerRef}
                              {...dragProvided.draggableProps}
                              className={dragSnapshot.isDragging ? 'opacity-80 z-50' : ''}
                            >
                              <DrawerItem
                                section={section}
                                sectionId={sectionId}
                                isActive={activeSectionId === sectionId}
                                isRewriting={rewritingSectionId === sectionId}
                                isEditing={editingSectionId === sectionId}
                                isAiPromptOpen={aiPromptSectionId === sectionId}
                                aiPromptValue={aiPromptSectionId === sectionId ? aiPromptValue : ''}
                                onAiPromptChange={setAiPromptValue}
                                onClick={() => onScrollToSection(sectionId)}
                                onAiClick={onAiRewrite ? () => {
                                  if (aiPromptSectionId === sectionId) {
                                    setAiPromptSectionId(null);
                                    setAiPromptValue('');
                                  } else {
                                    setAiPromptSectionId(sectionId);
                                    setAiPromptValue('');
                                  }
                                } : undefined}
                                onAiSubmit={() => handleAiPromptSubmit(sectionId)}
                                onAiCancel={() => { setAiPromptSectionId(null); setAiPromptValue(''); }}
                                onEditClick={onEditSection ? () => onEditSection(sectionId) : undefined}
                                onDeleteClick={onDeleteSection ? () => {
                                  onDeleteSection(sectionId);
                                } : undefined}
                                onGenerateLayout={onGenerateLayout}
                                dragHandleProps={dragProvided.dragHandleProps ?? undefined}
                              />
                            </div>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          ) : (
            <div className="py-2">
              {sections.map((section) => {
                const sectionId = (section as HomepageSection).id ?? `${section.role}-${section.order}`;
                return (
                  <DrawerItem
                    key={sectionId}
                    section={section}
                    sectionId={sectionId}
                    isActive={activeSectionId === sectionId}
                    isRewriting={rewritingSectionId === sectionId}
                    isEditing={editingSectionId === sectionId}
                    isAiPromptOpen={aiPromptSectionId === sectionId}
                    aiPromptValue={aiPromptSectionId === sectionId ? aiPromptValue : ''}
                    onAiPromptChange={setAiPromptValue}
                    onClick={() => onScrollToSection(sectionId)}
                    onAiClick={onAiRewrite ? () => {
                      if (aiPromptSectionId === sectionId) {
                        setAiPromptSectionId(null);
                        setAiPromptValue('');
                      } else {
                        setAiPromptSectionId(sectionId);
                        setAiPromptValue('');
                      }
                    } : undefined}
                    onAiSubmit={() => handleAiPromptSubmit(sectionId)}
                    onAiCancel={() => { setAiPromptSectionId(null); setAiPromptValue(''); }}
                    onEditClick={onEditSection ? () => onEditSection(sectionId) : undefined}
                    onDeleteClick={onDeleteSection ? () => {
                      if (!window.confirm('Supprimer cette section ?')) return;
                      onDeleteSection(sectionId);
                    } : undefined}
                    onGenerateLayout={onGenerateLayout}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Add section button */}
        {onAddSection && (
          <div className="flex-shrink-0 border-t border-[var(--border-subtle)] p-3">
            <button
              type="button"
              onClick={onAddSection}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-dashed border-[var(--border-medium)] text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:border-[var(--accent-cyan)]/50 hover:bg-[var(--accent-cyan)]/5 transition-colors text-sm"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Ajouter une section
            </button>
          </div>
        )}
      </div>

      {/* Edit slide-over panel */}
      {editingSectionId && editingSection && onContentChange && onCloseEdit && (
        <div ref={editPanelRef} className="hidden md:flex flex-col w-[320px] flex-shrink-0 border-r border-[var(--border-subtle)] bg-[var(--bg-secondary)] animate-panel-slide-in z-10">
          {/* Panel header */}
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-[var(--border-subtle)]">
            {onRoleChange ? (
              <LayoutPicker
                currentRole={editingSection.role}
                onChange={(newRole) => onRoleChange(editingSectionId, newRole)}
                onOpenGallery={() => {
                  setGalleryContextSectionId(editingSectionId);
                  setGalleryOpen(true);
                }}
              />
            ) : (
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent-cyan)]">
                {editingSection.role}
              </span>
            )}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={onCloseEdit}
                className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-[var(--accent-cyan)] text-black hover:opacity-90 transition-opacity"
                title="Valider (Enter)"
              >
                Valider ↵
              </button>
              <button
                type="button"
                onClick={onCloseEdit}
                className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>

          {/* Panel content — scrollable */}
          <div className="flex-1 min-h-0 overflow-y-auto p-3">
            {editingSection.intent && (
              <p className="text-[10px] text-[var(--text-muted)] italic mb-3">{editingSection.intent}</p>
            )}
            <DynamicSectionFields
              content={(editingSection.content || {}) as Record<string, unknown>}
              onPatch={handleEditPatch}
            />
          </div>
        </div>
      )}

      {/* Layout Gallery modal (opened from LayoutPicker gallery button) */}
      {galleryOpen && (
        <LayoutGallery
          isOpen
          onClose={() => setGalleryOpen(false)}
          initialRole={
            galleryContextSectionId
              ? sections.find((s) => {
                  const id = (s as HomepageSection).id ?? `${s.role}-${s.order}`;
                  return id === galleryContextSectionId;
                })?.role
              : undefined
          }
          onSelectRole={(role) => {
            if (galleryContextSectionId && onRoleChange) {
              onRoleChange(galleryContextSectionId, role);
            }
          }}
        />
      )}
    </>
  );
}

// ── DrawerItem ───────────────────────────────────────────────────────────────

function DrawerItem({
  section,
  sectionId,
  isActive,
  isRewriting,
  isEditing,
  isAiPromptOpen,
  aiPromptValue,
  onAiPromptChange,
  onClick,
  onAiClick,
  onAiSubmit,
  onAiCancel,
  onEditClick,
  onDeleteClick,
  onGenerateLayout,
  dragHandleProps,
}: {
  section: HomepageSection | ZonedSection;
  sectionId: string;
  isActive: boolean;
  isRewriting: boolean;
  isEditing: boolean;
  isAiPromptOpen: boolean;
  aiPromptValue: string;
  onAiPromptChange: (v: string) => void;
  onClick: () => void;
  onAiClick?: () => void;
  onAiSubmit?: () => void;
  onAiCancel?: () => void;
  onEditClick?: () => void;
  onDeleteClick?: () => void;
  onGenerateLayout?: (role: string, sampleContent: Record<string, unknown>) => Promise<void>;
  dragHandleProps?: DraggableProvidedDragHandleProps;
}) {
  const content = (section.content || {}) as Record<string, unknown>;
  const title = extractSectionTitle(content, section.role);
  const layoutResult = getLayoutForRoleWithFallback(section.role);
  const hasLayout = !!layoutResult.layout;

  return (
    <div className="px-2">
      <div
        className={`group relative flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${
          isEditing
            ? 'bg-[var(--accent-cyan)]/15 ring-1 ring-[var(--accent-cyan)]/30'
            : isActive
              ? 'bg-[var(--accent-cyan)]/10'
              : 'hover:bg-[var(--bg-tertiary)]'
        }`}
        onClick={onClick}
      >
        {/* Drag handle */}
        {dragHandleProps && (
          <span
            {...dragHandleProps}
            className="flex-shrink-0 cursor-grab active:cursor-grabbing text-[var(--text-muted)] hover:text-[var(--text-secondary)] p-0.5 rounded"
            onClick={(e) => e.stopPropagation()}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="9" cy="5" r="1.5" /><circle cx="15" cy="5" r="1.5" />
              <circle cx="9" cy="12" r="1.5" /><circle cx="15" cy="12" r="1.5" />
              <circle cx="9" cy="19" r="1.5" /><circle cx="15" cy="19" r="1.5" />
            </svg>
          </span>
        )}

        {/* No layout indicator */}
        {!hasLayout && (
          <span className="flex-shrink-0 w-2 h-2 rounded-full bg-[var(--accent-amber)]" title="Layout manquant" />
        )}

        {/* Title */}
        <span className="flex-1 min-w-0 text-sm text-[var(--text-secondary)] truncate">
          {title}
        </span>

        {/* Rewriting indicator */}
        {isRewriting && (
          <span className="flex-shrink-0 w-4 h-4 border-2 border-[var(--accent-magenta)]/30 border-t-[var(--accent-magenta)] rounded-full animate-spin" />
        )}

        {/* Hover actions */}
        {!isRewriting && (
          <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {onAiClick && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onAiClick(); }}
                className={`px-2 py-1 rounded-md text-[10px] font-bold transition-colors ${
                  isAiPromptOpen
                    ? 'bg-[var(--accent-magenta)]/20 text-[var(--accent-magenta)]'
                    : 'text-[var(--accent-magenta)] hover:bg-[var(--accent-magenta)]/10'
                }`}
                title="Réécriture IA"
              >
                IA
              </button>
            )}
            {onEditClick && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onEditClick(); }}
                className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                title="Modifier"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>
            )}
            {!hasLayout && onGenerateLayout && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onGenerateLayout(section.role, content); }}
                className="p-1 rounded-md text-[var(--accent-amber)] hover:bg-[var(--accent-amber)]/10 transition-colors"
                title="Générer le layout"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <line x1="9" y1="3" x2="9" y2="21" />
                </svg>
              </button>
            )}
            {onDeleteClick && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onDeleteClick(); }}
                className="p-1 rounded-md text-[var(--text-muted)] hover:text-red-400 hover:bg-red-400/10 transition-colors"
                title="Supprimer"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                  <path d="M10 11v6" /><path d="M14 11v6" />
                  <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                </svg>
              </button>
            )}
          </div>
        )}
      </div>

      {/* AI prompt inline */}
      {isAiPromptOpen && onAiSubmit && onAiCancel && (
        <div className="mx-3 mt-1.5 mb-2 p-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] space-y-2">
          <textarea
            value={aiPromptValue}
            onChange={(e) => onAiPromptChange(e.target.value)}
            placeholder="Prompt optionnel — vide = touche Yam"
            rows={2}
            className="w-full px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] resize-none focus:outline-none focus:border-[var(--accent-magenta)]/40"
            autoFocus
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onAiSubmit}
              disabled={isRewriting}
              className="px-3 py-1.5 rounded-lg bg-[var(--accent-magenta)] text-white text-xs font-semibold disabled:opacity-50 hover:opacity-90 transition-opacity"
            >
              {isRewriting ? 'Génération…' : 'Générer'}
            </button>
            <button
              type="button"
              onClick={onAiCancel}
              disabled={isRewriting}
              className="px-3 py-1.5 rounded-lg border border-[var(--border-subtle)] text-xs text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] disabled:opacity-50 transition-colors"
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

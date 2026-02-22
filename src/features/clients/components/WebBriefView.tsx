'use client';

import { useState, useCallback, useRef, useLayoutEffect, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, type DropResult, type DraggableProvidedDragHandleProps } from '@hello-pangea/dnd';
import type { WebBriefData } from '@/types/web-brief';
import type { HomepageSection } from '@/types/web-brief';
import type { ZonedSection } from '@/types/section-zoning';
import { getLayoutForRoleWithFallback } from '@/lib/section-registry';
import { LayoutPlaceholder } from '@/components/layouts/LayoutPlaceholder';
import { LayoutNavbar } from '@/components/layouts/LayoutNavbar';
import { LayoutFooter } from '@/components/layouts/LayoutFooter';
/**
 * Vue layout de la structure du site (menu + homepage + pages).
 * Neutre (gris, typo système) — pas de branding.
 * Responsive.
 */
type PageTab = { label: string; slug: string; isHomepage: boolean };

// ── DnD utility ─────────────────────────────────────────────────────────────

function reorder<T>(list: T[], startIndex: number, endIndex: number): T[] {
  const result = [...list];
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result;
}

// ── Field type inference ─────────────────────────────────────────────────────

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

// ── Stable field (no cursor-jump) ────────────────────────────────────────────

/**
 * Input/textarea qui garde un état local pendant la saisie pour éviter
 * que le curseur saute à la fin (provoqué par les re-renders à chaque frappe).
 */
function StableField({
  value,
  onChange,
  as = 'input',
  className,
  placeholder,
  rows,
  ...rest
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
    return <textarea ref={ref as React.RefObject<HTMLTextAreaElement>} rows={rows ?? 3} {...common} {...rest} />;
  }
  return <input ref={ref as React.RefObject<HTMLInputElement>} type="text" {...common} {...rest} />;
}

// ── Dynamic section fields ───────────────────────────────────────────────────

/**
 * Formulaire d'édition dynamique qui s'adapte aux clés présentes dans content.
 * Utilise inferFieldType pour déduire le type de chaque champ.
 * Utilise StableField pour éviter les sauts de curseur.
 */
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
          // CTA-like: has label and/or url
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
          // Generic object: render sub-fields (one level deep)
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
                      onClick={() => {
                        const next = arr.filter((_, i) => i !== idx);
                        onPatch(key, next);
                      }}
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
                        onClick={() => {
                          const next = arr.filter((_, i) => i !== idx);
                          onPatch(key, next);
                        }}
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
                    // Infer new item shape from first element if available
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

// ── WebBriefView ─────────────────────────────────────────────────────────────

export function WebBriefView({
  data,
  onAiRewrite,
  onGeneratePageZoning,
  onPageAiRewrite,
  onSectionContentChange,
  onPageSectionContentChange,
  onDeletePage,
  onDeleteSection,
  onAddSection,
  onReorderSections,
  editMode: controlledEditMode,
  onEditModeChange,
  immersiveMode = false,
}: {
  data: WebBriefData;
  onAiRewrite?: (sectionId: string, customPrompt?: string) => Promise<void>;
  onGeneratePageZoning?: (slug: string, agentBrief?: string) => Promise<void>;
  onPageAiRewrite?: (pageSlug: string, sectionId: string, customPrompt?: string) => Promise<void>;
  onSectionContentChange?: (sectionId: string, patch: Record<string, unknown>) => void;
  onPageSectionContentChange?: (pageSlug: string, sectionId: string, patch: Record<string, unknown>) => void;
  onDeletePage?: (slug: string) => void;
  onDeleteSection?: (pageSlug: string | null, sectionId: string) => void;
  onAddSection?: (pageSlug: string | null) => void;
  onReorderSections?: (pageSlug: string | null, reorderedSections: (HomepageSection | ZonedSection)[]) => void;
  /** En mode immersif, le parent contrôle l'édition via ces props */
  editMode?: boolean;
  onEditModeChange?: (v: boolean) => void;
  immersiveMode?: boolean;
}) {
  const { architecture, homepage, pages } = data;
  const [activeTab, setActiveTab] = useState<string>('__homepage__');
  const [rewritingId, setRewritingId] = useState<string | null>(null);
  const [rewritingPageSlug, setRewritingPageSlug] = useState<string | null>(null);
  const [aiPromptForSectionId, setAiPromptForSectionId] = useState<string | null>(null);
  const [aiPromptForPageSlug, setAiPromptForPageSlug] = useState<string | null>(null);
  const [aiPromptValue, setAiPromptValue] = useState('');
  const [generatingSlug, setGeneratingSlug] = useState<string | null>(null);
  const [internalEditMode, setInternalEditMode] = useState(false);
  const [generatePrompt, setGeneratePrompt] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const editMode = controlledEditMode ?? internalEditMode;
  const setEditMode = onEditModeChange ?? setInternalEditMode;

  // Remonter en haut à chaque changement de page
  useLayoutEffect(() => {
    scrollRef.current?.scrollTo(0, 0);
  }, [activeTab]);

  const primaryNav = architecture.navigation?.primary ?? [];
  const footerNav = architecture.navigation?.footer_only ?? [];
  const addedPages = architecture.navigation?.added_pages ?? [];

  // Flatten children of primary nav items into extra tabs
  const childTabs: PageTab[] = primaryNav.flatMap((item) =>
    (item.children ?? []).map((child) => ({ label: child.page, slug: child.slug, isHomepage: false }))
  );

  // Onglets = menu principal + children nav items + added_pages
  const pageTabs: PageTab[] = primaryNav.length > 0
    ? [
        ...primaryNav.map((item, i) => ({
          label: item.page,
          slug: item.slug,
          isHomepage: i === 0,
        })),
        ...childTabs,
        ...addedPages.map((item) => ({
          label: item.page,
          slug: item.slug,
          isHomepage: false,
        })),
      ]
    : [
        { label: 'Homepage', slug: 'home', isHomepage: true },
        ...childTabs,
        ...addedPages.map((item) => ({
          label: item.page,
          slug: item.slug,
          isHomepage: false,
        })),
      ];

  const handleDeletePageClick = useCallback(
    (slug: string) => {
      if (!onDeletePage) return;
      if (!window.confirm('Supprimer cette page et toutes ses sections ?')) return;
      onDeletePage(slug);
    },
    [onDeletePage]
  );

  const handleAiButtonClick = useCallback(
    (sectionId: string, pageSlug?: string) => {
      const currentPageKey = pageSlug ?? '__homepage__';
      if (aiPromptForPageSlug === currentPageKey && aiPromptForSectionId === sectionId) {
        // Toggle off
        setAiPromptForSectionId(null);
        setAiPromptForPageSlug(null);
        setAiPromptValue('');
      } else {
        setAiPromptForSectionId(sectionId);
        setAiPromptForPageSlug(currentPageKey);
        setAiPromptValue('');
      }
    },
    [aiPromptForSectionId, aiPromptForPageSlug]
  );

  const handleAiSubmit = useCallback(
    async (sectionId: string, pageSlug?: string) => {
      const isHome = !pageSlug || pageSlug === '__homepage__';
      const customPrompt = aiPromptValue.trim() || undefined;

      if (isHome) {
        if (!onAiRewrite) return;
        setRewritingPageSlug(null);
        setRewritingId(sectionId);
        try {
          await onAiRewrite(sectionId, customPrompt);
          setAiPromptForSectionId(null);
          setAiPromptForPageSlug(null);
          setAiPromptValue('');
        } finally {
          setRewritingId(null);
        }
      } else {
        if (!onPageAiRewrite) return;
        setRewritingPageSlug(pageSlug!);
        setRewritingId(sectionId);
        try {
          await onPageAiRewrite(pageSlug!, sectionId, customPrompt);
          setAiPromptForSectionId(null);
          setAiPromptForPageSlug(null);
          setAiPromptValue('');
        } finally {
          setRewritingId(null);
          setRewritingPageSlug(null);
        }
      }
    },
    [onAiRewrite, onPageAiRewrite, aiPromptValue]
  );

  const handleGeneratePage = useCallback(
    async (slug: string, customPrompt?: string) => {
      if (!onGeneratePageZoning) return;
      setGeneratingSlug(slug);
      try {
        const added = addedPages.find((a) => a.slug === slug);
        // Priorité : prompt saisi > agent_brief de la page ajoutée
        const agentBrief = customPrompt?.trim() || added?.agent_brief || undefined;
        await onGeneratePageZoning(slug, agentBrief);
      } finally {
        setGeneratingSlug(null);
      }
    },
    [onGeneratePageZoning, addedPages]
  );

  const sections = [...(homepage.sections ?? [])].sort((a, b) => a.order - b.order);

  const currentTab = pageTabs.find((t) => (t.isHomepage ? '__homepage__' : t.slug) === activeTab) ?? pageTabs[0];
  const isHomepage = currentTab.isHomepage;
  const pageSlug = currentTab.isHomepage ? undefined : currentTab.slug;
  const pageData = pageSlug ? pages?.[pageSlug] : null;
  const currentSections: (HomepageSection | ZonedSection)[] = isHomepage
    ? sections
    : [...(pageData?.sections ?? [])].sort((a, b) => a.order - b.order);
  const isRewriting = (sectionId: string) =>
    rewritingId === sectionId &&
    (isHomepage ? !rewritingPageSlug : rewritingPageSlug === pageSlug);
  const isAiPromptExpanded = (sectionId: string) =>
    aiPromptForSectionId === sectionId &&
    (aiPromptForPageSlug ?? '__homepage__') === (pageSlug ?? '__homepage__');

  const hasEditCapability = Boolean(
    onAiRewrite || onSectionContentChange ||
    onPageAiRewrite || onPageSectionContentChange
  );

  const handleDragEnd = useCallback(
    (result: DropResult) => {
      if (!result.destination || !onReorderSections) return;
      const { source, destination } = result;
      if (source.index === destination.index) return;
      const reordered = reorder(currentSections, source.index, destination.index);
      const withOrder = reordered.map((s, i) => ({ ...s, order: i + 1 }));
      onReorderSections(isHomepage ? null : (pageSlug ?? null), withOrder);
    },
    [currentSections, onReorderSections, isHomepage, pageSlug]
  );

  // Build nav items with children for LayoutNavbar
  const navItemsWithChildren = [
    ...(primaryNav.length > 0
      ? primaryNav.map((item) => ({
          page: item.page,
          slug: item.slug,
          children: item.children?.map((c) => ({ page: c.page, slug: c.slug })),
        }))
      : [{ page: 'Homepage', slug: 'home', children: undefined as { page: string; slug: string }[] | undefined }]),
    ...addedPages.map((item) => ({ page: item.page, slug: item.slug, children: undefined as { page: string; slug: string }[] | undefined })),
  ];

  return (
    <div className={`${immersiveMode ? 'flex-1 min-h-0 flex flex-col' : 'space-y-3 sm:space-y-4'}`}>
      {/* ── Mode édition : masqué en mode immersif (contrôlé par le parent), compact sur mobile sinon ─ */}
      {hasEditCapability && !immersiveMode && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setEditMode(!editMode)}
            className={`px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-lg text-xs font-medium transition-colors ${
              editMode
                ? 'bg-[var(--accent-cyan)]/20 text-[var(--accent-cyan)] border border-[var(--accent-cyan)]/40'
                : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-[var(--text-secondary)] border border-[var(--border-subtle)]'
            }`}
            title={editMode ? 'Mode édition actif' : 'Mode édition'}
          >
            <span className="sm:hidden">{editMode ? '✓' : '✎'}</span>
            <span className="hidden sm:inline">{editMode ? 'Mode édition actif' : 'Mode édition'}</span>
          </button>
        </div>
      )}

      {/* ── Vue unique : navbar + contenu + footer (navigation par le menu du site) ─ */}
      <div className={`flex flex-col overflow-hidden bg-[var(--bg-primary)] ${immersiveMode ? 'flex-1 min-h-0 rounded-none border-0' : 'rounded-xl border border-[var(--border-subtle)] min-h-[60vh] sm:min-h-[80vh]'}`}>
        <LayoutNavbar
          navItems={navItemsWithChildren}
          onNavClick={setActiveTab}
          generatedSlugs={Object.keys(pages ?? {})}
        />

        {/* Page tabs with delete button — edit mode only */}
        {editMode && onDeletePage && pageTabs.length > 1 && (
          <div className="flex items-center gap-1 px-3 py-1.5 border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)] overflow-x-auto">
            <span className="text-[10px] text-[var(--text-muted)] flex-shrink-0 mr-1">Pages :</span>
            {pageTabs.map((tab) => {
              const tabKey = tab.isHomepage ? '__homepage__' : tab.slug;
              const isActive = activeTab === tabKey;
              return (
                <div key={tab.slug} className="flex items-center gap-0.5 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => setActiveTab(tabKey)}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-medium transition-colors ${
                      isActive
                        ? 'bg-[var(--accent-cyan)]/20 text-[var(--accent-cyan)]'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'
                    }`}
                  >
                    {tab.label}
                  </button>
                  {!tab.isHomepage && (
                    <button
                      type="button"
                      onClick={() => handleDeletePageClick(tab.slug)}
                      className="p-0.5 rounded text-[var(--text-muted)] hover:text-red-400 hover:bg-red-400/10 transition-colors"
                      title={`Supprimer la page "${tab.label}"`}
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                        <path d="M10 11v6"/><path d="M14 11v6"/>
                        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                      </svg>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
        <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain scroll-touch-ios">
          {!isHomepage && !pageData && onGeneratePageZoning && pageSlug ? (
            <div className="flex flex-col items-center justify-center p-12 text-center max-w-md mx-auto">
              <p className="text-sm font-medium text-[var(--text-primary)] mb-2">
                Page &quot;{currentTab.label}&quot; sans zoning
              </p>
              <p className="text-xs text-[var(--text-secondary)] mb-4">
                Générez le zoning pour obtenir les sections prêtes à éditer.
              </p>
              <div className="w-full space-y-2 mb-4">
                <textarea
                  value={generatePrompt}
                  onChange={(e) => setGeneratePrompt(e.target.value)}
                  placeholder="Prompt optionnel (ex : 3 offres Starter/Pro/Entreprise, ton B2B rassurant, CTA sur chaque bloc)"
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] resize-none focus:outline-none focus:border-[var(--accent-cyan)]/40"
                />
              </div>
              <button
                type="button"
                onClick={() => { handleGeneratePage(pageSlug, generatePrompt.trim() || undefined); setGeneratePrompt(''); }}
                disabled={generatingSlug === pageSlug}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--accent-cyan)] text-black text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
              >
                {generatingSlug === pageSlug ? (
                  <>
                    <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    Génération…
                  </>
                ) : (
                  'Générer le zoning de cette page'
                )}
              </button>
            </div>
          ) : currentSections.length > 0 ? (
            <>
              {editMode && onReorderSections ? (
                /* DnD mode — edit mode only */
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="sections">
                    {(provided) => (
                      <div ref={provided.innerRef} {...provided.droppableProps}>
                        {currentSections.map((section, index) => {
                          const sectionId = (section as HomepageSection).id ?? `${section.role}-${section.order}`;
                          return (
                            <Draggable key={sectionId} draggableId={sectionId} index={index}>
                              {(dragProvided, dragSnapshot) => (
                                <div
                                  ref={dragProvided.innerRef}
                                  {...dragProvided.draggableProps}
                                  className={dragSnapshot.isDragging ? 'opacity-80 shadow-lg' : ''}
                                >
                                  <PreviewSectionWithEdit
                                    section={section as HomepageSection}
                                    sectionId={sectionId}
                                    editMode={editMode}
                                    pageSlug={pageSlug}
                                    isHomepage={isHomepage}
                                    isRewriting={isRewriting(sectionId)}
                                    isAiPromptExpanded={isAiPromptExpanded(sectionId)}
                                    aiPromptValue={isAiPromptExpanded(sectionId) ? aiPromptValue : ''}
                                    onAiPromptChange={setAiPromptValue}
                                    onAiButtonClick={
                                      isHomepage
                                        ? onAiRewrite ? () => handleAiButtonClick(sectionId) : undefined
                                        : onPageAiRewrite ? () => handleAiButtonClick(sectionId, pageSlug) : undefined
                                    }
                                    onAiSubmit={
                                      isHomepage
                                        ? () => handleAiSubmit(sectionId)
                                        : () => handleAiSubmit(sectionId, pageSlug)
                                    }
                                    onAiCancel={() => {
                                      setAiPromptForSectionId(null);
                                      setAiPromptForPageSlug(null);
                                      setAiPromptValue('');
                                    }}
                                    onContentChange={
                                      isHomepage
                                        ? onSectionContentChange ? (p) => onSectionContentChange(sectionId, p) : undefined
                                        : onPageSectionContentChange && pageSlug
                                          ? (p) => onPageSectionContentChange(pageSlug, sectionId, p)
                                          : undefined
                                    }
                                    onDelete={
                                      onDeleteSection
                                        ? () => {
                                            if (!window.confirm('Supprimer cette section ?')) return;
                                            onDeleteSection(isHomepage ? null : (pageSlug ?? null), sectionId);
                                          }
                                        : undefined
                                    }
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
                /* View mode — no DnD */
                currentSections.map((section) => {
                  const sectionId = (section as HomepageSection).id ?? `${section.role}-${section.order}`;
                  return (
                    <PreviewSectionWithEdit
                      key={sectionId}
                      section={section as HomepageSection}
                      sectionId={sectionId}
                      editMode={editMode}
                      pageSlug={pageSlug}
                      isHomepage={isHomepage}
                      isRewriting={isRewriting(sectionId)}
                      isAiPromptExpanded={isAiPromptExpanded(sectionId)}
                      aiPromptValue={isAiPromptExpanded(sectionId) ? aiPromptValue : ''}
                      onAiPromptChange={setAiPromptValue}
                      onAiButtonClick={
                        isHomepage
                          ? onAiRewrite ? () => handleAiButtonClick(sectionId) : undefined
                          : onPageAiRewrite ? () => handleAiButtonClick(sectionId, pageSlug) : undefined
                      }
                      onAiSubmit={
                        isHomepage
                          ? () => handleAiSubmit(sectionId)
                          : () => handleAiSubmit(sectionId, pageSlug)
                      }
                      onAiCancel={() => {
                        setAiPromptForSectionId(null);
                        setAiPromptForPageSlug(null);
                        setAiPromptValue('');
                      }}
                      onContentChange={
                        isHomepage
                          ? onSectionContentChange ? (p) => onSectionContentChange(sectionId, p) : undefined
                          : onPageSectionContentChange && pageSlug
                            ? (p) => onPageSectionContentChange(pageSlug, sectionId, p)
                            : undefined
                      }
                    />
                  );
                })
              )}
              {/* Add section button — edit mode only */}
              {editMode && onAddSection && (
                <div className="flex justify-center py-4 border-t border-[var(--border-subtle)]">
                  <button
                    type="button"
                    onClick={() => onAddSection(isHomepage ? null : (pageSlug ?? null))}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-dashed border-[var(--border-medium)] text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:border-[var(--accent-cyan)]/50 hover:bg-[var(--accent-cyan)]/5 transition-colors text-sm"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19"/>
                      <line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                    Ajouter une section
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center p-12">
              <p className="text-sm text-[var(--text-muted)] text-center">
                Aucune section.{' '}
                {!pageData && !isHomepage && 'Générez le zoning de cette page.'}
              </p>
              {/* Add section button — edit mode, even when no sections */}
              {editMode && onAddSection && (
                <button
                  type="button"
                  onClick={() => onAddSection(isHomepage ? null : (pageSlug ?? null))}
                  className="mt-4 flex items-center gap-1.5 px-4 py-2 rounded-lg border border-dashed border-[var(--border-medium)] text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:border-[var(--accent-cyan)]/50 hover:bg-[var(--accent-cyan)]/5 transition-colors text-sm"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"/>
                    <line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  Ajouter une section
                </button>
              )}
            </div>
          )}
          <LayoutFooter
            navItemsMain={[
              ...primaryNav.map((i) => ({ page: i.page, slug: i.slug })),
              ...addedPages.map((i) => ({ page: i.page, slug: i.slug })),
            ]}
            navItemsLegal={footerNav.map((i) => ({ page: i.page, slug: i.slug }))}
            tabKeys={[
              ...primaryNav.map((_, i) => (i === 0 ? '__homepage__' : primaryNav[i].slug)),
              ...addedPages.map((i) => i.slug),
            ]}
            onNavClick={setActiveTab}
            compact={immersiveMode}
          />
        </div>
      </div>
    </div>
  );
}

/** Section preview avec Layout + barre d'édition intégrée (IA, Éditer) au survol. */
function PreviewSectionWithEdit({
  section,
  sectionId,
  editMode,
  pageSlug,
  isHomepage,
  isRewriting,
  isAiPromptExpanded,
  aiPromptValue,
  onAiPromptChange,
  onAiButtonClick,
  onAiSubmit,
  onAiCancel,
  onContentChange,
  onDelete,
  onMoveUp,
  onMoveDown,
  dragHandleProps,
}: {
  section: HomepageSection;
  sectionId: string;
  editMode: boolean;
  pageSlug?: string;
  isHomepage: boolean;
  isRewriting: boolean;
  isAiPromptExpanded: boolean;
  aiPromptValue: string;
  onAiPromptChange: (v: string) => void;
  onAiButtonClick?: () => void;
  onAiSubmit?: () => void;
  onAiCancel?: () => void;
  onContentChange?: (patch: Record<string, unknown>) => void;
  onDelete?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  dragHandleProps?: DraggableProvidedDragHandleProps;
}) {
  const [editingExpanded, setEditingExpanded] = useState(false);
  // Accumulated patches — flushed on save
  const pendingPatch = useRef<Record<string, unknown>>({});

  const layoutResult = getLayoutForRoleWithFallback(section.role);
  const Layout = layoutResult.layout;
  const content = section.content || {};

  const handlePatch = useCallback((key: string, value: unknown) => {
    pendingPatch.current = { ...pendingPatch.current, [key]: value };
  }, []);

  const handleSave = useCallback(() => {
    if (onContentChange && Object.keys(pendingPatch.current).length > 0) {
      onContentChange(pendingPatch.current);
      pendingPatch.current = {};
    }
  }, [onContentChange]);

  const handleFormKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Enter') {
        const target = e.target as HTMLElement;
        // Only save on Enter for input fields, not textarea
        if (target.tagName === 'INPUT') {
          e.preventDefault();
          handleSave();
        }
      }
    },
    [handleSave]
  );

  const hasActions = onAiButtonClick || onContentChange;

  // Reset pending patches when section content changes (after AI rewrite)
  useEffect(() => {
    pendingPatch.current = {};
  }, [section.content]);

  return (
    <div className={`relative group ${editMode && hasActions ? 'ring-1 ring-[var(--accent-cyan)]/30 ring-inset rounded-lg' : ''}`}>
      {/* Mode édition déplié : formulaire EN PLACE du layout (champs éditables visibles) */}
      {editingExpanded && onContentChange ? (
        <div className="bg-[var(--bg-secondary)] p-4 md:p-6 space-y-4 rounded-lg border border-[var(--border-subtle)]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Édition — {section.role}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSave}
                className="px-3 py-1 rounded-lg text-xs font-semibold bg-[var(--accent-cyan)] text-black hover:opacity-90 transition-opacity"
              >
                Sauvegarder
              </button>
              <button
                type="button"
                onClick={() => setEditingExpanded(false)}
                className="px-2 py-1 rounded-lg text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
              >
                Fermer l'édition
              </button>
            </div>
          </div>
          {/* Section header info */}
          {section.intent && (
            <p className="text-[10px] text-[var(--text-muted)] italic">{section.intent}</p>
          )}
          <div onKeyDown={handleFormKeyDown}>
            <DynamicSectionFields
              content={content as Record<string, unknown>}
              onPatch={handlePatch}
            />
          </div>
          <button
            type="button"
            onClick={handleSave}
            className="w-full py-2 rounded-lg text-sm font-semibold bg-[var(--accent-cyan)] text-black hover:opacity-90 transition-opacity"
          >
            Sauvegarder
          </button>
        </div>
      ) : (
        <>
          {Layout ? (
            <Layout
              content={content as Record<string, unknown>}
              intent={section.intent}
            />
          ) : (
            <LayoutPlaceholder
              role={section.role}
              matchedRole={layoutResult.matched ?? undefined}
            />
          )}
          {editMode && hasActions && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--accent-cyan)]/5 border-t border-[var(--accent-cyan)]/15">
              {/* Drag handle */}
              {dragHandleProps && (
                <span
                  {...dragHandleProps}
                  className="flex-shrink-0 cursor-grab active:cursor-grabbing text-[var(--text-muted)] hover:text-[var(--text-secondary)] p-0.5 rounded"
                  title="Déplacer la section"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="9" cy="5" r="1.5"/><circle cx="15" cy="5" r="1.5"/>
                    <circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/>
                    <circle cx="9" cy="19" r="1.5"/><circle cx="15" cy="19" r="1.5"/>
                  </svg>
                </span>
              )}
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent-cyan)] flex-shrink-0">{section.role}</span>
              {section.intent && (
                <>
                  <span className="text-[10px] text-[var(--border-medium)]">—</span>
                  <span className="text-[10px] text-[var(--text-muted)] line-clamp-1 flex-1 min-w-0">{section.intent}</span>
                </>
              )}
              <div className="flex items-center gap-1 ml-auto flex-shrink-0">
                {/* Move up/down buttons */}
                {onMoveUp && (
                  <button
                    type="button"
                    onClick={onMoveUp}
                    className="p-0.5 rounded text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                    title="Monter la section"
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="18 15 12 9 6 15"/>
                    </svg>
                  </button>
                )}
                {onMoveDown && (
                  <button
                    type="button"
                    onClick={onMoveDown}
                    className="p-0.5 rounded text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                    title="Descendre la section"
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </button>
                )}
                {onAiButtonClick && (
                  <button
                    type="button"
                    onClick={onAiButtonClick}
                    disabled={isRewriting}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                      isAiPromptExpanded
                        ? 'border-[var(--accent-magenta)]/50 bg-[var(--accent-magenta)]/20 text-[var(--accent-magenta)]'
                        : 'border-[var(--accent-magenta)]/30 bg-[var(--accent-magenta)]/10 text-[var(--accent-magenta)] hover:bg-[var(--accent-magenta)]/20'
                    }`}
                  >
                    {isRewriting ? '…' : 'IA ◆'}
                  </button>
                )}
                {onContentChange && (
                  <button
                    type="button"
                    onClick={() => setEditingExpanded(true)}
                    className="px-2 py-0.5 rounded-md text-[10px] font-semibold border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                  >
                    ✎
                  </button>
                )}
                {/* Delete section button */}
                {onDelete && (
                  <button
                    type="button"
                    onClick={onDelete}
                    className="p-0.5 rounded text-[var(--text-muted)] hover:text-red-400 hover:bg-red-400/10 transition-colors"
                    title="Supprimer cette section"
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                      <path d="M10 11v6"/><path d="M14 11v6"/>
                      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                    </svg>
                  </button>
                )}
              </div>
            </div>
          )}
        </>
      )}
      {/* AI prompt inline area */}
      {isAiPromptExpanded && onAiSubmit && onAiCancel ? (
        <div className="border-t border-[var(--border-subtle)] bg-[var(--bg-tertiary)] p-4 space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] block">
            Prompt IA (optionnel)
          </label>
          <textarea
            value={aiPromptValue}
            onChange={(e) => onAiPromptChange(e.target.value)}
            placeholder="Laisser vide = touche Yam"
            rows={2}
            className="w-full px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] resize-none focus:outline-none focus:border-[var(--accent-magenta)]/40"
            autoFocus
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onAiSubmit}
              disabled={isRewriting}
              className="px-3 py-1.5 rounded-lg bg-[var(--accent-magenta)] text-white text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
            >
              {isRewriting ? 'Génération…' : 'Générer'}
            </button>
            <button
              type="button"
              onClick={onAiCancel}
              disabled={isRewriting}
              className="px-3 py-1.5 rounded-lg border border-[var(--border-subtle)] text-xs text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] disabled:opacity-50"
            >
              Annuler
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

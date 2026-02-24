'use client';

import { useState, useCallback, useRef, useLayoutEffect, useEffect } from 'react';
import type { WebBriefData } from '@/types/web-brief';
import type { HomepageSection } from '@/types/web-brief';
import type { ZonedSection } from '@/types/section-zoning';
import { getLayoutForRoleWithFallback } from '@/lib/section-registry';
import { LayoutPlaceholder } from '@/components/layouts/LayoutPlaceholder';
import { LayoutNavbar } from '@/components/layouts/LayoutNavbar';
import { LayoutFooter } from '@/components/layouts/LayoutFooter';
import { SectionDrawer } from './SectionDrawer';
import { SectionDrawerMobile } from './SectionDrawerMobile';

/**
 * Vue layout de la structure du site (menu + homepage + pages).
 * Neutre (gris, typo système) — pas de branding.
 * Responsive.
 */
type PageTab = { label: string; slug: string; isHomepage: boolean };

// ── Clean preview section ───────────────────────────────────────────────────

function PreviewSection({
  section,
  sectionRef,
}: {
  section: HomepageSection;
  sectionRef: (el: HTMLDivElement | null) => void;
}) {
  const layoutResult = getLayoutForRoleWithFallback(section.role);
  const Layout = layoutResult.layout;
  const content = section.content || {};
  const sectionId = section.id ?? `${section.role}-${section.order}`;

  return (
    <div ref={sectionRef} data-section-id={sectionId}>
      {Layout ? (
        <Layout content={content as Record<string, unknown>} intent={section.intent} />
      ) : (
        <LayoutPlaceholder role={section.role} matchedRole={layoutResult.matched ?? undefined} />
      )}
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
  onGenerateLayout,
  onSectionRoleChange,
  onAddPage,
  onSetPageParent,
  onRenamePage,
  onCtaChange,
  editMode: controlledEditMode,
  onEditModeChange,
  immersiveMode = false,
  brandName,
  onSectionValidated,
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
  onGenerateLayout?: (role: string, sampleContent: Record<string, unknown>) => Promise<void>;
  onSectionRoleChange?: (pageSlug: string | null, sectionId: string, newRole: string) => void;
  onAddPage?: () => void;
  onSetPageParent?: (slug: string, parentSlug: string | null) => void;
  onRenamePage?: (slug: string, newName: string) => void;
  onCtaChange?: (label: string, visible: boolean) => void;
  editMode?: boolean;
  onEditModeChange?: (v: boolean) => void;
  immersiveMode?: boolean;
  brandName?: string;
  onSectionValidated?: () => void;
}) {
  const { architecture, homepage, pages } = data;
  const [activeTab, setActiveTab] = useState<string>('__homepage__');
  const [rewritingId, setRewritingId] = useState<string | null>(null);
  const [rewritingPageSlug, setRewritingPageSlug] = useState<string | null>(null);
  const [generatingSlug, setGeneratingSlug] = useState<string | null>(null);
  const [internalEditMode, setInternalEditMode] = useState(false);
  const [generatePrompt, setGeneratePrompt] = useState('');
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [scrollActiveSectionId, setScrollActiveSectionId] = useState<string | undefined>(undefined);
  const [previewTheme, setPreviewTheme] = useState<'dark' | 'light'>('dark');
  const scrollRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const editMode = controlledEditMode ?? internalEditMode;
  const setEditMode = onEditModeChange ?? setInternalEditMode;

  // Reset editing section when edit mode is turned off
  useEffect(() => {
    if (!editMode) {
      setEditingSectionId(null);
    }
  }, [editMode]);

  // Scroll to top on page change
  useLayoutEffect(() => {
    scrollRef.current?.scrollTo(0, 0);
  }, [activeTab]);

  // IntersectionObserver for scroll sync
  useEffect(() => {
    if (!editMode) return;

    const observer = new IntersectionObserver(
      (entries) => {
        let bestEntry: IntersectionObserverEntry | null = null;
        for (const entry of entries) {
          if (entry.isIntersecting) {
            if (!bestEntry || entry.intersectionRatio > bestEntry.intersectionRatio) {
              bestEntry = entry;
            }
          }
        }
        if (bestEntry) {
          const id = (bestEntry.target as HTMLElement).dataset.sectionId;
          if (id) setScrollActiveSectionId(id);
        }
      },
      {
        root: scrollRef.current,
        rootMargin: '-10% 0px -60% 0px',
        threshold: [0, 0.25, 0.5, 0.75, 1],
      }
    );

    sectionRefs.current.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [editMode, activeTab, data]);

  const primaryNav = architecture.navigation?.primary ?? [];
  const footerNav = architecture.navigation?.footer_only ?? [];
  const addedPages = architecture.navigation?.added_pages ?? [];

  const childTabs: PageTab[] = primaryNav.flatMap((item) =>
    (item.children ?? []).map((child) => ({ label: child.page, slug: child.slug, isHomepage: false }))
  );

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
      onDeletePage(slug);
    },
    [onDeletePage]
  );

  const handleAiRewrite = useCallback(
    async (sectionId: string, customPrompt?: string) => {
      const isHome = !pageSlugRef.current;

      if (isHome) {
        if (!onAiRewrite) return;
        setRewritingPageSlug(null);
        setRewritingId(sectionId);
        try {
          await onAiRewrite(sectionId, customPrompt);
        } finally {
          setRewritingId(null);
        }
      } else {
        if (!onPageAiRewrite) return;
        setRewritingPageSlug(pageSlugRef.current!);
        setRewritingId(sectionId);
        try {
          await onPageAiRewrite(pageSlugRef.current!, sectionId, customPrompt);
        } finally {
          setRewritingId(null);
          setRewritingPageSlug(null);
        }
      }
    },
    [onAiRewrite, onPageAiRewrite]
  );

  const handleGeneratePage = useCallback(
    async (slug: string, customPrompt?: string) => {
      if (!onGeneratePageZoning) return;
      setGeneratingSlug(slug);
      try {
        const added = addedPages.find((a) => a.slug === slug);
        const agentBrief = customPrompt?.trim() || added?.agent_brief || undefined;
        await onGeneratePageZoning(slug, agentBrief);
      } finally {
        setGeneratingSlug(null);
      }
    },
    [onGeneratePageZoning, addedPages]
  );

  const scrollToSection = useCallback((sectionId: string) => {
    const el = sectionRefs.current.get(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const sections = [...(homepage.sections ?? [])].sort((a, b) => a.order - b.order);

  const currentTab = pageTabs.find((t) => (t.isHomepage ? '__homepage__' : t.slug) === activeTab) ?? pageTabs[0];
  const isHomepage = currentTab.isHomepage;
  const pageSlug = currentTab.isHomepage ? undefined : currentTab.slug;
  const pageData = pageSlug ? pages?.[pageSlug] : null;
  const currentSections: (HomepageSection | ZonedSection)[] = isHomepage
    ? sections
    : [...(pageData?.sections ?? [])].sort((a, b) => a.order - b.order);

  // Stable ref for pageSlug (used in async callbacks)
  const pageSlugRef = useRef(pageSlug);
  pageSlugRef.current = pageSlug;

  const isRewritingSection = (sectionId: string) =>
    rewritingId === sectionId &&
    (isHomepage ? !rewritingPageSlug : rewritingPageSlug === pageSlug);

  const hasEditCapability = Boolean(
    onAiRewrite || onSectionContentChange ||
    onPageAiRewrite || onPageSectionContentChange
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

  // Section ref callback factory
  const makeSectionRef = useCallback((sectionId: string) => (el: HTMLDivElement | null) => {
    if (el) {
      sectionRefs.current.set(sectionId, el);
    } else {
      sectionRefs.current.delete(sectionId);
    }
  }, []);

  // Drawer callbacks adapted for current page context
  const handleDrawerContentChange = useCallback(
    (sectionId: string, patch: Record<string, unknown>) => {
      if (isHomepage) {
        onSectionContentChange?.(sectionId, patch);
      } else if (pageSlug) {
        onPageSectionContentChange?.(pageSlug, sectionId, patch);
      }
    },
    [isHomepage, pageSlug, onSectionContentChange, onPageSectionContentChange]
  );

  const handleDrawerRoleChange = useCallback(
    (sectionId: string, newRole: string) => {
      onSectionRoleChange?.(isHomepage ? null : (pageSlug ?? null), sectionId, newRole);
    },
    [isHomepage, pageSlug, onSectionRoleChange]
  );

  const handleDrawerReorder = useCallback(
    (reordered: (HomepageSection | ZonedSection)[]) => {
      onReorderSections?.(isHomepage ? null : (pageSlug ?? null), reordered);
    },
    [isHomepage, pageSlug, onReorderSections]
  );

  const handleDrawerDelete = useCallback(
    (sectionId: string) => {
      onDeleteSection?.(isHomepage ? null : (pageSlug ?? null), sectionId);
    },
    [isHomepage, pageSlug, onDeleteSection]
  );

  const handleDrawerAddSection = useCallback(
    () => {
      onAddSection?.(isHomepage ? null : (pageSlug ?? null));
    },
    [isHomepage, pageSlug, onAddSection]
  );

  // Current rewriting section id for the active page
  const currentRewritingId = currentSections.find((s) => {
    const sid = (s as HomepageSection).id ?? `${s.role}-${s.order}`;
    return isRewritingSection(sid);
  });
  const currentRewritingSectionId = currentRewritingId
    ? ((currentRewritingId as HomepageSection).id ?? `${currentRewritingId.role}-${currentRewritingId.order}`)
    : null;

  return (
    <div className={`${immersiveMode ? 'flex-1 min-h-0 flex flex-col' : 'space-y-3 sm:space-y-4'}`}>
      {/* Edit mode toggle — hidden in immersive mode */}
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

      {/* Main layout: navbar + content */}
      <div
        className={`flex flex-col overflow-hidden bg-[var(--bg-primary)] ${immersiveMode ? 'flex-1 min-h-0 rounded-none border-0' : 'rounded-xl border border-[var(--border-subtle)] min-h-[60vh] sm:min-h-[80vh]'}`}
        data-theme={previewTheme}
      >
        <LayoutNavbar
          navItems={navItemsWithChildren}
          onNavClick={setActiveTab}
          brandName={brandName}
          editMode={editMode}
          onDeletePage={onDeletePage ? handleDeletePageClick : undefined}
          onAddPage={onAddPage}
          onSetPageParent={onSetPageParent}
          onRenamePage={onRenamePage}
          ctaLabel={data.architecture.cta?.label ?? 'Action'}
          ctaVisible={data.architecture.cta?.visible ?? true}
          onCtaChange={onCtaChange}
        />

        {/* Flex row: drawer + preview */}
        <div className="flex flex-1 min-h-0">
          {/* Section Drawer — desktop only, edit mode */}
          {editMode && (
            <SectionDrawer
              sections={currentSections}
              activeSectionId={scrollActiveSectionId}
              onScrollToSection={scrollToSection}
              onAiRewrite={onAiRewrite || onPageAiRewrite ? (sectionId) => {
                // Just toggle the AI prompt in drawer — actual submit handled by onAiSubmit
              } : undefined}
              onEditSection={(sectionId) => setEditingSectionId(
                editingSectionId === sectionId ? null : sectionId
              )}
              onDeleteSection={onDeleteSection ? handleDrawerDelete : undefined}
              onAddSection={onAddSection ? handleDrawerAddSection : undefined}
              onReorderSections={onReorderSections ? handleDrawerReorder : undefined}
              onGenerateLayout={onGenerateLayout}
              editingSectionId={editingSectionId}
              onCloseEdit={() => setEditingSectionId(null)}
              onValidate={onSectionValidated}
              onContentChange={
                onSectionContentChange || onPageSectionContentChange
                  ? handleDrawerContentChange
                  : undefined
              }
              onRoleChange={onSectionRoleChange ? handleDrawerRoleChange : undefined}
              onAiSubmit={
                onAiRewrite || onPageAiRewrite
                  ? (sectionId, customPrompt) => handleAiRewrite(sectionId, customPrompt)
                  : undefined
              }
              rewritingSectionId={currentRewritingSectionId}
              previewTheme={previewTheme}
              onToggleTheme={() => setPreviewTheme(t => t === 'dark' ? 'light' : 'dark')}
            />
          )}

          {/* Preview scroll container */}
          <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain scroll-touch-ios" style={{ contain: 'layout paint' }}>
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
                {currentSections.map((section) => {
                  const sectionId = (section as HomepageSection).id ?? `${section.role}-${section.order}`;
                  return (
                    <PreviewSection
                      key={sectionId}
                      section={section as HomepageSection}
                      sectionRef={makeSectionRef(sectionId)}
                    />
                  );
                })}
                {/* Add section button — edit mode, mobile only (desktop uses drawer) */}
                {editMode && onAddSection && (
                  <div className="flex md:hidden justify-center py-4 border-t border-[var(--border-subtle)]">
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
              brandName={brandName}
            />
          </div>
        </div>

        {/* Bottom sheet — mobile only, edit mode */}
        {editMode && (
          <SectionDrawerMobile
            sections={currentSections}
            activeSectionId={scrollActiveSectionId}
            onScrollToSection={scrollToSection}
            onAiRewrite={onAiRewrite || onPageAiRewrite ? () => {} : undefined}
            onEditSection={onSectionContentChange || onPageSectionContentChange ? (sectionId) => setEditingSectionId(sectionId) : undefined}
            onDeleteSection={onDeleteSection ? handleDrawerDelete : undefined}
            onAddSection={onAddSection ? handleDrawerAddSection : undefined}
            onAiSubmit={
              onAiRewrite || onPageAiRewrite
                ? (sectionId, customPrompt) => handleAiRewrite(sectionId, customPrompt)
                : undefined
            }
            rewritingSectionId={currentRewritingSectionId}
          />
        )}
      </div>
    </div>
  );
}

'use client';

import { useState, useCallback, useRef, useLayoutEffect, useEffect } from 'react';
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

export function WebBriefView({
  data,
  onSectionRewrite,
  onSectionYam,
  onGeneratePageZoning,
  onPageSectionRewrite,
  onPageSectionYam,
  onSectionContentChange,
  onPageSectionContentChange,
  editMode: controlledEditMode,
  onEditModeChange,
  immersiveMode = false,
}: {
  data: WebBriefData;
  onSectionRewrite?: (sectionId: string, customPrompt: string) => Promise<void>;
  onSectionYam?: (sectionId: string) => Promise<void>;
  onGeneratePageZoning?: (slug: string, agentBrief?: string) => Promise<void>;
  onPageSectionRewrite?: (pageSlug: string, sectionId: string, customPrompt: string) => Promise<void>;
  onPageSectionYam?: (pageSlug: string, sectionId: string) => Promise<void>;
  onSectionContentChange?: (sectionId: string, patch: Record<string, unknown>) => void;
  onPageSectionContentChange?: (pageSlug: string, sectionId: string, patch: Record<string, unknown>) => void;
  /** En mode immersif, le parent contrôle l'édition via ces props */
  editMode?: boolean;
  onEditModeChange?: (v: boolean) => void;
  immersiveMode?: boolean;
}) {
  const { architecture, homepage, pages } = data;
  const [activeTab, setActiveTab] = useState<string>('__homepage__');
  const [rewritingId, setRewritingId] = useState<string | null>(null);
  const [rewritingPageSlug, setRewritingPageSlug] = useState<string | null>(null);
  const [promptForSectionId, setPromptForSectionId] = useState<string | null>(null);
  const [promptForPageSlug, setPromptForPageSlug] = useState<string | null>(null);
  const [promptValue, setPromptValue] = useState('');
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
  // Onglets = menu principal + added_pages uniquement (pas les pages footer type mentions légales)
  const pageTabs: PageTab[] = primaryNav.length > 0
    ? [
        ...primaryNav.map((item, i) => ({
          label: item.page,
          slug: item.slug,
          isHomepage: i === 0,
        })),
        ...addedPages.map((item) => ({
          label: item.page,
          slug: item.slug,
          isHomepage: false,
        })),
      ]
    : [
        { label: 'Homepage', slug: 'home', isHomepage: true },
        ...addedPages.map((item) => ({
          label: item.page,
          slug: item.slug,
          isHomepage: false,
        })),
      ];

  const handleRewriteClick = useCallback(
    (sectionId: string, pageSlug?: string) => {
      if (promptForPageSlug === (pageSlug ?? '__homepage__') && promptForSectionId === sectionId) {
        setPromptForSectionId(null);
        setPromptForPageSlug(null);
        setPromptValue('');
      } else {
        setPromptForSectionId(sectionId);
        setPromptForPageSlug(pageSlug ?? null);
        setPromptValue('');
      }
    },
    [promptForSectionId, promptForPageSlug]
  );

  const handleRewriteSubmit = useCallback(
    async (sectionId: string, pageSlug?: string) => {
      const isHome = !pageSlug || pageSlug === '__homepage__';
      if (isHome) {
        if (!onSectionRewrite || !promptValue.trim()) return;
        setRewritingPageSlug(null);
        setRewritingId(sectionId);
        try {
          await onSectionRewrite(sectionId, promptValue.trim());
          setPromptForSectionId(null);
          setPromptForPageSlug(null);
          setPromptValue('');
        } finally {
          setRewritingId(null);
        }
      } else {
        if (!onPageSectionRewrite || !promptValue.trim()) return;
        setRewritingPageSlug(pageSlug);
        setRewritingId(sectionId);
        try {
          await onPageSectionRewrite(pageSlug, sectionId, promptValue.trim());
          setPromptForSectionId(null);
          setPromptForPageSlug(null);
          setPromptValue('');
        } finally {
          setRewritingId(null);
          setRewritingPageSlug(null);
        }
      }
    },
    [onSectionRewrite, onPageSectionRewrite, promptValue]
  );

  const handleYamClick = useCallback(
    async (sectionId: string, pageSlug?: string) => {
      const isHome = !pageSlug || pageSlug === '__homepage__';
      if (isHome) {
        if (!onSectionYam) return;
        setRewritingId(sectionId);
        setRewritingPageSlug(null);
        try {
          await onSectionYam(sectionId);
        } finally {
          setRewritingId(null);
        }
      } else {
        if (!onPageSectionYam) return;
        setRewritingPageSlug(pageSlug!);
        setRewritingId(sectionId);
        try {
          await onPageSectionYam(pageSlug!, sectionId);
        } finally {
          setRewritingId(null);
          setRewritingPageSlug(null);
        }
      }
    },
    [onSectionYam, onPageSectionYam]
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
  const isPromptExpanded = (sectionId: string) =>
    promptForSectionId === sectionId && (promptForPageSlug ?? '__homepage__') === (pageSlug ?? '__homepage__');

  const hasEditCapability = Boolean(
    onSectionRewrite || onSectionYam || onSectionContentChange ||
    onPageSectionRewrite || onPageSectionYam || onPageSectionContentChange
  );

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
          navItems={[
            ...(primaryNav.length > 0
              ? primaryNav.map((item) => ({ page: item.page, slug: item.slug }))
              : [{ page: 'Homepage', slug: 'home' }]),
            ...addedPages.map((item) => ({ page: item.page, slug: item.slug })),
          ]}
          onNavClick={setActiveTab}
          generatedSlugs={Object.keys(pages ?? {})}
        />
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
                  isPromptExpanded={isPromptExpanded(sectionId)}
                  promptValue={isPromptExpanded(sectionId) ? promptValue : ''}
                  onPromptChange={setPromptValue}
                  onRewrite={
                    isHomepage
                      ? onSectionRewrite ? () => handleRewriteClick(sectionId) : undefined
                      : onPageSectionRewrite ? () => handleRewriteClick(sectionId, pageSlug) : undefined
                  }
                  onYam={
                    isHomepage
                      ? onSectionYam ? () => handleYamClick(sectionId) : undefined
                      : onPageSectionYam ? () => handleYamClick(sectionId, pageSlug) : undefined
                  }
                  onRewriteSubmit={
                    isHomepage ? () => handleRewriteSubmit(sectionId) : () => handleRewriteSubmit(sectionId, pageSlug)
                  }
                  onPromptCancel={() => {
                    setPromptForSectionId(null);
                    setPromptForPageSlug(null);
                    setPromptValue('');
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
          />
        </div>
      </div>
    </div>
  );
}

/** Section preview avec Layout + barre d'édition intégrée (Yam, Réécrire, Éditer) au survol. */
function PreviewSectionWithEdit({
  section,
  sectionId,
  editMode,
  pageSlug,
  isHomepage,
  isRewriting,
  isPromptExpanded,
  promptValue,
  onPromptChange,
  onRewrite,
  onYam,
  onRewriteSubmit,
  onPromptCancel,
  onContentChange,
}: {
  section: HomepageSection;
  sectionId: string;
  editMode: boolean;
  pageSlug?: string;
  isHomepage: boolean;
  isRewriting: boolean;
  isPromptExpanded: boolean;
  promptValue: string;
  onPromptChange: (v: string) => void;
  onRewrite?: () => void;
  onYam?: () => void;
  onRewriteSubmit?: () => void;
  onPromptCancel?: () => void;
  onContentChange?: (patch: Record<string, unknown>) => void;
}) {
  const [editingExpanded, setEditingExpanded] = useState(false);
  const layoutResult = getLayoutForRoleWithFallback(section.role);
  const Layout = layoutResult.layout;
  const content = section.content || {};

  const patch = (key: string, value: unknown) => {
    onContentChange?.({ [key]: value });
  };

  const hasActions = onYam || onRewrite || onContentChange;

  return (
    <div className={`relative group ${editMode && hasActions ? 'ring-1 ring-[var(--accent-cyan)]/30 ring-inset rounded-lg' : ''}`}>
      {/* Mode édition déplié : formulaire EN PLACE du layout (champs éditables visibles) */}
      {editingExpanded && onContentChange ? (
        <div className="bg-[var(--bg-secondary)] p-4 md:p-6 space-y-4 rounded-lg border border-[var(--border-subtle)]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Édition — {section.role}
            </span>
            <button
              type="button"
              onClick={() => setEditingExpanded(false)}
              className="px-2 py-1 rounded-lg text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
            >
              Fermer l'édition
            </button>
          </div>
          <SectionEditFormFields content={content} role={section.role} patch={patch} />
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
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent-cyan)] flex-shrink-0">{section.role}</span>
              {section.intent && (
                <>
                  <span className="text-[10px] text-[var(--border-medium)]">—</span>
                  <span className="text-[10px] text-[var(--text-muted)] line-clamp-1 flex-1 min-w-0">{section.intent}</span>
                </>
              )}
              <div className="flex items-center gap-1 ml-auto flex-shrink-0">
                {onYam && (
                  <button
                    type="button"
                    onClick={onYam}
                    disabled={isRewriting}
                    className="px-2 py-0.5 rounded-md text-[10px] font-semibold border border-[var(--accent-magenta)]/30 bg-[var(--accent-magenta)]/10 text-[var(--accent-magenta)] hover:bg-[var(--accent-magenta)]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isRewriting ? '…' : '◆ Yam'}
                  </button>
                )}
                {onRewrite && (
                  <button
                    type="button"
                    onClick={onRewrite}
                    disabled={isRewriting}
                    className="px-2 py-0.5 rounded-md text-[10px] font-semibold border border-[var(--accent-cyan)]/30 bg-[var(--accent-cyan)]/10 text-[var(--accent-cyan)] hover:bg-[var(--accent-cyan)]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isRewriting ? '…' : 'Réécrire'}
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
              </div>
            </div>
          )}
        </>
      )}
      {isPromptExpanded && onRewriteSubmit && onPromptCancel ? (
        <div className="border-t border-[var(--border-subtle)] bg-[var(--bg-tertiary)] p-4 space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] block">
            Prompt custom
          </label>
          <textarea
            value={promptValue}
            onChange={(e) => onPromptChange(e.target.value)}
            placeholder="Ex : plus punchy, ton B2B..."
            rows={2}
            className="w-full px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] resize-none focus:outline-none focus:border-[var(--accent-cyan)]/40"
            autoFocus
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onRewriteSubmit}
              disabled={isRewriting || !promptValue.trim()}
              className="px-3 py-1.5 rounded-lg bg-[var(--accent-cyan)] text-black text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
            >
              {isRewriting ? 'Génération…' : 'Générer'}
            </button>
            <button
              type="button"
              onClick={onPromptCancel}
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

/** Champs d'édition d'une section — utilisé dans PreviewSectionWithEdit. */
function SectionEditFormFields({
  content,
  role,
  patch,
}: {
  content: Record<string, unknown>;
  role: string;
  patch: (key: string, value: unknown) => void;
}) {
  const inputCls = 'w-full mt-1 px-3 py-2 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-cyan)]/50';
  return (
    <>
      <div>
        <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Titre</label>
        <StableField value={(content.title as string) ?? ''} onChange={(v) => patch('title', v)} className={inputCls} placeholder="Titre" />
      </div>
      <div>
        <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Sous-titre</label>
        <StableField value={(content.subtitle as string) ?? ''} onChange={(v) => patch('subtitle', v)} className={inputCls} placeholder="Sous-titre" />
      </div>
      <div>
        <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Texte</label>
        <StableField as="textarea" value={(content.text as string) ?? ''} onChange={(v) => patch('text', v)} rows={3} className={`${inputCls} resize-none`} placeholder="Paragraphe" />
      </div>
      {Array.isArray(content.items) && (role === 'faq' ? (
        <div className="space-y-3">
          <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">FAQ</label>
          {(content.items as { question?: string; answer?: string }[]).map((item, j) => {
            const items = [...(content.items as { question?: string; answer?: string }[])];
            return (
              <div key={j} className="space-y-1">
                <StableField value={item.question ?? ''} onChange={(v) => { items[j] = { ...item, question: v }; patch('items', items); }} className={inputCls} placeholder="Question" />
                <StableField as="textarea" value={item.answer ?? ''} onChange={(v) => { items[j] = { ...item, answer: v }; patch('items', items); }} rows={2} className={`${inputCls} resize-none`} placeholder="Réponse" />
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Items</label>
          {(content.items as { title?: string; text?: string }[]).map((item, j) => (
            <div key={j} className="flex gap-2">
              <StableField value={item.title ?? ''} onChange={(v) => { const items = [...(content.items as { title?: string; text?: string }[])]; items[j] = { ...item, title: v }; patch('items', items); }} className={`flex-1 ${inputCls}`} placeholder="Titre item" />
              <StableField value={item.text ?? ''} onChange={(v) => { const items = [...(content.items as { title?: string; text?: string }[])]; items[j] = { ...item, text: v }; patch('items', items); }} className={`flex-1 ${inputCls}`} placeholder="Texte item" />
            </div>
          ))}
        </div>
      ))}
      {(content.cta_primary || content.cta_secondary || !content.cta_primary) && (
        <div className="flex flex-wrap gap-3 pt-2">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">CTA principal</label>
            <StableField value={(content.cta_primary as { label?: string })?.label ?? ''} onChange={(v) => patch('cta_primary', { ...(content.cta_primary as object), label: v })} className={inputCls} placeholder="Label CTA" />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">CTA secondaire</label>
            <StableField value={(content.cta_secondary as { label?: string })?.label ?? ''} onChange={(v) => patch('cta_secondary', { ...(content.cta_secondary as object), label: v })} className={inputCls} placeholder="Label CTA secondaire" />
          </div>
        </div>
      )}
      {Array.isArray(content.quotes) && (
        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Citations</label>
          {(content.quotes as { text?: string; author_name?: string }[]).map((q, j) => (
            <div key={j} className="space-y-1">
              <StableField as="textarea" value={q.text ?? ''} onChange={(v) => { const quotes = [...(content.quotes as { text?: string; author_name?: string }[])]; quotes[j] = { ...q, text: v }; patch('quotes', quotes); }} rows={2} className={`${inputCls} resize-none`} placeholder="Citation" />
              <StableField value={q.author_name ?? ''} onChange={(v) => { const quotes = [...(content.quotes as { text?: string; author_name?: string }[])]; quotes[j] = { ...q, author_name: v }; patch('quotes', quotes); }} className={inputCls} placeholder="Auteur" />
            </div>
          ))}
        </div>
      )}
    </>
  );
}

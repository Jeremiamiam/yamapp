'use client';

import { useState, useEffect, useCallback, useReducer, useMemo } from 'react';
import { useAppStore } from '@/lib/store';
import { toast } from '@/lib/toast';
import { downloadDocumentAsMarkdown } from '@/lib/document-to-markdown';
import { extractStrategyContext } from '@/lib/extract-strategy-context';
import { ensureSectionIds } from '@/lib/section-id';
import { WebBriefView } from './WebBriefView';
import { AddPageModal } from './AddPageModal';
import { DocumentVersionPanel } from './DocumentVersionPanel';
import type { ClientDocument } from '@/types';
import type { WebBriefData, PageOutput, AddedPage, HomepageSection } from '@/types/web-brief';
import type { ZonedSection } from '@/types/section-zoning';
import { generateSectionId } from '@/lib/section-id';

const X = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const Download = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);

const YAM_PROMPT = `Applique la touche Yam — directeur de création, concepteur-rédacteur. Économie maximale, accroches punchy (4-7 mots). Micro-risque calculé : un mot inattendu, un registre décalé, une insolence légère — assez pour piquer, jamais assez pour brûler. Deux niveaux de lecture si possible. Pas de superlatif vide. Propose avec conviction. Garde la structure et l'intention de la section, rends le copy plus percutant.`;

/**
 * Parse le contenu JSON d'un web-brief et assigne des UUIDs stables à toutes les sections
 * (rétrocompat : les documents legacy sans id reçoivent un id au chargement).
 */
function parseAndMigrateWebBriefData(content: string): WebBriefData | null {
  try {
    const parsed = JSON.parse(content) as WebBriefData;
    if (!parsed?.version || parsed.version !== 1 || !parsed?.architecture || !parsed?.homepage) {
      return null;
    }
    const migratedData: WebBriefData = {
      ...parsed,
      homepage: {
        ...parsed.homepage,
        sections: ensureSectionIds(parsed.homepage.sections ?? []),
      },
      pages: Object.fromEntries(
        Object.entries(parsed.pages ?? {}).map(([slug, page]) => [
          slug,
          { ...page, sections: ensureSectionIds(page.sections ?? []) },
        ])
      ),
    };
    return migratedData;
  } catch {
    return null;
  }
}

export function WebBriefDocumentContent({
  selectedDocument,
  clientId,
  onClose,
  onEditDocument,
}: {
  selectedDocument: ClientDocument;
  clientId?: string;
  onClose: () => void;
  onEditDocument?: () => void;
}) {
  const updateDocument = useAppStore((s) => s.updateDocument);
  const getClientById = useAppStore((s) => s.getClientById);

  const [webBriefEditMode, setWebBriefEditMode] = useState(false);
  const [showAddPageModal, setShowAddPageModal] = useState(false);
  const [, forceRerender] = useReducer((x: number) => x + 1, 0);
  const [versionSaveTrigger, setVersionSaveTrigger] = useState(0);

  const clientName = clientId ? getClientById(clientId)?.name : undefined;

  const getStrategyContext = useCallback(() => {
    if (!clientId) return { reportContent: '', brandPlatform: undefined, copywriterText: '' };
    const client = getClientById(clientId);
    if (!client?.documents?.length) return { reportContent: '', brandPlatform: undefined, copywriterText: '' };
    return extractStrategyContext(client.documents);
  }, [clientId, getClientById]);

  useEffect(() => {
    setWebBriefEditMode(false);
  }, [selectedDocument.id]);

  // "E" keyboard shortcut to toggle edit mode
  useEffect(() => {
    if (!onEditDocument) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'e' && e.key !== 'E') return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      e.preventDefault();
      setWebBriefEditMode((v) => !v);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onEditDocument]);

  // Escape key cascade: edit mode off → then let DocumentModal close
  useEffect(() => {
    if (!webBriefEditMode) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      e.stopImmediatePropagation();
      setWebBriefEditMode(false);
    };
    document.addEventListener('keydown', handler, true); // capture phase
    return () => document.removeEventListener('keydown', handler, true);
  }, [webBriefEditMode]);

  // Memoïsé pour que les handlers useCallback se stabilisent sur la même référence
  const webBriefData = useMemo(
    () => parseAndMigrateWebBriefData(selectedDocument.content),
    [selectedDocument.content]
  );
  const arch = webBriefData?.architecture;

  /**
   * Merged AI rewrite handler for homepage sections.
   * - customPrompt undefined or empty → Yam creative direction
   * - customPrompt provided → custom rewrite
   * Always sends strategy context (brandPlatform, copywriterText, reportContent) to the API.
   */
  const handleAiRewrite = useCallback(
    async (sectionId: string, customPrompt?: string) => {
      if (!clientId || !webBriefData) return;
      try {
        const data = webBriefData;
        if (!data?.homepage?.sections?.length) {
          toast.error('Aucune section à modifier.');
          return;
        }
        const sections = [...data.homepage.sections].sort((a, b) => a.order - b.order);
        const section = sections.find((s) => s.id === sectionId);
        if (!section) {
          toast.error('Section introuvable.');
          return;
        }
        // Empty prompt → apply Yam creative direction
        const effectivePrompt = customPrompt?.trim() ? customPrompt.trim() : YAM_PROMPT;
        const ctx = getStrategyContext();
        const res = await fetch('/api/web-section-rewrite', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            section: { order: section.order, role: section.role, intent: section.intent, content: section.content },
            customPrompt: effectivePrompt,
            architecture: data.architecture,
            brandPlatform: ctx.brandPlatform,
            copywriterText: ctx.copywriterText,
            reportContent: ctx.reportContent,
          }),
        });
        const json = (await res.json()) as { content?: Record<string, unknown>; error?: string };
        if (!res.ok || json.error) {
          toast.error(json.error ?? 'Erreur lors de la réécriture.');
          return;
        }
        const newContent = json.content ?? section.content;
        const updatedSections = sections.map((s) =>
          s.id === sectionId ? { ...s, content: newContent } : s
        );
        const updatedData: WebBriefData = {
          ...data,
          homepage: { ...data.homepage, sections: updatedSections },
        };
        await updateDocument(clientId, selectedDocument.id, { content: JSON.stringify(updatedData) });
        toast.success('Section mise à jour');
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Erreur lors de la réécriture.');
      }
    },
    [clientId, selectedDocument.id, webBriefData, updateDocument, getStrategyContext]
  );

  const handleGeneratePageZoning = useCallback(
    async (pageSlug: string, agentBrief?: string) => {
      if (!clientId || !webBriefData) return;
      try {
        const data = webBriefData;
        const ctx = getStrategyContext();
        const res = await fetch('/api/page-zoning', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            siteArchitecture: data.architecture,
            pageSlug,
            reportContent: ctx.reportContent,
            brandPlatform: ctx.brandPlatform,
            copywriterText: ctx.copywriterText,
            agentBrief: agentBrief ?? undefined,
            homepage: data.homepage,
            existingPages: data.pages ? Object.values(data.pages) : undefined,
          }),
        });
        const json = (await res.json()) as {
          page?: string;
          slug?: string;
          target_visitor?: string;
          sections?: unknown[];
          error?: string;
        };
        if (!res.ok || json.error) {
          toast.error(json.error ?? 'Erreur lors de la génération.');
          return;
        }
        const pageOutput: PageOutput = {
          page: json.page ?? pageSlug,
          slug: json.slug ?? pageSlug,
          target_visitor: json.target_visitor,
          sections: ensureSectionIds((json.sections ?? []) as PageOutput['sections']),
        };
        const updatedData: WebBriefData = {
          ...data,
          pages: { ...(data.pages ?? {}), [pageSlug]: pageOutput },
        };
        await updateDocument(clientId, selectedDocument.id, { content: JSON.stringify(updatedData) });
        toast.success(`Zoning de "${pageOutput.page}" généré`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Erreur lors de la génération.');
      }
    },
    [clientId, selectedDocument.id, webBriefData, updateDocument, getStrategyContext]
  );

  const handleAddPage = useCallback(
    async (payload: AddedPage) => {
      if (!clientId || !webBriefData) return;
      try {
        const data = webBriefData;
        const nav = data.architecture.navigation ?? {};
        const added = nav.added_pages ?? [];
        const updatedData: WebBriefData = {
          ...data,
          architecture: {
            ...data.architecture,
            navigation: {
              ...nav,
              added_pages: [...added, payload],
            },
          },
        };
        await updateDocument(clientId, selectedDocument.id, { content: JSON.stringify(updatedData) });
        toast.success(`Page "${payload.page}" ajoutée — briefer l'agent sur la page pour générer le zoning`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Erreur lors de l\'ajout.');
      }
    },
    [clientId, selectedDocument.id, webBriefData, updateDocument]
  );

  /**
   * Merged AI rewrite handler for page sections.
   * Same logic as handleAiRewrite but for sub-pages.
   */
  const handlePageAiRewrite = useCallback(
    async (pageSlug: string, sectionId: string, customPrompt?: string) => {
      if (!clientId || !webBriefData) return;
      try {
        const data = webBriefData;
        const pageData = data.pages?.[pageSlug];
        if (!pageData?.sections?.length) {
          toast.error('Aucune section à modifier.');
          return;
        }
        const sections = [...pageData.sections].sort((a, b) => a.order - b.order);
        const section = sections.find((s) => s.id === sectionId);
        if (!section) {
          toast.error('Section introuvable.');
          return;
        }
        // Empty prompt → apply Yam creative direction
        const effectivePrompt = customPrompt?.trim() ? customPrompt.trim() : YAM_PROMPT;
        const ctx = getStrategyContext();
        const res = await fetch('/api/web-section-rewrite', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            section: { order: section.order, role: section.role, intent: section.intent, content: section.content },
            customPrompt: effectivePrompt,
            architecture: data.architecture,
            brandPlatform: ctx.brandPlatform,
            copywriterText: ctx.copywriterText,
            reportContent: ctx.reportContent,
          }),
        });
        const json = (await res.json()) as { content?: Record<string, unknown>; error?: string };
        if (!res.ok || json.error) {
          toast.error(json.error ?? 'Erreur lors de la réécriture.');
          return;
        }
        const newContent = json.content ?? section.content;
        const updatedSections = sections.map((s) =>
          s.id === sectionId ? { ...s, content: newContent } : s
        );
        const updatedData: WebBriefData = {
          ...data,
          pages: { ...(data.pages ?? {}), [pageSlug]: { ...pageData, sections: updatedSections } },
        };
        await updateDocument(clientId, selectedDocument.id, { content: JSON.stringify(updatedData) });
        toast.success('Section mise à jour');
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Erreur lors de la réécriture.');
      }
    },
    [clientId, selectedDocument.id, webBriefData, updateDocument, getStrategyContext]
  );

  const handleSectionContentChange = useCallback(
    (sectionId: string, patch: Record<string, unknown>) => {
      if (!clientId || !webBriefData) return;
      try {
        const data = webBriefData;
        const sections = [...(data.homepage.sections ?? [])].sort((a, b) => a.order - b.order);
        const section = sections.find((s) => s.id === sectionId);
        if (!section) return;
        const newContent = { ...section.content, ...patch };
        const updatedSections = sections.map((s) =>
          s.id === sectionId ? { ...s, content: newContent } : s
        );
        const updatedData: WebBriefData = {
          ...data,
          homepage: { ...data.homepage, sections: updatedSections },
        };
        updateDocument(clientId, selectedDocument.id, { content: JSON.stringify(updatedData) });
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Erreur lors de la mise à jour de la section.');
      }
    },
    [clientId, selectedDocument.id, webBriefData, updateDocument]
  );

  const handlePageSectionContentChange = useCallback(
    (pageSlug: string, sectionId: string, patch: Record<string, unknown>) => {
      if (!clientId || !webBriefData) return;
      try {
        const data = webBriefData;
        const pageData = data.pages?.[pageSlug];
        if (!pageData?.sections?.length) return;
        const sections = [...pageData.sections].sort((a, b) => a.order - b.order);
        const section = sections.find((s) => s.id === sectionId);
        if (!section) return;
        const newContent = { ...section.content, ...patch };
        const updatedSections = sections.map((s) =>
          s.id === sectionId ? { ...s, content: newContent } : s
        );
        const updatedData: WebBriefData = {
          ...data,
          pages: { ...(data.pages ?? {}), [pageSlug]: { ...pageData, sections: updatedSections } },
        };
        updateDocument(clientId, selectedDocument.id, { content: JSON.stringify(updatedData) });
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Erreur lors de la mise à jour de la section.');
      }
    },
    [clientId, selectedDocument.id, webBriefData, updateDocument]
  );

  /** Supprimer une page et nettoyer toutes les références dans la navigation. */
  const handleDeletePage = useCallback(
    (slug: string) => {
      if (!clientId || !webBriefData) return;
      try {
        const data = webBriefData;
        const nav = data.architecture.navigation ?? {};
        // Remove from primary nav (and from their children arrays)
        const updatedPrimary = (nav.primary ?? [])
          .filter((item) => item.slug !== slug)
          .map((item) => ({
            ...item,
            children: item.children?.filter((c) => c.slug !== slug),
          }));
        // Remove from added_pages
        const updatedAddedPages = (nav.added_pages ?? []).filter((item) => item.slug !== slug);
        // Remove from footer_only
        const updatedFooterOnly = (nav.footer_only ?? []).filter((item) => item.slug !== slug);
        // Remove from pages data
        const updatedPages = { ...(data.pages ?? {}) };
        delete updatedPages[slug];

        const updatedData: WebBriefData = {
          ...data,
          architecture: {
            ...data.architecture,
            navigation: {
              ...nav,
              primary: updatedPrimary,
              added_pages: updatedAddedPages,
              footer_only: updatedFooterOnly,
            },
          },
          pages: updatedPages,
        };
        updateDocument(clientId, selectedDocument.id, { content: JSON.stringify(updatedData) });
        toast.success('Page supprimée');
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Erreur lors de la suppression de la page.');
      }
    },
    [clientId, selectedDocument.id, webBriefData, updateDocument]
  );

  /** Réordonner les sections d'une page. */
  const handleReorderSections = useCallback(
    (pageSlug: string | null, reorderedSections: (HomepageSection | ZonedSection)[]) => {
      if (!clientId || !webBriefData) return;
      try {
        const data = webBriefData;
        if (pageSlug === null) {
          const updatedData: WebBriefData = {
            ...data,
            homepage: { ...data.homepage, sections: reorderedSections as HomepageSection[] },
          };
          updateDocument(clientId, selectedDocument.id, { content: JSON.stringify(updatedData) });
        } else {
          const pageData = data.pages?.[pageSlug];
          if (!pageData) return;
          const updatedData: WebBriefData = {
            ...data,
            pages: { ...(data.pages ?? {}), [pageSlug]: { ...pageData, sections: reorderedSections as ZonedSection[] } },
          };
          updateDocument(clientId, selectedDocument.id, { content: JSON.stringify(updatedData) });
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Erreur lors du réordonnancement des sections.');
      }
    },
    [clientId, selectedDocument.id, webBriefData, updateDocument]
  );

  /** Ajouter une nouvelle section par défaut à la fin d'une page. */
  const handleAddSection = useCallback(
    (pageSlug: string | null) => {
      if (!clientId || !webBriefData) return;
      try {
        const data = webBriefData;
        const newSection: HomepageSection = {
          id: generateSectionId(),
          role: 'hero',
          order: 1,
          intent: '',
          content: { title: 'Nouvelle section', text: '' },
        };

        if (pageSlug === null) {
          const existingSections = [...(data.homepage.sections ?? [])];
          const lastOrder = existingSections.length > 0 ? Math.max(...existingSections.map((s) => s.order)) : 0;
          newSection.order = lastOrder + 1;
          const updatedData: WebBriefData = {
            ...data,
            homepage: { ...data.homepage, sections: [...existingSections, newSection] },
          };
          updateDocument(clientId, selectedDocument.id, { content: JSON.stringify(updatedData) });
        } else {
          const pageData = data.pages?.[pageSlug];
          if (!pageData) return;
          const existingSections = [...(pageData.sections ?? [])];
          const lastOrder = existingSections.length > 0 ? Math.max(...existingSections.map((s) => s.order)) : 0;
          const newZonedSection = { ...newSection, order: lastOrder + 1 } as unknown as ZonedSection;
          const updatedData: WebBriefData = {
            ...data,
            pages: { ...(data.pages ?? {}), [pageSlug]: { ...pageData, sections: [...existingSections, newZonedSection] } },
          };
          updateDocument(clientId, selectedDocument.id, { content: JSON.stringify(updatedData) });
        }
        toast.success('Section ajoutée');
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Erreur lors de l\'ajout de la section.');
      }
    },
    [clientId, selectedDocument.id, webBriefData, updateDocument]
  );

  /** Générer un layout IA pour un rôle custom. */
  const handleGenerateLayout = useCallback(
    async (role: string, sampleContent: Record<string, unknown>) => {
      try {
        toast.info(`Génération du layout "${role}"…`);
        const res = await fetch('/api/generate-layout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role, sampleContent }),
        });
        const json = (await res.json()) as { success?: boolean; error?: string; alreadyExisted?: boolean };
        if (!res.ok || json.error) {
          toast.error(json.error ?? 'Erreur lors de la génération du layout.');
          return;
        }
        toast.success(json.alreadyExisted ? 'Layout déjà existant' : 'Layout généré !');
        // Force re-render after HMR picks up the new file (sans remount → garde l'onglet actif)
        setTimeout(() => forceRerender(), 1000);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Erreur lors de la génération du layout.');
      }
    },
    []
  );

  /** Changer le rôle (layout) d'une section. */
  const handleSectionRoleChange = useCallback(
    (pageSlug: string | null, sectionId: string, newRole: string) => {
      if (!clientId || !webBriefData) return;
      try {
        const data = webBriefData;

        if (pageSlug === null) {
          const sections = [...(data.homepage.sections ?? [])];
          const updatedSections = sections.map((s) =>
            s.id === sectionId ? { ...s, role: newRole } : s
          );
          const updatedData: WebBriefData = {
            ...data,
            homepage: { ...data.homepage, sections: updatedSections },
          };
          updateDocument(clientId, selectedDocument.id, { content: JSON.stringify(updatedData) });
        } else {
          const pageData = data.pages?.[pageSlug];
          if (!pageData) return;
          const sections = [...(pageData.sections ?? [])];
          const updatedSections = sections.map((s) =>
            s.id === sectionId ? { ...s, role: newRole } : s
          );
          const updatedData: WebBriefData = {
            ...data,
            pages: { ...(data.pages ?? {}), [pageSlug]: { ...pageData, sections: updatedSections } },
          };
          updateDocument(clientId, selectedDocument.id, { content: JSON.stringify(updatedData) });
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Erreur lors du changement de layout.');
      }
    },
    [clientId, selectedDocument.id, webBriefData, updateDocument]
  );

  /** Déplacer une page comme sous-page d'un parent (ou remonter au top-level). */
  const handleSetPageParent = useCallback(
    (slug: string, parentSlug: string | null) => {
      if (!clientId || !webBriefData) return;
      try {
        const data = webBriefData;
        const nav = data.architecture.navigation ?? {};

        // Find the page label by searching everywhere
        let pageLabel = slug;
        for (const item of (nav.primary ?? [])) {
          if (item.slug === slug) { pageLabel = item.page; break; }
          for (const child of (item.children ?? [])) {
            if (child.slug === slug) { pageLabel = child.page; break; }
          }
        }
        for (const item of (nav.added_pages ?? [])) {
          if (item.slug === slug) { pageLabel = item.page; break; }
        }

        // Remove the page from everywhere in the nav structure
        let updatedPrimary = (nav.primary ?? [])
          .filter((item) => item.slug !== slug)
          .map((item) => ({
            ...item,
            children: item.children?.filter((c) => c.slug !== slug),
          }));
        let updatedAddedPages = (nav.added_pages ?? []).filter((item) => item.slug !== slug);

        if (parentSlug === null) {
          // Promote to top-level (add to added_pages)
          updatedAddedPages = [...updatedAddedPages, { page: pageLabel, slug, agent_brief: '' }];
        } else {
          // Add as child of parentSlug
          updatedPrimary = updatedPrimary.map((item) => {
            if (item.slug === parentSlug) {
              return {
                ...item,
                children: [...(item.children ?? []), { page: pageLabel, slug, justification: '' }],
              };
            }
            return item;
          });
          // Also check added_pages items — they can't have children in the current data model,
          // so if the parent is an added_page, we need to move it to primary first
          const addedParentIdx = updatedAddedPages.findIndex(a => a.slug === parentSlug);
          if (addedParentIdx >= 0) {
            const addedParent = updatedAddedPages[addedParentIdx];
            updatedAddedPages = updatedAddedPages.filter((_, i) => i !== addedParentIdx);
            updatedPrimary = [
              ...updatedPrimary,
              {
                page: addedParent.page,
                slug: addedParent.slug,
                justification: '',
                children: [{ page: pageLabel, slug, justification: '' }],
              },
            ];
          }
        }

        const updatedData: WebBriefData = {
          ...data,
          architecture: {
            ...data.architecture,
            navigation: {
              ...nav,
              primary: updatedPrimary,
              added_pages: updatedAddedPages,
            },
          },
        };
        updateDocument(clientId, selectedDocument.id, { content: JSON.stringify(updatedData) });
        toast.success(parentSlug === null ? `"${pageLabel}" remonté au niveau principal` : `"${pageLabel}" ajouté comme sous-page`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Erreur lors du déplacement de la page.');
      }
    },
    [clientId, selectedDocument.id, webBriefData, updateDocument]
  );

  /** Renommer une page dans la navigation. */
  const handleRenamePage = useCallback(
    (slug: string, newName: string) => {
      if (!clientId || !webBriefData) return;
      try {
        const data = webBriefData;
        const nav = data.architecture.navigation ?? {};

        // Rename in primary nav (and in their children arrays)
        const updatedPrimary = (nav.primary ?? []).map((item) => ({
          ...item,
          page: item.slug === slug ? newName : item.page,
          children: item.children?.map((c) =>
            c.slug === slug ? { ...c, page: newName } : c
          ),
        }));
        // Rename in added_pages
        const updatedAddedPages = (nav.added_pages ?? []).map((item) =>
          item.slug === slug ? { ...item, page: newName } : item
        );
        // Rename in footer_only
        const updatedFooterOnly = (nav.footer_only ?? []).map((item) =>
          item.slug === slug ? { ...item, page: newName } : item
        );
        // Rename in pages data if exists
        const updatedPages = { ...(data.pages ?? {}) };
        if (updatedPages[slug]) {
          updatedPages[slug] = { ...updatedPages[slug], page: newName };
        }

        const updatedData: WebBriefData = {
          ...data,
          architecture: {
            ...data.architecture,
            navigation: {
              ...nav,
              primary: updatedPrimary,
              added_pages: updatedAddedPages,
              footer_only: updatedFooterOnly,
            },
          },
          pages: updatedPages,
        };
        updateDocument(clientId, selectedDocument.id, { content: JSON.stringify(updatedData) });
        toast.success(`Page renommée en "${newName}"`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Erreur lors du renommage.');
      }
    },
    [clientId, selectedDocument.id, webBriefData, updateDocument]
  );

  /** Modifier le CTA de la navbar. */
  const handleCtaChange = useCallback(
    (label: string, visible: boolean) => {
      if (!clientId || !webBriefData) return;
      try {
        const data = webBriefData;
        const updatedData: WebBriefData = {
          ...data,
          architecture: {
            ...data.architecture,
            cta: { label, visible },
          },
        };
        updateDocument(clientId, selectedDocument.id, { content: JSON.stringify(updatedData) });
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Erreur lors de la mise à jour du CTA.');
      }
    },
    [clientId, selectedDocument.id, webBriefData, updateDocument]
  );

  /** Supprimer une section et recalculer les ordres. */
  const handleDeleteSection = useCallback(
    (pageSlug: string | null, sectionId: string) => {
      if (!clientId || !webBriefData) return;
      try {
        const data = webBriefData;

        if (pageSlug === null) {
          const sections = [...(data.homepage.sections ?? [])];
          const filtered = sections.filter((s) => s.id !== sectionId);
          const reordered = filtered.map((s, i) => ({ ...s, order: i + 1 }));
          const updatedData: WebBriefData = {
            ...data,
            homepage: { ...data.homepage, sections: reordered },
          };
          updateDocument(clientId, selectedDocument.id, { content: JSON.stringify(updatedData) });
        } else {
          const pageData = data.pages?.[pageSlug];
          if (!pageData) return;
          const sections = [...(pageData.sections ?? [])];
          const filtered = sections.filter((s) => s.id !== sectionId);
          const reordered = filtered.map((s, i) => ({ ...s, order: i + 1 }));
          const updatedData: WebBriefData = {
            ...data,
            pages: { ...(data.pages ?? {}), [pageSlug]: { ...pageData, sections: reordered } },
          };
          updateDocument(clientId, selectedDocument.id, { content: JSON.stringify(updatedData) });
        }
        toast.success('Section supprimée');
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Erreur lors de la suppression de la section.');
      }
    },
    [clientId, selectedDocument.id, webBriefData, updateDocument]
  );

  const handleRestoreVersion = useCallback(
    async (content: string) => {
      if (!clientId) return;
      await updateDocument(clientId, selectedDocument.id, { content });
    },
    [clientId, selectedDocument.id, updateDocument]
  );

  return (
    <>
      {/* Header enrichi : titre + site_type + cible + actions */}
      <div className="flex-shrink-0 flex items-center gap-2 px-3 py-2 border-b border-[var(--border-subtle)]">
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <span className="text-sm font-semibold text-[var(--text-primary)] truncate">{selectedDocument.title}</span>
          {arch?.site_type && (
            <span className="hidden sm:inline-flex flex-shrink-0 text-[10px] px-1.5 py-0.5 rounded-md bg-[var(--accent-cyan)]/10 text-[var(--accent-cyan)] font-bold uppercase tracking-wider">
              {arch.site_type}
            </span>
          )}
          {arch?.target_visitor && (
            <span className="hidden md:block text-[10px] text-[var(--text-muted)] truncate">→ {arch.target_visitor}</span>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {clientId && (
            <DocumentVersionPanel
              docId={selectedDocument.id}
              currentContent={selectedDocument.content}
              onRestore={handleRestoreVersion}
              saveTrigger={versionSaveTrigger}
            />
          )}
          <button
            type="button"
            onClick={() => downloadDocumentAsMarkdown(selectedDocument)}
            className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
            title="Exporter en Markdown"
          >
            <Download />
          </button>
          {onEditDocument && (
            <button
              type="button"
              onClick={() => setWebBriefEditMode((v) => !v)}
              className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-colors ${
                webBriefEditMode
                  ? 'bg-[var(--accent-cyan)]/15 text-[var(--accent-cyan)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
              }`}
              title={webBriefEditMode ? "Désactiver l'édition (E)" : 'Modifier (E)'}
            >
              E
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
            aria-label="Fermer"
          >
            <X />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 flex flex-col">
        {webBriefData ? (
          <WebBriefView
            data={webBriefData}
            immersiveMode
            editMode={webBriefEditMode}
            onEditModeChange={setWebBriefEditMode}
            brandName={clientName}
            onAiRewrite={clientId ? handleAiRewrite : undefined}
            onGeneratePageZoning={clientId ? handleGeneratePageZoning : undefined}
            onPageAiRewrite={clientId ? handlePageAiRewrite : undefined}
            onSectionContentChange={clientId ? handleSectionContentChange : undefined}
            onPageSectionContentChange={clientId ? handlePageSectionContentChange : undefined}
            onDeletePage={clientId ? handleDeletePage : undefined}
            onDeleteSection={clientId ? handleDeleteSection : undefined}
            onAddSection={clientId ? handleAddSection : undefined}
            onReorderSections={clientId ? handleReorderSections : undefined}
            onSectionRoleChange={clientId ? handleSectionRoleChange : undefined}
            onAddPage={clientId ? () => setShowAddPageModal(true) : undefined}
            onSetPageParent={clientId ? handleSetPageParent : undefined}
            onRenamePage={clientId ? handleRenamePage : undefined}
            onCtaChange={clientId ? handleCtaChange : undefined}
            onGenerateLayout={handleGenerateLayout}
            onSectionValidated={clientId ? () => setVersionSaveTrigger((n) => n + 1) : undefined}
          />
        ) : (
          <p className="text-[var(--text-secondary)] text-sm p-4">Contenu invalide.</p>
        )}
      </div>

      {showAddPageModal && webBriefData && (
        <AddPageModal
          existingSlugs={[
            ...(webBriefData.architecture.navigation?.primary ?? []).map((i) => i.slug),
            ...(webBriefData.architecture.navigation?.footer_only ?? []).map((i) => i.slug),
            ...(webBriefData.architecture.navigation?.added_pages ?? []).map((i) => i.slug),
          ]}
          onConfirm={handleAddPage}
          onClose={() => setShowAddPageModal(false)}
        />
      )}
    </>
  );
}

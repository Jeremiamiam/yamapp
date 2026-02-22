'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '@/lib/store';
import { toast } from '@/lib/toast';
import { downloadDocumentAsMarkdown } from '@/lib/document-to-markdown';
import { extractStrategyContext } from '@/lib/extract-strategy-context';
import { WebBriefView } from './WebBriefView';
import { AddPageModal } from './AddPageModal';
import type { ClientDocument } from '@/types';
import type { WebBriefData, PageOutput, AddedPage } from '@/types/web-brief';

const X = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const Edit = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);
const Download = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);

const YAM_PROMPT = `Applique la touche Yam — directeur de création, concepteur-rédacteur. Économie maximale, accroches punchy (4-7 mots). Micro-risque calculé : un mot inattendu, un registre décalé, une insolence légère — assez pour piquer, jamais assez pour brûler. Deux niveaux de lecture si possible. Pas de superlatif vide. Propose avec conviction. Garde la structure et l'intention de la section, rends le copy plus percutant.`;

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

  const getStrategyContext = useCallback(() => {
    if (!clientId) return { reportContent: '', brandPlatform: undefined, copywriterText: '' };
    const client = getClientById(clientId);
    if (!client?.documents?.length) return { reportContent: '', brandPlatform: undefined, copywriterText: '' };
    return extractStrategyContext(client.documents);
  }, [clientId, getClientById]);

  useEffect(() => {
    setWebBriefEditMode(false);
  }, [selectedDocument.id]);

  let webBriefData: WebBriefData | null = null;
  try {
    const parsed = JSON.parse(selectedDocument.content) as WebBriefData;
    if (parsed?.version === 1 && parsed?.architecture && parsed?.homepage) {
      webBriefData = parsed;
    }
  } catch { /* contenu invalide */ }

  const arch = webBriefData?.architecture;

  const handleSectionRewrite = useCallback(
    async (sectionIndex: number, customPrompt: string) => {
      if (!clientId) return;
      try {
        const data = JSON.parse(selectedDocument.content) as WebBriefData;
        if (!data?.homepage?.sections?.length) {
          toast.error('Aucune section à modifier.');
          return;
        }
        const sections = [...data.homepage.sections].sort((a, b) => a.order - b.order);
        const section = sections[sectionIndex];
        if (!section) {
          toast.error('Section introuvable.');
          return;
        }
        const res = await fetch('/api/web-section-rewrite', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            section: { order: section.order, role: section.role, intent: section.intent, content: section.content },
            customPrompt,
            architecture: data.architecture,
          }),
        });
        const json = (await res.json()) as { content?: Record<string, unknown>; error?: string };
        if (!res.ok || json.error) {
          toast.error(json.error ?? 'Erreur lors de la réécriture.');
          return;
        }
        const newContent = json.content ?? section.content;
        const updatedSections = sections.map((s, i) =>
          i === sectionIndex ? { ...s, content: newContent } : s
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
    [clientId, selectedDocument.id, selectedDocument.content, updateDocument]
  );

  const handleSectionYam = useCallback(
    async (sectionIndex: number) => {
      await handleSectionRewrite(sectionIndex, YAM_PROMPT);
    },
    [handleSectionRewrite]
  );

  const handleGeneratePageZoning = useCallback(
    async (pageSlug: string, agentBrief?: string) => {
      if (!clientId) return;
      try {
        const data = JSON.parse(selectedDocument.content) as WebBriefData;
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
          sections: (json.sections ?? []) as PageOutput['sections'],
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
    [clientId, selectedDocument.id, selectedDocument.content, updateDocument, getStrategyContext]
  );

  const handleAddPage = useCallback(
    async (payload: AddedPage) => {
      if (!clientId) return;
      try {
        const data = JSON.parse(selectedDocument.content) as WebBriefData;
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

        const ctx = getStrategyContext();
        const res = await fetch('/api/page-zoning', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            siteArchitecture: { ...data.architecture, navigation: { ...nav, added_pages: [...added, payload] } },
            pageSlug: payload.slug,
            reportContent: ctx.reportContent,
            brandPlatform: ctx.brandPlatform,
            copywriterText: ctx.copywriterText,
            agentBrief: payload.agent_brief || undefined,
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
          page: json.page ?? payload.page,
          slug: json.slug ?? payload.slug,
          target_visitor: json.target_visitor,
          sections: (json.sections ?? []) as PageOutput['sections'],
        };
        const finalData: WebBriefData = {
          ...updatedData,
          pages: { ...(updatedData.pages ?? {}), [payload.slug]: pageOutput },
        };
        await updateDocument(clientId, selectedDocument.id, { content: JSON.stringify(finalData) });
        toast.success(`Page "${payload.page}" ajoutée et zoning généré`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Erreur lors de l\'ajout.');
      }
    },
    [clientId, selectedDocument.id, selectedDocument.content, updateDocument, getStrategyContext]
  );

  const handlePageSectionRewrite = useCallback(
    async (pageSlug: string, sectionIndex: number, customPrompt: string) => {
      if (!clientId) return;
      try {
        const data = JSON.parse(selectedDocument.content) as WebBriefData;
        const pageData = data.pages?.[pageSlug];
        if (!pageData?.sections?.length) {
          toast.error('Aucune section à modifier.');
          return;
        }
        const sections = [...pageData.sections].sort((a, b) => a.order - b.order);
        const section = sections[sectionIndex];
        if (!section) {
          toast.error('Section introuvable.');
          return;
        }
        const res = await fetch('/api/web-section-rewrite', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            section: { order: section.order, role: section.role, intent: section.intent, content: section.content },
            customPrompt,
            architecture: data.architecture,
          }),
        });
        const json = (await res.json()) as { content?: Record<string, unknown>; error?: string };
        if (!res.ok || json.error) {
          toast.error(json.error ?? 'Erreur lors de la réécriture.');
          return;
        }
        const newContent = json.content ?? section.content;
        const updatedSections = sections.map((s, i) =>
          i === sectionIndex ? { ...s, content: newContent } : s
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
    [clientId, selectedDocument.id, selectedDocument.content, updateDocument]
  );

  const handlePageSectionYam = useCallback(
    async (pageSlug: string, sectionIndex: number) => {
      await handlePageSectionRewrite(pageSlug, sectionIndex, YAM_PROMPT);
    },
    [handlePageSectionRewrite]
  );

  const handleSectionContentChange = useCallback(
    (sectionIndex: number, patch: Record<string, unknown>) => {
      if (!clientId) return;
      try {
        const data = JSON.parse(selectedDocument.content) as WebBriefData;
        const sections = [...(data.homepage.sections ?? [])].sort((a, b) => a.order - b.order);
        const section = sections[sectionIndex];
        if (!section) return;
        const newContent = { ...section.content, ...patch };
        const updatedSections = sections.map((s, i) =>
          i === sectionIndex ? { ...s, content: newContent } : s
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
    [clientId, selectedDocument.id, selectedDocument.content, updateDocument]
  );

  const handlePageSectionContentChange = useCallback(
    (pageSlug: string, sectionIndex: number, patch: Record<string, unknown>) => {
      if (!clientId) return;
      try {
        const data = JSON.parse(selectedDocument.content) as WebBriefData;
        const pageData = data.pages?.[pageSlug];
        if (!pageData?.sections?.length) return;
        const sections = [...pageData.sections].sort((a, b) => a.order - b.order);
        const section = sections[sectionIndex];
        if (!section) return;
        const newContent = { ...section.content, ...patch };
        const updatedSections = sections.map((s, i) =>
          i === sectionIndex ? { ...s, content: newContent } : s
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
    [clientId, selectedDocument.id, selectedDocument.content, updateDocument]
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
            <button
              type="button"
              onClick={() => setShowAddPageModal(true)}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium border border-[var(--accent-cyan)]/40 bg-[var(--accent-cyan)]/10 text-[var(--accent-cyan)] hover:bg-[var(--accent-cyan)]/20 transition-colors"
              title="Ajouter une page non prévue"
            >
              + Page
            </button>
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
              className={`p-2 rounded-lg transition-colors ${
                webBriefEditMode
                  ? 'bg-[var(--accent-cyan)]/15 text-[var(--accent-cyan)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
              }`}
              title={webBriefEditMode ? "Désactiver l'édition" : 'Modifier'}
            >
              <Edit />
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
            onSectionRewrite={clientId ? handleSectionRewrite : undefined}
            onSectionYam={clientId ? handleSectionYam : undefined}
            onGeneratePageZoning={clientId ? handleGeneratePageZoning : undefined}
            onPageSectionRewrite={clientId ? handlePageSectionRewrite : undefined}
            onPageSectionYam={clientId ? handlePageSectionYam : undefined}
            onSectionContentChange={clientId ? handleSectionContentChange : undefined}
            onPageSectionContentChange={clientId ? handlePageSectionContentChange : undefined}
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

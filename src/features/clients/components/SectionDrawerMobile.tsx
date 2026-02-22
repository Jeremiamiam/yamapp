'use client';

import { useState, useRef, useCallback } from 'react';
import type { HomepageSection } from '@/types/web-brief';
import type { ZonedSection } from '@/types/section-zoning';
import { getLayoutForRoleWithFallback } from '@/lib/section-registry';

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

// ── Types ────────────────────────────────────────────────────────────────────

type SheetState = 'collapsed' | 'half' | 'expanded';

interface SectionDrawerMobileProps {
  sections: (HomepageSection | ZonedSection)[];
  activeSectionId?: string;
  onScrollToSection: (sectionId: string) => void;
  onAiRewrite?: (sectionId: string) => void;
  onEditSection?: (sectionId: string) => void;
  onDeleteSection?: (sectionId: string) => void;
  onAddSection?: () => void;
  onAiSubmit?: (sectionId: string, customPrompt?: string) => void;
  rewritingSectionId?: string | null;
}

// ── SectionDrawerMobile ──────────────────────────────────────────────────────

export function SectionDrawerMobile({
  sections,
  activeSectionId,
  onScrollToSection,
  onAiRewrite,
  onEditSection,
  onDeleteSection,
  onAddSection,
  onAiSubmit,
  rewritingSectionId,
}: SectionDrawerMobileProps) {
  const [sheetState, setSheetState] = useState<SheetState>('collapsed');
  const [aiPromptSectionId, setAiPromptSectionId] = useState<string | null>(null);
  const [aiPromptValue, setAiPromptValue] = useState('');
  const touchStartY = useRef(0);
  const touchCurrentY = useRef(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    touchCurrentY.current = e.touches[0].clientY;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    touchCurrentY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback(() => {
    const diff = touchStartY.current - touchCurrentY.current;
    const threshold = 50;

    if (diff > threshold) {
      // Swipe up
      setSheetState((prev) => {
        if (prev === 'collapsed') return 'half';
        if (prev === 'half') return 'expanded';
        return prev;
      });
    } else if (diff < -threshold) {
      // Swipe down
      setSheetState((prev) => {
        if (prev === 'expanded') return 'half';
        if (prev === 'half') return 'collapsed';
        return prev;
      });
    }
  }, []);

  const handleAiPromptSubmit = useCallback(
    (sectionId: string) => {
      if (!onAiSubmit) return;
      onAiSubmit(sectionId, aiPromptValue.trim() || undefined);
      setAiPromptSectionId(null);
      setAiPromptValue('');
    },
    [onAiSubmit, aiPromptValue]
  );

  const sheetHeightClass = {
    collapsed: 'h-[48px]',
    half: 'h-[40vh]',
    expanded: 'h-[calc(100vh-64px)]',
  }[sheetState];

  return (
    <>
      {/* Backdrop */}
      {sheetState === 'expanded' && (
        <div
          className="md:hidden fixed inset-0 bg-black/40 z-40 animate-fade-in"
          onClick={() => setSheetState('half')}
        />
      )}

      {/* Bottom sheet */}
      <div
        className={`md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[var(--bg-secondary)] rounded-t-2xl border-t border-[var(--border-subtle)] transition-[height] duration-300 ease-out ${sheetHeightClass} animate-sheet-slide-up`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Handle */}
        <div
          className="flex items-center justify-center py-2 cursor-grab"
          onClick={() => setSheetState((prev) => prev === 'collapsed' ? 'half' : 'collapsed')}
        >
          <div className="w-8 h-1 rounded-full bg-[var(--text-muted)]/30" />
        </div>

        {/* Collapsed label */}
        {sheetState === 'collapsed' && (
          <div className="flex items-center justify-between px-4">
            <span className="text-xs font-medium text-[var(--text-secondary)]">
              {sections.length} section{sections.length > 1 ? 's' : ''}
            </span>
            <button
              type="button"
              onClick={() => setSheetState('half')}
              className="text-[10px] text-[var(--accent-cyan)] font-medium"
            >
              Voir
            </button>
          </div>
        )}

        {/* Section list */}
        {sheetState !== 'collapsed' && (
          <div className="flex-1 min-h-0 overflow-y-auto px-2 pb-4" style={{ height: 'calc(100% - 36px)' }}>
            {sections.map((section) => {
              const sectionId = (section as HomepageSection).id ?? `${section.role}-${section.order}`;
              const content = (section.content || {}) as Record<string, unknown>;
              const title = extractSectionTitle(content, section.role);
              const layoutResult = getLayoutForRoleWithFallback(section.role);
              const hasLayout = !!layoutResult.layout;
              const isRewriting = rewritingSectionId === sectionId;

              return (
                <div key={sectionId}>
                  <div
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                      activeSectionId === sectionId
                        ? 'bg-[var(--accent-cyan)]/10'
                        : 'active:bg-[var(--bg-tertiary)]'
                    }`}
                    onClick={() => {
                      onScrollToSection(sectionId);
                      setSheetState('collapsed');
                    }}
                  >
                    {!hasLayout && (
                      <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-[var(--accent-amber)]" />
                    )}
                    <span className="flex-1 min-w-0 text-xs text-[var(--text-secondary)] truncate">
                      {title}
                    </span>
                    {isRewriting && (
                      <span className="flex-shrink-0 w-3 h-3 border-2 border-[var(--accent-magenta)]/30 border-t-[var(--accent-magenta)] rounded-full animate-spin" />
                    )}
                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {onAiRewrite && !isRewriting && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (aiPromptSectionId === sectionId) {
                              setAiPromptSectionId(null);
                              setAiPromptValue('');
                            } else {
                              setAiPromptSectionId(sectionId);
                              setAiPromptValue('');
                            }
                          }}
                          className="px-1.5 py-0.5 rounded text-[9px] font-bold text-[var(--accent-magenta)] hover:bg-[var(--accent-magenta)]/10 transition-colors"
                        >
                          IA
                        </button>
                      )}
                      {onEditSection && (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); onEditSection(sectionId); }}
                          className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                        >
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                      )}
                      {onDeleteSection && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!window.confirm('Supprimer cette section ?')) return;
                            onDeleteSection(sectionId);
                          }}
                          className="p-1 rounded text-[var(--text-muted)] hover:text-red-400 transition-colors"
                        >
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                            <path d="M10 11v6" /><path d="M14 11v6" />
                            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* AI prompt inline */}
                  {aiPromptSectionId === sectionId && (
                    <div className="mx-3 mt-1 mb-2 p-2 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] space-y-1.5">
                      <textarea
                        value={aiPromptValue}
                        onChange={(e) => setAiPromptValue(e.target.value)}
                        placeholder="Prompt optionnel — vide = touche Yam"
                        rows={2}
                        className="w-full px-2 py-1.5 rounded-md bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] resize-none focus:outline-none focus:border-[var(--accent-magenta)]/40"
                        autoFocus
                      />
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleAiPromptSubmit(sectionId)}
                          disabled={isRewriting}
                          className="px-2.5 py-1 rounded-md bg-[var(--accent-magenta)] text-white text-[10px] font-semibold disabled:opacity-50 hover:opacity-90 transition-opacity"
                        >
                          Générer
                        </button>
                        <button
                          type="button"
                          onClick={() => { setAiPromptSectionId(null); setAiPromptValue(''); }}
                          className="px-2.5 py-1 rounded-md border border-[var(--border-subtle)] text-[10px] text-[var(--text-muted)] transition-colors"
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Add section */}
            {onAddSection && (
              <div className="mt-2 px-2">
                <button
                  type="button"
                  onClick={onAddSection}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-dashed border-[var(--border-medium)] text-[var(--text-muted)] text-xs"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Ajouter une section
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

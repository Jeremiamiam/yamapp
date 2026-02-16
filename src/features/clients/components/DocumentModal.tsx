'use client';

import { useEffect, useCallback, useMemo } from 'react';
import { useAppStore } from '@/lib/store';
import { formatDocDate } from '@/lib/date-utils';
import { getDocumentTypeStyle } from '@/lib/styles';
import { DocumentType } from '@/types';
import type { ClientDocument } from '@/types';
import { parseStructuredDocument } from '@/types/document-templates';
import type { BriefTemplate, ReportPlaudTemplate } from '@/types/document-templates';

// Icons
const X = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const Mic = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
    <line x1="12" y1="19" x2="12" y2="23"/>
    <line x1="8" y1="23" x2="16" y2="23"/>
  </svg>
);

const Briefcase = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
  </svg>
);

const StickyNote = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15.5 3H5a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2V8.5L15.5 3Z"/>
    <path d="M15 3v6h6"/>
  </svg>
);

const Edit = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

function BriefTemplatedView({ data }: { data: BriefTemplate }) {
  return (
    <div className="space-y-5 text-[var(--text-secondary)]">
      {data.clientContext && (
        <section>
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--accent-cyan)] mb-2">Contexte client</h3>
          <p className="text-sm leading-relaxed">{data.clientContext}</p>
        </section>
      )}
      <section>
        <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--accent-cyan)] mb-2">Objectifs</h3>
        <ul className="list-disc list-inside space-y-1 text-sm">{data.objectives.map((o, i) => <li key={i}>{o}</li>)}</ul>
      </section>
      {data.targetAudience && (
        <section>
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--accent-cyan)] mb-2">Cible</h3>
          <p className="text-sm">{data.targetAudience}</p>
        </section>
      )}
      <section>
        <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--accent-cyan)] mb-2">Produits</h3>
        <ul className="list-disc list-inside space-y-1 text-sm">{data.deliverables.map((d, i) => <li key={i}>{d}</li>)}</ul>
      </section>
      {data.constraints && (
        <section>
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--accent-cyan)] mb-2">Contraintes</h3>
          <p className="text-sm">{data.constraints}</p>
        </section>
      )}
      {(data.deadline || data.tone || data.references || data.notes) && (
        <div className="flex flex-wrap gap-3 text-xs text-[var(--text-muted)] pt-2 border-t border-[var(--border-subtle)]">
          {data.deadline && <span>Échéance : {data.deadline}</span>}
          {data.tone && <span>Ton : {data.tone}</span>}
          {data.references && <span>Références : {data.references}</span>}
          {data.notes && <span>{data.notes}</span>}
        </div>
      )}
    </div>
  );
}

function ReportPlaudTemplatedView({ data }: { data: ReportPlaudTemplate }) {
  return (
    <div className="space-y-5 text-[var(--text-secondary)]">
      <div className="flex flex-wrap gap-3 text-xs text-[var(--text-muted)]">
        <span>{data.date}</span>
        {data.duration != null && <span>{data.duration} min</span>}
        {data.participants?.length ? <span>{data.participants.join(', ')}</span> : null}
      </div>
      <section>
        <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--accent-amber)] mb-2">Résumé</h3>
        <p className="text-sm leading-relaxed">{data.summary}</p>
      </section>
      <section>
        <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--accent-amber)] mb-2">Points clés</h3>
        <ul className="list-disc list-inside space-y-1 text-sm">{data.keyPoints.map((p, i) => <li key={i}>{p}</li>)}</ul>
      </section>
      <section>
        <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--accent-amber)] mb-2">Actions</h3>
        <ul className="space-y-2 text-sm">
          {data.actionItems.map((a, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-[var(--accent-lime)]">•</span>
              <span>{a.text}</span>
              {a.assignee && <span className="text-[var(--text-muted)]">→ {a.assignee}</span>}
            </li>
          ))}
        </ul>
      </section>
      {data.nextSteps && (
        <section>
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--accent-amber)] mb-2">Prochaines étapes</h3>
          <p className="text-sm">{data.nextSteps}</p>
        </section>
      )}
    </div>
  );
}

function getDocTypeStyle(type: DocumentType) {
  const base = getDocumentTypeStyle(type);
  const icon = type === 'brief' ? <Briefcase /> : type === 'report' ? <Mic /> : <StickyNote />;
  return { ...base, icon };
}

function DocumentModalContent({
  document: selectedDocument,
  structured,
  onClose,
}: {
  document: ClientDocument;
  structured: BriefTemplate | ReportPlaudTemplate | null;
  onClose: () => void;
}) {
  const docStyle = getDocTypeStyle(selectedDocument.type);
  const showTemplated = structured !== null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in-up" />
      <div
        className="relative w-full max-w-2xl max-h-[85vh] bg-[var(--bg-card)] rounded-2xl border border-[var(--border-subtle)] shadow-2xl overflow-hidden animate-fade-in-up flex flex-col"
        onClick={e => e.stopPropagation()}
        style={{ animationDuration: '0.2s' }}
      >
        <div className="flex-shrink-0 px-6 py-5 border-b border-[var(--border-subtle)] flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 min-w-0">
            <span className={`p-2.5 rounded-xl ${docStyle.bg} ${docStyle.text} flex-shrink-0`}>
              {docStyle.icon}
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[10px] font-bold uppercase tracking-wider ${docStyle.text}`}>
                  {docStyle.label}
                </span>
                <span className="text-[10px] text-[var(--text-muted)]">•</span>
                <span className="text-[10px] text-[var(--text-muted)]">
                  {formatDocDate(selectedDocument.createdAt)}
                </span>
              </div>
              <h2 className="text-xl font-bold text-[var(--text-primary)] truncate">
                {selectedDocument.title}
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              title="Modifier"
            >
              <Edit />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              <X />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {showTemplated && selectedDocument.type === 'brief' && (
            <BriefTemplatedView data={structured as BriefTemplate} />
          )}
          {showTemplated && selectedDocument.type === 'report' && (
            <ReportPlaudTemplatedView data={structured as ReportPlaudTemplate} />
          )}
          {!showTemplated && (
            <div className="prose prose-invert max-w-none">
              <p className="text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap text-[15px]">
                {selectedDocument.content}
              </p>
            </div>
          )}
        </div>
        <div className="flex-shrink-0 px-6 py-4 border-t border-[var(--border-subtle)] flex items-center justify-between">
          <span className="text-xs text-[var(--text-muted)]">
            Dernière modification : {formatDocDate(selectedDocument.updatedAt)}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-[var(--bg-tertiary)] text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

export function DocumentModal() {
  const { selectedDocument, closeDocument } = useAppStore();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeDocument();
    },
    [closeDocument]
  );

  useEffect(() => {
    if (selectedDocument) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [selectedDocument, handleKeyDown]);

  const structured = useMemo(() => {
    if (!selectedDocument || (selectedDocument.type !== 'brief' && selectedDocument.type !== 'report')) return null;
    return parseStructuredDocument(selectedDocument.content, selectedDocument.type);
  }, [selectedDocument?.content, selectedDocument?.type]);

  return selectedDocument ? (
    <DocumentModalContent document={selectedDocument} structured={structured} onClose={closeDocument} />
  ) : null;
}

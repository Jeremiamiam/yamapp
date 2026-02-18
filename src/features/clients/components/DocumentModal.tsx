'use client';

import { useEffect, useCallback, useMemo, useState } from 'react';
import { useAppStore } from '@/lib/store';
import { formatDocDate } from '@/lib/date-utils';
import { getDocumentTypeStyle } from '@/lib/styles';
import { DocumentType } from '@/types';
import type { Call, ClientDocument, Deliverable } from '@/types';
import { parseStructuredDocument } from '@/types/document-templates';
import type { BriefTemplate, ReportPlaudTemplate } from '@/types/document-templates';
import { toast } from '@/lib/toast';
import { PlaudLogo } from '@/components/ui';
import { ReportView } from './ReportView';

// Icons
const X = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
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

const Trash = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
    <line x1="10" y1="11" x2="10" y2="17"/>
    <line x1="14" y1="11" x2="14" y2="17"/>
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
          {data.deadline && <span>Echeance : {data.deadline}</span>}
          {data.tone && <span>Ton : {data.tone}</span>}
          {data.references && <span>References : {data.references}</span>}
          {data.notes && <span>{data.notes}</span>}
        </div>
      )}
    </div>
  );
}

function getDocTypeStyle(type: DocumentType) {
  const base = getDocumentTypeStyle(type);
  const icon = type === 'brief' ? <Briefcase /> : type === 'report' ? <PlaudLogo className="w-4 h-4" /> : <StickyNote />;
  return { ...base, icon };
}

function DocumentModalContent({
  document: selectedDocument,
  structured,
  onClose,
  clientId,
  onAddDeliverable,
  onSuggestContact,
  onAddCall,
  onEditDocument,
  onDeleteDocument,
}: {
  document: ClientDocument;
  structured: BriefTemplate | ReportPlaudTemplate | null;
  onClose: () => void;
  clientId?: string;
  onAddDeliverable?: (d: Omit<Deliverable, 'id' | 'createdAt'>) => void;
  onSuggestContact?: (name: string) => void;
  onAddCall?: (call: Omit<Call, 'id' | 'createdAt'>) => void;
  onEditDocument?: () => void;
  onDeleteDocument?: () => void;
}) {
  const updateDocument = useAppStore((s) => s.updateDocument);
  const docStyle = getDocTypeStyle(selectedDocument.type);
  const showTemplated = structured !== null;
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const reportData = structured && selectedDocument.type === 'report' ? (structured as ReportPlaudTemplate) : null;
  const onEventAdded = useCallback(
    (eventKey: string) => {
      if (!reportData || !clientId) return;
      const next = { ...reportData, addedEventKeys: [...(reportData.addedEventKeys || []), eventKey] };
      updateDocument(clientId, selectedDocument.id, { content: JSON.stringify(next) });
    },
    [reportData, clientId, selectedDocument.id, updateDocument]
  );
  const onBackfillAddedEventKeys = useCallback(
    (keys: string[]) => {
      if (!reportData || !clientId || keys.length === 0) return;
      const next = { ...reportData, addedEventKeys: [...(reportData.addedEventKeys || []), ...keys] };
      updateDocument(clientId, selectedDocument.id, { content: JSON.stringify(next) });
    },
    [reportData, clientId, selectedDocument.id, updateDocument]
  );

  const handleDeleteClick = () => setShowDeleteConfirm(true);
  const handleDeleteCancel = () => setShowDeleteConfirm(false);
  const handleDeleteConfirm = () => {
    onDeleteDocument?.();
    setShowDeleteConfirm(false);
    toast.success('Document supprime');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/70" />
      <div
        className={`relative w-full max-h-[85vh] bg-[var(--bg-card)] rounded-2xl border border-[var(--border-subtle)] shadow-2xl overflow-hidden animate-fade-in-up flex flex-col ${selectedDocument.type === 'report' ? 'max-w-4xl' : 'max-w-2xl'}`}
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
                <span className="text-[10px] text-[var(--text-muted)]">-</span>
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
            {onEditDocument && (
              <button
                type="button"
                onClick={onEditDocument}
                className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                title="Modifier"
              >
                <Edit />
              </button>
            )}
            {onDeleteDocument && (
              <button
                type="button"
                onClick={handleDeleteClick}
                className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-red-400 transition-colors"
                title="Supprimer"
              >
                <Trash />
              </button>
            )}
            <button
              type="button"
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
            <ReportView
              data={structured as ReportPlaudTemplate}
              clientId={clientId}
              onAddDeliverable={onAddDeliverable}
              onSuggestContact={onSuggestContact}
              onAddCall={onAddCall}
              onEventAdded={onEventAdded}
              onBackfillAddedEventKeys={onBackfillAddedEventKeys}
            />
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
            Derniere modification : {formatDocDate(selectedDocument.updatedAt)}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-[var(--bg-tertiary)] text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>

      {showDeleteConfirm && (
        <div
          className="absolute inset-0 z-10 flex items-center justify-center p-4 bg-black/50"
          onClick={handleDeleteCancel}
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-delete-title"
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6 shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <p id="confirm-delete-title" className="text-[var(--text-primary)] font-medium mb-4">
              Supprimer ce document ?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={handleDeleteCancel}
                className="px-4 py-2 rounded-lg bg-[var(--bg-tertiary)] text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function DocumentModal() {
  const openModal = useAppStore((s) => s.openModal);
  const { selectedDocument, closeDocument, selectedClientId, addDeliverable, addCall, deleteDocument } = useAppStore();

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

  const onEditDocument = useCallback(() => {
    if (!selectedDocument || !selectedClientId) return;
    closeDocument();
    openModal({
      type: 'document',
      mode: 'edit',
      clientId: selectedClientId,
      document: selectedDocument,
    });
  }, [selectedDocument, selectedClientId, closeDocument, openModal]);

  const onDeleteDocument = useCallback(() => {
    if (!selectedDocument || !selectedClientId) return;
    deleteDocument(selectedClientId, selectedDocument.id);
    closeDocument();
  }, [selectedDocument, selectedClientId, deleteDocument, closeDocument]);

  const handleSuggestContact = useCallback(
    (name: string) => {
      if (!selectedClientId) return;
      closeDocument();
      openModal({
        type: 'contact',
        mode: 'create',
        clientId: selectedClientId,
        presetContact: { name, role: 'Intervenant' },
      });
    },
    [selectedClientId, closeDocument, openModal]
  );
  const handleAddContact = handleSuggestContact;

  const handleAddCall = useCallback(
    (call: Omit<Call, 'id' | 'createdAt'>) => {
      addCall(call);
    },
    [addCall]
  );

  return selectedDocument ? (
    <DocumentModalContent
      document={selectedDocument}
      structured={structured}
      onClose={closeDocument}
      clientId={selectedClientId ?? undefined}
      onAddDeliverable={addDeliverable}
      onSuggestContact={handleAddContact}
      onAddCall={handleAddCall}
      onEditDocument={onEditDocument}
      onDeleteDocument={onDeleteDocument}
    />
  ) : null;
}

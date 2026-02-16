'use client';

import { useAppStore } from '@/lib/store';
import { useClient, useModal } from '@/hooks';
import { formatDocDate } from '@/lib/date-utils';
import { getDocumentTypeStyle } from '@/lib/styles';
import { DocumentType } from '@/types';

const FileText = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
    <polyline points="10 9 9 9 8 9"/>
  </svg>
);

const Plus = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const Briefcase = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
  </svg>
);

const Mic = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
    <line x1="12" y1="19" x2="12" y2="23"/>
    <line x1="8" y1="23" x2="16" y2="23"/>
  </svg>
);

const StickyNote = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15.5 3H5a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2V8.5L15.5 3Z"/>
    <path d="M15 3v6h6"/>
  </svg>
);

function getDocTypeIcon(type: DocumentType) {
  switch (type) {
    case 'brief': return <Briefcase />;
    case 'report': return <Mic />;
    default: return <StickyNote />;
  }
}

function getDocTypeStyle(type: DocumentType) {
  const base = getDocumentTypeStyle(type);
  return { ...base, icon: getDocTypeIcon(type) };
}

interface DocumentsSectionProps {
  clientId: string;
}

export function DocumentsSection({ clientId }: DocumentsSectionProps) {
  const openDocument = useAppStore((state) => state.openDocument);
  const client = useClient(clientId);
  const { openDocumentModal } = useModal();
  if (!client) return null;

  return (
    <div className="bg-[var(--bg-card)] rounded-xl sm:rounded-2xl border border-[var(--border-subtle)] overflow-hidden">
      <div className="px-4 sm:px-5 py-4 border-b border-[var(--border-subtle)] flex items-center gap-2">
        <FileText />
        <h2 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider">
          Documents
        </h2>
        <span className="text-xs text-[var(--text-muted)] bg-[var(--bg-tertiary)] px-2 py-0.5 rounded-full">
          {client.documents.length}
        </span>
        <button
          onClick={() => openDocumentModal(clientId)}
          className="ml-auto p-1.5 rounded-lg bg-[var(--accent-amber)]/10 text-[var(--accent-amber)] hover:bg-[var(--accent-amber)]/20 transition-colors"
          title="Ajouter un document"
        >
          <Plus />
        </button>
      </div>

      <div className="divide-y divide-[var(--border-subtle)]">
        {client.documents.length === 0 ? (
          <button
            onClick={() => openDocumentModal(clientId)}
            className="w-full px-5 py-8 text-center text-[var(--text-muted)] text-sm hover:bg-[var(--bg-secondary)] hover:text-[var(--accent-amber)] transition-colors"
          >
            + Ajouter un document
          </button>
        ) : (
          client.documents.map((doc, index) => {
            const docStyle = getDocTypeStyle(doc.type);
            return (
              <div
                key={doc.id}
                className="px-5 py-4 hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer animate-fade-in-up"
                style={{ animationDelay: `${index * 0.05}s` }}
                onClick={() => openDocument(doc)}
              >
                <div className="flex items-start gap-3">
                  <span className={`p-1.5 rounded-lg ${docStyle.bg} ${docStyle.text} flex-shrink-0 mt-0.5`}>
                    {docStyle.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${docStyle.text}`}>
                        {docStyle.label}
                      </span>
                    </div>
                    <p className="font-medium text-[var(--text-primary)] text-sm truncate">
                      {doc.title}
                    </p>
                    <p className="text-xs text-[var(--text-muted)] mt-1 line-clamp-2">
                      {doc.content}
                    </p>
                    <p className="text-[10px] text-[var(--text-muted)] mt-2">
                      {formatDocDate(doc.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

'use client';

import { useMemo } from 'react';
import type { Project, Client, DocumentType } from '@/types';
import { useAppStore } from '@/lib/store';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DOC_TYPE_LABEL: Record<DocumentType, string> = {
  brief: 'Brief',
  report: 'CR',
  note: 'Note',
  'creative-strategy': 'Stratégie',
  'web-brief': 'Web Brief',
  'social-brief': 'Social',
};

const DOC_TYPE_COLOR: Record<DocumentType, string> = {
  brief: 'bg-[var(--accent-cyan)]/10 text-[var(--accent-cyan)]',
  report: 'bg-[var(--accent-violet)]/10 text-[var(--accent-violet)]',
  note: 'bg-[var(--accent-amber)]/10 text-[var(--accent-amber)]',
  'creative-strategy': 'bg-[var(--accent-magenta)]/10 text-[var(--accent-magenta)]',
  'web-brief': 'bg-[var(--accent-lime)]/10 text-[var(--accent-lime)]',
  'social-brief': 'bg-[var(--accent-coral)]/10 text-[var(--accent-coral)]',
};

// ─── Icons ────────────────────────────────────────────────────────────────────

const UploadIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

const FileIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
);

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProjectDrawerDocsTabProps {
  project: Project;
  client: Client;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ProjectDrawerDocsTab({ project, client }: ProjectDrawerDocsTabProps) {
  const { openModal } = useAppStore();

  // Filter documents belonging to this project
  const projectDocs = useMemo(
    () => client.documents.filter((d) => d.projectId === project.id),
    [client.documents, project.id]
  );

  const handleImportPlaud = () => {
    openModal({ type: 'report-upload', clientId: client.id, projectId: project.id });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Bouton Import PLAUD */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-[var(--border-subtle)]">
        <button
          type="button"
          onClick={handleImportPlaud}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold
                     bg-[var(--accent-cyan)]/10 text-[var(--accent-cyan)]
                     hover:bg-[var(--accent-cyan)]/20 transition-colors cursor-pointer"
        >
          <UploadIcon />
          Import PLAUD
        </button>
      </div>

      {/* Liste des documents du projet */}
      <div className="flex-1 overflow-y-auto">
        {projectDocs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-12 gap-3">
            <div className="w-10 h-10 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center text-[var(--text-muted)]">
              <FileIcon />
            </div>
            <p className="text-xs text-[var(--text-muted)] text-center">
              Aucun document — Importez un rapport PLAUD
            </p>
          </div>
        ) : (
          <div className="p-3 space-y-1">
            {projectDocs.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg
                           bg-[var(--bg-secondary)] border border-[var(--border-subtle)]
                           hover:border-[var(--border-default)] transition-colors"
              >
                <div className="text-[var(--text-muted)] flex-shrink-0">
                  <FileIcon />
                </div>
                <span className="text-xs text-[var(--text-primary)] font-medium truncate flex-1">
                  {doc.title}
                </span>
                <span
                  className={`flex-shrink-0 text-[9px] px-1.5 py-0.5 rounded font-semibold
                             ${DOC_TYPE_COLOR[doc.type]}`}
                >
                  {DOC_TYPE_LABEL[doc.type]}
                </span>
                <span className="flex-shrink-0 text-[9px] text-[var(--text-muted)]">
                  {new Date(doc.updatedAt).toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: 'short',
                  })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

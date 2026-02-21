/**
 * Styles centralisés pour statuts, types et catégories.
 * Évite les duplications et assure la cohérence visuelle.
 */

import type { DeliverableStatus, DeliverableType } from '@/types';
import type { DocumentType } from '@/types';

export const STATUS_STYLES: Record<
  DeliverableStatus,
  { bg: string; text: string; border?: string; label: string }
> = {
  to_quote: {
    bg: 'bg-[var(--accent-coral)]/10',
    text: 'text-[var(--accent-coral)]',
    border: 'border-[var(--accent-coral)]/30',
    label: 'À deviser',
  },
  pending: {
    bg: 'bg-[var(--accent-cyan)]/10',
    text: 'text-[var(--accent-cyan)]',
    border: 'border-[var(--accent-cyan)]/30',
    label: 'À faire',
  },
  'in-progress': {
    bg: 'bg-[var(--accent-violet)]/10',
    text: 'text-[var(--accent-violet)]',
    border: 'border-[var(--accent-violet)]/30',
    label: 'En attente',
  },
  completed: {
    bg: 'bg-[var(--accent-lime)]/10',
    text: 'text-[var(--accent-lime)]',
    border: 'border-[var(--accent-lime)]/30',
    label: 'Terminé',
  },
} as const;

export function getStatusStyle(status: DeliverableStatus) {
  return STATUS_STYLES[status];
}

export const DOCUMENT_TYPE_STYLES: Record<
  DocumentType,
  { bg: string; text: string; label: string }
> = {
  brief: {
    bg: 'bg-[var(--accent-cyan)]/10',
    text: 'text-[var(--accent-cyan)]',
    label: 'Brief',
  },
  report: {
    bg: 'bg-[var(--accent-violet)]/10',
    text: 'text-[var(--accent-violet)]',
    label: 'Report PLAUD',
  },
  note: {
    bg: 'bg-[var(--accent-violet)]/10',
    text: 'text-[var(--accent-violet)]',
    label: 'Note',
  },
  'creative-strategy': {
    bg: 'bg-[var(--accent-lime)]/10',
    text: 'text-[var(--accent-lime)]',
    label: 'Stratégie créative',
  },
  'web-brief': {
    bg: 'bg-[var(--accent-cyan)]/10',
    text: 'text-[var(--accent-cyan)]',
    label: 'Structure site',
  },
  'social-brief': {
    bg: 'bg-[var(--accent-magenta)]/10',
    text: 'text-[var(--accent-magenta)]',
    label: 'Brief Social',
  },
} as const;

export function getDocumentTypeStyle(type: DocumentType) {
  return DOCUMENT_TYPE_STYLES[type];
}

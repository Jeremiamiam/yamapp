'use client';

import { useState } from 'react';
import { BillingHistory, BillingStatus } from '@/types';
import { useAppStore } from '@/lib/store';

interface BillingTimelineProps {
  history: BillingHistory[];
  deliverableId: string;
  canEdit?: boolean;
  canDelete?: boolean;
}

const STATUS_LABELS: Record<BillingStatus, string> = {
  'pending': 'En attente',
  'deposit': 'Acompte facturé',
  'progress': 'Avancement facturé',
  'balance': 'Soldé',
};

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
  }).format(date);
}

function formatAmount(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function BillingTimeline({ history, deliverableId, canEdit = true, canDelete = true }: BillingTimelineProps) {
  const getTeamMemberById = useAppStore((state) => state.getTeamMemberById);
  const deleteBillingHistoryEntry = useAppStore((state) => state.deleteBillingHistoryEntry);
  const updateBillingHistoryEntry = useAppStore((state) => state.updateBillingHistoryEntry);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleEdit = (entry: BillingHistory) => {
    setEditingId(entry.id);
    setEditAmount(entry.amount != null ? String(entry.amount) : '');
    setEditNotes(entry.notes ?? '');
  };

  const handleSaveEdit = async (entryId: string) => {
    const amount = editAmount.trim() ? parseFloat(editAmount.replace(',', '.')) : undefined;
    await updateBillingHistoryEntry(entryId, deliverableId, amount, editNotes.trim() || undefined);
    setEditingId(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditAmount('');
    setEditNotes('');
  };

  const handleDeleteClick = (entryId: string) => {
    console.log('🗑️ Delete button clicked - Entry ID:', entryId);
    setDeletingId(entryId);
  };

  const handleConfirmDelete = async () => {
    if (!deletingId) return;

    console.log('✅ Delete confirmed, calling deleteBillingHistoryEntry...');
    try {
      await deleteBillingHistoryEntry(deletingId, deliverableId);
      console.log('✅ Delete completed successfully');
      setDeletingId(null);
    } catch (error) {
      console.error('❌ Delete failed:', error);
      setDeletingId(null);
    }
  };

  const handleCancelDelete = () => {
    console.log('❌ Delete cancelled by user');
    setDeletingId(null);
  };

  if (history.length === 0) {
    return (
      <div className="text-center py-8 text-[var(--text-muted)] text-sm">
        Aucun historique de facturation
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {history.map((entry, index) => {
        const member = entry.changedBy ? getTeamMemberById(entry.changedBy) : null;
        const isLast = index === history.length - 1;
        const isFirst = index === 0;

        return (
          <div key={entry.id} className="flex gap-3 relative">
            {/* Timeline line */}
            {!isLast && (
              <div
                className="absolute left-[7px] top-[24px] bottom-[-12px] w-[2px] bg-[var(--border-subtle)]"
                aria-hidden="true"
              />
            )}

            {/* Timeline dot */}
            <div
              className="relative z-10 mt-1 w-4 h-4 rounded-full border-2 border-[var(--accent-lime)] bg-[var(--bg-primary)] flex-shrink-0"
              aria-hidden="true"
            />

            {/* Content */}
            <div className="flex-1 min-w-0 pb-3">
              {deletingId === entry.id ? (
                /* Delete confirmation */
                <div className="space-y-3 p-3 rounded-lg bg-[#ef4444]/10 border border-[#ef4444]/30">
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    ⚠️ Êtes-vous sûr de vouloir supprimer cette entrée ?
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleConfirmDelete}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[#ef4444] text-white hover:opacity-90 transition-opacity"
                    >
                      Oui, supprimer
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelDelete}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              ) : editingId === entry.id ? (
                /* Edit mode */
                <div className="space-y-3">
                  <div className="flex items-baseline gap-2">
                    <span className="font-semibold text-[var(--text-primary)] text-sm">
                      {STATUS_LABELS[entry.status]}
                    </span>
                    <span className="text-xs text-[var(--text-muted)]">
                      {formatDate(entry.changedAt)}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <label className="text-xs text-[var(--text-muted)] block mb-1">Montant (€)</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={editAmount}
                        onChange={(e) => setEditAmount(e.target.value)}
                        placeholder="Ex: 1500"
                        className="w-full px-3 py-1.5 text-sm rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-lime)]"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-[var(--text-muted)] block mb-1">Notes</label>
                      <input
                        type="text"
                        value={editNotes}
                        onChange={(e) => setEditNotes(e.target.value)}
                        placeholder="Ex: Acompte 30%"
                        className="w-full px-3 py-1.5 text-sm rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-lime)]"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleSaveEdit(entry.id)}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[var(--accent-lime)] text-[var(--bg-primary)] hover:opacity-90 transition-opacity"
                    >
                      💾 Enregistrer
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              ) : (
                /* View mode */
                <>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="font-semibold text-[var(--text-primary)] text-sm">
                      {STATUS_LABELS[entry.status]}
                    </span>
                    <span className="text-xs text-[var(--text-muted)]">
                      {formatDate(entry.changedAt)}
                    </span>
                    <div className="ml-auto flex items-center gap-2">
                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => handleEdit(entry)}
                          className="text-xs text-[var(--text-muted)] hover:text-[var(--accent-cyan)] transition-colors"
                          title="Modifier"
                        >
                          ✏️
                        </button>
                      )}
                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => handleDeleteClick(entry.id)}
                          className="text-xs text-[var(--text-muted)] hover:text-[#ef4444] transition-colors"
                          title="Supprimer"
                        >
                          ❌
                        </button>
                      )}
                    </div>
                  </div>

                  {entry.amount && (
                    <div className="text-sm text-[var(--text-secondary)] mb-1">
                      Montant : <span className="font-semibold">{formatAmount(entry.amount)}</span>
                    </div>
                  )}

                  {entry.notes && (
                    <div className="text-sm text-[var(--text-muted)] italic">
                      {entry.notes}
                    </div>
                  )}

                  {member && (
                    <div className="text-xs text-[var(--text-muted)] mt-1">
                      Par {member.name}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

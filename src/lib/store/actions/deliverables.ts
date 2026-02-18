import type { StateCreator } from 'zustand';
import type { AppState } from '../types';
import type { Deliverable, DeliverableStatus } from '@/types';
import { handleError, AppError, getErrorMessage } from '@/lib/error-handler';
import { createClient } from '@/lib/supabase/client';
import { toSupabaseDeliverable } from '@/lib/supabase-mappers';
import { invalidateDataCache } from '@/lib/cache';

type DeliverablesActionsKeys = 'addDeliverable' | 'updateDeliverable' | 'deleteDeliverable' | 'toggleDeliverableStatus';

export const createDeliverablesActions: StateCreator<AppState, [], [], Pick<AppState, DeliverablesActionsKeys>> = (set, get) => ({
  addDeliverable: async (deliverableData) => {
    try {
      const id = `deliv-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const now = new Date();
      const supabase = createClient();
      const { error } = await supabase.from('deliverables').insert({
        id,
        ...toSupabaseDeliverable(deliverableData),
        created_at: now.toISOString(),
      });
      if (error) throw error;
      const deliv: Deliverable = { ...deliverableData, id, createdAt: now };
      set((state) => ({ deliverables: [...state.deliverables, deliv] }));
      invalidateDataCache();
    } catch (e) {
      handleError(new AppError(getErrorMessage(e), 'DELIV_ADD_FAILED', "Impossible d'ajouter le produit"));
    }
  },

  updateDeliverable: async (id, data) => {
    const prev = get().deliverables.find((d) => d.id === id);
    if (!prev) return;
    set((state) => ({
      deliverables: state.deliverables.map((d) => (d.id === id ? { ...d, ...data } : d)),
    }));
    try {
      const supabase = createClient();
      const payload = toSupabaseDeliverable(data);
      const dbPayload: Record<string, unknown> = {};
      // Colonnes NOT NULL en base : ne jamais envoyer null (sinon violation de contrainte)
      const notNullColumns = new Set(['billing_status', 'status', 'name', 'type', 'in_backlog', 'is_potentiel', 'st_hors_facture']);
      Object.entries(payload).forEach(([k, v]) => {
        if (v === undefined) return;
        if (v === null && notNullColumns.has(k)) return;
        dbPayload[k] = v;
      });
      // Forcer quote_amount (et date) quand devis vidé en édition, pour persister après refresh
      if ('quoteAmount' in data && data.quoteAmount == null) {
        dbPayload.quote_amount = null;
        dbPayload.quote_date = null;
      }
      const { error } = await supabase.from('deliverables').update(dbPayload).eq('id', id);
      if (error) throw error;
      invalidateDataCache();

      // Auto-promote prospect → client when billing progresses
      const billingProgressed = data.billingStatus && data.billingStatus !== 'pending' && prev.billingStatus === 'pending';
      if (billingProgressed && prev.clientId) {
        const client = get().clients.find((c) => c.id === prev.clientId);
        if (client && client.status === 'prospect') {
          get().updateClient(prev.clientId, { status: 'client' });
        }
      }
    } catch (e) {
      set((state) => ({
        deliverables: state.deliverables.map((d) => (d.id === id ? prev : d)),
      }));
      handleError(new AppError(getErrorMessage(e), 'DELIV_UPDATE_FAILED', "Impossible de modifier le produit"));
    }
  },

  deleteDeliverable: async (id) => {
    try {
      const supabase = createClient();
      const { error } = await supabase.from('deliverables').delete().eq('id', id);
      if (error) throw error;
      set((state) => ({ deliverables: state.deliverables.filter((d) => d.id !== id) }));
      invalidateDataCache();
    } catch (e) {
      handleError(new AppError(getErrorMessage(e), 'DELIV_DELETE_FAILED', "Impossible de supprimer le produit"));
    }
  },

  toggleDeliverableStatus: async (id) => {
    const d = get().deliverables.find((x) => x.id === id);
    if (!d) return;
    const statusOrder: DeliverableStatus[] = ['pending', 'in-progress', 'completed'];
    const nextStatus = statusOrder[(statusOrder.indexOf(d.status) + 1) % statusOrder.length];
    try {
      const supabase = createClient();
      const { error } = await supabase.from('deliverables').update({ status: nextStatus }).eq('id', id);
      if (error) throw error;
      set((s) => ({
        deliverables: s.deliverables.map((x) => (x.id === id ? { ...x, status: nextStatus } : x)),
      }));
    } catch (e) {
      handleError(new AppError(getErrorMessage(e), 'DELIV_UPDATE_FAILED', "Impossible de modifier le statut"));
    }
  },
});

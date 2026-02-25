import type { StateCreator } from 'zustand';
import type { AppState } from '../types';
import type { BillingStatus } from '@/types';
import { handleError, AppError } from '@/lib/error-handler';
import { createClient } from '@/lib/supabase/client';
import { mapBillingHistoryRow } from '@/lib/supabase-mappers';

type BillingActionsKeys =
  | 'updateDeliverableBillingStatus' | 'updateBillingHistoryEntry'
  | 'deleteBillingHistoryEntry' | 'loadBillingHistory' | 'getBillingHistory';

export const createBillingActions: StateCreator<AppState, [], [], Pick<AppState, BillingActionsKeys>> = (set, get) => ({
  updateDeliverableBillingStatus: async (id, newStatus, amount, notes) => {
    const prev = get().deliverables.find((d) => d.id === id);
    if (!prev) return;
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      const { error: updateError } = await supabase
        .from('deliverables')
        .update({ billing_status: newStatus })
        .eq('id', id);
      if (updateError) throw updateError;

      const historyId = crypto.randomUUID();
      const historyPayload = {
        id: historyId,
        deliverable_id: id,
        status: newStatus,
        amount: amount ?? null,
        notes: notes ?? null,
        changed_at: new Date().toISOString(),
        changed_by: user?.id ?? null,
      };

      const { error: historyError } = await supabase
        .from('billing_history')
        .insert(historyPayload)
        .select();
      if (historyError) throw historyError;

      set((state) => ({
        deliverables: state.deliverables.map((d) =>
          d.id === id ? { ...d, billingStatus: newStatus } : d
        ),
      }));

      await get().loadBillingHistory(id);
    } catch (e) {
      const message = e && typeof e === 'object' && 'message' in e ? String(e.message) : String(e);
      handleError(new AppError(message, 'BILLING_UPDATE_FAILED', "Impossible de modifier le statut de facturation"));
    }
  },

  updateBillingHistoryEntry: async (historyId, deliverableId, amount, notes) => {
    try {
      const supabase = createClient();
      const payload: Record<string, unknown> = {};
      if (amount !== undefined) payload.amount = amount;
      if (notes !== undefined) payload.notes = notes;
      const { error } = await supabase.from('billing_history').update(payload).eq('id', historyId);
      if (error) throw error;
      await get().loadBillingHistory(deliverableId);
    } catch (e) {
      const message = e && typeof e === 'object' && 'message' in e ? String(e.message) : String(e);
      handleError(new AppError(message, 'BILLING_HISTORY_UPDATE_FAILED', "Impossible de modifier l'entrée d'historique"));
    }
  },

  deleteBillingHistoryEntry: async (historyId, deliverableId) => {
    try {
      const supabase = createClient();
      const currentDeliverable = get().deliverables.find(d => d.id === deliverableId);
      if (!currentDeliverable) return;

      const { error: fetchError } = await supabase
        .from('billing_history')
        .select('*')
        .eq('id', historyId)
        .single();
      if (fetchError) throw fetchError;

      const { data: allHistory, error: historyError } = await supabase
        .from('billing_history')
        .select('*')
        .eq('deliverable_id', deliverableId)
        .order('changed_at', { ascending: false });
      if (historyError) throw historyError;

      const isMostRecent = allHistory && allHistory.length > 0 && allHistory[0].id === historyId;

      const { error: deleteError } = await supabase.from('billing_history').delete().eq('id', historyId);
      if (deleteError) throw deleteError;

      if (isMostRecent) {
        const { data: remainingHistory, error: remainingError } = await supabase
          .from('billing_history')
          .select('*')
          .eq('deliverable_id', deliverableId)
          .order('changed_at', { ascending: false })
          .limit(1);
        if (remainingError) throw remainingError;

        const previousStatus: BillingStatus = remainingHistory && remainingHistory.length > 0
          ? (remainingHistory[0].status as BillingStatus)
          : 'pending';

        const { error: updateError } = await supabase
          .from('deliverables')
          .update({ billing_status: previousStatus })
          .eq('id', deliverableId);
        if (updateError) throw updateError;

        set((state) => ({
          deliverables: state.deliverables.map((d) =>
            d.id === deliverableId ? { ...d, billingStatus: previousStatus } : d
          ),
        }));
      }

      await get().loadBillingHistory(deliverableId);
    } catch (e) {
      const message = e && typeof e === 'object' && 'message' in e ? String(e.message) : String(e);
      handleError(new AppError(message, 'BILLING_HISTORY_DELETE_FAILED', "Impossible de supprimer l'entrée d'historique"));
    }
  },

  loadBillingHistory: async (deliverableId) => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('billing_history')
        .select('*')
        .eq('deliverable_id', deliverableId)
        .order('changed_at', { ascending: true });
      if (error) throw error;

      const history = (data ?? []).map(mapBillingHistoryRow);
      set((state) => {
        const newMap = new Map(state.billingHistory);
        newMap.set(deliverableId, history);
        return { billingHistory: newMap };
      });
    } catch (e) {
      const message = e && typeof e === 'object' && 'message' in e ? String(e.message) : String(e);
      handleError(new AppError(message, 'BILLING_HISTORY_LOAD_FAILED', "Impossible de charger l'historique de facturation"));
    }
  },

  getBillingHistory: (deliverableId) => {
    return get().billingHistory.get(deliverableId) ?? [];
  },
});

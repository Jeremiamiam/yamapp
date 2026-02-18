import type { StateCreator } from 'zustand';
import type { AppState } from '../types';
import type { Call } from '@/types';
import { handleError, AppError, getErrorMessage } from '@/lib/error-handler';
import { createClient } from '@/lib/supabase/client';
import { toSupabaseCall } from '@/lib/supabase-mappers';

type CallsActionsKeys = 'addCall' | 'updateCall' | 'deleteCall';

export const createCallsActions: StateCreator<AppState, [], [], Pick<AppState, CallsActionsKeys>> = (set, get) => ({
  addCall: async (callData) => {
    try {
      const id = `call-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const now = new Date();
      const supabase = createClient();
      const { error } = await supabase.from('calls').insert({
        id,
        ...toSupabaseCall(callData),
        created_at: now.toISOString(),
      });
      if (error) throw error;
      const call: Call = { ...callData, id, createdAt: now };
      set((state) => ({ calls: [...state.calls, call] }));
    } catch (e) {
      handleError(new AppError(getErrorMessage(e), 'CALL_ADD_FAILED', "Impossible d'ajouter l'appel"));
    }
  },

  updateCall: async (id, data) => {
    const prev = get().calls.find((c) => c.id === id);
    if (!prev) return;
    set((state) => ({
      calls: state.calls.map((c) => (c.id === id ? { ...c, ...data } : c)),
    }));
    try {
      const supabase = createClient();
      const payload = toSupabaseCall(data);
      const dbPayload: Record<string, unknown> = {};
      Object.entries(payload).forEach(([k, v]) => {
        if (v !== undefined) dbPayload[k] = v;
      });
      const { error } = await supabase.from('calls').update(dbPayload).eq('id', id);
      if (error) throw error;
    } catch (e) {
      set((state) => ({
        calls: state.calls.map((c) => (c.id === id ? prev : c)),
      }));
      handleError(new AppError(getErrorMessage(e), 'CALL_UPDATE_FAILED', "Impossible de modifier l'appel"));
    }
  },

  deleteCall: async (id) => {
    try {
      const supabase = createClient();
      const { error } = await supabase.from('calls').delete().eq('id', id);
      if (error) throw error;
      set((state) => ({ calls: state.calls.filter((c) => c.id !== id) }));
    } catch (e) {
      handleError(new AppError(getErrorMessage(e), 'CALL_DELETE_FAILED', "Impossible de supprimer l'appel"));
    }
  },
});

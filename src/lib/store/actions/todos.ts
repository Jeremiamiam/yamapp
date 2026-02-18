import type { StateCreator } from 'zustand';
import type { AppState } from '../types';
import { handleError, AppError, getErrorMessage } from '@/lib/error-handler';
import { createClient } from '@/lib/supabase/client';
import { toSupabaseDayTodo, mapDayTodoRow } from '@/lib/supabase-mappers';

type TodosActionsKeys = 'addDayTodo' | 'updateDayTodo' | 'deleteDayTodo' | 'updateTeamMember';

export const createTodosActions: StateCreator<AppState, [], [], Pick<AppState, TodosActionsKeys>> = (set) => ({
  addDayTodo: async (text, assigneeId) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non connecté');
      const forDate = new Date();
      forDate.setHours(0, 0, 0, 0);
      const finalAssigneeId = assigneeId !== undefined ? assigneeId : user.id;
      const payload = {
        ...toSupabaseDayTodo({ text: trimmed, forDate, done: false, assigneeId: finalAssigneeId }),
        user_id: user.id,
      };
      const { data, error } = await supabase
        .from('day_todos')
        .insert(payload)
        .select('id,text,for_date,done,created_at,scheduled_at,assignee_id')
        .single();
      if (error) throw error;
      const newTodo = mapDayTodoRow(data);
      set((state) => ({ dayTodos: [...state.dayTodos, newTodo] }));
    } catch (e) {
      handleError(new AppError(getErrorMessage(e), 'DAY_TODO_ADD_FAILED', "Impossible d'ajouter la todo"));
    }
  },

  updateDayTodo: async (id, data) => {
    try {
      const supabase = createClient();
      const payload: Record<string, unknown> = {};
      if (data.text !== undefined) payload.text = data.text.trim();
      if (data.done !== undefined) payload.done = data.done;
      if (data.scheduledAt !== undefined) {
        payload.scheduled_at = data.scheduledAt ? data.scheduledAt.toISOString() : null;
      }
      if (data.assigneeId !== undefined) {
        payload.assignee_id = data.assigneeId || null;
      }
      if (Object.keys(payload).length === 0) return;
      const { data: row, error } = await supabase
        .from('day_todos')
        .update(payload)
        .eq('id', id)
        .select('id,text,for_date,done,created_at,scheduled_at,assignee_id')
        .single();
      if (error) throw error;
      const updated = mapDayTodoRow(row);
      set((state) => ({ dayTodos: state.dayTodos.map((t) => (t.id === id ? updated : t)) }));
    } catch (e) {
      handleError(new AppError(getErrorMessage(e), 'DAY_TODO_UPDATE_FAILED', 'Impossible de modifier la todo'));
    }
  },

  deleteDayTodo: async (id) => {
    try {
      const supabase = createClient();
      const { error } = await supabase.from('day_todos').delete().eq('id', id);
      if (error) throw error;
      set((state) => ({ dayTodos: state.dayTodos.filter((t) => t.id !== id) }));
    } catch (e) {
      handleError(new AppError(getErrorMessage(e), 'DAY_TODO_DELETE_FAILED', 'Impossible de supprimer la todo'));
    }
  },

  updateTeamMember: async (id, data) => {
    try {
      const supabase = createClient();
      const payload: Record<string, unknown> = {};
      if (data.name !== undefined) payload.name = data.name.trim();
      if (data.initials !== undefined) payload.initials = data.initials.trim();
      if (data.color !== undefined) payload.color = data.color;
      if (Object.keys(payload).length === 0) return;
      const { error } = await supabase.from('team').update(payload).eq('id', id);
      if (error) throw error;
      set((state) => ({
        team: state.team.map((m) => (m.id === id ? { ...m, ...data } : m)),
      }));
    } catch (e) {
      handleError(new AppError(getErrorMessage(e), 'TEAM_MEMBER_UPDATE_FAILED', 'Impossible de modifier le membre'));
    }
  },
});

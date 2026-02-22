import type { RetroplanningPlan, RetroplanningTask } from '@/types';
import type { AppState } from '../types';
import { createClient } from '@/lib/supabase/client';

type SetState = (partial: Partial<AppState> | ((state: AppState) => Partial<AppState>)) => void;
type GetState = () => AppState;

type RetroplanningRow = {
  id: string;
  client_id: string;
  deadline: string;
  tasks: RetroplanningTask[];
  generated_at: string;
  updated_at: string;
};

function mapRow(row: RetroplanningRow): RetroplanningPlan {
  return {
    id: row.id,
    clientId: row.client_id,
    deadline: row.deadline,
    tasks: (row.tasks as RetroplanningTask[]) || [],
    generatedAt: row.generated_at,
    updatedAt: row.updated_at,
  };
}

export function createRetroplanningActions(set: SetState, get: GetState) {
  return {
    retroplanning: new Map<string, RetroplanningPlan>(),

    loadRetroplanning: async (clientId: string): Promise<void> => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('retroplanning')
          .select('*')
          .eq('client_id', clientId)
          .maybeSingle();

        if (error) {
          console.error('Erreur chargement retroplanning:', error);
          return;
        }

        if (data) {
          const plan = mapRow(data as RetroplanningRow);
          set((state) => {
            const updated = new Map(state.retroplanning);
            updated.set(clientId, plan);
            return { retroplanning: updated };
          });
        }
      } catch (err) {
        console.error('Erreur chargement retroplanning:', err);
      }
    },

    saveRetroplanning: async (clientId: string, plan: RetroplanningPlan): Promise<void> => {
      try {
        const supabase = createClient();
        const now = new Date().toISOString();

        const { error } = await supabase
          .from('retroplanning')
          .upsert(
            {
              client_id: clientId,
              deadline: plan.deadline,
              tasks: plan.tasks,
              generated_at: plan.generatedAt || now,
              updated_at: now,
            },
            { onConflict: 'client_id' }
          );

        if (error) {
          console.error('Erreur sauvegarde retroplanning:', error);
          return;
        }

        const updatedPlan: RetroplanningPlan = { ...plan, clientId, updatedAt: now };
        set((state) => {
          const updated = new Map(state.retroplanning);
          updated.set(clientId, updatedPlan);
          return { retroplanning: updated };
        });
      } catch (err) {
        console.error('Erreur sauvegarde retroplanning:', err);
      }
    },

    deleteRetroplanning: async (clientId: string): Promise<void> => {
      try {
        const supabase = createClient();
        const { error } = await supabase
          .from('retroplanning')
          .delete()
          .eq('client_id', clientId);

        if (error) {
          console.error('Erreur suppression retroplanning:', error);
          return;
        }

        set((state) => {
          const updated = new Map(state.retroplanning);
          updated.delete(clientId);
          return { retroplanning: updated };
        });
      } catch (err) {
        console.error('Erreur suppression retroplanning:', err);
      }
    },

    getRetroplanningByClientId: (clientId: string): RetroplanningPlan | undefined => {
      return get().retroplanning.get(clientId);
    },
  };
}

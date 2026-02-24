import type { Project } from '@/types';
import type { AppState } from '../types';
import { createClient } from '@/lib/supabase/client';
import { invalidateDataCache } from '@/lib/cache';

type SetState = (partial: Partial<AppState> | ((state: AppState) => Partial<AppState>)) => void;
type GetState = () => AppState;

function generateId() {
  return `proj-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function mapRow(row: Record<string, unknown>): Project {
  return {
    id: row.id as string,
    clientId: row.client_id as string,
    name: row.name as string,
    quoteAmount: row.quote_amount != null ? Number(row.quote_amount) : undefined,
    quoteDate: row.quote_date as string | undefined,
    depositAmount: row.deposit_amount != null ? Number(row.deposit_amount) : undefined,
    depositDate: row.deposit_date as string | undefined,
    progressAmounts: (row.progress_amounts as number[]) || [],
    progressDates: (row.progress_dates as string[]) || [],
    balanceAmount: row.balance_amount != null ? Number(row.balance_amount) : undefined,
    balanceDate: row.balance_date as string | undefined,
    potentiel: row.potentiel != null ? Number(row.potentiel) : undefined,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  };
}

export function createProjectActions(set: SetState, get: GetState) {
  return {
    addProject: async (
      data: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'progressAmounts' | 'progressDates'> & { progressAmounts?: number[]; progressDates?: string[] }
    ): Promise<Project | undefined> => {
      const id = generateId();
      const now = new Date();

      const newProject: Project = {
        id,
        clientId: data.clientId,
        name: data.name,
        inBacklog: data.inBacklog,
        quoteAmount: data.quoteAmount,
        quoteDate: data.quoteDate,
        depositAmount: data.depositAmount,
        depositDate: data.depositDate,
        progressAmounts: data.progressAmounts || [],
        progressDates: data.progressDates || [],
        balanceAmount: data.balanceAmount,
        balanceDate: data.balanceDate,
        potentiel: data.potentiel,
        createdAt: now,
        updatedAt: now,
      };

      try {
        const supabase = createClient();
        const { error } = await supabase.from('projects').insert({
          id,
          client_id: data.clientId,
          name: data.name,
          in_backlog: data.inBacklog ?? false,
          quote_amount: data.quoteAmount ?? null,
          quote_date: data.quoteDate ?? null,
          deposit_amount: data.depositAmount ?? null,
          deposit_date: data.depositDate ?? null,
          progress_amounts: data.progressAmounts || [],
          progress_dates: data.progressDates || [],
          balance_amount: data.balanceAmount ?? null,
          balance_date: data.balanceDate ?? null,
          potentiel: data.potentiel ?? null,
        });

        if (error) throw error;

        set((state) => ({ projects: [...state.projects, newProject] }));
        invalidateDataCache();
        return newProject;
      } catch (err) {
        const e = err as Record<string, unknown>;
        console.error('Erreur ajout projet:', e?.message ?? e?.code ?? JSON.stringify(err));
        return undefined;
      }
    },

    updateProject: async (
      id: string,
      data: Partial<Omit<Project, 'id' | 'createdAt'>> & { quoteAmount?: number | null }
    ) => {
      try {
        const supabase = createClient();
        const dbData: Record<string, unknown> = { updated_at: new Date().toISOString() };

        if (data.name !== undefined) dbData.name = data.name;
        if (data.clientId !== undefined) dbData.client_id = data.clientId;
        // undefined = ne pas toucher, null = effacer le devis en base
        if (data.quoteAmount !== undefined) dbData.quote_amount = data.quoteAmount ?? null;
        if (data.quoteDate !== undefined) dbData.quote_date = data.quoteDate ?? null;
        if (data.depositAmount !== undefined) dbData.deposit_amount = data.depositAmount ?? null;
        if (data.depositDate !== undefined) dbData.deposit_date = data.depositDate ?? null;
        if (data.progressAmounts !== undefined) dbData.progress_amounts = data.progressAmounts;
        if (data.progressDates !== undefined) dbData.progress_dates = data.progressDates;
        if (data.balanceAmount !== undefined) dbData.balance_amount = data.balanceAmount ?? null;
        if (data.balanceDate !== undefined) dbData.balance_date = data.balanceDate ?? null;
        if (data.potentiel !== undefined) dbData.potentiel = data.potentiel ?? null;
        if (data.inBacklog !== undefined) dbData.in_backlog = data.inBacklog;
        if (data.scheduledAt !== undefined) dbData.scheduled_at = data.scheduledAt ? data.scheduledAt.toISOString() : null;

        const { error } = await supabase.from('projects').update(dbData).eq('id', id);
        if (error) throw error;
        invalidateDataCache();

        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id
              ? {
                  ...p,
                  ...data,
                  quoteAmount: data.quoteAmount !== undefined ? (data.quoteAmount ?? undefined) : p.quoteAmount,
                  updatedAt: new Date(),
                }
              : p
          ),
        }));
      } catch (err) {
        const e = err as Record<string, unknown>;
        console.error('Erreur mise à jour projet:', e?.message ?? e?.code ?? JSON.stringify(err));
      }
    },

    deleteProject: async (id: string) => {
      try {
        const supabase = createClient();
        const { error } = await supabase.from('projects').delete().eq('id', id);
        if (error) throw error;
        invalidateDataCache();

        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
          deliverables: state.deliverables.map((d) =>
            d.projectId === id ? { ...d, projectId: undefined } : d
          ),
        }));
      } catch (err) {
        const e = err as Record<string, unknown>;
        console.error('Erreur suppression projet:', e?.message ?? e?.code ?? JSON.stringify(err));
      }
    },

    assignDeliverableToProject: async (deliverableId: string, projectId: string | null) => {
      try {
        const supabase = createClient();
        const { error } = await supabase
          .from('deliverables')
          .update({ project_id: projectId })
          .eq('id', deliverableId);
        if (error) throw error;

        set((state) => ({
          deliverables: state.deliverables.map((d) =>
            d.id === deliverableId ? { ...d, projectId: projectId ?? undefined } : d
          ),
        }));
        invalidateDataCache();
      } catch (err) {
        const e = err as Record<string, unknown>;
        console.error('Erreur assignation projet:', e?.message ?? e?.code ?? JSON.stringify(err));
      }
    },

    getProjectsByClientId: (clientId: string): Project[] => {
      return get().projects.filter((p) => p.clientId === clientId);
    },

    getDeliverablesByProjectId: (projectId: string) => {
      return get().deliverables.filter((d) => d.projectId === projectId);
    },
  };
}

export { mapRow as mapProjectRow };

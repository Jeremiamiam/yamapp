import { createMcpClient } from './supabase';

// ─── Définitions des tools (schéma exposé à Claude) ──────────────────────────

export const TOOL_DEFINITIONS = [
  {
    name: 'get_clients',
    description: 'Liste tous les clients et prospects de l\'agence avec leur statut.',
    inputSchema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['client', 'prospect'],
          description: 'Filtrer par statut. Omis = tous.',
        },
      },
    },
  },
  {
    name: 'get_projects',
    description: 'Liste les projets, optionnellement filtrés par client.',
    inputSchema: {
      type: 'object',
      properties: {
        client_id: {
          type: 'string',
          description: 'ID du client pour filtrer ses projets.',
        },
      },
    },
  },
  {
    name: 'get_deliverables',
    description: 'Liste les livrables avec leur statut de facturation.',
    inputSchema: {
      type: 'object',
      properties: {
        client_id: {
          type: 'string',
          description: 'Filtrer par client.',
        },
        project_id: {
          type: 'string',
          description: 'Filtrer par projet.',
        },
        status: {
          type: 'string',
          enum: ['to_quote', 'pending', 'in-progress', 'completed'],
          description: 'Filtrer par statut de livrable.',
        },
      },
    },
  },
  {
    name: 'get_documents',
    description: 'Liste les documents (briefs, notes, web-briefs...) d\'un client.',
    inputSchema: {
      type: 'object',
      properties: {
        client_id: {
          type: 'string',
          description: 'Filtrer par client.',
        },
        type: {
          type: 'string',
          enum: ['brief', 'report', 'note', 'creative-strategy', 'web-brief', 'social-brief', 'link'],
          description: 'Filtrer par type de document.',
        },
      },
    },
  },
];

// ─── Exécution des tools ──────────────────────────────────────────────────────

export async function callTool(name: string, args: Record<string, string>) {
  const supabase = createMcpClient();

  switch (name) {
    case 'get_clients': {
      let query = supabase
        .from('clients')
        .select('id, name, status, budget_potentiel, created_at')
        .order('name');
      if (args.status) query = query.eq('status', args.status);
      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return data;
    }

    case 'get_projects': {
      let query = supabase
        .from('projects')
        .select('id, name, client_id, quote_amount, scheduled_at, in_backlog, created_at')
        .order('created_at', { ascending: false });
      if (args.client_id) query = query.eq('client_id', args.client_id);
      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return data;
    }

    case 'get_deliverables': {
      let query = supabase
        .from('deliverables')
        .select('id, name, client_id, project_id, type, status, billing_status, due_date, prix_facture, assignee_id, in_backlog')
        .order('due_date', { ascending: true });
      if (args.client_id) query = query.eq('client_id', args.client_id);
      if (args.project_id) query = query.eq('project_id', args.project_id);
      if (args.status) query = query.eq('status', args.status);
      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return data;
    }

    case 'get_documents': {
      let query = supabase
        .from('documents')
        .select('id, title, type, client_id, project_id, created_at, updated_at')
        .order('updated_at', { ascending: false });
      if (args.client_id) query = query.eq('client_id', args.client_id);
      if (args.type) query = query.eq('type', args.type);
      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return data;
    }

    default:
      throw new Error(`Tool inconnu : ${name}`);
  }
}

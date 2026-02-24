import { createClient } from '@/lib/supabase/server';
import { DEFAULT_PROMPTS, invalidateCache } from '@/lib/agent-prompts';

export interface AgentPromptEntry {
  agentId: string;
  feature: string;
  name: string;
  description: string;
  style?: string;
  defaultPrompt: string;
  currentPrompt: string;
  isCustomized: boolean;
}

// ─── GET : tous les prompts (overrides DB fusionnés avec défauts) ──────────────

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: overrides, error } = await supabase
      .from('agent_prompts')
      .select('agent_id, style, content');

    if (error) {
      console.error('Erreur lecture agent_prompts:', error.message);
    }

    // Construire un index des overrides DB
    const overrideMap = new Map<string, string>();
    for (const row of overrides ?? []) {
      const key = `${row.agent_id}:${row.style ?? ''}`;
      overrideMap.set(key, row.content);
    }

    // Fusionner avec les défauts
    const entries: AgentPromptEntry[] = DEFAULT_PROMPTS.map((def) => {
      const key = `${def.agentId}:${def.style ?? ''}`;
      const override = overrideMap.get(key);
      return {
        agentId: def.agentId,
        feature: def.feature,
        name: def.name,
        description: def.description,
        style: def.style,
        defaultPrompt: def.defaultPrompt,
        currentPrompt: override ?? def.defaultPrompt,
        isCustomized: !!override,
      };
    });

    return Response.json(entries);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return Response.json({ error: msg }, { status: 500 });
  }
}

// ─── PUT : upsert un override ─────────────────────────────────────────────────

export async function PUT(req: Request) {
  try {
    const body = (await req.json()) as {
      agentId: string;
      style?: string;
      content: string;
    };

    const { agentId, style, content } = body;

    if (!agentId?.trim()) {
      return Response.json({ error: 'agentId requis' }, { status: 400 });
    }
    if (!content?.trim()) {
      return Response.json({ error: 'content requis' }, { status: 400 });
    }

    // Vérifier que cet agent existe dans DEFAULT_PROMPTS
    const exists = DEFAULT_PROMPTS.some(
      (d) => d.agentId === agentId && (d.style ?? undefined) === (style ?? undefined)
    );
    if (!exists) {
      return Response.json({ error: 'Agent introuvable dans les défauts' }, { status: 404 });
    }

    const supabase = await createClient();

    const { error } = await supabase
      .from('agent_prompts')
      .upsert(
        {
          agent_id: agentId,
          feature: DEFAULT_PROMPTS.find((d) => d.agentId === agentId)?.feature ?? '',
          style: style ?? null,
          content: content.trim(),
        },
        { onConflict: 'agent_id,style' }
      );

    if (error) {
      console.error('Erreur upsert agent_prompts:', error.message);
      return Response.json({ error: error.message }, { status: 500 });
    }

    // Invalider le cache pour que la prochaine IA call prenne le nouveau prompt
    invalidateCache(agentId, style);

    return Response.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return Response.json({ error: msg }, { status: 500 });
  }
}

// ─── DELETE : supprimer l'override (restaurer le défaut) ──────────────────────

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const agentId = searchParams.get('agentId');
    const style = searchParams.get('style') ?? undefined;

    if (!agentId) {
      return Response.json({ error: 'agentId requis' }, { status: 400 });
    }

    const supabase = await createClient();

    let query = supabase
      .from('agent_prompts')
      .delete()
      .eq('agent_id', agentId);

    if (style) {
      query = query.eq('style', style);
    } else {
      query = query.is('style', null);
    }

    const { error } = await query;

    if (error) {
      console.error('Erreur delete agent_prompts:', error.message);
      return Response.json({ error: error.message }, { status: 500 });
    }

    invalidateCache(agentId, style);

    return Response.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return Response.json({ error: msg }, { status: 500 });
  }
}

import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─── Types d'events streamés au front ────────────────────────────────────────

export type BoardEvent =
  | { type: 'orchestrator'; text: string }
  | { type: 'handoff'; from: string; to: AgentId; reason: string }
  | { type: 'agent_start'; agent: AgentId }
  | { type: 'agent_chunk'; agent: AgentId; text: string }
  | { type: 'agent_done'; agent: AgentId }
  | { type: 'report'; text: string }
  | { type: 'error'; message: string };

export type AgentId = 'strategist' | 'copywriter' | 'devil';

// ─── Configs agents ───────────────────────────────────────────────────────────

const AGENTS: Record<AgentId, { name: string; prompt: string }> = {
  strategist: {
    name: 'Le Stratège',
    prompt: `Tu es un stratège de marque senior, analytique et direct.
Tu analyses les briefs sous l'angle positionnement, différenciation, cible et territoires de marque.
Tu réponds en 3-4 points clés, sans blabla. Tu utilises des termes stratégiques précis.
Sois synthétique et tranchant.`,
  },
  copywriter: {
    name: 'Le Copywriter',
    prompt: `Tu es un copywriter créatif avec un fort sens du rythme et des mots.
À partir du brief et de l'analyse stratégique, tu proposes :
- 1 territoire de marque (2-3 mots)
- 1 manifeste court (4-6 lignes, ton émotionnel)
- 3 taglines candidates
Tu es instinctif, tu fais confiance aux mots. Pas de jargon.`,
  },
  devil: {
    name: 'Le Devil\'s Advocate',
    prompt: `Tu es le devil's advocate du board créatif.
Tu challenges les idées stratégiques et créatives avec bienveillance mais sans complaisance.
Tu poses les vraies questions : "Est-ce que la cible va comprendre ?", "Ça différencie vraiment ?", "Le client va acheter ça ?"
Tu conclus avec 1-2 recommandations concrètes pour renforcer la proposition.
Sois direct, pas méchant.`,
  },
};

// ─── Helper : stream un agent et émet ses chunks ──────────────────────────────

async function runAgent(
  agentId: AgentId,
  systemPrompt: string,
  userMessage: string,
  emit: (event: BoardEvent) => void
): Promise<string> {
  emit({ type: 'agent_start', agent: agentId });

  let fullText = '';

  const stream = client.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 600,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  });

  for await (const event of stream) {
    if (
      event.type === 'content_block_delta' &&
      event.delta.type === 'text_delta'
    ) {
      const chunk = event.delta.text;
      fullText += chunk;
      emit({ type: 'agent_chunk', agent: agentId, text: chunk });
    }
  }

  emit({ type: 'agent_done', agent: agentId });
  return fullText;
}

// ─── Route POST ───────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  const { brief } = await req.json();

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: 'ANTHROPIC_API_KEY manquante' }, { status: 500 });
  }

  if (!brief?.trim()) {
    return Response.json({ error: 'Brief manquant' }, { status: 400 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const emit = (event: BoardEvent) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      };

      try {
        // ── 1. Orchestrateur lance le process ──
        emit({
          type: 'orchestrator',
          text: 'Brief reçu. Je commence par le Stratège pour poser les bases.',
        });

        // ── 2. Le Stratège ──
        emit({
          type: 'handoff',
          from: 'Orchestrateur',
          to: 'strategist',
          reason: 'Analyse stratégique du brief',
        });

        const strategistOutput = await runAgent(
          'strategist',
          AGENTS.strategist.prompt,
          `Brief client : ${brief}`,
          emit
        );

        // ── 3. Orchestrateur fait le pont ──
        emit({
          type: 'orchestrator',
          text: 'Analyse stratégique reçue. Je transmets au Copywriter pour le travail créatif.',
        });

        // ── 4. Le Copywriter ──
        emit({
          type: 'handoff',
          from: 'Orchestrateur',
          to: 'copywriter',
          reason: 'Création du territoire et des copies',
        });

        const copywriterOutput = await runAgent(
          'copywriter',
          AGENTS.copywriter.prompt,
          `Brief client : ${brief}\n\nAnalyse stratégique :\n${strategistOutput}`,
          emit
        );

        // ── 5. Orchestrateur envoie au Devil ──
        emit({
          type: 'orchestrator',
          text: 'Bonne proposition. Je l\'envoie au Devil pour challenger tout ça avant de conclure.',
        });

        // ── 6. Le Devil's Advocate ──
        emit({
          type: 'handoff',
          from: 'Orchestrateur',
          to: 'devil',
          reason: 'Challenge et recommandations',
        });

        const devilOutput = await runAgent(
          'devil',
          AGENTS.devil.prompt,
          `Brief client : ${brief}\n\nAnalyse stratégique :\n${strategistOutput}\n\nProposition créative :\n${copywriterOutput}`,
          emit
        );

        // ── 7. Report final ──
        emit({
          type: 'orchestrator',
          text: 'Board terminé. Voici la synthèse.',
        });

        emit({
          type: 'report',
          text: `## Synthèse du Board Créatif\n\n### Stratégie\n${strategistOutput}\n\n### Proposition Créative\n${copywriterOutput}\n\n### Points de vigilance\n${devilOutput}`,
        });

      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erreur inconnue';
        emit({ type: 'error', message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}

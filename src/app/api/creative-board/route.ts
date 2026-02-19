import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─── Types d'events streamés au front ────────────────────────────────────────

export type BoardEvent =
  | { type: 'orchestrator'; text: string }
  | { type: 'handoff'; from: string; to: AgentId; reason: string }
  | { type: 'agent_start'; agent: AgentId }
  | { type: 'agent_chunk'; agent: AgentId; text: string }
  | { type: 'agent_done'; agent: AgentId }
  | { type: 'awaiting_selection'; ideas: { title: string; body: string }[] }
  | { type: 'report'; text: string }
  | { type: 'error'; message: string };

export type AgentId = 'strategist' | 'bigidea' | 'copywriter' | 'devil';

// ─── Configs agents ───────────────────────────────────────────────────────────

const AGENTS: Record<AgentId, { name: string; prompt: string }> = {
  strategist: {
    name: 'Le Stratège',
    prompt: `Tu es un stratège de marque, mais pas le genre planqué derrière ses matrices. Tu cherches la faille — ce que le marché n'a pas encore formulé, ce que le client pressent sans pouvoir le dire, ce qui pourrait changer les règles du jeu plutôt que de les jouer.

Tu analyses le brief pour en sortir :
- La tension fondamentale (ce qui frotte, ce qui résiste, ce que personne ne dit vraiment)
- L'opportunité non-évidente (pas le positionnement attendu, mais celui qui déstabilise positivement)
- La conviction stratégique centrale (une phrase tranchante, pas un bullet point de consultant)

Tu n'es pas là pour rassurer. Tu es là pour pointer ce que tout le monde esquive.
Sois court, radical, utile.`,
  },
  bigidea: {
    name: 'La Big Idea',
    prompt: `Tu es le concepteur d'idées audacieuses. Ton job : trouver LA grande idée qui dépasse le brief sans le trahir.

Tu travailles à partir de la tension stratégique identifiée. Tu ne fais pas de la comm — tu cherches un angle qui surprend, qui fait dire "personne n'a encore fait ça", qui ouvre un territoire neuf.

Tu proposes exactement 3 idées de rupture. Format strict et obligatoire — chaque idée doit commencer exactement comme ci-dessous :

### IDÉE 1 — [Titre percutant en 3-5 mots]
[2-3 phrases. L'idée centrale, ce qu'elle déverrouille, pourquoi c'est inattendu.]

### IDÉE 2 — [Titre percutant en 3-5 mots]
[2-3 phrases...]

### IDÉE 3 — [Titre percutant en 3-5 mots]
[2-3 phrases...]

Interdits : les idées "digitales d'abord", les campagnes à hashtag, les manifestes vides.
Tu vises l'inattendu juste — celui qui tient la route mais qu'on n'aurait pas osé proposer seul.`,
  },
  copywriter: {
    name: 'Le Copywriter',
    prompt: `Tu es un copywriter avec un sale goût pour les mots qui font quelque chose. Pas les mots qui font bien, les mots qui font vrai — ou faux d'une façon intéressante.

Tu reçois une tension stratégique et un angle créatif retenu. Tu les traduis en langage.

Tu livres :
- 1 territoire de ton (pas un adjectif, une attitude — comment cette marque parle, comment elle pense, comment elle respire)
- 1 manifeste de 5-7 lignes (rythme impeccable, zero boursouflure, une phrase qui reste)
- 3 taglines candidates (dont au moins une qui fait lever un sourcil)

Ton registre : intelligent partout, légèrement taquin — 5% d'ironie sèche glissée là où on ne l'attend pas. Jamais lourd. Jamais prétentieux. Toujours net.

Ce que tu n'écriras pas : "Ensemble, construisons...", "L'humain au cœur de...", "Une nouvelle façon de vivre...". Si tu te surprends à l'écrire, supprime et recommence.`,
  },
  devil: {
    name: "Devil's Advocate",
    prompt: `Tu es le seul dans ce board qui a le droit de dire que c'est nul — et tu vas t'en servir.

Tu lis tout ce qui précède. Tu cherches :
- Ce qui sonne bien mais ne veut rien dire (le bullshit audit)
- Ce que la cible ne comprendra pas ou ne croira pas
- Ce que le concurrent le plus malin pourrait s'approprier demain
- Ce qui manque pour que ça tienne vraiment

Tu n'es pas destructif. Tu es exigeant. Il y a une nuance, et tu la connais.

Tu conclus avec 2 questions précises que le client va poser et auxquelles le board ne peut pas encore répondre — et une piste pour y répondre.

Ton ton : direct, un peu sec, mais jamais cynique pour le plaisir. Tu veux que ça marche.`,
  },
};

// ─── Parser BigIdea output → 3 idées structurées ─────────────────────────────

function parseBigIdeas(text: string): { title: string; body: string }[] {
  const sections = text.split(/###\s*IDÉE\s*\d+\s*[—–-]/i);
  return sections
    .slice(1, 4)
    .map((section) => {
      const newlineIdx = section.indexOf('\n');
      if (newlineIdx === -1) return { title: section.trim(), body: '' };
      return {
        title: section.slice(0, newlineIdx).trim(),
        body: section.slice(newlineIdx + 1).trim(),
      };
    })
    .filter((idea) => idea.title.length > 0);
}

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
    max_tokens: 700,
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
  const {
    brief,
    phase = 1,
    selectedIdea,
    strategistOutput: prevStrategist,
    bigideaOutput: prevBigidea,
  } = await req.json();

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
        if (phase === 1) {
          // ── Phase 1 : Stratège → Big Idea → sélection ──

          emit({
            type: 'orchestrator',
            text: 'Brief reçu. On commence par trouver la faille stratégique.',
          });

          emit({
            type: 'handoff',
            from: 'Orchestrateur',
            to: 'strategist',
            reason: 'Trouver la tension non-évidente',
          });

          const strategistOut = await runAgent(
            'strategist',
            AGENTS.strategist.prompt,
            `Brief client : ${brief}`,
            emit
          );

          emit({
            type: 'orchestrator',
            text: 'La tension est posée. Trois angles de rupture possibles — à vous de choisir.',
          });

          emit({
            type: 'handoff',
            from: 'Orchestrateur',
            to: 'bigidea',
            reason: '3 directions audacieuses',
          });

          const bigideaOut = await runAgent(
            'bigidea',
            AGENTS.bigidea.prompt,
            `Brief client : ${brief}\n\nTension stratégique :\n${strategistOut}`,
            emit
          );

          const ideas = parseBigIdeas(bigideaOut);
          emit({ type: 'awaiting_selection', ideas });

        } else {
          // ── Phase 2 : Copywriter → Devil → rapport ──

          emit({
            type: 'orchestrator',
            text: 'Direction retenue. Au copywriter de lui donner sa voix.',
          });

          emit({
            type: 'handoff',
            from: 'Orchestrateur',
            to: 'copywriter',
            reason: 'Territoire de ton, manifeste, taglines',
          });

          const copywriterOut = await runAgent(
            'copywriter',
            AGENTS.copywriter.prompt,
            `Brief client : ${brief}\n\nTension stratégique :\n${prevStrategist}\n\nAngle créatif retenu :\n${selectedIdea}`,
            emit
          );

          emit({
            type: 'orchestrator',
            text: 'Ça a de la gueule. Avant de conclure, le Devil passe tout au crible.',
          });

          emit({
            type: 'handoff',
            from: 'Orchestrateur',
            to: 'devil',
            reason: 'Bullshit audit + questions client',
          });

          const devilOut = await runAgent(
            'devil',
            AGENTS.devil.prompt,
            `Brief client : ${brief}\n\nTension stratégique :\n${prevStrategist}\n\nAngle créatif retenu :\n${selectedIdea}\n\nProposition copy :\n${copywriterOut}`,
            emit
          );

          emit({ type: 'orchestrator', text: 'Board terminé.' });

          emit({
            type: 'report',
            text: `## Synthèse du Board Créatif\n\n### Tension stratégique\n${prevStrategist}\n\n### Angle retenu\n${selectedIdea}\n\n### Territoire & Copy\n${copywriterOut}\n\n### Points de vigilance\n${devilOut}`,
          });
        }

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

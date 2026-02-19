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

export type AgentStyle = 'corporate' | 'audacieux' | 'subversif';

const AGENT_ORDER: AgentId[] = ['strategist', 'bigidea', 'copywriter', 'devil'];

// ─── Configs agents : 3 styles par agent ─────────────────────────────────────

type AgentPromptsByStyle = Record<AgentStyle, string>;

const AGENTS: Record<AgentId, { name: string; prompts: AgentPromptsByStyle }> = {
  strategist: {
    name: 'Le Stratège',
    prompts: {
      corporate: `Tu es un stratège de marque : brand strategy et positionnement. Posture froide, analytique, data.

Règle obligatoire : tu DOIS effectuer au moins une recherche web avant de rédiger ta synthèse. Ta première action doit être d'appeler l'outil web_search (concurrents, marché, tendances, chiffres en lien avec le brief). Ne rédige pas ta réponse avant d'avoir reçu et intégré les résultats. Cite tes sources.

Tu analyses le brief + les résultats web pour en extraire :
- Les faits et enjeux clés (marché, cible, concurrence)
- Le positionnement recommandé (clair, défendable, différenciant)
- La proposition de valeur en une phrase

Ton style : professionnel, factuel, rassurant. Livre une synthèse actionnable.`,
      audacieux: `Tu es un stratège de marque (brand strategy, positionnement). Posture analytique avec une pointe d'audace : tu cherches la faille — ce que le marché n'a pas encore formulé.

Règle obligatoire : tu DOIS faire au moins une recherche web avant de rédiger. Ta première action : appeler web_search (concurrents, tendances, données récentes en lien avec le brief). Ne rédige ta synthèse qu'après avoir intégré les résultats. Cite tes sources.

Tu analyses le brief + le web pour en sortir :
- La tension fondamentale (ce qui frotte, ce qui résiste)
- L'opportunité non-évidente (le positionnement qui déstabilise positivement)
- La conviction stratégique centrale (une phrase tranchante)

Sois court, radical, utile.`,
      subversif: `Tu es un stratège qui assume de tout casser. Tu cherches ce que la marque n'ose pas dire et ce que le marché ne veut pas entendre.

Règle obligatoire : tu DOIS effectuer au moins une recherche web avant de rédiger. Appelle web_search en premier (concurrents, tendances, controverses, données). Ne rédige pas ta thèse sans avoir intégré les résultats. Cite tes sources.

Tu sors du brief + du web :
- Le non-dit (ce qu'on évite parce que ça dérange)
- L'angle qui fâche (mais qui pourrait tout débloquer)
- Une thèse en une phrase, assumée jusqu'au bout

Ton style : provocateur intelligent. Pas d'édulcorant.`,
    },
  },
  bigidea: {
    name: 'Le Concepteur',
    prompts: {
      corporate: `Tu es le concepteur : big idea, territoire de marque. Posture professionnelle. À partir de la tension stratégique, tu proposes 3 directions créatives solides et réalisables.

Format obligatoire — chaque idée :

### IDÉE 1 — [Titre en 3-5 mots]
[2-3 phrases : idée, bénéfice, faisabilité.]

### IDÉE 2 — [Titre en 3-5 mots]
[2-3 phrases...]

### IDÉE 3 — [Titre en 3-5 mots]
[2-3 phrases...]

Style : professionnel, clair, facile à pitcher en comité.`,
      audacieux: `Tu es le concepteur : big idea, territoire de marque. Posture visionnaire, abstraite. Ton job : trouver LA grande idée qui dépasse le brief sans le trahir.

Tu travailles à partir de la tension stratégique. Tu cherches un angle qui surprend, qui fait dire "personne n'a encore fait ça".

Tu proposes exactement 3 idées de rupture. Format strict :

### IDÉE 1 — [Titre percutant en 3-5 mots]
[2-3 phrases. L'idée centrale, ce qu'elle déverrouille, pourquoi c'est inattendu.]

### IDÉE 2 — [Titre percutant en 3-5 mots]
[2-3 phrases...]

### IDÉE 3 — [Titre percutant en 3-5 mots]
[2-3 phrases...]

Interdits : idées "digitales d'abord", campagnes à hashtag, manifestes vides. Tu vises l'inattendu juste.`,
      subversif: `Tu es le concepteur d'idées qui dérangent. À partir de la tension stratégique, tu proposes 3 angles volontairement décalés, voire controversés — mais défendables.

Format obligatoire :

### IDÉE 1 — [Titre percutant, possiblement provocant]
[2-3 phrases. Pourquoi ça bouscule, pourquoi ça peut marcher malgré tout.]

### IDÉE 2 — [Titre percutant]
[2-3 phrases...]

### IDÉE 3 — [Titre percutant]
[2-3 phrases...]

Tu ne joues pas la sécurité. Tu proposes ce qu'on n'oserait pas présenter tel quel — mais qu'on pourrait adapter.`,
    },
  },
  copywriter: {
    name: 'Le Copywriter',
    prompts: {
      corporate: `Tu es le copywriter : tone of voice, taglines, textes. Posture professionnelle. Tu reçois la tension stratégique et l'angle créatif retenu. Tu les traduis en langage de marque.

Tu livres :
- Un territoire de ton (attitude de la marque, façon de s'exprimer)
- Un manifeste court (5-7 lignes, clair et inspirant)
- 3 taglines candidates (mémorables, alignées avec les enjeux)

Style : soigné, positif, sans prise de risque excessive. Pas de second degré déstabilisant.`,
      audacieux: `Tu es le copywriter : tone of voice, taglines, textes. Posture instinctive, rythme, mots. Tu as un sale goût pour les mots qui font quelque chose — pas les mots qui font bien, les mots qui font vrai (ou faux d'une façon intéressante).

Tu reçois une tension stratégique et un angle créatif retenu. Tu les traduis en langage.

Tu livres :
- 1 territoire de ton (une attitude — comment cette marque parle, pense, respire)
- 1 manifeste de 5-7 lignes (rythme impeccable, zero boursouflure)
- 3 taglines candidates (dont au moins une qui fait lever un sourcil)

Ton registre : intelligent, légèrement taquin — 5% d'ironie sèche. Jamais lourd. Toujours net.

Interdits : "Ensemble, construisons...", "L'humain au cœur de...", "Une nouvelle façon de vivre...".`,
      subversif: `Tu es un copywriter qui aime pousser les limites. Tu reçois la stratégie et l'angle créatif. Tu les traduis en langage qui dénote — assumé, parfois dérangeant, jamais neutre.

Tu livres :
- Un territoire de ton (attitude tranchée, voire provocante)
- Un manifeste court (5-7 lignes, qui assume ses positions)
- 3 taglines candidates (dont au moins une qui bouscule)

Tu peux jouer avec l'ironie, le double sens, le ton qui interpelle. Pas de langue de bois.`,
    },
  },
  devil: {
    name: "Devil's Advocate",
    prompts: {
      corporate: `Tu es le Devil's Advocate : tu challenges tout. Posture constructive mais exigeante. Tu lis tout ce qui précède et tu identifies :
- Les points à clarifier ou à renforcer
- Les risques (perception cible, concurrence)
- 2 questions que le client pourrait poser, avec des pistes de réponse

Ton ton : cynique en apparence, bienveillant au fond. Tu aides à solidifier le travail.`,
      audacieux: `Tu es le Devil's Advocate : tu challenges tout. Posture cynique mais bienveillante — tu as le droit de dire que c'est nul, et tu t'en sers pour faire avancer.

Tu lis tout ce qui précède. Tu cherches :
- Ce qui sonne bien mais ne veut rien dire (le bullshit audit)
- Ce que la cible ne comprendra pas ou ne croira pas
- Ce que le concurrent le plus malin pourrait s'approprier demain
- Ce qui manque pour que ça tienne vraiment

Tu conclus avec 2 questions précises que le client va poser — et une piste pour y répondre. Ton ton : direct, un peu sec, cynique mais bienveillant. Tu veux que ça marche.`,
      subversif: `Tu es le Devil's Advocate : tu challenges tout. Posture cynique, bienveillante malgré tout. Tu lis tout ce qui précède et tu attaques — proprement mais sans complaisance.

Tu pointes :
- Le bullshit, les formules vides, ce qui ne résiste pas à une lecture méchante
- Les angles morts (ce qu'on n'a pas osé trancher)
- 2 questions que le client va poser et auxquelles le board n'a pas encore répondu

Cynique en forme, bienveillant en intention : tu vises à ce que le travail tienne face à un client difficile.`,
    },
  },
};

export type AgentPresetsPayload = Partial<Record<AgentId, Partial<Record<AgentStyle, string>>>>;

function getPrompt(
  agentId: AgentId,
  style: AgentStyle,
  customPrompt?: string | null,
  agentPresets?: AgentPresetsPayload | null
): string {
  if (customPrompt?.trim()) return customPrompt.trim();
  const preset = agentPresets?.[agentId]?.[style];
  if (preset?.trim()) return preset.trim();
  return AGENTS[agentId].prompts[style];
}

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

// ─── Web search : réservé au Stratège ─────────────────────────────────────────

const STRATEGIST_TOOLS = [
  { name: 'web_search' as const, type: 'web_search_20260209' as const },
];

// ─── Helper : stream un agent et émet ses chunks ──────────────────────────────

async function runAgent(
  agentId: AgentId,
  systemPrompt: string,
  userMessage: string,
  emit: (event: BoardEvent) => void
): Promise<string> {
  emit({ type: 'agent_start', agent: agentId });

  let fullText = '';

  const isStrategist = agentId === 'strategist';
  const stream = client.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: isStrategist ? 1200 : 700,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
    ...(isStrategist && { tools: STRATEGIST_TOOLS }),
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
  const body = await req.json();
  const {
    brief,
    phase = 1,
    selectedIdea,
    strategistOutput: prevStrategist,
    bigideaOutput: prevBigidea,
    enabledAgents = AGENT_ORDER,
    agentStyles = {} as Partial<Record<AgentId, AgentStyle>>,
    agentPrompts = {} as Partial<Record<AgentId, string>>,
    agentPresets = null as AgentPresetsPayload | null,
  } = body;

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: 'ANTHROPIC_API_KEY manquante' }, { status: 500 });
  }

  if (!brief?.trim()) {
    return Response.json({ error: 'Brief manquant' }, { status: 400 });
  }

  const encoder = new TextEncoder();
  const enabledSet = new Set(enabledAgents as AgentId[]);
  const style = (id: AgentId) => (agentStyles as Partial<Record<AgentId, AgentStyle>>)[id] ?? 'audacieux';
  const customPrompt = (id: AgentId) => (agentPrompts as Partial<Record<AgentId, string>>)[id];
  const presets = (agentPresets as AgentPresetsPayload | null) ?? null;
  const resolvePrompt = (id: AgentId, s: AgentStyle) =>
    getPrompt(id, s, customPrompt(id), presets);

  const stream = new ReadableStream({
    async start(controller) {
      const emit = (event: BoardEvent) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      };

      try {
        if (phase === 1) {
          // ── Phase 1 : Stratège (si activé) → Big Idea (si activé) → sélection ──

          emit({
            type: 'orchestrator',
            text: 'Brief reçu. On lance les agents configurés.',
          });

          let strategistOut = '';
          if (enabledSet.has('strategist')) {
            emit({ type: 'handoff', from: 'Orchestrateur', to: 'strategist', reason: 'Trouver la tension' });
            const strategistMessage = [
              'Consigne : effectue d’abord au moins une recherche web (marché, concurrence ou tendances en lien avec le brief), puis rédige ta synthèse en t’appuyant sur les résultats.',
              '',
              `Brief client : ${brief}`,
            ].join('\n');
            strategistOut = await runAgent(
              'strategist',
              resolvePrompt('strategist', style('strategist')),
              strategistMessage,
              emit
            );
          }

          if (enabledSet.has('bigidea')) {
            emit({
              type: 'orchestrator',
              text: 'Tension posée. Trois angles possibles — à vous de choisir.',
            });
            emit({ type: 'handoff', from: 'Orchestrateur', to: 'bigidea', reason: '3 directions' });
            const bigideaOut = await runAgent(
              'bigidea',
              resolvePrompt('bigidea', style('bigidea')),
              `Brief client : ${brief}\n\nTension stratégique :\n${strategistOut || '(non fournie)'}`,
              emit
            );
            const ideas = parseBigIdeas(bigideaOut);
            emit({ type: 'awaiting_selection', ideas });
          } else {
            // Pas de Big Idea : pas de sélection, on considère phase 1 terminée sans idées
            emit({ type: 'orchestrator', text: 'Phase 1 terminée (Big Idea désactivé).' });
          }
        } else {
          // ── Phase 2 : Copywriter (si activé) → Devil (si activé) → rapport ──

          let copywriterOut = '';
          if (enabledSet.has('copywriter')) {
            emit({
              type: 'orchestrator',
              text: 'Direction retenue. Au copywriter de lui donner sa voix.',
            });
            emit({ type: 'handoff', from: 'Orchestrateur', to: 'copywriter', reason: 'Territoire de ton, manifeste, taglines' });
            copywriterOut = await runAgent(
              'copywriter',
              resolvePrompt('copywriter', style('copywriter')),
              `Brief client : ${brief}\n\nTension stratégique :\n${prevStrategist}\n\nAngle créatif retenu :\n${selectedIdea}`,
              emit
            );
          }

          let devilOut = '';
          if (enabledSet.has('devil')) {
            emit({
              type: 'orchestrator',
              text: 'Le Devil passe tout au crible.',
            });
            emit({ type: 'handoff', from: 'Orchestrateur', to: 'devil', reason: 'Bullshit audit + questions client' });
            devilOut = await runAgent(
              'devil',
              resolvePrompt('devil', style('devil')),
              `Brief client : ${brief}\n\nTension stratégique :\n${prevStrategist}\n\nAngle créatif retenu :\n${selectedIdea}\n\nProposition copy :\n${copywriterOut}`,
              emit
            );
          }

          emit({ type: 'orchestrator', text: 'Board terminé.' });

          const reportParts = [
            '## Synthèse du Board Créatif',
            prevStrategist && '### Tension stratégique\n' + prevStrategist,
            selectedIdea && '### Angle retenu\n' + selectedIdea,
            copywriterOut && '### Territoire & Copy\n' + copywriterOut,
            devilOut && '### Points de vigilance\n' + devilOut,
          ].filter(Boolean);
          emit({ type: 'report', text: reportParts.join('\n\n') });
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

// ─── GET : retourne les prompts par défaut des 3 styles (pour édition en front) ─

export async function GET() {
  const agents = Object.fromEntries(
    AGENT_ORDER.map((id) => [
      id,
      { name: AGENTS[id].name, prompts: { ...AGENTS[id].prompts } },
    ])
  ) as Record<AgentId, { name: string; prompts: Record<AgentStyle, string> }>;
  return Response.json({ agents });
}

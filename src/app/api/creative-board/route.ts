import Anthropic from '@anthropic-ai/sdk';
import { jsonrepair } from 'jsonrepair';
import { computeGenerationCost } from '@/lib/api-cost';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─── Types d'events streamés au front ────────────────────────────────────────

export type BoardEvent =
  | { type: 'orchestrator'; text: string }
  | { type: 'handoff'; from: string; to: AgentId; reason: string }
  | { type: 'agent_start'; agent: AgentId }
  | { type: 'agent_chunk'; agent: AgentId; text: string }
  | { type: 'agent_done'; agent: AgentId }
  | { type: 'awaiting_selection'; ideas: { title: string; body: string }[]; scores?: { index: number; total: number; flags?: string[] }[] }
  | { type: 'report'; text: string; data?: CreativeStrategyReport }
  | { type: 'error'; message: string };

export type AgentId = 'strategist' | 'bigidea' | 'architect' | 'copywriter' | 'devil' | 'yam';

/** Score de confiance par section (Phase 3 — Confidence Auditor) */
export interface SectionConfidence {
  score: number;
  flags: string[];
  /** Résumé de la vérification web (uniquement Stratège et Architecte) */
  factCheck?: string;
}

export interface CreativeStrategyReport {
  version: 2;
  generatedAt: string;
  strategist: { sections: { heading: string; body: string; quote?: string }[] } | string | null;
  selectedIdea: { title: string; body: string } | null;
  architect: Record<string, unknown> | string | null;
  copywriter: { territory: string; manifesto: string; taglines: { text: string; note?: string }[] } | string | null;
  devil: { points: string[]; questions: { question: string; piste: string }[] } | string | null;
  yam: Record<string, unknown> | string | null;
  /** Score de confiance par section — Phase 3 (Confidence Auditor + web fact-check) */
  confidence?: {
    strategist?: SectionConfidence;
    architect?: SectionConfidence;
    copywriter?: SectionConfidence;
    devil?: SectionConfidence;
    yam?: SectionConfidence;
  };
}

function tryParseJson<T>(text: string, extractFromMarkdown = false): T | null {
  let raw = text.trim();
  if (extractFromMarkdown) {
    const firstBrace = raw.indexOf('{');
    const lastBrace = raw.lastIndexOf('}');
    if (firstBrace === -1 || lastBrace <= firstBrace) return null;
    raw = raw.substring(firstBrace, lastBrace + 1);
  }
  try {
    return JSON.parse(raw) as T;
  } catch {
    try {
      return JSON.parse(jsonrepair(raw)) as T;
    } catch {
      return null;
    }
  }
}

export type AgentStyle = 'corporate' | 'audacieux' | 'subversif';

const AGENT_ORDER: AgentId[] = ['strategist', 'bigidea', 'architect', 'copywriter', 'devil', 'yam'];

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

Ton style : professionnel, factuel, rassurant. Livre une synthèse actionnable.

Format de sortie OBLIGATOIRE : réponds UNIQUEMENT avec un JSON valide, sans markdown :
{"sections":[{"heading":"string","body":"string","quote":"string (optionnel)"}]}`,
      audacieux: `Tu es un stratège de marque (brand strategy, positionnement). Posture analytique avec une pointe d'audace : tu cherches la faille — ce que le marché n'a pas encore formulé.

Règle obligatoire : tu DOIS faire au moins une recherche web avant de rédiger. Ta première action : appeler web_search (concurrents, tendances, données récentes en lien avec le brief). Ne rédige ta synthèse qu'après avoir intégré les résultats. Cite tes sources.

Tu analyses le brief + le web pour en sortir :
- La tension fondamentale (ce qui frotte, ce qui résiste)
- L'opportunité non-évidente (le positionnement qui déstabilise positivement)
- La conviction stratégique centrale (une phrase tranchante)

Sois court, radical, utile.

Format de sortie OBLIGATOIRE : réponds UNIQUEMENT avec un JSON valide, sans markdown :
{"sections":[{"heading":"string","body":"string","quote":"string (optionnel)"}]}`,
      subversif: `Tu es un stratège qui assume de tout casser. Tu cherches ce que la marque n'ose pas dire et ce que le marché ne veut pas entendre.

Règle obligatoire : tu DOIS effectuer au moins une recherche web avant de rédiger. Appelle web_search en premier (concurrents, tendances, controverses, données). Ne rédige pas ta thèse sans avoir intégré les résultats. Cite tes sources.

Tu sors du brief + du web :
- Le non-dit (ce qu'on évite parce que ça dérange)
- L'angle qui fâche (mais qui pourrait tout débloquer)
- Une thèse en une phrase, assumée jusqu'au bout

Ton style : provocateur intelligent. Pas d'édulcorant.

Format de sortie OBLIGATOIRE : réponds UNIQUEMENT avec un JSON valide, sans markdown :
{"sections":[{"heading":"string","body":"string","quote":"string (optionnel)"}]}`,
    },
  },
  bigidea: {
    name: 'Le Concepteur',
    prompts: {
      corporate: `Tu es le concepteur : big idea, territoire de marque. Posture professionnelle. À partir de la tension stratégique, tu proposes 10 à 15 directions créatives solides et réalisables, avec des angles variés (tonalité, promesse, cible secondaire, format, etc.).

Format OBLIGATOIRE : réponds UNIQUEMENT avec un JSON valide, sans markdown :
{"ideas":[{"title":"Titre en 3-5 mots","body":"2-3 phrases : idée, bénéfice, faisabilité","angle":"optionnel : angle principal"}]}

Propose entre 10 et 15 idées. Style : professionnel, clair, facile à pitcher en comité.`,
      audacieux: `Tu es le concepteur : big idea, territoire de marque. Posture visionnaire, abstraite. Ton job : trouver LA grande idée qui dépasse le brief sans le trahir. Tu travailles à partir de la tension stratégique. Tu cherches un angle qui surprend. Propose 10 à 15 idées de rupture avec des angles variés.

Format OBLIGATOIRE : réponds UNIQUEMENT avec un JSON valide, sans markdown :
{"ideas":[{"title":"Titre percutant en 3-5 mots","body":"2-3 phrases. L'idée, ce qu'elle déverrouille, pourquoi c'est inattendu","angle":"optionnel"}]}

Interdits : idées "digitales d'abord", campagnes à hashtag, manifestes vides. Tu vises l'inattendu juste.`,
      subversif: `Tu es le concepteur d'idées qui dérangent. À partir de la tension stratégique, tu proposes 10 à 15 angles volontairement décalés, voire controversés — mais défendables. Varié : tonalité, promesse, cible secondaire.

Format OBLIGATOIRE : réponds UNIQUEMENT avec un JSON valide, sans markdown :
{"ideas":[{"title":"Titre percutant","body":"2-3 phrases. Pourquoi ça bouscule, pourquoi ça peut marcher","angle":"optionnel"}]}

Tu ne joues pas la sécurité. Tu proposes ce qu'on n'oserait pas présenter tel quel — mais qu'on pourrait adapter.`,
    },
  },
  architect: {
    name: "L'Architecte",
    prompts: {
      corporate: `Tu es l'Architecte de Marque. Tu construis les fondations solides de la plateforme de marque.

Tu dois impérativement répondre au format JSON strict, sans markdown autour (pas de \`\`\`json).
Structure attendue :
{
  "the_battlefield": {
    "status_quo": "État actuel du marché (ennuyeux/cassé)",
    "the_enemy": "L'ennemi conceptuel (pas un concurrent)",
    "the_gap": "Ce que personne ne fait"
  },
  "the_hero_and_villain": {
    "the_cult_member": "Le client idéal (psychographie)",
    "the_anti_persona": "Le client qu'on refuse"
  },
  "core_identity": {
    "origin_story": "L'histoire fondatrice",
    "radical_promise": "Promesse audacieuse",
    "archetype_mix": { "dominant": "...", "twist": "..." }
  },
  "expression_matrix": {
    "is_vs_is_not": [
      { "is": "...", "is_not": "..." },
      { "is": "...", "is_not": "..." },
      { "is": "...", "is_not": "..." }
    ],
    "vocabulary_trigger_words": ["mot1", "mot2", "mot3"],
    "banned_words": ["mot_interdit1", "mot_interdit2"]
  },
  "the_manifesto": {
    "part_1_frustration": "On en a marre de...",
    "part_2_belief": "On croit que...",
    "part_3_solution": "Alors on a fait..."
  }
}

Style : Clair, institutionnel, pérenne.`,
      audacieux: `Tu es l'Architecte de Marque. Tu définis la colonne vertébrale d'une marque ambitieuse.

Tu dois impérativement répondre au format JSON strict, sans markdown autour (pas de \`\`\`json).
Structure attendue :
{
  "the_battlefield": {
    "status_quo": "État actuel du marché (ennuyeux/cassé)",
    "the_enemy": "L'ennemi conceptuel (pas un concurrent)",
    "the_gap": "Ce que personne ne fait"
  },
  "the_hero_and_villain": {
    "the_cult_member": "Le client idéal (psychographie)",
    "the_anti_persona": "Le client qu'on refuse"
  },
  "core_identity": {
    "origin_story": "L'histoire fondatrice",
    "radical_promise": "Promesse audacieuse",
    "archetype_mix": { "dominant": "...", "twist": "..." }
  },
  "expression_matrix": {
    "is_vs_is_not": [
      { "is": "...", "is_not": "..." },
      { "is": "...", "is_not": "..." },
      { "is": "...", "is_not": "..." }
    ],
    "vocabulary_trigger_words": ["mot1", "mot2", "mot3"],
    "banned_words": ["mot_interdit1", "mot_interdit2"]
  },
  "the_manifesto": {
    "part_1_frustration": "On en a marre de...",
    "part_2_belief": "On croit que...",
    "part_3_solution": "Alors on a fait..."
  }
}

Style : Inspirant, moteur, tourné vers l'action.`,
      subversif: `Tu es l'Architecte de Marque version radicale. Tu cherches la vérité crue.

Tu dois impérativement répondre au format JSON strict, sans markdown autour (pas de \`\`\`json).
Structure attendue :
{
  "the_battlefield": {
    "status_quo": "État actuel du marché (ennuyeux/cassé)",
    "the_enemy": "L'ennemi conceptuel (pas un concurrent)",
    "the_gap": "Ce que personne ne fait"
  },
  "the_hero_and_villain": {
    "the_cult_member": "Le client idéal (psychographie)",
    "the_anti_persona": "Le client qu'on refuse"
  },
  "core_identity": {
    "origin_story": "L'histoire fondatrice",
    "radical_promise": "Promesse audacieuse",
    "archetype_mix": { "dominant": "...", "twist": "..." }
  },
  "expression_matrix": {
    "is_vs_is_not": [
      { "is": "...", "is_not": "..." },
      { "is": "...", "is_not": "..." },
      { "is": "...", "is_not": "..." }
    ],
    "vocabulary_trigger_words": ["mot1", "mot2", "mot3"],
    "banned_words": ["mot_interdit1", "mot_interdit2"]
  },
  "the_manifesto": {
    "part_1_frustration": "On en a marre de...",
    "part_2_belief": "On croit que...",
    "part_3_solution": "Alors on a fait..."
  }
}

Style : Tranchant, sans jargon corporate.`,
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

Style : soigné, positif, sans prise de risque excessive. Pas de second degré déstabilisant.

Format de sortie OBLIGATOIRE : réponds UNIQUEMENT avec un JSON valide, sans markdown :
{"territory":"string","manifesto":"string","taglines":[{"text":"string","note":"string (optionnel)"}]}`,
      audacieux: `Tu es le copywriter : tone of voice, taglines, textes. Posture instinctive, rythme, mots. Tu as un sale goût pour les mots qui font quelque chose — pas les mots qui font bien, les mots qui font vrai (ou faux d'une façon intéressante).

Tu reçois une tension stratégique et un angle créatif retenu. Tu les traduis en langage.

Tu livres :
- 1 territoire de ton (une attitude — comment cette marque parle, pense, respire)
- 1 manifeste de 5-7 lignes (rythme impeccable, zero boursouflure)
- 3 taglines candidates (dont au moins une qui fait lever un sourcil)

Ton registre : intelligent, légèrement taquin — 5% d'ironie sèche. Jamais lourd. Toujours net.

Interdits : "Ensemble, construisons...", "L'humain au cœur de...", "Une nouvelle façon de vivre...".

Format de sortie OBLIGATOIRE : réponds UNIQUEMENT avec un JSON valide, sans markdown :
{"territory":"string","manifesto":"string","taglines":[{"text":"string","note":"string (optionnel)"}]}`,
      subversif: `Tu es un copywriter qui aime pousser les limites. Tu reçois la stratégie et l'angle créatif. Tu les traduis en langage qui dénote — assumé, parfois dérangeant, jamais neutre.

Tu livres :
- Un territoire de ton (attitude tranchée, voire provocante)
- Un manifeste court (5-7 lignes, qui assume ses positions)
- 3 taglines candidates (dont au moins une qui bouscule)

Tu peux jouer avec l'ironie, le double sens, le ton qui interpelle. Pas de langue de bois.

Format de sortie OBLIGATOIRE : réponds UNIQUEMENT avec un JSON valide, sans markdown :
{"territory":"string","manifesto":"string","taglines":[{"text":"string","note":"string (optionnel)"}]}`,
    },
  },
  devil: {
    name: "Devil's Advocate",
    prompts: {
      corporate: `Tu es le Devil's Advocate : tu challenges tout. Posture constructive mais exigeante. Tu lis tout ce qui précède et tu identifies :
- Les points à clarifier ou à renforcer
- Les risques (perception cible, concurrence)
- 2 questions que le client pourrait poser, avec des pistes de réponse

Ton ton : cynique en apparence, bienveillant au fond. Tu aides à solidifier le travail.

Format de sortie OBLIGATOIRE : réponds UNIQUEMENT avec un JSON valide, sans markdown :
{"points":["string"],"questions":[{"question":"string","piste":"string"}]}`,
      audacieux: `Tu es le Devil's Advocate : tu challenges tout. Posture cynique mais bienveillante — tu as le droit de dire que c'est nul, et tu t'en sers pour faire avancer.

Tu lis tout ce qui précède. Tu cherches :
- Ce qui sonne bien mais ne veut rien dire (le bullshit audit)
- Ce que la cible ne comprendra pas ou ne croira pas
- Ce que le concurrent le plus malin pourrait s'approprier demain
- Ce qui manque pour que ça tienne vraiment

Tu conclus avec 2 questions précises que le client va poser — et une piste pour y répondre. Ton ton : direct, un peu sec, cynique mais bienveillant. Tu veux que ça marche.

Format de sortie OBLIGATOIRE : réponds UNIQUEMENT avec un JSON valide, sans markdown :
{"points":["string"],"questions":[{"question":"string","piste":"string"}]}`,
      subversif: `Tu es le Devil's Advocate : tu challenges tout. Posture cynique, bienveillante malgré tout. Tu lis tout ce qui précède et tu attaques — proprement mais sans complaisance.

Tu pointes :
- Le bullshit, les formules vides, ce qui ne résiste pas à une lecture méchante
- Les angles morts (ce qu'on n'a pas osé trancher)
- 2 questions que le client va poser et auxquelles le board n'a pas encore répondu

Cynique en forme, bienveillant en intention : tu vises à ce que le travail tienne face à un client difficile.

Format de sortie OBLIGATOIRE : réponds UNIQUEMENT avec un JSON valide, sans markdown :
{"points":["string"],"questions":[{"question":"string","piste":"string"}]}`,
    },
  },
  yam: {
    name: 'Yam',
    prompts: {
      corporate: `Tu es Yam — directeur de création publicitaire, concepteur-rédacteur de haut niveau. Tu penses en concepts, pas en mots. Tu n'es pas un assistant : tu es un partenaire créatif avec un point de vue fort.

Tu reçois le travail complet du board (stratégie, angle, plateforme de marque, copy, points Devil). Ta mission : relire le tout et apporter ta touche. **Adapte ton niveau d'intervention** :
- **Mode concept complet** : concept + visuel + accroche + pourquoi (quand une idée visuelle s'impose)
- **Mode copywriter secondaire** : accroches, variantes de taglines, affinages de formulation — sans visuel ni concept détaillé (quand le board a surtout besoin d'un coup de polish sur le copy)

Tu n'es jamais forcé de produire un visuel. Si le board a surtout besoin d'un second regard copy, propose des touches légères (accroche + optionnellement pourquoi ou note).

**Règles** : Économie maximale. Pas de superlatif vide. Propose avec conviction, pas d'anxiété.

**Style corporate** : Ton professionnel, rassurant. La provocation est légère, calculée.

Format de sortie OBLIGATOIRE : réponds UNIQUEMENT avec un JSON valide, sans markdown. Chaque touche doit avoir au minimum "accroche". concept, visuel, pourquoi sont optionnels :
{"touches":[{"accroche":"string obligatoire","concept":"string (optionnel)","visuel":"string (optionnel)","pourquoi":"string (optionnel)"}],"commentaire":"string (optionnel)"}`,
      audacieux: `Tu es Yam — directeur de création publicitaire, concepteur-rédacteur de haut niveau. Tu penses en concepts, pas en mots. Tu n'es pas un assistant : tu es un partenaire créatif avec un point de vue fort.

Tu reçois le travail complet du board (stratégie, angle, plateforme de marque, copy, points Devil). Ta mission : relire le tout et apporter ta touche. **Adapte ton niveau d'intervention** :
- **Mode concept complet** : concept + visuel + accroche + pourquoi (quand une idée visuelle s'impose)
- **Mode copywriter secondaire** : accroches, variantes de taglines, affinages — sans visuel ni concept (quand le board a besoin d'un coup de polish sur le copy)

Tu n'es jamais forcé de produire un visuel. Si le board a surtout besoin d'un second regard copy, propose des touches légères (accroche + optionnellement pourquoi).

**Règles** : Économie maximale. La provocation dosée : un mot inattendu, un registre décalé — assez pour piquer, jamais assez pour brûler. Propose avec conviction.

**Style audacieux** : Tu prends des micro-risques calculés. Le décalé est assumé.

Format de sortie OBLIGATOIRE : réponds UNIQUEMENT avec un JSON valide, sans markdown. Chaque touche : accroche obligatoire ; concept, visuel, pourquoi optionnels :
{"touches":[{"accroche":"string obligatoire","concept":"string (optionnel)","visuel":"string (optionnel)","pourquoi":"string (optionnel)"}],"commentaire":"string (optionnel)"}`,
      subversif: `Tu es Yam — directeur de création publicitaire, concepteur-rédacteur de haut niveau. Tu penses en concepts, pas en mots. Tu n'es pas un assistant : tu es un partenaire créatif avec un point de vue fort.

Tu reçois le travail complet du board (stratégie, angle, plateforme de marque, copy, points Devil). Ta mission : relire le tout et apporter ta touche. **Adapte ton niveau d'intervention** :
- **Mode concept complet** : concept + visuel + accroche + pourquoi (quand une idée visuelle s'impose)
- **Mode copywriter secondaire** : accroches, variantes, affinages — sans visuel ni concept (quand le board a besoin d'un second regard copy)

Tu n'es jamais forcé de produire un visuel. Si le board a surtout besoin d'un coup de polish sur le copy, propose des touches légères.

**Règles** : Économie maximale. Jamais illustrer le brief au premier degré. La collision de registres est un outil. Propose avec conviction. Ne jamais expliquer l'humour.

**Style subversif** : Tu pousses la provocation plus loin. Irrévérencieux envers les conventions, respectueux envers l'intelligence du lecteur.

Format de sortie OBLIGATOIRE : réponds UNIQUEMENT avec un JSON valide, sans markdown. Chaque touche : accroche obligatoire ; concept, visuel, pourquoi optionnels :
{"touches":[{"accroche":"string obligatoire","concept":"string (optionnel)","visuel":"string (optionnel)","pourquoi":"string (optionnel)"}],"commentaire":"string (optionnel)"}`,
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

// ─── Parser BigIdea output → idées structurées ────────────────────────────────

/** Phase 2 : parse JSON (10-15 idées), fallback Markdown (3 idées) */
function parseBigIdeas(text: string): { title: string; body: string }[] {
  const parsed = tryParseJson<{ ideas: { title: string; body?: string; angle?: string }[] }>(text, true);
  if (parsed?.ideas && Array.isArray(parsed.ideas) && parsed.ideas.length > 0) {
    return parsed.ideas.map((i) => ({
      title: String(i.title ?? '').trim(),
      body: String(i.body ?? '').trim(),
    })).filter((i) => i.title.length > 0);
  }
  // Fallback : ancien format Markdown (3 idées)
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

const SCORER_SYSTEM_PROMPT = `Tu es un Scorer pour un board créatif. Tu évalues chaque idée créative proposée selon :
- Alignement brief (40 pts) : cohérence avec la tension stratégique et le brief client
- Différenciation (30 pts) : originalité, angle non-évident
- Exécutabilité (30 pts) : faisabilité, clarté

Détecte aussi le bullshit, les clichés, les formules vides. Ajoute des flags si pertinent : [BULLSHIT], [CLICHÉ], [TROP VAQUE], etc.

Format de sortie OBLIGATOIRE : réponds UNIQUEMENT avec un JSON valide, sans markdown :
{"scores":[{"index":0,"total":number,"breakdown":{"alignement":number,"differentiation":number,"executabilite":number},"flags":["optionnel"]}]}

index = indice de l'idée (0-based). total = score final 0-100.`;

const AUDITOR_SYSTEM_PROMPT = `Tu es un Confidence Auditor pour un board créatif d'agence. Tu évalues chaque section du rapport (Stratège, Architecte, Copywriter, Devil) et tu vérifies les faits via recherche web quand pertinent.

**1. Analyse textuelle** : pour chaque section, score 0-100 (densité info, cohérence, complétude). Flags possibles : [À COMPLÉTER], [HYPOTHÈSE], [BESOIN VALIDATION], [BULLSHIT POTENTIEL].

**2. Fact-checking web** : UNIQUEMENT pour Stratège et Architecte. Tu DOIS faire au moins 1-2 recherches web pour :
- Stratège : vérifier les affirmations sur le marché, la concurrence, les chiffres mentionnés
- Architecte : vérifier le positionnement, la promesse, les tendances citées
- Détecter si données ou tendances obsolètes
- Confirmer ou infirmer les éléments vérifiables

**3. Flags additionnels** si web : [FAIT NON VÉRIFIÉ], [DÉPASSÉ], [CONTREDIT PAR SOURCES], [OK - SOURCES]

**4. factCheck** : pour Stratège et Architecte, fournis un résumé court en français (1-2 phrases) du résultat de ta vérification web. Ex. "Concurrence vérifiée, 2 sources alignées" ou "Positionnement X non trouvé dans les sources".

**Format de sortie** : réponds UNIQUEMENT avec un JSON valide, sans markdown :
{
  "sections": {
    "strategist": { "score": number, "flags": string[], "factCheck": "string (optionnel)" },
    "architect": { "score": number, "flags": string[], "factCheck": "string (optionnel)" },
    "copywriter": { "score": number, "flags": string[] },
    "devil": { "score": number, "flags": string[] },
    "yam": { "score": number, "flags": string[] }
  }
}`;

// ─── Helper : stream un agent et émet ses chunks ──────────────────────────────

type TokenUsage = { input_tokens: number; output_tokens: number };

async function runAgent(
  agentId: AgentId,
  systemPrompt: string,
  userMessage: string,
  emit: (event: BoardEvent) => void
): Promise<{ fullText: string; usage?: TokenUsage }> {
  emit({ type: 'agent_start', agent: agentId });

  let fullText = '';
  let usage: TokenUsage | undefined;

  const isStrategist = agentId === 'strategist';
  const isArchitect = agentId === 'architect';
  const isBigidea = agentId === 'bigidea';
  const isYam = agentId === 'yam';
  const stream = client.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: isStrategist || isArchitect ? 4096 : isBigidea ? 2500 : isYam ? 2048 : 700,
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
    if (event.type === 'message_delta' && 'usage' in event) {
      const u = (event as { usage?: { input_tokens?: number; output_tokens?: number } }).usage;
      if (u) usage = { input_tokens: u.input_tokens ?? 0, output_tokens: u.output_tokens ?? 0 };
    }
  }

  emit({ type: 'agent_done', agent: agentId });
  return { fullText, usage };
}

/** Phase 2 : Scorer — évalue les idées, retourne scores triés (top 5) */
async function runScorerAgent(
  brief: string,
  strategistOutput: string,
  ideas: { title: string; body: string }[]
): Promise<{ topIdeas: { title: string; body: string }[]; scores: { index: number; total: number; flags?: string[] }[] }> {
  if (ideas.length === 0) return { topIdeas: [], scores: [] };
  const ideasStr = ideas.map((i, idx) => `[${idx}] ${i.title}\n${i.body}`).join('\n\n');

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    system: SCORER_SYSTEM_PROMPT,
    messages: [{
      role: 'user',
      content: `Brief : ${brief.slice(0, 1500)}\n\nTension stratégique :\n${strategistOutput.slice(0, 2000)}\n\n--- Idées à scorer ---\n${ideasStr}\n\nScore chaque idée. Retourne le JSON.`,
    }],
  });

  const textBlock = message.content.find((b) => b.type === 'text');
  const rawText = (textBlock && 'text' in textBlock ? (textBlock as { text: string }).text : '') ?? '';
  const parsed = tryParseJson<{ scores: { index: number; total: number; breakdown?: Record<string, number>; flags?: string[] }[] }>(rawText, true);
  if (!parsed?.scores?.length) return { topIdeas: ideas.slice(0, 5), scores: [] };

  const withScores = parsed.scores
    .filter((s) => s.index >= 0 && s.index < ideas.length)
    .map((s) => ({ idea: ideas[s.index], score: s.total, flags: s.flags ?? [] }));
  withScores.sort((a, b) => b.score - a.score);
  const top5 = withScores.slice(0, 5);

  return {
    topIdeas: top5.map((x) => x.idea),
    scores: top5.map((x) => ({
      index: ideas.indexOf(x.idea),
      total: x.score,
      flags: x.flags.length ? x.flags : undefined,
    })),
  };
}

/** Exécute le Confidence Auditor avec web fact-checking. Indépendant du Devil. Retourne { confidence, usage }. */
async function runConfidenceAuditor(
  brief: string,
  reportData: Omit<CreativeStrategyReport, 'confidence'>
): Promise<{ confidence: CreativeStrategyReport['confidence']; usage?: { input_tokens: number; output_tokens: number } }> {
  const strategistText =
    typeof reportData.strategist === 'object' && reportData.strategist?.sections
      ? reportData.strategist.sections.map((s) => `### ${s.heading}\n${s.body}`).join('\n\n')
      : String(reportData.strategist ?? '');
  const architectText =
    typeof reportData.architect === 'object'
      ? JSON.stringify(reportData.architect)
      : String(reportData.architect ?? '');
  const copy = reportData.copywriter;
  const copywriterText =
    copy && typeof copy === 'object' && 'territory' in copy
      ? `${copy.territory}\n${copy.manifesto}\n${(copy.taglines ?? []).map((t) => t.text).join('\n')}`
      : String(copy ?? '');
  const dev = reportData.devil;
  const devilText =
    dev && typeof dev === 'object' && 'points' in dev
      ? `${(dev.points ?? []).join('\n')}\n${(dev.questions ?? []).map((q) => `${q.question}\n${q.piste}`).join('\n\n')}`
      : String(dev ?? '');
  const yam = reportData.yam;
  const yamText = yam && typeof yam === 'object' ? JSON.stringify(yam) : String(yam ?? '');

  const userContent = `Brief client : ${brief.slice(0, 2000)}

--- STRATÈGE ---
${strategistText || '(vide)'}

--- ARCHITECTE ---
${architectText || '(vide)'}

--- COPYWRITER ---
${copywriterText || '(vide)'}

--- DEVIL ---
${devilText || '(vide)'}

--- YAM ---
${yamText || '(vide)'}

Évalue chaque section. Pour Stratège et Architecte, effectue des recherches web pour vérifier les faits (marché, concurrence, positionnement). Retourne le JSON requis.`;

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    system: AUDITOR_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userContent }],
    tools: STRATEGIST_TOOLS,
  });

  const textParts = message.content.filter((b) => b.type === 'text' && 'text' in b).map((b) => (b as { text: string }).text);
  const rawText = textParts.join('\n').trim();
  const parsed = tryParseJson<{ sections: Record<string, { score: number; flags: string[]; factCheck?: string }> }>(rawText, true);
  if (!parsed?.sections) return { confidence: undefined };

  const conf = parsed.sections;
  const confidence: CreativeStrategyReport['confidence'] = {
    ...(conf.strategist && { strategist: { score: conf.strategist.score, flags: conf.strategist.flags ?? [], factCheck: conf.strategist.factCheck } }),
    ...(conf.architect && { architect: { score: conf.architect.score, flags: conf.architect.flags ?? [], factCheck: conf.architect.factCheck } }),
    ...(conf.copywriter && { copywriter: { score: conf.copywriter.score, flags: conf.copywriter.flags ?? [] } }),
    ...(conf.devil && { devil: { score: conf.devil.score, flags: conf.devil.flags ?? [] } }),
    ...(conf.yam && { yam: { score: conf.yam.score, flags: conf.yam.flags ?? [] } }),
  };
  return { confidence, usage: message.usage };
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
            const strategistRes = await runAgent(
              'strategist',
              resolvePrompt('strategist', style('strategist')),
              strategistMessage,
              emit
            );
            strategistOut = strategistRes.fullText;
          }

          if (enabledSet.has('bigidea')) {
            emit({
              type: 'orchestrator',
              text: 'Tension posée. Génération des directions créatives…',
            });
            emit({ type: 'handoff', from: 'Orchestrateur', to: 'bigidea', reason: '10-15 directions' });
            const bigideaRes = await runAgent(
              'bigidea',
              resolvePrompt('bigidea', style('bigidea')),
              `Brief client : ${brief}\n\nTension stratégique :\n${strategistOut || '(non fournie)'}`,
              emit
            );
            const allIdeas = parseBigIdeas(bigideaRes.fullText);
            let ideasToShow = allIdeas;
            let scores: { index: number; total: number; flags?: string[] }[] | undefined;
            if (allIdeas.length > 5) {
              emit({ type: 'orchestrator', text: 'Scoring des idées… Top 5 bientôt prêt.' });
              const { topIdeas, scores: scorerScores } = await runScorerAgent(brief, strategistOut, allIdeas);
              ideasToShow = topIdeas;
              scores = scorerScores;
            }
            emit({
              type: 'orchestrator',
              text: ideasToShow.length <= 5 ? 'À vous de choisir.' : 'Top 5 — à vous de choisir.',
            });
            emit({ type: 'awaiting_selection', ideas: ideasToShow, scores });
          } else {
            // Pas de Big Idea : pas de sélection, on considère phase 1 terminée sans idées
            emit({ type: 'orchestrator', text: 'Phase 1 terminée (Big Idea désactivé).' });
          }
        } else {
          // ── Phase 2 : Architecte (si activé) → Copywriter (si activé) → Devil (si activé) → rapport ──

          let architectOut = '';
          let architectRes: { fullText: string; usage?: TokenUsage } | null = null;
          let copywriterRes: { fullText: string; usage?: TokenUsage } | null = null;
          let devilRes: { fullText: string; usage?: TokenUsage } | null = null;
          if (enabledSet.has('architect')) {
            emit({
              type: 'orchestrator',
              text: 'L\'Architecte pose les fondations de la plateforme.',
            });
            emit({ type: 'handoff', from: 'Orchestrateur', to: 'architect', reason: 'Vision, Mission, Valeurs, Promesse' });
            architectRes = await runAgent(
              'architect',
              resolvePrompt('architect', style('architect')),
              `Brief client : ${brief}\n\nTension stratégique :\n${prevStrategist}\n\nAngle créatif retenu :\n${selectedIdea}`,
              emit
            );
            architectOut = architectRes.fullText;
          }

          let copywriterOut = '';
          if (enabledSet.has('copywriter')) {
            emit({
              type: 'orchestrator',
              text: 'Direction retenue. Au copywriter de lui donner sa voix.',
            });
            emit({ type: 'handoff', from: 'Orchestrateur', to: 'copywriter', reason: 'Territoire de ton, manifeste, taglines' });
            copywriterRes = await runAgent(
              'copywriter',
              resolvePrompt('copywriter', style('copywriter')),
              `Brief client : ${brief}\n\nTension stratégique :\n${prevStrategist}\n\nAngle créatif retenu :\n${selectedIdea}`,
              emit
            );
            copywriterOut = copywriterRes.fullText;
          }

          let devilOut = '';
          if (enabledSet.has('devil')) {
            emit({
              type: 'orchestrator',
              text: 'Le Devil passe tout au crible.',
            });
            emit({ type: 'handoff', from: 'Orchestrateur', to: 'devil', reason: 'Bullshit audit + questions client' });
            devilRes = await runAgent(
              'devil',
              resolvePrompt('devil', style('devil')),
              `Brief client : ${brief}\n\nTension stratégique :\n${prevStrategist}\n\nAngle créatif retenu :\n${selectedIdea}\n\nPlateforme de marque :\n${architectOut}\n\nProposition copy :\n${copywriterOut}`,
              emit
            );
            devilOut = devilRes.fullText;
          }

          let yamOut = '';
          let yamRes: { fullText: string; usage?: TokenUsage } | null = null;
          if (enabledSet.has('yam')) {
            emit({
              type: 'orchestrator',
              text: 'Yam relit le tout et apporte sa touche.',
            });
            emit({ type: 'handoff', from: 'Orchestrateur', to: 'yam', reason: 'Relecture finale et touche Yam' });
            const fullContext = [
              `Brief client : ${brief}`,
              `Tension stratégique :\n${prevStrategist}`,
              `Angle créatif retenu :\n${selectedIdea}`,
              architectOut && `Plateforme de marque :\n${architectOut}`,
              copywriterOut && `Proposition copy :\n${copywriterOut}`,
              devilOut && `Points Devil :\n${devilOut}`,
            ].filter(Boolean).join('\n\n---\n\n');
            yamRes = await runAgent(
              'yam',
              resolvePrompt('yam', style('yam')),
              fullContext,
              emit
            );
            yamOut = yamRes.fullText;
          }

          emit({ type: 'orchestrator', text: 'Board terminé.' });

          const parsedStrategist = prevStrategist
            ? tryParseJson<{ sections: { heading: string; body: string; quote?: string }[] }>(prevStrategist, true)
            : null;
          const parsedArchitect = architectOut
            ? tryParseJson<Record<string, unknown>>(architectOut, true) ?? architectOut
            : null;
          const parsedCopywriter = copywriterOut
            ? tryParseJson<{ territory: string; manifesto: string; taglines: { text: string; note?: string }[] }>(copywriterOut, true)
            : null;
          const parsedDevil = devilOut
            ? tryParseJson<{ points: string[]; questions: { question: string; piste: string }[] }>(devilOut, true)
            : null;
          const parsedYam = yamOut
            ? tryParseJson<Record<string, unknown>>(yamOut, true) ?? yamOut
            : null;

          const selectedIdeaParts = typeof selectedIdea === 'string' && selectedIdea
            ? (() => {
                const idx = selectedIdea.indexOf('\n\n');
                return idx === -1
                  ? { title: selectedIdea.trim(), body: '' }
                  : { title: selectedIdea.slice(0, idx).trim(), body: selectedIdea.slice(idx + 2).trim() };
              })()
            : null;

          const reportData: CreativeStrategyReport = {
            version: 2,
            generatedAt: new Date().toISOString(),
            strategist: parsedStrategist ?? prevStrategist ?? null,
            selectedIdea: selectedIdeaParts,
            architect: parsedArchitect,
            copywriter: parsedCopywriter ?? copywriterOut ?? null,
            devil: parsedDevil ?? devilOut ?? null,
            yam: parsedYam ?? yamOut ?? null,
          };

          // Phase 3 : Confidence Auditor (web fact-check) — s'exécute même si Devil désactivé
          emit({
            type: 'orchestrator',
            text: 'Vérification des sources et scoring de confiance… (30-60 s)',
          });
          let totalInput = 0;
          let totalOutput = 0;
          [architectRes, copywriterRes, devilRes, yamRes].forEach((r) => {
            if (r?.usage) {
              totalInput += r.usage.input_tokens;
              totalOutput += r.usage.output_tokens;
            }
          });
          try {
            const auditorResult = await runConfidenceAuditor(brief, reportData);
            if (auditorResult.confidence) reportData.confidence = auditorResult.confidence;
            if (auditorResult.usage) {
              totalInput += auditorResult.usage.input_tokens;
              totalOutput += auditorResult.usage.output_tokens;
            }
          } catch {
            // Ne pas bloquer le rapport si l'Auditor échoue
          }
          const cost = computeGenerationCost(totalInput, totalOutput);
          (reportData as unknown as Record<string, unknown>)._meta = { generationCost: cost };

          const reportParts = [
            '## Synthèse du Board Créatif',
            prevStrategist && '### Tension stratégique\n' + prevStrategist,
            selectedIdea && '### Angle retenu\n' + selectedIdea,
            architectOut && '### Plateforme de Marque\n' + architectOut,
            copywriterOut && '### Territoire & Copy\n' + copywriterOut,
            devilOut && '### Points de vigilance\n' + devilOut,
            yamOut && '### Touche Yam\n' + yamOut,
          ].filter(Boolean);
          emit({ type: 'report', text: reportParts.join('\n\n'), data: reportData });
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

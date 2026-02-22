import Anthropic from '@anthropic-ai/sdk';
import { jsonrepair } from 'jsonrepair';
import type { RetroplanningTaskColor } from '@/types';
import { computeDatesFromDeadline } from '@/lib/retroplanning-utils';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `Tu es un chef de projet senior dans une agence creative. Tu recois le contenu d'un brief client et une date de livraison finale. Tu generes un retroplanning : liste ordonnee d'etapes du debut du projet a la fin. Tu adaptes les etapes au type de projet (site web, identite visuelle, video, campagne...). Aucun template fixe : tu lis le brief et deduis ce qui est necessaire.

## Format de sortie

Tu reponds UNIQUEMENT avec un bloc <structured_output> contenant un tableau JSON d'etapes.

<structured_output>
[
  {
    "id": "uuid-v4",
    "label": "Nom de l'etape",
    "durationDays": 5,
    "color": "cyan"
  }
]
</structured_output>

## Regles

- Entre 4 et 10 etapes maximum.
- Les etapes sont ordonnees du debut du projet (index 0) a la fin.
- durationDays = estimation en jours calendaires (pas de dates absolues).
- color : une parmi "cyan", "lime", "violet", "coral", "amber", "magenta". Varie les couleurs.
- id : genere un identifiant unique (ex: "step-1", "step-2", etc.).
- Ne retourne PAS de dates absolues — seulement durationDays.
- Adapte les etapes au type de projet detecte dans le brief.`;

type RawTask = {
  id?: string;
  label: string;
  durationDays: number;
  color?: string;
};

const VALID_COLORS: RetroplanningTaskColor[] = ['cyan', 'lime', 'violet', 'coral', 'amber', 'magenta'];
const COLOR_CYCLE = VALID_COLORS;

function extractTasksFromResponse(text: string): RawTask[] {
  const match = text.match(/<structured_output>([\s\S]*?)<\/structured_output>/i);
  const raw = match ? match[1].trim() : text;
  const firstBracket = raw.indexOf('[');
  const lastBracket = raw.lastIndexOf(']');
  if (firstBracket === -1 || lastBracket <= firstBracket) {
    throw new Error('Tableau JSON non trouvé dans la réponse');
  }
  const jsonStr = raw.substring(firstBracket, lastBracket + 1);
  try {
    return JSON.parse(jsonStr) as RawTask[];
  } catch (e1) {
    try {
      return JSON.parse(jsonrepair(jsonStr)) as RawTask[];
    } catch (e2) {
      const m1 = e1 instanceof Error ? e1.message : String(e1);
      const m2 = e2 instanceof Error ? e2.message : String(e2);
      throw new Error(`JSON invalide: ${m1}. Repair: ${m2}`);
    }
  }
}

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: 'ANTHROPIC_API_KEY manquante.' }, { status: 500 });
  }

  const body = (await req.json()) as {
    briefContent: string;
    deadline: string;
    clientName?: string;
  };

  const { briefContent, deadline, clientName } = body;

  if (!briefContent?.trim()) {
    return Response.json({ error: 'briefContent est requis.' }, { status: 400 });
  }
  if (!deadline?.trim()) {
    return Response.json({ error: 'deadline est requis (format YYYY-MM-DD).' }, { status: 400 });
  }

  const truncatedBrief = briefContent.substring(0, 6000);
  const clientLabel = clientName?.trim() ? `Client : ${clientName.trim()}\n` : '';
  const userContent = `${clientLabel}Date de livraison finale : ${deadline}

Contenu du brief :
${truncatedBrief}

Génère le retroplanning pour ce projet.`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      temperature: 0.5,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userContent }],
    });

    const rawText = (message.content[0] as { type: string; text: string }).text;
    const rawTasks = extractTasksFromResponse(rawText);

    if (!Array.isArray(rawTasks) || rawTasks.length === 0) {
      throw new Error('La réponse IA ne contient pas de tâches valides.');
    }

    // Normalize tasks: ensure id and valid color
    const normalizedTasks = rawTasks.slice(0, 10).map((task, index) => ({
      id: task.id?.trim() || crypto.randomUUID(),
      label: task.label,
      durationDays: Math.max(1, Math.round(task.durationDays)),
      color: (VALID_COLORS.includes(task.color as RetroplanningTaskColor)
        ? task.color
        : COLOR_CYCLE[index % COLOR_CYCLE.length]) as RetroplanningTaskColor,
    }));

    // Compute dates backward from deadline
    const deadlineDate = new Date(deadline + 'T00:00:00Z');
    const tasks = computeDatesFromDeadline(normalizedTasks, deadlineDate);

    return Response.json({ tasks });
  } catch (err) {
    const msg = err instanceof Error ? err.message : typeof err === 'string' ? err : String(err);
    return Response.json({ error: msg || 'Erreur inconnue' }, { status: 500 });
  }
}

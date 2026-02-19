import Anthropic from '@anthropic-ai/sdk';
import { ReportPlaudTemplate } from '@/types/document-templates';

const SYSTEM_PROMPT = `Tu es un assistant expert en synthèse de réunions pour une agence créative.
Tu analyses des transcriptions de réunions (enregistrées via Plaud) et tu en extrais les informations clés.
Tu réponds UNIQUEMENT avec un JSON valide, sans markdown, sans commentaires, sans texte avant ou après.`;

const USER_PROMPT = (transcript: string) => `Analyse cette transcription de réunion et retourne un JSON respectant EXACTEMENT ce schéma TypeScript :

{
  version: 1,
  title: string,
  date: string,                            // YYYY-MM-DD, déduis du contexte ou aujourd'hui
  duration?: number,
  participants?: string[],                 // UNIQUEMENT des personnes physiques (prénom + nom). Ne PAS inclure : noms de sociétés, d'équipes ("Blue Conseil", "trois associés"), "Agence créative", ni le nom de l'agence qui anime (ex: YAM). Si seul un nom d'entreprise est mentionné, laisse participants vide ou mets uniquement les noms des personnes citées.
  summary: string,
  keyPoints: string[],
  actionItems: { text: string; assignee?: string }[],
  nextSteps?: string,
  transcriptionExcerpt?: string,
  suggestedDeliverables?: { name: string; type: "creative" | "document" | "other" }[],
  suggestedEvents?: { type: "deliverable" | "call"; label: string; date: string }[]
  // IMPORTANT : extraire TOUTES les dates mentionnées (rendu, atelier, réunion, call, deadline, "pour le 20 février", "réunion le 28 février", etc.).
  // type "deliverable" = date de rendu / livrable / atelier à livrer. type "call" = date de RDV / réunion / call.
  // date au format YYYY-MM-DD (déduire l'année du contexte ou de la date de la réunion). 5 à 12 événements si plusieurs dates dans le texte.
  // label = libellé court (ex: "Rendu maquettes", "Atelier 20 février", "Réunion suivi").
}

Transcription :
${transcript}`;

export async function POST(req: Request) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey?.trim()) {
      return Response.json(
        { error: 'Clé API Anthropic manquante. Ajoute ANTHROPIC_API_KEY dans ton .env.local (voir https://console.anthropic.com).' },
        { status: 503 }
      );
    }

    const { transcript } = (await req.json()) as { transcript: string };

    if (!transcript || typeof transcript !== 'string' || transcript.trim().length < 10) {
      return Response.json({ error: 'Transcription manquante ou trop courte.' }, { status: 400 });
    }

    const client = new Anthropic({ apiKey });
    const message = await client.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 8192,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: USER_PROMPT(transcript.trim()) }],
    });

    if (message.stop_reason === 'max_tokens') {
      return Response.json({ error: 'Transcription trop longue : la synthèse a été tronquée. Essaie avec un extrait plus court.' }, { status: 422 });
    }

    const rawText = (message.content[0] as { type: string; text: string }).text;

    // Nettoie le JSON si Claude a quand même ajouté des backticks
    const cleaned = rawText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();

    const parsed = JSON.parse(cleaned) as ReportPlaudTemplate;

    // Coût estimé — claude-sonnet-4-5 : $3/MTok input, $15/MTok output
    const costUsd = (message.usage.input_tokens * 3 + message.usage.output_tokens * 15) / 1_000_000;

    return Response.json({ ...parsed, _meta: { costUsd, inputTokens: message.usage.input_tokens, outputTokens: message.usage.output_tokens } });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    return Response.json({ error: `Analyse échouée : ${message}` }, { status: 500 });
  }
}

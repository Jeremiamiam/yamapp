import Anthropic from '@anthropic-ai/sdk';
import { ReportPlaudTemplate } from '@/types/document-templates';

const client = new Anthropic();

const SYSTEM_PROMPT = `Tu es un assistant expert en synthèse de réunions pour une agence créative.
Tu analyses des transcriptions de réunions (enregistrées via Plaud) et tu en extrais les informations clés.
Tu réponds UNIQUEMENT avec un JSON valide, sans markdown, sans commentaires, sans texte avant ou après.`;

const USER_PROMPT = (transcript: string) => `Analyse cette transcription de réunion et retourne un JSON respectant EXACTEMENT ce schéma TypeScript :

{
  version: 1,                              // toujours 1
  title: string,                           // titre court et descriptif de la réunion
  date: string,                            // format YYYY-MM-DD, déduis-la du contexte ou utilise aujourd'hui
  duration?: number,                       // durée en minutes si mentionnée
  participants?: string[],                 // noms des participants si mentionnés
  summary: string,                         // résumé en 3-5 phrases, clair et professionnel
  keyPoints: string[],                     // 3 à 7 points clés abordés
  actionItems: { text: string; assignee?: string }[],  // actions concrètes à faire
  nextSteps?: string,                      // prochaines étapes ou date de prochain RDV
  transcriptionExcerpt?: string,           // extrait le plus pertinent de la transcription (max 300 caractères)
  suggestedDeliverables?: { name: string; type: "creative" | "document" | "other" }[]
  // 0 à 5 livrables concrets détectés dans la conversation (ex: logo, site web, plaquette, vidéo...)
  // "creative" = création visuelle/audio/vidéo, "document" = doc écrit/présentation, "other" = autre
  // Laisser vide si aucun livrable clairement évoqué
}

Transcription :
${transcript}`;

export async function POST(req: Request) {
  try {
    const { transcript } = (await req.json()) as { transcript: string };

    if (!transcript || typeof transcript !== 'string' || transcript.trim().length < 10) {
      return Response.json({ error: 'Transcription manquante ou trop courte.' }, { status: 400 });
    }

    const message = await client.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: USER_PROMPT(transcript.trim()) }],
    });

    const rawText = (message.content[0] as { type: string; text: string }).text;

    // Nettoie le JSON si Claude a quand même ajouté des backticks
    const cleaned = rawText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();

    const parsed = JSON.parse(cleaned) as ReportPlaudTemplate;

    return Response.json(parsed);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    return Response.json({ error: `Analyse échouée : ${message}` }, { status: 500 });
  }
}

import { runBriefResearch } from '@/lib/brief-research';

export async function POST(req: Request) {
  const { rawTranscript } = (await req.json()) as { rawTranscript?: string };
  if (!rawTranscript?.trim()) return Response.json({ error: 'Transcription manquante.' }, { status: 400 });
  if (!process.env.ANTHROPIC_API_KEY) return Response.json({ error: 'ANTHROPIC_API_KEY manquante.' }, { status: 500 });
  try {
    const result = await runBriefResearch(rawTranscript);
    return Response.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erreur inconnue';
    return Response.json({ error: `Recherche échouée : ${msg}` }, { status: 500 });
  }
}

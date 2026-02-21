import Anthropic from '@anthropic-ai/sdk';

export type BriefResearchOutput = {
  landscapeConcurrentiel: string;
  tendancesMarche?: string[];
  sources?: string[];
};

const EXTRACT_SYSTEM = `Tu extrais les entités clés d'une transcription de réunion client pour une recherche web ciblée.
Retourne UNIQUEMENT un JSON valide, sans markdown : {"marque":"string","secteur":"string","concurrents":["string"]}
- marque : Nom de la marque/entreprise (1-3 mots)
- secteur : Secteur d'activité (ex: "agroalimentaire", "tech B2B")
- concurrents : Liste des concurrents explicitement nommés (tableau vide si aucun)`;

const RESEARCH_SYSTEM = `Tu es un analyste marché. Tu effectues des recherches web pour enrichir un brief créatif.
Tu DOIS faire au moins 2-3 recherches : positionnement marché de la marque, concurrents du secteur, tendances récentes.
Synthétise les résultats en un JSON : {"landscapeConcurrentiel":"string (synthèse 3-5 phrases)","tendancesMarche":["string"],"sources":["url ou titre"]}`;

const WEB_SEARCH_TOOLS = [{ name: 'web_search' as const, type: 'web_search_20260209' as const }];

export async function runBriefResearch(rawTranscript: string): Promise<BriefResearchOutput> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY manquante');

  const extract = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 256,
    system: EXTRACT_SYSTEM,
    messages: [{ role: 'user', content: `Transcription :\n${rawTranscript.slice(0, 3000)}\n\nExtrais marque, secteur, concurrents. JSON uniquement.` }],
  });
  const extractBlock = extract.content.find((b) => b.type === 'text' && 'text' in b);
  const extractText = (extractBlock ? (extractBlock as { text: string }).text : '').trim();
  const firstBrace = extractText.indexOf('{');
  const lastBrace = extractText.lastIndexOf('}');
  const extractJson = firstBrace >= 0 && lastBrace > firstBrace
    ? JSON.parse(extractText.slice(firstBrace, lastBrace + 1)) as { marque?: string; secteur?: string; concurrents?: string[] }
    : { marque: '', secteur: '', concurrents: [] as string[] };
  const marque = String(extractJson.marque ?? '').trim() || 'marque';
  const secteur = String(extractJson.secteur ?? '').trim() || 'secteur';
  const concurrents = Array.isArray(extractJson.concurrents) ? extractJson.concurrents.filter((c): c is string => typeof c === 'string') : [];

  const research = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    system: RESEARCH_SYSTEM,
    messages: [{
      role: 'user',
      content: `Recherche pour enrichir un brief créatif.
Marque : ${marque}
Secteur : ${secteur}
Concurrents mentionnés : ${concurrents.length ? concurrents.join(', ') : 'aucun'}

Effectue des recherches web sur : 1) positionnement marché de "${marque}", 2) concurrents et communication dans le secteur ${secteur}, 3) tendances ${secteur} 2024 2025.
Synthétise en JSON.`,
    }],
    tools: WEB_SEARCH_TOOLS,
  });

  const researchParts = research.content.filter((b) => b.type === 'text' && 'text' in b).map((b) => (b as { text: string }).text);
  const researchText = researchParts.join('\n').trim();
  const rFirst = researchText.indexOf('{');
  const rLast = researchText.lastIndexOf('}');
  const parsed = rFirst >= 0 && rLast > rFirst
    ? JSON.parse(researchText.slice(rFirst, rLast + 1)) as BriefResearchOutput
    : { landscapeConcurrentiel: '', tendancesMarche: [], sources: [] };

  return {
    landscapeConcurrentiel: parsed.landscapeConcurrentiel || '',
    tendancesMarche: parsed.tendancesMarche ?? [],
    sources: parsed.sources ?? [],
  };
}

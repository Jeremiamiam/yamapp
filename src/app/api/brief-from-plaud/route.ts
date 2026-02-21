import Anthropic from '@anthropic-ai/sdk';
import { jsonrepair } from 'jsonrepair';
import type { CreativeBriefTemplate } from '@/types/document-templates';
import { runBriefResearch } from '@/lib/brief-research';
import { computeGenerationCost } from '@/lib/api-cost';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `Tu es un stratège créatif qui prépare des briefs pour un board créatif IA.
Tu reçois une transcription brute de réunion client et tu en extrais un brief structuré, dense et honnête.

Ton travail : lire entre les lignes. Ce qui compte, c'est ce que le client pressent sans pouvoir le formuler — les hésitations, les frustrations, les non-dits, les contradictions entre ce qu'il dit et comment il le dit.

Extrais TOUT ce qui est dans la transcription. Ne mets [À COMPLÉTER] que si l'info est vraiment absente. Préfère une formulation synthétique à [À COMPLÉTER].

Tu réponds UNIQUEMENT avec un JSON valide, sans markdown autour. Format complet (champs optionnels : omit si absent) :
{"version":1,"marque":"","personnalitePerque":"","cible":"","tensionComportementale":"","projet":"","vraiProbleme":"","contexteConcurrentiel":"","contraintes":"","ambition":"","tonInterdit":"","supports":[],"contraintesOperationnelles":"","angleSecteur":""}

Si un bloc "Contexte web" est fourni, ajoute competitiveLandscape (resume, tendances, sources) et targetSegments (segment, besoin, objection) enrichis à partir de ce contexte.`;

const USER_PROMPT = (transcript: string, researchContext?: string) => `Voici la transcription brute d'une réunion client. Génère un brief créatif au format JSON.
${researchContext ? `\n--- Contexte web (concurrence, tendances) ---\n${researchContext}\n---\n` : ''}

Champs obligatoires :
- marque : Nom + ce qu'elle fait en 1 ligne factuelle
- personnalitePerque : ce qu'on ressent — pas ses propres mots
- cible : Qui (sans socio-démo vides). Double cible = préciser les deux.
- tensionComportementale : la tension réelle dans leur vie par rapport au produit/service
- projet : Type de projet, supports mentionnés, deadline structurante
- vraiProbleme : Pas l'objectif marketing. Le problème humain ou business réel — souvent différent de ce que le client dit.
- contexteConcurrentiel : Comment le secteur communique, concurrents nommés, ce qui manque
- contraintes : Budget, tabous, contraintes techniques, éléments obligatoires
- ambition : Ce qu'on veut qu'il se passe dans la tête de la cible après la campagne

Champs optionnels (extrais si présents) :
- tonInterdit : Ton explicitement interdit (ex: "corporate froid, site-vitrine catalogue, mignons, venez tous on vous aime")
- supports : Liste des canaux/supports mentionnés (ex: ["site web","LinkedIn","Meta","salons B2B","landing pages","cartes de visite"])
- contraintesOperationnelles : Ex: associés = matière première, agence doit équiper avec templates/guides
- angleSecteur : Ce qui manque dans le secteur, opportunité stratégique (ex: "marque qui assume compétence technique + authenticité humaine")

Transcription :
${transcript}`;

function extractJsonFromResponse(text: string): CreativeBriefTemplate {
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace === -1 || lastBrace <= firstBrace) throw new Error('JSON non trouvé');
  const jsonStr = text.substring(firstBrace, lastBrace + 1);
  try {
    return JSON.parse(jsonStr) as CreativeBriefTemplate;
  } catch {
    return JSON.parse(jsonrepair(jsonStr)) as CreativeBriefTemplate;
  }
}

export async function POST(req: Request) {
  const { rawTranscript } = await req.json() as { rawTranscript?: string };

  if (!rawTranscript?.trim()) {
    return Response.json({ error: 'Transcription manquante.' }, { status: 400 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: 'ANTHROPIC_API_KEY manquante.' }, { status: 500 });
  }

  try {
    let researchContext = '';
    try {
      const research = await runBriefResearch(rawTranscript.trim());
      researchContext = [
        research.landscapeConcurrentiel,
        research.tendancesMarche?.length ? `Tendances : ${research.tendancesMarche.join(' ; ')}` : '',
        research.sources?.length ? `Sources : ${research.sources.slice(0, 5).join(', ')}` : '',
      ].filter(Boolean).join('\n\n');
    } catch {
      // Ne pas bloquer si la recherche échoue
    }

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: USER_PROMPT(rawTranscript.trim(), researchContext) }],
    });

    const rawText = (message.content[0] as { type: string; text: string }).text.trim();
    const briefData = extractJsonFromResponse(rawText);
    const cost = computeGenerationCost(message.usage.input_tokens, message.usage.output_tokens);
    const contentWithMeta = { ...briefData, _meta: { generationCost: cost } };
    return Response.json({ brief: JSON.stringify(contentWithMeta), briefData: contentWithMeta });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    return Response.json({ error: `Génération échouée : ${message}` }, { status: 500 });
  }
}

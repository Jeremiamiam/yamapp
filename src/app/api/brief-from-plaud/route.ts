import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `Tu es un stratège créatif qui prépare des briefs pour un board créatif IA.
Tu reçois une transcription brute de réunion client et tu en extrais un brief structuré, dense et honnête.

Ton travail : lire entre les lignes. Ce qui compte, c'est ce que le client pressent sans pouvoir le formuler — les hésitations, les frustrations, les non-dits, les contradictions entre ce qu'il dit et comment il le dit.

Tu réponds UNIQUEMENT avec le brief formaté. Pas d'introduction, pas de conclusion, juste le brief.
Si une information n'est pas dans la transcription, indique [À COMPLÉTER] à la place.`;

const USER_PROMPT = (transcript: string) => `Voici la transcription brute d'une réunion client. Génère un brief créatif structuré selon ce template exact :

MARQUE
[Nom + ce qu'elle fait en 1 ligne factuelle]
Personnalité perçue : [ce qu'on ressent — pas ses propres mots]

CIBLE
[Qui (sans socio-démo vides)]
Tension comportementale : [la tension réelle dans leur vie par rapport à ce produit/service]

PROJET
[Type de projet, supports si mentionnés, deadline si mentionnée]

LE VRAI PROBLÈME
[Pas l'objectif marketing. Le problème humain ou business réel à résoudre — souvent différent de ce que le client dit explicitement.]

CONTEXTE CONCURRENTIEL
[Comment le secteur communique, concurrents nommés si présents — sinon [À COMPLÉTER]]

CONTRAINTES
[Tabous, ton interdit, éléments obligatoires, niveau de budget si mentionné — sinon [À COMPLÉTER]]

AMBITION
[Ce qu'on veut qu'il se passe dans la tête de la cible après avoir vu la campagne]

---
Transcription :
${transcript}`;

export async function POST(req: Request) {
  const { rawTranscript } = await req.json() as { rawTranscript?: string };

  if (!rawTranscript?.trim()) {
    return Response.json({ error: 'Transcription manquante.' }, { status: 400 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: 'ANTHROPIC_API_KEY manquante.' }, { status: 500 });
  }

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: USER_PROMPT(rawTranscript.trim()) }],
    });

    const brief = (message.content[0] as { type: string; text: string }).text.trim();
    return Response.json({ brief });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    return Response.json({ error: `Génération échouée : ${message}` }, { status: 500 });
  }
}

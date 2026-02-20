import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `Tu es un architecte web senior spécialisé en UX stratégique. Tu travailles au sein d'un board créatif d'agence de communication. Ton rôle est de définir l'arborescence d'un site web (le menu) à partir d'une plateforme de marque et d'un brief client.

## Ce que tu fais

Tu détermines quelles pages le site doit contenir, dans quel ordre de navigation, avec quelle logique. Tu ne plaques jamais un modèle standard. Chaque page que tu proposes existe pour une raison stratégique liée au brief et à la plateforme de marque.

## Ce que tu ne fais pas

- Tu ne designs pas les pages
- Tu ne rédiges pas le contenu
- Tu ne proposes pas de layouts ou de composants visuels
- Tu ne proposes jamais de page qui ne serait pas justifiée par la stratégie

## Contraintes

- Maximum 8 pages en navigation principale (au-delà l'utilisateur se perd)
- Les pages légales (mentions légales, confidentialité) vont dans footer_only, pas dans primary
- Tu identifies les contenus que le client devra fournir (photos, témoignages, chiffres…)

## Format de sortie

Tu réponds OBLIGATOIREMENT avec un bloc <structured_output> contenant UNIQUEMENT du JSON valide. Pas de markdown autour.

<structured_output>
{
  "site_type": "string — vitrine, e-commerce, app, landing, portfolio...",
  "primary_objective": "string — l'objectif n°1 du site en une phrase",
  "target_visitor": "string — qui visite ce site et dans quel état d'esprit",
  "navigation": {
    "primary": [
      {
        "page": "string — nom de la page tel qu'il apparaîtra dans le menu",
        "slug": "string — URL proposée",
        "justification": "string — pourquoi cette page existe, en une phrase",
        "priority": "high | medium | low",
        "children": []
      }
    ],
    "footer_only": [
      {
        "page": "string",
        "slug": "string",
        "justification": "string"
      }
    ]
  },
  "user_flows": [
    {
      "persona": "string",
      "entry_point": "string",
      "flow": ["string"],
      "conversion_goal": "string"
    }
  ],
  "content_dependencies": ["string"],
  "pages_rejected": [{"page": "string", "reason": "string"}]
}
</structured_output>`;

function extractJsonFromResponse(text: string): unknown {
  const match = text.match(/<structured_output>([\s\S]*?)<\/structured_output>/i);
  const raw = match ? match[1].trim() : text;
  const firstBrace = raw.indexOf('{');
  const lastBrace = raw.lastIndexOf('}');
  if (firstBrace === -1 || lastBrace <= firstBrace) throw new Error('JSON non trouvé dans la réponse');
  return JSON.parse(raw.substring(firstBrace, lastBrace + 1));
}

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: 'ANTHROPIC_API_KEY manquante.' }, { status: 500 });
  }

  const body = (await req.json()) as {
    reportContent?: string;
    brandPlatform?: unknown;
    strategyText?: string;
    copywriterText?: string;
  };

  const { reportContent = '', brandPlatform, strategyText = '', copywriterText = '' } = body;

  const platformStr = brandPlatform
    ? typeof brandPlatform === 'string' ? brandPlatform : JSON.stringify(brandPlatform)
    : '';

  const userContent = `Contexte stratégique (synthèse du board créatif) :

${strategyText}

${platformStr ? `Plateforme de marque (JSON) :\n${platformStr}` : ''}

${copywriterText ? `Territoire & Copy :\n${copywriterText}` : ''}

${reportContent ? `Rapport complet :\n${reportContent}` : ''}

Génère l'arborescence du menu du site (navigation principale + footer) au format JSON demandé.`;

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      temperature: 0.5,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userContent }],
    });

    const text = (message.content[0] as { type: string; text: string }).text;
    const parsed = extractJsonFromResponse(text);
    return Response.json({ architecture: parsed });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erreur inconnue';
    return Response.json({ error: `Génération échouée : ${msg}` }, { status: 500 });
  }
}

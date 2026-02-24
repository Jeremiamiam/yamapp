import Anthropic from '@anthropic-ai/sdk';
import { jsonrepair } from 'jsonrepair';
import { getPrompt } from '@/lib/agent-prompts';

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
  let jsonStr = raw.substring(firstBrace, lastBrace + 1);
  try {
    return JSON.parse(jsonStr);
  } catch (e1) {
    try {
      return JSON.parse(jsonrepair(jsonStr));
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
    reportContent?: string;
    brandPlatform?: unknown;
    strategyText?: string;
    copywriterText?: string;
  };

  const { reportContent = '', brandPlatform, strategyText = '', copywriterText = '' } = body;
  const reportTrimmed = typeof reportContent === 'string' ? reportContent.slice(0, 6000) : '';
  const platformStr = brandPlatform
    ? typeof brandPlatform === 'string' ? brandPlatform : JSON.stringify(brandPlatform)
    : '';

  const userContent = `Contexte stratégique (synthèse du board créatif) :

${strategyText}

${platformStr ? `Plateforme de marque (JSON) :\n${platformStr}` : ''}

${copywriterText ? `Territoire & Copy :\n${copywriterText}` : ''}

${reportTrimmed ? `Rapport complet :\n${reportTrimmed}` : ''}

Génère l'arborescence du menu du site (navigation principale + footer) au format JSON demandé.`;

  const systemPrompt = await getPrompt('web-architect', SYSTEM_PROMPT);
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const claudeStream = client.messages.stream({
          model: 'claude-sonnet-4-6',
          max_tokens: 2000,
          temperature: 0.5,
          system: systemPrompt,
          messages: [{ role: 'user', content: userContent }],
        });

        let fullText = '';
        for await (const event of claudeStream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            const chunk = event.delta.text;
            fullText += chunk;
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ t: 'chunk', d: chunk })}\n\n`));
          }
        }

        const parsed = extractJsonFromResponse(fullText);
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ t: 'done', architecture: parsed })}\n\n`));
      } catch (err) {
        const msg = err instanceof Error ? err.message : typeof err === 'string' ? err : String(err);
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ t: 'error', error: msg || 'Erreur inconnue' })}\n\n`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' },
  });
}

import Anthropic from '@anthropic-ai/sdk';
import { jsonrepair } from 'jsonrepair';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `Tu es un directeur de projet web senior spécialisé en architecture de pages. Tu travailles au sein d'un board créatif d'agence de communication. Ton rôle est de produire un brief de homepage détaillé, section par section, avec le contenu rédigé et les intentions de chaque bloc.

## Ce que tu produis

Un brief de page structuré en JSON. Pas du HTML, pas du design. Un document stratégique que l'équipe créative utilisera pour designer la page. Chaque section a :
- Un rôle (hero, social_proof, value_proposition, features, testimonial, cta…)
- Une intention (pourquoi cette section est là)
- Du contenu rédigé (titres, textes, CTA — pas du lorem ipsum)
- Des notes de direction artistique (da_notes)

## Règles

- Minimum 5 sections, maximum 10
- Le hero est toujours la première section (order: 1)
- Un CTA de conversion doit apparaître au moins deux fois
- Tout le contenu doit être rédigé et spécifique au client

## Format de sortie

Tu réponds OBLIGATOIREMENT avec un bloc <structured_output> contenant UNIQUEMENT du JSON valide.

<structured_output>
{
  "page": "homepage",
  "strategic_intent": "string",
  "target_visitor": "string",
  "narrative_arc": "string",
  "sections": [
    {
      "order": 1,
      "role": "hero",
      "intent": "string",
      "content": {
        "tag": "string (optionnel)",
        "title": "string",
        "subtitle": "string",
        "cta_primary": {"label": "string", "url": "string"},
        "cta_secondary": {"label": "string", "url": "string"} 
      },
      "da_notes": "string"
    }
  ],
  "cross_links": [{"from_section": "string", "to_page": "string", "purpose": "string"}],
  "seo_notes": {
    "primary_keyword": "string",
    "title_tag": "string — max 60 caractères",
    "meta_description": "string — max 155 caractères"
  }
}
</structured_output>`;

function extractJsonFromResponse(text: string): unknown {
  const match = text.match(/<structured_output>([\s\S]*?)<\/structured_output>/i);
  const raw = match ? match[1].trim() : text;
  const firstBrace = raw.indexOf('{');
  const lastBrace = raw.lastIndexOf('}');
  if (firstBrace === -1 || lastBrace <= firstBrace) throw new Error('JSON non trouvé dans la réponse');
  const jsonStr = raw.substring(firstBrace, lastBrace + 1);
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
    copywriterText?: string;
    siteArchitecture: unknown;
  };

  const { reportContent = '', brandPlatform, copywriterText = '', siteArchitecture } = body;

  if (!siteArchitecture) {
    return Response.json({ error: 'siteArchitecture requis.' }, { status: 400 });
  }

  const platformStr = brandPlatform
    ? typeof brandPlatform === 'string' ? brandPlatform : JSON.stringify(brandPlatform)
    : '';
  const archStr = typeof siteArchitecture === 'string' ? siteArchitecture : JSON.stringify(siteArchitecture);
  const reportTrimmed = typeof reportContent === 'string' ? reportContent.slice(0, 4000) : '';

  const userContent = `Plateforme de marque :
${platformStr}

Territoire & Copy :
${copywriterText}

Arborescence du site (menu) :
${archStr}

${reportTrimmed ? `Rapport complet :\n${reportTrimmed}` : ''}

Génère le brief de la homepage avec toutes les sections (hero, social proof, value prop, etc.) au format JSON demandé. Contenu rédigé, pas de placeholder.`;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const claudeStream = client.messages.stream({
          model: 'claude-sonnet-4-6',
          max_tokens: 2500,
          temperature: 0.6,
          system: SYSTEM_PROMPT,
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
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ t: 'done', homepage: parsed })}\n\n`));
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

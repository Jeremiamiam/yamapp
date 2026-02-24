import Anthropic from '@anthropic-ai/sdk';
import { jsonrepair } from 'jsonrepair';
import { getPrompt } from '@/lib/agent-prompts';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `Tu es un directeur de projet web senior spécialisé en homepage high-converting. Tu produis un brief de homepage pour un site multi-pages (pas une one-page). La homepage doit accrocher, expliquer la valeur, et orienter vers les pages du menu via des sections qui "teasent" et renvoient vers elles.

## Structure optimale (best practices UX/conversion)

Ordre recommandé des sections :
1. hero — above the fold, value proposition en une phrase, 1 CTA principal (vers une page du menu)
2. value_proposition — paragraphe explicatif 3-5 phrases, 1 CTA secondaire
3. services_teaser OU solutions_overview — résumé des offres, liens vers les pages du menu (ex: /services, /nos-prestations)
4. social_proof — logos clients, chiffres clés, preuves
5. testimonial — 1-2 témoignages courts avec citation
6. cta_final — dernier appel à l'action, lien vers /contact ou page de conversion

## Liens vers le menu (obligatoire)

Tu reçois l'arborescence (menu) du site. Les URLs des pages sont dans navigation.primary[].slug et navigation.footer_only[].slug.
Chaque CTA (cta_primary, cta_secondary) DOIT utiliser ces slugs : url = "/" + slug (ex: slug "services" → url "/services").
La homepage oriente vers les autres pages — ne jamais inventer d'URL. Exemples : /contact, /a-propos, /nos-services.
Au moins 3 sections doivent contenir un CTA qui pointe vers une page du menu.

## Contenu rédigé (paragraphes)

Chaque section content DOIT avoir :
- title : accroche ou titre
- text : paragraphe 2-5 phrases (obligatoire). Hero = 1-2 phrases. Autres sections = 3-5 phrases.

Tu peux ajouter : subtitle, cta_primary, cta_secondary, items, quotes. Pas de lorem ipsum.

## Format de sortie

<structured_output>
{
  "page": "homepage",
  "target_visitor": "string",
  "sections": [
    {
      "order": 1,
      "role": "hero",
      "intent": "string",
      "content": {
        "title": "string",
        "text": "string — PARAGRAPHE OBLIGATOIRE",
        "subtitle": "string",
        "cta_primary": {"label": "string", "url": "string — slug du menu, ex /services"},
        "cta_secondary": {"label": "string", "url": "string"}
      }
    }
  ],
  "cross_links": [
    {"from_section": "role de la section", "to_page": "/slug", "purpose": "pourquoi ce lien"}
  ],
  "seo_notes": {"primary_keyword": "string", "title_tag": "string", "meta_description": "string"}
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

  const systemPrompt = await getPrompt('homepage', SYSTEM_PROMPT);
  const userContent = `Plateforme de marque :
${platformStr}

Territoire & Copy :
${copywriterText}

Arborescence du site (menu) :
${archStr}

${reportTrimmed ? `Rapport complet :\n${reportTrimmed}` : ''}

Génère le brief de la homepage. Utilise UNIQUEMENT les slugs du menu pour les URLs des CTA (ex: si slug "contact" → url "/contact"). Chaque section : paragraphe "text" obligatoire + CTA qui renvoie vers une page du menu quand c'est pertinent.`;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const claudeStream = client.messages.stream({
          model: 'claude-sonnet-4-6',
          max_tokens: 4000,
          temperature: 0.6,
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

import Anthropic from '@anthropic-ai/sdk';
import { jsonrepair } from 'jsonrepair';
import type { ZonedSection } from '@/types/section-zoning';
import { SECTION_ROLES } from '@/types/section-zoning';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const ROLES_LIST = SECTION_ROLES.join(', ');

const SYSTEM_PROMPT = `Tu es un directeur de projet web senior. Tu produis le zoning (sections) d'une page web spécifique (about, contact, services, etc.) — pas la homepage.

## Rôles de sections autorisés

${ROLES_LIST}

Choisis les sections adaptées au type de page :
- À propos / about : hero, value_proposition, testimonial, cta_final
- Contact : hero, contact_form, cta_final
- Services / prestations : hero, value_proposition, services_teaser, features, social_proof, testimonial, cta_final
- Tarifs / pricing : hero, value_proposition, pricing, faq, cta_final
- etc.

## URLs des CTA

Utilise UNIQUEMENT les slugs du menu (navigation.primary, navigation.footer_only). url = "/" + slug.

## Format de sortie

<structured_output>
{
  "page": "string — nom de la page",
  "slug": "string — slug de la page",
  "target_visitor": "string",
  "sections": [
    {
      "order": 1,
      "role": "hero",
      "intent": "string — intention de la section",
      "content": {
        "title": "string",
        "text": "string — paragraphe obligatoire",
        "subtitle": "string",
        "cta_primary": {"label": "string", "url": "string"},
        "cta_secondary": {"label": "string", "url": "string"},
        "items": [{"title": "string", "text": "string"}],
        "quotes": [{"text": "string", "author_name": "string"}]
      }
    }
  ]
}
</structured_output>

Chaque section DOIT avoir content.title et content.text (ou items pour faq). Adapte les champs au role.`;

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
    siteArchitecture: unknown;
    pageSlug: string;
    reportContent?: string;
    brandPlatform?: unknown;
    copywriterText?: string;
  };

  const {
    siteArchitecture,
    pageSlug,
    reportContent = '',
    brandPlatform,
    copywriterText = '',
  } = body;

  if (!siteArchitecture || !pageSlug) {
    return Response.json(
      { error: 'siteArchitecture et pageSlug requis.' },
      { status: 400 }
    );
  }

  const platformStr = brandPlatform
    ? typeof brandPlatform === 'string' ? brandPlatform : JSON.stringify(brandPlatform)
    : '';
  const archStr =
    typeof siteArchitecture === 'string' ? siteArchitecture : JSON.stringify(siteArchitecture);
  const reportTrimmed = typeof reportContent === 'string' ? reportContent.slice(0, 4000) : '';

  const userContent = `Plateforme de marque :
${platformStr}

Territoire & Copy :
${copywriterText}

Arborescence du site :
${archStr}

${reportTrimmed ? `Rapport complet :\n${reportTrimmed}` : ''}

Génère le zoning de la page avec slug "${pageSlug}". Utilise UNIQUEMENT les slugs du menu pour les URLs. Chaque section : paragraphe "text" obligatoire (ou items pour faq).`;

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      temperature: 0.6,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userContent }],
    });

    const textContent = message.content
      .filter((b) => b.type === 'text')
      .map((b) => (b as { type: 'text'; text: string }).text)
      .join('');

    const parsed = extractJsonFromResponse(textContent) as {
      page?: string;
      slug?: string;
      target_visitor?: string;
      sections?: unknown[];
    };

    const sections: ZonedSection[] = (parsed.sections ?? []).map((s, i) => {
      const sec = s as Record<string, unknown>;
      const roleStr = typeof sec.role === 'string' ? sec.role : 'hero';
      const role =
        SECTION_ROLES.includes(roleStr as (typeof SECTION_ROLES)[number]) ?
          (roleStr as ZonedSection['role'])
        : 'hero';
      return {
        order: typeof sec.order === 'number' ? sec.order : i + 1,
        role,
        intent: typeof sec.intent === 'string' ? sec.intent : '',
        content: (sec.content as Record<string, unknown>) ?? {},
        layout: (sec.layout as ZonedSection['layout']) ?? undefined,
      };
    });

    return Response.json({
      page: parsed.page ?? pageSlug,
      slug: parsed.slug ?? pageSlug,
      target_visitor: parsed.target_visitor,
      sections,
    });
  } catch (err) {
    const msg =
      err instanceof Error ? err.message : typeof err === 'string' ? err : String(err);
    return Response.json({ error: msg || 'Erreur inconnue' }, { status: 500 });
  }
}

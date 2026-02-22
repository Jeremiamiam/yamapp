import Anthropic from '@anthropic-ai/sdk';
import { jsonrepair } from 'jsonrepair';
import type { ZonedSection } from '@/types/section-zoning';
import { SECTION_ROLES } from '@/types/section-zoning';
import { ROLE_SIMILARITY_MAP } from '@/lib/section-registry';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const ROLES_LIST = SECTION_ROLES.join(', ');

const SYSTEM_PROMPT = `Tu es un directeur de projet web senior. Tu produis le zoning (sections) d'une page web spécifique — pas la homepage.

## Rôles de sections

### Rôles avec layout existant (préférer quand c'est pertinent)

${ROLES_LIST}

### Rôles custom (si la page l'exige)

Si aucun rôle existant ne correspond au besoin de la page, **invente un rôle custom** en snake_case descriptif. Exemples :
- E-commerce : product_grid, product_detail, cart_summary, filters, related_products
- Blog : blog_list, blog_featured, categories, author_bio
- Portfolio : project_gallery, case_study, before_after
- Équipe : team_grid, team_member, org_chart
- Événements : event_schedule, speakers, registration

Un rôle custom déclenchera un placeholder "Layout inexistant" côté preview — l'utilisateur pourra alors générer le layout adapté. C'est le comportement attendu : **ne force PAS un rôle existant si le contenu ne correspond pas**.

### Exemples par type de page

- À propos : hero, value_proposition, team_grid, testimonial, cta_final
- Contact : hero, contact_form, cta_final
- Services : hero, value_proposition, services_teaser, features, social_proof, testimonial, cta_final
- Tarifs : hero, pricing, features, faq, cta_final
- E-commerce / Shop : hero, product_grid, features, testimonial, faq, cta_final
- Blog : hero, blog_featured, blog_list, cta_final

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

Chaque section DOIT avoir content.title et content.text (ou items pour faq/liste). Adapte les champs content au role — un product_grid aura des items avec title/text/price/image, un blog_list aura des items avec title/excerpt/date, etc.`;

function extractJsonFromResponse(text: string, stopReason?: string): unknown {
  const match = text.match(/<structured_output>([\s\S]*?)<\/structured_output>/i);
  const raw = match ? match[1].trim() : text;
  const firstBrace = raw.indexOf('{');
  const lastBrace = raw.lastIndexOf('}');
  if (firstBrace === -1 || lastBrace <= firstBrace) {
    const preview = text.slice(0, 200);
    throw new Error(`JSON non trouvé dans la réponse (stop: ${stopReason ?? 'unknown'}). Début: ${preview}`);
  }
  let jsonStr = raw.substring(firstBrace, lastBrace + 1);

  // If response was truncated (max_tokens), try to close the JSON
  if (stopReason === 'max_tokens') {
    jsonStr = closetruncatedJson(jsonStr);
  }

  try {
    return JSON.parse(jsonStr);
  } catch (e1) {
    try {
      return JSON.parse(jsonrepair(jsonStr));
    } catch (e2) {
      const m1 = e1 instanceof Error ? e1.message : String(e1);
      const m2 = e2 instanceof Error ? e2.message : String(e2);
      throw new Error(`JSON invalide (stop: ${stopReason ?? 'unknown'}): ${m1}. Repair: ${m2}`);
    }
  }
}

/** Attempt to close truncated JSON by balancing brackets */
function closetruncatedJson(json: string): string {
  let inString = false;
  let escape = false;
  const stack: string[] = [];
  for (const ch of json) {
    if (escape) { escape = false; continue; }
    if (ch === '\\' && inString) { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === '{') stack.push('}');
    else if (ch === '[') stack.push(']');
    else if (ch === '}' || ch === ']') stack.pop();
  }
  // If we're mid-string, close it first
  if (inString) json += '"';
  // Close all open brackets/braces
  return json + stack.reverse().join('');
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
    agentBrief?: string;
    homepage?: unknown;
    existingPages?: unknown[];
  };

  const {
    siteArchitecture,
    pageSlug,
    reportContent = '',
    brandPlatform,
    copywriterText = '',
    agentBrief = '',
    homepage,
    existingPages,
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
  const copyTrimmed = typeof copywriterText === 'string' ? copywriterText.slice(0, 2000) : '';
  const agentBriefTrimmed = typeof agentBrief === 'string' ? agentBrief.slice(0, 1500) : '';

  const homepageStr = homepage
    ? typeof homepage === 'string'
      ? homepage
      : JSON.stringify(homepage)
    : '';
  const existingStr =
    Array.isArray(existingPages) && existingPages.length > 0
      ? existingPages
          .slice(0, 3)
          .map((p) => (typeof p === 'string' ? p : JSON.stringify(p)))
          .join('\n---\n')
      : '';

  const userContent = `Plateforme de marque :
${platformStr}

Territoire & Copy :
${copyTrimmed}

Arborescence du site :
${archStr}

${reportTrimmed ? `Rapport / brief stratégique :\n${reportTrimmed}` : ''}

${homepageStr ? `Homepage existante (cohérence tonale/structurelle) :\n${homepageStr.slice(0, 3000)}` : ''}

${existingStr ? `Pages déjà zonées (référence) :\n${existingStr.slice(0, 2000)}` : ''}

${agentBriefTrimmed ? `Instructions spécifiques pour cette page :\n${agentBriefTrimmed}` : ''}

Génère le zoning de la page avec slug "${pageSlug}". Utilise UNIQUEMENT les slugs du menu pour les URLs. Chaque section : paragraphe "text" obligatoire (ou items pour faq). Respecte le ton et la structure de l'existant si fourni.`;

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8000,
      temperature: 0.6,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userContent }],
    });

    const textContent = message.content
      .filter((b) => b.type === 'text')
      .map((b) => (b as { type: 'text'; text: string }).text)
      .join('');

    const parsed = extractJsonFromResponse(textContent, message.stop_reason ?? undefined) as {
      page?: string;
      slug?: string;
      target_visitor?: string;
      sections?: unknown[];
    };

    const sections: ZonedSection[] = (parsed.sections ?? []).map((s, i) => {
      const sec = s as Record<string, unknown>;
      const roleStr = typeof sec.role === 'string' ? sec.role : 'hero';
      // Try similarity mapping (e.g. "testimonials" → "testimonial"), otherwise keep as-is
      const mapped = ROLE_SIMILARITY_MAP[roleStr.toLowerCase()];
      const role: ZonedSection['role'] =
        SECTION_ROLES.includes(roleStr as (typeof SECTION_ROLES)[number])
          ? (roleStr as (typeof SECTION_ROLES)[number])
          : mapped ?? roleStr;
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

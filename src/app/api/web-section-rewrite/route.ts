import Anthropic from '@anthropic-ai/sdk';
import { jsonrepair } from 'jsonrepair';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `Tu es un copywriter web senior. Tu réécris une section de homepage existante en respectant un prompt personnalisé de l'utilisateur et l'arborescence du site.

Tu reçois aussi le contexte stratégique du projet (plateforme de marque, texte copywriter, rapport de briefing). Utilise-le pour aligner le ton, la promesse, et les valeurs.

## Contraintes

- Tu reçois la section actuelle (role, intent, content) et un prompt personnalisé.
- Tu reçois l'arborescence du site (navigation.primary, navigation.footer_only).
- Chaque CTA (cta_primary, cta_secondary) DOIT utiliser les slugs du menu : url = "/" + slug (ex: "contact" → "/contact").
- Le content doit garder une structure cohérente : title, text (paragraphe obligatoire), subtitle, cta_primary, cta_secondary, items, quotes selon le role de la section.

## Format de sortie

Tu réponds UNIQUEMENT avec un bloc <structured_output> contenant le nouvel objet content (pas la section entière, juste content).

<structured_output>
{
  "title": "string",
  "text": "string — paragraphe 2-5 phrases",
  "subtitle": "string",
  "cta_primary": {"label": "string", "url": "string"},
  "cta_secondary": {"label": "string", "url": "string"},
  "items": [{"title": "string", "text": "string"}],
  "quotes": [{"text": "string", "author_name": "string"}]
}
</structured_output>

Adapte les champs au role de la section (hero = title + text + cta_primary ; testimonial = quotes ; etc.). Ne retourne que les champs pertinents.`;

function extractJsonFromResponse(text: string): Record<string, unknown> {
  const match = text.match(/<structured_output>([\s\S]*?)<\/structured_output>/i);
  const raw = match ? match[1].trim() : text;
  const firstBrace = raw.indexOf('{');
  const lastBrace = raw.lastIndexOf('}');
  if (firstBrace === -1 || lastBrace <= firstBrace) throw new Error('JSON non trouvé dans la réponse');
  const jsonStr = raw.substring(firstBrace, lastBrace + 1);
  try {
    return JSON.parse(jsonStr) as Record<string, unknown>;
  } catch (e1) {
    try {
      return JSON.parse(jsonrepair(jsonStr)) as Record<string, unknown>;
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
    section: { order: number; role: string; intent: string; content: Record<string, unknown> };
    customPrompt: string;
    architecture: unknown;
    brandPlatform?: unknown;
    copywriterText?: string;
    reportContent?: string;
  };

  const { section, customPrompt, architecture, brandPlatform, copywriterText, reportContent } = body;

  if (!section?.content || !customPrompt?.trim()) {
    return Response.json({ error: 'section et customPrompt requis.' }, { status: 400 });
  }

  const archStr = architecture
    ? typeof architecture === 'string' ? architecture : JSON.stringify(architecture)
    : '{}';
  const sectionStr = JSON.stringify(section);

  // Build strategy context block (truncated to prevent token overflow)
  const strategyLines: string[] = [];
  if (brandPlatform) {
    strategyLines.push(`Plateforme de marque: ${JSON.stringify(brandPlatform).substring(0, 2000)}`);
  }
  if (copywriterText) {
    strategyLines.push(`Texte copywriter: ${copywriterText.substring(0, 2000)}`);
  }
  if (reportContent) {
    strategyLines.push(`Rapport: ${reportContent.substring(0, 2000)}`);
  }

  const strategyBlock = strategyLines.length > 0
    ? `\n## Contexte stratégique\n${strategyLines.join('\n\n')}\n`
    : '';

  const userContent = `Section actuelle :
${sectionStr}

Arborescence du site :
${archStr}
${strategyBlock}
Prompt personnalisé de l'utilisateur :
${customPrompt.trim()}

Réécris le content de cette section en respectant le prompt. Retourne UNIQUEMENT l'objet content au format JSON.`;

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      temperature: 0.6,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userContent }],
    });

    const rawText = (message.content[0] as { type: string; text: string }).text;
    const content = extractJsonFromResponse(rawText);
    return Response.json({ content });
  } catch (err) {
    const msg = err instanceof Error ? err.message : typeof err === 'string' ? err : String(err);
    return Response.json({ error: msg || 'Erreur inconnue' }, { status: 500 });
  }
}

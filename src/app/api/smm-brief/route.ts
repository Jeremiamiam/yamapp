import Anthropic from '@anthropic-ai/sdk';
import { jsonrepair } from 'jsonrepair';
import type { SocialBriefData } from '@/types/social-brief';
import { getPrompt } from '@/lib/agent-prompts';
import { computeGenerationCost } from '@/lib/api-cost';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `Tu es un stratège Social Media Manager. Tu reçois une plateforme de marque, une stratégie créative et du copy. Tu produis un brief social media structuré pour alimenter la production de contenu.

Tu réponds UNIQUEMENT avec un JSON valide, sans markdown autour. Format :

{
  "version": 1,
  "brandVoice": "string — tonalité générale pour les réseaux",
  "content_pillars": [
    { "title": "string", "description": "string", "contentIdeas": ["idée 1", "idée 2"] }
  ],
  "channels": [
    {
      "channel": "instagram" | "linkedin" | "tiktok" | etc.,
      "objectives": ["objectif 1"],
      "tone": "string",
      "postingFrequency": "string",
      "contentSuggestions": ["suggestion 1"]
    }
  ],
  "hashtag_strategy": "string — stratégie hashtags, groupes thématiques"
}

Au moins 2 piliers de contenu et 2 canaux. Adapte au contexte (B2B = linkedin prioritaire, B2C jeune = instagram/tiktok).`;

function extractJsonFromResponse(text: string): SocialBriefData {
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace === -1 || lastBrace <= firstBrace) throw new Error('JSON non trouvé');
  const jsonStr = text.substring(firstBrace, lastBrace + 1);
  try {
    return JSON.parse(jsonStr) as SocialBriefData;
  } catch {
    return JSON.parse(jsonrepair(jsonStr)) as SocialBriefData;
  }
}

export async function POST(req: Request) {
  const body = (await req.json()) as {
    brandPlatform?: unknown;
    strategyText?: string;
    copywriterText?: string;
    reportContent?: string;
  };

  const {
    brandPlatform,
    strategyText = '',
    copywriterText = '',
    reportContent = '',
  } = body;

  const platformStr = brandPlatform
    ? typeof brandPlatform === 'string' ? brandPlatform : JSON.stringify(brandPlatform)
    : '';

  if (!platformStr.trim() && !strategyText.trim() && !copywriterText.trim()) {
    return Response.json(
      { error: 'Au moins un de brandPlatform, strategyText ou copywriterText est requis.' },
      { status: 400 }
    );
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: 'ANTHROPIC_API_KEY manquante.' }, { status: 500 });
  }

  const userMessage = [
    platformStr ? `Plateforme de marque :\n${platformStr}` : '',
    strategyText ? `Stratégie créative :\n${strategyText}` : '',
    copywriterText ? `Copy (territoire, manifesto, taglines) :\n${copywriterText}` : '',
    reportContent ? `Contexte rapport :\n${reportContent}` : '',
  ]
    .filter(Boolean)
    .join('\n\n---\n\n');

  const systemPrompt = await getPrompt('smm-brief', SYSTEM_PROMPT);
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const emit = (obj: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
      };

      try {
        emit({ t: 'start' });

        const message = await client.messages.create({
          model: 'claude-sonnet-4-6',
          max_tokens: 4096,
          system: systemPrompt,
          messages: [{ role: 'user', content: userMessage }],
        });

        const rawText = (message.content[0] as { type: string; text: string }).text.trim();
        const socialBrief = extractJsonFromResponse(rawText);
        socialBrief.generatedAt = new Date().toISOString();

        if (!socialBrief.content_pillars || !Array.isArray(socialBrief.content_pillars)) {
          socialBrief.content_pillars = [];
        }
        if (!socialBrief.channels || !Array.isArray(socialBrief.channels)) {
          socialBrief.channels = [];
        }

        const cost = computeGenerationCost(message.usage.input_tokens, message.usage.output_tokens);
        (socialBrief as unknown as Record<string, unknown>)._meta = { generationCost: cost };

        emit({ t: 'done', socialBrief });
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erreur inconnue';
        emit({ t: 'error', message: msg });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}

import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `Tu es un développeur React/TypeScript senior spécialisé en composants de layout web.

Tu génères un composant React pour un rôle de section donné. Le composant doit suivre EXACTEMENT ces patterns :

## Règles obligatoires

1. Commence par \`'use client';\`
2. Interface nommée \`Layout{PascalRole}Props\` avec \`content?: Record<string, unknown>;\`
3. Export nommé (pas default) : \`export function Layout{PascalRole}({ content }: Layout{PascalRole}Props)\`
4. Extraction défensive des données depuis \`content\` avec des fallbacks par défaut
5. Utilise UNIQUEMENT les CSS variables du projet (jamais de couleurs en dur) :
   - Texte : \`var(--text-primary)\`, \`var(--text-secondary)\`, \`var(--text-muted)\`
   - Fond : \`var(--bg-primary)\`, \`var(--bg-card)\`, \`var(--bg-tertiary)\`
   - Bordure : \`var(--border-subtle)\`, \`var(--border-medium)\`
   - Accent : \`var(--accent-cyan)\`, \`var(--accent-lime)\`, \`var(--accent-violet)\`
6. Utilise Tailwind CSS pour le layout (px, py, grid, flex, rounded, etc.)
7. Le composant doit avoir un contenu par défaut réaliste si \`content\` est vide
8. Structure HTML : \`<section className="px-6 py-20"><div className="mx-auto max-w-6xl">...</div></section>\`

## INTERDICTIONS STRICTES — Layout sobre et neutre

- **JAMAIS d'images** : pas de \`<img>\`, pas de \`<Image>\`, pas de placeholder photo, pas de background-image, pas d'URL d'image
- **JAMAIS de gradients** : pas de \`bg-gradient-*\`, pas de \`linear-gradient\`, pas de \`radial-gradient\`
- **JAMAIS d'emojis ni d'icônes** : pas d'emoji Unicode, pas de SVG inline, pas d'import d'icônes
- **JAMAIS de couleurs hors design system** : pas de \`bg-blue-500\`, \`text-red-600\`, \`#ff0000\`, \`rgb()\`, etc. Uniquement les CSS variables listées ci-dessus
- **JAMAIS de box-shadow custom** : pas de \`shadow-lg\`, \`shadow-2xl\`. Maximum \`shadow-sm\` sur les cards
- **Le layout doit être sobre, structurel, typographique** : texte + espacement + bordures subtiles. C'est un wireframe haute-fidélité, pas une maquette colorée

## Modification de composant existant

Tu modifies un composant existant. Préserve le nom de l'export et l'interface. Ne change que ce qui est demandé par l'instruction.

## Format de sortie

Réponds UNIQUEMENT avec le code TSX complet du composant, entre des balises \`\`\`tsx et \`\`\`. Pas d'explication, pas de commentaire en dehors du code.`;

function extractTsxFromResponse(text: string): string {
  const match = text.match(/```tsx\s*\n([\s\S]*?)```/);
  if (match) return match[1].trim();
  const fallback = text.match(/```(?:typescript|ts)?\s*\n([\s\S]*?)```/);
  if (fallback) return fallback[1].trim();
  throw new Error('Code TSX non trouvé dans la réponse');
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { role?: string; existingCode?: string; prompt?: string };
    const { role, existingCode, prompt } = body;

    if (!role || typeof role !== 'string') {
      return NextResponse.json({ error: 'role est requis' }, { status: 400 });
    }
    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'prompt est requis' }, { status: 400 });
    }
    if (!existingCode || typeof existingCode !== 'string') {
      return NextResponse.json({ error: 'existingCode est requis' }, { status: 400 });
    }

    const userMessage = `Modifie ce composant React selon l'instruction suivante.\n\nInstruction : "${prompt}"\n\nCode actuel :\n\`\`\`tsx\n${existingCode}\n\`\`\`\n\nRéponds uniquement avec le code TSX modifié complet.`;

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    });

    const textBlock = response.content.find((b) => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      return NextResponse.json({ error: 'Réponse IA vide' }, { status: 500 });
    }

    const code = extractTsxFromResponse(textBlock.text);
    return NextResponse.json({ code });
  } catch (err) {
    console.error('[edit-layout] error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erreur interne' },
      { status: 500 },
    );
  }
}

import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function toPascalCase(role: string): string {
  return role
    .split(/[_\-\s]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join('');
}

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

## Exemples de référence

### Exemple 1 — LayoutFeatures (grille d'items)

\`\`\`tsx
'use client';

interface LayoutFeaturesProps {
  content?: Record<string, unknown>;
}

export function LayoutFeatures({ content }: LayoutFeaturesProps) {
  const rawItems = (content?.items as { title?: string; text?: string }[] | undefined);
  const items = rawItems?.length
    ? rawItems.map((i) => ({ title: i.title ?? '—', desc: i.text ?? '' }))
    : [
        { title: 'Fonctionnalité 1', desc: 'Description courte.' },
        { title: 'Fonctionnalité 2', desc: 'Description courte.' },
      ];
  const title = (content?.title as string) ?? 'Fonctionnalités';

  return (
    <section className="px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl">
          {title}
        </h2>
        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, i) => (
            <div key={i} className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6">
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">{item.title}</h3>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
\`\`\`

### Exemple 2 — LayoutTestimonial (citations)

\`\`\`tsx
'use client';

interface LayoutTestimonialProps {
  content?: Record<string, unknown>;
}

export function LayoutTestimonial({ content }: LayoutTestimonialProps) {
  const rawQuotes = (content?.quotes as { text?: string; author_name?: string; role?: string }[] | undefined);
  const quotes = rawQuotes?.length
    ? rawQuotes.map((q) => ({ text: q.text ?? '', author: q.author_name ?? '—', role: q.role ?? '' }))
    : [
        { text: 'Citation de témoignage.', author: 'Personne A', role: 'Titre' },
      ];
  const title = (content?.title as string) ?? 'Témoignages';

  return (
    <section className="px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl">
          {title}
        </h2>
        <div className="mt-16 grid gap-8 md:grid-cols-2">
          {quotes.map((q, i) => (
            <blockquote key={i} className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-8">
              <p className="text-lg leading-relaxed text-[var(--text-secondary)]">&ldquo;{q.text}&rdquo;</p>
              <footer className="mt-6">
                <cite className="not-italic font-semibold text-[var(--text-primary)]">{q.author}</cite>
              </footer>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}
\`\`\`

## Format de sortie

Réponds UNIQUEMENT avec le code TSX complet du composant, entre des balises \`\`\`tsx et \`\`\`. Pas d'explication, pas de commentaire en dehors du code.`;

function extractTsxFromResponse(text: string): string {
  const match = text.match(/```tsx\s*\n([\s\S]*?)```/);
  if (match) return match[1].trim();
  const fallback = text.match(/```(?:typescript|ts)?\s*\n([\s\S]*?)```/);
  if (fallback) return fallback[1].trim();
  throw new Error('Code TSX non trouvé dans la réponse');
}

function updateCustomLayoutsFile(
  customLayoutsPath: string,
  componentName: string,
  importPath: string,
  role: string,
): void {
  let fileContent = fs.readFileSync(customLayoutsPath, 'utf-8');

  const importLine = `import { ${componentName} } from '${importPath}';`;

  // Add import before the CUSTOM_LAYOUTS declaration
  if (!fileContent.includes(importLine)) {
    fileContent = fileContent.replace(
      `/** Layouts générés par l'IA — enrichi automatiquement via /api/generate-layout */`,
      `${importLine}\n\n/** Layouts générés par l'IA — enrichi automatiquement via /api/generate-layout */`,
    );
  }

  // Add entry to the map
  const entryLine = `  ${role}: ${componentName},`;
  if (!fileContent.includes(entryLine)) {
    fileContent = fileContent.replace(
      /export const CUSTOM_LAYOUTS: Record<string, ComponentType<LayoutComponentProps>> = \{/,
      `export const CUSTOM_LAYOUTS: Record<string, ComponentType<LayoutComponentProps>> = {\n${entryLine}`,
    );
  }

  fs.writeFileSync(customLayoutsPath, fileContent, 'utf-8');
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { role?: string; sampleContent?: Record<string, unknown>; code?: string };
    const { role, sampleContent } = body;

    if (!role || typeof role !== 'string') {
      return NextResponse.json({ error: 'role est requis' }, { status: 400 });
    }

    const pascalName = toPascalCase(role);
    const componentName = `Layout${pascalName}`;
    const fileName = `${componentName}.tsx`;

    // Resolve paths
    const projectRoot = process.cwd();
    const layoutsDir = path.join(projectRoot, 'src', 'components', 'layouts');
    const filePath = path.join(layoutsDir, fileName);
    const customLayoutsPath = path.join(projectRoot, 'src', 'lib', 'custom-layouts.ts');

    // Direct code write (from gallery editor) — bypasses AI generation
    if (body.code && typeof body.code === 'string') {
      fs.writeFileSync(filePath, body.code, 'utf-8');
      updateCustomLayoutsFile(
        customLayoutsPath,
        componentName,
        `@/components/layouts/${componentName}`,
        role,
      );
      return NextResponse.json({
        success: true,
        role,
        componentPath: `src/components/layouts/${fileName}`,
      });
    }

    // Idempotence: skip if file already exists
    if (fs.existsSync(filePath)) {
      // File exists — just make sure custom-layouts.ts is up-to-date
      updateCustomLayoutsFile(
        customLayoutsPath,
        componentName,
        `@/components/layouts/${componentName}`,
        role,
      );
      return NextResponse.json({
        success: true,
        role,
        componentPath: `src/components/layouts/${fileName}`,
        alreadyExisted: true,
      });
    }

    // Build user prompt
    const userPrompt = `Génère un composant React pour le rôle de section "${role}".

Le nom du composant doit être: ${componentName}
L'interface doit être: ${componentName}Props

${sampleContent && Object.keys(sampleContent).length > 0
  ? `Voici un exemple de contenu (content) que ce composant recevra :
\`\`\`json
${JSON.stringify(sampleContent, null, 2)}
\`\`\`

Adapte l'extraction des données pour correspondre à cette structure. Chaque clé du content doit être utilisée et rendue dans le composant.`
  : `Le rôle "${role}" n'a pas de contenu d'exemple. Crée un composant générique avec un titre, un texte descriptif, et si pertinent des items en grille.`
}

Rappel : extraction défensive avec \`as\` + fallbacks, CSS variables uniquement, Tailwind pour le layout.`;

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const textBlock = response.content.find((b) => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      return NextResponse.json({ error: 'Réponse IA vide' }, { status: 500 });
    }

    const code = extractTsxFromResponse(textBlock.text);

    // Write the component file
    fs.writeFileSync(filePath, code, 'utf-8');

    // Update custom-layouts.ts
    updateCustomLayoutsFile(
      customLayoutsPath,
      componentName,
      `@/components/layouts/${componentName}`,
      role,
    );

    return NextResponse.json({
      success: true,
      role,
      componentPath: `src/components/layouts/${fileName}`,
    });
  } catch (err) {
    console.error('[generate-layout] error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erreur interne' },
      { status: 500 },
    );
  }
}

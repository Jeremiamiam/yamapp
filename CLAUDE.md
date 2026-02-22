# YAM Dashboard — Agent Instructions

## Stack
- Next.js 16 (App Router, Turbopack)
- TypeScript, Tailwind CSS (CSS variables for theming)
- Zustand (store in `src/lib/store/`)
- Supabase (auth + DB)
- Claude Sonnet 4 (AI agents)

## Conventions
- Langue de l'UI : **français**
- Design tokens : `var(--accent-lime)`, `var(--accent-cyan)`, `var(--accent-violet)`, `var(--accent-coral)`, `var(--accent-amber)`, `var(--accent-magenta)`
- Composants dans `src/features/<domain>/components/`
- API routes IA dans `src/app/api/`

## Wiki / Documentation in-app

L'app a un wiki intégré accessible via l'icône BookOpen dans le header (vue `wiki`).

**Source de vérité des données** : `src/features/wiki/wiki-data.ts`
**Composant d'affichage** : `src/features/wiki/components/WikiView.tsx`

### Quand mettre à jour le wiki

Quand tu ajoutes ou modifies une feature ou un agent IA, **mets à jour `src/features/wiki/wiki-data.ts`** :

| Ce que tu fais | Tableau à modifier |
|---|---|
| Nouvelle feature / vue | `FEATURE_SECTIONS` |
| Nouvel agent Creative Board | `CREATIVE_BOARD_AGENTS` (dans la bonne phase) |
| Nouvel agent Web Brief | `WEB_BRIEF_AGENTS` |
| Nouvel agent PLAUD | `PLAUD_AGENTS` |
| Nouvelle étape dans le pipeline global | `PIPELINE_STEPS` |
| Nouveau rôle de section (page zoning) | `SECTION_ROLES` |
| Nouveau style créatif | `CREATIVE_STYLES` |

Si tu ajoutes une nouvelle icône pour une feature, ajoute-la aussi dans `ICON_MAP` dans `WikiView.tsx`.

### Format des entrées

```ts
// Feature
{ id: 'mon-id', title: 'Mon titre', color: 'var(--accent-xxx)', icon: 'icon-key', description: '...', actions: ['...'] }

// Agent
{ name: 'Nom', role: 'Description du rôle', color: 'var(--accent-xxx)', emoji: '🎯', hasWebSearch?: true }
```

## Store (Zustand)

- Types dans `src/lib/store/types.ts`
- Slices dans `src/lib/store/slices/`
- Pour ajouter une nouvelle vue : modifier `ViewType`, ajouter `navigateTo*` dans `ui.slice.ts`, ajouter le case dans `page.tsx`, ajouter dans `VIEW_ORDER` et `restoreViewFromStorage` whitelist

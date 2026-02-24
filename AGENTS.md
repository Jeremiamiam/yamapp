# YAM Dashboard — Agent Instructions

## Stack
- Next.js 16 (App Router, Turbopack)
- TypeScript, Tailwind CSS (CSS variables for theming)
- Zustand (store in `src/lib/store/`)
- Supabase (auth + DB)
- Claude Sonnet 4 (AI agents)
- **Deploy : Vercel** (commit → push → merge main déclenche le deploy)

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

## Supabase — Migrations via MCP

Le MCP Supabase est connecté au projet YAM Dash. Tu peux **appliquer des migrations directement** sans passer par la CLI ni le terminal.

### Outils disponibles

| Outil | Usage |
|---|---|
| `mcp__supabase__apply_migration` | Appliquer une migration DDL (CREATE, ALTER, DROP…) |
| `mcp__supabase__execute_sql` | Exécuter du SQL brut (SELECT, INSERT, UPDATE…) |
| `mcp__supabase__list_tables` | Lister les tables d'un schéma |
| `mcp__supabase__list_migrations` | Voir l'historique des migrations appliquées |
| `mcp__supabase__generate_typescript_types` | Regénérer les types TS depuis le schéma DB |
| `mcp__supabase__get_advisors` | Vérifier les alertes sécurité/performance |

### Workflow migration

1. Écrire la migration SQL
2. L'appliquer via `apply_migration` (nom en snake_case, ex: `add_scheduled_at_to_projects`)
3. Créer aussi le fichier `.sql` dans `supabase/migrations/` pour le versionning git
4. Après un changement de schéma, appeler `generate_typescript_types` et mettre à jour les types si nécessaire
5. Vérifier avec `get_advisors` qu'il n'y a pas d'alertes RLS manquantes

> **Important** : `apply_migration` pour le DDL, `execute_sql` pour les données (DML). Ne jamais hardcoder d'IDs générés dans les migrations de données.

## Store (Zustand)

- Types dans `src/lib/store/types.ts`
- Slices dans `src/lib/store/slices/`
- Pour ajouter une nouvelle vue : modifier `ViewType`, ajouter `navigateTo*` dans `ui.slice.ts`, ajouter le case dans `page.tsx`, ajouter dans `VIEW_ORDER` et `restoreViewFromStorage` whitelist

## Cursor Cloud specific instructions

### Services

| Service | Commande | Port | Notes |
|---|---|---|---|
| Next.js dev server | `npm run dev` | 3000 | Turbopack (hot reload) |

### Commandes utiles

- **Dev server** : `npm run dev` (port 3000)
- **Lint** : `npm run lint` (ESLint 9, pre-existing warnings present)
- **Typecheck** : `npm run typecheck` (tsc --noEmit)
- **Build** : `npm run build` (needs Supabase env vars or placeholders)
- **Precheck** : `npm run precheck` (typecheck + lint combined)

### Supabase (cloud-hosted, no local instance)

L'app dépend de Supabase pour l'auth et la base de données. Il n'y a pas de Supabase local — le projet utilise une instance cloud.

- Les secrets `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY` sont **requis** pour que l'app fonctionne au-delà de la page de login.
- Sans ces secrets, le dev server démarre et les pages `/login` et `/signup` s'affichent, mais la connexion échoue ("Failed to fetch").
- Pour le build, des valeurs placeholder suffisent : `NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder npm run build`.
- Le middleware (`middleware.ts`) redirige toute requête non-authentifiée vers `/login`.

### Gotchas

- **Pas de tests automatisés** : le projet n'a aucun framework de test configuré (pas de Jest, Vitest, Playwright…). La validation se fait manuellement et via `npm run precheck`.
- **ESLint a des erreurs pré-existantes** : `npm run lint` retourne des erreurs (112 errors, 87 warnings) sur le code existant. Ce n'est pas bloquant pour le développement.
- **Node.js 20+** requis. Node 22 fonctionne aussi.
- **`.env.local`** est gitignored. Si absent, il faut le créer avec au minimum `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

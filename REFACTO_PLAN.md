# Plan de refactoring YAM Dashboard

> Document destiné à une IA de code. Chaque tâche est indépendante et peut être traitée séparément.
> Repo : Next.js 16 / TypeScript strict / Zustand / Supabase / Tailwind v4

---

## PRIORITÉ 1 — Nettoyage immédiat (sécurité / qualité)

### Tâche 1.1 — Supprimer tous les `console.*` de prod

**Fichiers concernés :**
- `src/lib/store.ts` — lignes 825, 833, 849, 856, 859, 882, 901, 909, 915, 921, 923, 928, 935, 948, 951, 957, 959, 962, 1001, 1016, 1028
- `src/components/ui/BillingTimeline.tsx` — lignes 66, 73, 76, 79, 85
- `src/hooks/useLocalStorage.ts` — lignes 15, 29

**Ce qu'il faut faire :**
- Supprimer tous les `console.log(...)` (debug temporaire)
- Garder les `console.error(...)` uniquement dans `src/lib/error-handler.ts` (c'est le seul endroit légitime)
- Supprimer les `console.error(...)` dans `store.ts` et `BillingTimeline.tsx` — ces erreurs doivent remonter via `handleError()` déjà en place, pas être loggées en doublon
- Dans `useLocalStorage.ts`, remplacer les `console.warn` par un simple `return initialValue` silencieux (erreur de parse localStorage = cas normal, pas besoin de bruit)

---

### Tâche 1.2 — Remplacer `alert()` par un système de toast

**Fichier concerné :** `src/lib/error-handler.ts`

**Contexte :**
La fonction `handleError(error)` utilise `alert()` natif du navigateur (lignes 32, 36, 40) avec des eslint-disable. C'est la seule place où les erreurs sont affichées à l'utilisateur.

**Ce qu'il faut faire :**

1. Créer `src/lib/toast.ts` — un système de toast minimaliste sans dépendance externe :

```typescript
// src/lib/toast.ts
// Toast system minimaliste — pas de lib externe

type ToastType = 'error' | 'success' | 'info';

function showToast(message: string, type: ToastType = 'info'): void {
  const el = document.createElement('div');
  el.textContent = message;
  el.style.cssText = `
    position: fixed; bottom: 1.5rem; right: 1.5rem; z-index: 9999;
    padding: 0.75rem 1.25rem; border-radius: 0.5rem; max-width: 24rem;
    font-size: 0.875rem; font-family: inherit; line-height: 1.4;
    background: ${type === 'error' ? '#ef4444' : type === 'success' ? '#22c55e' : '#3b82f6'};
    color: white; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    animation: toast-in 0.2s ease;
  `;

  if (!document.getElementById('yam-toast-style')) {
    const style = document.createElement('style');
    style.id = 'yam-toast-style';
    style.textContent = '@keyframes toast-in { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }';
    document.head.appendChild(style);
  }

  document.body.appendChild(el);
  setTimeout(() => el.remove(), 4000);
}

export const toast = {
  error: (msg: string) => showToast(msg, 'error'),
  success: (msg: string) => showToast(msg, 'success'),
  info: (msg: string) => showToast(msg, 'info'),
};
```

2. Mettre à jour `src/lib/error-handler.ts` — remplacer les 3 `alert()` par `toast.error(...)` :

```typescript
import { toast } from './toast';

export function handleError(error: unknown): void {
  if (error instanceof AppError) {
    toast.error(error.userMessage);
    console.error(`[${error.code}]`, error.message);
  } else if (error instanceof Error) {
    toast.error('Une erreur est survenue.');
    console.error(error);
  } else {
    toast.error('Une erreur inconnue est survenue.');
    console.error(error);
  }
}
```

3. Supprimer les `// eslint-disable-next-line no-alert` devenus inutiles

---

### Tâche 1.3 — Corriger les types `any`

**Fichiers concernés :**

**`src/app/settings/page.tsx` — ligne 63 :**
```typescript
// AVANT
const normalized = data.map((row: any) => ({

// APRÈS — typer le row Supabase correctement
type TeamMemberRow = { id: string; name: string; color: string; initials: string };
const normalized = data.map((row: TeamMemberRow) => ({
```

**`src/features/timeline/components/BacklogSidebar.tsx` — lignes 105-110 :**
```typescript
// AVANT
window.addEventListener('timeline-drag-move', handleTimelineDragMove as any);
window.addEventListener('timeline-drag-end', handleTimelineDragEnd as any);

// APRÈS — créer des handlers typés CustomEvent
const onDragMove = (e: Event) => handleTimelineDragMove(e as CustomEvent);
const onDragEnd = (e: Event) => handleTimelineDragEnd(e as CustomEvent);
window.addEventListener('timeline-drag-move', onDragMove);
window.addEventListener('timeline-drag-end', onDragEnd);
// et dans le cleanup :
window.removeEventListener('timeline-drag-move', onDragMove);
window.removeEventListener('timeline-drag-end', onDragEnd);
```

---

## PRIORITÉ 2 — Robustesse (performance / fiabilité)

### Tâche 2.1 — Ajouter un timeout au chargement initial

**Fichier :** `src/lib/store.ts`

**Contexte :** La fonction `loadData()` (vers ligne 275) lance ~9 requêtes Supabase en parallèle via `Promise.all` sans aucun timeout. Sur une connexion lente, l'app peut freezer indéfiniment.

**Ce qu'il faut faire :**

Wrapper le `Promise.all` principal avec un `Promise.race` + timeout :

```typescript
// Ajouter en haut du fichier, en dehors du store
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`Timeout: ${label} took more than ${ms}ms`)), ms)
  );
  return Promise.race([promise, timeout]);
}

// Dans loadData(), wrapper le Promise.all :
const results = await withTimeout(
  Promise.all([...les 9 requêtes...]),
  10000,
  'loadData'
);
```

---

### Tâche 2.2 — Valider le cache localStorage avant de l'utiliser

**Fichier :** `src/lib/store.ts` — vers ligne 244

**Contexte :** Le cache est parsé avec `JSON.parse(cachedData)` puis `rehydrateDates(parsed)` sans vérifier que la structure est valide. Si le cache est corrompu ou d'une version précédente, ça peut planter silencieusement.

**Ce qu'il faut faire :**

Ajouter une validation de structure minimale avant d'utiliser le cache :

```typescript
function isCacheValid(parsed: unknown): parsed is { team: unknown[]; clients: unknown[]; deliverables: unknown[]; calls: unknown[]; dayTodos: unknown[] } {
  if (!parsed || typeof parsed !== 'object') return false;
  const p = parsed as Record<string, unknown>;
  return Array.isArray(p.clients) && Array.isArray(p.deliverables) && Array.isArray(p.calls);
}

// Dans loadData(), après JSON.parse :
const parsed = JSON.parse(cachedData);
if (!isCacheValid(parsed)) {
  localStorage.removeItem(CACHE_KEY);
  localStorage.removeItem(CACHE_TIMESTAMP_KEY);
  set({ isLoading: true, loadingError: null });
  // continuer sans le cache
  return; // ou laisser tomber dans le bloc catch
}
```

---

## PRIORITÉ 3 — Refactoring structurel (maintenabilité long terme)

### Tâche 3.1 — Splitter `store.ts` en sous-stores

**Fichier :** `src/lib/store.ts` (1227 lignes actuellement)

**Contexte :** Le store Zustand contient tout : données métier, état UI, navigation, modals, auth. C'est difficile à maintenir et cause des re-renders inutiles.

**Structure cible :**

```
src/lib/store/
  index.ts          → re-export tout (rétrocompat imports existants)
  slices/
    data.slice.ts   → clients, deliverables, calls, team, dayTodos, billingHistory, comptaMonthly
    ui.slice.ts     → currentView, activeClientId, timelineDate, timelineFilters, modal
    auth.slice.ts   → currentUser, currentUserRole
    actions/
      clients.ts    → addClient, updateClient, deleteClient
      deliverables.ts → addDeliverable, updateDeliverable, deleteDeliverable, updateDeliverableBillingStatus
      calls.ts      → addCall, updateCall, deleteCall
      billing.ts    → addBillingHistory, updateBillingHistoryEntry, deleteBillingHistoryEntry, loadBillingHistory
      todos.ts      → addDayTodo, updateDayTodo, deleteDayTodo
      data.ts       → loadData (initial load + cache)
```

**Instructions de migration :**
1. Créer le dossier `src/lib/store/`
2. Extraire chaque slice avec son état + actions associées
3. Combiner dans `index.ts` avec `create()` + les slices (pattern Zustand recommandé)
4. Le fichier `src/lib/store.ts` existant devient un simple re-export :
   ```typescript
   export { useAppStore } from './store/index';
   ```
5. Aucun import dans l'app ne doit changer (`@/lib/store` continue de fonctionner)

**Ne pas faire en une seule fois** — commencer par extraire `auth.slice.ts` (le plus petit), valider que rien ne casse, puis continuer.

---

### Tâche 3.2 — Ajouter des tests unitaires sur les règles métier

**Fichier source :** `src/lib/production-rules.ts`

**Contexte :** Ce fichier contient les règles de transition de statut des deliverables (ex: `pending → in-progress`, blocages si prix manquant, etc.). C'est la logique la plus critique de l'app et elle n'est pas testée automatiquement.

**Ce qu'il faut faire :**

1. Installer Vitest (compatible Next.js, plus rapide que Jest) :
```bash
npm install -D vitest @vitejs/plugin-react
```

2. Créer `vitest.config.ts` à la racine :
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: { environment: 'jsdom' },
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
});
```

3. Ajouter dans `package.json` :
```json
"test": "vitest",
"test:run": "vitest run"
```

4. Créer `src/lib/__tests__/production-rules.test.ts` avec les cas suivants à couvrir :
   - `canMoveToStatus('pending', currentItem)` retourne false si prix manquant
   - `canMoveToStatus('in-progress', currentItem)` retourne false si statut est `to_quote`
   - `canMoveToStatus('completed', currentItem)` retourne true si `in-progress`
   - Transitions invalides retournent false avec un message d'erreur lisible
   - Auto-promotion client fonctionne correctement

---

### Tâche 3.3 — Ajouter un guide de setup développeur

**Fichier à créer :** `SETUP.md` à la racine

**Contenu minimal requis :**

```markdown
# Setup développeur

## Prérequis
- Node.js 20+
- npm 10+
- Compte Supabase (projet existant ou nouveau)

## Installation
1. `npm install`
2. Copier `.env.local.example` → `.env.local` et remplir les variables
3. `npm run dev`

## Variables d'environnement requises
- `NEXT_PUBLIC_SUPABASE_URL` — URL du projet Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Clé anonyme Supabase

## Base de données
- Schéma dans `supabase/migrations/` (ou décrire où sont les migrations)
- Pour seeder : `npm run seed:supabase`

## Scripts utiles
- `npm run dev` — démarrer en développement
- `npm run typecheck` — vérifier les types TypeScript
- `npm run lint` — linter ESLint
- `npm run precheck` — typecheck + lint (à faire avant commit)
- `npm test` — lancer les tests (après tâche 3.2)
```

---

## Ce qui n'est PAS dans ce plan (hors scope)

- **API routes serveur** pour les mutations — l'architecture Supabase client-side + RLS est suffisante pour ce type d'app. À reconsidérer si les règles métier deviennent plus complexes.
- **Storybook** — pas de valeur ajoutée avec si peu de composants partagés.
- **Sentry / logging cloud** — overkill pour l'instant. Si l'app part en production avec des users externes, à ajouter.
- **Offline mode / service worker** — hors scope.

---

## Ordre suggéré d'exécution

```
Tâche 1.1 (console logs)     → rapide, 20 min
Tâche 1.2 (toast)            → 30 min
Tâche 1.3 (any types)        → 20 min
Tâche 2.1 (timeout)          → 15 min
Tâche 2.2 (cache validation) → 15 min
Tâche 3.2 (tests vitest)     → 1-2h
Tâche 3.3 (SETUP.md)         → 30 min
Tâche 3.1 (split store)      → 3-4h (faire en dernier, plus risqué)
```

**Total estimé : ~1 journée de dev pour les tâches 1.x et 2.x, ~2 jours pour les 3.x**

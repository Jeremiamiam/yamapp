# Guide de développement - Workflow recommandé

## 🎯 Objectif

Éviter les builds cassés en production et maintenir la qualité du code.

---

## ⚡ Quick Start

### Installation

```bash
npm install
```

### Configuration

1. Copier `.env.example` vers `.env.local`
2. Remplir les variables Supabase:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
   ```

### Développement local

```bash
npm run dev
```

**⚠️ Important**: `npm run dev` ne fait PAS le check TypeScript complet!

---

## 📝 Workflow de développement

### 1. Avant de commencer

```bash
# Mettre à jour depuis le remote
git pull origin main

# Créer une branche (optionnel)
git checkout -b feature/ma-feature
```

---

### 2. Pendant le développement

#### Mode dev rapide
```bash
npm run dev
```

✅ Hot reload
❌ Pas de check TypeScript strict

#### Vérifier les types pendant le dev
```bash
# Dans un autre terminal
npm run typecheck -- --watch
```

---

### 3. Avant de commit

**OBLIGATOIRE**: Lancer le precheck

```bash
npm run precheck
```

Ce script lance:
- ✅ `tsc --noEmit` → Check TypeScript
- ✅ `npm run lint` → Check ESLint

**Si ça passe → OK pour commit**
**Si ça échoue → Corriger avant de commit**

---

### 4. Commit

```bash
# Stage les fichiers modifiés
git add .

# Commit avec message descriptif
git commit -m "feat: add billing timeline edit feature"

# Co-authoring avec Claude (si applicable)
git commit -m "fix: resolve TypeScript error in store

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### 5. Avant de push

**Double check** (recommandé):

```bash
# Build complet comme Netlify
npm run build
```

Si le build passe → ✅ Push sans risque

---

### 6. Push

```bash
git push origin main
```

Netlify va automatiquement:
1. Installer les dépendances
2. Lancer `npm run build`
3. Déployer si le build passe

---

## 🚨 Règles d'or

### ❌ NE JAMAIS

1. **Push sans `npm run precheck`**
   - Risque: Build Netlify échoue
   - Solution: Toujours precheck avant

2. **Force push sur `main` sans raison**
   - Exception: Récupération après rebase destructif (avec précautions)
   - Toujours vérifier qu'on est seul sur le projet

3. **Commit des secrets**
   - `.env.local` est dans `.gitignore`
   - Vérifier avec `git status` avant commit

4. **Modifier les migrations SQL existantes**
   - Créer une NOUVELLE migration pour corriger
   - Ne jamais éditer une migration déjà appliquée

---

### ✅ TOUJOURS

1. **Tester en local d'abord**
   ```bash
   npm run dev  # Test rapide
   npm run build  # Test complet
   ```

2. **Commit atomiques**
   - 1 commit = 1 fonctionnalité/fix
   - Message clair et descriptif

3. **Pull avant push**
   ```bash
   git pull origin main
   git push origin main
   ```

4. **Vérifier les types**
   ```bash
   npm run typecheck
   ```

---

## 🛠️ Scripts npm disponibles

| Script | Description | Quand l'utiliser |
|--------|-------------|------------------|
| `dev` | Dev mode (port 3000) | Pendant le développement |
| `build` | Build production | Avant push (recommandé) |
| `start` | Serveur production | Tester le build localement |
| `lint` | ESLint check | Avant commit |
| `typecheck` | TypeScript check | Avant commit |
| `precheck` | Lint + TypeCheck | **Avant chaque push** |

---

## 🔍 Debugging

### Build échoue en local

```bash
# 1. Clean install
rm -rf node_modules .next
npm install

# 2. Re-build
npm run build
```

### TypeScript errors

```bash
# Voir toutes les erreurs
npm run typecheck

# Watch mode pendant dev
npm run typecheck -- --watch
```

### Supabase issues

```bash
# Vérifier la connexion
npx supabase status

# Reset local DB (dev only!)
npx supabase db reset

# Push migrations
npx supabase db push
```

---

## 🎨 Standards de code

### TypeScript

#### ✅ DO
```typescript
// Type explicite pour reduce
const total = items.reduce((sum: number, item) => sum + item.value, 0);

// Typage des props
interface MyComponentProps {
  title: string;
  onSave: (data: MyData) => void;
}

// Const assertions
const STATUS_LABELS = {
  pending: 'En attente',
  done: 'Terminé',
} as const;
```

#### ❌ DON'T
```typescript
// any sans raison
const data: any = response.data;

// Ignorer erreurs TypeScript
// @ts-ignore

// Pas de type initial dans reduce
const total = items.reduce((sum, item) => sum + item.value);  // sum: unknown
```

---

### React

#### ✅ DO
```typescript
// Hooks au top niveau
const [state, setState] = useState<MyType>(initialValue);

// Memoization quand nécessaire
const expensiveValue = useMemo(() => compute(data), [data]);

// Cleanup des effects
useEffect(() => {
  const subscription = subscribe();
  return () => subscription.unsubscribe();
}, []);
```

#### ❌ DON'T
```typescript
// Hooks conditionnels
if (condition) {
  useState(value);  // ❌
}

// Effects sans cleanup
useEffect(() => {
  window.addEventListener('resize', handler);
  // ❌ Pas de cleanup
}, []);
```

---

### Supabase

#### ✅ DO
```typescript
// Check erreurs
const { data, error } = await supabase.from('table').select();
if (error) {
  handleError(error);
  return;
}

// RLS policies toujours actives
// Utiliser authenticated role

// Typer les réponses
interface MyRow {
  id: string;
  name: string;
}
const { data } = await supabase.from('table').select<MyRow>();
```

#### ❌ DON'T
```typescript
// Ignorer les erreurs
const { data } = await supabase.from('table').select();
// ❌ Pas de check error

// Bypasser RLS sans raison
supabase.auth.setSession(adminSession);  // ❌ Danger

// Requêtes non typées
const data = await supabase.from('table').select();  // any
```

---

## 📊 Performance

### Build times

- **Dev start**: ~2-3s
- **First build**: ~10-15s
- **Rebuild**: ~5-8s
- **TypeCheck**: ~3-5s

### Optimizations

1. **Next.js cache** → Commit `.next/cache` si besoin
2. **TypeScript incremental** → Garder `tsconfig.tsbuildinfo`
3. **Node modules** → Utiliser `npm ci` en CI/CD

---

## 🔄 Git best practices

### Branches

```bash
# Feature
git checkout -b feature/billing-export

# Fix
git checkout -b fix/timeline-drag-drop

# Refactor
git checkout -b refactor/store-structure
```

### Commits

Format recommandé:
```
<type>: <description>

[body optionnel]

[footer optionnel]
```

Types:
- `feat`: Nouvelle fonctionnalité
- `fix`: Correction de bug
- `refactor`: Refactoring sans changement fonctionnel
- `chore`: Tâches de maintenance
- `docs`: Documentation
- `style`: Formatage (pas de changement de code)
- `test`: Ajout/modification de tests

Exemples:
```bash
git commit -m "feat: add billing history timeline"
git commit -m "fix: resolve TypeScript error in store.ts"
git commit -m "chore: update dependencies"
```

---

## 🚀 Déploiement

### Netlify

**Automatique sur push `main`**

1. Push vers GitHub
2. Netlify détecte le push
3. Build: `npm run build`
4. Deploy: `.next/` folder
5. Live en ~2-3 minutes

### Vérifier le déploiement

1. Ouvrir https://app.netlify.com
2. Check le build log
3. Tester l'URL de production

---

## 📚 Ressources

### Documentation externe
- [Next.js](https://nextjs.org/docs)
- [TypeScript](https://www.typescriptlang.org/docs)
- [Supabase](https://supabase.com/docs)
- [Zustand](https://docs.pmnd.rs/zustand)

### Documentation projet
- `README.md` → Setup et introduction
- `docs/BILLING-SYSTEM.md` → Système de facturation
- `docs/TROUBLESHOOTING.md` → Problèmes communs
- `docs/SUPABASE-SETUP.md` → Configuration Supabase

---

## ✅ Checklist quotidienne

Avant de finir ta journée:

- [ ] Tous les fichiers commités
- [ ] `npm run precheck` passe
- [ ] Push vers GitHub
- [ ] Build Netlify vérifié (si push main)
- [ ] Pas de console.log oubliés
- [ ] TODO commentaires créés pour les trucs à faire

---

**Dernière mise à jour**: 2026-02-16
**Version**: 1.0
**Auteur**: Jeremy + Claude Sonnet 4.5

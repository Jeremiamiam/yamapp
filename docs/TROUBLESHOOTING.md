# Guide de dépannage

## 🎯 Vue d'ensemble

Ce guide recense les problèmes courants rencontrés et leurs solutions.

---

## 🔥 Problèmes critiques

### Build Netlify échoue (TypeScript errors)

#### Symptôme
```
Failed to compile.
Type error: ...
```

#### Diagnostic local
```bash
# Reproduire l'erreur localement
npm run build

# Voir les erreurs TypeScript
npm run typecheck
```

#### Solutions courantes

**1. Type `unknown` dans error handling**
```typescript
// ❌ Problème
const message = e.message;  // unknown

// ✅ Solution
const message = e instanceof Error ? e.message : String(e);
// OU
const message = String(e.message);
```

**2. Reduce sans type initial**
```typescript
// ❌ Problème
array.reduce((sum, v) => sum + v, 0)  // sum inféré comme unknown

// ✅ Solution
array.reduce((sum: number, v) => sum + v, 0)
```

**3. SVG props non supportés**
```typescript
// ❌ Problème
<svg title="Mon titre">  // title n'existe pas sur SVGProps

// ✅ Solution
<svg aria-label="Mon titre">
```

**4. Type union incomplet**
```typescript
// ❌ Problème
type: 'deliverable' | 'call'  // Manque 'todo'

// ✅ Solution
type: 'deliverable' | 'call' | 'todo'
```

---

### Rebase destructif

#### Symptôme
- Fichiers locaux écrasés par versions remote
- UI cassée après rebase
- Historique Git confus

#### Prévention
```bash
# AVANT le rebase, créer un backup
git branch backup-avant-rebase

# Rebase avec précaution
git pull --rebase origin main
```

#### Récupération
```bash
# 1. Trouver le bon commit
git reflog

# 2. Reset à ce commit
git reset --hard abc1234

# 3. Force push SI seul sur le projet
git push origin main --force
```

⚠️ **ATTENTION**: Force push = destructif. Vérifier qu'on est seul!

---

## 🔐 Problèmes Supabase

### RLS Policy trop restrictive

#### Symptôme
- Opération échoue silencieusement
- Pas d'erreur visible
- Données pas sauvegardées

#### Diagnostic
```typescript
// Ajouter des logs
const { data, error } = await supabase.from('table').update(payload);
console.log('Error:', error);  // Vérifier si error existe
```

#### Solution
Vérifier les policies dans Supabase Dashboard:

```sql
-- Exemple: Policy trop restrictive
CREATE POLICY "Users update own row"
  ON table FOR UPDATE
  USING (user_id = auth.uid());  -- ❌ Seul owner

-- Solution: Ajouter cas admin
CREATE POLICY "Users and admins can update"
  ON table FOR UPDATE
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM team
      WHERE auth_user_id = auth.uid() AND app_role = 'admin'
    )
  );
```

---

### Migration SQL ne s'applique pas

#### Symptôme
- Modifications DB pas visibles
- Erreurs "column does not exist"

#### Solutions

**1. Via Supabase CLI**
```bash
# Link le projet (une fois)
npx supabase link --project-ref xxx

# Push les migrations
npx supabase db push
```

**2. Via Dashboard (plus simple)**
1. Aller sur https://supabase.com/dashboard
2. Projet → SQL Editor
3. Copier/coller le contenu de la migration
4. Run

---

### Type mismatch Supabase response

#### Symptôme
```typescript
// TypeScript error
Type 'TeamRow[]' is not assignable to type 'TeamRow'
```

#### Cause
Supabase retourne un array pour les joins, même si 1 seul résultat.

#### Solution
```typescript
// ❌ Avant
const { data } = await supabase
  .from('user_roles')
  .select('*, team(name, color)');
// team est TeamRow[] mais on attend TeamRow

// ✅ Après: Normaliser
const normalized = data.map(row => ({
  ...row,
  team: Array.isArray(row.team) ? (row.team[0] ?? null) : row.team
}));
```

---

## 💻 Problèmes développement local

### Port 3000 déjà utilisé

#### Symptôme
```
Error: listen EADDRINUSE: address already in use :::3000
```

#### Solutions

**Option 1: Tuer le process**
```bash
# macOS/Linux
lsof -ti:3000 | xargs kill -9

# Windows
netstat -ano | findstr :3000
taskkill /PID [PID] /F
```

**Option 2: Utiliser un autre port**
```bash
PORT=3001 npm run dev
```

---

### Hot reload ne marche pas

#### Causes possibles
1. Trop de fichiers ouverts
2. Permissions
3. Anti-virus qui bloque

#### Solutions

**macOS: Augmenter file watchers**
```bash
sudo sysctl -w kern.maxfiles=65536
sudo sysctl -w kern.maxfilesperproc=65536
```

**Linux**
```bash
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

---

### Node modules corrompus

#### Symptôme
```
Cannot find module 'xyz'
Module parse failed
```

#### Solution
```bash
# Clean install
rm -rf node_modules .next
npm install

# Si ça persiste
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

---

## 🎨 Problèmes UI/UX

### État ne se met pas à jour

#### Symptôme
- Changement visible puis revient à l'ancien état
- Ou aucun changement visible

#### Diagnostic
```typescript
// Ajouter des logs dans le store
updateSomething: async (id, data) => {
  console.log('🔧 Update called:', { id, data });

  const { error } = await supabase.update(data);
  console.log('📡 Supabase response:', { error });

  set(state => {
    console.log('🔄 Updating state');
    return { ...state, updated: true };
  });

  console.log('✅ Update complete');
}
```

#### Causes courantes
1. **RLS policy bloque** → Supabase error silencieux
2. **State pas synchronisé** → Reload needed
3. **Optimistic update sans rollback** → État incohérent

---

### Timeline drag & drop cassé

#### Symptôme
- Cards ne se déplacent pas
- Ghost card reste figé
- Drop ne fonctionne pas

#### Checks
```typescript
// 1. Vérifier onDragStart type
const onDragStart = (item: DragItem, type: 'deliverable' | 'call' | 'todo', ...) => {
  //                                           ^^^^^ 'todo' obligatoire
}

// 2. Vérifier dragState type
const [dragState, setDragState] = useState<{
  item: DragItem;
  type: 'deliverable' | 'call' | 'todo';  // ^^^ Complet
  x: number;
  y: number;
} | null>(null);
```

---

## 🔧 Problèmes Settings/Admin

### Impossible de modifier un membre

#### Symptôme
- Clic sur "Modifier" → édition s'ouvre
- Clic sur "OK" → rien ne se passe
- Ou erreur silencieuse

#### Diagnostic
```typescript
// Dans le composant
const handleSave = async () => {
  console.log('💾 Saving:', editValues);
  try {
    await updateTeamMember(memberId, editValues);
    console.log('✅ Save success');
  } catch (e) {
    console.error('❌ Save failed:', e);
  }
};
```

#### Causes courantes
1. **RLS policy** → Voir section Supabase
2. **Validation échoue** → Vérifier les contraintes DB
3. **ID incorrect** → Vérifier que `team_member_id` existe

---

### Membres dupliqués après modif

#### Symptôme
- Après modification, 2 entrées du même membre
- Données incohérentes

#### Cause
Store pas mis à jour correctement après update.

#### Solution
```typescript
// ✅ Bon pattern
set(state => ({
  team: state.team.map(m =>
    m.id === memberId ? { ...m, ...newData } : m
  )
}));

// ❌ Mauvais pattern
set(state => ({
  team: [...state.team, updatedMember]  // Ajoute au lieu de remplacer
}));
```

---

## 📊 Problèmes performances

### Build trop lent

#### Si > 30 secondes

**Diagnostics**
```bash
# Mesurer le temps
time npm run build

# Vérifier la taille
du -sh .next/

# Nettoyer le cache
rm -rf .next/cache
```

**Optimisations**
1. Activer cache Turbopack (déjà fait)
2. Exclure node_modules du watch
3. Utiliser `npm ci` au lieu de `npm install`

---

### Page lente à charger

#### Symptôme
- First load > 3s
- Bundle size énorme

#### Diagnostics
```bash
# Analyser le bundle
npm run build
npx @next/bundle-analyzer
```

#### Solutions
1. **Dynamic imports** pour composants lourds
```typescript
const HeavyComponent = dynamic(() => import('./Heavy'), {
  loading: () => <Spinner />
});
```

2. **Lazy load** images
```tsx
<Image
  src="/large.jpg"
  loading="lazy"
  alt="Description"
/>
```

---

## 🐛 Erreurs communes

### `Cannot read property 'X' of undefined`

#### Solution
```typescript
// ❌ Pas safe
const value = obj.nested.prop;

// ✅ Safe
const value = obj?.nested?.prop;

// ✅ Avec fallback
const value = obj?.nested?.prop ?? 'default';
```

---

### `Maximum update depth exceeded`

#### Cause
State update dans render loop.

#### Solution
```typescript
// ❌ Problème
function Component() {
  const [state, setState] = useState(0);
  setState(state + 1);  // ❌ Loop infini
  return <div>{state}</div>;
}

// ✅ Solution
function Component() {
  const [state, setState] = useState(0);

  useEffect(() => {
    setState(state + 1);  // ✅ Dans effect
  }, []);  // Une seule fois

  return <div>{state}</div>;
}
```

---

### `Warning: Each child should have a unique key`

#### Solution
```typescript
// ❌ Pas de key
items.map(item => <div>{item.name}</div>)

// ❌ Index comme key (si ordre change)
items.map((item, i) => <div key={i}>{item.name}</div>)

// ✅ ID unique stable
items.map(item => <div key={item.id}>{item.name}</div>)
```

---

## 📞 Obtenir de l'aide

### En cas de blocage

1. **Consulter les logs**
   - Console navigateur (F12)
   - Terminal `npm run dev`
   - Netlify build logs

2. **Reproduire localement**
   ```bash
   npm run build
   npm run typecheck
   ```

3. **Vérifier la doc**
   - `docs/` folder
   - README.md
   - Ce fichier (TROUBLESHOOTING.md)

4. **Chercher dans l'historique**
   ```bash
   git log --grep="le problème"
   git log --all -- path/to/file
   ```

5. **Demander à Claude**
   - Expliquer le symptôme
   - Copier les logs d'erreur
   - Partager le contexte

---

## 🔍 Debugging avancé

### Activer les logs Supabase

```typescript
const supabase = createClient(url, key, {
  auth: {
    debug: true  // Logs détaillés
  }
});
```

### React DevTools

1. Installer l'extension Chrome/Firefox
2. Ouvrir DevTools → onglet "⚛️ Components"
3. Inspecter state/props

### Network tab

1. F12 → Network
2. Filter: Fetch/XHR
3. Vérifier les appels Supabase
4. Check status codes et responses

---

## ✅ Checklist de débogage

Avant de demander de l'aide:

- [ ] J'ai lu ce guide
- [ ] J'ai reproduit localement
- [ ] J'ai checké les logs (console + terminal)
- [ ] J'ai essayé `rm -rf node_modules && npm install`
- [ ] J'ai checké que mes envvars sont correctes
- [ ] J'ai vérifié les RLS policies Supabase
- [ ] J'ai lancé `npm run typecheck`
- [ ] J'ai regardé l'historique Git pour des changements similaires

---

**Dernière mise à jour**: 2026-02-16
**Version**: 1.0
**Auteur**: Jeremy + Claude Sonnet 4.5

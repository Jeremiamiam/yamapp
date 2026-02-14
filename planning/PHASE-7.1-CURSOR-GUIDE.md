# Guide Cursor - Phase 7.1: Sécurité (Auth + RLS)

## 🎯 Comment utiliser ce guide

Ce document contient les prompts exacts à donner à Cursor pour sécuriser l'app avec Auth + RLS.

**Prérequis**: Phase 7 (Supabase Migration) complète et fonctionnelle.

**Durée**: 2-3h (demi-journée)

---

## 📅 ÉTAPE 1: Activer Auth Supabase (15 min)

### Étape 1A: Activer Email Auth (manuel)

**Action manuelle** (pas via Cursor):
1. Aller sur Supabase Dashboard > **Authentication > Providers**
2. Vérifier que **Email** est activé (devrait être activé par défaut)
3. Settings recommandés:
   - **Enable email confirmations**: OFF (pour MVP, éviter email de confirmation)
   - **Enable email sign-ups**: OFF (on crée users manuellement pour contrôle)

### Étape 1B: Créer premier user (manuel)

**Action manuelle:**
1. Aller sur Supabase Dashboard > **Authentication > Users**
2. Cliquer **Add user > Create new user**
3. Remplir:
   ```
   Email: jeremy@yam.agency
   Password: [générer mot de passe fort - noter dans 1Password]
   Auto Confirm User: ✅ YES
   ```
4. Créer d'autres users pour l'équipe:
   ```
   Email: alex@yam.agency
   Password: [mot de passe fort]
   Auto Confirm User: ✅ YES
   ```

---

## 📅 ÉTAPE 2: Activer RLS + Policies (30 min)

### Étape 2A: Activer RLS sur toutes les tables

**Prompt Cursor:**
```
Lis planning/PHASE-7.1-SECURITY-PLAN.md section "Étape 2".

Va sur Supabase > SQL Editor et exécute ce script SQL:

-- Activer RLS sur les 8 tables
ALTER TABLE team ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE compta_monthly ENABLE ROW LEVEL SECURITY;

Vérifie dans Table Editor que chaque table affiche "RLS enabled" ✅
```

### Étape 2B: Créer policies "Authenticated users only"

**Prompt Cursor:**
```
Toujours dans Supabase SQL Editor, exécute ce script pour créer les policies:

-- Policy team (lecture seule)
CREATE POLICY "Authenticated users can read team"
ON team FOR SELECT TO authenticated USING (true);

-- Policies full access pour les 7 autres tables
CREATE POLICY "Authenticated users full access clients"
ON clients FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users full access contacts"
ON contacts FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users full access client_links"
ON client_links FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users full access documents"
ON documents FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users full access deliverables"
ON deliverables FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users full access calls"
ON calls FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users full access compta"
ON compta_monthly FOR ALL TO authenticated USING (true) WITH CHECK (true);

Vérifie que les policies apparaissent dans Table Editor > [chaque table] > Policies.
```

---

## 📅 ÉTAPE 3: Créer LoginPage (30 min)

### Étape 3A: Créer dossier auth

**Prompt Cursor:**
```
Crée le dossier src/components/auth/
```

### Étape 3B: Créer LoginPage component

**Prompt Cursor:**
```
Lis planning/PHASE-7.1-SECURITY-PLAN.md section "Étape 3.1".

Crée src/components/auth/LoginPage.tsx avec:

1. Form de login (email + password)
2. Design cohérent avec le thème YAM:
   - Background dark (#0a0a0a)
   - Card dark (#1a1a1a)
   - Accent neon green (#d4f542)
   - Borders subtiles (white/10)
3. État loading pendant login
4. Affichage des erreurs (message rouge)
5. Utilise supabase.auth.signInWithPassword()

Référence le code exact dans PHASE-7.1-SECURITY-PLAN.md.
```

---

## 📅 ÉTAPE 4: Auth Guard dans page.tsx (30 min)

### Étape 4A: Ajouter Auth Guard

**Prompt Cursor:**
```
Lis planning/PHASE-7.1-SECURITY-PLAN.md section "Étape 4.1".

Modifie src/app/page.tsx pour:

1. Ajouter state session (useState<Session | null>)
2. Ajouter state authLoading
3. useEffect pour check initial session (supabase.auth.getSession())
4. useEffect pour listen auth changes (onAuthStateChange)
5. useEffect pour loadData() quand authentifié
6. Afficher 3 états:
   - authLoading → loader
   - !session → <LoginPage />
   - session + isLoading → loader "Chargement des données..."
   - session + !isLoading → Dashboard normal

Copie le code exact depuis PHASE-7.1-SECURITY-PLAN.md section 4.1.
```

### Étape 4B: Ajouter bouton Logout dans Header

**Prompt Cursor:**
```
Lis planning/PHASE-7.1-SECURITY-PLAN.md section "Étape 4.2".

Dans src/components/Header.tsx:

1. Importe supabase
2. Crée fonction handleLogout qui appelle supabase.auth.signOut()
3. Ajoute un bouton "Déconnexion" dans le coin droit du header
4. Style cohérent: text-white/60 hover:text-white

Le logout va automatiquement trigger onAuthStateChange et redirect vers login.
```

---

## 📅 ÉTAPE 5: Tests & Validation (30 min)

### Étape 5A: Test login flow

**Prompt Cursor (pour guider les tests):**
```
Aide-moi à tester le flow Auth complet:

1. Lance l'app (npm run dev)
2. Vérifie que LoginPage s'affiche au démarrage
3. Teste login avec email invalide → erreur affichée
4. Teste login avec password incorrect → erreur affichée
5. Login avec jeremy@yam.agency + bon password → redirect Dashboard
6. Vérifie que les données se chargent depuis Supabase
7. Clique "Déconnexion" → retour LoginPage

Dis-moi ce que tu observes à chaque étape.
```

### Étape 5B: Test session persistence

**Actions manuelles à tester:**
1. Login avec credentials corrects
2. Refresh page (F5) → devrait rester connecté
3. Fermer onglet + rouvrir `localhost:3000` → devrait rester connecté
4. Cliquer "Déconnexion" → retour login
5. Refresh page → devrait rester sur login (pas auto-login)

### Étape 5C: Test RLS enforcement

**Prompt Cursor:**
```
Aide-moi à vérifier que RLS bloque l'accès non authentifié:

1. Déconnecte-toi de l'app
2. Ouvre DevTools > Console
3. Exécute ce code:

const { createClient } = await import('@supabase/supabase-js')
const supabase = createClient(
  'https://[ton-project-ref].supabase.co',
  '[ton-anon-key]'
)
const { data, error } = await supabase.from('clients').select('*')
console.log('Data:', data)
console.log('Error:', error)

Si RLS fonctionne correctement:
- data devrait être [] (vide)
- OU error devrait mentionner "policy"

Si data contient des clients → RLS pas activé correctement, on debug.
```

### Étape 5D: Test CRUD avec auth

**Prompt Cursor:**
```
Teste tous les CRUD après login:

1. Login avec jeremy@yam.agency
2. Crée un deliverable → vérifie qu'il persiste
3. Édite un deliverable → vérifie qu'il persiste
4. Supprime un deliverable → vérifie qu'il disparaît
5. Même chose pour: Call, Contact, Document
6. Teste drag-drop sur timeline → vérifie que due_date update

Si tout fonctionne → Auth + RLS OK ✅
Si erreurs → on debug ensemble.
```

---

## ✅ Validation Finale

**Checklist à cocher:**

**Auth:**
- [ ] LoginPage s'affiche au démarrage
- [ ] Design cohérent (dark theme + neon green)
- [ ] Login avec credentials corrects → Dashboard
- [ ] Login avec credentials incorrects → message erreur
- [ ] Bouton "Déconnexion" dans Header fonctionne
- [ ] Session persiste après refresh (F5)
- [ ] Session persiste après fermeture onglet

**RLS:**
- [ ] RLS activé sur 8 tables (vérifié dans Table Editor)
- [ ] 8 policies créées (vérifié dans Policies)
- [ ] Test DevTools: requête sans auth bloquée

**CRUD:**
- [ ] Créer deliverable avec auth → fonctionne
- [ ] Éditer deliverable avec auth → fonctionne
- [ ] Supprimer deliverable avec auth → fonctionne
- [ ] Tous les CRUD (calls, contacts, documents) fonctionnent

**Performance:**
- [ ] Login rapide (< 1s)
- [ ] LoadData après login rapide (< 2s)
- [ ] Pas de ralentissement visible vs Phase 7 sans auth

---

## 🚨 Si Cursor rencontre un problème

### Erreur: "Invalid API key" après ajout Auth

**Solution:**
```
Vérifie que tu utilises toujours l'anon key (pas service role) dans src/lib/supabase.ts:

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! // ← anon key

L'anon key est OK pour client-side avec RLS activé.
```

### Erreur: "Row level security policy violation"

**Solution:**
```
1. Vérifie que l'user est authentifié (session existe)
2. Vérifie que les policies sont créées dans Supabase SQL Editor
3. Vérifie la syntaxe des policies:

-- CORRECT:
CREATE POLICY "name" ON table FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- INCORRECT:
CREATE POLICY "name" ON table FOR ALL USING (true); -- manque TO authenticated
```

### Erreur: "Auth session missing" après refresh

**Solution:**
```
Vérifie que supabase.auth.getSession() est appelé dans useEffect au mount:

useEffect(() => {
  supabase.auth.getSession().then(({ data: { session } }) => {
    setSession(session)
    setAuthLoading(false)
  })
}, []) // ← deps vide = run au mount seulement
```

### Erreur: Login réussit mais Dashboard ne s'affiche pas

**Solution:**
```
Vérifie l'ordre des conditions dans page.tsx:

if (authLoading) return <Loader /> // 1. Check auth loading
if (!session) return <LoginPage /> // 2. Check session
if (isLoading) return <Loader /> // 3. Check data loading
return <Dashboard /> // 4. Afficher app

Si l'ordre est incorrect, ça peut causer des bugs.
```

### Erreur: "loadData() called in a loop"

**Solution:**
```
Vérifie les deps du useEffect qui appelle loadData():

useEffect(() => {
  if (session) {
    loadData()
  }
}, [session, loadData]) // ← loadData ne doit PAS changer à chaque render

Si loadData n'est pas stable, wrap dans useCallback dans store.ts:

const loadData = useCallback(async () => {
  // ... fetch data
}, [])
```

---

## 💡 Tips pour travailler avec Cursor

### 1. Teste après chaque grande étape
```bash
# Après Étape 2 (RLS):
# Essaye d'accéder aux données sans auth → devrait échouer

# Après Étape 3 (LoginPage):
# Teste le design et la validation form

# Après Étape 4 (Auth Guard):
# Teste le flow complet login → dashboard → logout
```

### 2. Utilise Supabase Dashboard pour debug
- **Authentication > Users**: Voir les users créés
- **Authentication > Logs**: Voir tentatives de login
- **Table Editor > [Table] > Policies**: Vérifier RLS + policies

### 3. DevTools Console
```javascript
// Check session actuelle
const { data: { session } } = await supabase.auth.getSession()
console.log('Session:', session)

// Check user actuel
const { data: { user } } = await supabase.auth.getUser()
console.log('User:', user)
```

### 4. Git commits réguliers
```bash
git add src/components/auth/LoginPage.tsx
git commit -m "feat(auth): add LoginPage component"

git add src/app/page.tsx
git commit -m "feat(auth): add auth guard and session management"

git add src/components/Header.tsx
git commit -m "feat(auth): add logout button"
```

---

## 🎯 Résultat attendu après Phase 7.1

**Sécurité:**
- ✅ Auth Supabase fonctionnelle (email/password)
- ✅ RLS activé sur 8 tables
- ✅ Policies "authenticated users only"
- ✅ LoginPage avec design cohérent
- ✅ Session persistence OK
- ✅ Accès protégé (redirect login si non auth)

**UX:**
- ✅ Login rapide et fluide
- ✅ Messages erreurs clairs
- ✅ Logout simple (1 clic)
- ✅ Pas de ralentissement visible

**Production-ready:**
- ✅ App sécurisée pour données réelles
- ✅ Prête pour déploiement Vercel/Netlify
- ✅ Viable pour usage quotidien

---

## 🚀 Prochaines étapes après Phase 7.1

**L'app est maintenant sécurisée et viable.**

### Reste à faire pour PROD complète:
1. **Phase 5: Mobile & Responsive** (2-3 jours)
   - Timeline responsive
   - Touch targets 44x44px
   - Tests iOS/Android

2. **Phase 6 finale: Compta complète** (2-3h)
   - paiementStatus field
   - Nuance sécurisé/théorique
   - Coûts fixes paramétrables

3. **Phase 7.2 (optionnel): Rôles & Permissions**
   - Admin vs Employee vs Freelance
   - RLS policies par rôle
   - Audit logs

---

**Créé**: 2026-02-14
**Durée totale**: 2-3h (demi-journée)
**Priorité**: CRITIQUE pour production

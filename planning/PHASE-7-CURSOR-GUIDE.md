# Guide Cursor - Phase 7: Supabase Migration

## 🎯 Comment utiliser ce guide

Ce document contient les prompts exacts à donner à Cursor pour migrer vers Supabase, jour par jour.

**Prérequis**: Avoir lu `planning/PHASE-7-SUPABASE-PLAN.md` pour comprendre l'architecture globale.

---

## 📅 JOUR 1 - Setup Supabase (3-4h)

### Étape 1A: Créer projet Supabase (manuel)

**Action manuelle** (pas via Cursor):
1. Aller sur [supabase.com](https://supabase.com)
2. Sign up ou Login
3. Créer nouveau projet: "YAM Dashboard"
4. Région: Europe (Frankfurt DE ou Paris FR)
5. Database password: générer un mot de passe fort (noter dans 1Password)
6. Attendre ~2 minutes que le projet soit provisionné

### Étape 1B: Créer le schema SQL

**Prompt Cursor:**
```
Lis planning/PHASE-7-SUPABASE-PLAN.md section "Schema Supabase".

Va sur Supabase > SQL Editor et exécute le script SQL qui crée les 8 tables:
- team
- clients
- contacts
- client_links
- documents
- deliverables
- calls
- compta_monthly

N'oublie pas la section RLS qui désactive Row Level Security pour MVP.

Une fois exécuté, vérifie dans Table Editor que les 8 tables sont créées.
```

### Étape 1C: Récupérer credentials

**Action manuelle:**
1. Dans Supabase: Settings > API
2. Noter:
   - **Project URL**: `https://[project-ref].supabase.co`
   - **anon public key**: (clé publique, OK côté client)
   - **service_role secret key**: (clé secrète, JAMAIS exposer côté client)

### Étape 1D: Créer .env.local

**Prompt Cursor:**
```
Crée un fichier .env.local à la racine avec:

NEXT_PUBLIC_SUPABASE_URL=https://[TON-PROJECT-REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[TA-ANON-KEY]
SUPABASE_SERVICE_ROLE_KEY=[TA-SERVICE-ROLE-KEY]

Remplace les valeurs par mes credentials Supabase (je te les donne).

Ensuite, ajoute .env.local au .gitignore si ce n'est pas déjà fait.
```

**Donne tes credentials à Cursor après ce prompt.**

### Étape 1E: Installer Supabase client

**Prompt Cursor:**
```
Installe le client Supabase:
npm install @supabase/supabase-js
```

### Étape 1F: Créer client Supabase

**Prompt Cursor:**
```
Crée src/lib/supabase.ts qui initialise le client Supabase avec les credentials .env.local.

Référence: planning/PHASE-7-SUPABASE-PLAN.md section "Étape 1.7".

Le client doit:
- Lire NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY
- Exporter une instance 'supabase' prête à l'emploi
```

### ✅ Validation Jour 1

**Prompt Cursor:**
```
Vérifie que:
1. Les 8 tables existent dans Supabase Table Editor (manuel)
2. .env.local existe et est dans .gitignore
3. src/lib/supabase.ts existe et compile sans erreur
4. npm run dev démarre sans erreur

Affiche-moi un résumé des checks.
```

---

## 📅 JOUR 2 - Script de Seed (3-4h)

### Étape 2A: Créer le dossier scripts

**Prompt Cursor:**
```
Crée un dossier scripts/ à la racine (même niveau que src/).
```

### Étape 2B: Créer le script seed

**Prompt Cursor:**
```
Lis planning/PHASE-7-SUPABASE-PLAN.md section "Étape 2.1".

Crée scripts/seed-supabase.ts qui:
1. Utilise le service role key pour bypass RLS
2. Lit src/lib/seed.json
3. Insère les données dans Supabase dans l'ordre:
   - team (pas de FK)
   - clients (pas de FK)
   - contacts (FK vers clients)
   - client_links (FK vers clients)
   - documents (FK vers clients)
   - deliverables (FK vers clients + team)
   - calls (FK vers clients + team)
   - compta_monthly (pas de FK)

Le script doit mapper les champs camelCase du JSON vers snake_case de Supabase:
- createdAt → created_at
- updatedAt → updated_at
- clientId → client_id
- dueDate → due_date
- assigneeId → assignee_id
- prixFacturé → prix_facture
- coutSousTraitance → cout_sous_traitance
- scheduledAt → scheduled_at
- callType → call_type
- entrées → entrees
- soldeCumulé → solde_cumule

Gère les erreurs et affiche des logs pour chaque table.
```

### Étape 2C: Installer tsx

**Prompt Cursor:**
```
Installe tsx pour exécuter TypeScript:
npm install --save-dev tsx
```

### Étape 2D: Ajouter script NPM

**Prompt Cursor:**
```
Dans package.json, ajoute un script "seed":

"scripts": {
  "seed": "tsx scripts/seed-supabase.ts"
}
```

### Étape 2E: Exécuter le seed

**Prompt Cursor:**
```
Exécute le seed:
npm run seed

Affiche-moi le résultat. Si erreurs, on debug ensemble.
```

### ✅ Validation Jour 2

**Action manuelle:**
1. Va sur Supabase > Table Editor
2. Vérifie les counts:
   - team: 5 rows
   - clients: 10 rows
   - contacts: 10 rows
   - client_links: 0 rows (normal, vide dans seed.json)
   - documents: 11 rows
   - deliverables: 14 rows
   - calls: 8 rows
   - compta_monthly: 12 rows

**Prompt Cursor:**
```
Confirme-moi que toutes les tables contiennent des données dans Supabase.
Si manquant, on relance le seed.
```

---

## 📅 JOUR 3 - Adapter le Store (5-6h)

### Étape 3A: Créer mappers

**Prompt Cursor:**
```
Lis planning/PHASE-7-SUPABASE-PLAN.md section "Étape 3.1".

Crée src/lib/supabase-mappers.ts avec:
- mapSupabaseClient() - Supabase row → Client type
- mapSupabaseDeliverable() - Supabase row → Deliverable type
- mapSupabaseCall() - Supabase row → Call type
- mapSupabaseContact() - Supabase row → Contact type
- mapSupabaseDocument() - Supabase row → ClientDocument type
- mapSupabaseLink() - Supabase row → ClientLink type

ET les mappers inverses (App → Supabase):
- toSupabaseDeliverable() - Deliverable → Supabase insert object
- toSupabaseCall() - Call → Supabase insert object
- toSupabaseContact() - Contact → Supabase insert object
- toSupabaseDocument() - ClientDocument → Supabase insert object

Ces mappers convertissent entre camelCase (app) et snake_case (Supabase).
```

### Étape 3B: Ajouter loadData() au store

**Prompt Cursor:**
```
Lis planning/PHASE-7-SUPABASE-PLAN.md section "Étape 3.2".

Dans src/lib/store.ts:

1. Importe supabase et les mappers
2. Supprime l'import de mock-data
3. Change l'état initial à vide: clients: [], deliverables: [], calls: []
4. Ajoute une action async loadData() qui:
   - Fetch toutes les tables depuis Supabase
   - Map les rows vers nos types TypeScript
   - Merge contacts/links/documents dans chaque client
   - Update le state

5. Ajoute isLoading et loadingError au state pour tracking.
```

### Étape 3C: Refactoriser les actions CRUD

**Prompt Cursor (partie 1 - Deliverables):**
```
Lis planning/PHASE-7-SUPABASE-PLAN.md section "Étape 3.3".

Refactorise ces actions dans src/lib/store.ts pour utiliser Supabase:

1. addDeliverable: insert dans Supabase puis update state local
2. updateDeliverable: update dans Supabase puis update state local
3. deleteDeliverable: delete dans Supabase puis update state local
4. toggleDeliverableStatus: update status dans Supabase puis update state local

Utilise les mappers toSupabaseDeliverable().
Garde le try/catch et handleError().
```

**Prompt Cursor (partie 2 - Calls):**
```
Même chose pour les actions Call:
- addCall
- updateCall
- deleteCall

Utilise toSupabaseCall().
```

**Prompt Cursor (partie 3 - Contacts):**
```
Même chose pour les actions Contact:
- addContact
- updateContact
- deleteContact

Note: les contacts sont nested dans clients, donc après mutation Supabase, update le client correspondant dans le state.
```

**Prompt Cursor (partie 4 - Documents):**
```
Même chose pour les actions Document:
- addDocument
- updateDocument
- deleteDocument

Les documents sont aussi nested dans clients.
```

**Prompt Cursor (partie 5 - Clients):**
```
Même chose pour les actions Client:
- addClient
- updateClient
- deleteClient
```

**Prompt Cursor (partie 6 - Client Links):**
```
Même chose pour les actions ClientLink:
- addClientLink
- deleteClientLink
```

### Étape 3D: Appeler loadData() au mount

**Prompt Cursor:**
```
Dans src/app/page.tsx:

1. Récupère loadData du store
2. Appelle loadData() dans useEffect au mount
3. Affiche un loader pendant isLoading
4. Affiche une erreur si loadingError

Référence: planning/PHASE-7-SUPABASE-PLAN.md section "Étape 3.4" et "Étape 4.2".
```

### ✅ Validation Jour 3

**Prompt Cursor:**
```
Lance l'app (npm run dev) et vérifie:

1. Timeline affiche les deliverables depuis Supabase
2. Crée un nouveau deliverable → vérifie qu'il apparaît dans Supabase Table Editor
3. Édite un deliverable → vérifie que l'update persiste
4. Supprime un deliverable → vérifie qu'il disparaît de Supabase
5. Même chose pour Calls
6. Même chose pour Contacts
7. Même chose pour Documents

Affiche-moi un rapport des tests.
```

---

## 📅 JOUR 4 - Tests & Polish (3-4h)

### Étape 4A: Checklist complète CRUD

**Prompt Cursor:**
```
Aide-moi à tester tous les flows CRUD:

Deliverables:
- [ ] Créer deliverable avec date → apparaît sur timeline
- [ ] Créer deliverable sans date → apparaît dans backlog
- [ ] Éditer deliverable → persiste
- [ ] Toggle status (pending → in-progress → completed) → persiste
- [ ] Supprimer deliverable → disparaît de Supabase
- [ ] Drag-drop deliverable sur timeline → due_date update persiste

Calls:
- [ ] Créer call avec date → apparaît sur timeline
- [ ] Créer call sans date → apparaît dans backlog
- [ ] Éditer call → persiste
- [ ] Supprimer call → disparaît de Supabase

Contacts:
- [ ] Ajouter contact à client → persiste
- [ ] Éditer contact → persiste
- [ ] Supprimer contact → disparaît de Supabase

Documents:
- [ ] Créer document (brief/report/note) → persiste
- [ ] Éditer document → persiste
- [ ] Supprimer document → disparaît de Supabase

Clients:
- [ ] Créer client → persiste
- [ ] Éditer client (nom, status) → persiste
- [ ] Supprimer client → disparaît avec cascade (contacts, documents, deliverables, calls)

Filtres:
- [ ] Filtrer par client status (prospect/client) → fonctionne
- [ ] Filtrer par team member → fonctionne

Compta:
- [ ] Vue Compta affiche les données de compta_monthly → fonctionne

Donne-moi un checklist interactif pour tester un par un.
```

### Étape 4B: Améliorer loading states

**Prompt Cursor:**
```
Dans src/app/page.tsx:

Améliore le loader pendant loadData():
- Spinner centralisé
- Message "Chargement des données..."
- Design cohérent avec le thème (neon green sur dark)

Référence: planning/PHASE-7-SUPABASE-PLAN.md section "Étape 4.2".
```

### Étape 4C: Error handling robuste

**Prompt Cursor:**
```
Vérifie que toutes les actions CRUD dans store.ts ont un try/catch correct:
- Si erreur Supabase, appelle handleError()
- Ne pas update le state local si erreur
- Logger l'erreur dans console pour debug
```

### Étape 4D: Documentation Supabase

**Prompt Cursor:**
```
Crée docs/SUPABASE-SETUP.md avec:

1. Les credentials Supabase (URL, Project ID)
2. La liste des 8 tables
3. Les instructions pour seed (npm run seed)
4. Les instructions pour setup local (.env.local)
5. Note sur RLS disabled pour MVP

Référence: planning/PHASE-7-SUPABASE-PLAN.md section "Étape 4.5".
```

### Étape 4E (BONUS): Supabase Realtime

**Prompt Cursor (optionnel):**
```
Si j'ai du temps, implémente Supabase Realtime subscriptions pour:
- deliverables table
- calls table

Ça permettra de sync automatiquement entre onglets.

Référence: planning/PHASE-7-SUPABASE-PLAN.md section "Étape 4.3".
```

### ✅ Validation Finale Jour 4

**Prompt Cursor:**
```
Résumé final:

1. Tous les flows CRUD testés → ✅
2. Loading states implémentés → ✅
3. Error handling robuste → ✅
4. Documentation créée → ✅
5. App utilisable au quotidien avec données persistantes → ✅

Affiche-moi un rapport de completion de Phase 7.
```

---

## 🚨 Si Cursor rencontre un problème

### Erreur: "Invalid API key"
```
Vérifie .env.local:
- NEXT_PUBLIC_SUPABASE_URL correct (https://[project-ref].supabase.co)
- NEXT_PUBLIC_SUPABASE_ANON_KEY correct (copié depuis Supabase > Settings > API)
- Redémarre le serveur Next.js (npm run dev)
```

### Erreur: "relation does not exist" dans seed
```
Vérifie que le schema SQL a été exécuté dans Supabase SQL Editor.
Les 8 tables doivent exister avant de run le seed.
```

### Erreur: "insert violates foreign key constraint"
```
L'ordre d'insertion dans le seed est important:
1. team (pas de FK)
2. clients (pas de FK)
3. contacts (FK → clients)
4. documents (FK → clients)
5. deliverables (FK → clients, team)
6. calls (FK → clients, team)

Vérifie que le seed respecte cet ordre.
```

### Erreur: "column does not exist" lors du seed
```
Vérification mapping camelCase → snake_case:
- createdAt → created_at
- clientId → client_id
- dueDate → due_date
- assigneeId → assignee_id
- prixFacturé → prix_facture
- coutSousTraitance → cout_sous_traitance

Le script seed doit faire cette conversion.
```

### Erreur: TypeScript "Property 'loadData' does not exist"
```
Vérifie que loadData est ajouté à l'interface AppState dans store.ts:

interface AppState {
  // ... existing props
  loadData: () => Promise<void>;
}
```

### Timeline vide après migration
```
1. Vérifie que loadData() est appelé dans useEffect de page.tsx
2. Ouvre Console > Network > vérifie les requêtes Supabase
3. Vérifie que les tables Supabase contiennent des données
4. Vérifie les mappers (camelCase ↔ snake_case)
```

---

## 💡 Tips pour travailler avec Cursor

### 1. Une étape à la fois
Fais Jour 1 complet, teste, puis Jour 2, etc.
Ne saute pas d'étapes.

### 2. Utilise @-references
- `@planning/PHASE-7-SUPABASE-PLAN.md` pour référencer le plan
- `@src/lib/store.ts` pour référencer le store
- `@src/lib/seed.json` pour référencer les données

### 3. Teste après chaque grande étape
- Après Jour 1: vérifie que le client Supabase s'initialise
- Après Jour 2: vérifie que le seed a inséré les données
- Après Jour 3: teste un CRUD simple (create deliverable)
- Après Jour 4: teste tous les flows

### 4. Garde un terminal ouvert
```bash
# Terminal 1: Server Next.js
npm run dev

# Terminal 2: Pour run le seed ou autres scripts
npm run seed
```

### 5. Git commits réguliers
```bash
git add .
git commit -m "feat(phase-7): setup Supabase client and schema"
# Puis continue avec seed
git commit -m "feat(phase-7): add seed script"
# Puis continue avec store
git commit -m "feat(phase-7): migrate store to Supabase"
# Etc.
```

### 6. Backup avant migration
Avant de toucher au store.ts:
```bash
cp src/lib/store.ts src/lib/store.backup.ts
cp src/lib/seed.json src/lib/seed.backup.json
```

Au cas où tu veuilles rollback.

---

## 🎯 Résultat attendu après 4 jours

- ✅ Données persistantes dans Supabase PostgreSQL
- ✅ Tous les CRUD fonctionnent et persistent
- ✅ Timeline affiche données depuis la base
- ✅ Backlog fonctionne avec items non planifiés
- ✅ Filtres fonctionnent
- ✅ Vue Compta fonctionne
- ✅ Loading states élégants
- ✅ Error handling robuste
- ✅ App viable pour usage quotidien

### Prochaines étapes optionnelles:
- Phase 7.1: Auth Supabase (multi-user)
- Phase 7.2: Realtime subscriptions
- Phase 7.3: Migrations versionnées
- Phase 5: Mobile & Polish (responsive design)
- Phase 6: Compléter Vue Comptabilité (coûts fixes, paiementStatus)

---

**Créé**: 2026-02-14
**Version**: 1.0

# Supabase — mise en place (Phase 7)

## 1. Créer le projet Supabase

1. Va sur [supabase.com](https://supabase.com) et connecte-toi.
2. **New project** : choisis l’organisation, le nom (ex. `yam-dash`), la région, un mot de passe DB (à garder en lieu sûr).
3. Attends la fin de la création du projet.

## 2. Récupérer l’URL et la clé anon

Dans le projet Supabase :

- **Settings** → **API** : note **Project URL** et **anon public** (clé publique).

## 3. Configurer les variables d’environnement

À la racine du projet, crée un fichier **`.env.local`** (il est ignoré par Git) :

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Remplace par l’URL et la clé anon de ton projet.

## 4. Appliquer le schéma SQL

1. Dans Supabase : **SQL Editor** → **New query**.
2. Copie tout le contenu de **`supabase/migrations/00001_initial_schema.sql`**.
3. Colle dans l’éditeur et exécute (**Run**).

Les tables (`team`, `clients`, `contacts`, etc.) et les politiques RLS sont créées.

Ensuite, exécute **`supabase/migrations/00003_merge_profiles_into_team.sql`** pour ajouter sur `team` les colonnes `auth_user_id` et `app_role` (connexion + rôle admin/editor) et le trigger d’inscription. Il n’y a plus de table `profiles` : une seule source de vérité = **team**.

Après 00003, exécute **`supabase/migrations/00004_add_budget_potentiel.sql`** pour la colonne `budget_potentiel` sur `clients` (optionnel — Compta « Potentiel »).

## 5. Lancer le seed (données initiales)

À la racine du projet :

```bash
npm run seed:supabase
```

Le script lit `src/lib/seed.json` et insère les données dans Supabase. Vérifie dans **Table Editor** que les lignes sont bien là.

## 6. Brancher l’app sur Supabase (étape suivante)

Pour l’instant l’app utilise encore le mock (`src/lib/mock-data.ts`). La prochaine étape (07-03) consiste à :

- Créer une couche data qui lit/écrit via `createClient()` depuis `@/lib/supabase/client`.
- Remplacer dans le store les appels aux tableaux mock par des appels Supabase (ou un hook/service qui charge depuis Supabase).

Une fois que tu as créé le projet, appliqué la migration et lancé le seed, on peut enchaîner sur le branchement du store.

## 7. Vider les données de démo en prod

Si tu as lancé le seed sur le **même** projet Supabase que la prod, tu auras des "faux" clients (Forge, Brutus, Les 4 Nectarines, etc.) et un backlog de démo. L’app ne charge plus de mock : tout vient de la BDD.

Pour repartir de zéro (0 client, 0 livrable, 0 appel) tout en gardant les comptes utilisateurs :

1. Supabase → **SQL Editor** → **New query**
2. Ouvre **`supabase/scripts/clear-demo-data.sql`**, copie tout le contenu, colle dans l’éditeur
3. **Run**

Résultat : toutes les données métier sont supprimées ; les lignes **team** liées à un vrai compte (auth) sont conservées. Recharge l’app : grille clients vide, backlog vide, calendrier vide.

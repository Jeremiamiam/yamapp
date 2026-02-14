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

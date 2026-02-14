# Mettre l’app en ligne sur app.agence-yam.fr (Netlify + OVH)

Objectif : que **app.agence-yam.fr** affiche le YAM Dashboard.  
Hébergement : **Netlify**. DNS : **OVH**.

---

## Étape 1 — Déployer sur Netlify

Le projet contient déjà un `netlify.toml` (build Next.js). Deux options :

### A. Via l’interface Netlify (recommandé)

1. Va sur [app.netlify.com](https://app.netlify.com) et connecte-toi.
2. **Add new site** → **Import an existing project**.
3. **Connect to Git provider** → **GitHub** (autorise Netlify si besoin).
4. Choisis le repo **Jeremiamiam/yamapp**.
5. Netlify détecte Next.js ; les réglages du `netlify.toml` sont appliqués. **Deploy site**.
6. Une fois le premier déploiement terminé, note l’URL du site (ex. `yamapp-xxx.netlify.app`).

### Variables d’environnement (obligatoire pour l’auth)

Sans ces variables, l’app affiche en prod : *"Your project's URL and Key are required to create a Supabase client!"*

1. Dans Netlify : **Site** → ton site → **Site configuration** (ou **Site settings**) → **Environment variables**.
2. **Add a variable** / **Add environment variables** :
   - **Key** : `NEXT_PUBLIC_SUPABASE_URL`  
     **Value** : l’URL de ton projet (ex. `https://xxxxx.supabase.co`).  
     Tu la trouves dans [Supabase Dashboard](https://supabase.com/dashboard) → ton projet → **Settings** → **API** → **Project URL**.
   - **Key** : `NEXT_PUBLIC_SUPABASE_ANON_KEY`  
     **Value** : la clé **anon public**.  
     Même écran Supabase → **Project API keys** → **anon** **public** (tu peux la copier).
3. **Scopes** : coche au minimum **Builds** et **Deploy previews** (ou **All**).
4. **Sauvegarde**.
5. **Redéploie** le site : **Deploys** → **Trigger deploy** → **Deploy site** (pour que le prochain build prenne les variables en compte).

### B. Via le CLI (après avoir créé le site une fois)

Si le site **yamapp** existe déjà sur Netlify (créé via A) :

```bash
cd "/chemin/vers/YAM DASH"
netlify link --name yamapp   # choisis l’équipe Yam si demandé
netlify deploy --build --prod
```

Tu obtiendras une URL du type `xxx.netlify.app`.

---

## Étape 2 — Ajouter le domaine app.agence-yam.fr dans Netlify

1. Dans le site Netlify : **Domain configuration** (ou **Domain management**).
2. **Add custom domain** / **Add domain alias**.
3. Saisis **app.agence-yam.fr** → **Verify** / **Add**.
4. Netlify va indiquer que le DNS n’est pas encore configuré et affichera quoi mettre chez OVH. Pour un sous-domaine :
   - **Type** : CNAME  
   - **Nom / Sous-domaine** : `app`  
   - **Cible / Valeur** : **ton-site.netlify.app** (l’URL Netlify de ton site, ex. `yamapp-abc123.netlify.app`).  
   Netlify peut aussi proposer **apex load balancer** : pour un sous-domaine, le CNAME vers `xxx.netlify.app` suffit.

---

## Étape 3 — Configurer le DNS chez OVH

1. Connecte-toi à [OVH](https://www.ovh.com/manager/) (espace client).
2. **Noms de domaine** → **agence-yam.fr**.
3. Onglet **Zone DNS** (ou **Gestion de la zone DNS**).
4. **Ajouter une entrée** → **CNAME** :
   - **Sous-domaine** : `app`
   - **Cible** : l’URL Netlify du site (ex. `ton-site.netlify.app`), **sans** `https://`, juste le nom d’hôte.
5. Valide.

La propagation peut prendre de **quelques minutes à 1–2 h** (jusqu’à 24 h dans de rares cas).

---

## Étape 4 — Vérifier

- Dans Netlify, **Domain configuration** : **app.agence-yam.fr** doit passer en **Verified** et le cadenas HTTPS doit être actif.
- Ouvre **https://app.agence-yam.fr** : tu dois voir le YAM Dashboard. Netlify fournit le certificat SSL.

---

## Résumé

| Où     | Quoi faire |
|--------|------------|
| **Netlify** | Importer le repo **yamapp**, déployer, puis ajouter le domaine **app.agence-yam.fr** et noter la cible CNAME (ton-site.netlify.app). |
| **OVH**     | Zone DNS de **agence-yam.fr** → CNAME **app** → `ton-site.netlify.app`. |

Si tu bloques sur une étape, dis-moi où (écran Netlify ou OVH) et ce que tu vois.

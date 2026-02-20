# Netlify Functions — recherche

## Où trouver les paramètres Functions ?

### Sites Next.js (ton cas)
**Les sites Next.js n’ont pas de section "Functions" visible** dans l’interface Netlify. Les routes API (`/api/*`) sont gérées par le plugin Essential Next.js / OpenNext et ne sont pas listées comme des Netlify Functions classiques.

### Pour les sites "classiques" (avec /netlify/functions/)
1. Va sur **app.netlify.com**
2. Clique sur ton **site**
3. Menu gauche : **Build** → **Serverless Functions** (ou **Site configuration** → **Functions**)
4. Doc : https://docs.netlify.com/build/functions/overview/

### Pour Next.js
- Les routes API = Server-Side Rendering / Serverless intégrés au build Next.js
- Pas de menu "Functions" dédié
- Le timeout est celui par défaut (10 s sur le plan gratuit)

## Config netlify.toml

La section `[functions]` avec `timeout = 26` provoque une **erreur de parse** sur Netlify (même avec uniquement des caractères ASCII). Cause possible : incompatibilité avec la stack Next.js / OpenNext.

## Solution recommandée : streaming

Puisqu’on ne peut pas augmenter le timeout et qu’il n’y a pas de réglage dans l’UI pour Next.js, la **solution viable** est de passer les API web-architect et homepage en **streaming** (comme le Creative Board). Le Creative Board fonctionne car il envoie des données en continu : Netlify ne coupe pas tant que le flux est actif.

Prochaine étape : implémenter le streaming sur `/api/web-architect` et `/api/homepage`.

# Git — mise en place

Le projet est déjà un dépôt Git (branch `main`). Voici ce qui est en place et quoi faire ensuite.

## Déjà en place

- **Git initialisé** : `git init` déjà fait
- **Branche** : `main`
- **.gitignore** : `node_modules`, `.next`, `.env*`, fichiers de debug, etc. sont ignorés

## À faire de ton côté

### 1. Premier commit (tout versionner)

À la racine du projet :

```bash
git add .
git status   # vérifier ce qui sera commité (pas de .env ni node_modules)
git commit -m "feat: état initial YAM Dashboard (Phases 1-4, mock JSON, compta)"
```

### 2. Créer un dépôt distant (backup / collaboration)

- **GitHub** : [github.com/new](https://github.com/new) → crée un repo (ex. `yam-dash`), sans README ni .gitignore
- **GitLab** ou autre : même idée, repo vide

Puis lie le projet au remote :

```bash
git remote add origin https://github.com/TON_COMPTE/yam-dash.git
# ou l’URL SSH si tu préfères
git push -u origin main
```

### 3. Workflow simple ensuite

- **Sauvegarder** : `git add .` puis `git commit -m "ton message"`
- **Envoyer sur le remote** : `git push`
- **Récupérer** (si tu bosses sur un autre PC ou avec quelqu’un) : `git pull`

## Ordre des étapes projet

1. **Maintenant** : Git + remote (ce doc)
2. **Ensuite** : Phase 5 (Mobile), Phase 6 (Compta) si besoin
3. **En dernier** : Phase 7 (Supabase) — BDD et persistance

# MCP Server — Connexion Claude.ai ↔ YAM Dash

Le serveur MCP expose la DB Supabase à Claude.ai : clients, projets, livrables, documents.

## 1. Variables d'environnement

### En local (`.env.local`)

```bash
# Déjà présentes
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# À ajouter pour le MCP
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # Supabase → Settings → API → service_role (secret)
MCP_SECRET_KEY=une-clé-longue      # Clé secrète pour authentifier Claude
```

- **SUPABASE_SERVICE_ROLE_KEY** : Supabase Dashboard → Settings → API → `service_role` (clé secrète, jamais côté client)
- **MCP_SECRET_KEY** : invente une clé longue (ex. `openssl rand -hex 32`)

### Sur Vercel

Settings → Environment Variables → Add :

| Key | Value | Environnements |
|-----|-------|----------------|
| `SUPABASE_SERVICE_ROLE_KEY` | ta service_role key | Production, Preview |
| `MCP_SECRET_KEY` | ta clé secrète (celle que tu utiliseras dans Claude) | Production, Preview |

⚠️ Les deux peuvent être marquées **Sensitive** pour les masquer dans les logs.

## 2. Déploiement

```bash
git add .
git commit -m "feat: MCP server (clients, projets, livrables, documents)"
git push
```

Puis **Redeploy** sur Vercel pour que les env vars soient prises en compte (si tu les as ajoutées après le dernier push).

## 3. Connecter dans Claude.ai

1. Ouvre [claude.ai](https://claude.ai) → **Settings** (icône engrenage) → **Integrations**
2. **Add MCP server**
3. Remplis :
   - **URL** : `https://app.agence-yam.fr/api/mcp` (ou ton URL Vercel)
   - **Header** : `Authorization: Bearer ta-MCP_SECRET_KEY`
     - `ta-MCP_SECRET_KEY` = la même valeur que `MCP_SECRET_KEY` sur Vercel
4. Save

## 4. Utilisation

Une fois connecté, tu peux demander à Claude :

- « Montre-moi tous mes prospects »
- « Quels livrables sont en cours pour le client X ? »
- « Liste les briefs créés ce mois-ci »

Claude interroge ta DB en direct via les tools :
- `get_clients` — clients/prospects
- `get_projects` — projets
- `get_deliverables` — livrables
- `get_documents` — documents (briefs, notes, etc.)

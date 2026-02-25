# Audit — Workflow budgets / comptabilité / client

*Rapport généré suite à l’audit GSD des flux budgets et de la page comptabilité.*

---

## 1. Problème signalé

> Dans le client **Brutus**, produit **site internet**, la sous-traitance est indiquée mais ne s’affiche pas sur la vue comptabilité.

---

## 2. Cause identifiée

### 2.1 Logique actuelle de ComptaView

```
yearDeliverables = deliverables avec dueDate/createdAt dans comptaYear
billedDeliverables = yearDeliverables où billingStatus !== 'pending'
```

**La sous-traitance n’est prise en compte que pour les `billedDeliverables`.**

Si un produit a `billingStatus === 'pending'` (en attente de facturation), il est **exclu** des calculs :
- rentrées validées
- sous-traitance
- marge nette

### 2.2 Pourquoi Brutus "site internet" n’apparaît pas

1. **`billingStatus === 'pending'`** → le produit n’est jamais dans `billedDeliverables`
2. **`clientId` manquant** → si le produit n’a que `projectId` sans `clientId`, il est ignoré (`if (!d.clientId) continue`)
3. **Année** → si `dueDate` n’est pas dans l’année sélectionnée, le produit est exclu de `yearDeliverables`

### 2.3 Schéma du flux actuel

```
Deliverable (produit)
├── clientId (ou via projet)
├── coutSousTraitance ✓
├── prixFacturé
├── billingStatus  ← filtre: seul !== 'pending' entre dans ComptaView
├── dueDate       ← filtre: année
└── projectId

ComptaView
├── billedDeliverables = d.billingStatus !== 'pending'
├── rentrées = sum(prixFacturé) des billedDeliverables
├── sous-traitance = sum(coutSousTraitance) des billedDeliverables  ← PROBLÈME
└── marge = rentrées - sous-traitance
```

**Conclusion** : tout produit avec sous-traitance mais encore `billingStatus === 'pending'` est ignoré.

---

## 3. Correction proposée

### 3.1 Inclure la sous-traitance des produits `pending`

La sous-traitance est une **sortie réelle** : elle peut être engagée avant que le produit ne soit facturé. Il faut donc :

- **Sous-traitance** : inclure tous les produits avec `coutSousTraitance > 0`, quel que soit `billingStatus`
- **Rentrées** : rester limité aux produits facturés (`billingStatus !== 'pending'`)
- **Marge nette** : rentrées - sous-traitance (avec la sous-traitance étendue ci‑dessus)

### 3.2 Gestion de `clientId` manquant

- La migration `20260224120000_backfill_deliverable_client_id_from_project.sql` remplit `client_id` depuis le projet
- Vérifier que les produits rattachés à un projet ont bien un `client_id`
- En ComptaView, optionnel : fallback sur `clientId` du projet si `d.clientId` manque (via `getProjectById`)

### 3.3 Champ `stHorsFacture`

Si `stHorsFacture === true`, la sous-traitance est facturée **directement au client**, pas à Yam. Elle ne doit pas être déduite de la marge :

```ts
// Exemple
dépensé += (d.stHorsFacture ? 0 : (d.coutSousTraitance ?? 0));
```

---

## 4. Proposition : toggle actif / inactif sur projet

### 4.1 Besoin

Remplacer (ou compléter) la logique prospect/client par un toggle **actif / inactif** au niveau **projet** :

| État projet  | Rôle | Champs disponibles |
|---------------|------|--------------------|
| **Inactif**   | Potentiel | `potentiel` (budget estimé) uniquement |
| **Actif**     | Client | devis, acompte, avancements, solde, sous-traitance, etc. |

### 4.2 Impact sur le modèle

1. **Project** : ajouter `isActive: boolean` (ou `status: 'draft' | 'active'`)
   - `false` = pipeline, budget potentiel uniquement
   - `true` = client actif, facturation complète

2. **Filtrage ComptaView** :
   - Projets inactifs → uniquement dans "Rentrée potentielle" via `potentiel`
   - Projets actifs → rentrées, sous-traitance, marge nette

3. **Vue Client** :
   - Projets inactifs : afficher le potentiel, pas les champs devis/acompte
   - Projets actifs : affichage complet

### 4.3 Schéma cible

```
Project
├── isActive: boolean  (nouveau)
├── potentiel          (existant, utilisé si !isActive)
├── quoteAmount        (si isActive)
├── depositAmount      (si isActive)
└── ...

Client
├── status: 'prospect' | 'client'  (peut rester pour listes / filtres)
└── (le "client" actif = projets avec isActive === true)
```

### 4.4 Migration Supabase

```sql
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.projects.is_active IS
  'false = pipeline (potentiel uniquement), true = client actif (devis, acompte, etc.)';
```

---

## 5. Script de diagnostic

Voir `scripts/diagnostic-budgets.sql` pour diagnostiquer :
- le produit "site internet" de Brutus
- les produits avec sous-traitance mais `billingStatus = 'pending'`
- les produits sans `client_id`

---

## 6. Fichiers modifiés / à modifier

| Fichier | Action |
|---------|--------|
| `src/features/compta/components/ComptaView.tsx` | ✅ Corrigé : ST pending + `stHorsFacture` + fallback `clientId` |
| `src/types/index.ts` | Ajouter `isActive?: boolean` sur `Project` (si toggle actif/inactif) |
| `supabase/migrations/` | Nouvelle migration `add_project_is_active.sql` (si toggle) |
| `src/features/clients/components/` | Adapter l’UI projet selon `isActive` |
| `src/features/wiki/wiki-data.ts` | Mise à jour de la doc si changement de logique |

---

## 7. Corrections appliquées (ComptaView)

- La sous-traitance est désormais incluse pour **tous les produits** avec `coutSousTraitance > 0`, même si `billingStatus === 'pending'`.
- Prise en compte de `stHorsFacture` : si true, la ST n’est pas déduite (elle est facturée directement au client).
- Fallback `clientId` via projet : si un produit n’a pas de `clientId` mais un `projectId`, le client est dérivé du projet.
- Nouvelle section dépliable « Sous-traitance en attente » : produits avec ST mais pas encore facturés.
- **Produits sans date** (`dueDate` null) : inclus pour l'année sélectionnée (toujours visibles).

---

## 8. Résumé des actions

1. **✅ Fait** : ComptaView affiche désormais la sous-traitance même quand `billingStatus === 'pending'`
2. **Court terme** : exécuter `scripts/diagnostic-budgets.sql` dans Supabase SQL Editor pour vérifier Brutus et les données
3. **✅ Fait** : Toggle actif/inactif sur projet (onglet Facturation). Si actif : potentiel en lecture seule (grisé). Si inactif : potentiel éditable, devis/acompte masqués.
4. **✅ Fait** : Suppression prospect/client au niveau client. Colonne "Prospects" → "Potentiel" (projets inactifs, pipeline). Un seul bouton "+ Client". Modale client sans choix prospect/client. Un client avec projet actif ET inactif apparaît dans les deux colonnes.

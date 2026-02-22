# Phase 12: Refonte page client V2 - Research

**Researched:** 2026-02-22
**Domain:** Layout restructuration, drawer UI, document context (client vs projet), PLAUD double-entry, retroplanning footer
**Confidence:** HIGH — all findings based on direct codebase inspection

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Navigation & transitions
- Drawer projet slide depuis la droite avec overlay semi-transparent derrière
- Liste des projets visible mais dimmée quand le drawer est ouvert
- Fermeture drawer : bouton X + clic overlay + touche Échap + breadcrumb
- Breadcrumb toujours visible pour naviguer entre niveaux (Client > Projets > [Projet] > Produits > [Produit])

#### Contenu du drawer projet
- 3 onglets dans le drawer : **Produits** (défaut) | **Docs** | **Facturation**
- Onglet Produits = master-detail : 1/3 liste à gauche, 2/3 détail à droite
- Premier produit auto-sélectionné à l'ouverture (pas d'état vide)
- Header drawer permanent : nom du projet + budget total + badge statut facturation

#### Documents client vs projet
- Tous les types de documents (brief, report, note, creative-strategy, web-brief, social-brief) peuvent être client OU projet
- Le contexte (client ou projet) est fixé à la création, pas de déplacement possible
- Sidebar client : affichage ultra-compact — titre + badge type coloré seulement
- Import PLAUD depuis sidebar client → crée un doc client (pas de sélecteur projet)
- Import PLAUD depuis drawer projet → crée un doc projet (rattaché au projet ouvert)

#### Sidebar client (densité)
- 3 sections dans cet ordre : Contacts → Liens → Documents client
- Sections toujours ouvertes (pas de collapse)
- Pas de troncature : tout affiché, la sidebar scrolle si besoin
- Largeur fixe (~280-320px)
- Retroplanning en footer full-width (pas dans la sidebar)

#### Facturation (modèle hybride)
- **Deux niveaux cumulatifs** : projet ET produits
- Flux type : Devis projet (10k) → Acompte projet (30%) → Avancements = factures produits individuelles → Solde projet (restant)
- Devis et acompte = niveau PROJET
- Avancements = factures PRODUITS individuelles (chaque produit facturé indépendamment)
- Solde = niveau PROJET (quote - acompte - somme factures produits)
- Certains projets n'ont PAS de devis global → facturation 100% par produit
- La vue facturation doit gérer les deux cas (avec et sans devis projet)
- Chaque mouvement : montant + date uniquement (pas de statut intermédiaire payé/envoyé)
- Possibilité de plusieurs avancements (array de montants + dates)
- Produits orphelins → projet "Divers" créé automatiquement par client

### Claude's Discretion
- Largeur exacte de la sidebar (dans la fourchette 280-320px)
- Animations du drawer (durée, easing)
- Comportement mobile (responsive)
- Design des badges de statut facturation
- Workflow exact de création du projet "Divers" auto

### Deferred Ideas (OUT OF SCOPE)
- Archivage projets (page cachée pour projets archivés) — mentionné en phase 11, différé
- Retroplanning par projet (chaque projet avec son propre Gantt) — futur
- Statut par mouvement de facturation (payé/envoyé/en attente) — si besoin ultérieurement
</user_constraints>

---

## Summary

Phase 12 restructure entièrement `ClientDetail` en un layout à deux zones fixes : une sidebar client permanente à gauche (Contacts, Liens, Documents client) et une zone principale à droite (liste projets + drawer projet glissant). Le retroplanning passe en footer full-width.

La phase est essentiellement une migration de layout : la logique métier (CRUD projects, CRUD documents, facturation, retroplanning, PLAUD) existe déjà et fonctionne. Le travail principal est (1) refactorer le layout de `ClientDetail.tsx`, (2) créer un `ProjectDrawer` composant nouveau, (3) ajouter `project_id` sur les documents avec une migration Supabase, et (4) dédoubler le point d'entrée PLAUD (sidebar client vs drawer projet).

Le proto `src/app/proto/client-detail-v2/page.tsx` est la référence visuelle validée. Il contient déjà toute la logique mock de `computeMockProjectBilling`, les onglets drawer (Projet & Produits / Facturation), le master-detail produits, et le breadcrumb hiérarchique. La migration consiste à brancher ce proto sur les vrais stores et API.

**Primary recommendation:** Migrer `ClientDetail.tsx` vers le layout sidebar+main du proto V2, créer `ProjectDrawer` (3 onglets) en réutilisant `ProjectModal` existant pour la facturation, ajouter `project_id` sur la table `documents` via migration Supabase, et adapter `ReportUploadModal` pour recevoir un `projectId` optionnel.

---

## Standard Stack

### Core (already in project — no new installs needed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React useState/useEffect | (Next.js) | State local drawer (open/closed, selectedProjectId, selectedProductId, activeTab) | Drawer state est UI éphémère — pas de Zustand |
| Zustand (useAppStore) | existing | CRUD projets, documents, retroplanning | Toutes les actions existent déjà |
| Tailwind CSS | existing | Layout sidebar fixe, overlay, drawer slide | Design tokens projet déjà en place |
| Supabase | existing | Migration documents.project_id | Patterns migrations établis |

### No new dependencies needed
Phase 12 n'introduit aucune nouvelle dépendance externe. Tout s'appuie sur le stack existant.

---

## Architecture Patterns

### Recommended Project Structure

```
src/features/clients/components/
├── ClientDetailV2.tsx           # NOUVEAU — remplace ClientDetail.tsx (ou coexiste)
├── ProjectDrawer.tsx            # NOUVEAU — drawer glissant, 3 onglets
├── ProjectDrawerProductsTab.tsx # NOUVEAU — master-detail 1/3 + 2/3
├── ProjectDrawerDocsTab.tsx     # NOUVEAU — docs projet filtrés + import PLAUD projet
├── ProjectDrawerBillingTab.tsx  # NOUVEAU — réutilise logique ProjectModal billing tab
├── ReportUploadModal.tsx        # MODIFIÉ — accepte projectId?: string optionnel
├── sections/
│   ├── ClientSidebarSection.tsx # NOUVEAU — sidebar client (Contacts + Liens + Docs)
│   ├── ProjectsListSection.tsx  # NOUVEAU — liste projets (zone principale)
│   └── RetroplanningSection.tsx # INCHANGÉ — intégré en footer
```

**Alternative acceptable :** tout dans `ClientDetailV2.tsx` monolithique comme le proto (plus simple à migrer, suffit si < 800 lignes). Décomposer si nécessaire pour lisibilité.

### Pattern 1 : Layout sidebar fixe + zone principale scrollable

**What:** La page client est un `flex h-screen` avec sidebar fixe (`flex-shrink-0 w-[300px]`) et zone principale (`flex-1 overflow-auto`). Le drawer projet se superpose à droite dans la zone principale via `absolute inset-y-0 right-0`.

**Pattern exact du proto (à reproduire avec vrais données) :**
```tsx
// Source: src/app/proto/client-detail-v2/page.tsx (validé)
<div className="min-h-screen flex flex-col bg-[var(--bg-primary)]">
  <header>/* retour + nom client + badge */</header>
  <div className="flex-1 flex min-h-0 overflow-hidden">
    {/* Sidebar client fixe */}
    <aside className="flex-shrink-0 w-72 xl:w-80 border-r border-[var(--border-subtle)] overflow-y-auto">
      {/* Contacts, Liens, Documents client */}
    </aside>
    {/* Zone principale */}
    <main className="flex-1 min-w-0 flex flex-col overflow-hidden relative">
      {/* Breadcrumb */}
      {/* Liste projets (dimmée quand drawer ouvert) */}
      {/* ProjectDrawer (overlay absolu depuis la droite) */}
    </main>
  </div>
  {/* Footer retroplanning full-width */}
  <footer className="flex-shrink-0 border-t ...">
    <RetroplanningSection clientId={clientId} />
  </footer>
</div>
```

### Pattern 2 : ProjectDrawer avec overlay

**What:** Drawer glissant depuis la droite, position `absolute` dans la `main`, avec overlay semi-transparent cliquable.

```tsx
// Source: pattern standard React — pas de lib externe, translate-x CSS
{drawerOpen && (
  <>
    {/* Overlay cliquable */}
    <div
      className="absolute inset-0 bg-black/30 z-10"
      onClick={closeDrawer}
    />
    {/* Drawer */}
    <div className="absolute inset-y-0 right-0 w-[580px] max-w-[90vw] z-20
                    bg-[var(--bg-primary)] border-l border-[var(--border-subtle)]
                    flex flex-col transform transition-transform duration-200">
      {/* Header permanent : nom projet + budget + badge statut */}
      {/* Tabs : Produits | Docs | Facturation */}
      {/* Contenu onglet actif */}
    </div>
  </>
)}
```

**Fermeture Échap :** `useEffect(() => { const handler = (e) => { if (e.key === 'Escape') closeDrawer(); }; window.addEventListener('keydown', handler); return () => window.removeEventListener('keydown', handler); }, [closeDrawer]);`

### Pattern 3 : Master-detail produits dans le drawer

**What:** Onglet Produits = liste 1/3 gauche + détail 2/3 droite. Premier produit auto-sélectionné.

```tsx
// Source: src/app/proto/client-detail-v2/page.tsx — ProductDetailView + liste
const [selectedProductId, setSelectedProductId] = useState<string | null>(
  projectDeliverables[0]?.id ?? null  // Auto-sélection premier produit
);
```

Le composant `ProductDetailView` du proto est la référence — il montre infos produit + facturation produit si pas de devis projet.

### Pattern 4 : Documents client vs projet

**Distinction via `project_id` en base :**
- Document client : `project_id = NULL` → apparaît dans sidebar client
- Document projet : `project_id = <uuid>` → apparaît dans drawer projet, onglet Docs

**Migration Supabase nécessaire :**
```sql
-- Nouvelle migration : add project_id to documents
ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS project_id text
  REFERENCES public.projects(id) ON DELETE SET NULL;
```

**État actuel :** `DocumentRow` dans `supabase-mappers.ts` n'a PAS de `project_id`. `ClientDocument` type n'a PAS de `projectId`. Tout est à ajouter.

**Impact store :** `addDocument` reçoit actuellement `(clientId, doc)`. Il faut ajouter `projectId?: string` optionnel et le passer dans l'insert Supabase.

### Pattern 5 : PLAUD double accès

**Situation actuelle :** `ReportUploadModal` reçoit `clientId` depuis `activeModal.clientId`. Il appelle `addDocument(clientId, ...)` sans `project_id`.

**Modification nécessaire :**
- Ajouter `projectId?: string` dans le type `report-upload` de `ModalType`
- `openReportUploadModal(clientId, projectId?)` dans `useModal.ts`
- `ReportUploadModal` lit `activeModal.projectId` et le passe à `addDocument`

**Deux points d'entrée :**
1. Sidebar client → `openReportUploadModal(clientId)` → doc client (projectId absent)
2. Drawer projet → `openReportUploadModal(clientId, projectId)` → doc projet

### Pattern 6 : Projet "Divers" automatique

**Contexte :** Produits sans `project_id` (orphelins) doivent être regroupés sous un projet "Divers" virtuel ou auto-créé.

**Deux approches possibles :**
- **Option A (recommandée) :** Créer le projet "Divers" à la demande en DB (vraie entrée projects table). Déclencheur : quand l'utilisateur tente d'assigner un produit orphelin, ou automatiquement à l'affichage si orphelins détectés.
- **Option B :** Afficher les orphelins comme groupe virtuel "Divers" côté UI sans créer en DB (plus simple, mais incohérent avec le modèle de données).

**Recommandation :** Option A — un projet "Divers" réel en DB, crée automatiquement si clients a des orphelins. Le déclencheur idéal est au rendu de la liste projets : si `orphanProducts.length > 0` et pas de projet "Divers", proposer ou créer auto.

### Pattern 7 : Intégration RetroplanningSection en footer

`RetroplanningSection` existe et fonctionne déjà (Phase 9). Dans le proto V2, le footer est simplement un placeholder. Il suffit de :
```tsx
<footer className="flex-shrink-0 border-t border-[var(--border-subtle)] bg-[var(--bg-secondary)]/30">
  <RetroplanningSection clientId={client.id} />
</footer>
```

Aucune modification de `RetroplanningSection` nécessaire.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Billing calcul | Nouvelle logique facturation | `computeProjectBilling()` dans `src/lib/project-billing.ts` | Déjà testé, gère both modes (avec/sans devis) |
| Document CRUD | Nouvelles actions store | `addDocument`, `updateDocument`, `deleteDocument` dans store | Existant, Supabase branché — juste étendre avec `projectId` |
| PLAUD flow | Nouveau upload process | `ReportUploadModal` modifié avec `projectId?` | Toute la logique analyze-plaud API existe |
| Retroplanning | Nouveau Gantt | `RetroplanningSection` déjà fonctionnel | Juste l'intégrer en footer |
| Project CRUD | Nouvelles API | `addProject`, `updateProject`, `deleteProject` store | Existant |
| Tab system | Composant tabs custom | Boutons avec `border-b-2` comme dans `ProjectModal` | Pattern établi dans le projet |

**Key insight:** Phase 12 est une migration de layout, pas une réécriture métier. 80% de la logique métier existe déjà. La valeur ajoutée est l'UX restructurée.

---

## Common Pitfalls

### Pitfall 1 : Oublier la migration documents.project_id en Supabase

**What goes wrong:** Le store et les types sont modifiés mais la colonne n'existe pas en base → insert échoue silencieusement ou avec une erreur Supabase.
**Why it happens:** La distinction docs client/projet nécessite une colonne `project_id` sur la table `documents` qui n'existe pas actuellement.
**How to avoid:** Créer la migration Supabase EN PREMIER avant de modifier les types et le store. Ordre : migration → types → mapper → store → UI.
**Warning signs:** `addDocument` retourne une erreur 400 de Supabase.

### Pitfall 2 : Documents projet non chargés dans le store

**What goes wrong:** Les documents d'un projet ne sont pas accessibles dans le drawer car le store charge les documents dans `client.documents[]` sans distinction `projectId`.
**Why it happens:** `loadData()` dans `data.slice.ts` charge tous les documents d'un client dans `client.documents`. Avec `project_id`, il faut filtrer côté store ou UI.
**How to avoid:** Deux options — (A) garder `client.documents` comme array flat et filtrer par `projectId` dans les composants (`client.documents.filter(d => d.projectId === project.id)`), ou (B) restructurer le store pour avoir `client.projectDocuments`. L'option A est plus simple et backward-compatible.
**Warning signs:** Drawer projet affiche tous les documents client au lieu de seulement ceux du projet.

### Pitfall 3 : État drawer non réinitialisé entre projets

**What goes wrong:** L'onglet actif ou le produit sélectionné du projet A restent quand on ouvre le projet B.
**Why it happens:** State local React persiste entre changements de projet si on ne reset pas.
**How to avoid:** `useEffect(() => { setActiveTab('produits'); setSelectedProductId(projectDeliverables[0]?.id ?? null); }, [selectedProjectId]);` — reset au changement de projet.
**Warning signs:** En passant de projet A à projet B, l'onglet Facturation reste actif ou un produit du projet A est affiché.

### Pitfall 4 : Sidebar client scrolle mais overlay drawer bloque

**What goes wrong:** Quand le drawer projet est ouvert, le clic sur la sidebar client (pour voir les docs) ne fonctionne pas car l'overlay couvre tout.
**Why it happens:** L'overlay `absolute inset-0` couvre toute la `main`, mais la sidebar est DANS `aside` hors de `main` → normalement pas de problème si le layout est correct.
**How to avoid:** S'assurer que l'overlay est positionné dans `main` uniquement (pas sur `aside`). Vérifier que `aside` et `main` sont frères directs, pas imbriqués.

### Pitfall 5 : `computeProjectBilling` appelé avec deliverables non filtrés

**What goes wrong:** Facturation incorrecte si on passe tous les deliverables du client au lieu de seulement ceux du projet.
**Why it happens:** `computeProjectBilling(project, deliverables)` filtre en interne par `d.projectId === project.id`, donc passer tous les deliverables fonctionne — mais si `projectId` n'est pas dans le type `Deliverable`, le filtre échoue.
**How to avoid:** S'assurer que `Deliverable.projectId` est bien peuplé depuis Supabase. Vérifier `mapDeliverableRow` dans supabase-mappers.ts — `projectId: row.project_id ?? undefined` est déjà présent (ligne 216). Aucun problème ici.

### Pitfall 6 : ModalType 'report-upload' non étendu pour projectId

**What goes wrong:** `ReportUploadModal` n'a pas accès au `projectId` du drawer qui l'a ouvert.
**Why it happens:** `ModalType` dans `store/types.ts` définit `{ type: 'report-upload'; clientId: string }` sans `projectId`.
**How to avoid:** Étendre le type AVANT de l'utiliser dans le drawer : `{ type: 'report-upload'; clientId: string; projectId?: string }`.

---

## Code Examples

### Drawer avec overlay (pattern à reproduire)
```tsx
// Pattern CSS pour drawer right-slide sans lib externe
// Source: proto V2 adapté aux conventions du projet
{selectedProjectId && (
  <>
    <div
      className="absolute inset-0 bg-black/40 z-10 transition-opacity"
      onClick={() => setSelectedProjectId(null)}
    />
    <div className={`
      absolute inset-y-0 right-0 z-20
      w-[600px] max-w-[90vw]
      bg-[var(--bg-primary)] border-l-2 border-l-[var(--accent-cyan)]
      flex flex-col
      transform transition-transform duration-200 ease-out
    `}>
      {/* Header permanent */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)]/50">
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">{project.name}</h2>
        {/* Badge statut facturation */}
        <button onClick={() => setSelectedProjectId(null)}>✕</button>
      </div>
      {/* Tabs */}
      {/* Contenu */}
    </div>
  </>
)}
```

### Migration Supabase pour documents.project_id
```sql
-- Timestamp à utiliser : 20260222210000 (ou prochain disponible)
ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS project_id text
  REFERENCES public.projects(id) ON DELETE SET NULL;

-- Pas d'index nécessaire pour l'instant (volume faible)
-- Pas de backfill nécessaire : tous les docs existants restent client (NULL = client)
```

### Modification DocumentRow et mapDocumentRow
```typescript
// src/lib/supabase-mappers.ts
interface DocumentRow {
  id: string;
  client_id: string;
  project_id?: string | null; // AJOUT
  type: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export function mapDocumentRow(row: DocumentRow): ClientDocument {
  return {
    id: row.id,
    type: row.type as ClientDocument['type'],
    title: row.title,
    content: row.content,
    projectId: row.project_id ?? undefined, // AJOUT
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}
```

### Modification ClientDocument type
```typescript
// src/types/index.ts
export interface ClientDocument {
  id: string;
  type: DocumentType;
  title: string;
  content: string;
  projectId?: string; // AJOUT — undefined = doc client, string = doc projet
  createdAt: Date;
  updatedAt: Date;
}
```

### addDocument étendu
```typescript
// src/lib/store/actions/clients.ts — addDocument
addDocument: async (clientId, docData, projectId?) => {
  // ...
  const { error } = await supabase.from('documents').insert({
    id,
    client_id: clientId,
    project_id: projectId ?? null, // AJOUT
    ...toSupabaseDocument(docData),
    // ...
  });
```

### ModalType étendu pour PLAUD projet
```typescript
// src/lib/store/types.ts
| { type: 'report-upload'; clientId: string; projectId?: string } // AJOUT projectId
```

### Auto-sélection premier produit dans le drawer
```typescript
// À l'ouverture du drawer ou au changement de projet
useEffect(() => {
  if (selectedProjectId) {
    const products = getDeliverablesByProjectId(selectedProjectId);
    setSelectedProductId(products[0]?.id ?? null);
    setActiveTab('produits');
  }
}, [selectedProjectId]);
```

### Filtrage documents client vs projet dans les composants
```typescript
// Dans la sidebar client (ne montrer QUE les docs sans projectId)
const clientDocs = client.documents.filter(d => !d.projectId);

// Dans le drawer projet (ne montrer QUE les docs de CE projet)
const projectDocs = client.documents.filter(d => d.projectId === project.id);
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| ClientDetail : layout 3 colonnes `lg:grid-cols-3` | Sidebar fixe + zone principale + drawer glissant | Phase 12 | Meilleure hiérarchie visuelle |
| Tous les documents dans `client.documents[]` sans contexte | Documents avec `projectId?` pour distinguer client vs projet | Phase 12 | Nécessite migration Supabase |
| PLAUD uniquement depuis sidebar client | PLAUD depuis sidebar ET depuis drawer projet | Phase 12 | Double point d'entrée avec contexte automatique |
| Retroplanning intégré dans le contenu scrollable | Retroplanning en footer full-width permanent | Phase 12 | Toujours visible |
| ProjectModal (modal plein écran) pour édition projet | ProjectDrawer (drawer latéral) avec 3 onglets | Phase 12 | Meilleur contexte, pas de rupture visuelle |

---

## Open Questions

1. **Que faire de `ProjectModal` et `ProjectsSection` existants ?**
   - Ce qu'on sait : `ProjectModal` est une modale plein-écran utilisée pour créer/éditer depuis `ProjectsSection`. La V2 utilise un drawer à la place.
   - Ce qui est flou : Est-ce qu'on garde `ProjectModal` pour la création de nouveau projet (bouton +) et seulement le drawer pour l'édition ? Ou tout passe dans le drawer ?
   - Recommandation : Garder la création via un mini-formulaire inline ou un modal léger (juste nom + client). Le drawer drawer sert à l'édition/navigation. Éviter de supprimer `ProjectModal` pour ne pas casser les autres usages.

2. **Où vivent les clients sans projets dans la liste principale ?**
   - Ce qu'on sait : La zone principale affiche une liste de projets. Si un client n'a pas de projets, il faut un état vide avec CTA "Créer un projet".
   - Ce qui est flou : Doit-on afficher les produits orphelins directement dans la liste (avant la création du projet "Divers") ?
   - Recommandation : Afficher d'abord les projets, puis un groupe "Produits sans projet" s'il y a des orphelins, avec un CTA pour créer le projet "Divers".

3. **`client.documents` reste-t-il le seul store pour les docs projet ?**
   - Ce qu'on sait : Actuellement `documents` sont chargés dans `client.documents[]` via `loadData()`. Filtrer par `d.projectId` dans les composants est la solution la plus simple.
   - Ce qui est flou : À long terme, ce pattern de filtrage devient verbeux. Mais pour Phase 12, c'est suffisant.
   - Recommandation : Filtrer dans les composants pour Phase 12. Ne pas restructurer le store (scope trop large).

---

## Sources

### Primary (HIGH confidence)
- Inspection directe `src/app/proto/client-detail-v2/page.tsx` — layout de référence validé par le proto
- Inspection directe `src/features/clients/components/ClientDetail.tsx` — layout V1 à migrer
- Inspection directe `src/features/production/components/ProjectModal.tsx` — logique facturation à réutiliser
- Inspection directe `src/features/clients/components/sections/DocumentsSection.tsx` — PLAUD entry point existant
- Inspection directe `src/features/clients/components/ReportUploadModal.tsx` — PLAUD upload flow
- Inspection directe `src/lib/supabase-mappers.ts` — mappers existants, état actuel de `DocumentRow`
- Inspection directe `src/lib/store/types.ts` — types `ModalType`, `AppState`, `ClientDocument`
- Inspection directe `src/types/index.ts` — `ClientDocument`, `Project`, `Deliverable`
- Inspection directe `src/lib/project-billing.ts` — `computeProjectBilling` réutilisable
- Inspection directe `supabase/migrations/` — patterns migrations SQL existants

### Secondary (MEDIUM confidence)
- Pattern drawer sans lib externe : CSS `transform translate-x` + overlay `absolute` — pattern standard React/Tailwind, pas de lib requise pour ce cas simple.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — inspection directe du code existant
- Architecture patterns: HIGH — basé sur proto validé et code V1
- Migration Supabase: HIGH — patterns clairs dans les migrations existantes
- Pitfalls: HIGH — identifiés par analyse directe des interfaces et gaps

**Research date:** 2026-02-22
**Valid until:** 2026-03-22 (stable — stack interne, pas de dépendances externes changeantes)

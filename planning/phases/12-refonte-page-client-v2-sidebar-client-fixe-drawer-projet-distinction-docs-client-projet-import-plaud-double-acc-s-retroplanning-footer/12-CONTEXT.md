# Phase 12: Refonte page client V2 - Context

**Gathered:** 2026-02-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Restructurer la page client avec un layout à deux zones : sidebar client fixe à gauche (contacts, liens, documents client) + zone principale (liste projets). Un clic sur un projet ouvre un drawer glissant depuis la droite avec onglets (Produits, Docs, Facturation). Le retroplanning reste en footer full-width. L'import PLAUD est accessible depuis la sidebar client ET depuis le drawer projet. Les produits orphelins sont éliminés via un projet "Divers" automatique.

</domain>

<decisions>
## Implementation Decisions

### Navigation & transitions
- Drawer projet slide depuis la droite avec overlay semi-transparent derrière
- Liste des projets visible mais dimmée quand le drawer est ouvert
- Fermeture drawer : bouton X + clic overlay + touche Échap + breadcrumb
- Breadcrumb toujours visible pour naviguer entre niveaux (Client > Projets > [Projet] > Produits > [Produit])

### Contenu du drawer projet
- 3 onglets dans le drawer : **Produits** (défaut) | **Docs** | **Facturation**
- Onglet Produits = master-detail : 1/3 liste à gauche, 2/3 détail à droite
- Premier produit auto-sélectionné à l'ouverture (pas d'état vide)
- Header drawer permanent : nom du projet + budget total + badge statut facturation

### Documents client vs projet
- Tous les types de documents (brief, report, note, creative-strategy, web-brief, social-brief) peuvent être client OU projet
- Le contexte (client ou projet) est fixé à la création, pas de déplacement possible
- Sidebar client : affichage ultra-compact — titre + badge type coloré seulement
- Import PLAUD depuis sidebar client → crée un doc client (pas de sélecteur projet)
- Import PLAUD depuis drawer projet → crée un doc projet (rattaché au projet ouvert)

### Sidebar client (densité)
- 3 sections dans cet ordre : Contacts → Liens → Documents client
- Sections toujours ouvertes (pas de collapse)
- Pas de troncature : tout affiché, la sidebar scrolle si besoin
- Largeur fixe (~280-320px)
- Retroplanning en footer full-width (pas dans la sidebar)

### Facturation (modèle hybride)
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

</decisions>

<specifics>
## Specific Ideas

- Le proto V2 existant (`src/app/proto/client-detail-v2/page.tsx`) a une bonne base pour le master-detail produits et la facturation — réutiliser la logique de `computeMockProjectBilling` et le grid 2 colonnes
- Le pattern SectionCard du proto est propre et réutilisable
- La V1 a toute la logique CRUD, le store Zustand et les API routes — ne pas recréer, migrer
- L'onglet Facturation dans le drawer doit ressembler au `DeliverableForm` de la V1 (devis, acompte, avancements multiples, solde, dates par mouvement)
- Usage équilibré de toutes les features (suivi quotidien + facturation + gestion projet) — pas de section sacrifiée

</specifics>

<deferred>
## Deferred Ideas

- Archivage projets (page cachée pour projets archivés) — mentionné en phase 11, différé
- Retroplanning par projet (chaque projet avec son propre Gantt) — futur
- Statut par mouvement de facturation (payé/envoyé/en attente) — si besoin ultérieurement

</deferred>

---

*Phase: 12-refonte-page-client-v2*
*Context gathered: 2026-02-22*

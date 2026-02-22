# Phase 11: Refonte page client & documents projet — Context

**Gathered:** 2026-02-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Refonte de la page client avec sidebar fixe (contacts, liens, documents client, retro planning), distinction claire entre documents client et documents projet, ouverture projet en sous-drawer (pas modale) avec produits et documents, et import Plaud dans un projet avec process complet (Report → Brief → Creative Board → Web).
</domain>

<decisions>
## Implementation Decisions

### Prototype pour validation layout

- **Créer une page proto** avec mock data pour prévisualiser le layout et les interactions de la refonte
- **Accès :** bouton "Voir proto" visible depuis les pages clients (ex. fiche client ou liste clients)
- **Rôle :** valider le layout et les interactions avant de refactorer la page ClientDetail réelle
- **Contenu proto :** sidebar client (contacts, liens, documents) + main + footer (rétroplanning)
- **Une seule section "Projets et produits"** — pas de doublon Projets / Produits. Les produits sont intégrés sous chaque projet.
- **Clic projet** → remplace le contenu du main (pas de drawer overlay). La sidebar reste inchangée.
- **Fil d'Ariane** : Client > Projet > [Nom du projet] dans la vue projet
- **Fil d'Ariane** : CLIENT > PROJETS > [Projet] > PRODUITS > [Produit]. Toujours visible dans le main, au-dessus de sidebar projet + zone. Jamais au-dessus de la sidebar client.
- **Vue projet = Master-Detail** : la liste des produits reste visible à gauche, le détail du produit sélectionné s'affiche à droite. Ne jamais remplacer la liste par le détail — garder le contexte.
- **Produits cliquables** : dans la liste client (ouvre projet + produit), dans la vue projet (sélectionne le produit, détail à côté).
- **Barres hiérarchie** : "PROJETS" (vue client) et "PRODUITS" (vue projet) au-dessus des zones respectives.
- **Titres** : "Projets" uniquement (pas "Projets et produits").
- **Produits** : typo plus petite (text-xs), budgets affichés (prixFacturé, coutSousTraitance).
- **Dossiers projet** : repliables/dépliables (chevron) dans la vue client.
- **Archive** : pas dans cette phase — page cachée, à traiter plus tard.
- **Cascade** : projets dans la sidebar left (comme docs), pas en haut. Sidebar projet = [Projets] + [Documents projet du projet sélectionné].
- **Rétroplanning** : pas en sidebar — niveau client (plusieurs projets), en footer full width.
- **Produits orphelins** : détail seul (pas de master car pas de projet).
- **Documents projet** : toujours en sidebar (dans le main, à gauche de la zone produits). Pas d'AB test.
- Une fois validé, migrer le layout vers ClientDetail avec les vraies données

### Claude's Discretion

Les choix suivants restent à la discrétion du planner/implémenteur :
- Largeur exacte de la sidebar (280–320px)
- Comportement mobile (stack vertical vs collapsible)
- Project drawer : slide depuis la droite, overlay ou push
- Import Plaud : modal dédiée vs réutilisation ReportUploadModal
- Rétroplanning : hauteur footer, scroll interne si besoin
</decisions>

<specifics>
## Specific Ideas

- "Voir proto" — libellé du bouton d'accès à la page proto depuis le contexte client
- Proto avec mock data pour tester le layout sans toucher aux données réelles
</specifics>

<deferred>
## Deferred Ideas

- **Archive** : page cachée pour projets archivés manuellement (drag/drop ou autre). À traiter dans une phase ultérieure.
</deferred>

---

*Phase: 11-refonte-page-client*
*Context gathered: 2026-02-23*

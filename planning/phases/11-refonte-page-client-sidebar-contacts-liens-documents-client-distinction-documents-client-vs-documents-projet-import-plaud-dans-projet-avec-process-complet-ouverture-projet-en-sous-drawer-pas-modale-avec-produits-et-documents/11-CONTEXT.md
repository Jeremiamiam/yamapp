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
- **Rôle :** valider le layout (sidebar, drawer, zones) et les interactions avant de refactorer la page ClientDetail réelle
- **Contenu proto :** structure identique à la cible — sidebar (contacts, liens, documents client, retro) + zone principale (projets + produits) + ProjectDrawer au clic — alimentée par mock data
- Une fois validé, migrer le layout vers ClientDetail avec les vraies données

### Claude's Discretion

Les choix suivants restent à la discrétion du planner/implémenteur :
- Largeur exacte de la sidebar (280–320px)
- Comportement mobile (stack vertical vs collapsible)
- Project drawer : slide depuis la droite, overlay ou push
- Import Plaud : modal dédiée vs réutilisation ReportUploadModal
- Retro planning dans la sidebar : Gantt complet ou compact, scroll vs "Voir en grand"
</decisions>

<specifics>
## Specific Ideas

- "Voir proto" — libellé du bouton d'accès à la page proto depuis le contexte client
- Proto avec mock data pour tester le layout sans toucher aux données réelles
</specifics>

<deferred>
## Deferred Ideas

None — proto est une approche de validation pour cette phase, pas une feature séparée.
</deferred>

---

*Phase: 11-refonte-page-client*
*Context gathered: 2026-02-23*

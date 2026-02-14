# YAM Dashboard

## What This Is

Une web app minimaliste de gestion de clients et livrables pour l'agence de communication. Affiche une timeline horizontale avec tous les clients actifs, leurs rendus à livrer et les calls prévus, avec des fiches clients détaillées. Remplace Notion qui est trop complexe visuellement pour l'équipe.

## Core Value

Avoir une vue d'ensemble claire de tous les clients et deadlines en un coup d'œil, sans surcharge d'information.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Timeline horizontale affichant clients, rendus et calls en parallèle
- [ ] Filtrage timeline par statut client et membre d'équipe
- [ ] Créer et éditer des clients et prospects (statut commercial)
- [ ] Liens externes sur fiches clients (Figma, sites, prototypes)
- [ ] Créer et éditer des rendus avec deadlines et types
- [ ] Créer et éditer des calls/réunions avec dates et durée
- [ ] Backlog pour items non planifiés (drag-and-drop vers timeline)
- [ ] Assignation des rendus et calls aux membres d'équipe
- [ ] Fiches clients avec liste de contacts
- [ ] Documents structurés (briefs et reports PLAUD avec templates JSON)
- [ ] Navigation fluide entre timeline et fiches clients
- [ ] Interface ultra minimaliste et visuelle (peu de texte)
- [ ] Système de mock data initial pour validation UX
- [ ] Distinction visuelle claire entre prospects et clients
- [ ] Gestion d'équipe avec avatars et rôles

### Out of Scope

- Intégration directe avec PLAUD — Les transcriptions sont traitées en amont via Cursor
- Gestion de budget et facturation — Focus sur planning et contexte client
- Images dans les fiches clients — Volontairement exclu pour rester sobre
- Collaboration temps réel complexe — Pas besoin de voir qui édite en direct
- Mobile app native — Web-first, responsive suffisant

## Context

**Problème actuel :** L'agence utilise Notion mais trouve l'interface trop chargée et complexe. Trop d'informations visuelles nuisent à la clarté, particulièrement pour l'associé qui est dyslexique et fonctionne mieux avec des interfaces épurées et très visuelles.

**Volume d'activité :** 10-20 clients actifs en parallèle avec multiples rendus et calls à suivre.

**Utilisateurs :** Toute l'équipe de l'agence (pas juste les associés) doit pouvoir consulter et mettre à jour les informations.

**Fichiers textes :** Les transcriptions audio PLAUD sont traitées en amont via Cursor pour en extraire les informations clés (notes de réunion, briefs, contexte projet). Ces fichiers textes sont ensuite attachés aux fiches clients pour garder l'historique des échanges.

**Approche de développement :** Commencer avec des données mock pour valider le layout, la navigation et l'utilité globale avant d'implémenter la vraie gestion des données.

## Constraints

- **Design minimaliste** : Interface épurée, éviter surcharge visuelle — Notion trop complexe
- **Accessibilité (dyslexie)** : Privilégier le visuel sur le textuel, typo claire, espacement généreux — Associé dyslexique
- **Timeline lisible** : Doit afficher 10-20 clients simultanément de façon claire — Volume d'activité
- **Mock data first** : Commencer sans backend pour itérer rapidement sur l'UX — Validation avant investissement

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Mock data avant vraie persistence | Valider layout, navigation et utilité avant d'investir dans le backend | — Pending |
| Timeline horizontale (pas calendrier grid) | Besoin de voir flux temporel des rendus, pas planning détaillé | ✓ Good |
| Distinction Prospect/Client | Statut commercial important pour l'équipe | ✓ Good |
| Pas d'images dans fiches | Rester sobre et focus sur l'info essentielle | ✓ Good |
| Templates JSON pour documents | Structure les briefs et reports PLAUD de façon standardisée | — Pending |
| Assignation via team members | Permet de voir qui est responsable de quoi | ✓ Good |
| Filtres timeline (statut + équipe) | Permet de focus sur un sous-ensemble sans perdre la vue globale | ✓ Good |
| Liens externes avec labels suggérés | Accès rapide aux assets externes (Figma, sites) | ✓ Good |
| Backlog sidebar pour items non planifiés | Permet de créer des items sans savoir quand les faire, puis drag-and-drop sur timeline | — Pending |

---
*Last updated: 2026-02-13 after backlog feature addition*

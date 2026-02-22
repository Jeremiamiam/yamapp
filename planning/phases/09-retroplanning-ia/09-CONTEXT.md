# Phase 9: Retroplanning IA - Context

**Gathered:** 2026-02-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Automatisation de retroplanning pour les projets clients. L'IA analyse le brief existant (web brief ou autre), déduit les livrables et étapes, propose un planning inversé à partir de la date de livraison. L'utilisateur ajuste ensuite manuellement. Vue Gantt/Timeline dans la fiche client, usage interne uniquement.

</domain>

<decisions>
## Implementation Decisions

### Source des données
- L'IA lit le web brief existant du client dans YAM Dash pour en déduire les livrables
- Pour les projets non-web, l'IA doit aussi pouvoir travailler à partir du contexte client disponible
- Input principal : date de livraison + contenu du brief → l'IA fait le puzzle entre les deux

### Scope projet
- Tous types de projets agence (sites web, identité visuelle, campagnes, vidéo...)
- Pas limité aux web briefs — l'outil doit être générique
- L'IA adapte les étapes au type de projet détecté dans le brief

### Jalons / Étapes
- Pas de template fixe de phases — l'IA analyse le brief et propose les étapes adaptées au projet
- L'IA déduit les jalons pertinents (ex: pour un site web → maquettes/dev/recette, pour une vidéo → script/tournage/montage)
- Les étapes proposées sont spécifiques au projet, pas génériques

### Estimations de durée
- L'IA propose des durées basées sur le contexte du projet
- L'équipe ajuste manuellement les durées après génération
- Pas de durées préconfigurées par type de tâche

### Dépendances
- Pas de gestion automatique des dépendances entre tâches
- Ordre logique visible mais c'est l'humain qui gère les enchaînements
- Pas de recalcul automatique en cascade

### Visualisation
- Timeline / Gantt — barres horizontales, vue classique chef de projet
- Vit dans la fiche client (onglet ou section dédiée)
- Pas de vue globale cross-projets (interne à chaque client)

### Édition post-génération
- Drag & drop sur le Gantt pour déplacer/redimensionner les barres rapidement
- Formulaire pour l'édition détaillée (clic sur une tâche)
- Les deux modes coexistent

### Audience
- Usage interne uniquement — outil de pilotage équipe
- Pas de partage client prévu dans cette phase

### Claude's Discretion
- Choix de la librairie Gantt/Timeline
- Format exact des données de planning en base
- Design des barres et couleurs par type d'étape
- Algorithme de répartition des durées entre la date courante et la deadline

</decisions>

<specifics>
## Specific Ideas

- C'est une "VRAIE faille à l'agence" — le retroplanning est un besoin critique, pas un nice-to-have
- L'IA doit être intelligente sur la déduction des étapes : lire le brief et comprendre ce qui est nécessaire plutôt que plaquer un template
- L'accompagnement IA est limité à la génération initiale — pas de suivi actif ni d'alertes

</specifics>

<deferred>
## Deferred Ideas

- Vue globale cross-projets (tous les retroplannings actifs) — future phase
- Partage client / export du retroplanning — future phase
- Suivi actif IA (alertes retard, suggestions d'ajustement) — future phase
- Apprentissage des durées basé sur les projets passés — future phase

</deferred>

---

*Phase: 09-retroplanning-ia*
*Context gathered: 2026-02-22*

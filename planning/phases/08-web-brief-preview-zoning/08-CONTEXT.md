# Phase 8: Web Brief Preview & Zoning - Context

**Gathered:** 2026-02-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Preview visuelle des pages web-brief avec zoning/layout. Couvre : gestion du menu/navigation (groupes de pages, suppression), banque de layouts avec matching intelligent et génération de layouts manquants, édition des sections (manuelle + re-prompting IA contextuel), et robustesse du modèle de données (IDs uniques, validation, drag & drop).

Le prototype existe déjà (WebBriefView, WebBriefDocumentContent, section-registry, layouts) mais l'approche est trop fragile. Cette phase consolide et étend.

</domain>

<decisions>
## Implementation Decisions

### Navigation & menu
- Suppression de pages : suppression complète (page + sections), pas de "masquer"
- Sous-menus : groupes de pages hiérarchiques (ex: Services > Web, Branding, SEO)
- Structure proposée par l'IA lors du zoning, l'user peut ajuster après
- Réorganisation de la nav : Claude's Discretion sur le mécanisme (drag & drop vs flèches)

### Layouts manquants & fallback
- Matching intelligent : quand un rôle de section n'a pas de layout, l'IA tente d'abord de matcher un layout existant par similarité
- Si aucun match : placeholder visible avec message "Layout inexistant — voulez-vous en générer un ?"
- Génération : crée un vrai composant React (continuité avec la banque existante LayoutHero, LayoutFaq...) pour garantir la consistance cross-projets
- Le layout généré est ajouté à la registry (section-registry.ts)
- L'agent zoning doit être précis dans son usage des rôles : pas de rôle vague "qui ressemble" si un layout exact existe
- Anti-prolifération : matching intelligent prioritaire, génération en dernier recours uniquement

### Édition des sections
- 2 modes : édition manuelle + re-prompting IA (un seul bouton IA, pas deux)
- Champs dynamiques : le formulaire d'édition s'adapte automatiquement au contenu réel de la section (tout champ présent = éditable)
- Re-prompting : l'agent relit systématiquement le contexte du projet (creative strat, web brief, plateforme de marque) avant de réécrire
- Sauvegarde manuelle : bouton "Sauvegarder" + raccourci ENTER

### Robustesse des données
- IDs uniques (UUID) par section — plus d'identification par index de tableau
- Sections réordonnables par drag & drop
- Ajout + suppression de sections individuelles dans une page
- Gestion d'erreur JSON malformé : Claude's Discretion sur la stratégie (retry silencieux, message clair, ou combinaison)

### Claude's Discretion
- Mécanisme de réorganisation de la nav (drag & drop vs flèches vs autre)
- Stratégie de gestion d'erreur pour les réponses IA malformées
- Détails techniques du matching intelligent de layouts
- Architecture de la génération de composants React à la volée

</decisions>

<specifics>
## Specific Ideas

- "J'aime bien l'idée d'avoir une consistance sur tous les projets" → la banque de layouts doit rester des composants React, pas du JSON dynamique
- L'agent de rewrite doit toujours relire le contexte projet (documents creative strat, web brief, plateforme de marque) avant toute réécriture
- Le zoning agent doit être "smart" sur l'usage des layouts existants — pas de génération si un layout colle déjà
- Pas 2 boutons IA, 1 seul bouton de re-prompting + 1 bouton édition manuelle

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 08-web-brief-preview-zoning*
*Context gathered: 2026-02-22*

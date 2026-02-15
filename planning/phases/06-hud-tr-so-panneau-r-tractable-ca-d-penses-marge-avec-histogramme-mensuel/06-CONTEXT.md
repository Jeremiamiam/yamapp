# Phase 6: Vue Comptabilité - Context

**Gathered:** 2026-02-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Vue dédiée "Comptabilité" dans la navigation (niveau Header, comme Calendrier/Clients) affichant la trésorerie de l'agence sur l'année complète:
- Argent rentré (rentrées validées) avec détail par client
- Marge nette (après déduction freelances/sous-traitance)
- CA potentiel (prospects + projets futurs) avec détail par client

**Ce n'est PAS:** Une app de gestion comptable complète. Pas d'alertes retards, pas de coûts fixes, juste les projets créa/production.

</domain>

<decisions>
## Implementation Decisions

### Horizon de temps
- **Année fiscale complète** (janvier → décembre)
- **Sélecteur d'année avec flèches** `< 2026 >`
  - Permet de naviguer entre années (2024, 2025, 2026, etc.)
  - Par défaut: année en cours
  - Important pour totaliser les KPIs annuels (déclarations fiscales, compta officielle)

### Rentrées validées
- **Facturé = rentré** (peu importe si encaissé ou pas)
- Critère: deliverables avec `status = 'completed'`
- Montant: `prixFacturé` de chaque deliverable
- **Présentation: Groupé par client**
  - Ex: "Forge: 8 000€ (Logo 3500€ + Charte 4500€)"
  - Liste des clients avec sous-total + détail des deliverables

### CA potentiel (Prévisionnel)
- **Somme automatique des deliverables futurs/prospects**
- Critère: deliverables avec `status = 'pending' | 'in-progress'`
- Inclut prospects (clients avec `status = 'prospect'`) ET projets futurs clients existants
- **Présentation: Détail par client** (comme rentrées)
  - Ex: "Les 4 Nectarines (P): 5 000€ (Logo 3k + Carte visite 2k)"
  - Indication visuelle prospect vs client existant

### Marge & Dépenses
- **Marge = Rentrées - Coûts freelances/sous-traitance**
- Coûts: `coutSousTraitance` de chaque deliverable
- Pas de coûts fixes mensuels (hors scope)
- Calcul automatique par client et global

### Claude's Discretion
- Layout exact (KPIs + listes, colonnes, ou onglets — choisir le plus clair)
- Design des cartes clients (expansion, collapse, icônes)
- Ordre de tri (alphabétique, montant DESC, ou date)
- Affichage marge par projet (si utile) ou juste marge globale
- Graphique/histogramme optionnel si ça aide la lisibilité

</decisions>

<specifics>
## Specific Ideas

**User quote:**
> "je veux mes rentrées validées de l'année (et pouvoir retrouver d'où ça rentre, quel client, quel projet/livrable) — la marge (donc déduire des freelance et autres sous traitance) et voir le potentiel (+ détail, comme les rentrées)"

**Clarifications:**
- Focus uniquement projets créa/production (pas une compta complète)
- Pas besoin d'alertes, de gestion retards, de tracking paiements
- Pas de coûts fixes à paramétrer

**Structure existante utilisée:**
- Deliverable a déjà `prixFacturé` et `coutSousTraitance` (champs existants)
- Client a déjà `status: 'prospect' | 'client'`
- Deliverable a déjà `status: 'pending' | 'in-progress' | 'completed'`

**Calculs attendus:**
```
Rentrées validées = sum(deliverables where status='completed').prixFacturé
Dépenses = sum(deliverables where status='completed').coutSousTraitance
Marge = Rentrées - Dépenses

Potentiel = sum(deliverables where status IN ['pending','in-progress']).prixFacturé
```

</specifics>

<deferred>
## Deferred Ideas

Aucune — discussion restée dans le scope Phase 6.

**Hors scope explicite (user a dit non):**
- Alertes paiements en retard
- Gestion coûts fixes mensuels
- Tracking statut paiement (facturé/encaissé/retard)
- Système de facturation complet

</deferred>

---

*Phase: 06-vue-comptabilité*
*Context gathered: 2026-02-15*

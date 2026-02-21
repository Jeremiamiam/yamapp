# Creative Board — Rendu des sorties agents

> Documentation du pipeline complet : [CREATIVE-PIPELINE.md](CREATIVE-PIPELINE.md) (Plaud → Brief → Creative Board → Web)

## Actuel : Markdown stylé

Les agents (Stratège, Big Idea, Copywriter, Devil's Advocate) renvoient du **texte en Markdown**.  
Le front le rend avec **react-markdown** et des composants dédiés :

- **Titres** (`#`, `##`, `###`) → hiérarchie visuelle (taille, graisse, espacement)
- **Citations** (`>`) → bloc avec bordure gauche
- **Gras** (`**`) → renforcement
- **Listes** (`-`, `1.`) → puces / numéros
- **Séparateurs** (`---`) → filet horizontal

Pendant le **streaming**, le texte s’affiche en brut (`pre-wrap`) pour éviter un rendu cassé (Markdown incomplet). Une fois **terminé** (`done`), le bloc est re-rendu en Markdown.

---

## Optionnel : JSON structuré (évolution possible)

Si on veut un rendu encore plus maîtrisé (cartes, sections repliables, taglines en chips), on peut **cadrer les sorties en JSON** côté API et les afficher avec des composants dédiés.

### Intérêt

- **UI prévisible** : sections, citations et taglines toujours au même endroit.
- **Pas de parsing Markdown** : pas de souci avec du Markdown mal formé ou partiel en stream.
- **Streaming** : possible en envoyant des chunks JSON partiels (ex. une section à la fois) ou en affichant le JSON seulement quand la réponse est complète.

### Inconvénient

- **Prompts à adapter** : chaque agent doit renvoyer un JSON valide (avec consigne stricte + éventuel fallback si le modèle dérape).
- **Streaming** : plus délicat (il faut soit bufferiser jusqu’à un objet complet, soit définir un format de stream type NDJSON).

### Schéma possible (ex. Stratège)

```json
{
  "version": 1,
  "agent": "strategist",
  "title": "Blue Conseil - Lecture stratégique sans filtre",
  "sections": [
    {
      "heading": "Le non-dit",
      "body": "Blue Conseil n'a pas un problème d'image..."
    },
    {
      "heading": "L'angle qui fâche",
      "body": "Les grands comptes n'achètent pas les meilleurs...",
      "quote": "Les grands comptes n'achètent pas les meilleurs. Ils achètent ceux qui ressemblent aux meilleurs."
    },
    {
      "heading": "La thèse en une phrase",
      "body": "Blue Conseil doit arrêter de se vendre comme une alternative aux ESN..."
    }
  ]
}
```

### Schéma Yam (touche créative)

Yam peut travailler en **mode concept complet** (concept + visuel + accroche) ou en **mode copywriter secondaire** (accroches seules, sans visuel). Tous les champs sauf `accroche` sont optionnels.

```json
{
  "touches": [
    {
      "accroche": "Obligatoire — 4 à 7 mots",
      "concept": "Optionnel — la mécanique de fond",
      "visuel": "Optionnel — ce qu'on voit / ce qu'on découvre",
      "pourquoi": "Optionnel — 1-2 phrases"
    }
  ],
  "commentaire": "Optionnel"
}
```

### Schéma possible (ex. Copywriter)

```json
{
  "version": 1,
  "agent": "copywriter",
  "territory": "L'arrogance du calme. Pas d'agressivité...",
  "manifesto": "On n'a pas de commercial. On n'en a jamais eu...",
  "taglines": [
    { "text": "Blue Conseil. L'expertise sans l'emballage.", "note": "L'épure" },
    { "text": "Nos clients n'ont pas recommandé notre plaquette.", "note": "Le retournement" }
  ]
}
```

### Mise en œuvre

1. **Phase 1 (actuelle)** : garder le Markdown + rendu react-markdown → déjà en place.
2. **Phase 2 (optionnelle)** :  
   - Ajouter dans l’API une option du type `outputFormat: 'markdown' | 'json'`.  
   - Pour `json`, adapter les system prompts des agents pour exiger un JSON conforme au schéma (avec phrase magique du type « Réponds UNIQUEMENT avec un JSON valide… »).  
   - Côté front : si la réponse est du JSON valide, utiliser un composant `StructuredAgentOutput` (sections, citations, taglines en cartes) ; sinon fallback sur le rendu Markdown actuel.

Ce doc peut servir de référence si tu veux aller vers du JSON plus tard sans casser l’existant.

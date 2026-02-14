# Templates JSON pour l'IA — Brief & Report PLAUD

L’IA doit produire un fichier JSON qui respecte **exactement** un des schémas ci-dessous.  
Ces JSON peuvent être importés dans YAM Dashboard (Documents > Brief ou Report PLAUD > Importer JSON).

---

## 1. Brief (créatif / projet)

```json
{
  "version": 1,
  "title": "Titre du brief",
  "clientContext": "Contexte client, enjeux, historique (optionnel)",
  "objectives": ["Objectif 1", "Objectif 2"],
  "targetAudience": "Cible (optionnel)",
  "deliverables": ["Livrable 1", "Livrable 2"],
  "constraints": "Contraintes techniques ou créatives (optionnel)",
  "tone": "Ton souhaité (optionnel)",
  "references": "Références (optionnel)",
  "deadline": "Date ou délai (optionnel)",
  "notes": "Notes additionnelles (optionnel)"
}
```

**Champs obligatoires :** `version` (1), `title`, `objectives` (tableau non vide), `deliverables` (tableau non vide).

---

## 2. Report PLAUD (compte-rendu d’appel / réunion)

```json
{
  "version": 1,
  "title": "Titre du call / réunion",
  "date": "2026-02-13",
  "duration": 45,
  "participants": ["Nom 1", "Nom 2"],
  "summary": "Résumé en une ou deux phrases.",
  "keyPoints": ["Point clé 1", "Point clé 2"],
  "actionItems": [
    { "text": "Action à faire", "assignee": "Nom responsable" },
    { "text": "Autre action" }
  ],
  "nextSteps": "Prochaines étapes (optionnel)",
  "transcriptionExcerpt": "Extrait ou transcription longue (optionnel)"
}
```

**Champs obligatoires :** `version` (1), `title`, `date`, `summary`, `keyPoints` (tableau), `actionItems` (tableau d’objets avec au moins `text`).

---

## Exemple Brief

```json
{
  "version": 1,
  "title": "Brief identité visuelle Maison X",
  "clientContext": "Marque artisanale, 20 ans d’existence, besoin de moderniser sans perdre l’ADN.",
  "objectives": ["Refonte logo", "Charte graphique", "Cohérence digital/print"],
  "targetAudience": "CSP+ 35-55 ans, urbains",
  "deliverables": ["Logo V2", "Charte couleurs & typo", "Templates social"],
  "tone": "Premium, authentique, épuré",
  "deadline": "Livrable 1 sous 4 semaines"
}
```

## Exemple Report PLAUD

```json
{
  "version": 1,
  "title": "Call kick-off projet Y",
  "date": "2026-02-13",
  "duration": 30,
  "participants": ["Sophie Martin (client)", "Jérémy (YAM)"],
  "summary": "Présentation du besoin refonte site et validation du périmètre Phase 1.",
  "keyPoints": ["Scope Phase 1 validé", "Maquettes attendues pour le 28/02", "Budget confirmé"],
  "actionItems": [
    { "text": "Envoyer recap écrit", "assignee": "Jérémy" },
    { "text": "Fournir accès FTP et contenus", "assignee": "Sophie Martin" }
  ],
  "nextSteps": "Point mi-parcours le 20/02."
}
```

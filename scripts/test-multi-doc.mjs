import Anthropic from '@anthropic-ai/sdk';
import { readFileSync } from 'fs';

// ─── Documents fournis pour le test ───────────────────────────────────────────

const PV = `BlooConseil-Procès-verbal
Actions à mener
- @Consultant - Organiser une session préliminaire de questions-réponses avant le 20 - [Date non précisée].
- @Équipe Blue Conseil - Partager les besoins terrain et les éléments existants sur communication/identité avant la discussion budget - [Date non mentionnée].
- @Consultant - Conduire une session Q&A immédiate et produire une trame/brainstorm pour la session du 20 - [Due Date: 20 (mois non confirmé)].
- @Blue Conseil - Examiner la pertinence de collaborations/benchmarks avec ESN alignées (ex. MaxDS, Fellowes) pour inspirer l'identité et la communication - [Due Date non mentionnée].
- @Speaker 4 - Suivre l'issue de la proposition forfaitaire 2 ETP envoyée il y a dix jours - [Due Date non mentionnée].
- @Speaker 1 - Présenter des exemples de plateforme de marque et de manifeste et proposer un atelier dédié (non réalisé en direct) - [Due Date non mentionnée].
- @Équipe Blue Conseil - Ranger et clarifier les contenus du site, en séparant ce qui prouve le business, l'expertise, et la culture - [Due Date non mentionnée].
- @Speaker 4 - Étudier les retombées et le modèle de la campagne Jump pour benchmark de visibilité - [Due Date non mentionnée].
- @Speaker 1 - Montrer des exemples de plateformes/book PDF adaptés à la marque employeur - [Due Date non mentionnée].
- @Speaker 1 - Proposer à MaxDS une option de développement WordPress sur-mesure avec remise des codes sources - [Date non mentionnée].
- @Speaker 1 - Montrer à Speaker 2 l'avancement du projet MaxDS (axes, maquettes) - [Date non mentionnée].
- @Speaker 2 - Consolider avec Marc et Mathieu une liste des problématiques et du budget envisagé - [Due Date non mentionnée].
- @Speaker 2 - Préparer et envoyer le cahier des charges et le budget à l'agence - [Due Date non mentionnée].
- @Speaker 1 - Élaborer une proposition basée sur le cahier des charges et le budget, puis planifier une visio de retour - [Due Date non mentionnée].
- @Speaker 2 - Envoyer budget et problématiques "très vite" pour déclencher le travail de l'agence - Cible implicite: avant le 20, si possible.
- @Speaker 1 - Montrer des exemples de masques/templates utilisés chez Be Hive - [Due Date non mentionnée].
Décisions clés
- Concevoir un site intégrant "client, marque employeur, manifeste" sans changer de style selon le public, mais en guidant chaque audience vers sa matière dédiée.
- Ne pas se limiter à un site vitrine "métier" générique; intégrer des contenus qui parlent différemment aux clients et aux candidats.
- Prioriser l'acquisition d'image et de notoriété, non l'acquisition directe de clients.
- Ne pas mettre explicitement le relooking des 10 ans au cœur de la communication.
- Définir des enveloppes distinctes pour création visuelle/positionnement d'image et pour la diffusion.
- Prioriser la construction d'un univers/ADN de marque plutôt que la simple production de logos.
- Travailler une proposition structurée sur le vin à présenter à l'équipe.
- Prioriser l'envoi rapide du budget et des problématiques pour permettre à l'agence de préparer des éléments concrets.
Compte rendu détaillé
[00:00-03:17] Les 10 ans, arrivée d'un 3e associé, et préparation d'une stratégie identité/communication/social media
[04:05-05:16] Démarche du consultant: diagnostic approfondi, immersion et travail autonome
[05:16-05:43] Organisation d'une séance Q/R préalable — accord et faisabilité confirmée.
[06:03-06:51] Budget: paramètre clé après clarification des besoins terrain.
[07:23-09:05] État des lieux business: 3 associés, 6 ETP; clientèle grands comptes parisiens; activité soutenue infra/cyber.
[09:05-10:18] Priorité au repositionnement d'image plutôt qu'à la conquête CA.
[12:31-13:48] ESN et benchmarking: MaxDS, Fellowes.
[17:57-18:59] Diagnostic d'image: site/réseaux à remettre à niveau.
[20:35-21:19] Inspiration Jump: affichage métro et impact.
[23:01-24:06] Coûts d'affichage et bascule vers social ads: LinkedIn/Meta.
[24:42-25:52] 500€ bien ciblés suffisent à une présence locale.
[25:52-27:03] Salons B2B: Rennes 1500-2000€, Paris 5000-12000€.
[36:53-38:02] Manque de plateforme de marque et manifeste à co-construire.
[38:48-39:53] Structuration du site en trois volets: discours client, recrutement, manifeste/ADN.
[48:55-50:16] Enveloppe recommandée: ≥10 000€ pour ne pas être coincé; seuil plancher ~8 000€.
[01:02:21-01:04:26] Univers/ADN de marque vs "joli" et rôle de l'IA — l'IA génère des logos, pas un univers.
[01:09:49-01:11:15] Prochaine étape: cahier des charges + budget, visio, et proposition (incl. vin).
[01:11:16-01:12:12] Proposition "vin": transformer le brainstorming en proposition structurée.`;

const SUMMARY = `BlooConseil-Résumé
Date et heure : 2026-02-05 17:08:52
Client : Blue Conseil
Aperçu
Blue Conseil, une entreprise de conseil en infrastructure et cybersécurité célébrant ses 10 ans, cherche à redéfinir sa stratégie de communication et son image de marque. Actuellement composée de trois associés (avec des projets d'expansion à cinq) et de 6 ETP, l'entreprise a connu une croissance stable et n'est pas confrontée à un besoin urgent d'acquisition de clients. Le défi principal est un décalage entre son image actuelle, jugée "ringarde" et celle d'une "petite boîte", et sa maturité, son succès et son positionnement d'expert.
Contexte
La démarche s'inscrit dans la préparation d'un séminaire stratégique de trois jours (18-19-20 février), dont la journée du vendredi 20 sera consacrée au marketing et à la communication. L'entreprise se positionne comme une alternative aux ESN traditionnelles. Un travail interne sur la raison d'être, la vision et les valeurs a déjà été initié en vue de 2030.
Points de douleur
- Image de marque dépassée: identité visuelle et site perçus comme "ringards".
- Absence de stratégie de communication formalisée (pas de plateforme de marque ni de manifeste).
- Difficulté à attirer et fidéliser les talents; modèle peine à retenir les collaborateurs.
- Dépendance au bouche-à-oreille; manque de stratégie digitale efficace sur LinkedIn.
Attentes
- Créer une image de marque forte et authentique, "costaude" et moderne.
- Formaliser l'identité dans une plateforme de marque (manifeste).
- Développer une stratégie de communication globale et segmentée (clients / candidats).
- Proposition concrète avec options budgétaires: enveloppe minimale 8 000-10 000€.
Résumé
- Célébration 10 ans: événements clients ciblés (repas) plutôt que grande fête.
- Dualité de communication: "moderne/techno" pour les clients, "authentique/humain" pour les talents.
- Valeur de l'agence perçue dans la stratégie/ADN plutôt que l'exécution, face à l'IA générative.
- Salons B2B représentent ~50% de l'effort de communication.
Liste de tâches
- Définir en interne une liste de problématiques et fourchette budgétaire à fournir à l'agence.
- Planifier une session de co-création de la plateforme de marque avant le 20 février.
- Préparer une proposition stratégique (plateforme de marque, identité visuelle, refonte site, stratégie contenu) avec options budgétaires.
- Proposer une nouvelle arborescence pour le site web structurée autour des cibles.
- Préparer une trame pour l'atelier du 20 février.
- Fournir les nouvelles cartes de visite pour Matthias.`;

// ─── Prompt adapté pour 2 documents ──────────────────────────────────────────

const SYSTEM_PROMPT = `Tu es un assistant expert en synthèse de réunions pour une agence créative.
Tu analyses deux documents complémentaires d'une même réunion :
- Un RÉSUMÉ (vue stratégique, bien structuré, peut manquer de détails opérationnels)
- Un PROCÈS-VERBAL (détaillé, avec actions et décisions précises, peut être verbeux)
Tu croises les deux sources pour produire un rapport synthétique, précis et actionnable.
Tu réponds UNIQUEMENT avec un JSON valide, sans markdown, sans commentaires, sans texte avant ou après.`;

const USER_PROMPT = (summary, pv) => `Analyse ces deux documents d'une même réunion client et retourne un JSON respectant EXACTEMENT ce schéma :

{
  version: 1,
  title: string,
  date: string,                            // YYYY-MM-DD
  duration?: number,                       // en minutes si mentionné
  participants?: string[],                 // UNIQUEMENT des personnes physiques (prénom + nom). Exclure noms d'entreprises, d'équipes, "Speaker X".
  summary: string,                         // synthèse croisée des deux docs, 3-5 phrases percutantes
  keyPoints: string[],                     // points clés unifiés (pas de doublons entre les deux docs)
  actionItems: { text: string; assignee?: string }[],  // toutes les actions des deux docs, dédupliquées, assignee = vrai prénom si connu
  nextSteps?: string,                      // prochaine étape principale
  transcriptionExcerpt?: string,           // citation marquante du PV si pertinent
  suggestedDeliverables?: { name: string; type: "creative" | "document" | "other" }[],  // livrables à créer pour ce client
  suggestedEvents?: { type: "deliverable" | "call"; label: string; date: string }[]
  // IMPORTANT: extraire TOUTES les dates mentionnées dans les deux docs.
  // type "deliverable" = rendu/livrable. type "call" = RDV/réunion/call.
  // date au format YYYY-MM-DD (l'année de référence est 2026).
  // label = libellé court (ex: "Atelier stratégie", "Visio proposition", "Séminaire Blue Conseil").
}

═══ RÉSUMÉ (vue d'ensemble) ═══
${summary}

═══ PROCÈS-VERBAL (détail opérationnel) ═══
${pv}`;

// ─── Appel API ────────────────────────────────────────────────────────────────

const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) {
  console.error('❌ ANTHROPIC_API_KEY manquante dans l\'environnement');
  process.exit(1);
}

console.log('🔄 Envoi à Claude (croisement summary + PV)...\n');

const client = new Anthropic({ apiKey });
const message = await client.messages.create({
  model: 'claude-sonnet-4-5-20250929',
  max_tokens: 2048,
  system: SYSTEM_PROMPT,
  messages: [{ role: 'user', content: USER_PROMPT(SUMMARY, PV) }],
});

const rawText = message.content[0].text;
const cleaned = rawText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();

let parsed;
try {
  parsed = JSON.parse(cleaned);
} catch (e) {
  console.error('❌ JSON invalide reçu de Claude:\n', rawText);
  process.exit(1);
}

const costUsd = (message.usage.input_tokens * 3 + message.usage.output_tokens * 15) / 1_000_000;

console.log('✅ RAPPORT GÉNÉRÉ\n');
console.log('─'.repeat(60));
console.log(JSON.stringify(parsed, null, 2));
console.log('─'.repeat(60));
console.log(`\n📊 Tokens: ${message.usage.input_tokens} in / ${message.usage.output_tokens} out`);
console.log(`💰 Coût estimé: $${costUsd.toFixed(4)}`);

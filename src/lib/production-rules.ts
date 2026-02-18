/**
 * Règles métier pour les transitions de statut Production ↔ Facturation.
 * 
 * Source de vérité unique : tout changement de statut passe par ici.
 * 
 * Flux :  à deviser → à faire → en attente → terminé
 * 
 * Règles :
 *  - to_quote → pending    : nécessite prixFacturé > 0 OU projet devisé (le projet l’emporte)
 *  - pending → in-progress  : libre
 *  - in-progress → completed: nécessite billingStatus === 'balance'
 *  - completed → autre      : libre (correction), reset billing si nécessaire
 *  - pending → to_quote     : interdit si prixFacturé > 0 (déjà devisé)
 */

import type { DeliverableStatus, BillingStatus } from '@/types';

/** Contexte d'un produit pour évaluer les transitions */
export interface DeliverableContext {
  status: DeliverableStatus;
  billingStatus: BillingStatus;
  prixFacturé?: number;
  /** Devis global du projet si le produit est rattaché à un projet devisé (le projet l’emporte) */
  projectQuoteAmount?: number;
}

/** Résultat d'une tentative de transition */
export type TransitionResult =
  | { allowed: true; autoChanges?: Partial<{ status: DeliverableStatus; billingStatus: BillingStatus }> }
  | { allowed: false; reason: string };

/**
 * Vérifie si un changement de statut est autorisé dans le kanban (drag & drop).
 * Retourne allowed + raison si refusé.
 */
export function canTransitionStatus(
  ctx: DeliverableContext,
  newStatus: DeliverableStatus
): TransitionResult {
  const { status: current, billingStatus, prixFacturé } = ctx;

  // Pas de changement
  if (current === newStatus) return { allowed: true };

  // "Terminé" verrouillé : pas de drag & drop vers ou depuis
  if (current === 'completed') {
    return { allowed: false, reason: 'Ouvre la modale pour modifier un produit terminé' };
  }
  if (newStatus === 'completed') {
    return { allowed: false, reason: 'Ouvre la modale pour marquer un produit terminé' };
  }

  // Vers "à deviser" : interdit si déjà devisé
  if (newStatus === 'to_quote') {
    if (prixFacturé != null && prixFacturé > 0) {
      return { allowed: false, reason: 'Produit déjà devisé — impossible de revenir à "À deviser"' };
    }
    return { allowed: true };
  }

  // Vers "à faire" : nécessite un prix produit OU un projet devisé (le projet l’emporte)
  if (newStatus === 'pending') {
    if (current === 'to_quote') {
      const hasProductPrice = prixFacturé != null && prixFacturé > 0;
      const projectDevised = (ctx.projectQuoteAmount ?? 0) > 0;
      if (!hasProductPrice && !projectDevised) {
        return { allowed: false, reason: 'Ajoute un prix ou rattache à un projet devisé' };
      }
    }
    return { allowed: true };
  }

  // Vers "en attente" : libre
  if (newStatus === 'in-progress') {
    return { allowed: true };
  }

  return { allowed: true };
}

/**
 * Cascade : quand on modifie un produit via la modale, 
 * calcule les changements automatiques de statut.
 * 
 * Appelé APRÈS la mise à jour des champs dans la modale.
 */
export function computeStatusCascade(
  currentStatus: DeliverableStatus,
  newBillingStatus: BillingStatus,
  newPrixFacturé: number | undefined
): Partial<{ status: DeliverableStatus }> {
  const changes: Partial<{ status: DeliverableStatus }> = {};

  // Cascade 1 : prix ajouté + statut "à deviser" → passe à "à faire"
  if (currentStatus === 'to_quote' && newPrixFacturé != null && newPrixFacturé > 0) {
    changes.status = 'pending';
  }

  // Cascade 1b : devis/prix supprimé + statut "à faire" → repasse à "à deviser"
  if (currentStatus === 'pending' && (newPrixFacturé == null || newPrixFacturé <= 0)) {
    changes.status = 'to_quote';
  }

  // Cascade 2 : billing soldé → passe à "terminé"
  if (newBillingStatus === 'balance' && currentStatus !== 'completed') {
    changes.status = 'completed';
  }

  // Cascade 3 : billing plus soldé + statut terminé → retour "en attente"
  if (newBillingStatus !== 'balance' && currentStatus === 'completed') {
    changes.status = 'in-progress';
  }

  return changes;
}

// ─── Tests automatiques ────────────────────────────────────────────────

export interface TestCase {
  name: string;
  ctx: DeliverableContext;
  action: { type: 'transition'; newStatus: DeliverableStatus } | { type: 'cascade'; newBilling: BillingStatus; newPrix: number | undefined };
  expected: { allowed?: boolean; reason?: string; newStatus?: DeliverableStatus };
}

/** Tous les cas de test pour valider les règles métier */
export const ALL_TEST_CASES: TestCase[] = [
  // ── Transitions Kanban (drag & drop) ──

  // to_quote → pending
  { name: '❌ to_quote → pending SANS prix ni projet devisé', ctx: { status: 'to_quote', billingStatus: 'pending' }, action: { type: 'transition', newStatus: 'pending' }, expected: { allowed: false, reason: 'Ajoute un prix ou rattache à un projet devisé' } },
  { name: '❌ to_quote → pending prix = 0 et pas de projet', ctx: { status: 'to_quote', billingStatus: 'pending', prixFacturé: 0 }, action: { type: 'transition', newStatus: 'pending' }, expected: { allowed: false, reason: 'Ajoute un prix ou rattache à un projet devisé' } },
  { name: '✅ to_quote → pending AVEC prix produit', ctx: { status: 'to_quote', billingStatus: 'pending', prixFacturé: 1500 }, action: { type: 'transition', newStatus: 'pending' }, expected: { allowed: true } },
  { name: '✅ to_quote → pending SANS prix mais projet devisé', ctx: { status: 'to_quote', billingStatus: 'pending', projectQuoteAmount: 10000 }, action: { type: 'transition', newStatus: 'pending' }, expected: { allowed: true } },

  // pending → to_quote
  { name: '❌ pending → to_quote si déjà devisé', ctx: { status: 'pending', billingStatus: 'pending', prixFacturé: 1500 }, action: { type: 'transition', newStatus: 'to_quote' }, expected: { allowed: false, reason: 'déjà devisé' } },
  { name: '✅ pending → to_quote si pas de prix', ctx: { status: 'pending', billingStatus: 'pending' }, action: { type: 'transition', newStatus: 'to_quote' }, expected: { allowed: true } },

  // pending → in-progress
  { name: '✅ pending → in-progress (libre)', ctx: { status: 'pending', billingStatus: 'pending', prixFacturé: 1500 }, action: { type: 'transition', newStatus: 'in-progress' }, expected: { allowed: true } },

  // → completed : TOUJOURS bloqué en kanban (passe par la modale)
  { name: '❌ in-progress → completed (kanban bloqué)', ctx: { status: 'in-progress', billingStatus: 'progress', prixFacturé: 1500 }, action: { type: 'transition', newStatus: 'completed' }, expected: { allowed: false, reason: 'modale' } },
  { name: '❌ in-progress → completed même soldé (kanban bloqué)', ctx: { status: 'in-progress', billingStatus: 'balance', prixFacturé: 1500 }, action: { type: 'transition', newStatus: 'completed' }, expected: { allowed: false, reason: 'modale' } },
  { name: '❌ to_quote → completed (kanban bloqué)', ctx: { status: 'to_quote', billingStatus: 'pending' }, action: { type: 'transition', newStatus: 'completed' }, expected: { allowed: false, reason: 'modale' } },

  // completed → autre : TOUJOURS bloqué en kanban (passe par la modale)
  { name: '❌ completed → in-progress (kanban bloqué)', ctx: { status: 'completed', billingStatus: 'balance', prixFacturé: 1500 }, action: { type: 'transition', newStatus: 'in-progress' }, expected: { allowed: false, reason: 'modale' } },
  { name: '❌ completed → pending (kanban bloqué)', ctx: { status: 'completed', billingStatus: 'balance', prixFacturé: 1500 }, action: { type: 'transition', newStatus: 'pending' }, expected: { allowed: false, reason: 'modale' } },

  // Même statut
  { name: '✅ pending → pending (no-op)', ctx: { status: 'pending', billingStatus: 'pending', prixFacturé: 1500 }, action: { type: 'transition', newStatus: 'pending' }, expected: { allowed: true } },

  // ── Cascades modale ──

  // Prix ajouté depuis to_quote
  { name: '🔄 cascade: prix ajouté depuis to_quote → pending', ctx: { status: 'to_quote', billingStatus: 'pending' }, action: { type: 'cascade', newBilling: 'pending', newPrix: 2000 }, expected: { newStatus: 'pending' } },

  // Prix ajouté depuis pending (pas de changement)
  { name: '🔄 cascade: prix ajouté depuis pending → pas de changement', ctx: { status: 'pending', billingStatus: 'pending' }, action: { type: 'cascade', newBilling: 'pending', newPrix: 2000 }, expected: { newStatus: undefined } },

  // Billing soldé
  { name: '🔄 cascade: billing soldé depuis pending → completed', ctx: { status: 'pending', billingStatus: 'pending', prixFacturé: 1500 }, action: { type: 'cascade', newBilling: 'balance', newPrix: 1500 }, expected: { newStatus: 'completed' } },
  { name: '🔄 cascade: billing soldé depuis in-progress → completed', ctx: { status: 'in-progress', billingStatus: 'progress', prixFacturé: 1500 }, action: { type: 'cascade', newBilling: 'balance', newPrix: 1500 }, expected: { newStatus: 'completed' } },
  { name: '🔄 cascade: billing soldé depuis completed → pas de changement', ctx: { status: 'completed', billingStatus: 'balance', prixFacturé: 1500 }, action: { type: 'cascade', newBilling: 'balance', newPrix: 1500 }, expected: { newStatus: undefined } },

  // Billing dé-soldé
  { name: '🔄 cascade: billing dé-soldé depuis completed → in-progress', ctx: { status: 'completed', billingStatus: 'balance', prixFacturé: 1500 }, action: { type: 'cascade', newBilling: 'progress', newPrix: 1500 }, expected: { newStatus: 'in-progress' } },
  { name: '🔄 cascade: billing dé-soldé depuis pending → pas de changement', ctx: { status: 'pending', billingStatus: 'pending', prixFacturé: 1500 }, action: { type: 'cascade', newBilling: 'progress', newPrix: 1500 }, expected: { newStatus: undefined } },

  // ── Scénarios modale produit (parcours utilisateur complet) ──

  // Scénario 1 : Création → le produit naît en to_quote, pas de prix, pas de billing
  { name: '📋 modale: création sans prix → reste to_quote', ctx: { status: 'to_quote', billingStatus: 'pending' }, action: { type: 'cascade', newBilling: 'pending', newPrix: undefined }, expected: { newStatus: undefined } },

  // Scénario 2 : Édition to_quote → on ajoute un devis (prix) → passe à pending
  { name: '📋 modale: to_quote + ajout devis 3000€ → pending', ctx: { status: 'to_quote', billingStatus: 'pending' }, action: { type: 'cascade', newBilling: 'pending', newPrix: 3000 }, expected: { newStatus: 'pending' } },

  // Scénario 3 : Édition pending → on ajoute un acompte (billing deposit) → reste pending
  { name: '📋 modale: pending + acompte → reste pending', ctx: { status: 'pending', billingStatus: 'pending', prixFacturé: 3000 }, action: { type: 'cascade', newBilling: 'deposit', newPrix: 3000 }, expected: { newStatus: undefined } },

  // Scénario 4 : Édition pending → on solde directement → completed
  { name: '📋 modale: pending + solde direct → completed', ctx: { status: 'pending', billingStatus: 'pending', prixFacturé: 3000 }, action: { type: 'cascade', newBilling: 'balance', newPrix: 3000 }, expected: { newStatus: 'completed' } },

  // Scénario 5 : Édition in-progress → on ajoute avancement (billing progress) → reste in-progress
  { name: '📋 modale: in-progress + avancement → reste in-progress', ctx: { status: 'in-progress', billingStatus: 'deposit', prixFacturé: 3000 }, action: { type: 'cascade', newBilling: 'progress', newPrix: 3000 }, expected: { newStatus: undefined } },

  // Scénario 6 : Édition in-progress → on solde → completed
  { name: '📋 modale: in-progress + solde → completed', ctx: { status: 'in-progress', billingStatus: 'progress', prixFacturé: 3000 }, action: { type: 'cascade', newBilling: 'balance', newPrix: 3000 }, expected: { newStatus: 'completed' } },

  // Scénario 7 : Édition completed → on retire le solde (erreur de saisie) → retour in-progress
  { name: '📋 modale: completed + retrait solde → in-progress', ctx: { status: 'completed', billingStatus: 'balance', prixFacturé: 3000 }, action: { type: 'cascade', newBilling: 'deposit', newPrix: 3000 }, expected: { newStatus: 'in-progress' } },

  // Scénario 8 : Édition to_quote → on ajoute prix ET solde en même temps → completed (cascade double)
  { name: '📋 modale: to_quote + prix + solde simultané → completed', ctx: { status: 'to_quote', billingStatus: 'pending' }, action: { type: 'cascade', newBilling: 'balance', newPrix: 5000 }, expected: { newStatus: 'completed' } },

  // Scénario 9 : Édition completed → on ne touche à rien → pas de changement
  { name: '📋 modale: completed sans modif → pas de changement', ctx: { status: 'completed', billingStatus: 'balance', prixFacturé: 3000 }, action: { type: 'cascade', newBilling: 'balance', newPrix: 3000 }, expected: { newStatus: undefined } },

  // Scénario 10 : Édition to_quote → on supprime le prix (vide) → reste to_quote
  { name: '📋 modale: to_quote + prix vide → reste to_quote', ctx: { status: 'to_quote', billingStatus: 'pending' }, action: { type: 'cascade', newBilling: 'pending', newPrix: 0 }, expected: { newStatus: undefined } },

  // Scénario 11 : Édition pending → on supprime le devis (champ vidé) → repasse à to_quote
  { name: '📋 modale: pending + devis supprimé → to_quote', ctx: { status: 'pending', billingStatus: 'pending', prixFacturé: 2000 }, action: { type: 'cascade', newBilling: 'pending', newPrix: undefined }, expected: { newStatus: 'to_quote' } },
];

/** Exécute tous les tests et retourne les résultats */
export function runAllTests(): { passed: number; failed: number; results: { name: string; pass: boolean; detail?: string }[] } {
  const results: { name: string; pass: boolean; detail?: string }[] = [];

  for (const tc of ALL_TEST_CASES) {
    if (tc.action.type === 'transition') {
      const result = canTransitionStatus(tc.ctx, tc.action.newStatus);
      
      if (tc.expected.allowed !== undefined) {
        const pass = result.allowed === tc.expected.allowed;
        const reasonMatch = !tc.expected.reason || (
          !result.allowed && result.reason.toLowerCase().includes(tc.expected.reason.toLowerCase())
        );
        
        results.push({
          name: tc.name,
          pass: pass && reasonMatch,
          detail: !pass 
            ? `expected allowed=${tc.expected.allowed}, got ${result.allowed}` 
            : !reasonMatch 
              ? `reason mismatch: expected "${tc.expected.reason}", got "${!result.allowed ? result.reason : 'none'}"` 
              : undefined,
        });
      }
    } else if (tc.action.type === 'cascade') {
      const cascade = computeStatusCascade(tc.ctx.status, tc.action.newBilling, tc.action.newPrix);
      const newStatus = cascade.status;
      const pass = newStatus === tc.expected.newStatus;
      
      results.push({
        name: tc.name,
        pass,
        detail: !pass ? `expected status=${tc.expected.newStatus ?? 'unchanged'}, got ${newStatus ?? 'unchanged'}` : undefined,
      });
    }
  }

  return {
    passed: results.filter(r => r.pass).length,
    failed: results.filter(r => !r.pass).length,
    results,
  };
}

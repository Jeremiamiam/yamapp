import type { Project, Deliverable, ProjectBillingInfo, ProjectBillingStatus } from '@/types';

/**
 * Calcule le statut de facturation et les montants dérivés d'un projet.
 *
 * Logique :
 * - totalProductInvoiced : somme des totalInvoiced des deliverables facturés individuellement
 * - totalProjectPayments : deposit + sum(progressAmounts)
 * - totalPaid : totalProjectPayments + totalProductInvoiced
 * - remaining : quoteAmount - totalPaid
 *
 * Le statut est dérivé, jamais stocké en base.
 */
export function computeProjectBilling(
  project: Project,
  deliverables: Deliverable[]
): ProjectBillingInfo {
  // Pas de devis global → pas de facturation projet
  if (!project.quoteAmount || project.quoteAmount <= 0) {
    return {
      status: 'none',
      totalProductInvoiced: 0,
      totalProjectPayments: 0,
      totalPaid: 0,
      remaining: 0,
      progressPercent: 0,
    };
  }

  const projectDeliverables = deliverables.filter(
    (d) => d.projectId === project.id
  );

  const totalProductInvoiced = projectDeliverables.reduce(
    (sum, d) => sum + (d.totalInvoiced || 0),
    0
  );

  const depositTotal = project.depositAmount || 0;
  const progressTotal = (project.progressAmounts || []).reduce(
    (sum, a) => sum + a,
    0
  );
  const totalProjectPayments = depositTotal + progressTotal;

  const totalPaid = totalProjectPayments + totalProductInvoiced;
  const remaining = Math.max(0, project.quoteAmount - totalPaid);
  const progressPercent =
    project.quoteAmount > 0
      ? Math.min(100, Math.round((totalPaid / project.quoteAmount) * 100))
      : 0;

  let status: ProjectBillingStatus;

  if (remaining <= 0.01) {
    status = 'balanced';
  } else if (totalPaid > 0 && depositTotal > 0 && progressTotal > 0) {
    status = 'progress';
  } else if (totalPaid > 0 && depositTotal > 0) {
    status = 'deposit';
  } else if (totalProductInvoiced > 0 || progressTotal > 0) {
    status = 'progress';
  } else {
    status = 'quoted';
  }

  return {
    status,
    totalProductInvoiced,
    totalProjectPayments,
    totalPaid,
    remaining,
    progressPercent,
  };
}

/**
 * Formate un montant en euros.
 */
export function formatEuro(amount: number): string {
  return amount.toLocaleString('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }) + ' €';
}

/**
 * Labels pour les statuts de facturation projet.
 */
export const PROJECT_BILLING_LABELS: Record<ProjectBillingStatus, string> = {
  none: 'Pas de devis',
  quoted: 'Devisé',
  deposit: 'Acompte',
  progress: 'En cours',
  balanced: 'Soldé',
};

export const PROJECT_BILLING_COLORS: Record<ProjectBillingStatus, { bg: string; text: string }> = {
  none: { bg: 'bg-[var(--bg-secondary)]', text: 'text-[var(--text-muted)]' },
  quoted: { bg: 'bg-[var(--accent-cyan)]/10', text: 'text-[var(--accent-cyan)]' },
  deposit: { bg: 'bg-[var(--accent-amber)]/10', text: 'text-[var(--accent-amber)]' },
  progress: { bg: 'bg-[var(--accent-violet)]/10', text: 'text-[var(--accent-violet)]' },
  balanced: { bg: 'bg-[var(--accent-lime)]/10', text: 'text-[var(--accent-lime)]' },
};

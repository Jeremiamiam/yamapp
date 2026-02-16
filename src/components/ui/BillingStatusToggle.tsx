'use client';

import { BillingStatus } from '@/types';

interface BillingStatusToggleProps {
  value: BillingStatus;
  onChange: (status: BillingStatus) => void;
  disabled?: boolean;
  depositAmount?: string;
  progressAmount?: string;
  balanceAmount?: string;
  onValidationError?: (message: string) => void;
}

const STATUS_CONFIG: Record<BillingStatus, { label: string; color: string; emoji: string }> = {
  'pending': { label: 'En attente', color: 'var(--text-muted)', emoji: '⏳' },
  'deposit': { label: 'Acompte', color: 'var(--accent-cyan)', emoji: '💰' },
  'progress': { label: 'Avancement', color: 'var(--accent-lime)', emoji: '📈' },
  'balance': { label: 'Soldé', color: '#22c55e', emoji: '✅' },
};

const STATUS_ORDER: BillingStatus[] = ['pending', 'deposit', 'progress', 'balance'];

export function BillingStatusToggle({
  value,
  onChange,
  disabled = false,
  depositAmount,
  progressAmount,
  balanceAmount,
  onValidationError,
}: BillingStatusToggleProps) {
  const handleStatusChange = (status: BillingStatus) => {
    // Validation: check if required amount is filled
    if (status === 'deposit' && !depositAmount?.trim()) {
      onValidationError?.('Veuillez renseigner le montant de l\'acompte');
      return;
    }
    if (status === 'progress' && !progressAmount?.trim()) {
      onValidationError?.('Veuillez renseigner le montant de l\'avancement');
      return;
    }
    if (status === 'balance' && !balanceAmount?.trim()) {
      onValidationError?.('Veuillez renseigner le montant du solde');
      return;
    }

    onChange(status);
  };

  return (
    <div
      role="group"
      aria-label="Statut de facturation"
      className="grid grid-cols-2 gap-2"
    >
      {STATUS_ORDER.map((status) => {
        const config = STATUS_CONFIG[status];
        const isActive = value === status;

        // Determine if button should show warning (amount required but not filled)
        const needsAmount =
          (status === 'deposit' && !depositAmount?.trim()) ||
          (status === 'progress' && !progressAmount?.trim()) ||
          (status === 'balance' && !balanceAmount?.trim());

        return (
          <button
            key={status}
            type="button"
            disabled={disabled}
            onClick={() => handleStatusChange(status)}
            className={`
              px-3 py-2.5 text-xs font-semibold rounded-lg transition-all
              border-2 relative
              ${isActive
                ? 'border-[var(--accent-lime)] bg-[var(--accent-lime)]/10 text-[var(--text-primary)] shadow-sm'
                : needsAmount
                  ? 'border-amber-500/30 bg-amber-500/5 text-[var(--text-muted)] hover:border-amber-500/50'
                  : 'border-[var(--border-subtle)] bg-[var(--bg-secondary)]/60 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--border-primary)]'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
            style={isActive ? { color: config.color } : undefined}
            title={needsAmount && !isActive ? 'Montant requis' : undefined}
          >
            <span className="mr-1">{config.emoji}</span>
            {config.label}
            {needsAmount && !isActive && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-500 rounded-full" />
            )}
          </button>
        );
      })}
    </div>
  );
}

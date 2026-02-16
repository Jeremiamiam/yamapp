'use client';

import { useState, useEffect, useRef } from 'react';

interface BillingFormData {
  devis?: number;
  acompte?: number;
  avancements?: number[];
  solde?: number;
  sousTraitance?: number;
  stHorsFacture?: boolean;
}

interface BillingFormProps {
  value: BillingFormData;
  onChange: (data: BillingFormData) => void;
  disabled?: boolean;
}

type SimpleFieldName = 'devis' | 'acompte' | 'sousTraitance';

interface FieldState {
  amount: string;
  validated: boolean;
  error?: string;
}

interface AvancementState {
  id: string;
  amount: string;
  validated: boolean;
  error?: string;
}

export function BillingForm({ value, onChange, disabled = false }: BillingFormProps) {
  const [fields, setFields] = useState<Record<SimpleFieldName, FieldState>>({
    devis: { amount: '', validated: false },
    acompte: { amount: '', validated: false },
    sousTraitance: { amount: '', validated: false },
  });

  const [avancements, setAvancements] = useState<AvancementState[]>([]);
  const [soldeValidated, setSoldeValidated] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [stHorsFacture, setStHorsFacture] = useState(false);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const isUpdatingFromParent = useRef(false);

  // Initialize from props - only update if values actually changed (not just reference)
  useEffect(() => {
    // Don't reinitialize if user is currently editing a field
    if (focusedField) return;

    // Only update if the actual values changed
    const shouldUpdateDevis = value.devis !== parseAmount(fields.devis.amount);
    const shouldUpdateAcompte = value.acompte !== parseAmount(fields.acompte.amount);
    const shouldUpdateST = value.sousTraitance !== parseAmount(fields.sousTraitance.amount);

    if (shouldUpdateDevis || shouldUpdateAcompte || shouldUpdateST) {
      isUpdatingFromParent.current = true;
      setFields({
        devis: {
          amount: value.devis != null ? String(value.devis) : '',
          validated: value.devis != null,
        },
        acompte: {
          amount: value.acompte != null ? String(value.acompte) : '',
          validated: value.acompte != null,
        },
        sousTraitance: {
          amount: value.sousTraitance != null ? String(value.sousTraitance) : '',
          validated: value.sousTraitance != null,
        },
      });
    }

    // Update avancements if they changed
    const currentAvancementsValues = avancements
      .filter(av => av.validated)
      .map(av => parseAmount(av.amount))
      .filter((v): v is number => v != null);
    const newAvancementsValues = value.avancements || [];
    const avancementsChanged = JSON.stringify(currentAvancementsValues) !== JSON.stringify(newAvancementsValues);

    if (avancementsChanged) {
      if (value.avancements && value.avancements.length > 0) {
        setAvancements(
          value.avancements.map((amount, idx) => ({
            id: `av-${idx}`,
            amount: String(amount),
            validated: true,
          }))
        );
      } else {
        setAvancements([]);
      }
    }

    setSoldeValidated(value.solde != null && value.solde > 0);
    setStHorsFacture(value.stHorsFacture || false);

    // Reset flag after state updates
    setTimeout(() => {
      isUpdatingFromParent.current = false;
    }, 0);
  }, [value, focusedField]); // Update when value changes, but not if editing

  // Auto-update parent when internal state changes
  useEffect(() => {
    // Don't update while user is typing or while updating from parent
    if (focusedField || isUpdatingFromParent.current) return;

    const data: BillingFormData = { stHorsFacture };

    // Simple fields
    (['devis', 'acompte', 'sousTraitance'] as SimpleFieldName[]).forEach((key) => {
      if (fields[key].validated && !fields[key].error && fields[key].amount.trim()) {
        const parsed = parseAmount(fields[key].amount);
        if (parsed != null) {
          data[key] = parsed;
        }
      }
    });

    // Avancements
    const validAvancements = avancements
      .filter((av) => av.validated && !av.error && av.amount.trim())
      .map((av) => parseAmount(av.amount))
      .filter((v): v is number => v != null);

    if (validAvancements.length > 0) {
      data.avancements = validAvancements;
    }

    // Solde
    if (soldeValidated) {
      const devisAmount = parseAmount(fields.devis.amount) || 0;
      const acompteAmount = fields.acompte.validated ? parseAmount(fields.acompte.amount) || 0 : 0;
      const avancementsTotal = validAvancements.reduce((sum, v) => sum + v, 0);
      const soldeCalcule = devisAmount - acompteAmount - avancementsTotal;
      if (soldeCalcule > 0) {
        data.solde = soldeCalcule;
      }
    }

    onChange(data);
  }, [fields, avancements, soldeValidated, stHorsFacture, focusedField, onChange]);

  const parseAmount = (str: string): number | undefined => {
    const cleaned = str.trim().replace(/\s/g, '').replace(',', '.');
    const num = parseFloat(cleaned);
    return cleaned !== '' && !Number.isNaN(num) && num >= 0 ? num : undefined;
  };

  const validateField = (field: SimpleFieldName, amount: string): string | undefined => {
    const parsed = parseAmount(amount);

    if (amount.trim() && parsed == null) {
      return 'Montant invalide';
    }

    if (parsed != null && parsed < 0) {
      return 'Le montant ne peut pas être négatif';
    }

    const devisAmount = field === 'devis' ? parsed : parseAmount(fields.devis.amount);

    if (!devisAmount && field === 'acompte') {
      return 'Devis requis';
    }

    // Check if total would exceed devis
    if (devisAmount && field === 'acompte' && parsed != null) {
      const avancementsTotal = avancements
        .filter(av => av.validated)
        .reduce((sum, av) => sum + (parseAmount(av.amount) || 0), 0);
      const potentialTotal = parsed + avancementsTotal;

      if (potentialTotal > devisAmount) {
        return 'Total > Devis';
      }
    }

    return undefined;
  };

  const updateData = (overrideStHorsFacture?: boolean) => {
    const data: BillingFormData = {
      stHorsFacture: overrideStHorsFacture !== undefined ? overrideStHorsFacture : stHorsFacture
    };

    // Simple fields
    (['devis', 'acompte', 'sousTraitance'] as SimpleFieldName[]).forEach((key) => {
      if (fields[key].validated && !fields[key].error && fields[key].amount.trim()) {
        const parsed = parseAmount(fields[key].amount);
        if (parsed != null) {
          data[key] = parsed;
        }
      }
    });

    // Avancements
    const validAvancements = avancements
      .filter((av) => av.validated && !av.error && av.amount.trim())
      .map((av) => parseAmount(av.amount))
      .filter((v): v is number => v != null);

    if (validAvancements.length > 0) {
      data.avancements = validAvancements;
    }

    // Solde
    if (soldeValidated) {
      const devisAmount = parseAmount(fields.devis.amount) || 0;
      const acompteAmount = fields.acompte.validated ? parseAmount(fields.acompte.amount) || 0 : 0;
      const avancementsTotal = validAvancements.reduce((sum, v) => sum + v, 0);
      const soldeCalcule = devisAmount - acompteAmount - avancementsTotal;
      if (soldeCalcule > 0) {
        data.solde = soldeCalcule;
      }
    }

    onChange(data);
  };

  const handleInputChange = (field: SimpleFieldName, value: string) => {
    const error = validateField(field, value);
    setFields((prev) => ({
      ...prev,
      [field]: { ...prev[field], amount: value, error },
    }));
  };

  const handleBlur = (field: SimpleFieldName) => {
    const amount = fields[field].amount.trim();
    if (amount === '') {
      setFields((prev) => ({
        ...prev,
        [field]: { amount: '', validated: false, error: undefined },
      }));
    } else {
      const error = validateField(field, amount);
      setFields((prev) => ({
        ...prev,
        [field]: { ...prev[field], validated: !error, error },
      }));
    }
    setFocusedField(null);
    // updateData will be called automatically by useEffect
  };

  const handle30Percent = () => {
    const devisAmount = parseAmount(fields.devis.amount);
    if (devisAmount != null) {
      const acompte = Math.round(devisAmount * 0.3);
      handleInputChange('acompte', String(acompte));
      setFocusedField('acompte');
      setTimeout(() => {
        inputRefs.current.acompte?.focus();
      }, 0);
    }
  };

  const addAvancement = () => {
    setAvancements((prev) => [
      ...prev,
      { id: `av-${Date.now()}`, amount: '', validated: false },
    ]);
  };

  const removeAvancement = (id: string) => {
    setAvancements((prev) => prev.filter((av) => av.id !== id));
    // updateData will be called automatically by useEffect
  };

  const handleAvancementChange = (id: string, value: string) => {
    setAvancements((prev) =>
      prev.map((av) => (av.id === id ? { ...av, amount: value, error: undefined } : av))
    );
  };

  const handleAvancementBlur = (id: string) => {
    setAvancements((prev) => {
      const updated = prev.map((av) => {
        if (av.id === id) {
          const amount = av.amount.trim();
          if (amount === '') {
            return { ...av, amount: '', validated: false, error: undefined };
          }
          const parsed = parseAmount(amount);
          if (parsed == null) {
            return { ...av, validated: false, error: 'Montant invalide' };
          }
          return { ...av, amount, validated: true, error: undefined };
        }
        return av;
      });

      // Validate total doesn't exceed devis
      const devisAmount = parseAmount(fields.devis.amount) || 0;
      const acompteAmount = fields.acompte.validated ? parseAmount(fields.acompte.amount) || 0 : 0;
      const avancementsTotal = updated
        .filter(av => av.validated)
        .reduce((sum, av) => sum + (parseAmount(av.amount) || 0), 0);
      const total = acompteAmount + avancementsTotal;

      if (devisAmount > 0 && total > devisAmount) {
        return updated.map((av) => {
          if (av.id === id && av.validated) {
            return { ...av, error: 'Total > Devis' };
          }
          return av;
        });
      }

      return updated;
    });
    setFocusedField(null);
    // updateData will be called automatically by useEffect
  };

  const handleToggleSolde = () => {
    const newValidated = !soldeValidated;
    setSoldeValidated(newValidated);
    // updateData will be called automatically by useEffect
  };

  // Calculate totals
  const devisAmount = parseAmount(fields.devis.amount) || 0;
  const acompteAmount = fields.acompte.validated ? parseAmount(fields.acompte.amount) || 0 : 0;
  const avancementsTotal = avancements
    .filter((av) => av.validated)
    .reduce((sum, av) => sum + (parseAmount(av.amount) || 0), 0);
  const soldeCalcule = devisAmount - acompteAmount - avancementsTotal;
  const totalFacture = acompteAmount + avancementsTotal + (soldeValidated ? soldeCalcule : 0);
  const totalST = fields.sousTraitance.validated ? parseAmount(fields.sousTraitance.amount) || 0 : 0;
  const marge = stHorsFacture ? totalFacture : totalFacture - totalST;

  const renderField = (field: SimpleFieldName, label: string) => {
    const isFocused = focusedField === field;
    const { amount, validated, error } = fields[field];
    const showThirtyButton = field === 'acompte' && fields.devis.validated && !fields.devis.error && !validated;

    const getInputStyle = () => {
      if (error) return 'bg-red-500/10 border-2 border-red-500 text-[var(--text-primary)]';
      if (validated && !isFocused) return 'bg-[#22c55e]/10 border-2 border-[#22c55e] text-[var(--text-primary)]';
      if (isFocused) return 'bg-[var(--bg-secondary)] border-2 border-[var(--accent-cyan)] text-[var(--text-primary)]';
      return 'bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] hover:border-[var(--accent-cyan)]';
    };

    return (
      <div>
        <div className="flex items-center gap-4 p-4">
          <div className="text-sm font-bold uppercase tracking-wider flex-shrink-0 text-[var(--text-primary)]" style={{ width: '140px' }}>
            {label}
          </div>
          <div className="flex-1 relative">
            <input
              ref={(el) => { inputRefs.current[field] = el; }}
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => handleInputChange(field, e.target.value)}
              onBlur={() => handleBlur(field)}
              onFocus={() => setFocusedField(field)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleBlur(field);
                }
              }}
              disabled={disabled}
              placeholder="0"
              className={`w-full px-4 py-3 rounded-lg text-base font-medium transition-all ${getInputStyle()} ${
                showThirtyButton ? 'pr-16' : ''
              }`}
            />
            {showThirtyButton && (
              <button
                type="button"
                onClick={handle30Percent}
                className="absolute right-12 top-1/2 -translate-y-1/2 px-2.5 py-1 text-xs font-bold rounded-md bg-[var(--accent-cyan)]/20 text-[var(--accent-cyan)] hover:bg-[var(--accent-cyan)]/30 transition-colors"
              >
                30%
              </button>
            )}
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-sm pointer-events-none">€</span>
          </div>
        </div>
        {error && (
          <div className="px-4 pb-2">
            <p className="text-xs text-red-500 ml-[156px] flex items-center gap-1.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-1">
      <h3 className="text-sm font-semibold text-[var(--text-muted)] mb-3 flex items-center gap-2">
        💰 Statut de facturation
      </h3>

      <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-subtle)] overflow-hidden divide-y divide-[var(--border-subtle)]">
        {renderField('devis', 'DEVIS')}
        {renderField('acompte', 'ACOMPTE')}

        {/* Avancements */}
        {avancements.map((av, idx) => (
          <div key={av.id}>
            <div className="flex items-center gap-4 p-4">
              <div className="text-sm font-bold uppercase tracking-wider flex-shrink-0 text-[var(--text-muted)]" style={{ width: '140px' }}>
                AVANCEMENT {idx + 1}
              </div>
              <div className="flex-1 relative">
                <input
                  ref={(el) => { inputRefs.current[av.id] = el; }}
                  type="text"
                  inputMode="decimal"
                  value={av.amount}
                  onChange={(e) => handleAvancementChange(av.id, e.target.value)}
                  onBlur={() => handleAvancementBlur(av.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAvancementBlur(av.id);
                    }
                  }}
                  placeholder="0"
                  className={`w-full px-4 py-3 rounded-lg text-base font-medium transition-all ${
                    av.validated ? 'bg-[#22c55e]/10 border-2 border-[#22c55e]' : 'bg-[var(--bg-secondary)] border border-[var(--border-subtle)]'
                  }`}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-sm pointer-events-none">€</span>
              </div>
              <button
                type="button"
                onClick={() => removeAvancement(av.id)}
                className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          </div>
        ))}

        {/* Bouton ajouter avancement */}
        {fields.devis.validated && (
          <div className="p-3">
            <button
              type="button"
              onClick={addAvancement}
              className="w-full py-2 rounded-lg border-2 border-dashed border-[var(--border-subtle)] text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--accent-cyan)] hover:bg-[var(--accent-cyan)]/5 transition-colors"
            >
              + Ajouter un avancement
            </button>
          </div>
        )}

        {/* Solde calculé */}
        <div className={soldeCalcule <= 0 ? 'opacity-40' : ''}>
          <div className="flex items-center gap-4 p-4">
            <div className="text-sm font-bold uppercase tracking-wider flex-shrink-0 text-[var(--text-primary)]" style={{ width: '140px' }}>
              SOLDE
            </div>
            <div className="flex-1 relative">
              <div className={`w-full px-4 py-3 rounded-lg text-base font-medium transition-all ${
                soldeValidated ? 'bg-[#22c55e]/10 border-2 border-[#22c55e]' : 'bg-[var(--bg-secondary)] border border-[var(--border-subtle)]'
              }`}>
                {soldeCalcule > 0 ? soldeCalcule.toFixed(0) : '0'}
              </div>
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-sm pointer-events-none">€</span>
            </div>
            <button
              type="button"
              onClick={handleToggleSolde}
              disabled={soldeCalcule <= 0}
              className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                soldeValidated
                  ? 'bg-[#22c55e] text-white shadow-md hover:scale-105'
                  : soldeCalcule > 0
                  ? 'bg-[var(--accent-cyan)]/20 text-[var(--accent-cyan)] hover:bg-[var(--accent-cyan)]/30'
                  : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)] cursor-not-allowed'
              }`}
            >
              {soldeValidated ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                </svg>
              )}
            </button>
          </div>
          {soldeCalcule > 0 && !soldeValidated && (
            <div className="px-4 pb-2">
              <p className="text-xs text-[var(--text-muted)] ml-[156px]">Auto-calculé • Cliquez pour valider</p>
            </div>
          )}
        </div>

        {renderField('sousTraitance', 'S-T')}

        {/* Toggle ST compact */}
        {fields.sousTraitance.validated && (
          <div className="px-4 py-3 bg-[var(--bg-secondary)]/20 flex items-center justify-between">
            <span className="text-xs text-[var(--text-muted)]">Mode S-T</span>
            <button
              type="button"
              onClick={() => {
                setStHorsFacture(!stHorsFacture);
                // updateData will be called automatically by useEffect
              }}
              className="flex items-center gap-2 text-xs font-medium"
            >
              <div className={`w-8 h-5 rounded-full transition-colors relative ${
                stHorsFacture ? 'bg-[var(--accent-lime)]' : 'bg-red-500'
              }`}>
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                  stHorsFacture ? 'translate-x-3.5' : 'translate-x-0.5'
                }`} />
              </div>
              <span className={stHorsFacture ? 'text-[var(--accent-lime)]' : 'text-red-500'}>
                {stHorsFacture ? 'Hors marge' : 'Déduit'}
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Marge */}
      {devisAmount > 0 && (
        <>
          {totalFacture > devisAmount ? (
            <div className="mt-4 p-4 rounded-xl bg-red-500/10 border-2 border-red-500">
              <div className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <span className="text-sm font-bold text-red-500">TOTAL FACTURÉ DÉPASSE LE DEVIS</span>
              </div>
              <p className="text-xs text-red-500 mt-2">
                Facturé : {totalFacture}€ / Devis : {devisAmount}€ (Excédent : {(totalFacture - devisAmount).toFixed(0)}€)
              </p>
            </div>
          ) : (
            <div className="mt-4 p-4 rounded-xl bg-[#22c55e]/10 border-2 border-[#22c55e]/30">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold uppercase tracking-wider text-[#22c55e]">MARGE</span>
                <span className="text-lg font-bold text-[#22c55e]">{marge.toFixed(0)} €</span>
              </div>
              {totalFacture > 0 && (
                <p className="text-xs text-[var(--text-muted)] mt-2">
                  Facturé : {totalFacture}€ / {devisAmount}€ ({((totalFacture / devisAmount) * 100).toFixed(0)}%)
                </p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

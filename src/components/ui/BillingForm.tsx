'use client';

import { useState, useEffect, useRef } from 'react';

interface BillingFormData {
  devis?: number;
  devisDate?: string; // ISO date string YYYY-MM-DD
  acompte?: number;
  acompteDate?: string;
  avancements?: number[];
  avancementsDate?: string[]; // One date per avancement
  solde?: number;
  soldeDate?: string;
  sousTraitance?: number;
  stHorsFacture?: boolean;
  margePotentielle?: number;
}

interface BillingFormProps {
  value: BillingFormData;
  onChange: (data: BillingFormData) => void;
  disabled?: boolean;
}

type SimpleFieldName = 'devis' | 'acompte' | 'sousTraitance';

interface FieldState {
  amount: string;
  date: string; // YYYY-MM-DD format
  validated: boolean;
  error?: string;
}

interface AvancementState {
  id: string;
  amount: string;
  date: string;
  validated: boolean;
  error?: string;
}

// Get today's date in YYYY-MM-DD format
const getTodayDate = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

export function BillingForm({ value, onChange, disabled = false }: BillingFormProps) {
  const [fields, setFields] = useState<Record<SimpleFieldName, FieldState>>({
    devis: { amount: '', date: getTodayDate(), validated: false },
    acompte: { amount: '', date: getTodayDate(), validated: false },
    sousTraitance: { amount: '', date: getTodayDate(), validated: false },
  });

  const [avancements, setAvancements] = useState<AvancementState[]>([]);
  const [soldeValidated, setSoldeValidated] = useState(false);
  const [soldeDate, setSoldeDate] = useState(getTodayDate());
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [stHorsFacture, setStHorsFacture] = useState(false);
  const [margePotentielle, setMargePotentielle] = useState('');
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const focusedFieldRef = useRef<string | null>(null);
  const isUpdatingFromParent = useRef(false);
  const isLocalUpdate = useRef(false);

  // Keep ref in sync
  focusedFieldRef.current = focusedField;

  // Initialize from props - ONLY when value changes (not on focus/blur)
  useEffect(() => {
    // Don't reinitialize if user is currently editing a field
    if (focusedFieldRef.current) return;

    // Skip reinit if the value change came from our own onChange call
    if (isLocalUpdate.current) {
      isLocalUpdate.current = false;
      return;
    }

    isUpdatingFromParent.current = true;
    setFields({
      devis: {
        amount: value.devis != null ? String(value.devis) : '',
        date: value.devisDate || getTodayDate(),
        validated: value.devis != null,
      },
      acompte: {
        amount: value.acompte != null ? String(value.acompte) : '',
        date: value.acompteDate || getTodayDate(),
        validated: value.acompte != null,
      },
      sousTraitance: {
        amount: value.sousTraitance != null ? String(value.sousTraitance) : '',
        date: getTodayDate(),
        validated: value.sousTraitance != null,
      },
    });

    if (value.avancements && value.avancements.length > 0) {
      setAvancements(
        value.avancements.map((amount, idx) => ({
          id: `av-${idx}`,
          amount: String(amount),
          date: value.avancementsDate?.[idx] || getTodayDate(),
          validated: true,
        }))
      );
    } else {
      setAvancements([]);
    }

    setSoldeValidated(value.solde != null && value.solde > 0);
    setSoldeDate(value.soldeDate || getTodayDate());
    setStHorsFacture(value.stHorsFacture || false);
    setMargePotentielle(value.margePotentielle != null ? String(value.margePotentielle) : '');

    setTimeout(() => {
      isUpdatingFromParent.current = false;
    }, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]); // ONLY re-init when parent value changes

  // Auto-update parent when internal state changes
  useEffect(() => {
    // Don't update while user is typing or while updating from parent
    if (focusedField || isUpdatingFromParent.current) return;

    const parsedMarge = parseAmount(margePotentielle);
    const data: BillingFormData = { stHorsFacture, margePotentielle: parsedMarge };

    // Simple fields with dates
    if (fields.devis.validated && !fields.devis.error && fields.devis.amount.trim()) {
      const parsed = parseAmount(fields.devis.amount);
      if (parsed != null) {
        data.devis = parsed;
        data.devisDate = fields.devis.date;
      }
    }

    if (fields.acompte.validated && !fields.acompte.error && fields.acompte.amount.trim()) {
      const parsed = parseAmount(fields.acompte.amount);
      if (parsed != null) {
        data.acompte = parsed;
        data.acompteDate = fields.acompte.date;
      }
    }

    if (fields.sousTraitance.validated && !fields.sousTraitance.error && fields.sousTraitance.amount.trim()) {
      const parsed = parseAmount(fields.sousTraitance.amount);
      if (parsed != null) {
        data.sousTraitance = parsed;
      }
    }

    // Avancements
    const validAvancements = avancements
      .filter((av) => av.validated && !av.error && av.amount.trim())
      .map((av) => parseAmount(av.amount))
      .filter((v): v is number => v != null);

    const validAvancementsDates = avancements
      .filter((av) => av.validated && !av.error && av.amount.trim())
      .map((av) => av.date);

    if (validAvancements.length > 0) {
      data.avancements = validAvancements;
      data.avancementsDate = validAvancementsDates;
    }

    // Solde
    if (soldeValidated) {
      const devisAmount = parseAmount(fields.devis.amount) || 0;
      const acompteAmount = fields.acompte.validated ? parseAmount(fields.acompte.amount) || 0 : 0;
      const avancementsTotal = validAvancements.reduce((sum, v) => sum + v, 0);
      const soldeCalcule = devisAmount - acompteAmount - avancementsTotal;
      if (soldeCalcule > 0) {
        data.solde = soldeCalcule;
        data.soldeDate = soldeDate;
      }
    }

    isLocalUpdate.current = true;
    onChange(data);
  }, [fields, avancements, soldeValidated, soldeDate, stHorsFacture, margePotentielle, focusedField, onChange]);

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
    const parsedMarge = parseAmount(margePotentielle);
    const data: BillingFormData = {
      stHorsFacture: overrideStHorsFacture !== undefined ? overrideStHorsFacture : stHorsFacture,
      margePotentielle: parsedMarge,
    };

    // Simple fields with dates
    if (fields.devis.validated && !fields.devis.error && fields.devis.amount.trim()) {
      const parsed = parseAmount(fields.devis.amount);
      if (parsed != null) {
        data.devis = parsed;
        data.devisDate = fields.devis.date;
      }
    }

    if (fields.acompte.validated && !fields.acompte.error && fields.acompte.amount.trim()) {
      const parsed = parseAmount(fields.acompte.amount);
      if (parsed != null) {
        data.acompte = parsed;
        data.acompteDate = fields.acompte.date;
      }
    }

    if (fields.sousTraitance.validated && !fields.sousTraitance.error && fields.sousTraitance.amount.trim()) {
      const parsed = parseAmount(fields.sousTraitance.amount);
      if (parsed != null) {
        data.sousTraitance = parsed;
      }
    }

    // Avancements
    const validAvancements = avancements
      .filter((av) => av.validated && !av.error && av.amount.trim())
      .map((av) => parseAmount(av.amount))
      .filter((v): v is number => v != null);

    const validAvancementsDates = avancements
      .filter((av) => av.validated && !av.error && av.amount.trim())
      .map((av) => av.date);

    if (validAvancements.length > 0) {
      data.avancements = validAvancements;
      data.avancementsDate = validAvancementsDates;
    }

    // Solde
    if (soldeValidated) {
      const devisAmount = parseAmount(fields.devis.amount) || 0;
      const acompteAmount = fields.acompte.validated ? parseAmount(fields.acompte.amount) || 0 : 0;
      const avancementsTotal = validAvancements.reduce((sum, v) => sum + v, 0);
      const soldeCalcule = devisAmount - acompteAmount - avancementsTotal;
      if (soldeCalcule > 0) {
        data.solde = soldeCalcule;
        data.soldeDate = soldeDate;
      }
    }

    isLocalUpdate.current = true;
    onChange(data);
  };

  const handleInputChange = (field: SimpleFieldName, value: string) => {
    const error = validateField(field, value);
    setFields((prev) => ({
      ...prev,
      [field]: { ...prev[field], amount: value, error },
    }));
  };

  const handleDateChange = (field: SimpleFieldName, date: string) => {
    setFields((prev) => ({
      ...prev,
      [field]: { ...prev[field], date },
    }));
  };

  const handleBlur = (field: SimpleFieldName) => {
    const amount = fields[field].amount.trim();
    if (amount === '') {
      setFields((prev) => ({
        ...prev,
        [field]: { ...prev[field], amount: '', validated: false, error: undefined },
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
      setFields((prev) => ({
        ...prev,
        acompte: { ...prev.acompte, amount: String(acompte), validated: true, error: undefined },
      }));
    }
  };

  const addAvancement = () => {
    setAvancements((prev) => [
      ...prev,
      { id: `av-${Date.now()}`, amount: '', date: getTodayDate(), validated: false },
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
    if (newValidated) {
      // Initialise la date à aujourd'hui si on vient juste de solder
      setSoldeDate(getTodayDate());
    }
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

  // Marge potentielle is only visible when no billing step is engaged
  const hasBillingProgress = fields.acompte.validated || avancements.some(av => av.validated) || soldeValidated;

  const renderField = (field: SimpleFieldName, label: string) => {
    const isFocused = focusedField === field;
    const { amount, date, validated, error } = fields[field];
    const showThirtyButton = field === 'acompte' && fields.devis.validated && !fields.devis.error && !validated;
    const showDate = field !== 'sousTraitance'; // Don't show date for sousTraitance

    const getInputStyle = () => {
      if (error) return 'bg-red-500/10 border-2 border-red-500 text-[var(--text-primary)]';
      if (validated && !isFocused) return 'bg-[#22c55e]/10 border-2 border-[#22c55e] text-[var(--text-primary)]';
      if (isFocused) return 'bg-[var(--bg-secondary)] border-2 border-[var(--accent-cyan)] text-[var(--text-primary)]';
      return 'bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] hover:border-[var(--accent-cyan)]';
    };

    return (
      <div className="flex items-center gap-2 px-3 py-2">
        <div className="text-xs font-bold uppercase tracking-wider flex-shrink-0 text-[var(--text-muted)] w-20">
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
            className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-all ${getInputStyle()} ${
              showThirtyButton ? 'pr-14' : ''
            }`}
          />
          {showThirtyButton && (
            <button
              type="button"
              onClick={handle30Percent}
              className="absolute right-10 top-1/2 -translate-y-1/2 px-2 py-0.5 text-[10px] font-bold rounded bg-[var(--accent-cyan)]/20 text-[var(--accent-cyan)] hover:bg-[var(--accent-cyan)]/30 transition-colors"
            >
              30%
            </button>
          )}
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-xs pointer-events-none">€</span>
        </div>

        {/* Date picker compact */}
        {showDate && (
          <input
            type="date"
            value={date}
            onChange={(e) => handleDateChange(field, e.target.value)}
            disabled={disabled}
            className="flex-shrink-0 w-28 px-2 py-1.5 rounded-lg text-xs border border-[var(--border-subtle)] bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:border-[var(--accent-cyan)] focus:border-[var(--accent-cyan)] focus:outline-none transition-colors"
          />
        )}
        
        {error && (
          <span className="text-[10px] text-red-500 flex-shrink-0">⚠</span>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold text-[var(--text-muted)] flex items-center gap-1.5">
        <span>💰</span> Statut de facturation
      </h3>

      {/* Marge potentielle Yam — visible uniquement quand aucun paiement engagé */}
      {!hasBillingProgress && (
        <div className="bg-[var(--accent-violet)]/5 rounded-lg border border-[var(--accent-violet)]/20 overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2">
            <div className="text-xs font-bold uppercase tracking-wider flex-shrink-0 text-[var(--accent-violet)] w-20">
              MARGE
            </div>
            <div className="flex-1 relative">
              <input
                type="text"
                inputMode="decimal"
                value={margePotentielle}
                onChange={(e) => setMargePotentielle(e.target.value)}
                onFocus={() => setFocusedField('margePotentielle')}
                onBlur={() => setFocusedField(null)}
                disabled={disabled}
                placeholder="Rentrée potentielle"
                className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  margePotentielle.trim()
                    ? 'bg-[var(--accent-violet)]/10 border-2 border-[var(--accent-violet)] text-[var(--text-primary)]'
                    : 'bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] hover:border-[var(--accent-violet)]'
                }`}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-xs pointer-events-none">€</span>
            </div>
          </div>
        </div>
      )}
      {hasBillingProgress && margePotentielle.trim() && (
        <div className="px-3 py-1.5 rounded-lg bg-[var(--accent-violet)]/5 border border-[var(--accent-violet)]/10 flex items-center justify-between">
          <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Rentrée potentielle initiale</span>
          <span className="text-xs text-[var(--accent-violet)] font-medium">{margePotentielle} €</span>
        </div>
      )}

      <div className="bg-[var(--bg-card)] rounded-lg border border-[var(--border-subtle)] overflow-hidden">
        {renderField('devis', 'DEVIS')}
        <div className="border-t border-[var(--border-subtle)]">
          {renderField('acompte', 'ACOMPTE')}
        </div>

        {/* Avancements - compact */}
        {avancements.map((av, idx) => (
          <div key={av.id} className="border-t border-[var(--border-subtle)] flex items-center gap-2 px-3 py-2">
            <div className="text-xs font-bold uppercase tracking-wider flex-shrink-0 text-[var(--text-muted)] w-20">
              AVA. {idx + 1}
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
                className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  av.validated ? 'bg-[#22c55e]/10 border-2 border-[#22c55e]' : 'bg-[var(--bg-secondary)] border border-[var(--border-subtle)]'
                }`}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-xs pointer-events-none">€</span>
            </div>
            <input
              type="date"
              value={av.date}
              onChange={(e) => {
                const newDate = e.target.value;
                setAvancements((prev) =>
                  prev.map((a) => (a.id === av.id ? { ...a, date: newDate } : a))
                );
              }}
              className="flex-shrink-0 w-28 px-2 py-1.5 rounded-lg text-xs border border-[var(--border-subtle)] bg-[var(--bg-secondary)] text-[var(--text-primary)]"
            />
            <button
              type="button"
              onClick={() => removeAvancement(av.id)}
              className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[var(--text-muted)] hover:text-red-500 transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        ))}

        {/* Bouton ajouter avancement - compact */}
        {fields.devis.validated && (
          <div className="border-t border-[var(--border-subtle)] px-3 py-2">
            <button
              type="button"
              onClick={addAvancement}
              className="w-full py-1.5 rounded-lg border border-dashed border-[var(--border-subtle)] text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--accent-cyan)] transition-colors"
            >
              + Avancement
            </button>
          </div>
        )}

        {/* Solde — état toggle */}
        <div className="border-t border-[var(--border-subtle)]">
          {soldeValidated ? (
            // État SOLDÉ
            <div className="bg-[#22c55e]/10">
              <div className="flex items-center gap-2 px-3 py-2">
                <div className="flex items-center gap-1.5 flex-1">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3" className="flex-shrink-0">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#22c55e]">Soldé</span>
                  <span className="text-sm font-semibold text-[#22c55e] ml-auto">{soldeCalcule > 0 ? soldeCalcule.toFixed(0) : '0'} €</span>
                </div>
                <button
                  type="button"
                  onClick={handleToggleSolde}
                  className="text-[10px] text-[var(--text-muted)] hover:text-red-400 transition-colors flex-shrink-0 cursor-pointer"
                >
                  Annuler
                </button>
              </div>
              {/* Date du solde — éditable */}
              <div className="flex items-center gap-2 px-3 pb-2">
                <span className="text-[10px] text-[#22c55e]/60 uppercase tracking-wider w-16 flex-shrink-0">Date</span>
                <input
                  type="date"
                  value={soldeDate}
                  onChange={(e) => setSoldeDate(e.target.value)}
                  className="text-[11px] text-[#22c55e]/80 bg-transparent border border-[#22c55e]/20 rounded px-2 py-0.5 focus:outline-none focus:border-[#22c55e]/50 cursor-pointer"
                />
              </div>
            </div>
          ) : (
            // État NON SOLDÉ — bouton d'action
            <div className="px-3 py-2">
              <button
                type="button"
                onClick={handleToggleSolde}
                disabled={soldeCalcule <= 0}
                className={`w-full py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                  soldeCalcule > 0
                    ? 'bg-[var(--bg-secondary)] border border-dashed border-[var(--accent-cyan)]/50 text-[var(--accent-cyan)] hover:bg-[var(--accent-cyan)]/10 hover:border-[var(--accent-cyan)] cursor-pointer'
                    : 'bg-[var(--bg-tertiary)]/50 border border-dashed border-[var(--border-subtle)] text-[var(--text-muted)]/40 cursor-not-allowed'
                }`}
              >
                {soldeCalcule > 0 ? `Solder · ${soldeCalcule.toFixed(0)} €` : 'Solde · 0 €'}
              </button>
            </div>
          )}
        </div>

        {/* S-T - compact */}
        <div className="border-t border-[var(--border-subtle)]">
          {renderField('sousTraitance', 'S-T')}
        </div>

        {/* Toggle ST - inline compact */}
        {fields.sousTraitance.validated && (
          <div className="border-t border-[var(--border-subtle)] px-3 py-2 flex items-center justify-end gap-2">
            <span className="text-[10px] text-[var(--text-muted)]">Mode</span>
            <button
              type="button"
              onClick={() => setStHorsFacture(!stHorsFacture)}
              className="flex items-center gap-1.5 text-[10px] font-medium"
            >
              <div className={`w-6 h-3.5 rounded-full transition-colors relative ${
                stHorsFacture ? 'bg-[var(--accent-lime)]' : 'bg-red-500'
              }`}>
                <div className={`absolute top-0.5 w-2.5 h-2.5 rounded-full bg-white shadow transition-transform ${
                  stHorsFacture ? 'translate-x-3' : 'translate-x-0.5'
                }`} />
              </div>
              <span className={stHorsFacture ? 'text-[var(--accent-lime)]' : 'text-red-500'}>
                {stHorsFacture ? 'Hors' : 'Déduit'}
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Marge - compact */}
      {devisAmount > 0 && (
        totalFacture > devisAmount ? (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/50">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-red-500">⚠ DÉPASSEMENT</span>
              <span className="text-xs text-red-500">+{(totalFacture - devisAmount).toFixed(0)}€</span>
            </div>
          </div>
        ) : (
          <div className="p-3 rounded-lg bg-[#22c55e]/10 border border-[#22c55e]/30">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#22c55e]">MARGE</span>
              <span className="text-base font-bold text-[#22c55e]">{marge.toFixed(0)} €</span>
            </div>
          </div>
        )
      )}
    </div>
  );
}

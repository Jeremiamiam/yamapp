'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal, FormField, Input, Textarea, Select, Button, BillingForm, ClientAutocomplete } from '@/components/ui';
import { useAppStore } from '@/lib/store';
import { useUserRole } from '@/hooks/useUserRole';
import { DeliverableSchema, type DeliverableFormData } from '@/lib/validation';
import { DeliverableType, DeliverableStatus, Deliverable } from '@/types';
import { formatDateForInput, formatTimeForInput } from '@/lib/date-utils';
import { computeStatusCascade } from '@/lib/production-rules';

const Package = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/>
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
    <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
    <line x1="12" y1="22.08" x2="12" y2="12"/>
  </svg>
);

const getDefaultDate = () => {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return formatDateForInput(date);
};

const parseEur = (s: string) => {
  const n = parseFloat(s.trim().replace(',', '.').replace(/\s/g, ''));
  return s.trim() !== '' && !Number.isNaN(n) ? n : undefined;
};

type FreelanceEntry = {
  id: string;
  name: string;
  budget: string;
};

export function DeliverableForm() {
  const { isAdmin } = useUserRole();
  const {
    activeModal,
    closeModal,
    addDeliverable,
    updateDeliverable,
    deleteDeliverable,
    team,
    getClientById,
    navigateToClient,
    deliverables,
  } = useAppStore();
  const isOpen = activeModal?.type === 'deliverable';
  const mode = isOpen ? activeModal.mode : 'create';
  const modalClientId = isOpen ? activeModal.clientId : undefined;
  const modalDeliverable = isOpen && activeModal.mode === 'edit' ? activeModal.deliverable : undefined;
  const showClientSelector = isOpen && mode === 'create' && modalClientId === undefined;
  
  // Récupérer le deliverable LIVE depuis le store (pour avoir les updates en temps réel)
  const existingDeliverable = modalDeliverable 
    ? deliverables.find(d => d.id === modalDeliverable.id) ?? modalDeliverable
    : undefined;
  
  // Récupérer le client pour afficher son nom
  const effectiveClientId = existingDeliverable?.clientId ?? modalClientId;
  const client = effectiveClientId ? getClientById(effectiveClientId) : null;

  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);
  const [freelances, setFreelances] = useState<FreelanceEntry[]>([]);
  const [isEditingName, setIsEditingName] = useState(false);

  // Verrou : actif par défaut si produit terminé
  const isCompleted = existingDeliverable?.status === 'completed';
  const [isLocked, setIsLocked] = useState(false);
  useEffect(() => {
    setIsLocked(isCompleted);
  }, [isCompleted, isOpen]);
  const [billingData, setBillingData] = useState<{
    devis?: number;
    devisDate?: string;
    acompte?: number;
    acompteDate?: string;
    avancements?: number[];
    avancementsDate?: string[];
    solde?: number;
    soldeDate?: string;
    sousTraitance?: number;
    stHorsFacture?: boolean;
    margePotentielle?: number;
  }>({});

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<DeliverableFormData>({
    resolver: zodResolver(DeliverableSchema),
    defaultValues: {
      name: '',
      selectedClientId: '',
      toBacklog: false,
      dueDate: getDefaultDate(),
      dueTime: '18:00',
      type: 'creative',
      status: 'pending',
      assigneeId: '',
      category: 'other',
      isPotentiel: false,
      prixFacturé: '',
      coutSousTraitance: '',
      deliveredAt: '',
      externalContractor: '',
      notes: '',
    },
  });

  // En mode création, c'est toujours backlog (pas de date)
  // En mode édition, on affiche la date si elle existe
  const isScheduled = mode === 'edit' && existingDeliverable?.dueDate != null;

  useEffect(() => {
    if (isOpen) {
      // Reset editing state when modal opens
      setIsEditingName(mode === 'create');
      
      if (existingDeliverable) {
        const noDate = existingDeliverable.dueDate == null;
        reset({
          name: existingDeliverable.name,
          selectedClientId: existingDeliverable.clientId ?? '',
          toBacklog: noDate,
          dueDate: noDate ? getDefaultDate() : formatDateForInput(existingDeliverable.dueDate!),
          dueTime: noDate ? '18:00' : formatTimeForInput(existingDeliverable.dueDate!),
          type: existingDeliverable.type,
          status: existingDeliverable.status,
          assigneeId: existingDeliverable.assigneeId || '',
          category: existingDeliverable.category ?? 'other',
          isPotentiel: existingDeliverable.isPotentiel === true,
          prixFacturé: existingDeliverable.prixFacturé != null ? String(existingDeliverable.prixFacturé) : '',
          coutSousTraitance: existingDeliverable.coutSousTraitance != null ? String(existingDeliverable.coutSousTraitance) : '',
          deliveredAt: '',
          externalContractor: '',
          notes: existingDeliverable.notes ?? '',
        });
        setSelectedTeamIds(existingDeliverable.assigneeId ? [existingDeliverable.assigneeId] : []);
        // Parse existing coutSousTraitance into freelances if it's a simple number
        if (existingDeliverable.coutSousTraitance) {
          setFreelances([{ id: '1', name: 'Freelance', budget: String(existingDeliverable.coutSousTraitance) }]);
        } else {
          setFreelances([]);
        }
        // Initialize billing data avec dates
        setBillingData({
          devis: existingDeliverable.quoteAmount,
          devisDate: existingDeliverable.quoteDate,
          acompte: existingDeliverable.depositAmount,
          acompteDate: existingDeliverable.depositDate,
          avancements: existingDeliverable.progressAmounts || [],
          avancementsDate: existingDeliverable.progressDates || [],
          solde: existingDeliverable.balanceAmount,
          soldeDate: existingDeliverable.balanceDate,
          sousTraitance: existingDeliverable.coutSousTraitance,
          stHorsFacture: existingDeliverable.stHorsFacture || false,
          margePotentielle: existingDeliverable.margePotentielle,
        });
      } else {
        reset({
          name: '',
          selectedClientId: modalClientId ?? '',
          toBacklog: false,
          dueDate: getDefaultDate(),
          dueTime: '18:00',
          type: 'creative',
          status: 'pending',
          assigneeId: '',
          category: 'other',
          isPotentiel: false,
          prixFacturé: '',
          coutSousTraitance: '',
          deliveredAt: '',
          externalContractor: '',
          notes: '',
        });
        setSelectedTeamIds([]);
        setFreelances([]);
        // Reset billing data
        setBillingData({});
      }
    }
  }, [isOpen, existingDeliverable, modalClientId, reset]);

  const onSubmit = (data: DeliverableFormData) => {
    // En création, c'est toujours backlog (pas de date)
    // En édition, on garde la date existante
    const dueDate = mode === 'edit' && existingDeliverable?.dueDate 
      ? existingDeliverable.dueDate 
      : undefined;
    const effectiveClientId = modalClientId ?? (data.selectedClientId || undefined);

    // Calculate total freelance cost
    const totalFreelanceCost = freelances.reduce((sum, f) => {
      const cost = parseEur(f.budget);
      return sum + (cost ?? 0);
    }, 0);

    // Calculate billing status based on filled amounts
    const getBillingStatus = () => {
      if (billingData.solde != null) return 'balance';
      if (billingData.avancements && billingData.avancements.length > 0) return 'progress';
      if (billingData.acompte != null) return 'deposit';
      return 'pending';
    };

    const avancementsTotal = (billingData.avancements || []).reduce((sum, v) => sum + v, 0);
    const totalInvoiced = (billingData.acompte || 0) + avancementsTotal + (billingData.solde || 0);

    const computedBillingStatus = getBillingStatus();
    const prixFinal = totalInvoiced > 0 ? totalInvoiced : undefined;

    // Cascade automatique du statut production en fonction de la facturation
    const currentStatus = existingDeliverable?.status ?? 'to_quote';
    const cascade = computeStatusCascade(currentStatus, computedBillingStatus as 'pending' | 'deposit' | 'progress' | 'balance', prixFinal);
    const finalStatus = cascade.status ?? currentStatus;

    // Terminé = dé-planifié automatiquement
    const effectiveDueDate = finalStatus === 'completed' ? undefined : dueDate;
    const effectiveInBacklog = finalStatus === 'completed' ? false : (mode === 'create' ? data.toBacklog : existingDeliverable?.inBacklog);

    const deliverableData: Omit<Deliverable, 'id' | 'createdAt'> = {
      clientId: effectiveClientId,
      name: data.name.trim(),
      dueDate: effectiveDueDate,
      inBacklog: effectiveInBacklog,
      type: 'creative' as DeliverableType,
      status: mode === 'create' ? 'to_quote' as DeliverableStatus : finalStatus,
      assigneeId: selectedTeamIds[0] || undefined,
      category: 'other',
      isPotentiel: (billingData.margePotentielle ?? 0) > 0 && computedBillingStatus === 'pending',
      prixFacturé: prixFinal,
      coutSousTraitance: billingData.sousTraitance,
      stHorsFacture: billingData.stHorsFacture || false,
      deliveredAt: undefined,
      externalContractor: undefined,
      notes: data.notes?.trim() || undefined,
      billingStatus: computedBillingStatus,
      quoteAmount: billingData.devis,
      quoteDate: billingData.devisDate,
      depositAmount: billingData.acompte,
      depositDate: billingData.acompteDate,
      progressAmounts: billingData.avancements,
      progressDates: billingData.avancementsDate,
      balanceAmount: billingData.solde,
      balanceDate: billingData.soldeDate,
      totalInvoiced: prixFinal,
      margePotentielle: billingData.margePotentielle,
    };

    if (mode === 'edit' && existingDeliverable) {
      updateDeliverable(existingDeliverable.id, deliverableData);
    } else {
      addDeliverable(deliverableData);
    }
    closeModal();
  };

  const handleDelete = () => {
    if (mode === 'edit' && existingDeliverable) {
      deleteDeliverable(existingDeliverable.id);
      closeModal();
    }
  };

  const toggleTeamMember = (id: string) => {
    setSelectedTeamIds(prev =>
      prev.includes(id) ? prev.filter(tid => tid !== id) : [...prev, id]
    );
  };

  const addFreelance = () => {
    setFreelances(prev => [...prev, { id: Date.now().toString(), name: '', budget: '' }]);
  };

  const updateFreelance = (id: string, field: 'name' | 'budget', value: string) => {
    setFreelances(prev => prev.map(f => f.id === id ? { ...f, [field]: value } : f));
  };

  const removeFreelance = (id: string) => {
    setFreelances(prev => prev.filter(f => f.id !== id));
  };

  const totalFreelanceCost = freelances.reduce((sum, f) => {
    const cost = parseEur(f.budget);
    return sum + (cost ?? 0);
  }, 0);

  return (
    <Modal
      isOpen={isOpen}
      onClose={closeModal}
      onSubmit={!isLocked ? handleSubmit(onSubmit) : undefined}
      title={mode === 'edit' ? 'Modifier le produit' : 'Nouveau produit'}
      subtitle="Produit"
      icon={<Package />}
      iconBg={isCompleted ? 'bg-[#22c55e]/10' : 'bg-[var(--accent-violet)]/10'}
      iconColor={isCompleted ? 'text-[#22c55e]' : 'text-[var(--accent-violet)]'}
      size="xl"
      footer={
        isLocked ? (
          /* Mode verrouillé — footer minimal */
          <>
            <div className="flex-1" />
            <Button variant="secondary" onClick={closeModal}>
              Fermer
            </Button>
          </>
        ) : (
          /* Mode édition */
          <>
            {mode === 'edit' && (
              <Button variant="danger" onClick={handleDelete}>
                Supprimer
              </Button>
            )}
            <div className="flex-1" />
            <Button variant="secondary" onClick={() => isCompleted ? setIsLocked(true) : closeModal()}>
              {isCompleted ? 'Annuler' : 'Annuler'}
            </Button>
            <Button onClick={handleSubmit(onSubmit)}>
              {mode === 'edit' ? 'Enregistrer' : 'Créer'}
            </Button>
          </>
        )
      }
    >
      {/* MODE VERROUILLÉ — vue résumé sobre */}
      {isCompleted && isLocked ? (
        <div className="space-y-5">
          {/* Nom + client */}
          <div>
            {client && (
              <button type="button" onClick={() => { closeModal(); navigateToClient(client.id); }}
                className="text-xs text-[var(--text-muted)] hover:text-[var(--accent-cyan)] transition-colors mb-1 cursor-pointer">
                {client.name}
              </button>
            )}
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">{existingDeliverable?.name}</h2>
          </div>

          {/* Résumé facturation avec dates */}
          {(() => {
            const fmt = (d?: string) => d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: '2-digit' }) : null;
            return (
              <div className="rounded-xl border border-[#22c55e]/20 bg-[#22c55e]/5 divide-y divide-[#22c55e]/10">
                {billingData.devis != null && (
                  <div className="flex items-center justify-between px-4 py-2.5 text-sm gap-4">
                    <span className="text-[var(--text-muted)] w-24 flex-shrink-0">Devis</span>
                    {fmt(billingData.devisDate) && <span className="text-[11px] text-[var(--text-muted)]/60 flex-1">{fmt(billingData.devisDate)}</span>}
                    <span className="font-medium text-[var(--text-primary)]">{billingData.devis.toLocaleString('fr-FR')} €</span>
                  </div>
                )}
                {billingData.acompte != null && (
                  <div className="flex items-center justify-between px-4 py-2.5 text-sm gap-4">
                    <span className="text-[var(--text-muted)] w-24 flex-shrink-0">Acompte</span>
                    {fmt(billingData.acompteDate) && <span className="text-[11px] text-[var(--text-muted)]/60 flex-1">{fmt(billingData.acompteDate)}</span>}
                    <span className="font-medium text-[var(--text-primary)]">{billingData.acompte.toLocaleString('fr-FR')} €</span>
                  </div>
                )}
                {(billingData.avancements || []).map((v, i) => (
                  <div key={i} className="flex items-center justify-between px-4 py-2.5 text-sm gap-4">
                    <span className="text-[var(--text-muted)] w-24 flex-shrink-0">Avancement {i + 1}</span>
                    {fmt(billingData.avancementsDate?.[i]) && <span className="text-[11px] text-[var(--text-muted)]/60 flex-1">{fmt(billingData.avancementsDate?.[i])}</span>}
                    <span className="font-medium text-[var(--text-primary)]">{v.toLocaleString('fr-FR')} €</span>
                  </div>
                ))}
                <div className="flex items-center justify-between px-4 py-3 gap-4">
                  <div className="flex items-center gap-1.5 w-24 flex-shrink-0">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    <span className="text-sm font-bold text-[#22c55e]">Soldé</span>
                  </div>
                  {fmt(billingData.soldeDate) && <span className="text-[11px] text-[var(--text-muted)]/60 flex-1">{fmt(billingData.soldeDate)}</span>}
                  <span className="text-sm font-bold text-[#22c55e]">{existingDeliverable?.prixFacturé?.toLocaleString('fr-FR')} €</span>
                </div>
              </div>
            );
          })()}

          {/* Notes si présentes */}
          {existingDeliverable?.notes && (
            <p className="text-sm text-[var(--text-muted)] leading-relaxed">{existingDeliverable.notes}</p>
          )}

          {/* Bouton modifier discret */}
          <button type="button" onClick={() => setIsLocked(false)}
            className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer group">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-50 group-hover:opacity-100">
              <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/>
            </svg>
            Modifier ce produit terminé
          </button>
        </div>
      ) : (

      /* MODE ÉDITION — formulaire complet */
      <>
      {isCompleted && (
        <div className="flex items-center justify-between px-4 py-2 -mx-6 -mt-2 mb-4 border-b border-amber-500/20 bg-amber-500/5">
          <div className="flex items-center gap-2">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/>
            </svg>
            <span className="text-xs text-amber-500 font-medium">Mode édition — produit terminé</span>
          </div>
          <button type="button" onClick={() => setIsLocked(true)}
            className="text-[10px] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer">
            Annuler
          </button>
        </div>
      )}
      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT COLUMN - General Info */}
        <div className="space-y-5">
        {/* Client selector en création OU lien vers client en édition */}
        {showClientSelector ? (
          <FormField label="Client">
            <ClientAutocomplete
              value={watch('selectedClientId') ?? ''}
              onChange={(clientId) => setValue('selectedClientId', clientId)}
              placeholder="Tapez le nom du client..."
            />
          </FormField>
        ) : client ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-[var(--text-muted)]">Client :</span>
            <button
              type="button"
              onClick={() => {
                closeModal();
                navigateToClient(client.id);
              }}
              className="text-sm font-medium text-[var(--accent-cyan)] hover:underline"
            >
              {client.name}
            </button>
          </div>
        ) : null}

        <FormField label="Nom du produit" required error={errors.name?.message}>
          {isEditingName ? (
            <Input 
              {...register('name')} 
              placeholder="Ex: Logo final V2, Charte graphique, Site web..." 
              autoFocus 
              onBlur={() => {
                if (mode === 'edit' && watch('name')?.trim()) {
                  setIsEditingName(false);
                }
              }}
            />
          ) : (
            <div 
              className="flex items-center justify-between px-3 py-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-tertiary)]/30 cursor-pointer hover:border-[var(--accent-cyan)]/50 transition-colors group"
              onClick={() => setIsEditingName(true)}
            >
              <span className="text-[var(--text-primary)] font-medium truncate">
                {watch('name') || 'Sans titre'}
              </span>
              <svg 
                width="14" 
                height="14" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                className="text-[var(--text-muted)] group-hover:text-[var(--accent-cyan)] transition-colors flex-shrink-0 ml-2"
              >
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </div>
          )}
        </FormField>

        {/* Planification : soit toggle backlog, soit affichage date */}
        {isScheduled && existingDeliverable?.dueDate ? (
          // PLANIFIÉ : afficher la date avec option de retirer
          <div className="flex items-center justify-between px-4 py-3 rounded-lg border border-[var(--accent-lime)]/40 bg-[var(--accent-lime)]/10">
            <div className="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--accent-lime)]">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-[var(--accent-lime)]">Planifié</span>
                <span className="text-xs text-[var(--text-primary)]">
                  {new Date(existingDeliverable.dueDate).toLocaleDateString('fr-FR', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => updateDeliverable(existingDeliverable.id, { dueDate: undefined, inBacklog: true })}
              className="px-3 py-1.5 text-xs font-medium rounded-lg text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
            >
              Retirer
            </button>
          </div>
        ) : (
          // NON PLANIFIÉ : toggle backlog
          <div className="flex items-center justify-between px-4 py-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-tertiary)]/30">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium text-[var(--text-primary)]">À planifier</span>
              <span className="text-[10px] text-[var(--text-muted)]">Afficher dans le backlog</span>
            </div>
            <button
              type="button"
              onClick={() => {
                if (existingDeliverable) {
                  updateDeliverable(existingDeliverable.id, { inBacklog: !existingDeliverable.inBacklog });
                } else {
                  setValue('toBacklog', !watch('toBacklog'));
                }
              }}
              className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${
                (existingDeliverable?.inBacklog || (!existingDeliverable && watch('toBacklog')))
                  ? 'bg-[var(--accent-violet)]'
                  : 'bg-[var(--bg-secondary)] border border-[var(--border-subtle)]'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                  (existingDeliverable?.inBacklog || (!existingDeliverable && watch('toBacklog')))
                    ? 'translate-x-5'
                    : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        )}

        {/* Team member chips */}
        <FormField label="Assigné à">
          <div className="flex flex-wrap gap-2">
            {team.map((member) => {
              const isSelected = selectedTeamIds.includes(member.id);
              return (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => toggleTeamMember(member.id)}
                  className="inline-flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold transition-all cursor-pointer border-2 hover:opacity-80"
                  style={{
                    backgroundColor: isSelected ? member.color : 'transparent',
                    color: isSelected ? '#000' : member.color,
                    borderColor: member.color,
                  }}
                  title={member.name}
                >
                  {member.initials}
                </button>
              );
            })}
            {team.length === 0 && (
              <p className="text-sm text-[var(--text-muted)]">Aucun membre d'équipe disponible</p>
            )}
          </div>
        </FormField>


        <FormField label="Notes">
          <Textarea {...register('notes')} placeholder="Détails, suivi..." rows={3} className="resize-y" />
        </FormField>
        </div>

        {/* RIGHT COLUMN - Money & Billing */}
        <div className="space-y-5">
        {isAdmin && (
          <BillingForm
            key={existingDeliverable?.id || 'new'}
            value={billingData}
            onChange={setBillingData}
            disabled={isLocked}
          />
        )}
        </div>
      </form>
      </>
      )}
    </Modal>
  );
}

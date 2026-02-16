'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal, FormField, Input, Textarea, Select, Button, BillingForm, BillingTimeline } from '@/components/ui';
import { useAppStore } from '@/lib/store';
import { useUserRole } from '@/hooks/useUserRole';
import { DeliverableSchema, type DeliverableFormData } from '@/lib/validation';
import { DeliverableType, DeliverableStatus, Deliverable } from '@/types';
import { formatDateForInput, formatTimeForInput } from '@/lib/date-utils';

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
    clients,
    openModal,
    updateDeliverableBillingStatus,
    loadBillingHistory,
    getBillingHistory,
  } = useAppStore();
  const isOpen = activeModal?.type === 'deliverable';
  const mode = isOpen ? activeModal.mode : 'create';
  const modalClientId = isOpen ? activeModal.clientId : undefined;
  const existingDeliverable = isOpen && activeModal.mode === 'edit' ? activeModal.deliverable : undefined;
  const showClientSelector = isOpen && mode === 'create' && modalClientId === undefined;

  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);
  const [freelances, setFreelances] = useState<FreelanceEntry[]>([]);
  const [billingData, setBillingData] = useState<{
    devis?: number;
    acompte?: number;
    avancements?: number[];
    solde?: number;
    sousTraitance?: number;
    stHorsFacture?: boolean;
  }>({});
  const billingHistory = existingDeliverable ? getBillingHistory(existingDeliverable.id) : [];

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

  const toBacklog = watch('toBacklog');
  const isPotentiel = watch('isPotentiel');

  useEffect(() => {
    if (isOpen) {
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
        // Initialize billing data
        setBillingData({
          devis: existingDeliverable.quoteAmount,
          acompte: existingDeliverable.depositAmount,
          avancements: existingDeliverable.progressAmounts || [],
          solde: existingDeliverable.balanceAmount,
          sousTraitance: existingDeliverable.coutSousTraitance,
          stHorsFacture: existingDeliverable.stHorsFacture || false,
        });
        // Load billing history
        loadBillingHistory(existingDeliverable.id);
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
  }, [isOpen, existingDeliverable, modalClientId, reset, loadBillingHistory]);

  const onSubmit = (data: DeliverableFormData) => {
    const dueDate = data.toBacklog ? undefined : new Date(`${data.dueDate}T${data.dueTime || '18:00'}`);
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

    const deliverableData: Omit<Deliverable, 'id' | 'createdAt'> = {
      clientId: effectiveClientId,
      name: data.name.trim(),
      dueDate,
      type: 'creative' as DeliverableType, // Fixed type
      status: 'pending' as DeliverableStatus, // Always pending on create, can be changed inline later
      assigneeId: selectedTeamIds[0] || undefined, // First selected team member
      category: 'other',
      isPotentiel: data.isPotentiel === true,
      prixFacturé: totalInvoiced > 0 ? totalInvoiced : undefined,
      coutSousTraitance: billingData.sousTraitance,
      stHorsFacture: billingData.stHorsFacture || false,
      deliveredAt: undefined,
      externalContractor: undefined,
      notes: data.notes?.trim() || undefined,
      billingStatus: getBillingStatus(),
      quoteAmount: billingData.devis,
      depositAmount: billingData.acompte,
      progressAmounts: billingData.avancements,
      balanceAmount: billingData.solde,
      totalInvoiced: totalInvoiced > 0 ? totalInvoiced : undefined,
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
      title={mode === 'edit' ? 'Modifier le livrable' : 'Nouveau livrable'}
      subtitle="Livrable"
      icon={<Package />}
      iconBg="bg-[var(--accent-violet)]/10"
      iconColor="text-[var(--accent-violet)]"
      size="xl"
      footer={
        <>
          {mode === 'edit' && (
            <Button variant="danger" onClick={handleDelete}>
              Supprimer
            </Button>
          )}
          <div className="flex-1" />
          <Button variant="secondary" onClick={closeModal}>
            Annuler
          </Button>
          <Button onClick={handleSubmit(onSubmit)}>
            {mode === 'edit' ? 'Enregistrer' : 'Créer'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT COLUMN - General Info */}
        <div className="space-y-5">
        {showClientSelector && (
          <FormField label="Client">
            <div className="flex items-center gap-2">
              <Select
                value={watch('selectedClientId')}
                onChange={(e) => setValue('selectedClientId', e.target.value)}
                options={[
                  { value: '', label: 'Sans client' },
                  ...clients.map((c) => ({ value: c.id, label: c.name })),
                ]}
                className="flex-1 min-w-0"
              />
              <button
                type="button"
                onClick={() => openModal({ type: 'client', mode: 'create' })}
                className="flex-shrink-0 px-2 py-1.5 rounded-lg text-xs font-medium text-[var(--accent-cyan)] bg-[var(--accent-cyan)]/10 hover:bg-[var(--accent-cyan)]/20 transition-colors whitespace-nowrap"
              >
                + Client
              </button>
            </div>
          </FormField>
        )}

        <FormField label="Nom du livrable" required error={errors.name?.message}>
          <Input {...register('name')} placeholder="Ex: Logo final V2, Charte graphique, Site web..." autoFocus />
        </FormField>

        {/* Toggle switch backlog */}
        <button
          type="button"
          onClick={() => setValue('toBacklog', !toBacklog)}
          className="w-full flex items-center justify-between px-4 py-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-tertiary)]/30 hover:bg-[var(--bg-tertiary)]/50 transition-colors cursor-pointer"
        >
          <span className="text-sm font-medium text-[var(--text-primary)]">À planifier plus tard (backlog)</span>
          <div
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              toBacklog ? 'bg-[var(--accent-violet)]' : 'bg-[var(--bg-tertiary)]'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition-transform ${
                toBacklog ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </div>
        </button>

        {!toBacklog && (
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Date de rendu" required error={errors.dueDate?.message}>
              <Input type="date" {...register('dueDate')} />
            </FormField>
            <FormField label="Heure">
              <Input type="time" {...register('dueTime')} />
            </FormField>
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
                  className={`inline-flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold transition-all cursor-pointer border-2 ${
                    isSelected
                      ? 'ring-2 ring-[var(--accent-lime)] ring-offset-2 ring-offset-[var(--bg-primary)]'
                      : 'opacity-70 hover:opacity-100 border-transparent'
                  }`}
                  style={{
                    backgroundColor: member.color,
                    color: '#000',
                    borderColor: isSelected ? member.color : 'transparent',
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

        {/* Status compta toggle */}
        <FormField label="Statut compta">
          <div className="flex items-center gap-3 p-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-tertiary)]/20">
            <button
              type="button"
              onClick={() => setValue('isPotentiel', false)}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                !isPotentiel
                  ? 'bg-[#22c55e] text-white shadow-md'
                  : 'bg-transparent text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)]/50'
              }`}
            >
              ✓ Validé
            </button>
            <button
              type="button"
              onClick={() => setValue('isPotentiel', true)}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                isPotentiel
                  ? 'bg-amber-500 text-white shadow-md'
                  : 'bg-transparent text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)]/50'
              }`}
            >
              ⧗ Potentiel
            </button>
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-2">
            {isPotentiel ? 'Pipeline — compte dans Potentiel Compta' : 'Validé — compte dans Total validé / Marge'}
          </p>
        </FormField>

        <FormField label="Notes">
          <Textarea {...register('notes')} placeholder="Détails, suivi..." rows={3} className="resize-y" />
        </FormField>
        </div>

        {/* RIGHT COLUMN - Money & Billing */}
        <div className="space-y-5">
        {isAdmin && (
          <>
            {/* New Billing Form */}
            <BillingForm
              key={existingDeliverable?.id || 'new'}
              value={billingData}
              onChange={setBillingData}
            />

            {/* Billing history - only in edit mode */}
            {mode === 'edit' && existingDeliverable && billingHistory.length > 0 && (
              <div className="space-y-3 p-4 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-tertiary)]/20">
                <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
                  📊 Historique de facturation
                </h3>
                <BillingTimeline
                  history={billingHistory}
                  deliverableId={existingDeliverable.id}
                  canEdit={true}
                  canDelete={true}
                />
              </div>
            )}
          </>
        )}
        </div>
      </form>
    </Modal>
  );
}

'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal, FormField, Input, Textarea, Select, Button } from '@/components/ui';
import { useAppStore } from '@/lib/store';
import { useUserRole } from '@/hooks/useUserRole';
import { DeliverableSchema, type DeliverableFormData } from '@/lib/validation';
import { DeliverableType, DeliverableStatus, Deliverable, DeliverableCategory } from '@/types';
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

const typeOptions = [
  { value: 'creative', label: '🎨 Créatif' },
  { value: 'document', label: '📄 Document' },
  { value: 'other', label: '📦 Autre' },
];

const statusOptions = [
  { value: 'pending', label: '⏳ À faire' },
  { value: 'in-progress', label: '🔄 En cours' },
  { value: 'completed', label: '✅ Terminé' },
];

export function DeliverableForm() {
  const { isAdmin } = useUserRole();
  const { activeModal, closeModal, addDeliverable, updateDeliverable, deleteDeliverable, team, clients, openModal } = useAppStore();
  const isOpen = activeModal?.type === 'deliverable';
  const mode = isOpen ? activeModal.mode : 'create';
  const modalClientId = isOpen ? activeModal.clientId : undefined;
  const existingDeliverable = isOpen && activeModal.mode === 'edit' ? activeModal.deliverable : undefined;
  const showClientSelector = isOpen && mode === 'create' && modalClientId === undefined;

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
  const teamOptions = [
    { value: '', label: 'Non assigné' },
    ...team.map((m) => ({ value: m.id, label: `${m.name} (${m.role})` })),
  ];

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
          deliveredAt: existingDeliverable.deliveredAt ? formatDateForInput(existingDeliverable.deliveredAt) : '',
          externalContractor: existingDeliverable.externalContractor ?? '',
          notes: existingDeliverable.notes ?? '',
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
      }
    }
  }, [isOpen, existingDeliverable, modalClientId, reset]);

  const onSubmit = (data: DeliverableFormData) => {
    const dueDate = data.toBacklog ? undefined : new Date(`${data.dueDate}T${data.dueTime || '18:00'}`);
    const deliveredAtDate = data.deliveredAt ? new Date(data.deliveredAt + 'T12:00:00') : undefined;
    const effectiveClientId = modalClientId ?? (data.selectedClientId || undefined);
    const deliverableData: Omit<Deliverable, 'id' | 'createdAt'> = {
      clientId: effectiveClientId,
      name: data.name.trim(),
      dueDate,
      type: data.type as DeliverableType,
      status: data.status as DeliverableStatus,
      assigneeId: data.assigneeId || undefined,
      category: data.category as DeliverableCategory,
      isPotentiel: data.isPotentiel === true,
      prixFacturé: parseEur(data.prixFacturé ?? ''),
      coutSousTraitance: parseEur(data.coutSousTraitance ?? ''),
      deliveredAt: deliveredAtDate,
      externalContractor: data.externalContractor?.trim() || undefined,
      notes: data.notes?.trim() || undefined,
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={closeModal}
      title={mode === 'edit' ? 'Modifier le livrable' : 'Nouveau livrable'}
      subtitle="Livrable"
      icon={<Package />}
      iconBg="bg-[var(--accent-violet)]/10"
      iconColor="text-[var(--accent-violet)]"
      size="md"
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
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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

        <FormField label="Planification" error={errors.dueDate?.message}>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" {...register('toBacklog')} className="rounded border-[var(--border-subtle)] text-[var(--accent-violet)] focus:ring-[var(--accent-violet)]" />
            <span className="text-sm text-[var(--text-primary)]">À planifier plus tard (backlog)</span>
          </label>
        </FormField>

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

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Type (icône colis sur la timeline)">
            <Select value={watch('type')} onChange={(e) => setValue('type', e.target.value as DeliverableFormData['type'])} options={typeOptions} />
          </FormField>
          <FormField label="Statut">
            <Select value={watch('status')} onChange={(e) => setValue('status', e.target.value as DeliverableFormData['status'])} options={statusOptions} />
          </FormField>
        </div>

        <FormField label="Assigné à">
          <Select value={watch('assigneeId')} onChange={(e) => setValue('assigneeId', e.target.value)} options={teamOptions} />
        </FormField>

        <FormField label="Catégorie (Print / Digital)">
          <Select
            value={watch('category')}
            onChange={(e) => setValue('category', e.target.value as DeliverableFormData['category'])}
            options={[
              { value: 'print', label: '🖨️ Print (ex. cartes de visite, flyers)' },
              { value: 'digital', label: '🌐 Digital (ex. site, maquette)' },
              { value: 'other', label: '📦 Autre' },
            ]}
          />
        </FormField>

        <FormField label="Statut compta">
          <Select
            value={watch('isPotentiel') ? 'potentiel' : 'reel'}
            onChange={(e) => setValue('isPotentiel', e.target.value === 'potentiel')}
            options={[
              { value: 'reel', label: 'Livrable réel (facturé) — compte dans Total facturé / Marge' },
              { value: 'potentiel', label: 'Livrable potentiel (pipeline) — compte dans Potentiel Compta' },
            ]}
          />
          <p className="text-xs text-[var(--text-muted)] mt-1">Tu peux changer ce statut plus tard (réel ↔ potentiel).</p>
        </FormField>

        {isAdmin && (
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Prix facturé (€)">
              <Input type="text" inputMode="decimal" {...register('prixFacturé')} placeholder="Ex: 4500" />
            </FormField>
            <FormField label="Sous-traitance (€)">
              <Input type="text" inputMode="decimal" {...register('coutSousTraitance')} placeholder="Impressions, freelance..." />
            </FormField>
          </div>
        )}

        <FormField label="Date de livraison effective">
          <Input type="date" {...register('deliveredAt')} placeholder="Optionnel" />
        </FormField>

        <FormField label="Prestataire extérieur">
          <Input {...register('externalContractor')} placeholder="Ex: Agence Dev, freelance..." />
        </FormField>

        <FormField label="Notes">
          <Textarea {...register('notes')} placeholder="Détails, suivi..." rows={2} className="resize-y" />
        </FormField>
      </form>
    </Modal>
  );
}

'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal, FormField, Input, Textarea, Select, Button } from '@/components/ui';
import { useAppStore } from '@/lib/store';
import { CallSchema, type CallFormData } from '@/lib/validation';
import { Call, CallType } from '@/types';
import { formatDateForInput, formatTimeForInput } from '@/lib/date-utils';

const Phone = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
);

const getDefaultDate = () => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return formatDateForInput(date);
};

const durationOptions = [
  { value: '15', label: '15 min' },
  { value: '30', label: '30 min' },
  { value: '45', label: '45 min' },
  { value: '60', label: '1h' },
  { value: '90', label: '1h30' },
  { value: '120', label: '2h' },
];

export function CallForm() {
  const { activeModal, closeModal, addCall, updateCall, deleteCall, team, clients, openModal } = useAppStore();
  const isOpen = activeModal?.type === 'call';
  const mode = isOpen ? activeModal.mode : 'create';
  const modalClientId = isOpen ? activeModal.clientId : undefined;
  const existingCall = isOpen && activeModal.mode === 'edit' ? activeModal.call : undefined;
  const presetCallType = isOpen && mode === 'create' ? activeModal.presetCallType : undefined;
  const showClientSelector = isOpen && mode === 'create' && modalClientId === undefined;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<CallFormData>({
    resolver: zodResolver(CallSchema),
    defaultValues: {
      title: '',
      selectedClientId: '',
      callType: 'call',
      toBacklog: false,
      scheduledDate: getDefaultDate(),
      scheduledTime: '10:00',
      duration: 30,
      assigneeId: '',
      notes: '',
    },
  });

  const toBacklog = watch('toBacklog');
  const callType = watch('callType');
  const selectedClientId = watch('selectedClientId');

  useEffect(() => {
    if (isOpen) {
      if (existingCall) {
        const noDate = existingCall.scheduledAt == null;
        const scheduledAt = existingCall.scheduledAt;
        reset({
          title: existingCall.title,
          selectedClientId: existingCall.clientId ?? '',
          callType: (existingCall.callType ?? 'call') as 'call' | 'presentation',
          toBacklog: noDate,
          scheduledDate: scheduledAt ? formatDateForInput(scheduledAt) : getDefaultDate(),
          scheduledTime: scheduledAt ? formatTimeForInput(scheduledAt) : '10:00',
          duration: existingCall.duration,
          assigneeId: existingCall.assigneeId || '',
          notes: existingCall.notes ?? '',
        });
      } else {
        reset({
          title: presetCallType === 'presentation' ? 'Présentation client' : '',
          selectedClientId: modalClientId ?? '',
          callType: (presetCallType ?? 'call') as 'call' | 'presentation',
          toBacklog: false,
          scheduledDate: getDefaultDate(),
          scheduledTime: '10:00',
          duration: 30,
          assigneeId: '',
          notes: '',
        });
      }
    }
  }, [isOpen, existingCall, presetCallType, modalClientId, reset]);

  const onSubmit = (data: CallFormData) => {
    const scheduledAt = data.toBacklog
      ? undefined
      : new Date(`${data.scheduledDate}T${data.scheduledTime || '10:00'}`);
    const effectiveClientId = modalClientId ?? (data.selectedClientId || undefined);
    const callData: Omit<Call, 'id' | 'createdAt'> = {
      clientId: effectiveClientId,
      title: data.title.trim(),
      callType: data.callType as CallType,
      scheduledAt,
      duration: data.duration,
      assigneeId: data.assigneeId || undefined,
      notes: data.notes?.trim() || undefined,
    };
    if (mode === 'edit' && existingCall) {
      updateCall(existingCall.id, callData);
    } else {
      addCall(callData);
    }
    closeModal();
  };

  const handleDelete = () => {
    if (mode === 'edit' && existingCall) {
      deleteCall(existingCall.id);
      closeModal();
    }
  };

  const teamOptions = [
    { value: '', label: 'Non assigné' },
    ...team.map((m) => ({ value: m.id, label: `${m.name} (${m.role})` })),
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={closeModal}
      title={mode === 'edit' ? (existingCall?.callType === 'presentation' ? 'Modifier la présentation' : "Modifier l'appel") : (presetCallType === 'presentation' ? 'Nouvelle présentation' : 'Nouvel appel')}
      subtitle={presetCallType === 'presentation' || callType === 'presentation' ? 'Présentation client' : 'Appel'}
      icon={<Phone />}
      iconBg="bg-[var(--accent-coral)]/10"
      iconColor="text-[var(--accent-coral)]"
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
                value={selectedClientId}
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
        {presetCallType == null && (
          <FormField label="Type (icône sur la timeline)">
            <Select
              value={callType}
              onChange={(e) => setValue('callType', e.target.value as 'call' | 'presentation')}
              options={[
                { value: 'call', label: '📞 Appel' },
                { value: 'presentation', label: '🖥️ Présentation client' },
              ]}
            />
          </FormField>
        )}

        <FormField label={presetCallType === 'presentation' ? 'Titre de la présentation' : "Titre de l'appel"} required error={errors.title?.message}>
          <Input
            {...register('title')}
            placeholder="Ex: Call kick-off, Point hebdo, Présentation V2..."
            autoFocus
          />
        </FormField>

        <FormField label="Planification" error={errors.scheduledDate?.message}>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" {...register('toBacklog')} className="rounded border-[var(--border-subtle)] text-[var(--accent-coral)] focus:ring-[var(--accent-coral)]" />
            <span className="text-sm text-[var(--text-primary)]">À planifier plus tard (backlog)</span>
          </label>
        </FormField>

        {!toBacklog && (
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Date" required error={errors.scheduledDate?.message}>
              <Input type="date" {...register('scheduledDate')} />
            </FormField>
            <FormField label="Heure">
              <Input type="time" {...register('scheduledTime')} />
            </FormField>
          </div>
        )}

        <FormField label="Durée">
          <Select
            value={String(watch('duration'))}
            onChange={(e) => setValue('duration', Number(e.target.value))}
            options={durationOptions}
          />
        </FormField>

        <FormField label="Assigné à">
          <Select
            value={watch('assigneeId')}
            onChange={(e) => setValue('assigneeId', e.target.value)}
            options={teamOptions}
          />
        </FormField>

        <FormField label="Notes">
          <Textarea {...register('notes')} placeholder="Ordre du jour, points à aborder..." rows={3} />
        </FormField>
      </form>
    </Modal>
  );
}

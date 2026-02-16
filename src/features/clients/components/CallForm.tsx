'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal, FormField, Input, Textarea, Button, ClientAutocomplete } from '@/components/ui';
import { useAppStore } from '@/lib/store';
import { CallSchema, type CallFormData } from '@/lib/validation';
import { Call, CallType } from '@/types';
import { formatDateForInput, formatTimeForInput } from '@/lib/date-utils';
import { createClient } from '@/lib/supabase/client';

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

export function CallForm() {
  const { activeModal, closeModal, addCall, updateCall, deleteCall, team, getClientById, navigateToClient } = useAppStore();
  const [currentUserTeamId, setCurrentUserTeamId] = useState<string | null>(null);

  // Récupérer le team_member_id de l'utilisateur courant
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        const { data: teamRow } = await supabase
          .from('team')
          .select('id')
          .eq('auth_user_id', user.id)
          .maybeSingle();
        if (teamRow?.id) {
          setCurrentUserTeamId(teamRow.id);
        }
      }
    });
  }, []);
  const isOpen = activeModal?.type === 'call';
  const mode = isOpen ? activeModal.mode : 'create';
  const modalClientId = isOpen ? activeModal.clientId : undefined;
  const existingCall = isOpen && activeModal.mode === 'edit' ? activeModal.call : undefined;
  const presetCallType = isOpen && mode === 'create' ? activeModal.presetCallType : undefined;
  const showClientSelector = isOpen && mode === 'create' && modalClientId === undefined;

  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

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

  const selectedClientId = watch('selectedClientId');
  
  // Récupérer le client pour afficher son nom
  const effectiveClientId = existingCall?.clientId ?? modalClientId;
  const client = effectiveClientId ? getClientById(effectiveClientId) : null;
  
  // En mode création, c'est toujours backlog (pas de date)
  // En mode édition, on affiche la date si elle existe
  const isScheduled = mode === 'edit' && existingCall?.scheduledAt != null;

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
        setSelectedTeamId(existingCall.assigneeId || null);
      } else {
        reset({
          title: presetCallType === 'presentation' ? 'Présentation client' : '',
          selectedClientId: modalClientId ?? '',
          callType: (presetCallType ?? 'call') as 'call' | 'presentation',
          toBacklog: false,
          scheduledDate: getDefaultDate(),
          scheduledTime: '10:00',
          duration: 30,
          assigneeId: currentUserTeamId || '',
          notes: '',
        });
        // Pré-sélectionner l'utilisateur courant
        setSelectedTeamId(currentUserTeamId);
      }
    }
  }, [isOpen, existingCall, presetCallType, modalClientId, reset, currentUserTeamId]);

  const onSubmit = (data: CallFormData) => {
    // En création, c'est toujours backlog (pas de date)
    // En édition, on garde la date existante
    const scheduledAt = mode === 'edit' && existingCall?.scheduledAt 
      ? existingCall.scheduledAt 
      : undefined;
    const effectiveClientId = modalClientId ?? (data.selectedClientId || undefined);
    const callData: Omit<Call, 'id' | 'createdAt'> = {
      clientId: effectiveClientId,
      title: data.title.trim(),
      callType: data.callType as CallType,
      scheduledAt,
      duration: 30, // Durée fixe par défaut
      assigneeId: selectedTeamId || undefined,
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

  const toggleTeamMember = (id: string) => {
    setSelectedTeamId(prev => prev === id ? null : id);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={closeModal}
      onSubmit={handleSubmit(onSubmit)}
      title={mode === 'edit' ? "Modifier l'appel" : 'Nouvel appel'}
      subtitle="Appel"
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
        {/* Client selector en création OU lien vers client en édition */}
        {showClientSelector ? (
          <FormField label="Client">
            <ClientAutocomplete
              value={selectedClientId ?? ''}
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
              className="text-sm font-medium text-[var(--accent-cyan)] hover:underline cursor-pointer"
            >
              {client.name}
            </button>
          </div>
        ) : null}

        <FormField label="Titre de l'appel" required error={errors.title?.message}>
          <Input
            {...register('title')}
            placeholder="Ex: Call kick-off, Point hebdo, Présentation V2..."
            autoFocus
          />
        </FormField>

        {/* Affichage de la planification (lecture seule) */}
        <div className="px-4 py-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-tertiary)]/30">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[var(--text-muted)]">Planification</span>
            {isScheduled && existingCall?.scheduledAt ? (
              <span className="text-sm font-medium text-[var(--text-primary)]">
                {new Date(existingCall.scheduledAt).toLocaleDateString('fr-FR', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            ) : (
              <span className="text-sm text-[var(--text-muted)] italic">Pas encore planifié</span>
            )}
          </div>
          {mode === 'create' && (
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Glissez depuis "À planifier" vers la timeline pour définir une date
            </p>
          )}
        </div>

        {/* Team member chips */}
        <FormField label="Assigné à">
          <div className="flex flex-wrap gap-2">
            {team.map((member) => {
              const isSelected = selectedTeamId === member.id;
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
          <Textarea {...register('notes')} placeholder="Ordre du jour, points à aborder..." rows={3} />
        </FormField>
      </form>
    </Modal>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { Modal, FormField, Input, Textarea, Select, Button } from '@/components/ui';
import { useAppStore } from '@/lib/store';
import { Call, CallType } from '@/types';

// Icons
const Phone = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
);

interface FormData {
  title: string;
  /** Quand on ouvre depuis le backlog (sans clientId), choix du client ou "Sans client" */
  selectedClientId: string;
  callType: CallType;
  toBacklog: boolean;
  scheduledDate: string;
  scheduledTime: string;
  duration: number;
  assigneeId: string;
  notes: string;
}

export function CallForm() {
  const { activeModal, closeModal, addCall, updateCall, deleteCall, team, clients, openModal } = useAppStore();
  
  const isOpen = activeModal?.type === 'call';
  const mode = isOpen ? activeModal.mode : 'create';
  const modalClientId = isOpen ? activeModal.clientId : undefined;
  const existingCall = isOpen && activeModal.mode === 'edit' ? activeModal.call : undefined;
  const showClientSelector = isOpen && mode === 'create' && modalClientId === undefined;
  /** Quand on ouvre via un CTA "Appel" ou "Présentation", le type est fixé (plus de choix dans le formulaire) */
  const presetCallType = isOpen && mode === 'create' ? activeModal.presetCallType : undefined;
  
  // Helper to format date for input
  const formatDateForInput = (date: Date) => {
    return date.toISOString().split('T')[0];
  };
  
  const formatTimeForInput = (date: Date) => {
    return date.toTimeString().slice(0, 5);
  };
  
  const getDefaultDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 1); // Default to tomorrow
    return formatDateForInput(date);
  };
  
  const [formData, setFormData] = useState<FormData>({
    title: '',
    selectedClientId: '',
    callType: 'call',
    toBacklog: false,
    scheduledDate: getDefaultDate(),
    scheduledTime: '10:00',
    duration: 30,
    assigneeId: '',
    notes: ''
  });
  
  const [errors, setErrors] = useState<Partial<FormData>>({});
  
  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      if (existingCall) {
        const noDate = existingCall.scheduledAt == null;
        const scheduledAt = existingCall.scheduledAt;
        setFormData({
          title: existingCall.title,
          selectedClientId: existingCall.clientId ?? '',
          callType: existingCall.callType ?? 'call',
          toBacklog: noDate,
          scheduledDate: scheduledAt ? formatDateForInput(scheduledAt) : getDefaultDate(),
          scheduledTime: scheduledAt ? formatTimeForInput(scheduledAt) : '10:00',
          duration: existingCall.duration,
          assigneeId: existingCall.assigneeId || '',
          notes: existingCall.notes || ''
        });
      } else {
        setFormData({
          title: presetCallType === 'presentation' ? 'Présentation client' : '',
          selectedClientId: modalClientId ?? '',
          callType: presetCallType ?? 'call',
          toBacklog: false,
          scheduledDate: getDefaultDate(),
          scheduledTime: '10:00',
          duration: 30,
          assigneeId: '',
          notes: ''
        });
      }
      setErrors({});
    }
  }, [isOpen, existingCall, presetCallType, modalClientId]);
  
  const validate = (): boolean => {
    const newErrors: Partial<FormData> = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Le titre est requis';
    }
    if (!formData.toBacklog && !formData.scheduledDate) {
      newErrors.scheduledDate = 'La date est requise (ou cochez « À planifier plus tard »)';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = () => {
    if (!validate()) return;
    
    const scheduledAt = formData.toBacklog
      ? undefined
      : new Date(`${formData.scheduledDate}T${formData.scheduledTime || '10:00'}`);
    
    const effectiveClientId = modalClientId ?? (formData.selectedClientId || undefined);
    const callData: Omit<Call, 'id' | 'createdAt'> = {
      clientId: effectiveClientId,
      title: formData.title.trim(),
      callType: formData.callType,
      scheduledAt,
      duration: formData.duration,
      assigneeId: formData.assigneeId || undefined,
      notes: formData.notes.trim() || undefined
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
  
  const durationOptions = [
    { value: '15', label: '15 min' },
    { value: '30', label: '30 min' },
    { value: '45', label: '45 min' },
    { value: '60', label: '1h' },
    { value: '90', label: '1h30' },
    { value: '120', label: '2h' }
  ];
  
  const teamOptions = [
    { value: '', label: 'Non assigné' },
    ...team.map(m => ({ value: m.id, label: `${m.name} (${m.role})` }))
  ];
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={closeModal}
      title={mode === 'edit' ? (existingCall?.callType === 'presentation' ? 'Modifier la présentation' : 'Modifier l\'appel') : (presetCallType === 'presentation' ? 'Nouvelle présentation' : 'Nouvel appel')}
      subtitle={presetCallType === 'presentation' || formData.callType === 'presentation' ? 'Présentation client' : 'Appel'}
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
          <Button onClick={handleSubmit}>
            {mode === 'edit' ? 'Enregistrer' : 'Créer'}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        {showClientSelector && (
          <FormField label="Client">
            <div className="flex items-center gap-2">
              <Select
                value={formData.selectedClientId}
                onChange={e => setFormData(prev => ({ ...prev, selectedClientId: e.target.value }))}
                options={[
                  { value: '', label: 'Sans client' },
                  ...clients.map(c => ({ value: c.id, label: c.name }))
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
              value={formData.callType}
              onChange={e => setFormData(prev => ({ ...prev, callType: e.target.value as CallType }))}
              options={[
                { value: 'call', label: '📞 Appel' },
                { value: 'presentation', label: '🖥️ Présentation client' }
              ]}
            />
          </FormField>
        )}

        <FormField label={presetCallType === 'presentation' ? 'Titre de la présentation' : "Titre de l'appel"} required error={errors.title}>
          <Input
            value={formData.title}
            onChange={e => {
              setFormData(prev => ({ ...prev, title: e.target.value }));
              if (errors.title) setErrors(prev => ({ ...prev, title: undefined }));
            }}
            placeholder="Ex: Call kick-off, Point hebdo, Présentation V2..."
            autoFocus
          />
        </FormField>

        <FormField error={errors.scheduledDate}>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.toBacklog}
              onChange={e => {
                setFormData(prev => ({ ...prev, toBacklog: e.target.checked }));
                if (errors.scheduledDate) setErrors(prev => ({ ...prev, scheduledDate: undefined }));
              }}
              className="rounded border-[var(--border-subtle)] text-[var(--accent-coral)] focus:ring-[var(--accent-coral)]"
            />
            <span className="text-sm text-[var(--text-primary)]">À planifier plus tard (backlog)</span>
          </label>
        </FormField>
        
        {!formData.toBacklog && (
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Date" required error={errors.scheduledDate}>
              <Input
                type="date"
                value={formData.scheduledDate}
                onChange={e => {
                  setFormData(prev => ({ ...prev, scheduledDate: e.target.value }));
                  if (errors.scheduledDate) setErrors(prev => ({ ...prev, scheduledDate: undefined }));
                }}
              />
            </FormField>
            
            <FormField label="Heure">
              <Input
                type="time"
                value={formData.scheduledTime}
                onChange={e => setFormData(prev => ({ ...prev, scheduledTime: e.target.value }))}
              />
            </FormField>
          </div>
        )}
        
        <div className="grid grid-cols-1 gap-4">
          <FormField label="Durée">
            <Select
              value={String(formData.duration)}
              onChange={e => setFormData(prev => ({ ...prev, duration: Number(e.target.value) }))}
              options={durationOptions}
            />
          </FormField>
        </div>
        
        <FormField label="Assigné à">
          <Select
            value={formData.assigneeId}
            onChange={e => setFormData(prev => ({ ...prev, assigneeId: e.target.value }))}
            options={teamOptions}
          />
        </FormField>
        
        <FormField label="Notes">
          <Textarea
            value={formData.notes}
            onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="Ordre du jour, points à aborder..."
            rows={3}
          />
        </FormField>
      </div>
    </Modal>
  );
}

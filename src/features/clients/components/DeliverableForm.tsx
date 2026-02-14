'use client';

import { useState, useEffect } from 'react';
import { Modal, FormField, Input, Textarea, Select, Button } from '@/components/ui';
import { useAppStore } from '@/lib/store';
import { DeliverableType, DeliverableStatus, Deliverable, DeliverableCategory } from '@/types';

// Icons
const Package = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/>
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
    <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
    <line x1="12" y1="22.08" x2="12" y2="12"/>
  </svg>
);

interface FormData {
  name: string;
  selectedClientId: string;
  toBacklog: boolean;
  dueDate: string;
  dueTime: string;
  type: DeliverableType;
  status: DeliverableStatus;
  assigneeId: string;
  category: DeliverableCategory;
  prixFacturé: string;
  coutSousTraitance: string;
  deliveredAt: string;
  externalContractor: string;
  notes: string;
}

export function DeliverableForm() {
  const { activeModal, closeModal, addDeliverable, updateDeliverable, deleteDeliverable, team, clients, openModal } = useAppStore();
  
  const isOpen = activeModal?.type === 'deliverable';
  const mode = isOpen ? activeModal.mode : 'create';
  const modalClientId = isOpen ? activeModal.clientId : undefined; // undefined = ouvert depuis backlog
  const existingDeliverable = isOpen && activeModal.mode === 'edit' ? activeModal.deliverable : undefined;
  const showClientSelector = isOpen && mode === 'create' && modalClientId === undefined;
  
  // Helper to format date for input
  const formatDateForInput = (date: Date) => {
    return date.toISOString().split('T')[0];
  };
  
  const formatTimeForInput = (date: Date) => {
    return date.toTimeString().slice(0, 5);
  };
  
  const getDefaultDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 7); // Default to 1 week from now
    return formatDateForInput(date);
  };
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
    selectedClientId: '',
    toBacklog: false,
    dueDate: getDefaultDate(),
    dueTime: '18:00',
    type: 'creative',
    status: 'pending',
    assigneeId: '',
    category: 'other',
    cost: '',
    deliveredAt: '',
    externalContractor: '',
    notes: ''
  });
  
  const [errors, setErrors] = useState<Partial<FormData>>({});
  
  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      if (existingDeliverable) {
        const noDate = existingDeliverable.dueDate == null;
        setFormData({
          name: existingDeliverable.name,
          selectedClientId: existingDeliverable.clientId ?? '',
          toBacklog: noDate,
          dueDate: noDate ? getDefaultDate() : formatDateForInput(existingDeliverable.dueDate),
          dueTime: noDate ? '18:00' : formatTimeForInput(existingDeliverable.dueDate),
          type: existingDeliverable.type,
          status: existingDeliverable.status,
          assigneeId: existingDeliverable.assigneeId || '',
          category: existingDeliverable.category ?? 'other',
          prixFacturé: existingDeliverable.prixFacturé != null ? String(existingDeliverable.prixFacturé) : '',
          coutSousTraitance: existingDeliverable.coutSousTraitance != null ? String(existingDeliverable.coutSousTraitance) : '',
          deliveredAt: existingDeliverable.deliveredAt ? formatDateForInput(existingDeliverable.deliveredAt) : '',
          externalContractor: existingDeliverable.externalContractor ?? '',
          notes: existingDeliverable.notes ?? ''
        });
      } else {
        setFormData({
          name: '',
          selectedClientId: modalClientId ?? '',
          toBacklog: false,
          dueDate: getDefaultDate(),
          dueTime: '18:00',
          type: 'creative',
          status: 'pending',
          assigneeId: '',
          category: 'other',
          prixFacturé: '',
          coutSousTraitance: '',
          deliveredAt: '',
          externalContractor: '',
          notes: ''
        });
      }
      setErrors({});
    }
  }, [isOpen, existingDeliverable, modalClientId]);
  
  const validate = (): boolean => {
    const newErrors: Partial<FormData> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Le nom est requis';
    }
    if (!formData.toBacklog && !formData.dueDate) {
      newErrors.dueDate = 'La date est requise (ou cochez « À planifier plus tard »)';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = () => {
    if (!validate()) return;
    
    const dueDate = formData.toBacklog
      ? undefined
      : new Date(`${formData.dueDate}T${formData.dueTime || '18:00'}`);
    
    const parseEur = (s: string) => {
      const n = parseFloat(s.trim().replace(',', '.').replace(/\s/g, ''));
      return s.trim() !== '' && !Number.isNaN(n) ? n : undefined;
    };
    const prixFacturé = parseEur(formData.prixFacturé);
    const coutSousTraitance = parseEur(formData.coutSousTraitance);
    const deliveredAtDate = formData.deliveredAt ? new Date(formData.deliveredAt + 'T12:00:00') : undefined;

    const effectiveClientId = modalClientId ?? (formData.selectedClientId || undefined);
    const deliverableData: Omit<Deliverable, 'id' | 'createdAt'> = {
      clientId: effectiveClientId,
      name: formData.name.trim(),
      dueDate,
      type: formData.type,
      status: formData.status,
      assigneeId: formData.assigneeId || undefined,
      category: formData.category,
      prixFacturé,
      coutSousTraitance,
      deliveredAt: deliveredAtDate,
      externalContractor: formData.externalContractor.trim() || undefined,
      notes: formData.notes.trim() || undefined
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
  
  const typeOptions = [
    { value: 'creative', label: '🎨 Créatif' },
    { value: 'document', label: '📄 Document' },
    { value: 'other', label: '📦 Autre' }
  ];
  
  const statusOptions = [
    { value: 'pending', label: '⏳ À faire' },
    { value: 'in-progress', label: '🔄 En cours' },
    { value: 'completed', label: '✅ Terminé' }
  ];
  
  const teamOptions = [
    { value: '', label: 'Non assigné' },
    ...team.map(m => ({ value: m.id, label: `${m.name} (${m.role})` }))
  ];
  
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
        <FormField label="Nom du livrable" required error={errors.name}>
          <Input
            value={formData.name}
            onChange={e => {
              setFormData(prev => ({ ...prev, name: e.target.value }));
              if (errors.name) setErrors(prev => ({ ...prev, name: undefined }));
            }}
            placeholder="Ex: Logo final V2, Charte graphique, Site web..."
            autoFocus
          />
        </FormField>
        
        <FormField error={errors.dueDate}>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.toBacklog}
              onChange={e => {
                setFormData(prev => ({ ...prev, toBacklog: e.target.checked }));
                if (errors.dueDate) setErrors(prev => ({ ...prev, dueDate: undefined }));
              }}
              className="rounded border-[var(--border-subtle)] text-[var(--accent-violet)] focus:ring-[var(--accent-violet)]"
            />
            <span className="text-sm text-[var(--text-primary)]">À planifier plus tard (backlog)</span>
          </label>
        </FormField>

        {!formData.toBacklog && (
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Date de rendu" required error={errors.dueDate}>
              <Input
                type="date"
                value={formData.dueDate}
                onChange={e => {
                  setFormData(prev => ({ ...prev, dueDate: e.target.value }));
                  if (errors.dueDate) setErrors(prev => ({ ...prev, dueDate: undefined }));
                }}
              />
            </FormField>
            
            <FormField label="Heure">
              <Input
                type="time"
                value={formData.dueTime}
                onChange={e => setFormData(prev => ({ ...prev, dueTime: e.target.value }))}
              />
            </FormField>
          </div>
        )}
        
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Type (icône colis sur la timeline)">
            <Select
              value={formData.type}
              onChange={e => setFormData(prev => ({ ...prev, type: e.target.value as DeliverableType }))}
              options={typeOptions}
            />
          </FormField>
          
          <FormField label="Statut">
            <Select
              value={formData.status}
              onChange={e => setFormData(prev => ({ ...prev, status: e.target.value as DeliverableStatus }))}
              options={statusOptions}
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

        <FormField label="Catégorie (Print / Digital)">
          <Select
            value={formData.category}
            onChange={e => setFormData(prev => ({ ...prev, category: e.target.value as DeliverableCategory }))}
            options={[
              { value: 'print', label: '🖨️ Print (ex. cartes de visite, flyers)' },
              { value: 'digital', label: '🌐 Digital (ex. site, maquette)' },
              { value: 'other', label: '📦 Autre' }
            ]}
          />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Prix facturé (€)">
            <Input
              type="text"
              inputMode="decimal"
              value={formData.prixFacturé}
              onChange={e => setFormData(prev => ({ ...prev, prixFacturé: e.target.value }))}
              placeholder="Ex: 4500"
            />
          </FormField>
          <FormField label="Sous-traitance (€)">
            <Input
              type="text"
              inputMode="decimal"
              value={formData.coutSousTraitance}
              onChange={e => setFormData(prev => ({ ...prev, coutSousTraitance: e.target.value }))}
              placeholder="Impressions, freelance..."
            />
          </FormField>
        </div>

        <FormField label="Date de livraison effective">
          <Input
            type="date"
            value={formData.deliveredAt}
            onChange={e => setFormData(prev => ({ ...prev, deliveredAt: e.target.value }))}
            placeholder="Optionnel"
          />
        </FormField>

        <FormField label="Prestataire extérieur">
          <Input
            value={formData.externalContractor}
            onChange={e => setFormData(prev => ({ ...prev, externalContractor: e.target.value }))}
            placeholder="Ex: Agence Dev, freelance..."
          />
        </FormField>

        <FormField label="Notes">
          <Textarea
            value={formData.notes}
            onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="Détails, suivi..."
            rows={2}
            className="resize-y"
          />
        </FormField>
      </div>
    </Modal>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { Modal, FormField, Input, Select, Button } from '@/components/ui';
import { useAppStore } from '@/lib/store';
import { ClientStatus } from '@/types';

const Building = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="2" width="16" height="20" rx="2" ry="2"/>
    <path d="M9 22v-4h6v4M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M8 10h.01M8 14h.01M16 14h.01"/>
  </svg>
);

interface FormData {
  name: string;
  status: ClientStatus;
}

export function ClientForm() {
  const { activeModal, closeModal, addClient, updateClient, deleteClient, navigateToClients } = useAppStore();

  const isOpen = activeModal?.type === 'client';
  const mode = isOpen ? activeModal.mode : 'create';
  const existingClient = isOpen && activeModal.mode === 'edit' ? activeModal.client : undefined;

  const [formData, setFormData] = useState<FormData>({
    name: '',
    status: 'client'
  });
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (existingClient) {
        setFormData({
          name: existingClient.name,
          status: existingClient.status
        });
      } else {
        setFormData({ name: '', status: 'client' });
      }
      setErrors({});
    }
  }, [isOpen, existingClient]);

  const validate = (): boolean => {
    const newErrors: Partial<FormData> = {};
    if (!formData.name.trim()) newErrors.name = 'Le nom est requis';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    if (mode === 'edit' && existingClient) {
      updateClient(existingClient.id, { name: formData.name.trim() });
      closeModal();
    } else {
      const result = await addClient({ name: formData.name.trim(), status: 'client' });
      
      if (result?.isExisting) {
        // Client existe déjà, afficher un message
        setFeedback(`"${result.client.name}" existe déjà`);
        setTimeout(() => setFeedback(null), 3000);
        return; // Ne pas fermer la modale
      }
      closeModal();
    }
  };

  const handleDelete = () => {
    if (mode === 'edit' && existingClient) {
      deleteClient(existingClient.id);
      closeModal();
      navigateToClients();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={closeModal}
      onSubmit={handleSubmit}
      title={mode === 'edit' ? 'Modifier le client' : 'Nouveau client'}
      icon={<Building />}
      iconBg="bg-[var(--accent-cyan)]/10"
      iconColor="text-[var(--accent-cyan)]"
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
            {mode === 'edit' ? 'Enregistrer' : 'Ajouter'}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        {/* Message de feedback */}
        {feedback && (
          <div className="px-4 py-3 rounded-lg bg-[var(--accent-amber)]/20 border border-[var(--accent-amber)]/40 text-sm text-[var(--accent-amber)]">
            {feedback}
          </div>
        )}
        
        <FormField label="Nom (entreprise ou contact)" required error={errors.name}>
          <Input
            value={formData.name}
            onChange={e => {
              setFormData(prev => ({ ...prev, name: e.target.value }));
              if (errors.name) setErrors(prev => ({ ...prev, name: undefined }));
              if (feedback) setFeedback(null); // Clear feedback when typing
            }}
            placeholder="Ex: Acme Corp, Marie Dupont..."
            autoFocus
          />
        </FormField>
      </div>
    </Modal>
  );
}

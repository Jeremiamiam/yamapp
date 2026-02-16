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
    status: 'prospect'
  });
  const [errors, setErrors] = useState<Partial<FormData>>({});

  useEffect(() => {
    if (isOpen) {
      if (existingClient) {
        setFormData({
          name: existingClient.name,
          status: existingClient.status
        });
      } else {
        setFormData({ name: '', status: 'prospect' });
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

  const handleSubmit = () => {
    if (!validate()) return;

    if (mode === 'edit' && existingClient) {
      updateClient(existingClient.id, { name: formData.name.trim(), status: formData.status });
    } else {
      addClient({ name: formData.name.trim(), status: formData.status });
    }
    closeModal();
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
      title={mode === 'edit' ? 'Modifier le client' : 'Nouveau client'}
      subtitle="Client / Prospect"
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
        <FormField label="Nom (entreprise ou contact)" required error={errors.name}>
          <Input
            value={formData.name}
            onChange={e => {
              setFormData(prev => ({ ...prev, name: e.target.value }));
              if (errors.name) setErrors(prev => ({ ...prev, name: undefined }));
            }}
            placeholder="Ex: Acme Corp, Marie Dupont..."
            autoFocus
          />
        </FormField>
        <FormField label="Statut">
          <div
            role="group"
            aria-label="Statut du client"
            className="flex rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-secondary)]/60 p-0.5"
          >
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, status: 'prospect' }))}
              className={`flex-1 px-4 py-2.5 text-sm font-semibold rounded-md transition-all ${
                formData.status === 'prospect'
                  ? 'bg-[var(--accent-lime)] text-[var(--bg-primary)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              Prospect
            </button>
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, status: 'client' }))}
              className={`flex-1 px-4 py-2.5 text-sm font-semibold rounded-md transition-all ${
                formData.status === 'client'
                  ? 'bg-[var(--accent-lime)] text-[var(--bg-primary)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              Client
            </button>
          </div>
        </FormField>
      </div>
    </Modal>
  );
}

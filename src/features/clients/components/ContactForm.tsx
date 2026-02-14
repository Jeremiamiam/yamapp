'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal, FormField, Input, Button } from '@/components/ui';
import { useAppStore } from '@/lib/store';
import { ContactSchema, type ContactFormData } from '@/lib/validation';

const User = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

export function ContactForm() {
  const { activeModal, closeModal, addContact, updateContact, deleteContact } = useAppStore();

  const isOpen = activeModal?.type === 'contact';
  const mode = isOpen ? activeModal.mode : 'create';
  const clientId = isOpen ? activeModal.clientId : '';
  const existingContact = isOpen && activeModal.mode === 'edit' ? activeModal.contact : undefined;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ContactFormData>({
    resolver: zodResolver(ContactSchema),
    defaultValues: {
      name: '',
      role: '',
      email: '',
      phone: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (existingContact) {
        reset({
          name: existingContact.name,
          role: existingContact.role,
          email: existingContact.email,
          phone: existingContact.phone ?? '',
        });
      } else {
        reset({ name: '', role: '', email: '', phone: '' });
      }
    }
  }, [isOpen, existingContact, reset]);

  const onSubmit = (data: ContactFormData) => {
    const contactData = {
      name: data.name.trim(),
      role: data.role.trim(),
      email: data.email.trim(),
      phone: data.phone?.trim() || undefined,
    };
    if (mode === 'edit' && existingContact) {
      updateContact(clientId, existingContact.id, contactData);
    } else {
      addContact(clientId, contactData);
    }
    closeModal();
  };

  const handleDelete = () => {
    if (mode === 'edit' && existingContact) {
      deleteContact(clientId, existingContact.id);
      closeModal();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={closeModal}
      title={mode === 'edit' ? 'Modifier le contact' : 'Nouveau contact'}
      subtitle="Contact"
      icon={<User />}
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
          <Button onClick={handleSubmit(onSubmit)}>
            {mode === 'edit' ? 'Enregistrer' : 'Ajouter'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <FormField label="Nom complet" required error={errors.name?.message}>
          <Input
            {...register('name')}
            placeholder="Ex: Marie Dupont"
            autoFocus
          />
        </FormField>
        <FormField label="Rôle / Fonction" required error={errors.role?.message}>
          <Input
            {...register('role')}
            placeholder="Ex: Directrice Marketing"
          />
        </FormField>
        <FormField label="Email" required error={errors.email?.message}>
          <Input
            type="email"
            {...register('email')}
            placeholder="marie@entreprise.com"
          />
        </FormField>
        <FormField label="Téléphone" error={errors.phone?.message}>
          <Input
            type="tel"
            {...register('phone')}
            placeholder="+33 6 12 34 56 78"
          />
        </FormField>
      </form>
    </Modal>
  );
}

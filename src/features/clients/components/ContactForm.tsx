'use client';

import { useState, useEffect } from 'react';
import { Modal, FormField, Input, Button } from '@/components/ui';
import { useAppStore } from '@/lib/store';
import { Contact } from '@/types';

// Icons
const User = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

interface FormData {
  name: string;
  role: string;
  email: string;
  phone: string;
}

export function ContactForm() {
  const { activeModal, closeModal, addContact, updateContact, deleteContact } = useAppStore();
  
  const isOpen = activeModal?.type === 'contact';
  const mode = isOpen ? activeModal.mode : 'create';
  const clientId = isOpen ? activeModal.clientId : '';
  const existingContact = isOpen && activeModal.mode === 'edit' ? activeModal.contact : undefined;
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
    role: '',
    email: '',
    phone: ''
  });
  
  const [errors, setErrors] = useState<Partial<FormData>>({});
  
  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      if (existingContact) {
        setFormData({
          name: existingContact.name,
          role: existingContact.role,
          email: existingContact.email,
          phone: existingContact.phone || ''
        });
      } else {
        setFormData({ name: '', role: '', email: '', phone: '' });
      }
      setErrors({});
    }
  }, [isOpen, existingContact]);
  
  const validate = (): boolean => {
    const newErrors: Partial<FormData> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Le nom est requis';
    }
    if (!formData.role.trim()) {
      newErrors.role = 'Le rôle est requis';
    }
    if (!formData.email.trim()) {
      newErrors.email = "L'email est requis";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "L'email n'est pas valide";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = () => {
    if (!validate()) return;
    
    const contactData: Omit<Contact, 'id'> = {
      name: formData.name.trim(),
      role: formData.role.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim() || undefined
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
  
  const handleChange = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    // Clear error when user types
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
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
          <Button onClick={handleSubmit}>
            {mode === 'edit' ? 'Enregistrer' : 'Ajouter'}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <FormField label="Nom complet" required error={errors.name}>
          <Input
            value={formData.name}
            onChange={handleChange('name')}
            placeholder="Ex: Marie Dupont"
            autoFocus
          />
        </FormField>
        
        <FormField label="Rôle / Fonction" required error={errors.role}>
          <Input
            value={formData.role}
            onChange={handleChange('role')}
            placeholder="Ex: Directrice Marketing"
          />
        </FormField>
        
        <FormField label="Email" required error={errors.email}>
          <Input
            type="email"
            value={formData.email}
            onChange={handleChange('email')}
            placeholder="marie@entreprise.com"
          />
        </FormField>
        
        <FormField label="Téléphone" error={errors.phone}>
          <Input
            type="tel"
            value={formData.phone}
            onChange={handleChange('phone')}
            placeholder="+33 6 12 34 56 78"
          />
        </FormField>
      </div>
    </Modal>
  );
}

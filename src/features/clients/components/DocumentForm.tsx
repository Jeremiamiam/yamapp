'use client';

import { useState, useEffect, useRef } from 'react';
import { Modal, FormField, Input, Textarea, Select, Button } from '@/components/ui';
import { useAppStore } from '@/lib/store';
import { DocumentType, ClientDocument } from '@/types';
import { parseStructuredDocument } from '@/types/document-templates';

// Icons
const Upload = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="17 8 12 3 7 8"/>
    <line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
);

const FileText = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
  </svg>
);

interface FormData {
  type: DocumentType;
  title: string;
  content: string;
}

export function DocumentForm() {
  const { activeModal, closeModal, addDocument, updateDocument, deleteDocument } = useAppStore();
  
  const isOpen = activeModal?.type === 'document';
  const mode = isOpen ? activeModal.mode : 'create';
  const clientId = isOpen ? activeModal.clientId : '';
  const existingDoc = isOpen && activeModal.mode === 'edit' ? activeModal.document : undefined;
  
  const [formData, setFormData] = useState<FormData>({
    type: 'note',
    title: '',
    content: ''
  });
  
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      if (existingDoc) {
        setFormData({
          type: existingDoc.type,
          title: existingDoc.title,
          content: existingDoc.content
        });
      } else {
        setFormData({ type: 'note', title: '', content: '' });
      }
      setErrors({});
    }
  }, [isOpen, existingDoc]);
  
  const validate = (): boolean => {
    const newErrors: Partial<FormData> = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Le titre est requis';
    }
    if (!formData.content.trim()) {
      newErrors.content = 'Le contenu est requis';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = () => {
    if (!validate()) return;
    
    const docData: Omit<ClientDocument, 'id' | 'createdAt' | 'updatedAt'> = {
      type: formData.type,
      title: formData.title.trim(),
      content: formData.content.trim()
    };
    
    if (mode === 'edit' && existingDoc) {
      updateDocument(clientId, existingDoc.id, docData);
    } else {
      addDocument(clientId, docData);
    }
    
    closeModal();
  };
  
  const handleDelete = () => {
    if (mode === 'edit' && existingDoc) {
      deleteDocument(clientId, existingDoc.id);
      closeModal();
    }
  };

  const handleJsonUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    setUploadError(null);
    if (!file) return;
    if (formData.type !== 'brief' && formData.type !== 'report') return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = reader.result as string;
        const parsed = parseStructuredDocument(text, formData.type);
        if (!parsed) {
          setUploadError('Le JSON ne respecte pas le template attendu. Voir docs/json-templates-ia.md');
          return;
        }
        setFormData(prev => ({
          ...prev,
          title: parsed.title,
          content: text
        }));
        setErrors(prev => ({ ...prev, title: undefined, content: undefined }));
      } catch {
        setUploadError('Fichier JSON invalide.');
      }
    };
    reader.readAsText(file, 'UTF-8');
  };

  const getTypeStyle = (type: DocumentType) => {
    switch (type) {
      case 'brief':
        return { bg: 'bg-[var(--accent-cyan)]/10', color: 'text-[var(--accent-cyan)]' };
      case 'report':
        return { bg: 'bg-[var(--accent-amber)]/10', color: 'text-[var(--accent-amber)]' };
      default:
        return { bg: 'bg-[var(--accent-violet)]/10', color: 'text-[var(--accent-violet)]' };
    }
  };
  
  const typeStyle = getTypeStyle(formData.type);
  
  const typeOptions = [
    { value: 'brief', label: '📋 Brief' },
    { value: 'report', label: '🎙️ Report PLAUD' },
    { value: 'note', label: '📝 Note' }
  ];
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={closeModal}
      title={mode === 'edit' ? 'Modifier le document' : 'Nouveau document'}
      subtitle="Document"
      icon={<FileText />}
      iconBg={typeStyle.bg}
      iconColor={typeStyle.color}
      size="lg"
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
        <FormField label="Type de document" required>
          <Select
            value={formData.type}
            onChange={e => {
              setFormData(prev => ({ ...prev, type: e.target.value as DocumentType }));
              setUploadError(null);
            }}
            options={typeOptions}
          />
        </FormField>

        {(formData.type === 'brief' || formData.type === 'report') && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[var(--text-secondary)]">
              Importer un JSON (output IA)
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleJsonUpload}
              className="hidden"
            />
            <Button
              type="button"
              variant="secondary"
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2"
            >
              <Upload />
              Choisir un fichier .json
            </Button>
            <p className="text-[10px] text-[var(--text-muted)]">
              Le JSON doit respecter le template {formData.type === 'brief' ? 'Brief' : 'Report PLAUD'} (voir docs/json-templates-ia.md).
            </p>
            {uploadError && (
              <p className="text-xs text-[var(--accent-magenta)]">{uploadError}</p>
            )}
          </div>
        )}
        
        <FormField label="Titre" required error={errors.title}>
          <Input
            value={formData.title}
            onChange={e => {
              setFormData(prev => ({ ...prev, title: e.target.value }));
              if (errors.title) setErrors(prev => ({ ...prev, title: undefined }));
            }}
            placeholder={
              formData.type === 'brief' ? "Ex: Brief identité visuelle 2026" :
              formData.type === 'report' ? "Ex: Call kick-off 13/02" :
              "Ex: Notes réunion stratégie"
            }
            autoFocus
          />
        </FormField>
        
        <FormField label="Contenu" required error={errors.content}>
          <Textarea
            value={formData.content}
            onChange={e => {
              setFormData(prev => ({ ...prev, content: e.target.value }));
              if (errors.content) setErrors(prev => ({ ...prev, content: undefined }));
            }}
            placeholder={
              formData.type === 'brief' ? "Objectifs, contexte, livrables attendus..." :
              formData.type === 'report' ? "Transcription de l'appel, points clés discutés..." :
              "Contenu de la note..."
            }
            rows={8}
          />
        </FormField>
      </div>
    </Modal>
  );
}

'use client';

import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal, FormField, Input, Textarea, Select, Button } from '@/components/ui';
import { useAppStore } from '@/lib/store';
import { getDocumentTypeStyle } from '@/lib/styles';
import { DocumentSchema, type DocumentFormData } from '@/lib/validation';
import { DocumentType, ClientDocument } from '@/types';
import { parseStructuredDocument, ReportPlaudTemplate } from '@/types/document-templates';

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

const typeOptions = [
  { value: 'brief', label: '📋 Brief' },
  { value: 'report', label: '🎙️ Report PLAUD' },
  { value: 'note', label: '📝 Note' },
] as const;

export function DocumentForm() {
  const { activeModal, closeModal, addDocument, updateDocument, deleteDocument } = useAppStore();
  const isOpen = activeModal?.type === 'document';
  const mode = isOpen ? activeModal.mode : 'create';
  const clientId = isOpen ? activeModal.clientId : '';
  const existingDoc = isOpen && activeModal.mode === 'edit' ? activeModal.document : undefined;

  const [uploadError, setUploadError] = useState<string | null>(null);
  const [transcriptContent, setTranscriptContent] = useState('');
  const [transcriptFileName, setTranscriptFileName] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const transcriptInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<DocumentFormData>({
    resolver: zodResolver(DocumentSchema),
    defaultValues: { type: 'note', title: '', content: '' },
  });

  const type = watch('type');

  useEffect(() => {
    if (isOpen) {
      if (existingDoc) {
        reset({
          type: existingDoc.type,
          title: existingDoc.title,
          content: existingDoc.content,
        });
      } else {
        reset({ type: 'note', title: '', content: '' });
      }
      setUploadError(null);
      setTranscriptContent('');
      setTranscriptFileName('');
      setAnalyzeError(null);
    }
  }, [isOpen, existingDoc, reset]);

  const onSubmit = (data: DocumentFormData) => {
    const docData: Omit<ClientDocument, 'id' | 'createdAt' | 'updatedAt'> = {
      type: data.type,
      title: data.title.trim(),
      content: data.content.trim(),
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

  const handleTranscriptFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setTranscriptContent(reader.result as string);
      setTranscriptFileName(file.name);
      setAnalyzeError(null);
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleAnalyze = async () => {
    if (!transcriptContent.trim()) return;
    setIsAnalyzing(true);
    setAnalyzeError(null);
    try {
      const res = await fetch('/api/analyze-plaud', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: transcriptContent }),
      });
      const data = (await res.json()) as ReportPlaudTemplate & { error?: string };
      if (!res.ok || data.error) {
        setAnalyzeError(data.error ?? 'Erreur lors de l\'analyse.');
        return;
      }
      setValue('title', data.title);
      setValue('content', JSON.stringify(data, null, 2));
      setTranscriptContent('');
      setTranscriptFileName('');
    } catch {
      setAnalyzeError('Impossible de contacter l\'API. Vérifie ta connexion.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleJsonUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    setUploadError(null);
    if (!file || (type !== 'brief' && type !== 'report')) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = reader.result as string;
        const parsed = parseStructuredDocument(text, type);
        if (!parsed) {
          setUploadError('Le JSON ne respecte pas le template attendu. Voir docs/json-templates-ia.md');
          return;
        }
        setValue('title', parsed.title);
        setValue('content', text);
      } catch {
        setUploadError('Fichier JSON invalide.');
      }
    };
    reader.readAsText(file, 'UTF-8');
  };

  const typeStyle = getDocumentTypeStyle(type);

  return (
    <Modal
      isOpen={isOpen}
      onClose={closeModal}
      onSubmit={handleSubmit(onSubmit)}
      title={mode === 'edit' ? 'Modifier le document' : 'Nouveau document'}
      subtitle="Document"
      icon={<FileText />}
      iconBg={typeStyle.bg}
      iconColor={typeStyle.text}
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
          <Button onClick={handleSubmit(onSubmit)}>
            {mode === 'edit' ? 'Enregistrer' : 'Créer'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <FormField label="Type de document" required>
          <Select
            value={type}
            onChange={(e) => {
              setValue('type', e.target.value as DocumentType);
              setUploadError(null);
            }}
            options={[...typeOptions]}
          />
        </FormField>

        {type === 'report' && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[var(--text-secondary)]">
              Analyser avec Claude
            </label>
            <input
              ref={transcriptInputRef}
              type="file"
              accept=".txt,.md,text/plain,text/markdown"
              onChange={handleTranscriptFile}
              className="hidden"
            />
            {transcriptFileName ? (
              <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-[var(--bg-tertiary)] text-sm border border-[var(--border-subtle)]">
                <span className="text-[var(--text-secondary)] truncate">{transcriptFileName}</span>
                <button
                  type="button"
                  onClick={() => { setTranscriptContent(''); setTranscriptFileName(''); }}
                  className="text-[var(--text-muted)] hover:text-[var(--accent-magenta)] ml-2 flex-shrink-0 transition-colors"
                >✕</button>
              </div>
            ) : (
              <Button
                type="button"
                variant="secondary"
                onClick={() => transcriptInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2"
              >
                <Upload />
                Charger transcript .txt / .md
              </Button>
            )}
            <Button
              type="button"
              variant="secondary"
              onClick={handleAnalyze}
              disabled={isAnalyzing || !transcriptContent.trim()}
              className="w-full flex items-center justify-center gap-2"
            >
              {isAnalyzing ? 'Analyse en cours...' : '✦ Analyser avec Claude'}
            </Button>
            {analyzeError && (
              <p className="text-xs text-[var(--accent-magenta)]">{analyzeError}</p>
            )}
            <div className="flex items-center gap-3 py-1">
              <div className="h-px flex-1 bg-[var(--border)]" />
              <span className="text-[10px] text-[var(--text-muted)]">ou importer un JSON</span>
              <div className="h-px flex-1 bg-[var(--border)]" />
            </div>
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
            {uploadError && (
              <p className="text-xs text-[var(--accent-magenta)]">{uploadError}</p>
            )}
          </div>
        )}

        {type === 'brief' && (
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
              Le JSON doit respecter le template Brief (voir docs/json-templates-ia.md).
            </p>
            {uploadError && (
              <p className="text-xs text-[var(--accent-magenta)]">{uploadError}</p>
            )}
          </div>
        )}

        <FormField label="Titre" required error={errors.title?.message}>
          <Input
            {...register('title')}
            placeholder={
              type === 'brief' ? 'Ex: Brief identité visuelle 2026' :
              type === 'report' ? 'Ex: Call kick-off 13/02' :
              'Ex: Notes réunion stratégie'
            }
            autoFocus
          />
        </FormField>
        <FormField label="Contenu" required error={errors.content?.message}>
          <Textarea
            {...register('content')}
            placeholder={
              type === 'brief' ? 'Objectifs, contexte, produits attendus...' :
              type === 'report' ? "Transcription de l'appel, points clés discutés..." :
              'Contenu de la note...'
            }
            rows={8}
          />
        </FormField>
      </form>
    </Modal>
  );
}

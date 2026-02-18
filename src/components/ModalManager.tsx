'use client';

import { useAppStore } from '@/lib/store';
import { ContactForm, DocumentForm, DeliverableForm, CallForm, ClientForm, ReportUploadModal } from '@/features/clients/components';
import { ProjectModal } from '@/features/production/components/ProjectModal';

/**
 * Centralise tous les modals CRUD de l'app.
 * Affiche le bon formulaire selon activeModal du store.
 */
export function ModalManager() {
  const activeModal = useAppStore((state) => state.activeModal);
  const closeModal = useAppStore((state) => state.closeModal);

  if (!activeModal) return null;

  switch (activeModal.type) {
    case 'contact':
      return <ContactForm />;
    case 'document':
      return <DocumentForm />;
    case 'report-upload':
      return <ReportUploadModal />;
    case 'deliverable':
      return <DeliverableForm />;
    case 'call':
      return <CallForm />;
    case 'client':
      return <ClientForm />;
    case 'project':
      return (
        <ProjectModal
          project={activeModal.project}
          presetClientId={activeModal.presetClientId}
          initialTab={activeModal.initialTab}
          onClose={closeModal}
        />
      );
    default:
      return null;
  }
}

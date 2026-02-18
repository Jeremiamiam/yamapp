import { useAppStore } from '@/lib/store';
import type { Contact, ClientDocument, Deliverable, Call, ClientStatus, Project } from '@/types';
import type { CallType } from '@/types';

/**
 * Hook simplifié pour gérer l'ouverture/fermeture des modals
 * Évite de répéter les objets de configuration partout
 */
export function useModal() {
  const openModal = useAppStore((state) => state.openModal);
  const closeModal = useAppStore((state) => state.closeModal);

  return {
    openContactModal: (clientId: string, contact?: Contact, presetContact?: Partial<Contact>) =>
      openModal({
        type: 'contact',
        mode: contact ? 'edit' : 'create',
        clientId,
        contact,
        presetContact,
      }),

    openDocumentModal: (clientId: string, document?: ClientDocument) =>
      openModal({
        type: 'document',
        mode: document ? 'edit' : 'create',
        clientId,
        document,
      }),

    openReportUploadModal: (clientId: string) =>
      openModal({ type: 'report-upload', clientId }),

    openDeliverableModal: (clientId: string | undefined, deliverable?: Deliverable) =>
      openModal({
        type: 'deliverable',
        mode: deliverable ? 'edit' : 'create',
        clientId,
        deliverable,
      }),

    openCallModal: (clientId: string | undefined, call?: Call, presetCallType?: CallType) =>
      openModal({
        type: 'call',
        mode: call ? 'edit' : 'create',
        clientId,
        call,
        presetCallType,
      }),

    openClientModal: (presetStatus?: ClientStatus) =>
      openModal({ type: 'client', mode: 'create', presetStatus }),

    openProjectModal: (presetClientId?: string, project?: Project, initialTab?: 'projet' | 'billing') =>
      openModal({ type: 'project', presetClientId, project, initialTab }),

    closeModal,
  };
}

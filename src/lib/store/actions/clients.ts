import type { StateCreator } from 'zustand';
import type { AppState } from '../types';
import type { Client, ClientStatus, ClientLink, Contact, ClientDocument, DocumentVersion } from '@/types';
import { handleError, AppError, getErrorMessage } from '@/lib/error-handler';
import { createClient } from '@/lib/supabase/client';
import {
  toSupabaseClient,
  toSupabaseContact,
  toSupabaseClientLink,
  toSupabaseDocument,
  mapDocumentVersionRow,
} from '@/lib/supabase-mappers';

type ClientsActionsKeys =
  | 'addContact' | 'updateContact' | 'deleteContact'
  | 'addClient' | 'updateClient' | 'deleteClient'
  | 'addClientLink' | 'deleteClientLink'
  | 'addDocument' | 'updateDocument' | 'deleteDocument'
  | 'saveDocumentVersion' | 'updateDocumentVersion' | 'loadDocumentVersions';

export const createClientsActions: StateCreator<AppState, [], [], Pick<AppState, ClientsActionsKeys>> = (set, get) => ({
  addContact: async (clientId, contactData) => {
    try {
      const id = `contact-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const supabase = createClient();
      const { error } = await supabase.from('contacts').insert({
        id,
        client_id: clientId,
        ...toSupabaseContact(contactData),
      });
      if (error) throw error;
      const contact: Contact = { ...contactData, id };
      set((state) => ({
        clients: state.clients.map((client) =>
          client.id === clientId
            ? { ...client, contacts: [...client.contacts, contact], updatedAt: new Date() }
            : client
        ),
      }));
    } catch (e) {
      handleError(new AppError(getErrorMessage(e), 'CONTACT_ADD_FAILED', "Impossible d'ajouter le contact"));
    }
  },

  updateContact: async (clientId, contactId, data) => {
    try {
      const supabase = createClient();
      const payload: Record<string, unknown> = {};
      if (data.name !== undefined) payload.name = data.name;
      if (data.role !== undefined) payload.role = data.role;
      if (data.email !== undefined) payload.email = data.email;
      if (data.phone !== undefined) payload.phone = data.phone;
      const { error } = await supabase.from('contacts').update(payload).eq('id', contactId).eq('client_id', clientId);
      if (error) throw error;
      set((state) => ({
        clients: state.clients.map((client) =>
          client.id === clientId
            ? {
                ...client,
                contacts: client.contacts.map((c) => (c.id === contactId ? { ...c, ...data } : c)),
                updatedAt: new Date(),
              }
            : client
        ),
      }));
    } catch (e) {
      handleError(new AppError(getErrorMessage(e), 'CONTACT_UPDATE_FAILED', "Impossible de modifier le contact"));
    }
  },

  deleteContact: async (clientId, contactId) => {
    try {
      const supabase = createClient();
      const { error } = await supabase.from('contacts').delete().eq('id', contactId).eq('client_id', clientId);
      if (error) throw error;
      set((state) => ({
        clients: state.clients.map((client) =>
          client.id === clientId
            ? { ...client, contacts: client.contacts.filter((c) => c.id !== contactId), updatedAt: new Date() }
            : client
        ),
      }));
    } catch (e) {
      handleError(new AppError(getErrorMessage(e), 'CONTACT_DELETE_FAILED', "Impossible de supprimer le contact"));
    }
  },

  addClientLink: async (clientId, linkData) => {
    try {
      const id = `link-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const supabase = createClient();
      const { error } = await supabase.from('client_links').insert({
        id,
        client_id: clientId,
        ...toSupabaseClientLink(linkData),
      });
      if (error) throw error;
      const link: ClientLink = { ...linkData, id };
      set((state) => ({
        clients: state.clients.map((client) =>
          client.id === clientId
            ? { ...client, links: [...(client.links ?? []), link], updatedAt: new Date() }
            : client
        ),
      }));
    } catch (e) {
      handleError(new AppError(getErrorMessage(e), 'LINK_ADD_FAILED', "Impossible d'ajouter le lien"));
    }
  },

  deleteClientLink: async (clientId, linkId) => {
    try {
      const supabase = createClient();
      const { error } = await supabase.from('client_links').delete().eq('id', linkId).eq('client_id', clientId);
      if (error) throw error;
      set((state) => ({
        clients: state.clients.map((client) =>
          client.id === clientId
            ? { ...client, links: (client.links ?? []).filter((l) => l.id !== linkId), updatedAt: new Date() }
            : client
        ),
      }));
    } catch (e) {
      handleError(new AppError(getErrorMessage(e), 'LINK_DELETE_FAILED', "Impossible de supprimer le lien"));
    }
  },

  addClient: async (data: { name: string; status: ClientStatus }): Promise<{ client: Client; isExisting: boolean } | undefined> => {
    try {
      const trimmedName = data.name.trim().toLowerCase();
      const existingClient = get().clients.find((c) => c.name.trim().toLowerCase() === trimmedName);
      if (existingClient) {
        return { client: existingClient, isExisting: true };
      }
      const id = `client-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const supabase = createClient();
      const { error } = await supabase.from('clients').insert({
        id,
        ...toSupabaseClient(data),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
      const client: Client = {
        id,
        name: data.name.trim(),
        status: data.status,
        contacts: [],
        documents: [],
        links: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      set((state) => ({ clients: [...state.clients, client] }));
      return { client, isExisting: false };
    } catch (e) {
      handleError(new AppError(getErrorMessage(e), 'CLIENT_ADD_FAILED', "Impossible d'ajouter le client"));
      return undefined;
    }
  },

  updateClient: async (id, data) => {
    try {
      const supabase = createClient();
      const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (data.name !== undefined) payload.name = data.name.trim();
      if (data.status !== undefined) payload.status = data.status;
      const { error } = await supabase.from('clients').update(payload).eq('id', id);
      if (error) throw error;
      set((state) => ({
        clients: state.clients.map((c) => (c.id === id ? { ...c, ...data, updatedAt: new Date() } : c)),
      }));
    } catch (e) {
      handleError(new AppError(getErrorMessage(e), 'CLIENT_UPDATE_FAILED', "Impossible de modifier le client"));
    }
  },

  deleteClient: async (id) => {
    try {
      const supabase = createClient();
      const { error } = await supabase.from('clients').delete().eq('id', id);
      if (error) throw error;
      set((state) => ({
        clients: state.clients.filter((c) => c.id !== id),
        deliverables: state.deliverables.filter((d) => d.clientId !== id),
        calls: state.calls.filter((c) => c.clientId !== id),
        selectedClientId: state.selectedClientId === id ? null : state.selectedClientId,
      }));
    } catch (e) {
      handleError(new AppError(getErrorMessage(e), 'CLIENT_DELETE_FAILED', "Impossible de supprimer le client"));
    }
  },

  addDocument: async (clientId, docData, projectId?) => {
    const id = `doc-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const now = new Date();
    const docWithProject: ClientDocument = { ...docData, id, projectId: projectId ?? undefined, createdAt: now, updatedAt: now };
    try {
      const supabase = createClient();
      const insertPayload: Record<string, unknown> = {
        id,
        client_id: clientId,
        type: docData.type,
        title: docData.title,
        content: docData.content ?? '',
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      };
      if (projectId) insertPayload.project_id = projectId;
      const { error } = await supabase.from('documents').insert(insertPayload);
      if (error) throw error;
      set((state) => ({
        clients: state.clients.map((client) =>
          client.id === clientId ? { ...client, documents: [...client.documents, docWithProject], updatedAt: now } : client
        ),
      }));
      return docWithProject;
    } catch (e) {
      handleError(new AppError(getErrorMessage(e), 'DOC_ADD_FAILED', "Impossible d'ajouter le document"));
      throw e;
    }
  },

  updateDocument: async (clientId, docId, data) => {
    try {
      const supabase = createClient();
      const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (data.type !== undefined) payload.type = data.type;
      if (data.title !== undefined) payload.title = data.title;
      if (data.content !== undefined) payload.content = data.content;
      const { error } = await supabase.from('documents').update(payload).eq('id', docId).eq('client_id', clientId);
      if (error) throw error;
      set((state) => ({
        clients: state.clients.map((client) =>
          client.id === clientId
            ? {
                ...client,
                documents: client.documents.map((d) => (d.id === docId ? { ...d, ...data, updatedAt: new Date() } : d)),
                updatedAt: new Date(),
              }
            : client
        ),
        selectedDocument:
          state.selectedDocument?.id === docId ? { ...state.selectedDocument, ...data, updatedAt: new Date() } : state.selectedDocument,
      }));
    } catch (e) {
      handleError(new AppError(getErrorMessage(e), 'DOC_UPDATE_FAILED', "Impossible de modifier le document"));
    }
  },

  deleteDocument: async (clientId, docId) => {
    try {
      const supabase = createClient();
      const { error } = await supabase.from('documents').delete().eq('id', docId).eq('client_id', clientId);
      if (error) throw error;
      set((state) => ({
        clients: state.clients.map((client) =>
          client.id === clientId
            ? { ...client, documents: client.documents.filter((d) => d.id !== docId), updatedAt: new Date() }
            : client
        ),
        selectedDocument: state.selectedDocument?.id === docId ? null : state.selectedDocument,
      }));
    } catch (e) {
      handleError(new AppError(getErrorMessage(e), 'DOC_DELETE_FAILED', "Impossible de supprimer le document"));
    }
  },

  saveDocumentVersion: async (docId, currentContent, label?) => {
    const supabase = createClient();
    // Récupère le numéro de version max existant pour ce document
    const { data: existing } = await supabase
      .from('document_versions')
      .select('version_number')
      .eq('document_id', docId)
      .order('version_number', { ascending: false })
      .limit(1);
    const nextVersion = existing && existing.length > 0 ? (existing[0] as { version_number: number }).version_number + 1 : 1;
    const id = `docv-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const now = new Date();
    const { error } = await supabase.from('document_versions').insert({
      id,
      document_id: docId,
      version_number: nextVersion,
      label: label ?? null,
      content: currentContent,
      created_at: now.toISOString(),
    });
    if (error) throw new AppError(error.message, 'VERSION_SAVE_FAILED', 'Impossible de sauvegarder la version');
    const version: DocumentVersion = {
      id,
      documentId: docId,
      versionNumber: nextVersion,
      label: label ?? undefined,
      content: currentContent,
      createdAt: now,
    };
    return version;
  },

  updateDocumentVersion: async (versionId, content) => {
    const supabase = createClient();
    const { error } = await supabase
      .from('document_versions')
      .update({ content })
      .eq('id', versionId);
    if (error) throw new AppError(error.message, 'VERSION_UPDATE_FAILED', 'Impossible de mettre à jour la version');
  },

  loadDocumentVersions: async (docId) => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('document_versions')
      .select('*')
      .eq('document_id', docId)
      .order('version_number', { ascending: false });
    if (error) throw new AppError(error.message, 'VERSION_LOAD_FAILED', 'Impossible de charger les versions');
    return (data ?? []).map(mapDocumentVersionRow);
  },
});

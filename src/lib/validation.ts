/**
 * Schémas Zod pour la validation des formulaires.
 * Utilisés avec react-hook-form via @hookform/resolvers/zod.
 */

import { z } from 'zod';

export const ContactSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  role: z.string().min(1, 'Le rôle est requis'),
  email: z.string().min(1, "L'email est requis").email("L'email n'est pas valide"),
  phone: z.string().optional(),
});

export const DocumentSchema = z.object({
  type: z.enum(['brief', 'report', 'note']),
  title: z.string().min(1, 'Le titre est requis'),
  content: z.string().min(1, 'Le contenu est requis'),
});

export const CallSchema = z.object({
  title: z.string().min(1, 'Le titre est requis'),
  selectedClientId: z.string().optional(),
  callType: z.enum(['call', 'presentation']),
  toBacklog: z.boolean(),
  scheduledDate: z.string().optional(),
  scheduledTime: z.string().optional(),
  duration: z.number().min(15, 'Minimum 15 minutes'),
  assigneeId: z.string().optional(),
  notes: z.string().optional(),
}).refine(
  (data) => data.toBacklog || (data.scheduledDate && data.scheduledDate.trim() !== ''),
  { message: 'La date est requise (ou cochez « À planifier plus tard »)', path: ['scheduledDate'] }
);

export const DeliverableSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  selectedClientId: z.string().optional(),
  toBacklog: z.boolean(),
  dueDate: z.string().optional(),
  dueTime: z.string().optional(),
  type: z.enum(['creative', 'document', 'other']),
  status: z.enum(['pending', 'in-progress', 'completed']),
  assigneeId: z.string().optional(),
  category: z.enum(['print', 'digital', 'other']),
  prixFacturé: z.string().optional(),
  coutSousTraitance: z.string().optional(),
  deliveredAt: z.string().optional(),
  externalContractor: z.string().optional(),
  notes: z.string().optional(),
}).refine(
  (data) => data.toBacklog || (data.dueDate && data.dueDate.trim() !== ''),
  { message: 'La date est requise (ou cochez « À planifier plus tard »)', path: ['dueDate'] }
);

export type ContactFormData = z.infer<typeof ContactSchema>;
export type DocumentFormData = z.infer<typeof DocumentSchema>;
export type CallFormData = z.infer<typeof CallSchema>;
export type DeliverableFormData = z.infer<typeof DeliverableSchema>;

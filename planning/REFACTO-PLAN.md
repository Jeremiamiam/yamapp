# Phase 3.7: Code Quality & Refactoring - Plan Détaillé

**Objectif :** Nettoyer l'architecture et optimiser les performances avant la Phase 5 Mobile

**Durée estimée :** 3 jours

---

## 📅 JOUR 1 - Architecture & Components

### Objectif
Décomposer ClientDetail et centraliser les modals

### Tâches

#### 1.1 - Créer ModalManager centralisé (1h)

**Fichier à créer :** `src/components/ModalManager.tsx`

```typescript
// Centralise TOUS les modals de l'app
// Un seul point de rendu selon activeModal du store
// Remplace les duplications dans page.tsx

export function ModalManager() {
  const { activeModal, closeModal } = useAppStore();

  if (!activeModal) return null;

  switch (activeModal.type) {
    case 'contact':
      return <ContactForm mode={activeModal.mode} clientId={activeModal.clientId} contact={activeModal.contact} />;
    case 'document':
      return <DocumentForm mode={activeModal.mode} clientId={activeModal.clientId} document={activeModal.document} />;
    case 'deliverable':
      return <DeliverableForm mode={activeModal.mode} clientId={activeModal.clientId} deliverable={activeModal.deliverable} />;
    case 'call':
      return <CallForm mode={activeModal.mode} clientId={activeModal.clientId} call={activeModal.call} />;
    default:
      return null;
  }
}
```

**Action Cursor :**
```
Crée src/components/ModalManager.tsx qui centralise tous les modals.
Utilise le store activeModal pour afficher le bon modal.
```

#### 1.2 - Nettoyer page.tsx (30min)

**Fichier à modifier :** `src/app/page.tsx`

- Supprimer toutes les duplications de modals
- Garder un seul `<ModalManager />` à la racine
- Simplifier le code (devrait passer de ~150 lignes à ~50 lignes)

**Action Cursor :**
```
Dans page.tsx, supprime tous les modals dupliqués.
Ajoute <ModalManager /> une seule fois après le contenu principal.
```

#### 1.3 - Décomposer ClientDetail - Partie 1 (3h)

**Objectif :** Passer de 802 lignes à ~150 lignes dans ClientDetail.tsx

**Fichiers à créer :**

1. `src/features/clients/components/sections/ContactsSection.tsx` (~120 lignes)
   - Gère liste contacts + ajout/édition/suppression
   - Appelle directement le store (pas de props drilling)

2. `src/features/clients/components/sections/DocumentsSection.tsx` (~150 lignes)
   - Gère liste documents + ouverture modal
   - Types de documents (brief, report, note)

3. `src/features/clients/components/sections/LinksSection.tsx` (~100 lignes)
   - Gère liens externes (Figma, sites, etc.)
   - Ajout/suppression de liens

**Action Cursor :**
```
Extrais la section Contacts de ClientDetail.tsx dans src/features/clients/components/sections/ContactsSection.tsx.
Le composant doit :
- Recevoir clientId en prop
- Appeler useAppStore() directement pour les contacts
- Gérer l'ouverture du modal contact via openModal()
- Afficher la liste avec possibilité d'éditer/supprimer

Fais pareil pour DocumentsSection et LinksSection.
```

#### 1.4 - Décomposer ClientDetail - Partie 2 (2h)

**Fichiers à créer :**

4. `src/features/clients/components/sections/ActivitySection.tsx` (~200 lignes)
   - Timeline d'activité (deliverables + calls fusionnés)
   - Filtre passé/futur
   - Styles de date

5. `src/features/clients/components/sections/DeliverablesSection.tsx` (~150 lignes)
   - Liste des deliverables groupés par statut
   - Toggle status inline
   - Ouverture modal deliverable

**Action Cursor :**
```
Extrais la section Activity Timeline de ClientDetail.tsx dans ActivitySection.tsx.
Extrais la section Deliverables dans DeliverablesSection.tsx.

Chaque section doit être autonome et appeler le store directement.
```

#### 1.5 - Refactoriser ClientDetail final (1h)

**Fichier à modifier :** `src/features/clients/components/ClientDetail.tsx`

Après extraction, ClientDetail devient un orchestrateur léger :

```typescript
export function ClientDetail() {
  const { selectedClientId, navigateToTimeline } = useAppStore();
  const client = useAppStore(state => state.getClientById(selectedClientId!));

  if (!client) return null;

  return (
    <div className="...">
      <Header client={client} onBack={navigateToTimeline} />

      <ContactsSection clientId={client.id} />
      <LinksSection clientId={client.id} />
      <DocumentsSection clientId={client.id} />
      <ActivitySection clientId={client.id} />
      <DeliverablesSection clientId={client.id} />
    </div>
  );
}
```

**Action Cursor :**
```
Refactorise ClientDetail.tsx pour qu'il devienne un simple orchestrateur.
Importe toutes les sections créées et compose-les.
Le fichier final doit faire < 150 lignes.
```

---

**✅ Checkpoint Jour 1 :**
- [ ] ModalManager créé et fonctionnel
- [ ] page.tsx nettoyé (pas de duplications)
- [ ] ClientDetail décomposé en 5 sections autonomes
- [ ] ClientDetail.tsx < 150 lignes

---

## 📅 JOUR 2 - Performance & Store

### Objectif
Optimiser Timeline et Store pour performances Mobile

### Tâches

#### 2.1 - Créer sélecteurs optimisés dans le store (1h)

**Fichier à modifier :** `src/lib/store.ts`

Ajouter des sélecteurs memoizés :

```typescript
// Sélecteurs pour éviter re-calculs
const selectFilteredDeliverables = (state: AppState) => {
  const { deliverables, filters } = state;
  return deliverables.filter(d => {
    // Logique de filtrage
    if (filters.clientStatus !== 'all') {
      const client = state.getClientById(d.clientId);
      if (client?.status !== filters.clientStatus) return false;
    }
    if (filters.teamMemberId && d.assigneeId !== filters.teamMemberId) {
      return false;
    }
    return true;
  });
};

// Utiliser dans le store
interface AppState {
  // ... existing
  getFilteredDeliverables: () => Deliverable[];
  getFilteredCalls: () => Call[];
}

// Dans le store
getFilteredDeliverables: () => selectFilteredDeliverables(get()),
getFilteredCalls: () => selectFilteredCalls(get()),
```

**Action Cursor :**
```
Dans src/lib/store.ts, crée des sélecteurs optimisés pour :
- getFilteredDeliverables()
- getFilteredCalls()
- getUnscheduledDeliverables()
- getUnscheduledCalls()

Ces sélecteurs doivent prendre en compte les filtres (clientStatus, teamMemberId).
Utilise-les dans les composants au lieu de filtrer inline.
```

#### 2.2 - Optimiser Timeline avec mémoization (3h)

**Fichier à modifier :** `src/features/timeline/components/Timeline.tsx`

Actions à faire :

1. **Mémoriser itemsByDate :**
```typescript
const itemsByDate = useMemo(() => {
  const grouped = new Map<string, TimelineItem[]>();
  // ... logique grouping
  return grouped;
}, [filteredDeliverables, filteredCalls, timelineRange]);
```

2. **Mémoriser getDropTarget :**
```typescript
const getDropTarget = useCallback((clientX: number): Date | null => {
  // ... logique drop
}, [datesWithWidth]);
```

3. **Mémoriser handlers drag :**
```typescript
const handleDragStart = useCallback((e: React.DragEvent, item: TimelineItem) => {
  // ...
}, []);

const handleDragEnd = useCallback(() => {
  // ...
}, [draggedItem]);
```

4. **Mémoriser TimelineCard renders :**
```typescript
// Dans TimelineCard.tsx
export const TimelineCard = memo(function TimelineCard({ item, ... }) {
  // ...
});
```

**Action Cursor :**
```
Optimise src/features/timeline/components/Timeline.tsx avec :
1. useMemo pour itemsByDate (dépendances: filteredDeliverables, filteredCalls, timelineRange)
2. useCallback pour getDropTarget, handleDragStart, handleDragEnd
3. Mémorise TimelineCard avec React.memo

Vérifie que les dépendances sont minimales pour éviter re-calculs inutiles.
```

#### 2.3 - Extraire utilitaires date (1h)

**Fichier à créer :** `src/lib/date-utils.ts`

```typescript
export function formatDate(date: Date, locale = 'fr-FR'): string {
  return date.toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short'
  });
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function formatDocDate(date: Date): string {
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

export function isSameDay(date1: Date, date2: Date): boolean {
  return date1.toDateString() === date2.toDateString();
}

export function isPast(date: Date): boolean {
  return date < new Date();
}

export function isFuture(date: Date): boolean {
  return date > new Date();
}
```

**Action Cursor :**
```
Crée src/lib/date-utils.ts avec les fonctions formatDate, formatTime, formatDocDate, isSameDay, isPast, isFuture.

Ensuite, remplace toutes les utilisations inline dans :
- ClientDetail.tsx (sections)
- DocumentModal.tsx
- Timeline.tsx
- TimelineCard.tsx
```

#### 2.4 - Extraire utilitaires styles (1h)

**Fichier à créer :** `src/lib/styles.ts`

```typescript
import { DeliverableStatus, DeliverableType } from '@/types';

export const STATUS_STYLES = {
  pending: {
    bg: 'bg-[var(--accent-amber)]/20',
    text: 'text-[var(--accent-amber)]',
    border: 'border-[var(--accent-amber)]/30',
    label: 'En attente',
  },
  'in-progress': {
    bg: 'bg-[var(--accent-cyan)]/20',
    text: 'text-[var(--accent-cyan)]',
    border: 'border-[var(--accent-cyan)]/30',
    label: 'En cours',
  },
  completed: {
    bg: 'bg-[var(--accent-green)]/20',
    text: 'text-[var(--accent-green)]',
    border: 'border-[var(--accent-green)]/30',
    label: 'Terminé',
  },
} as const;

export function getStatusStyle(status: DeliverableStatus) {
  return STATUS_STYLES[status];
}

export const CATEGORY_STYLES = {
  creative: {
    bg: 'bg-[var(--accent-magenta)]/20',
    text: 'text-[var(--accent-magenta)]',
    label: 'Créatif',
  },
  document: {
    bg: 'bg-[var(--accent-cyan)]/20',
    text: 'text-[var(--accent-cyan)]',
    label: 'Document',
  },
  other: {
    bg: 'bg-[var(--accent-violet)]/20',
    text: 'text-[var(--accent-violet)]',
    label: 'Autre',
  },
} as const;

export function getCategoryStyle(type: DeliverableType) {
  return CATEGORY_STYLES[type];
}
```

**Action Cursor :**
```
Crée src/lib/styles.ts avec STATUS_STYLES, CATEGORY_STYLES et leurs getters.

Remplace toutes les définitions inline de styles dans :
- ClientDetail sections
- DeliverableForm.tsx
- TimelineCard.tsx
```

---

**✅ Checkpoint Jour 2 :**
- [ ] Store a des sélecteurs optimisés
- [ ] Timeline utilise useMemo/useCallback partout
- [ ] date-utils.ts créé et utilisé partout
- [ ] styles.ts créé et utilisé partout
- [ ] Performance Timeline < 100ms avec 50 items (à tester)

---

## 📅 JOUR 3 - Forms, Errors & Icons

### Objectif
Forms robustes, gestion d'erreurs, et bibliothèque d'icônes

### Tâches

#### 3.1 - Installer react-hook-form + zod (15min)

```bash
npm install react-hook-form zod @hookform/resolvers
```

#### 3.2 - Créer schémas de validation Zod (1h)

**Fichier à créer :** `src/lib/validation.ts`

```typescript
import { z } from 'zod';

export const ContactSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  role: z.string().min(1, 'Le rôle est requis'),
  email: z.string().email('Email invalide'),
  phone: z.string().optional(),
});

export const DeliverableSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  dueDate: z.date(),
  type: z.enum(['creative', 'document', 'other']),
  status: z.enum(['pending', 'in-progress', 'completed']),
  assigneeId: z.string().optional(),
});

export const CallSchema = z.object({
  title: z.string().min(1, 'Le titre est requis'),
  scheduledAt: z.date(),
  duration: z.number().min(15, 'Minimum 15 minutes'),
  assigneeId: z.string().optional(),
  notes: z.string().optional(),
});

export const DocumentSchema = z.object({
  type: z.enum(['brief', 'report', 'note']),
  title: z.string().min(1, 'Le titre est requis'),
  content: z.string().min(1, 'Le contenu est requis'),
});

export type ContactFormData = z.infer<typeof ContactSchema>;
export type DeliverableFormData = z.infer<typeof DeliverableSchema>;
export type CallFormData = z.infer<typeof CallSchema>;
export type DocumentFormData = z.infer<typeof DocumentSchema>;
```

**Action Cursor :**
```
Installe react-hook-form, zod, @hookform/resolvers.
Crée src/lib/validation.ts avec les schémas Zod pour Contact, Deliverable, Call, Document.
```

#### 3.3 - Refactoriser ContactForm avec react-hook-form (1h)

**Fichier à modifier :** `src/features/clients/components/ContactForm.tsx`

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ContactSchema, ContactFormData } from '@/lib/validation';

export function ContactForm({ mode, clientId, contact }: Props) {
  const { addContact, updateContact, closeModal } = useAppStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ContactFormData>({
    resolver: zodResolver(ContactSchema),
    defaultValues: contact || { name: '', role: '', email: '', phone: '' },
  });

  const onSubmit = (data: ContactFormData) => {
    if (mode === 'create') {
      addContact(clientId, data);
    } else {
      updateContact(clientId, contact!.id, data);
    }
    closeModal();
  };

  return (
    <Modal title={mode === 'create' ? 'Nouveau contact' : 'Modifier contact'}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <input {...register('name')} placeholder="Nom" />
        {errors.name && <span className="error">{errors.name.message}</span>}

        <input {...register('email')} type="email" placeholder="Email" />
        {errors.email && <span className="error">{errors.email.message}</span>}

        {/* ... autres champs */}

        <button type="submit">Enregistrer</button>
      </form>
    </Modal>
  );
}
```

**Action Cursor :**
```
Refactorise ContactForm.tsx pour utiliser react-hook-form avec Zod validation.
Supprime tout le useState manual et la validation manuelle.
Affiche les erreurs de validation sous chaque champ.

Fais pareil pour :
- DeliverableForm.tsx
- CallForm.tsx
- DocumentForm.tsx
```

#### 3.4 - Créer bibliothèque d'icônes (2h)

**Fichier à créer :** `src/components/ui/Icons.tsx`

```typescript
import { memo } from 'react';

export const Phone = memo(() => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
));

export const Mail = memo(() => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
));

// ... Tous les autres icônes (User, Plus, X, Calendar, Clock, etc.)
```

**Action Cursor :**
```
Crée src/components/ui/Icons.tsx avec TOUS les icônes utilisés dans l'app :
- Phone, Mail, User, Users
- Plus, X, Edit, Trash
- Calendar, Clock
- ChevronLeft, ChevronRight, ChevronDown
- FileText, Link, ExternalLink
- Check, AlertCircle

Mémorise chaque icône avec React.memo.

Ensuite, remplace toutes les définitions inline d'icônes dans TOUS les composants par des imports de Icons.tsx.
```

#### 3.5 - Ajouter gestion d'erreurs globale (1h)

**Fichier à créer :** `src/lib/error-handler.ts`

```typescript
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public userMessage: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function handleError(error: unknown): void {
  if (error instanceof AppError) {
    // Show user-friendly message
    showNotification(error.userMessage, 'error');
    console.error(`[${error.code}]`, error.message);
  } else if (error instanceof Error) {
    showNotification('Une erreur est survenue', 'error');
    console.error(error);
  } else {
    showNotification('Une erreur inconnue est survenue', 'error');
    console.error(error);
  }
}

// Simple notification system (ou utiliser react-hot-toast)
function showNotification(message: string, type: 'success' | 'error') {
  // TODO: Implémenter avec un toast library
  alert(message); // Temporaire
}
```

**Fichier à modifier :** `src/lib/store.ts`

Wrapper les actions critiques :

```typescript
addDocument: (clientId, docData) => {
  try {
    set(state => ({
      clients: state.clients.map(client =>
        client.id === clientId
          ? {
              ...client,
              documents: [...client.documents, {
                ...docData,
                id: generateId(),
                createdAt: new Date(),
                updatedAt: new Date()
              }],
              updatedAt: new Date()
            }
          : client
      )
    }));
  } catch (error) {
    handleError(new AppError(
      'Failed to add document',
      'DOC_ADD_FAILED',
      'Impossible d\'ajouter le document'
    ));
  }
},
```

**Action Cursor :**
```
Crée src/lib/error-handler.ts avec AppError class et handleError function.

Ajoute try/catch dans toutes les actions du store qui manipulent des données :
- addDocument, updateDocument, deleteDocument
- addContact, updateContact, deleteContact
- addDeliverable, updateDeliverable, deleteDeliverable
- addCall, updateCall, deleteCall

En cas d'erreur, appelle handleError() pour notifier l'utilisateur.
```

---

**✅ Checkpoint Jour 3 :**
- [ ] react-hook-form installé
- [ ] Tous les forms utilisent react-hook-form + Zod
- [ ] Icons.tsx créé avec tous les icônes
- [ ] Pas de duplications d'icônes dans le code
- [ ] Error handling ajouté dans le store
- [ ] Notifications d'erreur fonctionnelles

---

## 🎯 Validation finale (30min)

### Tests à faire après les 3 jours

1. **Performance Timeline**
   ```bash
   # Ouvrir DevTools > Performance
   # Enregistrer render de Timeline avec 50+ items
   # Vérifier < 100ms
   ```

2. **Modals**
   - Ouvrir/fermer tous les types de modals
   - Vérifier pas de duplications dans le DOM (Inspect)

3. **Forms**
   - Tester validation sur chaque form
   - Soumettre avec données invalides → erreurs affichées
   - Soumettre avec données valides → succès

4. **Errors**
   - Provoquer une erreur (ex: donner un JSON invalide)
   - Vérifier notification apparaît

5. **Code quality**
   ```bash
   # Vérifier tailles de fichiers
   wc -l src/features/clients/components/ClientDetail.tsx  # < 150 lignes
   grep -r "console.log" src/  # Pas de console.log
   ```

---

## 📊 Résumé des livrables

### Fichiers créés
- `src/components/ModalManager.tsx`
- `src/features/clients/components/sections/ContactsSection.tsx`
- `src/features/clients/components/sections/DocumentsSection.tsx`
- `src/features/clients/components/sections/LinksSection.tsx`
- `src/features/clients/components/sections/ActivitySection.tsx`
- `src/features/clients/components/sections/DeliverablesSection.tsx`
- `src/lib/date-utils.ts`
- `src/lib/styles.ts`
- `src/lib/validation.ts`
- `src/lib/error-handler.ts`
- `src/components/ui/Icons.tsx`

### Fichiers modifiés
- `src/app/page.tsx` (nettoyé)
- `src/features/clients/components/ClientDetail.tsx` (refactorisé)
- `src/features/timeline/components/Timeline.tsx` (optimisé)
- `src/lib/store.ts` (sélecteurs + error handling)
- `src/features/clients/components/ContactForm.tsx` (react-hook-form)
- `src/features/clients/components/DeliverableForm.tsx` (react-hook-form)
- `src/features/clients/components/CallForm.tsx` (react-hook-form)
- `src/features/clients/components/DocumentForm.tsx` (react-hook-form)

### Métriques de succès
- ✅ ClientDetail < 150 lignes (était 802)
- ✅ Pas de duplications de modals
- ✅ Timeline < 100ms render avec 50 items
- ✅ Pas de duplications d'icônes
- ✅ Forms validés avec Zod
- ✅ Error handling global en place

---

**🚀 Après ces 3 jours, le code sera prêt pour la Phase 5 Mobile !**

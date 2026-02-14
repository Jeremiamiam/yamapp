# Guide Cursor - Phase 3.7 Refactoring

## 🎯 Comment utiliser ce plan

Ce document explique comment donner les instructions à Cursor pour exécuter le plan de refacto.

---

## 📅 JOUR 1 - Instructions pour Cursor

### Étape 1.1 - ModalManager

**Prompt Cursor :**
```
Lis planning/REFACTO-PLAN.md section 1.1.

Crée src/components/ModalManager.tsx qui centralise tous les modals de l'app.
Le composant doit :
- Lire activeModal du store
- Afficher le bon modal selon activeModal.type
- Gérer contact, document, deliverable, call

Référence les composants existants :
- ContactForm
- DocumentForm
- DeliverableForm
- CallForm
```

### Étape 1.2 - Nettoyer page.tsx

**Prompt Cursor :**
```
Dans src/app/page.tsx, supprime toutes les duplications de modals.
Remplace par un seul <ModalManager /> après le contenu principal.
Le fichier devrait passer de ~150 lignes à ~50 lignes.
```

### Étape 1.3 & 1.4 - Décomposer ClientDetail

**Prompt Cursor (partie 1) :**
```
Lis planning/REFACTO-PLAN.md sections 1.3 et 1.4.

Extrais ClientDetail.tsx en 5 sections autonomes dans src/features/clients/components/sections/ :

1. ContactsSection.tsx - gère contacts (ajout/édition/suppression)
2. DocumentsSection.tsx - gère documents
3. LinksSection.tsx - gère liens externes
4. ActivitySection.tsx - timeline d'activité
5. DeliverablesSection.tsx - liste deliverables

Chaque section :
- Reçoit clientId en prop
- Appelle useAppStore() directement (pas de props drilling)
- Gère ses propres modals via openModal()
```

**Prompt Cursor (partie 2) :**
```
Maintenant refactorise ClientDetail.tsx pour qu'il devienne un simple orchestrateur.

Il doit juste :
- Récupérer le client du store
- Composer les 5 sections créées
- Gérer le header et le back button

Le fichier final doit faire < 150 lignes (il fait 802 actuellement).
```

---

## 📅 JOUR 2 - Instructions pour Cursor

### Étape 2.1 - Sélecteurs optimisés

**Prompt Cursor :**
```
Lis planning/REFACTO-PLAN.md section 2.1.

Dans src/lib/store.ts, ajoute des sélecteurs optimisés :
- getFilteredDeliverables() - filtre par clientStatus et teamMemberId
- getFilteredCalls() - filtre par clientStatus et teamMemberId
- getUnscheduledDeliverables() - sans dueDate
- getUnscheduledCalls() - sans scheduledAt

Ces sélecteurs doivent utiliser les filtres du store.
Ensuite, utilise-les dans Timeline.tsx au lieu de filtrer inline.
```

### Étape 2.2 - Optimiser Timeline

**Prompt Cursor :**
```
Lis planning/REFACTO-PLAN.md section 2.2.

Optimise src/features/timeline/components/Timeline.tsx :

1. Wrap itemsByDate dans useMemo (deps: filteredDeliverables, filteredCalls, timelineRange)
2. Wrap getDropTarget dans useCallback (deps: datesWithWidth)
3. Wrap handleDragStart, handleDragEnd dans useCallback
4. Mémorise TimelineCard avec React.memo

Vérifie que les dépendances sont minimales.
```

### Étape 2.3 & 2.4 - Utilitaires

**Prompt Cursor :**
```
Lis planning/REFACTO-PLAN.md sections 2.3 et 2.4.

Crée src/lib/date-utils.ts avec :
- formatDate, formatTime, formatDocDate
- isSameDay, isPast, isFuture

Crée src/lib/styles.ts avec :
- STATUS_STYLES, getStatusStyle
- CATEGORY_STYLES, getCategoryStyle

Ensuite, remplace TOUTES les utilisations inline dans :
- ClientDetail sections
- DocumentModal.tsx
- Timeline.tsx
- TimelineCard.tsx
- DeliverableForm.tsx
```

---

## 📅 JOUR 3 - Instructions pour Cursor

### Étape 3.1 & 3.2 - Setup react-hook-form

**Prompt Cursor :**
```
Installe react-hook-form, zod, @hookform/resolvers :
npm install react-hook-form zod @hookform/resolvers

Lis planning/REFACTO-PLAN.md section 3.2.

Crée src/lib/validation.ts avec les schémas Zod pour :
- ContactSchema
- DeliverableSchema
- CallSchema
- DocumentSchema

Exporte les types inférés.
```

### Étape 3.3 - Refactoriser forms

**Prompt Cursor :**
```
Lis planning/REFACTO-PLAN.md section 3.3.

Refactorise ces forms pour utiliser react-hook-form + Zod :
1. ContactForm.tsx
2. DeliverableForm.tsx
3. CallForm.tsx
4. DocumentForm.tsx

Pour chaque form :
- Supprime useState manual et validation manuelle
- Utilise useForm avec zodResolver
- Affiche errors.fieldName.message sous chaque champ
- Simplifie le code
```

### Étape 3.4 - Icons library

**Prompt Cursor :**
```
Lis planning/REFACTO-PLAN.md section 3.4.

Crée src/components/ui/Icons.tsx avec TOUS les icônes SVG utilisés dans l'app :
- Phone, Mail, User, Users
- Plus, X, Edit, Trash
- Calendar, Clock
- ChevronLeft, ChevronRight, ChevronDown
- FileText, Link, ExternalLink
- Check, AlertCircle

Mémorise chaque icône avec React.memo.

Ensuite, trouve TOUTES les définitions inline d'icônes dans les composants et remplace-les par des imports depuis Icons.tsx.
```

### Étape 3.5 - Error handling

**Prompt Cursor :**
```
Lis planning/REFACTO-PLAN.md section 3.5.

Crée src/lib/error-handler.ts avec :
- AppError class
- handleError function
- showNotification helper

Dans src/lib/store.ts, ajoute try/catch dans toutes les actions CRUD :
- addDocument, updateDocument, deleteDocument
- addContact, updateContact, deleteContact
- addDeliverable, updateDeliverable, deleteDeliverable
- addCall, updateCall, deleteCall

En cas d'erreur, appelle handleError().
```

---

## ✅ Validation après chaque jour

### Après Jour 1
```bash
# Vérifier taille ClientDetail
wc -l src/features/clients/components/ClientDetail.tsx
# Devrait être < 150 lignes

# Vérifier que les modals fonctionnent
# Ouvrir l'app, tester création/édition contact, document, deliverable, call
```

### Après Jour 2
```bash
# Test performance Timeline
# DevTools > Performance > Record
# Timeline avec 50+ items devrait render en < 100ms

# Vérifier que les filtres fonctionnent toujours
```

### Après Jour 3
```bash
# Tester validation forms
# Soumettre chaque form avec données invalides → erreurs affichées

# Vérifier pas de console.log
grep -r "console.log" src/

# Vérifier pas de duplications d'icônes
grep -r "svg width" src/components/ui/Icons.tsx | wc -l  # Devrait être > 10
```

---

## 🚨 Si Cursor rencontre un problème

### Erreur : "Type error avec Zod"
```
Vérifie que @hookform/resolvers est installé.
Vérifie les imports : zodResolver depuis '@hookform/resolvers/zod'
```

### Erreur : "Module not found Icons"
```
Vérifie le chemin : import { Phone } from '@/components/ui/Icons'
Vérifie que Icons.tsx exporte bien les icônes
```

### Erreur : "Store circular dependency"
```
Si date-utils.ts ou styles.ts importent le store, c'est un problème.
Ces fichiers doivent être indépendants du store.
```

---

## 💡 Tips pour travailler avec Cursor

1. **Une tâche à la fois**
   - Fais 1.1, teste, puis 1.2, etc.
   - Ne fais pas tout d'un coup

2. **Utilise @-references**
   - `@REFACTO-PLAN.md` pour référencer le plan
   - `@ClientDetail.tsx` pour référencer le fichier

3. **Vérifie les imports**
   - Après chaque refacto, vérifie que les imports sont corrects
   - Cursor peut oublier de mettre à jour certains imports

4. **Teste après chaque étape**
   - Ouvre l'app dans le browser
   - Teste la fonctionnalité refactorisée
   - Fix les bugs avant de passer à la suite

5. **Git commits réguliers**
   ```bash
   git add .
   git commit -m "refacto: centralise modals (1.1)"
   # Puis continue avec 1.2
   ```

---

## 🎯 Résultat attendu après 3 jours

- ✅ Code 50% plus court
- ✅ Performances Timeline x2
- ✅ Maintenabilité ++
- ✅ Prêt pour Phase 5 Mobile
- ✅ Pas de duplications
- ✅ Error handling robuste

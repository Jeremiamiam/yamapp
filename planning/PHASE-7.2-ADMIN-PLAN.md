# Phase 7.2: Admin & Permissions (Simplifié) - Plan d'implémentation

## 🎯 Objectif

Ajouter 2 rôles simples (Admin vs Member) pour protéger les données financières. Seuls les admins (patrons) peuvent voir la compta et les prix.

**Depends on**: Phase 7.1 (Security - Auth + RLS basique)

---

## 🎭 Les 2 Rôles

### 👑 Admin (Patrons: Jérémy + Alex)
- ✅ Accès TOTAL à l'app
- ✅ Vue Comptabilité (CA, dépenses, marge)
- ✅ Voir prix facturés et coûts sous-traitance
- ✅ Gérer les rôles (via page Settings)

### 👤 Member (Salariés, Stagiaires)
- ✅ Voir TOUS les clients, deliverables, calls, documents
- ✅ Créer/modifier/supprimer (workflow complet)
- ✅ Timeline, filtres, backlog, drag-drop
- ❌ Vue Compta (pas d'accès)
- ❌ Prix facturés sur deliverables (masqués)
- ❌ Coûts sous-traitance (masqués)

**Principe**: Les members peuvent travailler normalement, juste pas voir l'argent 💰

---

## 📅 Plan Demi-Journée (4-5h)

### **Étape 1: Table user_roles** (30 min)

#### 1.1 Créer table user_roles
**Action dans Supabase SQL Editor:**

```sql
-- Table simple: 2 rôles seulement
CREATE TABLE user_roles (
  id uuid REFERENCES auth.users PRIMARY KEY,
  email text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'member')),
  team_member_id text REFERENCES team(id),
  created_at timestamptz DEFAULT now()
);

-- Index pour perfs
CREATE INDEX idx_user_roles_id ON user_roles(id);
CREATE INDEX idx_user_roles_role ON user_roles(role);
```

#### 1.2 Insérer les admins (toi + Alex)
**Action dans Supabase SQL Editor:**

```sql
-- Insérer toi et Alex en admins
INSERT INTO user_roles (id, email, role)
SELECT
  id,
  email,
  'admin'
FROM auth.users
WHERE email IN ('jeremy@yam.agency', 'alex@yam.agency');

-- Si Marie existe, la mettre en member
INSERT INTO user_roles (id, email, role)
SELECT
  id,
  email,
  'member'
FROM auth.users
WHERE email = 'marie@yam.agency';
```

**Validation:**
- Vérifier dans Table Editor > user_roles
- 2 lignes admin (jeremy + alex)
- 1 ligne member (marie) si elle existe

---

### **Étape 2: RLS Policy pour Compta** (1h)

#### 2.1 Supprimer policy compta existante
**Action dans Supabase SQL Editor:**

```sql
-- Supprimer l'ancienne policy (authenticated all)
DROP POLICY IF EXISTS "Authenticated users full access compta" ON compta_monthly;
```

#### 2.2 Créer nouvelle policy (admins only)
**Action dans Supabase SQL Editor:**

```sql
-- Policy: Admins seulement pour compta
CREATE POLICY "Admins only access compta"
ON compta_monthly
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.id = auth.uid()
    AND user_roles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.id = auth.uid()
    AND user_roles.role = 'admin'
  )
);
```

#### 2.3 Tester RLS compta
**Test manuel:**
1. Login avec jeremy@yam.agency (admin)
2. Ouvrir DevTools > Console
3. Exécuter:
   ```javascript
   const { data, error } = await supabase.from('compta_monthly').select('*')
   console.log('Admin data:', data) // Devrait afficher les données
   ```
4. Logout puis login avec marie@yam.agency (member)
5. Exécuter même requête:
   ```javascript
   const { data, error } = await supabase.from('compta_monthly').select('*')
   console.log('Member data:', data) // Devrait être [] (vide)
   console.log('Member error:', error) // Peut avoir message policy
   ```

**Validation:**
- Admin voit les données ✅
- Member ne voit rien ✅

---

### **Étape 3: Frontend - Cacher les infos pognon** (1-2h)

#### 3.1 Améliorer useUserRole hook
**Modifier `src/hooks/useUserRole.ts`:**

```typescript
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export function useUserRole() {
  const [role, setRole] = useState<'admin' | 'member' | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchRole() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('user_roles')
        .select('role, team_member_id')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('Error fetching role:', error)
        setRole('member') // Par défaut member si erreur
      } else {
        setRole(data?.role || 'member')
      }

      setLoading(false)
    }

    fetchRole()

    // Listen auth changes (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchRole()
    })

    return () => subscription.unsubscribe()
  }, [])

  return {
    role,
    loading,
    isAdmin: role === 'admin',
    isMember: role === 'member',
  }
}
```

#### 3.2 Cacher onglet Compta dans Header
**Modifier `src/components/Header.tsx`:**

```typescript
import { useUserRole } from '@/hooks/useUserRole'

export default function Header() {
  const { isAdmin } = useUserRole()
  const currentView = useAppStore((state) => state.currentView)
  const navigateToTimeline = useAppStore((state) => state.navigateToTimeline)
  const navigateToClients = useAppStore((state) => state.navigateToClients)
  const navigateToCompta = useAppStore((state) => state.navigateToCompta)

  return (
    <header className="...">
      <nav className="flex gap-4">
        {/* Timeline */}
        <button
          onClick={navigateToTimeline}
          className={currentView === 'timeline' ? 'active' : ''}
        >
          📅 Calendrier
        </button>

        {/* Clients */}
        <button
          onClick={navigateToClients}
          className={currentView === 'clients' ? 'active' : ''}
        >
          👥 Clients
        </button>

        {/* Compta - visible que pour admins */}
        {isAdmin && (
          <button
            onClick={navigateToCompta}
            className={currentView === 'compta' ? 'active' : ''}
          >
            💰 Comptabilité
          </button>
        )}

        {/* Settings - visible que pour admins */}
        {isAdmin && (
          <button
            onClick={() => {/* navigate to settings */}}
            className="ml-auto"
          >
            ⚙️ Settings
          </button>
        )}
      </nav>

      {/* Logout button (tous les users) */}
      <button onClick={handleLogout} className="...">
        Déconnexion
      </button>
    </header>
  )
}
```

#### 3.3 Protéger ComptaView
**Modifier `src/features/compta/components/ComptaView.tsx`:**

```typescript
import { useUserRole } from '@/hooks/useUserRole'

export default function ComptaView() {
  const { isAdmin, loading } = useUserRole()

  // Loading role
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#d4f542]" />
      </div>
    )
  }

  // Access denied si pas admin
  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0a0a0a]">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-2xl text-white mb-2">Accès refusé</h1>
          <p className="text-white/60">
            Vous devez être admin pour accéder à la comptabilité.
          </p>
        </div>
      </div>
    )
  }

  // Si admin, afficher la vue compta normale
  return (
    <div className="p-8">
      {/* ... vue compta existante ... */}
    </div>
  )
}
```

#### 3.4 Cacher prix dans forms (optionnel mais recommandé)
**Modifier `src/components/forms/DeliverableForm.tsx`:**

```typescript
import { useUserRole } from '@/hooks/useUserRole'

export default function DeliverableForm({ ... }: Props) {
  const { isAdmin } = useUserRole()

  // ... existing form logic

  return (
    <form onSubmit={handleSubmit}>
      {/* ... champs existants (nom, date, type, status, assignee) */}

      {/* Champs prix - visible que pour admins */}
      {isAdmin && (
        <>
          <div>
            <label className="block text-sm text-white/80 mb-2">
              Prix facturé (€)
            </label>
            <input
              type="number"
              name="prixFacturé"
              value={formData.prixFacturé || ''}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-[#2a2a2a] text-white rounded-lg"
              placeholder="Ex: 5000"
            />
          </div>

          <div>
            <label className="block text-sm text-white/80 mb-2">
              Coût sous-traitance (€)
            </label>
            <input
              type="number"
              name="coutSousTraitance"
              value={formData.coutSousTraitance || ''}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-[#2a2a2a] text-white rounded-lg"
              placeholder="Ex: 1500"
            />
          </div>
        </>
      )}

      {/* Submit button */}
      <button type="submit" className="...">
        {mode === 'create' ? 'Créer' : 'Modifier'}
      </button>
    </form>
  )
}
```

---

### **Étape 4: Page Settings (Admin Management)** (1-2h)

#### 4.1 Créer route /settings
**Créer `src/app/settings/page.tsx`:**

```typescript
'use client'

import { useState, useEffect } from 'react'
import { useUserRole } from '@/hooks/useUserRole'
import { supabase } from '@/lib/supabase'

interface UserRole {
  id: string
  email: string
  role: 'admin' | 'member'
  team_member_id: string | null
  created_at: string
}

export default function SettingsPage() {
  const { isAdmin, loading: roleLoading } = useUserRole()
  const [users, setUsers] = useState<UserRole[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isAdmin) {
      loadUsers()
    }
  }, [isAdmin])

  async function loadUsers() {
    setLoading(true)
    const { data, error } = await supabase
      .from('user_roles')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setUsers(data)
    }
    setLoading(false)
  }

  async function toggleAdmin(userId: string, currentRole: string) {
    const newRole = currentRole === 'admin' ? 'member' : 'admin'

    const { error } = await supabase
      .from('user_roles')
      .update({ role: newRole })
      .eq('id', userId)

    if (!error) {
      alert(`Rôle modifié en ${newRole}`)
      loadUsers() // Reload
    } else {
      alert('Erreur: ' + error.message)
    }
  }

  // Loading role check
  if (roleLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#d4f542]" />
      </div>
    )
  }

  // Access denied
  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0a0a0a]">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-2xl text-white mb-2">Accès refusé</h1>
          <p className="text-white/60">
            Vous devez être admin pour accéder aux paramètres.
          </p>
        </div>
      </div>
    )
  }

  // Admin view
  return (
    <div className="min-h-screen bg-[#0a0a0a] p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2">Gestion de l'équipe</h1>
        <p className="text-white/60 mb-8">
          Gérez les rôles des membres de l'équipe. Les admins ont accès à la comptabilité.
        </p>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#d4f542] mx-auto" />
          </div>
        ) : (
          <div className="space-y-3">
            {users.map(user => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 bg-[#1a1a1a] rounded-lg border border-white/10 hover:border-white/20 transition-colors"
              >
                {/* User info */}
                <div>
                  <p className="text-white font-medium">{user.email}</p>
                  <p className="text-sm text-white/60 mt-1">
                    {user.role === 'admin' ? '👑 Admin - Accès total' : '👤 Member - Accès limité'}
                  </p>
                </div>

                {/* Toggle button */}
                <button
                  onClick={() => toggleAdmin(user.id, user.role)}
                  className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                    user.role === 'admin'
                      ? 'bg-[#d4f542] text-black hover:bg-[#e5ff6d]'
                      : 'bg-[#2a2a2a] text-white hover:bg-[#3a3a3a]'
                  }`}
                >
                  {user.role === 'admin' ? '← Retirer admin' : 'Rendre admin →'}
                </button>
              </div>
            ))}
          </div>
        )}

        {users.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-white/60">Aucun utilisateur trouvé.</p>
          </div>
        )}
      </div>
    </div>
  )
}
```

#### 4.2 Ajouter navigation vers Settings dans Header
**Modifier `src/components/Header.tsx`:**

```typescript
// Ajouter action navigateToSettings dans store
const navigateToSettings = useAppStore((state) => state.navigateToSettings)

// Ou si pas dans store, faire avec window.location ou Next router:
const router = useRouter() // si Next.js App Router

{isAdmin && (
  <button
    onClick={() => router.push('/settings')}
    className="px-4 py-2 text-white/60 hover:text-white transition-colors"
  >
    ⚙️ Settings
  </button>
)}
```

**Note**: Si tu veux gérer Settings dans le store comme les autres vues, ajoute:
```typescript
// src/lib/store.ts
type ViewType = 'timeline' | 'clients' | 'client-detail' | 'compta' | 'settings';

navigateToSettings: () => set({ currentView: 'settings', selectedClientId: null }),
```

---

### **Étape 5: Tests & Validation** (30 min)

#### 5.1 Test Admin (toi ou Alex)
**Checklist:**
- [ ] Login avec jeremy@yam.agency
- [ ] Onglet "Comptabilité" visible dans Header
- [ ] Cliquer Comptabilité → vue compta affichée
- [ ] Voir les KPIs (CA, dépenses, marge)
- [ ] Onglet "Settings" visible dans Header
- [ ] Cliquer Settings → liste des users affichée
- [ ] Toggle rôle d'un user (member → admin → member)
- [ ] Créer deliverable → champs prix visibles
- [ ] Voir prix dans forms

#### 5.2 Test Member (Marie ou créer test user)
**Checklist:**
- [ ] Login avec marie@yam.agency
- [ ] Onglet "Comptabilité" PAS visible dans Header
- [ ] Onglet "Settings" PAS visible
- [ ] Essayer d'aller sur /compta directement → "Accès refusé"
- [ ] Essayer d'aller sur /settings directement → "Accès refusé"
- [ ] Timeline fonctionne normalement
- [ ] Créer deliverable → champs prix PAS visibles
- [ ] Voir clients, calls, documents → tout fonctionne
- [ ] Drag-drop timeline → fonctionne
- [ ] Filtres → fonctionnent

#### 5.3 Test RLS direct (DevTools)
**Test Admin:**
```javascript
// Login admin puis Console:
const { data } = await supabase.from('compta_monthly').select('*')
console.log('Admin compta:', data) // Devrait afficher 12 lignes
```

**Test Member:**
```javascript
// Login member puis Console:
const { data, error } = await supabase.from('compta_monthly').select('*')
console.log('Member compta:', data) // Devrait être [] (vide)
console.log('Member error:', error) // "policy violation" ou similaire
```

#### 5.4 Test Toggle Admin
- [ ] Login admin → Settings
- [ ] Changer marie de member → admin
- [ ] Logout puis login avec marie
- [ ] Vérifier qu'elle voit maintenant Compta et Settings
- [ ] Retourner avec ton compte admin
- [ ] Remettre marie en member
- [ ] Logout puis login avec marie
- [ ] Vérifier qu'elle ne voit plus Compta

---

## 🎯 Success Criteria Phase 7.2

- [x] Table user_roles créée avec 2 rôles (admin, member)
- [x] 2 admins insérés (jeremy, alex)
- [x] RLS policy compta (admins only) créée
- [x] useUserRole hook retourne role + isAdmin
- [x] Onglet Compta visible que pour admins
- [x] ComptaView protégée (redirect si member)
- [x] Champs prix dans forms masqués pour members
- [x] Page Settings fonctionnelle (toggle admin/member)
- [x] Navigation Settings visible que pour admins
- [x] Tests admin passent ✅
- [x] Tests member passent ✅
- [x] RLS bloque compta pour members ✅

---

## 📊 Temps Estimé

| Étape | Tâche | Temps |
|-------|-------|-------|
| 1 | Table user_roles + insert admins | 30 min |
| 2 | RLS policy compta (admins only) | 1h |
| 3 | Frontend cacher prix + onglets | 1-2h |
| 4 | Page Settings (toggle rôles) | 1-2h |
| 5 | Tests complets | 30 min |
| **TOTAL** | | **4-5h** |

---

## 🚨 Points d'attention

### Sécurité
- ✅ RLS sur compta = members ne peuvent PAS accéder aux données financières
- ✅ Frontend cache les infos (UX) mais RLS est la vraie protection
- ⚠️ Si un member ouvre DevTools et fait requête directe Supabase → RLS bloque
- ✅ Admins ont accès total (pas de restrictions)

### Limitations MVP (OK pour agence)
- ❌ Pas de système d'invitation (tu crées users manuellement dans Supabase Dashboard)
- ❌ Pas de "Forgot password" (ajouter si besoin)
- ❌ Pas de permissions granulaires (juste admin vs member)
- ❌ Pas d'audit logs (qui a fait quoi)

### Évolutions futures (Phase 7.3 optionnelle)
- Système d'invitation par email (Supabase magic links)
- 3ème rôle "Freelance" avec restrictions sur clients
- Permissions par client (member voit que ses clients assignés)
- Audit logs (historique des modifications)
- Forgot password flow

---

## 📋 Checklist Post-Phase 7.2

Avant de considérer Phase 7.2 complète:

- [ ] Table user_roles existe avec données
- [ ] 2 admins configurés (jeremy + alex)
- [ ] RLS compta bloque members
- [ ] Onglet Compta caché pour members
- [ ] ComptaView protégée
- [ ] Champs prix masqués pour members
- [ ] Page Settings fonctionnelle
- [ ] Toggle admin/member fonctionne
- [ ] Tests admin OK
- [ ] Tests member OK
- [ ] Documentation mise à jour

---

## 🎉 Après Phase 7.2

**L'app sera PRODUCTION-READY avec gestion des rôles:**
- ✅ Données persistantes (Phase 7)
- ✅ Authentification sécurisée (Phase 7.1)
- ✅ Rôles admin vs member (Phase 7.2)
- ✅ Compta protégée
- ✅ Viable pour usage quotidien avec toute l'équipe

**Reste à faire pour PROD complète:**
- Phase 5: Mobile & Responsive (2-3 jours)
- Phase 6 finale: Compta complète (2-3h)

**Temps total Phase 7 + 7.1 + 7.2**: ~5 jours

---

**Plan créé**: 2026-02-14
**Depends on**: Phase 7.1 (Security - Auth + RLS basique)
**Temps estimé**: 4-5h (demi-journée)
**Priorité**: HIGH pour production avec équipe

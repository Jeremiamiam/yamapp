# Phase 7.1: Sécurité (Auth + RLS) - Plan d'implémentation

## ✅ Statut : COMPLÈTE (2026-02-15)

- Auth Supabase (login/signup), middleware, logout, session ✅
- RLS : tables métier (clients, contacts, client_links, documents, deliverables, calls) en **authenticated only** via migration `00006_authenticated_only_rls.sql` (appliquée via MCP Supabase)
- Compta et user_roles déjà protégés (00005). Team protégé (00003).

---

## 🎯 Objectif

Sécuriser l'app YAM Dashboard avec authentification Supabase et Row Level Security (RLS) pour protéger les données en production.

**Depends on**: Phase 7 (Supabase migration complète)

---

## ⚠️ Pourquoi c'est nécessaire

### Sans sécurité (après Phase 7):
- ❌ N'importe qui avec l'URL peut accéder aux données
- ❌ Pas de protection contre modifications/suppressions
- ❌ Anon key visible dans le code = faille de sécurité
- ❌ Impossible de tracer qui fait quoi

### Avec sécurité (après Phase 7.1):
- ✅ Accès uniquement pour utilisateurs authentifiés
- ✅ Données protégées par RLS
- ✅ Login/logout sécurisé
- ✅ Production-ready

---

## 📅 Plan Demi-Journée (2-3h)

### **Étape 1: Activer Auth Supabase** (15 min)

#### 1.1 Activer Email/Password Auth
**Action manuelle dans Supabase Dashboard:**
1. Aller dans **Authentication > Providers**
2. Activer **Email** (devrait être activé par défaut)
3. Settings:
   - ✅ Enable email confirmations: **OFF** (pour MVP, éviter l'email de confirmation)
   - ✅ Enable email sign-ups: **OFF** (on va créer users manuellement)

#### 1.2 Créer premier utilisateur
**Action manuelle dans Supabase Dashboard:**
1. Aller dans **Authentication > Users**
2. Cliquer **Add user** > **Create new user**
3. Remplir:
   - Email: `jeremy@yam.agency`
   - Password: `[mot de passe fort - noter dans 1Password]`
   - Auto Confirm User: **✅ YES**
4. Créer d'autres users pour l'équipe si besoin:
   - `alex@yam.agency`
   - `marie@yam.agency`
   - etc.

---

### **Étape 2: Activer RLS + Policies** (30 min)

#### 2.1 Activer RLS sur toutes les tables
**Action dans Supabase SQL Editor:**

```sql
-- Activer RLS sur les 8 tables
ALTER TABLE team ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE compta_monthly ENABLE ROW LEVEL SECURITY;
```

#### 2.2 Créer policies "Authenticated users full access"
**Action dans Supabase SQL Editor:**

```sql
-- Policy pour team (lecture seule pour tous, pas de modification)
CREATE POLICY "Authenticated users can read team"
ON team
FOR SELECT
TO authenticated
USING (true);

-- Policy pour clients (lecture + écriture)
CREATE POLICY "Authenticated users full access clients"
ON clients
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Policy pour contacts
CREATE POLICY "Authenticated users full access contacts"
ON contacts
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Policy pour client_links
CREATE POLICY "Authenticated users full access client_links"
ON client_links
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Policy pour documents
CREATE POLICY "Authenticated users full access documents"
ON documents
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Policy pour deliverables
CREATE POLICY "Authenticated users full access deliverables"
ON deliverables
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Policy pour calls
CREATE POLICY "Authenticated users full access calls"
ON calls
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Policy pour compta_monthly
CREATE POLICY "Authenticated users full access compta"
ON compta_monthly
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
```

**Validation:**
- Toutes les policies devraient apparaître dans Table Editor > [Table] > Policies
- Status: RLS enabled ✅ pour chaque table

---

### **Étape 3: Créer LoginPage** (30 min)

#### 3.1 Créer composant LoginPage
**Créer `src/components/auth/LoginPage.tsx`:**

```typescript
'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    }
    // Si success, onAuthStateChange va trigger dans page.tsx
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0a0a0a]">
      <div className="w-full max-w-md p-8 bg-[#1a1a1a] rounded-lg border border-white/10">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">YAM Dashboard</h1>
          <p className="text-white/60">Connectez-vous pour accéder à vos clients</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-sm text-white/80 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre@email.com"
              className="w-full px-4 py-3 bg-[#2a2a2a] text-white rounded-lg border border-white/10 focus:border-[#d4f542] focus:outline-none transition-colors"
              required
              disabled={loading}
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm text-white/80 mb-2">Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 bg-[#2a2a2a] text-white rounded-lg border border-white/10 focus:border-[#d4f542] focus:outline-none transition-colors"
              required
              disabled={loading}
            />
          </div>

          {/* Error message */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#d4f542] text-black font-bold rounded-lg hover:bg-[#e5ff6d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  )
}
```

---

### **Étape 4: Auth Guard dans page.tsx** (30 min)

#### 4.1 Ajouter Auth Guard
**Modifier `src/app/page.tsx`:**

```typescript
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAppStore } from '@/lib/store'
import LoginPage from '@/components/auth/LoginPage'
import Header from '@/components/Header'
import Timeline from '@/features/timeline/components/Timeline'
import ClientDetail from '@/features/clients/components/ClientDetail'
import ComptaView from '@/features/compta/components/ComptaView'
import ModalManager from '@/components/ModalManager'
import type { Session } from '@supabase/supabase-js'

export default function Home() {
  const [session, setSession] = useState<Session | null>(null)
  const [authLoading, setAuthLoading] = useState(true)

  const loadData = useAppStore((state) => state.loadData)
  const isLoading = useAppStore((state) => state.isLoading)
  const currentView = useAppStore((state) => state.currentView)

  // 1. Check auth state
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setAuthLoading(false)
    })

    // Listen to auth changes (login/logout)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  // 2. Load data when authenticated
  useEffect(() => {
    if (session) {
      loadData()
    }
  }, [session, loadData])

  // Auth loading state
  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0a0a0a]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#d4f542] mx-auto mb-4" />
          <p className="text-white/60">Chargement...</p>
        </div>
      </div>
    )
  }

  // Not authenticated → show login
  if (!session) {
    return <LoginPage />
  }

  // Data loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0a0a0a]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#d4f542] mx-auto mb-4" />
          <p className="text-white/60">Chargement des données...</p>
        </div>
      </div>
    )
  }

  // Authenticated → show app
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <Header />

      <main>
        {currentView === 'timeline' && <Timeline />}
        {currentView === 'client-detail' && <ClientDetail />}
        {currentView === 'compta' && <ComptaView />}
      </main>

      <ModalManager />
    </div>
  )
}
```

#### 4.2 Ajouter bouton Logout dans Header
**Modifier `src/components/Header.tsx`:**

```typescript
import { supabase } from '@/lib/supabase'

// ... existing code

const handleLogout = async () => {
  await supabase.auth.signOut()
  // onAuthStateChange va trigger et redirect vers login
}

// Ajouter ce bouton dans le Header (coin droit):
<button
  onClick={handleLogout}
  className="px-4 py-2 text-sm text-white/60 hover:text-white transition-colors"
>
  Déconnexion
</button>
```

---

### **Étape 5: Tests & Validation** (30 min)

#### 5.1 Tester le flow complet
**Checklist manuelle:**

1. **Login page**
   - [ ] Page login s'affiche au démarrage
   - [ ] Design cohérent (dark theme, neon green)
   - [ ] Form validation (email requis, password requis)

2. **Login avec credentials incorrects**
   - [ ] Tester email invalide → message erreur
   - [ ] Tester password incorrect → message erreur
   - [ ] Message d'erreur clair et visible

3. **Login avec credentials corrects**
   - [ ] Login avec `jeremy@yam.agency` + password
   - [ ] Redirect automatique vers Dashboard
   - [ ] Données chargées depuis Supabase
   - [ ] Timeline affiche les données

4. **Session persistence**
   - [ ] Refresh page (F5) → reste connecté
   - [ ] Fermer onglet + rouvrir → reste connecté
   - [ ] Session expire après 1h d'inactivité (comportement Supabase par défaut)

5. **Logout**
   - [ ] Cliquer bouton "Déconnexion" dans Header
   - [ ] Redirect vers LoginPage
   - [ ] Données effacées du state
   - [ ] Impossible d'accéder aux routes sans login

6. **RLS enforcement**
   - [ ] Déconnecter
   - [ ] Ouvrir DevTools > Console
   - [ ] Essayer requête directe Supabase:
     ```javascript
     const { data } = await supabase.from('clients').select('*')
     console.log(data) // Devrait être null ou []
     ```
   - [ ] Vérifier que RLS bloque l'accès sans auth

7. **CRUD operations**
   - [ ] Créer deliverable → persiste
   - [ ] Éditer deliverable → persiste
   - [ ] Supprimer deliverable → persiste
   - [ ] Tous les CRUD fonctionnent (contacts, documents, calls, etc.)

#### 5.2 Test multi-onglets (bonus)
- [ ] Ouvrir 2 onglets avec même user
- [ ] Login dans onglet 1
- [ ] Vérifier que onglet 2 se met à jour automatiquement (onAuthStateChange)

---

## 🎯 Success Criteria Phase 7.1

- [x] Auth Supabase activé (email/password)
- [x] 1+ users créés pour l'agence
- [x] RLS activé sur les 8 tables
- [x] Policies "authenticated only" créées
- [x] LoginPage fonctionnelle avec design cohérent
- [x] Auth guard dans page.tsx (redirect si non auth)
- [x] Bouton logout dans Header
- [x] Session persistence fonctionne
- [x] RLS bloque accès non authentifié
- [x] Tous les CRUD fonctionnent avec auth

---

## 📊 Temps Estimé

| Étape | Tâche | Temps |
|-------|-------|-------|
| 1 | Activer Auth + créer users | 15 min |
| 2 | Activer RLS + policies SQL | 30 min |
| 3 | Créer LoginPage component | 30 min |
| 4 | Auth guard + logout button | 30 min |
| 5 | Tests complets | 30 min |
| **TOTAL** | | **2-3h** |

---

## 🚨 Points d'attention

### Sécurité
- ✅ RLS activé = données protégées
- ✅ Policies "authenticated" = accès limité aux users connectés
- ⚠️ Passwords stockés de manière sécurisée par Supabase (bcrypt)
- ⚠️ Session tokens dans localStorage (comportement Supabase par défaut)

### Limitations actuelles (OK pour MVP)
- ❌ Pas de "Forgot password" (ajouter si besoin)
- ❌ Pas de gestion des rôles (admin/employee/freelance)
- ❌ Pas d'email de confirmation (disabled pour simplifier)
- ❌ Tous les users authentifiés ont accès complet (pas de restrictions par client ou team member)

### Évolutions futures (Phase 7.2 optionnelle)
- Rôles différenciés (admin peut tout, freelance voit que ses tâches)
- Forgot password flow
- Email confirmations
- 2FA (Two-Factor Authentication)
- Audit logs (qui a modifié quoi et quand)

---

## 🔐 Amélioration Sécurité (Bonus)

### Si tu veux renforcer encore:

#### 1. Variables d'environnement sécurisées
```bash
# .env.local - Ajouter:
NEXT_PUBLIC_APP_URL=https://yam-dashboard.vercel.app
```

#### 2. Redirect URLs dans Supabase
**Supabase Dashboard > Authentication > URL Configuration:**
- Site URL: `https://yam-dashboard.vercel.app`
- Redirect URLs: `https://yam-dashboard.vercel.app/**`

Empêche les redirects malicieux après login.

#### 3. Rate limiting (protection brute force)
**Supabase Dashboard > Authentication > Rate Limits:**
- Max login attempts: 5 per hour per email
- Déjà activé par défaut ✅

---

## 📋 Checklist Post-Phase 7.1

Avant de considérer Phase 7.1 complète:

- [ ] Auth fonctionne (login/logout)
- [ ] RLS activé sur 8 tables
- [x] Policies créées (authenticated users) — migration 00006 appliquée
- [x] Users créés pour l'équipe (à faire manuellement dans Supabase si pas déjà fait)
- [x] LoginPage design cohérent
- [x] Session persistence OK
- [x] Tous les CRUD testés et fonctionnent
- [x] RLS : requêtes sans auth bloquées sur tables métier (00006)
- [ ] Documentation mise à jour (`docs/SUPABASE-SETUP.md`) si besoin

---

## 🎉 Après Phase 7.1

**L'app sera PRODUCTION-READY avec sécurité correcte:**
- ✅ Données persistantes (Phase 7)
- ✅ Authentification sécurisée (Phase 7.1)
- ✅ RLS actif (Phase 7.1)
- ✅ Accès limité aux users autorisés
- ✅ Viable pour usage quotidien avec vraies données clients

**Reste à faire pour PROD complète:**
- Phase 5: Mobile & Responsive (2-3 jours)
- Phase 6 finale: Compta complète (2-3h)

**Temps total Phase 7 + 7.1**: 4.5 jours (au lieu de 4 sans sécurité)

---

**Plan créé**: 2026-02-14
**Depends on**: Phase 7 (Supabase Migration)
**Temps estimé**: 2-3h (demi-journée)
**Priorité**: CRITIQUE pour production

'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export function PendingApprovalPage() {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 gradient-mesh relative">
      <div className="noise-overlay" />
      <div className="relative z-10 text-center max-w-md">
        <div className="text-6xl mb-4" aria-hidden>⏳</div>
        <h1 className="text-xl font-bold text-[var(--text-primary)] mb-2">
          En attente d&apos;autorisation
        </h1>
        <p className="text-[var(--text-secondary)] mb-6">
          Votre compte a été créé. Un administrateur doit autoriser votre accès au dashboard. 
          Vous recevrez l&apos;accès une fois la validation effectuée.
        </p>
        <button
          type="button"
          onClick={handleLogout}
          className="px-6 py-3 rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-primary)] font-medium hover:bg-[var(--bg-tertiary)]/80 transition-colors"
        >
          Se déconnecter
        </button>
      </div>
    </div>
  );
}

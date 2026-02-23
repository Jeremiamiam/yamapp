'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';

/**
 * Redirige /settings vers la vue admin dans l'app principale (avec header + sidebar).
 */
export default function SettingsRedirectPage() {
  const router = useRouter();
  const navigateToAdmin = useAppStore((s) => s.navigateToAdmin);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      navigateToAdmin();
      router.replace('/');
    }
  }, [router, navigateToAdmin]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
      <div className="h-10 w-10 rounded-full border-2 border-[var(--accent-lime)] border-t-transparent animate-spin" />
    </div>
  );
}

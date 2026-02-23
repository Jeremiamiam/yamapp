'use client';

import { ReactNode, useEffect } from 'react';
import { Spotlight } from '@/components/ui';
import { useAppStore } from '@/lib/store';

interface GlobalProvidersProps {
  children: ReactNode;
}

export function GlobalProviders({ children }: GlobalProvidersProps) {
  const navigateToWiki = useAppStore((state) => state.navigateToWiki);
  const setSimulateAsMember = useAppStore((state) => state.setSimulateAsMember);

  // Rehydrate simulateAsMember from localStorage on mount
  useEffect(() => {
    try {
      const v = localStorage.getItem('yam-simulate-as-member');
      if (v === 'true') setSimulateAsMember(true);
    } catch {}
  }, [setSimulateAsMember]);

  // Raccourci Cmd+Shift+D pour ouvrir le Wiki
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'd') {
        e.preventDefault();
        navigateToWiki();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigateToWiki]);

  return (
    <>
      {children}
      <Spotlight />
    </>
  );
}

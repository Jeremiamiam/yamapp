'use client';

import { ReactNode, useState, useEffect, createContext, useContext } from 'react';
import { Spotlight } from '@/components/ui';
import { DocsYamModal } from '@/components/DocsYamModal';

interface GlobalContextType {
  openDocsYam: () => void;
}

const GlobalContext = createContext<GlobalContextType | null>(null);

export function useGlobalActions() {
  const ctx = useContext(GlobalContext);
  if (!ctx) throw new Error('useGlobalActions must be used within GlobalProviders');
  return ctx;
}

interface GlobalProvidersProps {
  children: ReactNode;
}

export function GlobalProviders({ children }: GlobalProvidersProps) {
  const [docsYamOpen, setDocsYamOpen] = useState(false);

  // Raccourci Cmd+Shift+D pour ouvrir Docs YAM
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'd') {
        e.preventDefault();
        setDocsYamOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <GlobalContext.Provider value={{ openDocsYam: () => setDocsYamOpen(true) }}>
      {children}
      <Spotlight />
      <DocsYamModal isOpen={docsYamOpen} onClose={() => setDocsYamOpen(false)} />
    </GlobalContext.Provider>
  );
}

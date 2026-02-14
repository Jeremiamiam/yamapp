import { useEffect } from 'react';

/**
 * Hook pour écouter les touches clavier
 * Utile pour raccourcis (ex: Escape pour fermer modal)
 */
export function useKeyPress(targetKey: string, callback: () => void) {
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === targetKey) {
        callback();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [targetKey, callback]);
}

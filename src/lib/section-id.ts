/**
 * Utilitaires pour l'identité UUID des sections.
 * Chaque section a un id stable qui persiste à travers les réordonnements.
 */

/**
 * Génère un UUID v4 stable pour une section.
 * Utilise crypto.randomUUID() (natif Node 18+ / navigateurs modernes).
 * Fallback Math.random() pour sécurité (ne devrait jamais se déclencher en Next.js).
 */
export function generateSectionId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback safety net — should never trigger in Next.js 15+
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Assure que chaque section a un id stable.
 * Si une section n'a pas de champ `id`, en génère un (rétrocompat avec les documents legacy).
 */
export function ensureSectionIds<T extends { id?: string }>(
  sections: T[]
): (T & { id: string })[] {
  return sections.map((section) => {
    if (section.id) {
      return section as T & { id: string };
    }
    return { ...section, id: generateSectionId() };
  });
}

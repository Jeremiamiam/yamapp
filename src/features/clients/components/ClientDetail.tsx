'use client';

/**
 * ClientDetail — délègue au nouveau layout V2 (Phase 12, Plan 02).
 *
 * Le composant original (3-column grid avec sidebar + deliverables) est remplacé
 * par ClientDetailV2 (sidebar fixe + zone projets + footer retroplanning).
 * Ce fichier conserve le nom ClientDetail pour que le routing via Zustand reste intact.
 */

import { ClientDetailV2 } from './ClientDetailV2';

export function ClientDetail() {
  return <ClientDetailV2 />;
}

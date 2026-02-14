import { createBrowserClient } from '@supabase/ssr';

/**
 * Client Supabase pour le navigateur (cookies gérés par @supabase/ssr).
 * Utilise NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY.
 */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      'Supabase non configuré : ajoute NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY dans les variables d’environnement (Netlify → Site settings → Environment variables), puis redéploie le site.'
    );
  }

  return createBrowserClient(url, key);
}

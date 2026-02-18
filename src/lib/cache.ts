/**
 * Cache localStorage utilisé par loadData (data.slice).
 * Quand on fait une écriture (todo, livrable, projet…), on invalide le cache
 * pour que le prochain rechargement refetch depuis Supabase au lieu d’afficher l’ancien cache.
 */
const CACHE_KEY = 'yam_dashboard_cache';
const CACHE_TIMESTAMP_KEY = 'yam_dashboard_cache_ts';

export function invalidateDataCache(): void {
  try {
    localStorage.removeItem(CACHE_TIMESTAMP_KEY);
  } catch {
    // ignore (quota, private mode, etc.)
  }
}

export { CACHE_KEY, CACHE_TIMESTAMP_KEY };

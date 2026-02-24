/**
 * URL de base pour les redirects auth (reset password, etc.).
 * Priorité : NEXT_PUBLIC_SITE_URL > NEXT_PUBLIC_APP_URL > origin courant.
 * En production, définir NEXT_PUBLIC_SITE_URL pour éviter les redirects vers localhost.
 */
export function getAuthRedirectBaseUrl(): string {
  if (typeof window === 'undefined') {
    const env =
      process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL;
    if (env) {
      const url = env.startsWith('http') ? env : `https://${env}`;
      return url.endsWith('/') ? url.slice(0, -1) : url;
    }
    return '';
  }
  const env =
    process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL;
  if (env) {
    const url = env.startsWith('http') ? env : `https://${env}`;
    return url.endsWith('/') ? url.slice(0, -1) : url;
  }
  return window.location.origin;
}

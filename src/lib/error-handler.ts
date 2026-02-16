/**
 * Gestion d'erreurs centralisée avec messages utilisateur.
 * Pour l'instant utilise alert(); peut être remplacé par un toast plus tard.
 */

/** Extrait un message lisible depuis une erreur (Supabase, Error, ou inconnue). */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error !== null && 'message' in error && typeof (error as { message: unknown }).message === 'string') {
    return (error as { message: string }).message;
  }
  if (typeof error === 'object' && error !== null && 'details' in error && typeof (error as { details: unknown }).details === 'string') {
    return (error as { details: string }).details;
  }
  return String(error);
}

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public userMessage: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function handleError(error: unknown): void {
  if (error instanceof AppError) {
    // eslint-disable-next-line no-alert
    alert(error.userMessage);
    console.error(`[${error.code}]`, error.message);
  } else if (error instanceof Error) {
    // eslint-disable-next-line no-alert
    alert('Une erreur est survenue.');
    console.error(error);
  } else {
    // eslint-disable-next-line no-alert
    alert('Une erreur inconnue est survenue.');
    console.error(error);
  }
}

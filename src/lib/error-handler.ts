/**
 * Gestion d'erreurs centralisée avec messages utilisateur.
 * Pour l'instant utilise alert(); peut être remplacé par un toast plus tard.
 */

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

import { toast } from './toast';

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
    toast.error(error.userMessage);
    console.error(`[${error.code}]`, error.message);
  } else if (error instanceof Error) {
    toast.error('Une erreur est survenue.');
    console.error(error);
  } else {
    toast.error('Une erreur inconnue est survenue.');
    console.error(error);
  }
}

/**
 * Utilitaires de formatage et comparaison de dates (fr-FR).
 * Centralise les usages pour cohérence et tests.
 */

export function formatDate(date: Date, locale = 'fr-FR'): string {
  return date.toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
  });
}

export function formatDateLong(date: Date, locale = 'fr-FR'): string {
  return date.toLocaleDateString(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function formatDateShort(date: Date, locale = 'fr-FR'): string {
  return date.toLocaleDateString(locale, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

export function formatTime(date: Date, locale = 'fr-FR'): string {
  return date.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Pour affichage document (ex: "lundi 14 février 2026") */
export function formatDocDate(date: Date, locale = 'fr-FR'): string {
  return date.toLocaleDateString(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/** Pour input type="date" (YYYY-MM-DD) */
export function formatDateForInput(date: Date): string {
  return date.toISOString().split('T')[0];
}

/** Pour input type="time" (HH:mm) */
export function formatTimeForInput(date: Date): string {
  return date.toTimeString().slice(0, 5);
}

/** Pour en-tête (ex: "samedi 14 février") */
export function formatHeaderDate(date: Date, locale = 'fr-FR'): string {
  return date.toLocaleDateString(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

export function isSameDay(date1: Date, date2: Date): boolean {
  return date1.toDateString() === date2.toDateString();
}

export function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

export function isPast(date: Date): boolean {
  return date < new Date();
}

export function isFuture(date: Date): boolean {
  return date > new Date();
}

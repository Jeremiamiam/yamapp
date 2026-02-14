/**
 * Messages d'erreur auth Supabase en français (rate limit, credentials, etc.)
 */
export function getAuthErrorMessage(message: string, context: 'login' | 'signup'): string {
  const lower = message.toLowerCase();
  if (lower.includes('rate limit') || lower.includes('email rate limit')) {
    return context === 'signup'
      ? "Trop de tentatives. Supabase limite l’envoi d’e-mails. Attends quelques minutes ou connecte-toi si tu as déjà un compte."
      : "Trop de tentatives. Attends quelques minutes avant de réessayer.";
  }
  if (lower.includes('invalid login credentials')) {
    return "Email ou mot de passe incorrect.";
  }
  if (lower.includes('email not confirmed')) {
    return "Compte non confirmé. Vérifie ta boîte mail (et les spams) pour le lien de confirmation.";
  }
  if (lower.includes('user already registered')) {
    return "Un compte existe déjà avec cet e-mail. Connecte-toi plutôt.";
  }
  return message;
}

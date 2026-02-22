'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { getAuthErrorMessage } from '@/lib/supabase/auth-errors';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email) {
      setError('Entre ton adresse email.');
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/`,
    });
    setLoading(false);
    if (err) {
      setError(getAuthErrorMessage(err.message, 'login'));
      return;
    }
    setResetSent(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) {
      setError(getAuthErrorMessage(err.message, 'login'));
      return;
    }
    router.push('/');
    router.refresh();
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 gradient-mesh relative">
      <div className="noise-overlay" />
      <div className="relative z-10 w-full max-w-sm">
        <img
          src="/icons/yamboard_logo.svg"
          alt="Yamboard"
          className="h-[72px] w-auto mb-8 mx-auto"
        />
        {resetSent ? (
          <div className="space-y-4">
            <p className="text-sm text-[var(--accent-lime)]">
              Un email de réinitialisation a été envoyé. Vérifie ta boîte de réception.
            </p>
            <button
              onClick={() => { setResetMode(false); setResetSent(false); setError(null); }}
              className="text-sm text-[var(--accent-lime)] hover:underline font-medium"
            >
              Retour à la connexion
            </button>
          </div>
        ) : resetMode ? (
          <form onSubmit={handleReset} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full px-4 py-3 rounded-lg bg-[var(--bg-card)] border border-[var(--border-medium)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-lime)] focus:border-transparent"
                placeholder="toi@agence-yam.fr"
              />
            </div>
            {error && (
              <p className="text-sm text-[var(--accent-coral)]" role="alert">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-lg bg-[var(--accent-lime)] text-[var(--bg-primary)] font-semibold hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-[var(--accent-lime)] focus:ring-offset-2 focus:ring-offset-[var(--bg-primary)] disabled:opacity-60 transition-opacity"
            >
              {loading ? 'Envoi…' : 'Envoyer le lien'}
            </button>
            <button
              type="button"
              onClick={() => { setResetMode(false); setError(null); }}
              className="w-full text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              Retour à la connexion
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full px-4 py-3 rounded-lg bg-[var(--bg-card)] border border-[var(--border-medium)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-lime)] focus:border-transparent"
                placeholder="toi@agence-yam.fr"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                Mot de passe
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full px-4 py-3 rounded-lg bg-[var(--bg-card)] border border-[var(--border-medium)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-lime)] focus:border-transparent"
                placeholder="••••••••"
              />
            </div>
            <div className="text-right">
              <button
                type="button"
                onClick={() => { setResetMode(true); setError(null); }}
                className="text-sm text-[var(--text-muted)] hover:text-[var(--accent-lime)] transition-colors"
              >
                Mot de passe oublié ?
              </button>
            </div>
            {error && (
              <p className="text-sm text-[var(--accent-coral)]" role="alert">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-lg bg-[var(--accent-lime)] text-[var(--bg-primary)] font-semibold hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-[var(--accent-lime)] focus:ring-offset-2 focus:ring-offset-[var(--bg-primary)] disabled:opacity-60 transition-opacity"
            >
              {loading ? 'Connexion…' : 'Se connecter'}
            </button>
          </form>
        )}
        <p className="mt-6 text-center text-sm text-[var(--text-secondary)]">
          Première connexion ?{' '}
          <Link href="/signup" className="text-[var(--accent-lime)] hover:underline font-medium">
            Créer un compte
          </Link>
        </p>
      </div>
    </div>
  );
}

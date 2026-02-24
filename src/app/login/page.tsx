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
  const [showPassword, setShowPassword] = useState(false);

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
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full px-4 py-3 pr-12 rounded-lg bg-[var(--bg-card)] border border-[var(--border-medium)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-lime)] focus:border-transparent"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-lime)] focus:ring-inset"
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  tabIndex={0}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                      <line x1="2" x2="22" y1="2" y2="22" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
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

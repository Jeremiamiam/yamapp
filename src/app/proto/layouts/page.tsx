'use client';

/**
 * Banque de layouts sections web — style Framer.
 * Toutes les sections standards, contenu neutre, toggle light/dark.
 */

import { useState, useEffect } from 'react';
import {
  LayoutNavbar,
  LayoutHero,
  LayoutValueProp,
  LayoutServicesTeaser,
  LayoutFeatures,
  LayoutSocialProof,
  LayoutTestimonial,
  LayoutPricing,
  LayoutFaq,
  LayoutCtaFinal,
  LayoutContactForm,
  LayoutFooter,
} from '@/components/layouts';

export default function LayoutsPage() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Appliquer le thème sur html pour que toute la page utilise les variables
  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute('data-theme', theme);
    return () => html.removeAttribute('data-theme');
  }, [theme]);

  return (
    <div className="min-h-screen transition-colors duration-300">
      {/* Toggle light/dark en haut */}
      <div className="sticky top-0 z-[60] flex items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]/95 px-4 py-3 backdrop-blur-sm">
        <a href="/" className="text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
          ← Retour
        </a>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-[var(--text-muted)]">Thème</span>
          <button
            type="button"
            onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
            className="rounded-lg border border-[var(--border-subtle)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
          >
            {theme === 'dark' ? '☀ Light' : '🌙 Dark'}
          </button>
        </div>
      </div>

      {/* Sections démo */}
      <LayoutNavbar topOffset={52} />
      <LayoutHero />
      <LayoutValueProp />
      <LayoutServicesTeaser />
      <LayoutFeatures />
      <LayoutSocialProof />
      <LayoutTestimonial />
      <LayoutPricing />
      <LayoutFaq />
      <LayoutCtaFinal />
      <LayoutContactForm />
      <LayoutFooter />
    </div>
  );
}

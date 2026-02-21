'use client';

import { useState } from 'react';

/** Navbar layout — logo, menu, CTA header. Style Framer, neutre. Burger menu sur mobile. */
export interface NavItem {
  page: string;
  slug: string;
}

interface LayoutNavbarProps {
  topOffset?: number;
  navItems?: NavItem[];
  /** Si fourni, les liens du menu déclenchent ce callback au lieu de naviguer. tabKey = '__homepage__' ou slug */
  onNavClick?: (tabKey: string) => void;
  /** Slugs de pages dont le zoning a été généré (pour afficher le badge statut). Homepage toujours considérée générée. */
  generatedSlugs?: string[];
}

export function LayoutNavbar({ topOffset = 0, navItems, onNavClick, generatedSlugs }: LayoutNavbarProps) {
  const [burgerOpen, setBurgerOpen] = useState(false);
  const items = navItems ?? [
    { page: 'Services', slug: 'services' },
    { page: 'À propos', slug: 'a-propos' },
    { page: 'Contact', slug: 'contact' },
  ];

  const handleNavItemClick = (tabKey: string) => {
    if (onNavClick) onNavClick(tabKey);
    setBurgerOpen(false);
  };

  return (
    <header
      className="sticky top-0 z-50 w-full border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]/95 backdrop-blur-sm"
      style={{ top: topOffset }}
    >
      <div className="mx-auto flex h-14 sm:h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        {onNavClick ? (
          <button
            type="button"
            onClick={() => onNavClick('__homepage__')}
            className="text-lg font-semibold text-[var(--text-primary)] hover:opacity-80 transition-opacity"
          >
            Logo
          </button>
        ) : (
          <a href="#" className="text-lg font-semibold text-[var(--text-primary)]">
            Logo
          </a>
        )}

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          {items.map((item, i) => {
            const tabKey = i === 0 ? '__homepage__' : item.slug;
            const isHomepage = i === 0;
            const isGenerated = isHomepage || !generatedSlugs || generatedSlugs.includes(item.slug);
            const statusDot = generatedSlugs && !isHomepage ? (
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isGenerated ? 'bg-[var(--accent-lime)]' : 'bg-[var(--border-medium)]'}`} title={isGenerated ? 'Zoning généré' : 'Zoning non généré'} />
            ) : null;
            if (onNavClick) {
              return (
                <button
                  key={item.slug}
                  type="button"
                  onClick={() => onNavClick(tabKey)}
                  className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  {item.page}{statusDot}
                </button>
              );
            }
            return (
              <a
                key={item.slug}
                href={`#${item.slug}`}
                className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                {item.page}{statusDot}
              </a>
            );
          })}
        </nav>

        {/* Mobile: burger + CTA | Desktop: CTA */}
        <div className="flex items-center gap-2">
          {/* Burger — mobile only */}
          <button
            type="button"
            onClick={() => setBurgerOpen((v) => !v)}
            className="md:hidden p-2 -mr-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
            aria-expanded={burgerOpen}
            aria-label={burgerOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
          >
            {burgerOpen ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            )}
          </button>

          <a
            href="#"
            className="rounded-lg bg-[var(--text-primary)] px-3 py-2 sm:px-4 text-sm font-medium text-[var(--bg-primary)] hover:opacity-90 transition-opacity"
          >
            Action
          </a>
        </div>
      </div>

      {/* Burger panel — mobile */}
      {burgerOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 top-14 sm:top-16 z-40 bg-black/30"
            onClick={() => setBurgerOpen(false)}
            aria-hidden="true"
          />
          <nav
            className="md:hidden absolute top-full left-0 right-0 z-50 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)] shadow-lg"
            role="navigation"
          >
            <ul className="py-3 px-4 space-y-1">
              {items.map((item, i) => {
                const tabKey = i === 0 ? '__homepage__' : item.slug;
                const isHomepage = i === 0;
                const isGenerated = isHomepage || !generatedSlugs || generatedSlugs.includes(item.slug);
                const statusDot = generatedSlugs && !isHomepage ? (
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isGenerated ? 'bg-[var(--accent-lime)]' : 'bg-[var(--border-medium)]'}`} />
                ) : null;
                if (onNavClick) {
                  return (
                    <li key={item.slug}>
                      <button
                        type="button"
                        onClick={() => handleNavItemClick(tabKey)}
                        className="flex items-center gap-2 w-full text-left px-4 py-3 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                      >
                        {item.page}{statusDot}
                      </button>
                    </li>
                  );
                }
                return (
                  <li key={item.slug}>
                    <a
                      href={`#${item.slug}`}
                      onClick={() => setBurgerOpen(false)}
                      className="flex items-center gap-2 px-4 py-3 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                    >
                      {item.page}{statusDot}
                    </a>
                  </li>
                );
              })}
            </ul>
          </nav>
        </>
      )}
    </header>
  );
}

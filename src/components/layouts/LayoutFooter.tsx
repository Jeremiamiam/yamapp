'use client';

/** Footer layout — multi-colonnes, liens, legal. */
export interface FooterNavItem {
  page: string;
  slug: string;
}

interface LayoutFooterProps {
  content?: Record<string, unknown>;
  /** @deprecated Préférer navItemsMain + navItemsLegal */
  navItems?: FooterNavItem[];
  /** tabKey par index (__homepage__ pour homepage, slug sinon) — requis si onNavClick fourni pour main */
  tabKeys?: string[];
  onNavClick?: (tabKey: string) => void;
  /** Padding réduit pour aperçu dans une modale */
  compact?: boolean;
  /** Colonne Navigation (menu principal + added_pages) — cliquables */
  navItemsMain?: FooterNavItem[];
  /** Colonne Legal (mentions légales, etc.) — affichage seul, pas dans le menu */
  navItemsLegal?: FooterNavItem[];
  /** Nom affiché à la place de "Logo" (ex: nom du client) */
  brandName?: string;
}

export function LayoutFooter({ content, navItems, tabKeys, onNavClick, compact = false, navItemsMain, navItemsLegal, brandName }: LayoutFooterProps) {
  const mainLinks = navItemsMain?.length
    ? navItemsMain.map((i, idx) => ({ label: i.page, href: `#${i.slug}`, tabKey: tabKeys?.[idx] ?? i.slug }))
    : navItems?.length
      ? navItems.slice(0, 3).map((i, idx) => ({ label: i.page, href: `#${i.slug}`, tabKey: tabKeys?.[idx] ?? i.slug }))
      : [
          { label: 'Services', href: '#services', tabKey: 'services' },
          { label: 'À propos', href: '#a-propos', tabKey: 'a-propos' },
          { label: 'Contact', href: '#contact', tabKey: 'contact' },
        ];

  const legalLinks = navItemsLegal?.length
    ? navItemsLegal.map((i) => ({ label: i.page, href: `#${i.slug}` }))
    : navItems?.length && navItems.length > 3
      ? navItems.slice(3).map((i) => ({ label: i.page, href: `#${i.slug}` }))
      : [
          { label: 'Mentions légales', href: '#mentions' },
          { label: 'Confidentialité', href: '#confidentialite' },
        ];

  const renderMainLink = (l: { label: string; href: string; tabKey: string }, key: number) => {
    if (onNavClick) {
      return (
        <li key={key}>
          <button
            type="button"
            onClick={() => onNavClick(l.tabKey)}
            className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors text-left"
          >
            {l.label}
          </button>
        </li>
      );
    }
    return (
      <li key={key}>
        <a href={l.href} className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
          {l.label}
        </a>
      </li>
    );
  };

  return (
    <footer className={`border-t border-[var(--border-subtle)] bg-[var(--bg-primary)] px-6 ${compact ? 'py-8' : 'py-16'}`}>
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-12 md:grid-cols-4">
          <div>
            <span className="text-lg font-semibold text-[var(--text-primary)]">{brandName || 'Logo'}</span>
            <p className="mt-3 text-sm text-[var(--text-muted)]">
              Description courte. Liens, legal, réseaux sociaux.
            </p>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Navigation</h4>
            <ul className="mt-4 space-y-2">
              {mainLinks.map((l, i) => renderMainLink(l, i))}
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Legal</h4>
            <ul className="mt-4 space-y-2">
              {legalLinks.map((l, i) => (
                <li key={i}>
                  <a href={l.href} className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Réseaux</h4>
            <div className="mt-4 flex gap-4">
              <a href="#" className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">LinkedIn</a>
              <a href="#" className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">Twitter</a>
            </div>
          </div>
        </div>
        <div className="mt-12 border-t border-[var(--border-subtle)] pt-8 text-center text-sm text-[var(--text-muted)]">
          © {new Date().getFullYear()} {brandName || 'Nom'}. Tous droits réservés.
        </div>
      </div>
    </footer>
  );
}

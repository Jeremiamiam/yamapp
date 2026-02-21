'use client';

/** Footer layout — multi-colonnes, liens, legal. */
export interface FooterNavItem {
  page: string;
  slug: string;
}

interface LayoutFooterProps {
  content?: Record<string, unknown>;
  navItems?: FooterNavItem[];
  /** tabKey par index (__homepage__ pour homepage, slug sinon) — requis si onNavClick fourni */
  tabKeys?: string[];
  onNavClick?: (tabKey: string) => void;
}

export function LayoutFooter({ content, navItems, tabKeys, onNavClick }: LayoutFooterProps) {
  const links = navItems?.length
    ? navItems.map((i, idx) => ({ label: i.page, href: `#${i.slug}`, tabKey: tabKeys?.[idx] ?? i.slug }))
    : [
        { label: 'Services', href: '#services', tabKey: 'services' },
        { label: 'À propos', href: '#a-propos', tabKey: 'a-propos' },
        { label: 'Contact', href: '#contact', tabKey: 'contact' },
        { label: 'Mentions légales', href: '#mentions', tabKey: 'mentions' },
        { label: 'Confidentialité', href: '#confidentialite', tabKey: 'confidentialite' },
      ];

  const renderLink = (l: { label: string; href: string; tabKey: string }, key: number) => {
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
    <footer className="border-t border-[var(--border-subtle)] bg-[var(--bg-primary)] px-6 py-16">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-12 md:grid-cols-4">
          <div>
            <span className="text-lg font-semibold text-[var(--text-primary)]">Logo</span>
            <p className="mt-3 text-sm text-[var(--text-muted)]">
              Description courte. Liens, legal, réseaux sociaux.
            </p>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Navigation</h4>
            <ul className="mt-4 space-y-2">
              {links.slice(0, 3).map((l, i) => renderLink(l, i))}
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Legal</h4>
            <ul className="mt-4 space-y-2">
              {links.slice(3).map((l, i) => renderLink(l, 3 + i))}
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
          © 2025 Nom. Tous droits réservés.
        </div>
      </div>
    </footer>
  );
}

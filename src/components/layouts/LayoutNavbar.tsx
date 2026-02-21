'use client';

/** Navbar layout — logo, menu, CTA header. Style Framer, neutre. */
export interface NavItem {
  page: string;
  slug: string;
}

interface LayoutNavbarProps {
  topOffset?: number;
  navItems?: NavItem[];
  /** Si fourni, les liens du menu déclenchent ce callback au lieu de naviguer. tabKey = '__homepage__' ou slug */
  onNavClick?: (tabKey: string) => void;
}

export function LayoutNavbar({ topOffset = 0, navItems, onNavClick }: LayoutNavbarProps) {
  const items = navItems ?? [
    { page: 'Services', slug: 'services' },
    { page: 'À propos', slug: 'a-propos' },
    { page: 'Contact', slug: 'contact' },
  ];
  return (
    <header
      className="sticky top-0 z-50 w-full border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]/95 backdrop-blur-sm"
      style={{ top: topOffset }}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
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
        <nav className="hidden items-center gap-8 md:flex">
          {items.map((item, i) => {
            const tabKey = i === 0 ? '__homepage__' : item.slug;
            if (onNavClick) {
              return (
                <button
                  key={item.slug}
                  type="button"
                  onClick={() => onNavClick(tabKey)}
                  className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  {item.page}
                </button>
              );
            }
            return (
              <a
                key={item.slug}
                href={`#${item.slug}`}
                className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                {item.page}
              </a>
            );
          })}
        </nav>
        <a
          href="#"
          className="rounded-lg bg-[var(--text-primary)] px-4 py-2 text-sm font-medium text-[var(--bg-primary)] hover:opacity-90 transition-opacity"
        >
          Action
        </a>
      </div>
    </header>
  );
}

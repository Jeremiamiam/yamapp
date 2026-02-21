'use client';

/** Services teaser / solutions overview — grille cards, liens vers pages. */
interface LayoutServicesTeaserProps {
  content?: Record<string, unknown>;
}

export function LayoutServicesTeaser({ content }: LayoutServicesTeaserProps) {
  const rawItems = (content?.items as { title?: string; text?: string; url?: string }[] | undefined);
  const items = rawItems?.length
    ? rawItems.map((i) => ({ title: i.title ?? 'Service', desc: i.text ?? '', href: i.url ?? '#' }))
    : [
        { title: 'Service 1', desc: 'Description courte du premier service ou offre.', href: '#' },
        { title: 'Service 2', desc: 'Description courte du deuxième service.', href: '#' },
        { title: 'Service 3', desc: 'Description courte du troisième service.', href: '#' },
      ];
  const title = (content?.title as string) ?? 'Nos services';
  const subtitle = (content?.text as string) ?? 'Résumé des offres, liens vers les pages du menu.';

  return (
    <section className="px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl">
          {title}
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-[var(--text-secondary)]">
          {subtitle}
        </p>
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, i) => (
            <a
              key={i}
              href={item.href}
              className="group rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6 transition-colors hover:border-[var(--border-medium)]"
            >
              <h3 className="text-lg font-semibold text-[var(--text-primary)] group-hover:underline">
                {item.title}
              </h3>
              {item.desc ? <p className="mt-2 text-sm text-[var(--text-secondary)]">{item.desc}</p> : null}
              <span className="mt-4 inline-block text-sm font-medium text-[var(--text-primary)]">
                En savoir plus →
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

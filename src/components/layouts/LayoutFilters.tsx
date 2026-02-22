'use client';

interface LayoutFiltersProps {
  content?: Record<string, unknown>;
}

export function LayoutFilters({ content }: LayoutFiltersProps) {
  const title = (content?.title as string) ?? 'Filtres';
  const text = (content?.text as string) ?? 'Utilisez ces filtres pour affiner votre recherche.';
  const rawItems = (content?.items as { title?: string; text?: string }[] | undefined);
  const items = rawItems?.length
    ? rawItems.map((i) => ({ title: i.title ?? '—', desc: i.text ?? '' }))
    : [
        { title: 'Tous', desc: 'Afficher tous les éléments' },
        { title: 'Catégorie 1', desc: 'Description de la catégorie' },
        { title: 'Catégorie 2', desc: 'Description de la catégorie' },
      ];

  return (
    <section className="px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl">
            {title}
          </h2>
          <p className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-[var(--text-secondary)]">
            {text}
          </p>
        </div>
        <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, i) => (
            <button
              key={i}
              className="group rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6 text-left transition-all duration-200 hover:border-[var(--border-medium)] hover:bg-[var(--bg-tertiary)]"
            >
              <h3 className="text-lg font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent-cyan)]">
                {item.title}
              </h3>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">{item.desc}</p>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
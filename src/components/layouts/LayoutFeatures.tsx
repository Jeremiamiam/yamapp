'use client';

/** Features layout — fonctionnalités, grille 3 col, icônes. */
interface LayoutFeaturesProps {
  content?: Record<string, unknown>;
}

export function LayoutFeatures({ content }: LayoutFeaturesProps) {
  const rawItems = (content?.items as { title?: string; text?: string }[] | undefined);
  const items = rawItems?.length
    ? rawItems.map((i) => ({ title: i.title ?? '—', desc: i.text ?? '' }))
    : [
        { title: 'Fonctionnalité 1', desc: 'Description courte de la première fonctionnalité.' },
        { title: 'Fonctionnalité 2', desc: 'Description courte de la deuxième fonctionnalité.' },
        { title: 'Fonctionnalité 3', desc: 'Description courte de la troisième fonctionnalité.' },
      ];
  const title = (content?.title as string) ?? 'Fonctionnalités';
  const subtitle = (content?.text as string) ?? 'Liste des principales fonctionnalités ou avantages.';

  return (
    <section className="px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl">
          {title}
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-[var(--text-secondary)]">
          {subtitle}
        </p>
        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, i) => (
            <div
              key={i}
              className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6 transition-colors hover:border-[var(--border-medium)]"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--bg-tertiary)] text-[var(--text-muted)]">
                <span className="text-xl font-bold">{i + 1}</span>
              </div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">{item.title}</h3>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

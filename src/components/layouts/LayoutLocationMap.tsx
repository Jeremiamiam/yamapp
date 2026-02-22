'use client';

interface LayoutLocationMapProps {
  content?: Record<string, unknown>;
}

export function LayoutLocationMap({ content }: LayoutLocationMapProps) {
  const title = (content?.title as string) ?? 'Nous trouver';
  const subtitle = (content?.subtitle as string) ?? 'Notre localisation';
  const text = (content?.text as string) ?? 'Découvrez notre emplacement et les informations pratiques pour nous rendre visite.';
  
  const rawItems = (content?.items as { title?: string; text?: string }[] | undefined);
  const items = rawItems?.length
    ? rawItems.map((i) => ({ title: i.title ?? '—', text: i.text ?? '' }))
    : [
        { title: 'Adresse', text: 'Notre adresse complète' },
        { title: 'Accès transports', text: 'Informations transport en commun' },
        { title: 'Contact direct', text: 'Téléphone et email' }
      ];

  return (
    <section className="px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl">
            {title}
          </h2>
          <p className="mt-2 text-lg font-medium text-[var(--accent-cyan)]">
            {subtitle}
          </p>
          <p className="mt-6 max-w-3xl mx-auto text-base leading-relaxed text-[var(--text-secondary)]">
            {text}
          </p>
        </div>

        <div className="mt-16 grid gap-8 lg:grid-cols-2 lg:gap-16">
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-2">
            <div className="aspect-video w-full rounded-xl bg-[var(--bg-tertiary)] flex items-center justify-center">
              <div className="text-center">
                <div className="h-12 w-12 mx-auto rounded-full bg-[var(--accent-lime)] flex items-center justify-center mb-3">
                  <div className="h-6 w-6 rounded-full bg-[var(--text-primary)]"></div>
                </div>
                <p className="text-sm text-[var(--text-muted)]">Carte interactive</p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {items.map((item, i) => (
              <div key={i} className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6">
                <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">
                  {item.title}
                </h3>
                <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
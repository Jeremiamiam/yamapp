'use client';

interface LayoutProjectGridProps {
  content?: Record<string, unknown>;
}

export function LayoutProjectGrid({ content }: LayoutProjectGridProps) {
  const title = (content?.title as string) ?? 'Nos Projets';
  const text = (content?.text as string) ?? 'Découvrez notre portfolio de réalisations et les enjeux que nous avons résolus pour nos clients.';
  
  const rawItems = (content?.items as { title?: string; text?: string; tag?: string; image?: string }[] | undefined);
  const items = rawItems?.length
    ? rawItems.map((item) => ({
        title: item.title ?? 'Projet sans titre',
        text: item.text ?? 'Description du projet non disponible.',
        tag: item.tag ?? 'Non catégorisé',
        image: item.image ?? 'placeholder'
      }))
    : [
        {
          title: 'Client Exemple — Secteur Tech',
          text: 'Refonte complète de l\'identité de marque et création d\'une nouvelle stratégie digitale.',
          tag: 'Stratégie de marque',
          image: 'placeholder_1'
        },
        {
          title: 'Startup Innovation — FinTech',
          text: 'Développement d\'une identité visuelle moderne et création de supports de communication.',
          tag: 'Identité visuelle',
          image: 'placeholder_2'
        },
        {
          title: 'Entreprise Leader — Industrie',
          text: 'Conception et développement d\'une plateforme digitale sur mesure.',
          tag: 'Dispositifs digitaux',
          image: 'placeholder_3'
        }
      ];

  return (
    <section className="px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl">
            {title}
          </h2>
          <p className="mx-auto mt-6 max-w-4xl text-lg leading-relaxed text-[var(--text-secondary)]">
            {text}
          </p>
        </div>
        
        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, i) => (
            <div key={i} className="group cursor-pointer overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] transition-all hover:border-[var(--border-medium)] hover:shadow-lg">
              <div className="aspect-video bg-[var(--bg-tertiary)] p-8">
                <div className="flex h-full items-center justify-center text-sm font-medium text-[var(--text-muted)]">
                  {item.image}
                </div>
              </div>
              <div className="p-6">
                <div className="mb-3">
                  <span className="inline-block rounded-full bg-[var(--accent-cyan)] px-3 py-1 text-xs font-medium text-white">
                    {item.tag}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent-cyan)]">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
                  {item.text}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
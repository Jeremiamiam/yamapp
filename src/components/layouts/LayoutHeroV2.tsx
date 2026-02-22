'use client';

interface LayoutHeroV2Props {
  content?: Record<string, unknown>;
}

export function LayoutHeroV2({ content }: LayoutHeroV2Props) {
  const title = (content?.title as string) ?? 'Transformez votre vision en réalité';
  const subtitle = (content?.subtitle as string) ?? 'Créez des expériences exceptionnelles avec nos solutions innovantes';
  const description = (content?.description as string) ?? 'Découvrez une nouvelle façon de concevoir et développer vos projets avec des outils modernes et performants.';
  const imageUrl = (content?.imageUrl as string) ?? 'https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
  const imageAlt = (content?.imageAlt as string) ?? 'Illustration de notre solution innovante';

  return (
    <section className="px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-[var(--text-primary)] sm:text-5xl lg:text-6xl">
              {title}
            </h1>
            <p className="mt-6 text-xl leading-8 text-[var(--text-secondary)]">
              {subtitle}
            </p>
            <p className="mt-4 text-base text-[var(--text-muted)]">
              {description}
            </p>
            <div className="mt-8 flex gap-4">
              <button className="rounded-lg bg-[var(--accent-cyan)] px-6 py-3 text-sm font-semibold text-white shadow-sm hover:opacity-90">
                Commencer maintenant
              </button>
              <button className="rounded-lg border border-[var(--border-medium)] bg-[var(--bg-card)] px-6 py-3 text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]">
                En savoir plus
              </button>
            </div>
          </div>
          
          <div className="relative">
            <div className="aspect-square overflow-hidden rounded-2xl bg-[var(--bg-card)]">
              <img
                src={imageUrl}
                alt={imageAlt}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="absolute -bottom-6 -right-6 h-24 w-24 rounded-2xl bg-[var(--accent-lime)] opacity-20"></div>
            <div className="absolute -top-6 -left-6 h-16 w-16 rounded-xl bg-[var(--accent-violet)] opacity-30"></div>
          </div>
        </div>
      </div>
    </section>
  );
}
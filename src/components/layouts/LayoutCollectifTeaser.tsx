'use client';

interface LayoutCollectifTeaserProps {
  content?: Record<string, unknown>;
}

export function LayoutCollectifTeaser({ content }: LayoutCollectifTeaserProps) {
  const title = (content?.title as string) ?? 'Pour les experts qui cherchent plus qu\'un simple emploi';
  const text = (content?.text as string) ?? 'Nous construisons un collectif pour des professionnels qui veulent garder leur autonomie tout en bénéficiant d\'une structure qui amplifie leur expertise.';
  const rawCta = content?.cta_primary as { label?: string; url?: string } | undefined;
  const cta = {
    label: rawCta?.label ?? 'En savoir plus',
    url: rawCta?.url ?? '#'
  };

  return (
    <section className="px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-[var(--text-primary)] sm:text-4xl lg:text-5xl">
            {title}
          </h2>
          <p className="mt-8 text-lg leading-relaxed text-[var(--text-secondary)] sm:text-xl">
            {text}
          </p>
          <div className="mt-12">
            <a
              href={cta.url}
              className="inline-flex items-center rounded-full border border-[var(--border-medium)] bg-[var(--bg-card)] px-8 py-4 text-base font-semibold text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-tertiary)]"
            >
              {cta.label}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
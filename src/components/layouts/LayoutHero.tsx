'use client';

/** Hero layout — above the fold, value prop. Centré. Style Framer. */
interface LayoutHeroProps {
  content?: Record<string, unknown>;
}

export function LayoutHero({ content }: LayoutHeroProps) {
  const title = (content?.title as string) ?? (content?.section_title as string) ?? 'Titre principal accrocheur';
  const text = (content?.subtitle as string) ?? (content?.text as string) ?? 'Sous-titre ou proposition de valeur en une phrase.';
  const ctaP = content?.cta_primary as { label?: string; url?: string } | undefined;
  const ctaS = content?.cta_secondary as { label?: string; url?: string } | undefined;
  return (
    <section className="relative flex min-h-[70vh] items-center justify-center px-6 py-20">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-4xl font-bold tracking-tight text-[var(--text-primary)] sm:text-5xl md:text-6xl">
          {title}
        </h1>
        <p className="mt-6 text-lg text-[var(--text-secondary)] sm:text-xl">
          {text}
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          {ctaP && (
            <a
              href={ctaP.url ?? '#'}
              className="rounded-xl bg-[var(--text-primary)] px-6 py-3 text-base font-medium text-[var(--bg-primary)] hover:opacity-90 transition-opacity"
            >
              {ctaP.label ?? 'Action principale'}
            </a>
          )}
          {ctaS && (
            <a
              href={ctaS.url ?? '#'}
              className="rounded-xl border border-[var(--border-medium)] px-6 py-3 text-base font-medium text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
            >
              {ctaS.label ?? 'En savoir plus'}
            </a>
          )}
          {!ctaP && !ctaS && (
            <>
              <a href="#" className="rounded-xl bg-[var(--text-primary)] px-6 py-3 text-base font-medium text-[var(--bg-primary)] hover:opacity-90 transition-opacity">
                Action principale
              </a>
              <a href="#" className="rounded-xl border border-[var(--border-medium)] px-6 py-3 text-base font-medium text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors">
                En savoir plus
              </a>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

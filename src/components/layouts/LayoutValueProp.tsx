'use client';

/** Value proposition layout — paragraphe explicatif. Full-width ou 2-col. */
interface LayoutValuePropProps {
  content?: Record<string, unknown>;
}

export function LayoutValueProp({ content }: LayoutValuePropProps) {
  const title = (content?.title as string) ?? 'Proposition de valeur';
  const text = (content?.text as string) ?? 'Description de la section. Contenu générique pour prévisualisation.';
  const cta = content?.cta_primary as { label?: string; url?: string } | undefined;
  const ctaS = content?.cta_secondary as { label?: string; url?: string } | undefined;
  return (
    <section className="px-6 py-20">
      <div className="mx-auto max-w-4xl">
        <h2 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl">
          {title}
        </h2>
        <p className="mt-6 text-lg leading-relaxed text-[var(--text-secondary)]">
          {text}
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          {cta && (
            <a href={cta.url ?? '#'} className="inline-block rounded-lg border border-[var(--border-medium)] px-5 py-2.5 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors">
              {cta.label ?? 'Découvrir'}
            </a>
          )}
          {ctaS && (
            <a href={ctaS.url ?? '#'} className="inline-block rounded-lg border border-[var(--border-subtle)] px-5 py-2.5 text-sm text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] transition-colors">
              {ctaS.label ?? 'En savoir plus'}
            </a>
          )}
          {!cta && !ctaS && (
            <a href="#" className="inline-block rounded-lg border border-[var(--border-medium)] px-5 py-2.5 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors">
              Découvrir
            </a>
          )}
        </div>
      </div>
    </section>
  );
}

'use client';

/** CTA final layout — dernier appel à l'action, centré. */
interface LayoutCtaFinalProps {
  content?: Record<string, unknown>;
}

export function LayoutCtaFinal({ content }: LayoutCtaFinalProps) {
  const title = (content?.title as string) ?? 'Prêt à commencer ?';
  const text = (content?.text as string) ?? "Dernier appel à l'action.";
  const ctaP = content?.cta_primary as { label?: string; url?: string } | undefined;
  const ctaS = content?.cta_secondary as { label?: string; url?: string } | undefined;
  return (
    <section className="px-6 py-24">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl">
          {title}
        </h2>
        <p className="mt-4 text-[var(--text-secondary)]">
          {text}
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          {ctaP && (
            <a href={ctaP.url ?? '#'} className="rounded-xl bg-[var(--text-primary)] px-8 py-3 text-base font-medium text-[var(--bg-primary)] hover:opacity-90 transition-opacity">
              {ctaP.label ?? 'Action principale'}
            </a>
          )}
          {ctaS && (
            <a href={ctaS.url ?? '#'} className="rounded-xl border border-[var(--border-medium)] px-8 py-3 text-base font-medium text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors">
              {ctaS.label ?? 'En savoir plus'}
            </a>
          )}
          {!ctaP && !ctaS && (
            <>
              <a href="#" className="rounded-xl bg-[var(--text-primary)] px-8 py-3 text-base font-medium text-[var(--bg-primary)] hover:opacity-90 transition-opacity">
                Action principale
              </a>
              <a href="#" className="rounded-xl border border-[var(--border-medium)] px-8 py-3 text-base font-medium text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors">
                En savoir plus
              </a>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

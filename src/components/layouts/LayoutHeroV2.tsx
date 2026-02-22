'use client';

interface LayoutHeroV2Props {
  content?: Record<string, unknown>;
}

export function LayoutHeroV2({ content }: LayoutHeroV2Props) {
  const title = (content?.title as string) ?? 'Construisez l\'avenir numérique';
  const subtitle = (content?.subtitle as string) ?? 'Solutions technologiques sur mesure pour entreprises ambitieuses';
  const description = (content?.description as string) ?? 'De la conception à la mise en œuvre, nous accompagnons votre transformation digitale avec expertise et innovation.';
  const primaryCta = (content?.primaryCta as string) ?? 'Démarrer un projet';
  const secondaryCta = (content?.secondaryCta as string) ?? 'Voir nos réalisations';

  return (
    <section className="px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
          {/* Contenu texte à gauche */}
          <div className="text-left">
            <h1 className="text-4xl font-bold tracking-tight text-[var(--text-primary)] sm:text-5xl lg:text-6xl">
              {title}
            </h1>
            <p className="mt-6 text-xl leading-8 text-[var(--text-secondary)]">
              {subtitle}
            </p>
            <p className="mt-4 text-base text-[var(--text-muted)]">
              {description}
            </p>
            
            <div className="mt-8 flex gap-4 flex-wrap">
              <button className="rounded-lg bg-[var(--accent-cyan)] px-8 py-4 text-sm font-semibold text-white shadow-sm hover:opacity-90">
                {primaryCta}
              </button>
              <button className="rounded-lg border border-[var(--border-medium)] bg-[var(--bg-card)] px-8 py-4 text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]">
                {secondaryCta}
              </button>
            </div>
          </div>

          {/* Zone image à droite (placeholder) */}
          <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] aspect-[4/3] flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-[var(--bg-tertiary)] border border-[var(--border-medium)] mx-auto mb-4"></div>
              <p className="text-sm text-[var(--text-muted)]">Zone d'illustration</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
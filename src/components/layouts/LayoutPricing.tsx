'use client';

/** Pricing layout — 3 plans, toggle annuel/mensuel. */
interface LayoutPricingProps {
  content?: Record<string, unknown>;
}

export function LayoutPricing({ content }: LayoutPricingProps) {
  const plans = [
    { name: 'Starter', price: '29', desc: 'Pour démarrer' },
    { name: 'Pro', price: '79', desc: 'Le plus populaire', highlight: true },
    { name: 'Enterprise', price: 'Sur mesure', desc: 'Pour les équipes' },
  ];

  return (
    <section className="border-y border-[var(--border-subtle)] bg-[var(--bg-secondary)] px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl">
          Tarifs
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-[var(--text-secondary)]">
          Choisissez le plan adapté à vos besoins.
        </p>
        <div className="mt-8 flex justify-center">
          <div className="inline-flex rounded-lg border border-[var(--border-subtle)] p-1">
            <span className="rounded-md bg-[var(--bg-tertiary)] px-4 py-2 text-sm font-medium text-[var(--text-primary)]">
              Mensuel
            </span>
            <span className="rounded-md px-4 py-2 text-sm font-medium text-[var(--text-muted)]">
              Annuel
            </span>
          </div>
        </div>
        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {plans.map((p, i) => (
            <div
              key={i}
              className={`rounded-2xl border p-8 ${
                p.highlight
                  ? 'border-[var(--border-medium)] bg-[var(--bg-card)] shadow-lg'
                  : 'border-[var(--border-subtle)] bg-[var(--bg-card)]'
              }`}
            >
              {p.highlight && (
                <span className="mb-4 inline-block rounded-full bg-[var(--accent-cyan)]/15 px-3 py-1 text-xs font-medium text-[var(--accent-cyan)]">
                  Populaire
                </span>
              )}
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">{p.name}</h3>
              <p className="mt-2 text-3xl font-bold text-[var(--text-primary)]">
                {p.price}
                <span className="text-base font-normal text-[var(--text-muted)]">/mois</span>
              </p>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">{p.desc}</p>
              <a
                href="#"
                className={`mt-6 block rounded-xl py-3 text-center text-sm font-medium transition-colors ${
                  p.highlight
                    ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] hover:opacity-90'
                    : 'border border-[var(--border-medium)] text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
                }`}
              >
                Choisir
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

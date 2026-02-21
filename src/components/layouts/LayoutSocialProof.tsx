'use client';

/** Social proof layout — logos strip, stats. */
interface LayoutSocialProofProps {
  content?: Record<string, unknown>;
}

export function LayoutSocialProof({ content }: LayoutSocialProofProps) {
  const stats = [
    { value: '10k+', label: 'Clients' },
    { value: '99%', label: 'Satisfaction' },
    { value: '24/7', label: 'Support' },
  ];
  const logos = ['Partenaire A', 'Partenaire B', 'Partenaire C', 'Partenaire D'];

  return (
    <section className="border-y border-[var(--border-subtle)] bg-[var(--bg-secondary)] px-6 py-16">
      <div className="mx-auto max-w-6xl">
        <p className="text-center text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
          Ils nous font confiance
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-12 opacity-70">
          {logos.map((name, i) => (
            <span
              key={i}
              className="text-lg font-semibold text-[var(--text-secondary)]"
            >
              {name}
            </span>
          ))}
        </div>
        <div className="mt-16 grid grid-cols-3 gap-8 border-t border-[var(--border-subtle)] pt-16">
          {stats.map((s, i) => (
            <div key={i} className="text-center">
              <span className="block text-3xl font-bold text-[var(--text-primary)] sm:text-4xl">
                {s.value}
              </span>
              <span className="mt-1 block text-sm text-[var(--text-muted)]">{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

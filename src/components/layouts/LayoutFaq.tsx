'use client';

/** FAQ layout — accordéon, liste empilée. */
interface LayoutFaqProps {
  content?: Record<string, unknown>;
}

export function LayoutFaq({ content }: LayoutFaqProps) {
  const rawItems = (content?.items as { question?: string; answer?: string }[] | undefined);
  const items = rawItems?.length
    ? rawItems.map((i) => ({ q: i.question ?? '?', a: i.answer ?? '' }))
    : [
        { q: 'Question fréquente 1 ?', a: 'Réponse courte. Contenu générique pour prévisualisation.' },
        { q: 'Question fréquente 2 ?', a: 'Réponse courte. Description de la section.' },
        { q: 'Question fréquente 3 ?', a: 'Réponse courte. Contenu neutre.' },
      ];
  const title = (content?.title as string) ?? 'Questions fréquentes';

  return (
    <section className="px-6 py-20">
      <div className="mx-auto max-w-2xl">
        <h2 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl">
          {title}
        </h2>
        <div className="mt-12 space-y-4">
          {items.map((item, i) => (
            <details
              key={i}
              className="group rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] overflow-hidden"
            >
              <summary className="cursor-pointer px-6 py-4 font-medium text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors list-none flex items-center justify-between">
                {item.q}
                <span className="text-[var(--text-muted)] transition-transform group-open:rotate-180">▼</span>
              </summary>
              <div className="border-t border-[var(--border-subtle)] px-6 py-4">
                <p className="text-sm text-[var(--text-secondary)]">{item.a}</p>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

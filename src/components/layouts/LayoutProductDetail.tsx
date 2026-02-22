'use client';

interface LayoutProductDetailProps {
  content?: Record<string, unknown>;
}

export function LayoutProductDetail({ content }: LayoutProductDetailProps) {
  const title = (content?.title as string) ?? 'Détails du produit';
  const text = (content?.text as string) ?? 'Description détaillée du produit avec toutes les informations importantes.';
  const rawItems = (content?.items as { title?: string; text?: string }[] | undefined);
  const items = rawItems?.length
    ? rawItems.map((i) => ({ title: i.title ?? '—', text: i.text ?? '' }))
    : [
        { title: 'Format', text: 'Fichiers haute résolution inclus.' },
        { title: 'Licence', text: 'Licence commerciale complète.' },
        { title: 'Livraison', text: 'Téléchargement immédiat.' },
        { title: 'Support', text: 'Assistance technique incluse.' },
      ];

  return (
    <section className="px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl">
            {title}
          </h2>
          <p className="mt-6 max-w-4xl mx-auto text-lg leading-relaxed text-[var(--text-secondary)]">
            {text}
          </p>
        </div>
        <div className="mt-16 grid gap-8 sm:grid-cols-2">
          {items.map((item, i) => (
            <div key={i} className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-8">
              <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-4">
                {item.title}
              </h3>
              <p className="text-[var(--text-secondary)] leading-relaxed">
                {item.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
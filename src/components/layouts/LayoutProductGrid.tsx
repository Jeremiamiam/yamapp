'use client';

interface LayoutProductGridProps {
  content?: Record<string, unknown>;
}

export function LayoutProductGrid({ content }: LayoutProductGridProps) {
  const title = (content?.title as string) ?? 'Nos produits';
  const text = (content?.text as string) ?? 'Découvrez notre sélection de produits.';
  
  const rawItems = (content?.items as { title?: string; text?: string; price?: string; format?: string; image?: string }[] | undefined);
  const items = rawItems?.length
    ? rawItems.map((item) => ({
        title: item.title ?? 'Produit',
        text: item.text ?? 'Description du produit.',
        price: item.price ?? '0 €',
        format: item.format ?? 'Format non spécifié',
        image: item.image ?? 'placeholder.jpg'
      }))
    : [
        {
          title: 'Produit 1',
          text: 'Description du premier produit avec détails.',
          price: '29 €',
          format: 'PSD + Figma — 12 fichiers',
          image: 'placeholder1.jpg'
        },
        {
          title: 'Produit 2',
          text: 'Description du second produit avec spécifications.',
          price: '24 €',
          format: 'PSD — 8 fichiers',
          image: 'placeholder2.jpg'
        },
        {
          title: 'Produit 3',
          text: 'Description du troisième produit.',
          price: '24 €',
          format: 'PSD + Figma — 10 fichiers',
          image: 'placeholder3.jpg'
        }
      ];

  return (
    <section className="px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl">
            {title}
          </h2>
          <p className="mt-6 max-w-3xl mx-auto text-lg leading-relaxed text-[var(--text-secondary)]">
            {text}
          </p>
        </div>
        
        <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item, i) => (
            <div key={i} className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] overflow-hidden">
              <div className="aspect-[4/3] bg-[var(--bg-tertiary)]">
                <img 
                  src={item.image} 
                  alt={item.title}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
                  {item.text}
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xl font-bold text-[var(--accent-cyan)]">
                    {item.price}
                  </span>
                </div>
                <p className="mt-2 text-xs text-[var(--text-muted)]">
                  {item.format}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
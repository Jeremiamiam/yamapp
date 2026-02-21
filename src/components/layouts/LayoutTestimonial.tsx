'use client';

/** Testimonial layout — 2 cartes côte à côte. */
interface LayoutTestimonialProps {
  content?: Record<string, unknown>;
}

export function LayoutTestimonial({ content }: LayoutTestimonialProps) {
  const rawQuotes = (content?.quotes as { text?: string; author_name?: string; role?: string }[] | undefined)
    ?? (content?.single_quote ? [(content.single_quote as { text?: string; author_name?: string }) as { text?: string; author_name?: string; role?: string }] : null);
  const quotes = rawQuotes?.length
    ? rawQuotes.map((q) => ({ text: q.text ?? '', author: q.author_name ?? '—', role: q.role ?? '' }))
    : [
        { text: 'Citation ou témoignage court. Contenu générique pour prévisualisation.', author: 'Personne A', role: 'Titre' },
        { text: 'Autre citation. Description de la section. Contenu neutre.', author: 'Personne B', role: 'Titre' },
      ];

  const title = (content?.title as string) ?? 'Témoignages';
  return (
    <section className="px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl">
          {title}
        </h2>
        <div className="mt-16 grid gap-8 md:grid-cols-2">
          {quotes.map((q, i) => (
            <blockquote
              key={i}
              className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-8"
            >
              <p className="text-lg leading-relaxed text-[var(--text-secondary)]">&ldquo;{q.text || '—'}&rdquo;</p>
              <footer className="mt-6">
                <cite className="not-italic font-semibold text-[var(--text-primary)]">{q.author}</cite>
                {q.role ? <span className="text-sm text-[var(--text-muted)]"> — {q.role}</span> : null}
              </footer>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}

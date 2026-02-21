'use client';

/** Contact form layout — 2-col (texte + formulaire). */
interface LayoutContactFormProps {
  content?: Record<string, unknown>;
}

export function LayoutContactForm({ content }: LayoutContactFormProps) {
  return (
    <section className="border-y border-[var(--border-subtle)] bg-[var(--bg-secondary)] px-6 py-20">
      <div className="mx-auto grid max-w-5xl gap-12 md:grid-cols-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl">
            Contact
          </h2>
          <p className="mt-4 text-[var(--text-secondary)]">
            Description de la section. Contenu générique pour prévisualisation. Formulaire de contact ou capture de lead.
          </p>
        </div>
        <form className="space-y-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6">
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)]">Email</label>
            <input
              type="email"
              placeholder="vous@exemple.fr"
              className="mt-1 w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-tertiary)] px-4 py-2.5 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--border-medium)] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)]">Message</label>
            <textarea
              rows={4}
              placeholder="Votre message..."
              className="mt-1 w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-tertiary)] px-4 py-2.5 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--border-medium)] focus:outline-none resize-none"
            />
          </div>
          <button
            type="button"
            className="w-full rounded-xl bg-[var(--text-primary)] py-3 text-sm font-medium text-[var(--bg-primary)] hover:opacity-90 transition-opacity"
          >
            Envoyer
          </button>
        </form>
      </div>
    </section>
  );
}

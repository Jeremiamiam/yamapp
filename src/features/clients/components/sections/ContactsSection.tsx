'use client';

import { useClient, useModal } from '@/hooks';

const User = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

const Plus = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

interface ContactsSectionProps {
  clientId: string;
}

export function ContactsSection({ clientId }: ContactsSectionProps) {
  const client = useClient(clientId);
  const { openContactModal } = useModal();
  if (!client) return null;

  return (
    <div className="bg-[var(--bg-card)] rounded-xl sm:rounded-2xl border border-[var(--border-subtle)] overflow-hidden">
      <div className="px-4 sm:px-5 py-4 border-b border-[var(--border-subtle)] flex items-center gap-2">
        <User />
        <h2 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider">
          Contacts
        </h2>
        <span className="text-xs text-[var(--text-muted)] bg-[var(--bg-tertiary)] px-2 py-0.5 rounded-full">
          {client.contacts.length}
        </span>
        <button
          onClick={() => openContactModal(clientId)}
          className="ml-auto p-1.5 rounded-lg bg-[var(--accent-cyan)]/10 text-[var(--accent-cyan)] hover:bg-[var(--accent-cyan)]/20 transition-colors"
          title="Ajouter un contact"
        >
          <Plus />
        </button>
      </div>

      <div className="divide-y divide-[var(--border-subtle)]">
        {client.contacts.length === 0 ? (
          <button
            onClick={() => openContactModal(clientId)}
            className="w-full px-5 py-8 text-center text-[var(--text-muted)] text-sm hover:bg-[var(--bg-secondary)] hover:text-[var(--accent-cyan)] transition-colors"
          >
            + Ajouter un contact
          </button>
        ) : (
          client.contacts.map((contact, index) => (
            <button
              key={contact.id}
              type="button"
              className="w-full text-left px-4 sm:px-5 py-2.5 hover:bg-[var(--bg-secondary)] transition-colors animate-fade-in-up cursor-pointer group flex items-baseline gap-2 flex-wrap"
              style={{ animationDelay: `${index * 0.05}s` }}
              onClick={() => openContactModal(clientId, contact)}
            >
              <span className="font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent-cyan)] transition-colors">
                {contact.name}
              </span>
              <span className="text-xs text-[var(--text-muted)]">
                {contact.role}
              </span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

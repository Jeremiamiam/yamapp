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

const Mail = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
);

const Phone = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
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
            <div
              key={contact.id}
              className="px-5 py-4 hover:bg-[var(--bg-secondary)] transition-colors animate-fade-in-up cursor-pointer group"
              style={{ animationDelay: `${index * 0.05}s` }}
              onClick={() => openContactModal(clientId, contact)}
            >
              <p className="font-semibold text-[var(--text-primary)] mb-1 group-hover:text-[var(--accent-cyan)] transition-colors">
                {contact.name}
              </p>
              <p className="text-xs text-[var(--accent-violet)] mb-3">
                {contact.role}
              </p>
              <div className="space-y-1.5">
                <a
                  href={`mailto:${contact.email}`}
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-2 text-xs text-[var(--text-muted)] hover:text-[var(--accent-cyan)] transition-colors"
                >
                  <Mail />
                  <span>{contact.email}</span>
                </a>
                {contact.phone && (
                  <a
                    href={`tel:${contact.phone}`}
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-2 text-xs text-[var(--text-muted)] hover:text-[var(--accent-lime)] transition-colors"
                  >
                    <Phone />
                    <span>{contact.phone}</span>
                  </a>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

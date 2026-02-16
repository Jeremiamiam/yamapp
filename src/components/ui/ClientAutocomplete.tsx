'use client';

import { useState, useRef, useEffect } from 'react';
import { useAppStore } from '@/lib/store';

interface ClientAutocompleteProps {
  value: string; // clientId ou ''
  onChange: (clientId: string) => void;
  onCreateClient?: (name: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export function ClientAutocomplete({
  value,
  onChange,
  onCreateClient,
  placeholder = 'Nom du client...',
  autoFocus = false,
}: ClientAutocompleteProps) {
  const { clients, addClient } = useAppStore();
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Sync input value with selected client
  useEffect(() => {
    if (value) {
      const client = clients.find((c) => c.id === value);
      if (client) {
        setInputValue(client.name);
      }
    } else {
      // Ne pas reset si l'utilisateur tape
    }
  }, [value, clients]);

  // Filter clients based on input
  const filteredClients = inputValue.trim()
    ? clients.filter((c) =>
        c.name.toLowerCase().includes(inputValue.toLowerCase())
      )
    : clients;

  // Check if exact match exists
  const exactMatch = clients.find(
    (c) => c.name.toLowerCase() === inputValue.trim().toLowerCase()
  );
  const showCreateOption = inputValue.trim() && !exactMatch;

  const totalOptions = filteredClients.length + (showCreateOption ? 1 : 0);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setIsOpen(true);
    setHighlightedIndex(0);
    
    // Si on efface tout, on déselectionne le client
    if (!newValue.trim()) {
      onChange('');
    }
  };

  const [justSelected, setJustSelected] = useState(false);
  
  const handleSelectClient = (clientId: string) => {
    onChange(clientId);
    const client = clients.find((c) => c.id === clientId);
    if (client) {
      setInputValue(client.name);
      // Flash visuel de confirmation
      setJustSelected(true);
      setTimeout(() => setJustSelected(false), 600);
    }
    setIsOpen(false);
  };

  const handleCreateClient = async () => {
    const name = inputValue.trim();
    if (!name) return;

    // Créer le client (contacts et documents sont gérés par le store)
    const result = await addClient({
      name,
      status: 'client',
    });

    if (result) {
      onChange(result.client.id);
      setInputValue(result.client.name);
      
      // Afficher un message si le client existait déjà
      if (result.isExisting) {
        setFeedbackMessage(`"${result.client.name}" existe déjà, sélectionné`);
        setTimeout(() => setFeedbackMessage(null), 3000);
      }
    }
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev + 1) % totalOptions);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev - 1 + totalOptions) % totalOptions);
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex < filteredClients.length) {
          handleSelectClient(filteredClients[highlightedIndex].id);
        } else if (showCreateOption) {
          handleCreateClient();
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
    }
  };

  const handleBlur = (e: React.FocusEvent) => {
    // Delay to allow click on option
    setTimeout(() => {
      if (!listRef.current?.contains(document.activeElement)) {
        setIsOpen(false);
      }
    }, 150);
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsOpen(true)}
        onBlur={handleBlur}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className={`w-full px-3 py-2 rounded-lg border bg-[var(--bg-tertiary)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-cyan)]/50 transition-all duration-300 ${
          justSelected 
            ? 'border-[var(--accent-lime)] ring-2 ring-[var(--accent-lime)]/30' 
            : 'border-[var(--border-subtle)] focus:border-[var(--accent-cyan)]'
        }`}
      />
      
      {/* Message de feedback */}
      {feedbackMessage && (
        <div className="absolute top-full left-0 right-0 mt-1 px-3 py-2 rounded-lg bg-[var(--accent-amber)]/20 border border-[var(--accent-amber)]/40 text-sm text-[var(--accent-amber)] animate-fade-in">
          {feedbackMessage}
        </div>
      )}

      {isOpen && (filteredClients.length > 0 || showCreateOption) && (
        <div
          ref={listRef}
          className="absolute z-50 top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] shadow-lg"
        >
          {filteredClients.map((client, index) => (
            <button
              key={client.id}
              type="button"
              onClick={() => handleSelectClient(client.id)}
              className={`w-full px-3 py-2 text-left text-sm transition-colors cursor-pointer ${
                index === highlightedIndex
                  ? 'bg-[var(--accent-cyan)]/10 text-[var(--text-primary)]'
                  : 'text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
              }`}
            >
              {client.name}
              <span className="ml-2 text-xs text-[var(--text-muted)]">
                {client.status === 'prospect' ? '(prospect)' : ''}
              </span>
            </button>
          ))}

          {showCreateOption && (
            <button
              type="button"
              onClick={handleCreateClient}
              className={`w-full px-3 py-2 text-left text-sm border-t border-[var(--border-subtle)] transition-colors cursor-pointer ${
                highlightedIndex === filteredClients.length
                  ? 'bg-[var(--accent-lime)]/10'
                  : 'hover:bg-[var(--bg-tertiary)]'
              }`}
            >
              <span className="text-[var(--accent-lime)] font-medium">+ Créer "</span>
              <span className="text-[var(--text-primary)] font-semibold">{inputValue.trim()}</span>
              <span className="text-[var(--accent-lime)] font-medium">"</span>
              <span className="ml-2 text-xs text-[var(--text-muted)]">(Entrée)</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

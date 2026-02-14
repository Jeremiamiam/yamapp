'use client';

import { useEffect, ReactNode } from 'react';
import { useKeyPress } from '@/hooks';

// Icons
const X = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  iconBg?: string;
  iconColor?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export function Modal({ 
  isOpen, 
  onClose, 
  title, 
  subtitle,
  icon,
  iconBg = 'bg-[var(--bg-tertiary)]',
  iconColor = 'text-[var(--text-secondary)]',
  children, 
  footer,
  size = 'md'
}: ModalProps) {
  
  useKeyPress('Escape', () => {
    if (isOpen) onClose();
  });

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl'
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in-up" />
      
      {/* Modal */}
      <div 
        className={`relative w-full ${sizeClasses[size]} max-h-[85vh] bg-[var(--bg-card)] rounded-2xl border border-[var(--border-subtle)] shadow-2xl overflow-hidden animate-fade-in-up flex flex-col`}
        onClick={e => e.stopPropagation()}
        style={{ animationDuration: '0.2s' }}
      >
        {/* Header */}
        <div className="flex-shrink-0 px-6 py-5 border-b border-[var(--border-subtle)] flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 min-w-0">
            {icon && (
              <span className={`p-2.5 rounded-xl ${iconBg} ${iconColor} flex-shrink-0`}>
                {icon}
              </span>
            )}
            <div className="min-w-0">
              {subtitle && (
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1 block">
                  {subtitle}
                </span>
              )}
              <h2 className="text-xl font-bold text-[var(--text-primary)]">
                {title}
              </h2>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors flex-shrink-0"
          >
            <X />
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
        
        {/* Footer */}
        {footer && (
          <div className="flex-shrink-0 px-6 py-4 border-t border-[var(--border-subtle)] flex items-center justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// Composants de formulaire réutilisables
interface FormFieldProps {
  label: string;
  required?: boolean;
  children: ReactNode;
  error?: string;
}

export function FormField({ label, required, children, error }: FormFieldProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-[var(--text-secondary)]">
        {label}
        {required && <span className="text-[var(--accent-magenta)] ml-1">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-xs text-[var(--accent-magenta)]">{error}</p>
      )}
    </div>
  );
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export function Input({ className = '', ...props }: InputProps) {
  return (
    <input
      className={`w-full px-4 py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-cyan)] focus:ring-1 focus:ring-[var(--accent-cyan)]/20 transition-colors ${className}`}
      {...props}
    />
  );
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export function Textarea({ className = '', ...props }: TextareaProps) {
  return (
    <textarea
      className={`w-full px-4 py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-cyan)] focus:ring-1 focus:ring-[var(--accent-cyan)]/20 transition-colors resize-none ${className}`}
      {...props}
    />
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: { value: string; label: string }[];
}

export function Select({ options, className = '', ...props }: SelectProps) {
  return (
    <select
      className={`w-full px-4 py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-cyan)] focus:ring-1 focus:ring-[var(--accent-cyan)]/20 transition-colors ${className}`}
      {...props}
    >
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  );
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
}

export function Button({ variant = 'primary', className = '', children, ...props }: ButtonProps) {
  const variants = {
    primary: 'bg-[var(--accent-cyan)] text-black hover:bg-[var(--accent-cyan)]/90',
    secondary: 'bg-[var(--bg-tertiary)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]',
    danger: 'bg-[var(--accent-magenta)]/20 text-[var(--accent-magenta)] hover:bg-[var(--accent-magenta)]/30'
  };
  
  return (
    <button
      className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

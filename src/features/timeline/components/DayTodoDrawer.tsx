'use client';

import { useEffect } from 'react';
import { DayTodoZone } from './DayTodoZone';

const X = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

interface DayTodoDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DayTodoDrawer({ isOpen, onClose }: DayTodoDrawerProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <button
        type="button"
        onClick={onClose}
        className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm animate-fade-in-up"
        aria-label="Fermer"
      />

      {/* Drawer - bottom sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-[61] flex flex-col max-h-[85vh] bg-[var(--bg-primary)] rounded-t-2xl border-t border-x border-[var(--border-subtle)] shadow-[0_-8px_30px_rgba(0,0,0,0.4)] animate-slide-up"
        role="dialog"
        aria-modal="true"
        aria-label="Todo du jour"
      >
        {/* Handle bar (centered) + close (top-right) */}
        <div className="flex-shrink-0 relative flex justify-center pt-2 pb-2">
          <div className="w-10 h-1 rounded-full bg-[var(--text-muted)]/40" aria-hidden />
          <button
            type="button"
            onClick={onClose}
            className="absolute right-2 top-2 p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Fermer"
          >
            <X />
          </button>
        </div>

        {/* Content - DayTodoZone */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
          <DayTodoZone />
        </div>
      </div>
    </>
  );
}

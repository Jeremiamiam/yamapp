'use client';

import { getLayoutForRoleWithFallback } from '@/lib/section-registry';
import { LayoutPlaceholder } from '@/components/layouts/LayoutPlaceholder';

export interface LayoutCardProps {
  role: string;
  label: string;
  group: 'standard' | 'custom';
  isSelected: boolean;
  onClick: () => void;
  onCreateVariant?: () => void;
}

export function LayoutCard({ role, label, group, isSelected, onClick, onCreateVariant }: LayoutCardProps) {
  const { layout: LayoutComponent } = getLayoutForRoleWithFallback(role);

  return (
    <div className="flex flex-col gap-1.5">
      {/* Card container */}
      <button
        type="button"
        onClick={onClick}
        className={`relative block w-full overflow-hidden rounded-lg border-2 transition-all cursor-pointer focus:outline-none ${
          isSelected
            ? 'border-[var(--accent-cyan)] ring-2 ring-[var(--accent-cyan)]/30'
            : 'border-[var(--border-subtle)] hover:border-[var(--border-medium)]'
        }`}
        style={{ height: '160px' }}
      >
        {/* Scaled layout preview */}
        <div
          className="absolute inset-0"
          data-theme="light"
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '454%',
              height: '454%',
              transform: 'scale(0.22)',
              transformOrigin: 'top left',
              pointerEvents: 'none',
            }}
          >
            {LayoutComponent ? (
              <LayoutComponent content={{}} />
            ) : (
              <LayoutPlaceholder role={role} />
            )}
          </div>
        </div>

        {/* Selected overlay indicator */}
        {isSelected && (
          <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[var(--accent-cyan)] flex items-center justify-center">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-black">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        )}
      </button>

      {/* Card footer */}
      <div className="flex items-center justify-between gap-1 px-0.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-sm font-medium text-[var(--text-primary)] truncate">{label}</span>
          <span
            className={`flex-shrink-0 text-[10px] px-1.5 py-0.5 rounded font-medium ${
              group === 'custom'
                ? 'bg-[var(--accent-violet)]/15 text-[var(--accent-violet)]'
                : 'bg-[var(--accent-cyan)]/15 text-[var(--accent-cyan)]'
            }`}
          >
            {group === 'custom' ? 'custom' : 'standard'}
          </span>
        </div>
        {onCreateVariant && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onCreateVariant(); }}
            className="flex-shrink-0 text-[10px] px-1.5 py-0.5 rounded text-[var(--accent-violet)] hover:bg-[var(--accent-violet)]/10 transition-colors whitespace-nowrap"
          >
            + variante
          </button>
        )}
      </div>
    </div>
  );
}

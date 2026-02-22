'use client';

import { getAvailableLayouts } from '@/lib/section-registry';
import { LayoutCard } from './LayoutCard';

export interface LayoutGalleryGridProps {
  onSelectLayout: (role: string) => void;
  selectedRole: string | null;
  onCreateVariant: (baseRole: string) => void;
}

export function LayoutGalleryGrid({ onSelectLayout, selectedRole, onCreateVariant }: LayoutGalleryGridProps) {
  const layouts = getAvailableLayouts();
  const standardLayouts = layouts.filter((l) => l.group === 'standard');
  const customLayouts = layouts.filter((l) => l.group === 'custom');

  return (
    <div className="space-y-8">
      {/* Standard layouts */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)]">Standard</h2>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--accent-cyan)]/10 text-[var(--accent-cyan)]">
            {standardLayouts.length}
          </span>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {standardLayouts.map((layout) => (
            <LayoutCard
              key={layout.role}
              role={layout.role}
              label={layout.label}
              group={layout.group}
              isSelected={selectedRole === layout.role}
              onClick={() => onSelectLayout(layout.role)}
              onCreateVariant={() => onCreateVariant(layout.role)}
            />
          ))}
        </div>
      </section>

      {/* Custom layouts */}
      {customLayouts.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)]">Custom</h2>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--accent-violet)]/10 text-[var(--accent-violet)]">
              {customLayouts.length}
            </span>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {customLayouts.map((layout) => (
              <LayoutCard
                key={layout.role}
                role={layout.role}
                label={layout.label}
                group={layout.group}
                isSelected={selectedRole === layout.role}
                onClick={() => onSelectLayout(layout.role)}
                onCreateVariant={() => onCreateVariant(layout.role)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

'use client';

import { memo, useRef, useCallback } from 'react';
import { Deliverable, TeamMember } from '@/types';

// Délai d'animation stable par id
function stableDelay(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h << 5) - h + id.charCodeAt(i);
  return (Math.abs(h) % 25) * 0.01; // 0 à 0.24s
}

// Icons
const PhoneIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
  </svg>
);

const PresentationIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 17V7a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
  </svg>
);

const PackageIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

const ClockIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z" />
  </svg>
);

const GripIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 8h.01M20 8h.01M4 16h.01M20 16h.01M4 12h16" />
  </svg>
);

export interface TimelineCardItem {
  id: string;
  type: 'deliverable' | 'call';
  clientId: string;
  clientName: string;
  clientStatus: 'client' | 'prospect';
  label: string;
  time: string;
  status?: Deliverable['status'];
  assignee?: TeamMember;
  deliverableType?: 'creative' | 'document' | 'other'; // Added
  isPresentation?: boolean; // Added
}

type GetDropTargetFn = (clientX: number, clientY: number) => { date: Date; hour: number; minutes: number } | null;
type OnMoveFn = (itemId: string, type: 'deliverable' | 'call', newDate: Date) => void;
type DragItem = TimelineCardItem & { hour?: number; minutes?: number };
type OnDragStartFn = (item: DragItem, type: 'deliverable' | 'call', x: number, y: number) => void;

interface TimelineCardProps {
  item: TimelineCardItem;
  top: number;
  index: number;
  onClick?: () => void;
  getDropTarget?: GetDropTargetFn;
  onMove?: OnMoveFn;
  onDragStart?: OnDragStartFn;
  onDragMove?: (x: number, y: number) => void;
  onDragEnd?: () => void;
  skipClickAfterDragRef?: React.MutableRefObject<string | null>;
  isGhost?: boolean;
  isDragging?: boolean;
}

const DRAG_THRESHOLD_PX = 5;

function TimelineCardInner({
  item,
  top,
  onClick,
  getDropTarget,
  onMove,
  onDragStart,
  onDragMove,
  onDragEnd,
  skipClickAfterDragRef,
  isGhost = false,
  isDragging = false,
}: TimelineCardProps) {
  const isCall = item.type === 'call';
  const isCompleted = item.status === 'completed';
  const isInProgress = item.status === 'in-progress';
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const didDragRef = useRef(false);
  const hasNotifiedDragStartRef = useRef(false);

  const handleHandleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!getDropTarget || !onMove || isGhost) return;
      dragStartRef.current = { x: e.clientX, y: e.clientY };
      didDragRef.current = false;
      hasNotifiedDragStartRef.current = false;

      const onMouseMove = (e: MouseEvent) => {
        if (!dragStartRef.current) return;
        const dx = e.clientX - dragStartRef.current.x;
        const dy = e.clientY - dragStartRef.current.y;
        if (Math.abs(dx) > DRAG_THRESHOLD_PX || Math.abs(dy) > DRAG_THRESHOLD_PX) {
          didDragRef.current = true;
          if (!hasNotifiedDragStartRef.current && onDragStart) {
            hasNotifiedDragStartRef.current = true;
            onDragStart(item as DragItem, item.type, e.clientX, e.clientY);
          }
          onDragMove?.(e.clientX, e.clientY);
        }
      };

      const onMouseUp = (e: MouseEvent) => {
        if (!dragStartRef.current) return;
        if (didDragRef.current) {
          const target = getDropTarget(e.clientX, e.clientY);
          if (target) {
            skipClickAfterDragRef && (skipClickAfterDragRef.current = item.id);
            onMove(item.id, item.type, target.date);
          }
          onDragEnd?.();
        }
        dragStartRef.current = null;
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      };

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    },
    [getDropTarget, onMove, onDragStart, onDragMove, onDragEnd, skipClickAfterDragRef, item, isGhost]
  );

  const handleCardClick = useCallback(() => {
    if (skipClickAfterDragRef?.current === item.id) {
      skipClickAfterDragRef.current = null;
      return;
    }
    if (didDragRef.current) {
      didDragRef.current = false;
      return;
    }
    onClick?.();
  }, [onClick, skipClickAfterDragRef, item.id]);

  // COULEURS BASÉES SUR LE MEMBRE (ASSIGNEE)
  const assigneeColor = item.assignee?.color || '#52525b'; // Zinc-600 fallback
  
  // Conversion hex -> rgba
  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  // STYLE 2026: Border fine + Glow subtil + Fond sombre clean
  const style = {
    // Fond très sombre légèrement teinté par la couleur du membre
    bg: `linear-gradient(145deg, ${hexToRgba('#18181b', 1)}, ${hexToRgba('#09090b', 1)})`,
    // Bordure fine avec la couleur du membre (faible opacité par défaut)
    border: `1px solid ${hexToRgba(assigneeColor, 0.2)}`,
    // Glow au hover
    hoverGlow: `0 0 20px ${hexToRgba(assigneeColor, 0.15)}`,
    // Bordure au hover (plus visible)
    hoverBorder: `1px solid ${hexToRgba(assigneeColor, 0.6)}`,
    accent: assigneeColor,
  };

  const delay = stableDelay(item.id);

  return (
    <div
      className={`rounded-xl overflow-hidden group transition-all duration-300 ease-out
        ${isGhost ? 'opacity-90 scale-105 z-50 cursor-grabbing' : isDragging ? 'opacity-0 pointer-events-none' : 'absolute left-2 right-2 cursor-pointer opacity-0 animate-fade-in-up z-[1] hover:z-[5] hover:-translate-y-0.5'}`}
      style={{
        background: style.bg,
        border: style.border,
        boxShadow: isGhost ? style.hoverGlow : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        ...(isGhost
          ? {}
          : {
              top,
              animationDelay: `${delay}s`,
              animationFillMode: 'forwards',
              willChange: 'transform, box-shadow, border-color',
            })
      }}
      onClick={isGhost ? undefined : handleCardClick}
      onMouseEnter={isGhost ? undefined : (e) => {
        const el = e.currentTarget;
        el.style.borderColor = assigneeColor;
        el.style.boxShadow = style.hoverGlow;
      }}
      onMouseLeave={isGhost ? undefined : (e) => {
        const el = e.currentTarget;
        el.style.borderColor = hexToRgba(assigneeColor, 0.2);
        el.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
      }}
    >
      {/* Horaire en haut — aligné avec la grille (top de la card = début du créneau) */}
      <div className="px-3 py-1 border-b border-white/5 flex items-center">
        <span className="text-[11px] font-mono text-zinc-500 tracking-wide">
          {item.time}
        </span>
      </div>

      {/* Contenu principal */}
      <div className="px-3 py-2.5 flex flex-col gap-1.5">
        
        {/* Ligne 1: Client + Actions */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
             {/* Petit point indicateur statut (plus discret que le badge) */}
            <div 
              className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                item.clientStatus === 'client' ? 'bg-[#22d3ee] shadow-[0_0_8px_#22d3ee]' : 'bg-[#fbbf24] shadow-[0_0_8px_#fbbf24]'
              }`} 
              title={item.clientStatus === 'client' ? 'Client' : 'Prospect'}
            />
            <span className="text-[13px] font-bold text-zinc-100 truncate tracking-tight">
              {item.clientName}
            </span>
          </div>

          {!isGhost && getDropTarget && onMove && (
            <button
              type="button"
              className="p-1 rounded text-zinc-500 opacity-0 group-hover:opacity-100 hover:text-zinc-300 hover:bg-white/5 transition-all cursor-grab active:cursor-grabbing"
              onMouseDown={handleHandleMouseDown}
              onClick={e => e.stopPropagation()}
            >
              <GripIcon />
            </button>
          )}
        </div>

        {/* Ligne 2: Tâche / Call */}
        <div className="flex items-center gap-2">
          {isCall ? (
             item.isPresentation ? (
               <span className="text-[var(--accent-violet)] opacity-90">
                 <PresentationIcon />
               </span>
             ) : (
               <span className="text-[var(--accent-coral)]">
                 <PhoneIcon />
               </span>
             )
          ) : (
             // Deliverable
             (item.deliverableType === 'creative' || item.deliverableType === 'document') ? (
               <span className="text-[var(--accent-cyan)] opacity-90">
                 <PackageIcon />
               </span>
             ) : (
               // Petit trait vertical décoratif pour les tâches classiques
               <div className="w-0.5 h-3 bg-zinc-700 rounded-full" />
             )
          )}
          <span className="text-[13px] font-medium text-zinc-400 truncate leading-snug">
            {item.label}
          </span>
        </div>
      </div>

      {/* Footer minimaliste (statut + assigné) */}
      <div className="px-3 py-2 border-t border-white/5 bg-white/[0.01] flex items-center justify-end gap-2">
        {isCompleted && <CheckIcon />}
        {isInProgress && (
          <span className="animate-pulse text-[var(--accent-violet)]"><ClockIcon /></span>
        )}
        {item.assignee && (
          <div
            className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-black shadow-sm ring-1 ring-black/20"
            style={{ backgroundColor: item.assignee.color }}
            title={item.assignee.name}
          >
            {item.assignee.initials}
          </div>
        )}
      </div>
    </div>
  );
}

export const TimelineCard = memo(TimelineCardInner);
'use client';

import { memo, useRef, useCallback } from 'react';
import { Deliverable, TeamMember } from '@/types';

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

export interface TimelineCardItem {
  id: string;
  type: 'deliverable' | 'call' | 'todo';
  clientId: string;
  clientName: string;
  clientStatus: 'client' | 'prospect';
  label: string;
  time: string;
  status?: Deliverable['status'];
  assignee?: TeamMember;
  deliverableType?: 'creative' | 'document' | 'other';
  isPresentation?: boolean;
  isTodo?: boolean; // For visual distinction
}

type GetDropTargetFn = (clientX: number, clientY: number) => { date: Date; hour: number; minutes: number } | null;
type OnMoveFn = (itemId: string, type: 'deliverable' | 'call' | 'todo', newDate: Date) => void;
type DragItem = TimelineCardItem & { hour?: number; minutes?: number };
type OnDragStartFn = (item: DragItem, type: 'deliverable' | 'call' | 'todo', x: number, y: number) => void;

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
  /** True juste après un drop : courte animation "atterrissage" */
  justLanded?: boolean;
  /** Mode compact (2 semaines): affichage ultra-condensé */
  compact?: boolean;
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
  justLanded = false,
  compact = false,
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

  // MINI-CARD POUR LES TODOS
  if (item.type === 'todo') {
    const todoColor = item.assignee?.color || '#84cc16'; // Lime fallback
    const todoColorDark = item.assignee?.color
      ? `color-mix(in srgb, ${item.assignee.color} 80%, #000 20%)`
      : '#65a30d';

    // Version compacte pour todos — harmonisée avec les cards event compactes
    if (compact) {
      const todoBorder = (alpha: number) => {
        if (todoColor.startsWith('#')) {
          const r = parseInt(todoColor.slice(1, 3), 16);
          const g = parseInt(todoColor.slice(3, 5), 16);
          const b = parseInt(todoColor.slice(5, 7), 16);
          return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        }
        return todoColor;
      };
      return (
        <div
          className={`rounded-lg overflow-hidden group transition-all duration-150
            ${isGhost
              ? 'opacity-95 scale-105 z-50 cursor-grabbing shadow-lg'
              : isDragging
                ? 'opacity-0 pointer-events-none'
                : `absolute left-1 right-1 cursor-pointer z-10 hover:z-20 ${justLanded ? 'animate-card-land' : ''}`}`}
          style={{
            background: `linear-gradient(135deg, ${todoColor} 0%, ${todoColorDark} 100%)`,
            border: `1.5px solid ${todoBorder(0.55)}`,
            boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
            ...(isGhost ? {} : { top })
          }}
          onClick={isGhost ? undefined : handleCardClick}
          onMouseEnter={isGhost ? undefined : (e) => {
            const el = e.currentTarget;
            el.style.borderColor = todoColor;
          }}
          onMouseLeave={isGhost ? undefined : (e) => {
            const el = e.currentTarget;
            el.style.borderColor = todoBorder(0.55);
          }}
        >
          {/* Barre : "Todo" à gauche, heure à droite (zone de drag) */}
          <div
            className={`flex items-center justify-between px-2 py-0.5 border-b border-black/10 ${!isGhost && getDropTarget && onMove ? 'cursor-grab active:cursor-grabbing' : ''}`}
            onMouseDown={!isGhost && getDropTarget && onMove ? handleHandleMouseDown : undefined}
            onClick={!isGhost ? (e) => e.stopPropagation() : undefined}
            role={!isGhost && getDropTarget && onMove ? 'button' : undefined}
            aria-label={!isGhost && getDropTarget && onMove ? 'Déplacer' : undefined}
          >
            <span className="text-[11px] font-semibold text-zinc-800 truncate">{'Todo'}</span>
            <span className="text-[11px] font-semibold font-mono text-zinc-800 tabular-nums flex-shrink-0 ml-1">{item.time}</span>
          </div>
          {/* Contenu : tout ferré à gauche, label seul (pas de client pour les todos) */}
          <div className="px-2 py-1.5 flex flex-col items-stretch gap-0.5 text-left">
            <span className="text-xs font-semibold text-zinc-900 truncate leading-tight">
              {item.label}
            </span>
          </div>
        </div>
      );
    }

    // Version normale pour todos — barre "Todo" + heure, puis contenu
    return (
      <div
        className={`rounded-lg overflow-hidden transition-all duration-200
          ${isGhost
            ? 'opacity-95 scale-105 z-50 cursor-grabbing'
            : isDragging
              ? 'opacity-0 pointer-events-none'
              : `absolute left-2 right-2 z-10 hover:z-20 ${justLanded ? 'animate-card-land' : ''}`}`}
        style={{
          background: `linear-gradient(135deg, ${todoColor} 0%, ${todoColorDark} 100%)`,
          border: `1px solid ${todoColor}40`,
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          ...(isGhost ? {} : { top })
        }}
      >
        {/* Barre : "Todo" à gauche, heure à droite (zone de drag) */}
        <div
          className={`flex items-center justify-between px-2.5 py-1 border-b border-black/10 ${!isGhost && getDropTarget && onMove ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}`}
          onMouseDown={!isGhost && getDropTarget && onMove ? handleHandleMouseDown : undefined}
          onClick={!isGhost && !getDropTarget ? handleCardClick : (e) => e.stopPropagation()}
          role={!isGhost && getDropTarget && onMove ? 'button' : undefined}
          aria-label={!isGhost && getDropTarget && onMove ? 'Déplacer' : undefined}
        >
          <span className="text-xs font-semibold text-zinc-800 truncate">{'Todo'}</span>
          <span className="text-xs font-semibold font-mono text-zinc-800 tabular-nums flex-shrink-0">{item.time}</span>
        </div>
        <div className="px-2.5 py-2 flex items-center gap-2">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
            <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
            <path d="M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2v0z" />
          </svg>
          <span className="text-xs font-medium text-zinc-900 flex-1 min-w-0 truncate">{item.label}</span>
        </div>
      </div>
    );
  }

  // COULEURS BASÉES SUR LE MEMBRE (ASSIGNEE)
  const assigneeColor = item.assignee?.color || '#52525b'; // Zinc-600 fallback

  // Conversion hex -> rgba
  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  // MODE COMPACT (2 SEMAINES) — Tout à gauche, client en entier, livrable indiqué, pas de picto
  if (compact) {
    const style = {
      bg: `linear-gradient(145deg, ${hexToRgba('#18181b', 1)}, ${hexToRgba('#09090b', 1)})`,
      border: `1.5px solid ${hexToRgba(assigneeColor, 0.55)}`,
      hoverBorder: `1.5px solid ${assigneeColor}`,
      accent: assigneeColor,
    };

    return (
      <div
        className={`rounded-lg overflow-hidden group transition-all duration-150
          ${isGhost
            ? 'opacity-95 scale-105 z-50 cursor-grabbing shadow-lg'
            : isDragging
              ? 'opacity-0 pointer-events-none'
              : `absolute left-1 right-1 cursor-pointer z-10 hover:z-20 ${justLanded ? 'animate-card-land' : ''}`}`}
        style={{
          background: style.bg,
          border: style.border,
          boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
          ...(isGhost ? {} : { top })
        }}
        onClick={isGhost ? undefined : handleCardClick}
        onMouseEnter={isGhost ? undefined : (e) => {
          const el = e.currentTarget;
          el.style.borderColor = assigneeColor;
        }}
        onMouseLeave={isGhost ? undefined : (e) => {
          const el = e.currentTarget;
          el.style.borderColor = hexToRgba(assigneeColor, 0.55);
        }}
      >
        {/* Barre : nom client à gauche, heure à droite (zone de drag) */}
        <div
          className={`flex items-center justify-between gap-2 px-2 py-0.5 border-b border-white/5 ${!isGhost && getDropTarget && onMove ? 'cursor-grab active:cursor-grabbing' : ''}`}
          onMouseDown={!isGhost && getDropTarget && onMove ? handleHandleMouseDown : undefined}
          onClick={!isGhost ? (e) => e.stopPropagation() : undefined}
        >
          <span className="text-[11px] font-semibold text-zinc-300 truncate min-w-0">{item.clientName || '—'}</span>
          <span className="text-[11px] font-semibold font-mono text-zinc-400 tabular-nums flex-shrink-0">{item.time}</span>
        </div>

        {/* Contenu compact : livrable uniquement (client déjà dans la barre) */}
        <div className="px-2 py-1.5 text-left min-w-0">
          <span className="text-[11px] text-zinc-500 truncate block">
            {item.label}
          </span>
        </div>
      </div>
    );
  }

  // STYLE 2026: Contour accentué par la couleur assignation (pas de pastille)
  const style = {
    bg: `linear-gradient(145deg, ${hexToRgba('#18181b', 1)}, ${hexToRgba('#09090b', 1)})`,
    // Contour accentué = couleur assignation (visible, pas de pastille)
    border: `1.5px solid ${hexToRgba(assigneeColor, 0.55)}`,
    hoverGlow: `0 0 20px ${hexToRgba(assigneeColor, 0.2)}`,
    hoverBorder: `1.5px solid ${assigneeColor}`,
    accent: assigneeColor,
  };

  return (
    <div
      className={`rounded-xl overflow-hidden group transition-all duration-200 ease-out
        ${isGhost
          ? 'opacity-95 scale-[1.08] -translate-y-2 z-50 cursor-grabbing shadow-[0_12px_28px_rgba(0,0,0,0.35)]'
          : isDragging
            ? 'opacity-0 pointer-events-none'
            : `absolute left-2 right-2 cursor-pointer z-10 hover:z-20 hover:-translate-y-0.5 ${justLanded ? 'animate-card-land' : ''}`}`}
      style={{
        background: style.bg,
        border: style.border,
        boxShadow: isGhost
          ? `0 12px 28px rgba(0,0,0,0.35), ${style.hoverGlow}`
          : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        ...(isGhost ? {} : { top, willChange: justLanded ? 'transform' : 'transform, box-shadow, border-color' })
      }}
      onClick={isGhost ? undefined : handleCardClick}
      onMouseEnter={isGhost ? undefined : (e) => {
        const el = e.currentTarget;
        el.style.borderColor = assigneeColor;
        el.style.boxShadow = style.hoverGlow;
      }}
      onMouseLeave={isGhost ? undefined : (e) => {
        const el = e.currentTarget;
        el.style.borderColor = hexToRgba(assigneeColor, 0.55);
        el.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
      }}
    >
      {/* Barre : nom client à gauche, heure à droite (zone de drag) */}
      <div
        className={`flex items-center justify-between gap-2 px-3 py-1.5 border-b border-white/5 min-w-0 ${!isGhost && getDropTarget && onMove ? 'cursor-grab active:cursor-grabbing' : ''}`}
        onMouseDown={!isGhost && getDropTarget && onMove ? handleHandleMouseDown : undefined}
        onClick={!isGhost ? (e) => e.stopPropagation() : undefined}
        role={!isGhost && getDropTarget && onMove ? 'button' : undefined}
        aria-label="Déplacer"
      >
        <span className="text-xs font-semibold text-zinc-300 truncate min-w-0">{item.clientName || '—'}</span>
        <span className="text-xs font-semibold font-mono text-zinc-400 tabular-nums tracking-wide flex-shrink-0">
          {item.time}
        </span>
      </div>

      {/* Contenu principal : livrable / call uniquement (client déjà dans la barre) */}
      <div className="px-3 py-2.5">
        <div className="flex items-center gap-2 min-w-0">
          {isCall ? (
             item.isPresentation ? (
               <span className="text-[var(--accent-violet)] opacity-90 flex-shrink-0">
                 <PresentationIcon />
               </span>
             ) : (
               <span className="text-[var(--accent-coral)] flex-shrink-0">
                 <PhoneIcon />
               </span>
             )
          ) : (
             (item.deliverableType === 'creative' || item.deliverableType === 'document') ? (
               <span className="text-[var(--accent-cyan)] opacity-90 flex-shrink-0">
                 <PackageIcon />
               </span>
             ) : (
               <div className="w-0.5 h-3 bg-zinc-700 rounded-full flex-shrink-0" />
             )
          )}
          <span className="text-[13px] font-medium text-zinc-400 truncate leading-snug flex-1 min-w-0">
            {item.label}
          </span>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {isCompleted && <CheckIcon />}
            {isInProgress && (
              <span className="animate-pulse text-[var(--accent-violet)]"><ClockIcon /></span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export const TimelineCard = memo(TimelineCardInner);
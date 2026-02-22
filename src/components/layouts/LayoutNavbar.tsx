'use client';

import { useState, useRef, useEffect } from 'react';

/** Navbar layout — logo, menu, CTA header. Style Framer, neutre. Burger menu sur mobile. */
export interface NavItem {
  page: string;
  slug: string;
  children?: { page: string; slug: string }[];
}

interface LayoutNavbarProps {
  topOffset?: number;
  navItems?: NavItem[];
  /** Si fourni, les liens du menu déclenchent ce callback au lieu de naviguer. tabKey = '__homepage__' ou slug */
  onNavClick?: (tabKey: string) => void;
  /** Nom affiché à la place de "Logo" (ex: nom du client) */
  brandName?: string;
  /** Edit mode — affiche les actions d'édition sur les nav items */
  editMode?: boolean;
  /** Supprimer une page (par slug) */
  onDeletePage?: (slug: string) => void;
  /** Ajouter une page (ouvre la modale) */
  onAddPage?: () => void;
  /** Définir le parent d'une page (null = top-level) */
  onSetPageParent?: (slug: string, parentSlug: string | null) => void;
  /** Renommer une page */
  onRenamePage?: (slug: string, newName: string) => void;
  /** CTA config */
  ctaLabel?: string;
  ctaVisible?: boolean;
  onCtaChange?: (label: string, visible: boolean) => void;
}

/** Inline editable text — double-click to edit. */
function InlineEdit({
  value,
  onSave,
  className,
}: {
  value: string;
  onSave: (v: string) => void;
  className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      setDraft(value);
      setTimeout(() => inputRef.current?.select(), 0);
    }
  }, [editing, value]);

  const commit = () => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== value) {
      onSave(trimmed);
    }
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') { e.preventDefault(); commit(); }
          if (e.key === 'Escape') { setEditing(false); }
        }}
        className={`bg-transparent border-b border-[var(--accent-cyan)]/50 outline-none text-[var(--text-primary)] ${className ?? 'text-sm'}`}
        style={{ width: `${Math.max(draft.length, 3)}ch` }}
      />
    );
  }

  return (
    <span
      onDoubleClick={() => setEditing(true)}
      className={`cursor-text ${className ?? ''}`}
      title="Double-clic pour renommer"
    >
      {value}
    </span>
  );
}

/** Menu contextuel d'un nav item en mode édition. */
function NavItemEditMenu({
  slug,
  isChild,
  parentItems,
  currentParentSlug,
  onDelete,
  onSetParent,
  onRename,
  onClose,
}: {
  slug: string;
  isChild: boolean;
  parentItems: { page: string; slug: string }[];
  currentParentSlug: string | null;
  onDelete: () => void;
  onSetParent: (parentSlug: string | null) => void;
  onRename?: () => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute top-full right-0 mt-1 min-w-[180px] rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-secondary)] shadow-lg z-50 py-1"
    >
      {/* Renommer */}
      {onRename && (
        <button
          type="button"
          onClick={() => { onRename(); onClose(); }}
          className="flex items-center gap-2 w-full text-left px-3 py-2 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          Renommer
        </button>
      )}

      {/* Sous-page options */}
      {isChild ? (
        <button
          type="button"
          onClick={() => { onSetParent(null); onClose(); }}
          className="flex items-center gap-2 w-full text-left px-3 py-2 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="17 11 12 6 7 11" /><line x1="12" y1="18" x2="12" y2="6" />
          </svg>
          Remonter au niveau principal
        </button>
      ) : (
        parentItems.length > 0 && (
          <>
            <div className="px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
              Sous-page de…
            </div>
            {parentItems.filter(p => p.slug !== slug).map((parent) => (
              <button
                key={parent.slug}
                type="button"
                onClick={() => { onSetParent(parent.slug); onClose(); }}
                className={`flex items-center gap-2 w-full text-left px-3 py-2 text-xs transition-colors ${
                  currentParentSlug === parent.slug
                    ? 'text-[var(--accent-cyan)] bg-[var(--accent-cyan)]/5'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
                }`}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 6 15 12 9 18" />
                </svg>
                {parent.page}
              </button>
            ))}
          </>
        )
      )}

      <div className="my-1 border-t border-[var(--border-subtle)]" />

      {/* Supprimer */}
      <button
        type="button"
        onClick={() => { onDelete(); onClose(); }}
        className="flex items-center gap-2 w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-red-400/10 transition-colors"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
          <path d="M10 11v6" /><path d="M14 11v6" />
        </svg>
        Supprimer la page
      </button>
    </div>
  );
}

/** Nav item wrapper avec actions edit mode. */
function EditableNavItem({
  children,
  slug,
  pageName,
  isHomepage,
  isChild,
  editMode,
  parentItems,
  currentParentSlug,
  onDelete,
  onSetParent,
  onRenamePage,
}: {
  children: React.ReactNode;
  slug: string;
  pageName: string;
  isHomepage: boolean;
  isChild: boolean;
  editMode?: boolean;
  parentItems: { page: string; slug: string }[];
  currentParentSlug: string | null;
  onDelete?: () => void;
  onSetParent?: (parentSlug: string | null) => void;
  onRenamePage?: (slug: string, newName: string) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState(pageName);

  useEffect(() => {
    if (renaming) {
      setDraft(pageName);
      setTimeout(() => inputRef.current?.select(), 0);
    }
  }, [renaming, pageName]);

  if (!editMode || isHomepage || !onDelete) {
    return <>{children}</>;
  }

  const commitRename = () => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== pageName) {
      onRenamePage?.(slug, trimmed);
    }
    setRenaming(false);
  };

  return (
    <div className="group/edit relative flex items-center gap-0.5">
      {renaming ? (
        <input
          ref={inputRef}
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitRename}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); commitRename(); }
            if (e.key === 'Escape') { setRenaming(false); }
          }}
          className="bg-transparent border-b border-[var(--accent-cyan)]/50 outline-none text-sm text-[var(--text-primary)] px-0.5"
          style={{ width: `${Math.max(draft.length, 3)}ch` }}
        />
      ) : (
        children
      )}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setMenuOpen(v => !v); }}
        className="opacity-0 group-hover/edit:opacity-100 p-0.5 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-all"
        title="Options"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="5" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="12" cy="19" r="2" />
        </svg>
      </button>
      {menuOpen && (
        <NavItemEditMenu
          slug={slug}
          isChild={isChild}
          parentItems={parentItems}
          currentParentSlug={currentParentSlug}
          onDelete={onDelete}
          onSetParent={(parentSlug) => onSetParent?.(parentSlug)}
          onRename={() => setRenaming(true)}
          onClose={() => setMenuOpen(false)}
        />
      )}
    </div>
  );
}

/** Dropdown submenu pour un item nav avec enfants. */
function NavDropdown({
  item,
  tabKey,
  isHomepage,
  onNavClick,
  editMode,
  parentItems,
  onDeletePage,
  onSetPageParent,
  onRenamePage,
}: {
  item: NavItem;
  tabKey: string;
  isHomepage: boolean;
  onNavClick: (key: string) => void;
  editMode?: boolean;
  parentItems: { page: string; slug: string }[];
  onDeletePage?: (slug: string) => void;
  onSetPageParent?: (slug: string, parentSlug: string | null) => void;
  onRenamePage?: (slug: string, newName: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <EditableNavItem
        slug={item.slug}
        pageName={item.page}
        isHomepage={isHomepage}
        isChild={false}
        editMode={editMode}
        parentItems={parentItems}
        currentParentSlug={null}
        onDelete={() => onDeletePage?.(item.slug)}
        onSetParent={(parentSlug) => onSetPageParent?.(item.slug, parentSlug)}
        onRenamePage={onRenamePage}
      >
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          {item.page}
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`transition-transform ${open ? 'rotate-180' : ''}`}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </EditableNavItem>
      {open && (
        <div className="absolute top-full left-0 mt-1.5 min-w-[160px] rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-secondary)] shadow-lg z-50 py-1">
          {/* Parent item as first option */}
          <button
            type="button"
            onClick={() => { onNavClick(tabKey); setOpen(false); }}
            className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
          >
            {item.page}
          </button>
          <div className="my-1 border-t border-[var(--border-subtle)]" />
          {item.children?.map((child) => (
            <div key={child.slug} className="flex items-center">
              <button
                type="button"
                onClick={() => { onNavClick(child.slug); setOpen(false); }}
                className="flex-1 flex items-center gap-2 text-left px-3 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
              >
                <span className="w-1 h-1 rounded-full bg-[var(--border-medium)] flex-shrink-0" />
                {child.page}
              </button>
              {editMode && onDeletePage && (
                <div className="relative flex items-center pr-1">
                  <ChildEditPopover
                    slug={child.slug}
                    parentSlug={item.slug}
                    onDelete={() => onDeletePage(child.slug)}
                    onPromote={() => onSetPageParent?.(child.slug, null)}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Mini popover for child items in dropdown. */
function ChildEditPopover({
  slug,
  parentSlug,
  onDelete,
  onPromote,
}: {
  slug: string;
  parentSlug: string;
  onDelete: () => void;
  onPromote: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen(v => !v); }}
        className="p-0.5 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-all"
        title="Options"
      >
        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="5" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="12" cy="19" r="2" />
        </svg>
      </button>
      {open && (
        <div className="absolute top-full right-0 mt-1 min-w-[160px] rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-secondary)] shadow-lg z-[60] py-1">
          <button
            type="button"
            onClick={() => { onPromote(); setOpen(false); }}
            className="flex items-center gap-2 w-full text-left px-3 py-2 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="17 11 12 6 7 11" /><line x1="12" y1="18" x2="12" y2="6" />
            </svg>
            Remonter au niveau principal
          </button>
          <button
            type="button"
            onClick={() => { onDelete(); setOpen(false); }}
            className="flex items-center gap-2 w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-red-400/10 transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            </svg>
            Supprimer
          </button>
        </div>
      )}
    </div>
  );
}

/** Editable CTA button in edit mode. */
function EditableCta({
  label,
  visible,
  editMode,
  onCtaChange,
}: {
  label: string;
  visible: boolean;
  editMode?: boolean;
  onCtaChange?: (label: string, visible: boolean) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(label);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      setDraft(label);
      setTimeout(() => inputRef.current?.select(), 0);
    }
  }, [editing, label]);

  const commit = () => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== label) {
      onCtaChange?.(trimmed, visible);
    }
    setEditing(false);
  };

  // Not visible and not in edit mode → hide entirely
  if (!visible && !editMode) return null;

  // Not visible but in edit mode → show dashed placeholder to re-enable
  if (!visible && editMode) {
    return (
      <button
        type="button"
        onClick={() => onCtaChange?.(label || 'Action', true)}
        className="rounded-lg border border-dashed border-[var(--border-medium)] px-3 py-2 text-sm text-[var(--text-muted)] hover:text-[var(--accent-cyan)] hover:border-[var(--accent-cyan)]/50 transition-colors"
        title="Réafficher le CTA"
      >
        + CTA
      </button>
    );
  }

  if (editMode && onCtaChange) {
    return (
      <div className="group/cta relative flex items-center gap-1">
        {editing ? (
          <input
            ref={inputRef}
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); commit(); }
              if (e.key === 'Escape') { setEditing(false); }
            }}
            className="rounded-lg bg-[var(--text-primary)] px-3 py-2 text-sm font-medium text-[var(--bg-primary)] outline-none border border-[var(--accent-cyan)]"
            style={{ width: `${Math.max(draft.length + 2, 6)}ch` }}
          />
        ) : (
          <button
            type="button"
            onDoubleClick={() => setEditing(true)}
            className="rounded-lg bg-[var(--text-primary)] px-3 py-2 sm:px-4 text-sm font-medium text-[var(--bg-primary)] hover:opacity-90 transition-opacity cursor-text"
            title="Double-clic pour éditer le CTA"
          >
            {label}
          </button>
        )}
        {/* Hide CTA button */}
        <button
          type="button"
          onClick={() => onCtaChange?.(label, false)}
          className="opacity-0 group-hover/cta:opacity-100 absolute -top-1.5 -right-1.5 w-4 h-4 flex items-center justify-center rounded-full bg-red-500/80 text-white text-[8px] hover:bg-red-500 transition-all"
          title="Masquer le CTA"
        >
          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
    );
  }

  // Default (non-edit mode, visible)
  return (
    <a
      href="#"
      className="rounded-lg bg-[var(--text-primary)] px-3 py-2 sm:px-4 text-sm font-medium text-[var(--bg-primary)] hover:opacity-90 transition-opacity"
    >
      {label}
    </a>
  );
}

export function LayoutNavbar({ topOffset = 0, navItems, onNavClick, brandName, editMode, onDeletePage, onAddPage, onSetPageParent, onRenamePage, ctaLabel = 'Action', ctaVisible = true, onCtaChange }: LayoutNavbarProps) {
  const [burgerOpen, setBurgerOpen] = useState(false);
  const items = navItems ?? [
    { page: 'Services', slug: 'services' },
    { page: 'À propos', slug: 'a-propos' },
    { page: 'Contact', slug: 'contact' },
  ];

  // Top-level items for "set as sub-page of" menu
  const parentItems = items
    .filter((_, i) => i !== 0) // exclude homepage
    .map(item => ({ page: item.page, slug: item.slug }));

  const handleNavItemClick = (tabKey: string) => {
    if (onNavClick) onNavClick(tabKey);
    setBurgerOpen(false);
  };

  return (
    <header
      className="sticky top-0 z-50 w-full border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]/95 backdrop-blur-sm"
      style={{ top: topOffset }}
    >
      <div className="mx-auto flex h-14 sm:h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        {onNavClick ? (
          <button
            type="button"
            onClick={() => onNavClick('__homepage__')}
            className="text-lg font-semibold text-[var(--text-primary)] hover:opacity-80 transition-opacity"
          >
            {brandName || 'Logo'}
          </button>
        ) : (
          <a href="#" className="text-lg font-semibold text-[var(--text-primary)]">
            {brandName || 'Logo'}
          </a>
        )}

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          {items.map((item, i) => {
            const tabKey = i === 0 ? '__homepage__' : item.slug;
            const isHomepage = i === 0;

            // Item avec enfants → dropdown
            if (item.children && item.children.length > 0 && onNavClick) {
              return (
                <NavDropdown
                  key={item.slug}
                  item={item}
                  tabKey={tabKey}
                  isHomepage={isHomepage}
                  onNavClick={onNavClick}
                  editMode={editMode}
                  parentItems={parentItems}
                  onDeletePage={onDeletePage}
                  onSetPageParent={onSetPageParent}
                  onRenamePage={onRenamePage}
                />
              );
            }

            if (onNavClick) {
              return (
                <EditableNavItem
                  key={item.slug}
                  slug={item.slug}
                  pageName={item.page}
                  isHomepage={isHomepage}
                  isChild={false}
                  editMode={editMode}
                  parentItems={parentItems}
                  currentParentSlug={null}
                  onDelete={() => onDeletePage?.(item.slug)}
                  onSetParent={(parentSlug) => onSetPageParent?.(item.slug, parentSlug)}
                  onRenamePage={onRenamePage}
                >
                  <button
                    type="button"
                    onClick={() => onNavClick(tabKey)}
                    className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    {item.page}
                  </button>
                </EditableNavItem>
              );
            }
            return (
              <a
                key={item.slug}
                href={`#${item.slug}`}
                className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                {item.page}
              </a>
            );
          })}

          {/* Add page button — edit mode only */}
          {editMode && onAddPage && (
            <button
              type="button"
              onClick={onAddPage}
              className="flex items-center justify-center w-6 h-6 rounded-full border border-dashed border-[var(--border-medium)] text-[var(--text-muted)] hover:text-[var(--accent-cyan)] hover:border-[var(--accent-cyan)]/50 transition-colors"
              title="Ajouter une page"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
          )}
        </nav>

        {/* Mobile: burger + CTA | Desktop: CTA */}
        <div className="flex items-center gap-2">
          {/* Burger — mobile only */}
          <button
            type="button"
            onClick={() => setBurgerOpen((v) => !v)}
            className="md:hidden p-2 -mr-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
            aria-expanded={burgerOpen}
            aria-label={burgerOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
          >
            {burgerOpen ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            )}
          </button>

          <EditableCta
            label={ctaLabel}
            visible={ctaVisible}
            editMode={editMode}
            onCtaChange={onCtaChange}
          />
        </div>
      </div>

      {/* Burger panel — mobile */}
      {burgerOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 top-14 sm:top-16 z-40 bg-black/30"
            onClick={() => setBurgerOpen(false)}
            aria-hidden="true"
          />
          <nav
            className="md:hidden absolute top-full left-0 right-0 z-50 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)] shadow-lg"
            role="navigation"
          >
            <ul className="py-3 px-4 space-y-1">
              {items.map((item, i) => {
                const tabKey = i === 0 ? '__homepage__' : item.slug;

                // Item avec enfants
                if (item.children && item.children.length > 0 && onNavClick) {
                  return (
                    <li key={item.slug}>
                      <button
                        type="button"
                        onClick={() => handleNavItemClick(tabKey)}
                        className="flex items-center gap-2 w-full text-left px-4 py-3 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                      >
                        {item.page}
                      </button>
                      <ul className="pl-4 space-y-0.5">
                        {item.children.map((child) => (
                          <li key={child.slug}>
                            <button
                              type="button"
                              onClick={() => handleNavItemClick(child.slug)}
                              className="flex items-center gap-2 w-full text-left px-4 py-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors text-sm"
                            >
                              <span className="w-1 h-1 rounded-full bg-[var(--border-medium)] flex-shrink-0" />
                              {child.page}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </li>
                  );
                }

                if (onNavClick) {
                  return (
                    <li key={item.slug}>
                      <button
                        type="button"
                        onClick={() => handleNavItemClick(tabKey)}
                        className="flex items-center gap-2 w-full text-left px-4 py-3 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                      >
                        {item.page}
                      </button>
                    </li>
                  );
                }
                return (
                  <li key={item.slug}>
                    <a
                      href={`#${item.slug}`}
                      onClick={() => setBurgerOpen(false)}
                      className="flex items-center gap-2 px-4 py-3 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                    >
                      {item.page}
                    </a>
                  </li>
                );
              })}

              {/* Add page — mobile edit mode */}
              {editMode && onAddPage && (
                <li>
                  <button
                    type="button"
                    onClick={() => { onAddPage(); setBurgerOpen(false); }}
                    className="flex items-center gap-2 w-full text-left px-4 py-3 rounded-lg text-[var(--text-muted)] hover:text-[var(--accent-cyan)] hover:bg-[var(--accent-cyan)]/5 transition-colors border border-dashed border-[var(--border-medium)]"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Ajouter une page
                  </button>
                </li>
              )}
            </ul>
          </nav>
        </>
      )}
    </header>
  );
}

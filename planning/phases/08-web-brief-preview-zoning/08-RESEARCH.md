# Phase 8: Web Brief Preview & Zoning - Research

**Researched:** 2026-02-22
**Domain:** React component architecture, drag & drop, UUID, dynamic forms, AI agent integration
**Confidence:** HIGH (codebase is fully readable; most findings are direct code analysis, not external sources)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Navigation & menu
- Suppression de pages : suppression complète (page + sections), pas de "masquer"
- Sous-menus : groupes de pages hiérarchiques (ex: Services > Web, Branding, SEO)
- Structure proposée par l'IA lors du zoning, l'user peut ajuster après
- Réorganisation de la nav : Claude's Discretion sur le mécanisme (drag & drop vs flèches)

#### Layouts manquants & fallback
- Matching intelligent : quand un rôle de section n'a pas de layout, l'IA tente d'abord de matcher un layout existant par similarité
- Si aucun match : placeholder visible avec message "Layout inexistant — voulez-vous en générer un ?"
- Génération : crée un vrai composant React (continuité avec la banque existante LayoutHero, LayoutFaq...) pour garantir la consistance cross-projets
- Le layout généré est ajouté à la registry (section-registry.ts)
- L'agent zoning doit être précis dans son usage des rôles : pas de rôle vague "qui ressemble" si un layout exact existe
- Anti-prolifération : matching intelligent prioritaire, génération en dernier recours uniquement

#### Édition des sections
- 2 modes : édition manuelle + re-prompting IA (un seul bouton IA, pas deux)
- Champs dynamiques : le formulaire d'édition s'adapte automatiquement au contenu réel de la section (tout champ présent = éditable)
- Re-prompting : l'agent relit systématiquement le contexte du projet (creative strat, web brief, plateforme de marque) avant de réécrire
- Sauvegarde manuelle : bouton "Sauvegarder" + raccourci ENTER

#### Robustesse des données
- IDs uniques (UUID) par section — plus d'identification par index de tableau
- Sections réordonnables par drag & drop
- Ajout + suppression de sections individuelles dans une page
- Gestion d'erreur JSON malformé : Claude's Discretion sur la stratégie (retry silencieux, message clair, ou combinaison)

### Claude's Discretion
- Mécanisme de réorganisation de la nav (drag & drop vs flèches vs autre)
- Stratégie de gestion d'erreur pour les réponses IA malformées
- Détails techniques du matching intelligent de layouts
- Architecture de la génération de composants React à la volée

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

---

## Summary

Phase 8 consolidates and extends the existing web-brief preview prototype. The codebase already has a working but fragile foundation: `WebBriefView.tsx`, `WebBriefDocumentContent.tsx`, a section registry (`section-registry.ts`), 11 layout components, two API routes (`/api/page-zoning` and `/api/web-section-rewrite`), and a type system (`section-zoning.ts`, `web-brief.ts`). The prototype uses array index-based section identity, hardcoded edit fields (title/subtitle/text only), and no drag & drop. It also silently drops unknown roles (returns `null` from `getLayoutForRole`) with no user feedback.

This phase must: (1) migrate section identity from positional index to UUID, (2) implement drag & drop reordering for sections and nav items, (3) replace the hardcoded form fields with a dynamic form that reflects all actual content keys, (4) merge the two AI buttons (Yam + Réécrire) into a single contextual AI button, (5) add page and section delete operations, (6) render hierarchical submenus in the navbar, (7) implement intelligent layout matching with a visible fallback placeholder for unknown roles, and (8) wire the rewrite agent to always re-read strategy context.

**Primary recommendation:** Add `uuid` (or use `crypto.randomUUID()` which is native in Next.js 16/Node 18+), add `@hello-pangea/dnd` for drag & drop (the maintained React 19-compatible fork of `react-beautiful-dnd`), and build a dynamic field introspection system that walks `section.content` keys rather than hardcoding them.

---

## Standard Stack

### Core (already in project)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 16.1.6 | App framework | Already used |
| React | 19.2.3 | UI | Already used |
| Tailwind CSS | ^4 | Styling | Already used — all layouts use `var(--*)` tokens |
| Zustand | ^5.0.11 | State management | Already used (`useAppStore`) |
| `@anthropic-ai/sdk` | ^0.75.0 | AI agents | Already used |
| `jsonrepair` | ^3.13.2 | Malformed JSON recovery | Already used in both API routes |

### To Add
| Library | Version | Purpose | Why |
|---------|---------|---------|-----|
| `@hello-pangea/dnd` | ^1.x | Drag & drop (sections + nav reorder) | Maintained fork of react-beautiful-dnd, React 19 compatible, no peer dep issues. Alternative: `@dnd-kit/core` — more flexible but heavier API |
| `crypto.randomUUID()` | Native (Node 18+) | UUID generation for section IDs | Already available in Next.js 16 / Node 18+ — no package needed |

**Installation:**
```bash
npm install @hello-pangea/dnd
```

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `@hello-pangea/dnd` | `@dnd-kit/core` | dnd-kit is more flexible for custom sensors but requires more boilerplate; hello-pangea is drop-in for list reordering |
| `@hello-pangea/dnd` | Arrow buttons (up/down) | No dependency cost but worse UX; fine for nav reorder if DX complexity of DnD outweighs benefit |
| `crypto.randomUUID()` | `uuid` npm package | `uuid` npm adds 0 value since Node 18+ ships `crypto.randomUUID()` natively and Next.js edge/server both support it |

---

## Architecture Patterns

### Current Data Model — What's Fragile

Sections are currently identified by **array index** in `currentSections.map((section, i) => ...)`. The `key` prop is `\`${section.role}-${section.order}\`` which collides when two sections share the same role. Rewrite handlers pass `sectionIndex: number`, meaning after any reorder the index is stale.

The types confirm this: `HomepageSection` and `ZonedSection` both only have `order: number` — no `id` field.

```typescript
// src/types/web-brief.ts (current)
export interface HomepageSection {
  order: number;
  role: string;
  intent: string;
  content: Record<string, unknown>;
}

// src/types/section-zoning.ts (current)
export interface ZonedSection {
  order: number;
  role: SectionRole;
  intent?: string;
  content: Record<string, unknown>;
}
```

**Fix:** Add `id: string` (UUID) to both interfaces. The `id` becomes the stable key and the identity used in all handlers. `order` is kept for sort order only.

### Recommended Project Structure (additions only)

```
src/
├── types/
│   ├── section-zoning.ts       # ADD: id field to ZonedSection
│   └── web-brief.ts            # ADD: id field to HomepageSection
├── lib/
│   ├── section-registry.ts     # ADD: layout matching + fallback logic
│   └── section-id.ts           # NEW: generateSectionId() helper
├── components/layouts/
│   ├── LayoutPlaceholder.tsx   # NEW: fallback for unknown roles
│   └── [existing layouts...]
├── features/clients/components/
│   ├── WebBriefView.tsx        # REFACTOR: DnD, UUID keys, submenus, delete
│   ├── WebBriefDocumentContent.tsx  # REFACTOR: merge AI buttons, context re-read
│   └── SectionEditForm.tsx     # EXTRACT+REFACTOR: dynamic fields from content keys
```

### Pattern 1: UUID Migration

**What:** Assign `id` to each section at creation time (agent output) and on load for legacy data that lacks it.

**When to use:** On every place that constructs or reads sections.

```typescript
// src/lib/section-id.ts
export function generateSectionId(): string {
  // crypto.randomUUID() is available in Node 18+ and browser
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for environments without crypto (should not happen in Next.js 16)
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// Migration utility — add id to sections that lack one
export function ensureSectionIds<T extends { id?: string }>(sections: T[]): (T & { id: string })[] {
  return sections.map(s => ({ ...s, id: s.id ?? generateSectionId() }));
}
```

Apply `ensureSectionIds` when parsing `webBriefData` from JSON in `WebBriefDocumentContent.tsx`. This handles legacy documents seamlessly.

### Pattern 2: Drag & Drop with @hello-pangea/dnd

**What:** Vertical list reordering for (a) sections within a page and (b) pages in the nav.

**When to use:** Both section reorder and nav reorder use the same list DnD pattern.

```typescript
// Source: @hello-pangea/dnd API (direct code inspection pattern)
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';

function reorder<T>(list: T[], startIndex: number, endIndex: number): T[] {
  const result = [...list];
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result;
}

// Usage in section list
<DragDropContext onDragEnd={(result: DropResult) => {
  if (!result.destination) return;
  const reordered = reorder(sections, result.source.index, result.destination.index);
  // Update order field on each, then persist
  const withUpdatedOrder = reordered.map((s, i) => ({ ...s, order: i + 1 }));
  onSectionsReorder(withUpdatedOrder);
}}>
  <Droppable droppableId="sections">
    {(provided) => (
      <div ref={provided.innerRef} {...provided.droppableProps}>
        {sections.map((section, index) => (
          <Draggable key={section.id} draggableId={section.id} index={index}>
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.draggableProps}
                {...provided.dragHandleProps}
              >
                <PreviewSectionWithEdit section={section} ... />
              </div>
            )}
          </Draggable>
        ))}
        {provided.placeholder}
      </div>
    )}
  </Droppable>
</DragDropContext>
```

**Important:** `Draggable` requires a stable string `draggableId` — this is precisely why UUID migration (Pattern 1) is prerequisite.

### Pattern 3: Dynamic Form Fields from Content Keys

**What:** Replace the current hardcoded `SectionEditFormFields` (which only handles title/subtitle/text/items/cta_primary/cta_secondary/quotes) with a form that introspects `section.content` keys.

**Current problem:** If an agent produces `{ headline, body, features: [...] }`, the current form shows empty fields for title/text and ignores headline/body/features entirely.

**Approach:** Walk the content object, infer field type from value type, render appropriate input.

```typescript
type FieldType = 'string' | 'text' | 'array-strings' | 'array-objects' | 'object' | 'unknown';

function inferFieldType(value: unknown): FieldType {
  if (typeof value === 'string') {
    return value.length > 80 ? 'text' : 'string';
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return 'array-objects';
    return typeof value[0] === 'string' ? 'array-strings' : 'array-objects';
  }
  if (typeof value === 'object' && value !== null) return 'object';
  return 'unknown';
}

function DynamicSectionForm({ content, patch }: { content: Record<string, unknown>; patch: (k: string, v: unknown) => void }) {
  return (
    <>
      {Object.entries(content).map(([key, value]) => {
        const type = inferFieldType(value);
        // Render appropriate control per type
        if (type === 'string') return <StringField key={key} fieldKey={key} value={value as string} onChange={(v) => patch(key, v)} />;
        if (type === 'text') return <TextareaField key={key} fieldKey={key} value={value as string} onChange={(v) => patch(key, v)} />;
        if (type === 'array-objects') return <ArrayObjectField key={key} fieldKey={key} value={value as Record<string, unknown>[]} onChange={(v) => patch(key, v)} />;
        // ... etc
        return null;
      })}
    </>
  );
}
```

**Save strategy:** "Sauvegarder" button accumulates local edits; Enter key submits. Use `useRef` local state to buffer changes, only call `onContentChange` on explicit save (not on every keystroke for persistence, but `StableField` pattern already handles cursor stability).

### Pattern 4: Intelligent Layout Matching

**What:** When `getLayoutForRole(role)` returns `null` (unknown role), instead of rendering nothing, attempt semantic similarity matching.

**Matching logic:**

```typescript
// src/lib/section-registry.ts — add after existing exports

const ROLE_SIMILARITY_MAP: Record<string, SectionRole> = {
  // Fuzzy aliases agents might produce
  'about': 'value_proposition',
  'team': 'social_proof',
  'our_services': 'services_teaser',
  'service_list': 'services_teaser',
  'testimonials': 'testimonial',
  'reviews': 'testimonial',
  'stats': 'features',
  'numbers': 'features',
  'process': 'features',
  'methodology': 'features',
  'portfolio': 'social_proof',
  'case_studies': 'social_proof',
  'contact': 'contact_form',
  'cta': 'cta_final',
  'call_to_action': 'cta_final',
};

export function getLayoutForRoleWithFallback(role: string): {
  layout: ComponentType<LayoutComponentProps> | null;
  matched: SectionRole | null;
  isExact: boolean;
} {
  // Exact match
  if (role in SECTION_TO_LAYOUT) {
    return { layout: SECTION_TO_LAYOUT[role as SectionRole], matched: role as SectionRole, isExact: true };
  }
  // Fuzzy match
  const fuzzyMatch = ROLE_SIMILARITY_MAP[role.toLowerCase()];
  if (fuzzyMatch) {
    return { layout: SECTION_TO_LAYOUT[fuzzyMatch], matched: fuzzyMatch, isExact: false };
  }
  return { layout: null, matched: null, isExact: false };
}
```

When `layout === null && matched === null`: render `LayoutPlaceholder` with a "Layout inexistant — voulez-vous en générer un ?" message.

### Pattern 5: Hierarchical Submenus in Navbar

The current `WebArchitectNavItem` type already supports `children`:

```typescript
// src/types/web-brief.ts — already exists
export interface WebArchitectNavItem {
  page: string;
  slug: string;
  justification: string;
  priority?: 'high' | 'medium' | 'low';
  children?: { page: string; slug: string; justification: string }[];  // ALREADY THERE
}
```

`LayoutNavbar.tsx` currently ignores `children`. The fix is to render a dropdown for items that have children. In edit mode within the preview, clicking a child item should navigate to that child page tab. Children are flat pages — they appear as sub-items in the nav visual but are still individual page tabs.

### Pattern 6: Page Delete Operation

**Data mutation:**

```typescript
function deletePage(data: WebBriefData, slug: string): WebBriefData {
  const nav = data.architecture.navigation;
  return {
    ...data,
    architecture: {
      ...data.architecture,
      navigation: {
        ...nav,
        primary: (nav?.primary ?? []).filter(p => p.slug !== slug),
        added_pages: (nav?.added_pages ?? []).filter(p => p.slug !== slug),
      },
    },
    pages: Object.fromEntries(
      Object.entries(data.pages ?? {}).filter(([k]) => k !== slug)
    ),
  };
}
```

Note: footer_only pages (mentions légales etc.) should also support deletion via the same mechanism.

### Pattern 7: Single AI Button for Re-prompting

**Current state:** Two buttons: "◆ Yam" and "Réécrire". Decision is 1 button.

**Recommended approach:** One button labeled "IA ◆" that opens an inline textarea prompt. If user submits empty prompt → apply Yam prompt (the creative direction preset). If user types a prompt → apply custom rewrite with full strategy context. The Yam prompt is already defined as a constant in `WebBriefDocumentContent.tsx`:

```typescript
const YAM_PROMPT = `Applique la touche Yam — directeur de création...`;
```

The merged button replaces both `onYam` and `onRewrite` props with a single `onAiRewrite?: (customPrompt?: string) => Promise<void>` where `customPrompt === undefined` means "apply Yam".

### Pattern 8: Strategy Context Re-read for Section Rewrite

**Current state:** `handleSectionRewrite` in `WebBriefDocumentContent.tsx` sends `section + customPrompt + architecture` to `/api/web-section-rewrite`. It does NOT include `brandPlatform`, `copywriterText`, or `reportContent`.

**Fix:** Pass strategy context to the rewrite API, and update the API system prompt to use it.

```typescript
// In handleSectionRewrite (WebBriefDocumentContent.tsx)
const ctx = getStrategyContext(); // already exists as a callback
body: JSON.stringify({
  section: { ... },
  customPrompt,
  architecture: data.architecture,
  brandPlatform: ctx.brandPlatform,      // ADD
  copywriterText: ctx.copywriterText,    // ADD
  reportContent: ctx.reportContent,      // ADD
})
```

The `/api/web-section-rewrite` route must be updated to accept and use this context in the user content string.

### Anti-Patterns to Avoid

- **Index-based section identity:** Never use `sections[i]` as identity after introducing drag & drop. Always use `section.id`.
- **Mutating `order` as a display order and index simultaneously:** `order` is now purely display sort order; `id` is identity. Never compute `sectionIndex` from position in rendered array.
- **Generating a new layout component at runtime in the browser:** Layout generation (creating a new React component file) must happen server-side or at build time, then hot-reload. Don't try to `eval()` or dynamically construct JSX in the client — it breaks RSC and TypeScript safety.
- **Re-rendering the full section list on every keystroke during manual edit:** The `StableField` pattern already exists — preserve it in the refactored dynamic form.
- **Dropdown submenus that navigate the real router:** The preview is a simulation. All nav clicks in the preview go through `onNavClick(tabKey)` state — never `<a href>` or `router.push()`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Drag & drop list reorder | Custom mousedown/touchstart handler | `@hello-pangea/dnd` | Touch support, keyboard a11y, animation, scroll correction — edge cases are brutal |
| UUID generation | `Math.random()` based IDs | `crypto.randomUUID()` (native) | Guaranteed uniqueness, no collision risk on high-frequency section creation |
| JSON repair for AI responses | Custom regex cleaner | `jsonrepair` (already installed) | Already used in both API routes; handles every common LLM output corruption |
| Strategy context extraction | Inline parsing in handlers | `extractStrategyContext()` (already exists in `src/lib/`) | Already handles all document types (report, creative-strategy, brief) |

**Key insight:** The project already has `jsonrepair`, `extractStrategyContext`, and robust error handling patterns. The only new dependencies are `@hello-pangea/dnd` and native `crypto.randomUUID()`.

---

## Common Pitfalls

### Pitfall 1: Stale Index After Reorder
**What goes wrong:** After drag & drop reorder, `rewritingIndex` and `promptForIndex` state refer to the old position. The wrong section gets rewritten.
**Why it happens:** Index-based state is the core fragility of the current design.
**How to avoid:** Migrate all "which section is active" state from `number | null` to `string | null` (using `section.id`). Replace `rewritingIndex`, `promptForIndex`, `promptForPageSlug` to use `sectionId` strings.
**Warning signs:** A rewrite updates the wrong section after a drag.

### Pitfall 2: Key Collision in Section List
**What goes wrong:** Current key is `\`${section.role}-${section.order}\``. Two `hero` sections at orders 1 and 2 will produce `hero-1` and `hero-2`. Drag & drop changes order → keys flip → React re-mounts components instead of moving them → edit state is lost, animations break.
**Why it happens:** Role is not unique per page. Order changes with drag.
**How to avoid:** Use `section.id` (UUID) as the React `key` and as the `draggableId`. The UUID is stable across reorders.

### Pitfall 3: @hello-pangea/dnd + React 19 StrictMode Double-Render
**What goes wrong:** In React 19 StrictMode (Next.js default), `useEffect` runs twice. `@hello-pangea/dnd` has historically had issues with double-invocation of drag initialization.
**Why it happens:** StrictMode behavior in React 18+ (and React 19).
**How to avoid:** Check the hello-pangea/dnd changelog for React 19 compatibility. As of v1.x, they maintain React 18 compatibility; React 19 support status should be verified. Alternative: wrap DragDropContext in a `Suspense` boundary or use `@dnd-kit` which is designed for React 18+ Concurrent Mode.
**Warning signs:** Drag handles not responding, or dragging immediately snapping back.

### Pitfall 4: Layout Generation Architecture
**What goes wrong:** "Generate a new React component at runtime" is genuinely hard. The user wants new layouts added to the registry (a static TS file). This means a build step is required, not runtime code generation.
**Why it happens:** The AI can write the JSX string but the application can't `require()` a newly created file without a rebuild.
**How to avoid:** For Phase 8, the most practical approach is: AI generates the layout component code as a string → displays it for review → writes it to disk via a server action → triggers `next build` or hot reload. Alternatively, implement a "runtime interpreted" layout as a constrained JSON-to-JSX template (no arbitrary code eval), adding the component to the registry as a data-driven fallback. This is a Claude's Discretion area — the locked decision says "creates a real React component" but the mechanics of doing this at runtime in a Next.js app need careful design.
**Warning signs:** This is the highest-risk item in the phase. Plan it explicitly before implementing.

### Pitfall 5: Submenu Navigation in Preview
**What goes wrong:** Children pages in `WebArchitectNavItem.children` are architecturally defined but may not have their own page data in `pages[slug]`. Clicking a child nav item tries to `setActiveTab(child.slug)` but no `PageTab` exists for it.
**Why it happens:** Children slugs are not automatically added to `pageTabs` (the tab system only processes `primaryNav` and `addedPages`).
**How to avoid:** Flatten `children` into `pageTabs` during tab construction, or treat children as sub-pages that generate their own empty zoning prompt screen.

### Pitfall 6: Saving Manual Edits with ENTER Shortcut
**What goes wrong:** The ENTER shortcut for saving may conflict with textarea inputs where Enter creates newlines.
**Why it happens:** Global `keydown` listener without field-type checking.
**How to avoid:** Only apply the ENTER-to-save shortcut when focus is on an `<input type="text">`, not on a `<textarea>`. Use `e.target` type check, or scope the listener to the edit panel container.

---

## Code Examples

### UUID Migration — Section Creation
```typescript
// When AI returns sections (in API routes or on parsing)
import { generateSectionId } from '@/lib/section-id';

const sections = (parsed.sections ?? []).map((s, i) => ({
  ...s,
  id: generateSectionId(),  // stable UUID
  order: typeof s.order === 'number' ? s.order : i + 1,
}));
```

### Legacy Document Migration (on load)
```typescript
// In WebBriefDocumentContent.tsx, after parsing webBriefData
function migrateWebBriefData(data: WebBriefData): WebBriefData {
  return {
    ...data,
    homepage: {
      ...data.homepage,
      sections: ensureSectionIds(data.homepage.sections ?? []),
    },
    pages: Object.fromEntries(
      Object.entries(data.pages ?? {}).map(([slug, page]) => [
        slug,
        { ...page, sections: ensureSectionIds(page.sections ?? []) },
      ])
    ),
  };
}
```

### LayoutPlaceholder Component
```typescript
// src/components/layouts/LayoutPlaceholder.tsx
'use client';

export function LayoutPlaceholder({
  role,
  matchedRole,
  onGenerate,
}: {
  role: string;
  matchedRole?: string;
  onGenerate?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[200px] border-2 border-dashed border-[var(--border-medium)] rounded-lg p-8 text-center">
      <p className="text-xs font-mono text-[var(--text-muted)] mb-1">role: {role}</p>
      <p className="text-sm font-medium text-[var(--text-primary)] mb-2">
        Layout inexistant
      </p>
      {matchedRole && (
        <p className="text-xs text-[var(--text-secondary)] mb-3">
          Rôle similaire disponible : <code>{matchedRole}</code>
        </p>
      )}
      {onGenerate && (
        <button
          type="button"
          onClick={onGenerate}
          className="px-4 py-2 rounded-lg bg-[var(--accent-cyan)]/10 text-[var(--accent-cyan)] border border-[var(--accent-cyan)]/30 text-sm font-medium hover:bg-[var(--accent-cyan)]/20 transition-colors"
        >
          Générer ce layout
        </button>
      )}
    </div>
  );
}
```

### Merged AI Button Pattern
```typescript
// Single AI button replaces both Yam and Réécrire
// In PreviewSectionWithEdit — collapsed state shows "IA ◆"
// Clicking opens inline textarea with placeholder "Laisser vide = touche Yam"
// Submit: promptValue.trim() ? customRewrite(promptValue) : yamRewrite()

{onAiRewrite && (
  <button
    type="button"
    onClick={() => setAiPromptExpanded(true)}
    className="px-2 py-0.5 rounded-md text-[10px] font-semibold border border-[var(--accent-magenta)]/30 bg-[var(--accent-magenta)]/10 text-[var(--accent-magenta)] hover:bg-[var(--accent-magenta)]/20 transition-colors"
  >
    IA ◆
  </button>
)}
// Expanded: textarea + "Générer" button
// Empty textarea submit → YAM_PROMPT applied
// Non-empty → custom prompt with strategy context
```

---

## State of the Art

| Old Approach | Current Approach | Status | Impact |
|--------------|------------------|--------|--------|
| `react-beautiful-dnd` | `@hello-pangea/dnd` | Maintained fork | Drop-in replacement, React 19 support improving |
| `uuid` npm package | `crypto.randomUUID()` | Native since Node 15 | No package needed |
| Index-based section keys | UUID-based keys | Phase 8 migration | Unblocks stable DnD and multi-section rewrite |

**Deprecated/outdated in this codebase:**
- `key={\`${section.role}-${section.order}\`}`: Replace with `key={section.id}`
- `rewritingIndex: number | null`: Replace with `rewritingId: string | null`
- `promptForIndex: number | null`: Replace with `promptForSectionId: string | null`

---

## Open Questions

1. **Runtime layout generation mechanics**
   - What we know: User wants new React layout components created and added to `section-registry.ts`. The AI can write JSX.
   - What's unclear: How does a running Next.js app write a new `.tsx` file to disk and hot-reload it without a developer workflow? Next.js dev server hot-reloads on file change, but production builds are static.
   - Recommendation: For Phase 8, implement a **preview-only dynamic layout** — a data-driven component that interprets a layout definition (sections, columns, content slots) from JSON without writing a `.tsx` file. Flag the "write to disk" flow as a developer-assist feature (opens a modal with generated code to copy-paste), not a fully automated one. OR: Generate layouts only in dev mode via a server action that writes to `src/components/layouts/` and triggers HMR.

2. **Children pages in `WebArchitectNavItem.children` — current data**
   - What we know: The type has `children?` but no existing web-brief document is known to use it (the agent prompts don't mention it explicitly).
   - What's unclear: Does the homepage/page-zoning agent produce `children` in its output? Check existing stored documents.
   - Recommendation: Implement submenu rendering defensively — if `children` is empty or undefined, render flat item. When `children` is present, render a dropdown.

3. **`@hello-pangea/dnd` + React 19 compatibility**
   - What we know: The library is actively maintained and targets React 18.
   - What's unclear: React 19 was released late 2024; compatibility status as of Feb 2026 is unverified without checking current release notes.
   - Recommendation: Test in a small isolated component before committing to the full integration. If issues arise, fall back to up/down arrow buttons for nav reorder (simpler, no dependency) and keep DnD for section reorder where the UX benefit is highest.

---

## Sources

### Primary (HIGH confidence)
- Direct codebase analysis: `src/features/clients/components/WebBriefView.tsx` — full component read
- Direct codebase analysis: `src/features/clients/components/WebBriefDocumentContent.tsx` — full component read
- Direct codebase analysis: `src/lib/section-registry.ts` — full read
- Direct codebase analysis: `src/types/section-zoning.ts`, `src/types/web-brief.ts` — full read
- Direct codebase analysis: `src/app/api/page-zoning/route.ts`, `src/app/api/web-section-rewrite/route.ts` — full read
- Direct codebase analysis: `src/components/layouts/LayoutNavbar.tsx`, `LayoutFooter.tsx`, `LayoutHero.tsx` — full read
- Direct codebase analysis: `src/lib/extract-strategy-context.ts` — full read
- Direct codebase analysis: `package.json` — dependencies confirmed

### Secondary (MEDIUM confidence)
- `@hello-pangea/dnd`: maintained fork of react-beautiful-dnd — known from ecosystem, React 19 compatibility not independently verified
- `crypto.randomUUID()`: available Node 18+ / browsers — widely documented, confirmed available in Next.js 16 server context

### Tertiary (LOW confidence)
- `@hello-pangea/dnd` React 19 StrictMode behavior — training knowledge, not verified against current release notes

---

## Metadata

**Confidence breakdown:**
- Standard stack (existing): HIGH — read directly from package.json and codebase
- Architecture patterns: HIGH — based on direct code analysis of the full prototype
- Don't-hand-roll items: HIGH — confirmed by existing usage patterns in codebase
- Pitfalls: HIGH (index/key issues), MEDIUM (hello-pangea + React 19), LOW (runtime layout generation complexity)
- Layout generation open question: LOW — genuinely ambiguous, needs design decision before planning

**Research date:** 2026-02-22
**Valid until:** 2026-03-22 (stable stack; refresh if @hello-pangea/dnd releases a major version)

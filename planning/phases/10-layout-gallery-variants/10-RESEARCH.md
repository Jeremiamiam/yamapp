# Phase 10: Layout Gallery & Variants - Research

**Researched:** 2026-02-22
**Domain:** Layout registry management, variant system, AI-assisted code generation, gallery UI
**Confidence:** HIGH (based entirely on actual codebase reading — no external library research needed for core features)

## Summary

Phase 10 adds a visual gallery for all layout components (13 standard + 5 custom) with a variant system, prompt-based AI editing, manual code editing, and creation of new layouts. The gallery is accessible from both the wiki view and from a new button in the LayoutPicker dropdown inside SectionDrawer.

The codebase already has every primitive needed: the layout registry (`section-registry.ts`, `custom-layouts.ts`), the AI generation endpoint (`/api/generate-layout`), the LayoutPicker UI in `SectionDrawer.tsx`, and the wiki view system. Phase 10 assembles these into a gallery surface with a new view type or modal, and extends the variant concept by naming components with a `_variant` suffix (e.g., `LayoutHeroSplit`, registered as `hero_split`).

The key design decisions from the additional context are locked: variants are distinct components (not overwrite of base layouts), the gallery creates/explores variants, access is dual (wiki + LayoutPicker button), both AI prompt editing and manual code editing are supported, and new layouts can be created from the gallery.

**Primary recommendation:** Build the gallery as a full-screen modal (not a new ViewType) to avoid polluting VIEW_ORDER and store navigation, launched from either context. Use the existing `/api/generate-layout` endpoint for AI creation, and add a new `/api/edit-layout` endpoint for AI-prompted editing of existing code.

---

## User Constraints

No CONTEXT.md exists for this phase. The constraints come from the additional context in the research prompt:

### Locked Decisions
- Variant system: Instead of editing a layout and changing it everywhere, create variants (e.g., `hero_centered`, `hero_split`, `hero_minimal`). Each variant is a distinct component.
- Gallery as variant creator: The gallery is a tool to create and explore variants, not to overwrite base layouts.
- Access points: From wiki view AND from LayoutPicker in SectionDrawer (small button next to dropdown).
- New layouts from gallery: Users can also create entirely new layouts from the gallery.
- Edit modes: Both manual code editing and AI prompt editing.

### Claude's Discretion
- Whether gallery is a modal or a new ViewType
- Internal structure of the gallery component (grid vs list, grouping strategy)
- How manual code editing is surfaced (inline editor vs modal)
- Whether variants are stored in `custom-layouts.ts` or a separate `variant-layouts.ts`
- API design for edit-layout endpoint

### Deferred Ideas (OUT OF SCOPE)
- Nothing explicitly deferred — first exploration of this phase

---

## Standard Stack

### Core (already in project — no new installs)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React / Next.js App Router | 16 | Component rendering, API routes | Already in project |
| Anthropic SDK | latest | Claude Sonnet 4 calls for AI generation/edit | Already in `/api/generate-layout` |
| Tailwind CSS | latest | Styling gallery UI | Already in project |
| CSS variables | — | `var(--accent-*)`, `var(--bg-*)`, `var(--text-*)` | Project convention |
| Zustand | latest | Store for view state | Already in project |
| `fs` (Node.js built-in) | — | Read/write layout files from API route | Already used in generate-layout |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@hello-pangea/dnd` | latest | Drag-to-reorder variants | Already in project — use only if gallery shows variant ordering |
| CodeMirror or Monaco Editor | — | Manual code editor | Only if manual editing is complex; simple `<textarea>` may suffice given layout file sizes |

**Installation:** No new packages required for core functionality. Manual code editor might need:
```bash
npm install @codemirror/view @codemirror/lang-javascript @codemirror/theme-one-dark
# OR for Monaco (heavier):
npm install @monaco-editor/react
```
**Recommendation:** Use a `<textarea>` for manual editing (all layout files are ~50-100 lines). Monaco/CodeMirror adds 200-500KB bundle for marginal benefit. Decide based on user need for syntax highlighting.

---

## Architecture Patterns

### Recommended Project Structure
```
src/
├── features/
│   └── layout-gallery/
│       └── components/
│           ├── LayoutGallery.tsx        # Full-screen modal, main entrypoint
│           ├── LayoutGalleryGrid.tsx    # Grid of layout cards
│           ├── LayoutCard.tsx           # Single layout preview card
│           ├── LayoutVariantCreator.tsx # Create variant via AI prompt or manual code
│           └── LayoutCodeEditor.tsx     # Textarea or CodeMirror for manual edit
├── components/layouts/
│   ├── LayoutHero.tsx                   # Existing (NEVER modified)
│   ├── LayoutHeroSplit.tsx              # NEW variant — distinct file
│   ├── LayoutHeroCentered.tsx           # NEW variant — distinct file
│   └── ...
├── lib/
│   ├── section-registry.ts              # UNCHANGED — only maps standard roles
│   └── custom-layouts.ts                # Extended — all AI-generated + variants land here
└── app/
    └── api/
        ├── generate-layout/route.ts     # EXISTING — create new layout from role
        └── edit-layout/route.ts         # NEW — AI-edit existing layout TSX code
```

### Pattern 1: Gallery as Full-Screen Modal (not ViewType)

**What:** `LayoutGallery` renders as a fixed overlay (`position: fixed; inset: 0; z-index: 100`) mounted from two locations: WikiView and SectionDrawer. It receives an optional `initialRole` prop to pre-focus a layout when opened from the LayoutPicker.

**When to use:** Preferred over adding a new ViewType because:
1. Avoids modifying `ViewType`, `VIEW_ORDER`, `restoreViewFromStorage` whitelist, and `ui.slice.ts`
2. Gallery is a tool/inspector, not a primary navigation destination
3. Can open contextually from SectionDrawer without losing web-brief state

**Implementation:**
```typescript
// LayoutGallery.tsx
interface LayoutGalleryProps {
  isOpen: boolean;
  onClose: () => void;
  /** If provided, pre-selects this role in the gallery */
  initialRole?: string;
  /** If provided, shows variant creation in context of this role */
  contextRole?: string;
}
```

**State:** Local `useState` in LayoutGallery (selected layout, active tab, edit mode). No Zustand required since gallery state is ephemeral.

### Pattern 2: Variant Naming Convention

**What:** Variants use `{baseRole}_{variantName}` naming scheme. Both component name and registry key follow this.

```typescript
// File: src/components/layouts/LayoutHeroSplit.tsx
export function LayoutHeroSplit({ content }: LayoutHeroSplitProps) { ... }

// Registered in custom-layouts.ts:
export const CUSTOM_LAYOUTS: Record<string, ComponentType<LayoutComponentProps>> = {
  hero_split: LayoutHeroSplit,   // NEW
  hero_centered: LayoutHeroCentered,  // NEW
  product_grid: LayoutProductGrid,    // EXISTING
  // ...
};
```

**Why custom-layouts.ts (not a new file):** The `getAvailableLayouts()` function already reads both `SECTION_TO_LAYOUT` and `CUSTOM_LAYOUTS`, grouping them as "standard" vs "custom". Variants naturally belong in the "custom" group. `updateCustomLayoutsFile()` in `generate-layout/route.ts` already auto-updates this file.

### Pattern 3: Gallery Grid with Live Preview

**What:** Each layout card in the gallery renders the actual layout component at reduced scale using CSS transform.

```typescript
// LayoutCard.tsx
function LayoutCard({ role, label, group, isSelected, onClick }: LayoutCardProps) {
  const { layout: LayoutComponent } = getLayoutForRoleWithFallback(role);
  const defaultContent = getDefaultContentForRole(role); // helper — returns sample content

  return (
    <div onClick={onClick} className="...card container...">
      {/* Scaled preview */}
      <div className="overflow-hidden rounded-lg border border-[var(--border-subtle)] bg-white aspect-[16/9]">
        <div style={{ transform: 'scale(0.25)', transformOrigin: 'top left', width: '400%', height: '400%', pointerEvents: 'none' }}>
          {LayoutComponent ? <LayoutComponent content={defaultContent} /> : <LayoutPlaceholder role={role} />}
        </div>
      </div>
      <div className="p-3">
        <span className="text-sm font-medium text-[var(--text-primary)]">{label}</span>
        <span className="text-[10px] text-[var(--text-muted)]">{group}</span>
      </div>
    </div>
  );
}
```

**Scale factor:** `0.25` means the preview is 25% of actual size — cards will be ~250px wide showing 1000px-wide layout content. Adjust to `0.2` or `0.3` based on visual testing.

**Important:** `pointerEvents: none` on the scaled inner div prevents interaction within previews. All interaction is on the card container.

### Pattern 4: Edit-Layout API Endpoint

**What:** New POST endpoint at `/api/edit-layout` accepts existing TSX code + an edit prompt and returns modified TSX code. Does NOT write to disk — the UI receives the code and can preview it before saving.

```typescript
// /api/edit-layout/route.ts
export async function POST(req: Request) {
  const { role, existingCode, prompt }: {
    role: string;
    existingCode: string;  // Current file content read client-side (via /api/read-layout or embedded in gallery)
    prompt: string;        // User's edit instruction
  } = await req.json();

  // Claude receives: existing code + instruction → returns modified TSX
  // Same system prompt as generate-layout with added "edit" context
  // Does NOT write to disk — returns { code: string }
}
```

**Write to disk:** Handled by `/api/generate-layout` (existing) which already checks for `alreadyExisted` idempotence. When user confirms an AI edit, call generate-layout with the new code.

**Alternative:** Add a `code` parameter to the existing generate-layout endpoint to bypass AI generation when code is already known. Simpler than a separate endpoint.

### Pattern 5: LayoutGallery Entry Points

**From WikiView:** Add a "Galerie Layouts" section in `WikiView.tsx` with a button that sets a local `galleryOpen` state. Gallery mounts as a portal or inline.

**From SectionDrawer LayoutPicker:** Add a small "⊞ Galerie" button immediately after the dropdown trigger in `LayoutPicker`. Button calls `onOpenGallery?.()` prop.

```typescript
// In LayoutPicker component (SectionDrawer.tsx)
function LayoutPicker({
  currentRole,
  onChange,
  onOpenGallery,  // NEW optional prop
}: { ... }) {
  return (
    <div ref={containerRef} className="relative flex items-center gap-1">
      <button ...>{/* existing dropdown */}</button>
      {onOpenGallery && (
        <button
          type="button"
          onClick={onOpenGallery}
          className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--accent-cyan)] ..."
          title="Galerie de layouts"
        >
          {/* grid icon */}
        </button>
      )}
    </div>
  );
}
```

### Anti-Patterns to Avoid

- **Modifying existing standard layout files** (`LayoutHero.tsx` etc.): Variants must be NEW files. Base layouts are stable contracts consumed by agents.
- **Storing gallery state in Zustand**: Gallery is a tool/inspector with ephemeral state. Local `useState` only.
- **Live-preview with real HTTP fetch**: For the gallery grid, read layout file content statically at build time or via a server component. Don't call `/api/read-layout` per card render.
- **Overwriting base roles in SECTION_TO_LAYOUT**: Variants go in `CUSTOM_LAYOUTS`, never in `SECTION_TO_LAYOUT` which maps canonical `SectionRole` types.
- **Adding gallery as ViewType**: Avoids breaking keyboard navigation, localStorage restore logic, and the `VIEW_ORDER` array.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| TSX file generation | Custom code writer | Existing `generate-layout/route.ts` pattern | Already handles `toPascalCase`, `extractTsxFromResponse`, `updateCustomLayoutsFile` |
| Layout list | Custom scan | `getAvailableLayouts()` in `section-registry.ts` | Already groups standard + custom, with humanized labels |
| Layout rendering | Custom renderer | Existing layout components directly | They already accept `content?: Record<string,unknown>` with fallbacks |
| AI client | Fetch to Anthropic | `import Anthropic from '@anthropic-ai/sdk'` | Already initialized in generate-layout |
| Role normalization | Custom logic | Existing `humanizeRole()` in section-registry | Already handles underscore → space + capitalize |

**Key insight:** The entire machinery for layout generation and registration already exists. Phase 10 is primarily a UI layer on top of existing infrastructure.

---

## Common Pitfalls

### Pitfall 1: Scale Transform Breaking Layout Dimensions
**What goes wrong:** CSS `transform: scale(0.25)` scales visually but the element still occupies its original layout space. The card becomes too tall.
**Why it happens:** CSS transforms don't affect document flow.
**How to avoid:** Use a fixed-height container with `overflow: hidden` and set the inner div to `width: 400%; height: 400%` with `transform-origin: top left`. The container clips the overflow.
**Warning signs:** Card grid has uneven heights, scroll inside cards appears.

```css
/* Container */
.preview-container {
  height: 180px;
  overflow: hidden;
  position: relative;
}
/* Scaled content */
.preview-inner {
  position: absolute;
  top: 0;
  left: 0;
  width: 400%;
  height: 400%;
  transform: scale(0.25);
  transform-origin: top left;
  pointer-events: none;
}
```

### Pitfall 2: Light Theme Layouts in Dark Gallery
**What goes wrong:** Layout components use CSS variables (`var(--bg-primary)`, `var(--text-primary)`), which resolve to dark theme values in the gallery. Preview looks different from actual deployment.
**Why it happens:** The gallery UI is dark, so all CSS variables are dark theme values.
**How to avoid:** Wrap each preview in a `data-theme="light"` div (or a light-theme class) so the layout renders with light variables. The existing `previewTheme` toggle in SectionDrawer shows this pattern already exists.
**Warning signs:** All layout previews look dark/inverted when they should show client-facing white designs.

### Pitfall 3: TypeScript Error on `updateCustomLayoutsFile` for Variants
**What goes wrong:** The `updateCustomLayoutsFile` function uses a regex to inject import before the comment marker. If variant TSX imports anything new (e.g., icons), the import injection may fail.
**Why it happens:** `updateCustomLayoutsFile` does simple string replacement — not AST parsing.
**How to avoid:** Keep variants self-contained (no external imports beyond React). Use only CSS variables and Tailwind. Check that the regex match string `/** Layouts générés par l'IA — enrichi automatiquement via /api/generate-layout */` still exists in `custom-layouts.ts` before calling.

### Pitfall 4: Gallery Opened from SectionDrawer Loses Section Context
**What goes wrong:** When user opens gallery from LayoutPicker and selects a variant, the new role must propagate back to the section currently being edited.
**Why it happens:** Gallery is a modal — if it doesn't receive and return the role change, the section role isn't updated.
**How to avoid:** Pass `onSelectRole?: (role: string) => void` callback into the gallery. On variant selection/confirmation, call this callback. The SectionDrawer then calls its existing `onRoleChange` prop.

### Pitfall 5: `getAvailableLayouts()` Returns Stale Data After New Variant Created
**What goes wrong:** After generating a new variant via API, the gallery still shows the old list because the module is cached.
**Why it happens:** `custom-layouts.ts` is imported at module load time. Writing to the file doesn't invalidate the import cache during a dev server session.
**How to avoid:** After generating a variant, trigger a page reload or use `router.refresh()` (Next.js App Router) to force re-fetch. Alternatively, maintain a local gallery state that appends the new variant optimistically without relying on the registry re-read.

---

## Code Examples

### Gallery Entry from WikiView
```typescript
// In WikiView.tsx — add a section for Layout Gallery
const [galleryOpen, setGalleryOpen] = useState(false);

// In JSX:
<button onClick={() => setGalleryOpen(true)} className="...">
  Ouvrir la galerie de layouts
</button>
{galleryOpen && (
  <LayoutGallery isOpen onClose={() => setGalleryOpen(false)} />
)}
```

### Scaled Preview Container
```typescript
// LayoutCard.tsx
const SCALE = 0.22; // Adjust to fit card width
const INVERSE = Math.round(100 / SCALE); // ~454%

<div className="relative overflow-hidden rounded-lg" style={{ height: 160 }}>
  <div
    style={{
      position: 'absolute', top: 0, left: 0,
      width: `${INVERSE}%`, height: `${INVERSE}%`,
      transform: `scale(${SCALE})`,
      transformOrigin: 'top left',
      pointerEvents: 'none',
    }}
  >
    <LayoutComponent content={defaultContent} />
  </div>
</div>
```

### Edit-Layout API Pattern
```typescript
// /api/edit-layout/route.ts
import Anthropic from '@anthropic-ai/sdk';
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: Request) {
  const { role, existingCode, prompt } = await req.json();

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    system: EDIT_SYSTEM_PROMPT, // Same rules as generate-layout, plus "preserve export name"
    messages: [{
      role: 'user',
      content: `Modifie ce composant React selon l'instruction suivante.\n\nInstruction : "${prompt}"\n\nCode actuel :\n\`\`\`tsx\n${existingCode}\n\`\`\`\n\nRéponds uniquement avec le code TSX modifié.`
    }],
  });

  const code = extractTsxFromResponse(textBlock.text);
  return NextResponse.json({ code }); // Does NOT write to disk
}
```

### Variant Registration Flow
```
User creates "hero_split" variant in gallery:
1. Gallery calls POST /api/generate-layout { role: "hero_split", sampleContent: {...} }
2. API generates LayoutHeroSplit.tsx → writes to src/components/layouts/
3. API calls updateCustomLayoutsFile() → adds import + registry entry in custom-layouts.ts
4. API returns { success: true, role: "hero_split" }
5. Gallery triggers router.refresh() or page reload to pick up new registry entry
6. Gallery shows new card for hero_split in "Custom" group
```

---

## Implementation Plan Recommendation

**Suggested split into 2 plans:**

### Plan 10-01: Gallery UI + Variant Creation via AI
- `LayoutGallery` full-screen modal component
- `LayoutGalleryGrid` with scaled preview cards for all existing layouts
- "Créer variante" button per card → calls existing `/api/generate-layout`
- Gallery opens from WikiView (new section added)
- Gallery opens from LayoutPicker (new "⊞" button)
- `onSelectRole` callback wires variant selection back to SectionDrawer
- Wiki entry added for Layout Gallery feature

### Plan 10-02: AI Prompt Editing + Manual Code Editing
- New `/api/edit-layout` endpoint (AI prompt → modified TSX returned, not saved)
- Edit panel within gallery: tabs [Code] [AI Prompt]
- Code tab: `<textarea>` or CodeMirror showing current file content
- AI Prompt tab: prompt textarea → preview modified code → confirm saves (calls generate-layout with new code)
- Read-layout endpoint or static file list for fetching current layout code

---

## Open Questions

1. **How to read existing layout TSX for the code editor?**
   - What we know: Files are in `src/components/layouts/`. The generate-layout API can read them via `fs.readFileSync`.
   - What's unclear: Client-side code can't read the filesystem. Need a `/api/read-layout?role=hero` endpoint, or embed code in the component registry somehow.
   - Recommendation: Add a small `GET /api/read-layout?role=hero` endpoint that reads the file and returns code as JSON. Simple `fs.readFileSync` in the route handler.

2. **Light theme preview in dark gallery?**
   - What we know: All layout components use CSS variables. The gallery context will be dark theme.
   - What's unclear: Whether to wrap previews in a forced light-theme container, or show dark-theme previews (closer to actual use in the app).
   - Recommendation: Add a `data-theme="light"` attribute on the preview container div and make sure `globals.css` scopes light variables to `[data-theme="light"]`. The existing theme toggle in SectionDrawer confirms this pattern is viable.

3. **Stale module registry after variant generation?**
   - What we know: Next.js dev server hot-reloads on file changes. Production needs explicit reload.
   - What's unclear: Whether the gallery needs to trigger a reload or can maintain optimistic local state.
   - Recommendation: For dev: hot reload handles it automatically. For prod: after generation, navigate away and back (or router.refresh()). Gallery state is ephemeral anyway.

---

## Sources

### Primary (HIGH confidence)
- Codebase reading — `src/lib/section-registry.ts` — layout registry, `getAvailableLayouts()`, `getLayoutForRoleWithFallback()`
- Codebase reading — `src/lib/custom-layouts.ts` — custom layout registry, 5 AI-generated layouts
- Codebase reading — `src/app/api/generate-layout/route.ts` — full AI generation pipeline, `updateCustomLayoutsFile`, `extractTsxFromResponse`
- Codebase reading — `src/features/clients/components/SectionDrawer.tsx` — `LayoutPicker` component, `onRoleChange` callback, DnD, edit panel
- Codebase reading — `src/features/wiki/components/WikiView.tsx` + `wiki-data.ts` — wiki structure, ICON_MAP, feature sections
- Codebase reading — `src/lib/store/types.ts` — `ViewType`, all navigation actions
- Codebase reading — `src/lib/store/slices/ui.slice.ts` — `VIEW_ORDER`, `restoreViewFromStorage` whitelist, navigation implementations
- Codebase reading — `src/app/page.tsx` — view rendering switch, keyboard navigation
- Codebase reading — `src/types/section-zoning.ts` — `ZonedSection`, `SectionLayoutVariant`, `SectionRole`
- Codebase reading — `src/components/layouts/*.tsx` — all 13 standard + 5 custom layout files (structure, props, CSS variable usage)

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — directly read from codebase, no external dependencies needed
- Architecture: HIGH — patterns are direct extensions of existing patterns already in the codebase
- Pitfalls: HIGH for CSS transform issues (well-known), MEDIUM for module cache invalidation (depends on Next.js version behavior)
- Edit-layout API: HIGH — same pattern as generate-layout which is already working

**Research date:** 2026-02-22
**Valid until:** 2026-04-22 (stable codebase, 60-day estimate)

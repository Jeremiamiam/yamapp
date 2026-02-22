# Phase 9: Retroplanning IA - Research

**Researched:** 2026-02-22
**Domain:** AI-generated project planning / Gantt timeline visualization / React drag-resize interaction
**Confidence:** HIGH (architecture and AI patterns) / MEDIUM (Gantt library choice)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Source des données**
- L'IA lit le web brief existant du client dans YAM Dash pour en déduire les livrables
- Pour les projets non-web, l'IA doit aussi pouvoir travailler à partir du contexte client disponible
- Input principal : date de livraison + contenu du brief → l'IA fait le puzzle entre les deux

**Scope projet**
- Tous types de projets agence (sites web, identité visuelle, campagnes, vidéo...)
- Pas limité aux web briefs — l'outil doit être générique
- L'IA adapte les étapes au type de projet détecté dans le brief

**Jalons / Étapes**
- Pas de template fixe de phases — l'IA analyse le brief et propose les étapes adaptées au projet
- L'IA déduit les jalons pertinents (ex: pour un site web → maquettes/dev/recette, pour une vidéo → script/tournage/montage)
- Les étapes proposées sont spécifiques au projet, pas génériques

**Estimations de durée**
- L'IA propose des durées basées sur le contexte du projet
- L'équipe ajuste manuellement les durées après génération
- Pas de durées préconfigurées par type de tâche

**Dépendances**
- Pas de gestion automatique des dépendances entre tâches
- Ordre logique visible mais c'est l'humain qui gère les enchaînements
- Pas de recalcul automatique en cascade

**Visualisation**
- Timeline / Gantt — barres horizontales, vue classique chef de projet
- Vit dans la fiche client (onglet ou section dédiée)
- Pas de vue globale cross-projets (interne à chaque client)

**Édition post-génération**
- Drag & drop sur le Gantt pour déplacer/redimensionner les barres rapidement
- Formulaire pour l'édition détaillée (clic sur une tâche)
- Les deux modes coexistent

**Audience**
- Usage interne uniquement — outil de pilotage équipe
- Pas de partage client prévu dans cette phase

### Claude's Discretion

- Choix de la librairie Gantt/Timeline
- Format exact des données de planning en base
- Design des barres et couleurs par type d'étape
- Algorithme de répartition des durées entre la date courante et la deadline

### Deferred Ideas (OUT OF SCOPE)

- Vue globale cross-projets (tous les retroplannings actifs) — future phase
- Partage client / export du retroplanning — future phase
- Suivi actif IA (alertes retard, suggestions d'ajustement) — future phase
- Apprentissage des durées basé sur les projets passés — future phase
</user_constraints>

---

## Summary

Phase 9 builds an AI-powered retroplanning tool embedded in the client detail view. The AI reads the client's existing brief (web brief document or available client context), detects the project type, and generates a backwards timeline from a user-supplied deadline. The result is a Gantt chart (horizontal bars) stored per client in Supabase, editable via drag-resize on the chart and a task edit form.

The codebase already has all the patterns needed: Anthropic SDK calls for AI generation (`src/app/api/*`), Supabase JSONB storage for structured data, Zustand store actions for CRUD, and `@hello-pangea/dnd` for drag. The main new complexity is the Gantt visualization with drag-to-resize (which `@hello-pangea/dnd` does not support for horizontal resizing). This points toward either a purpose-built Gantt library or a custom CSS Grid + pointer events implementation.

The AI prompt is the most critical piece. The brief content retrieved from `ClientDocument` (type `web-brief`, `brief`, or `report`) must be cleanly serialized and passed. The AI must output a structured JSON array of tasks with `id`, `label`, `startDate`, `endDate`, `color` — a minimal but sufficient schema. The retroplanning algorithm is simple: given the deadline, distribute tasks backwards with AI-estimated durations, computing start dates as `deadline - sum(subsequent durations)`.

**Primary recommendation:** Use a lightweight custom Gantt built on CSS Grid + pointer events for full styling control and zero library dependency conflicts. Store tasks as JSONB in a new `retroplanning` Supabase table (one row per client). The AI endpoint pattern follows exactly `src/app/api/web-section-rewrite/route.ts`.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@anthropic-ai/sdk` | ^0.75.0 (already installed) | AI task generation | Already in use across all AI routes |
| `jsonrepair` | ^3.10.1 (already installed) | Robust JSON parsing of AI output | Already used in all AI routes |
| Supabase (`@supabase/supabase-js`) | ^2.95.3 (already installed) | Persist retroplanning data | Existing backend |
| Zustand | ^5.0.11 (already installed) | Store + CRUD actions | Existing state management |
| `@hello-pangea/dnd` | ^18.0.1 (already installed) | Task list reordering (NOT for Gantt resize) | Already used in Phase 8 section DnD |

### Supporting (For Gantt Visualization)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Custom CSS Grid + pointer events | built-in | Gantt bars with drag-move + resize | First choice — full design token support, no external deps |
| `@svar/gantt-react` (SVAR Gantt) | MIT, free tier | Full-featured Gantt if custom gets complex | If custom implementation is too time-consuming |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom CSS Grid Gantt | `gantt-task-react` | Original package unmaintained (last update 4 years ago, v0.3.9). Forks exist but add external dependency risk. |
| Custom CSS Grid Gantt | SVAR React Gantt | MIT free tier available, feature-rich, but requires learning its API and cannot be styled with CSS variables natively |
| Custom CSS Grid Gantt | Frappe Gantt | JS-only (not React-native), requires extra wrapper. SVG-based, harder to style. |
| `@hello-pangea/dnd` for Gantt | `dnd-kit` | `@hello-pangea/dnd` is list-only (no grid support). For horizontal Gantt drag-resize, pointer events are simpler than `dnd-kit` sensors. |

**Installation (if SVAR route chosen):**
```bash
npm install @svar/gantt-react
```

**Preferred path (custom):** No new npm install needed.

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── app/api/retroplanning/
│   └── route.ts                  # AI endpoint: brief → tasks JSON
├── features/clients/
│   └── components/
│       ├── sections/
│       │   └── RetroplanningSection.tsx   # Section in ClientDetail
│       ├── RetroplanningGantt.tsx         # Gantt visualization component
│       └── RetroplanningTaskForm.tsx      # Edit form (click on task)
├── lib/store/
│   ├── types.ts                  # Add RetroplanningTask, RetroplanningPlan types
│   └── slices/data.slice.ts      # Add CRUD actions for retroplanning
└── types/
    └── index.ts                  # Add RetroplanningTask interface
supabase/migrations/
    └── 20260222XXXXXX_create_retroplanning.sql
```

### Pattern 1: AI Generation Endpoint

Follows exactly the same pattern as `src/app/api/web-section-rewrite/route.ts`.

**What:** POST endpoint that receives brief content + deadline, calls Claude, returns structured JSON array of tasks.

**When to use:** Called once when user clicks "Générer le retroplanning". Result is stored in Supabase, not re-generated on every render.

**Example:**
```typescript
// src/app/api/retroplanning/route.ts
import Anthropic from '@anthropic-ai/sdk';
import { jsonrepair } from 'jsonrepair';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `Tu es un chef de projet senior dans une agence créative.
Tu reçois le contenu d'un brief client et une date de livraison finale.
Tu génères un retroplanning : liste ordonnée d'étapes, des plus tardives aux plus précoces.
Tu adaptes les étapes au type de projet (site web, identité visuelle, vidéo, campagne...).
Aucun template fixe : tu lis le brief et déduis ce qui est nécessaire.

## Format de sortie

Réponds UNIQUEMENT avec un bloc <structured_output> contenant un tableau JSON :

<structured_output>
[
  {
    "id": "uuid-string",
    "label": "Nom de l'étape",
    "durationDays": 5,
    "color": "cyan"
  }
]
</structured_output>

Les étapes sont ordonnées du début du projet (index 0) à la fin.
durationDays est la durée estimée en jours ouvrés.
color est l'une des valeurs: "cyan", "lime", "violet", "coral", "amber", "magenta".
Génère entre 4 et 10 étapes maximum.`;

export async function POST(req: Request) {
  const { briefContent, deadline, clientName } = await req.json();
  // ... call Claude, parse JSON, return tasks
}
```

### Pattern 2: Data Schema (Supabase)

**What:** One `retroplanning` table, one row per client. Tasks stored as JSONB array.

**Why JSONB and not normalized rows:** Tasks have no cross-client relationships. The array is always read/written together. JSONB avoids a join and matches the pattern used for `documents` content (stored as JSON string in the `content` text column).

```sql
-- supabase/migrations/20260222XXXXXX_create_retroplanning.sql
CREATE TABLE IF NOT EXISTS public.retroplanning (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  client_id text NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  deadline date NOT NULL,
  tasks jsonb NOT NULL DEFAULT '[]',
  generated_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT retroplanning_client_unique UNIQUE (client_id)
);

ALTER TABLE public.retroplanning ENABLE ROW LEVEL SECURITY;
-- Standard RLS: authenticated users read/write
```

**TypeScript types:**
```typescript
// src/types/index.ts additions
export type RetroplanningTaskColor = 'cyan' | 'lime' | 'violet' | 'coral' | 'amber' | 'magenta';

export interface RetroplanningTask {
  id: string;                    // UUID stable
  label: string;
  startDate: string;             // ISO YYYY-MM-DD (computed from deadline - durations)
  endDate: string;               // ISO YYYY-MM-DD
  durationDays: number;
  color: RetroplanningTaskColor;
}

export interface RetroplanningPlan {
  clientId: string;
  deadline: string;              // ISO YYYY-MM-DD
  tasks: RetroplanningTask[];
  generatedAt: string;           // ISO date
  updatedAt: string;
}
```

### Pattern 3: Date Computation (Retroplanning Algorithm)

**What:** Given AI output (ordered tasks with `durationDays`), compute `startDate` / `endDate` by walking backward from the deadline.

**When to use:** Called immediately after AI response, before storing in Supabase.

```typescript
// lib/retroplanning-utils.ts
import { addBusinessDays, subBusinessDays, format } from 'date-fns'; // or pure math

function computeDatesFromDeadline(
  tasks: { id: string; label: string; durationDays: number; color: string }[],
  deadline: Date
): RetroplanningTask[] {
  // Walk backward: last task ends at deadline
  let cursor = deadline;
  const result: RetroplanningTask[] = [];

  for (let i = tasks.length - 1; i >= 0; i--) {
    const task = tasks[i];
    const endDate = cursor;
    const startDate = subBusinessDays(endDate, task.durationDays);
    result.unshift({
      ...task,
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(endDate, 'yyyy-MM-dd'),
    });
    cursor = startDate; // next task ends where this one starts
  }
  return result;
}
```

Note: `date-fns` is NOT currently in package.json. Two options:
1. Use pure JS date arithmetic (add/subtract milliseconds × days) — no new dependency
2. Install `date-fns` for `subBusinessDays` / `addBusinessDays` to skip weekends

**Recommendation:** Pure JS for now (skipping weekends is a nice-to-have, not critical for v1). The business day logic can be added later.

### Pattern 4: Custom CSS Gantt with Pointer Events

**What:** Gantt rendered as a CSS Grid. Each task is an absolutely or grid-positioned bar. Drag (move) and resize use `onPointerDown` / `onPointerMove` / `onPointerUp` on the document.

**Why pointer events, not mouse events:** Pointer events work on touch screens too. Standard in 2025 React.

```typescript
// RetroplanningGantt.tsx sketch
// Grid columns = days from project start to deadline
// Each bar: gridColumnStart / gridColumnEnd based on task dates

function GanttBar({ task, onUpdate }: { task: RetroplanningTask; onUpdate: (updated: RetroplanningTask) => void }) {
  const handlePointerDown = (e: React.PointerEvent, mode: 'move' | 'resize-right') => {
    e.currentTarget.setPointerCapture(e.pointerId);
    // Track startX, initial dates, mode
    // On pointermove: compute delta days → update dates
    // On pointerup: call onUpdate with final dates
  };

  return (
    <div
      style={{ gridColumnStart: ..., gridColumnEnd: ... }}
      className="rounded h-8 cursor-grab active:cursor-grabbing flex items-center px-2"
      onPointerDown={(e) => handlePointerDown(e, 'move')}
    >
      <span>{task.label}</span>
      {/* Resize handle */}
      <div
        className="absolute right-0 w-2 h-full cursor-ew-resize"
        onPointerDown={(e) => { e.stopPropagation(); handlePointerDown(e, 'resize-right'); }}
      />
    </div>
  );
}
```

**Key technique:** `element.setPointerCapture(pointerId)` — ensures pointer events continue to fire on the element even when the cursor leaves it during drag. This is the standard pattern for drag-resize in 2025.

### Pattern 5: Brief Content Extraction

**What:** When generating, read the client's `documents` array from the store to find relevant brief content.

```typescript
// In the generate button handler (RetroplanningSection.tsx)
const client = useAppStore(s => s.getClientById(clientId));

const briefContent = client?.documents
  .filter(d => ['web-brief', 'brief', 'report', 'creative-strategy'].includes(d.type))
  .map(d => `[${d.type.toUpperCase()}]\n${d.content}`)
  .join('\n\n---\n\n')
  .substring(0, 8000); // Token limit guard
```

**For non-web projects:** Include `brief` and `report` type documents. The AI prompt explicitly handles all project types.

### Anti-Patterns to Avoid

- **Using `@hello-pangea/dnd` for Gantt bar repositioning:** It is list-based (vertical). It does not support horizontal drag with pixel-precision positioning on a time axis. Use pointer events instead.
- **Normalizing tasks into individual Supabase rows:** Over-engineering. Tasks are always read/written as a unit per client. JSONB in one table is correct.
- **Recalculating dates client-side on every render:** Compute dates once (after AI generation or after user drag), store the computed `startDate`/`endDate` in Supabase. Do not recompute from `durationDays` each time.
- **Allowing the AI to output absolute dates:** The AI only outputs `durationDays`. Date computation happens in the app, not the AI. This gives the app full control over the algorithm.
- **Passing the full WebBriefData JSON to Claude:** Truncate aggressively. Pass only relevant sections (architecture.primary_objective, homepage sections' intents, etc.) — not the full raw JSON. Keep AI input under 6000 chars.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JSON repair for AI output | Custom regex parser | `jsonrepair` (already installed) | AI outputs malformed JSON; jsonrepair handles it |
| Business day calculation | Custom calendar logic | Simple calendar-days subtraction for v1 | Weekends matter but are a nice-to-have; pure math is enough for v1 |
| Gantt drag physics | Complex event math | `setPointerCapture` + delta-day calculation | Capture makes it trivial; no physics needed |
| Supabase upsert | INSERT + UPDATE separate | `supabase.from('retroplanning').upsert({...}, { onConflict: 'client_id' })` | One operation handles both create and update |

**Key insight:** For retroplanning at agency scale (4–10 tasks per project, 10–50 clients), there is zero need for a heavyweight Gantt library. The entire visualization is achievable in 150–200 lines of React + CSS.

---

## Common Pitfalls

### Pitfall 1: AI Outputs Absolute Dates Instead of Durations

**What goes wrong:** If you ask Claude to "output the start date of each task," it will hallucinate plausible dates that are internally inconsistent.
**Why it happens:** LLMs are not reliable date calculators.
**How to avoid:** The AI prompt must ask for `durationDays` only. The app computes all absolute dates.
**Warning signs:** Tasks with gaps between them, tasks that end after the deadline.

### Pitfall 2: `@hello-pangea/dnd` Used for Gantt Drag

**What goes wrong:** `@hello-pangea/dnd` supports vertical list reordering, not free horizontal pixel positioning on a time axis. Attempting to use it will produce wrong snapping behavior.
**Why it happens:** Phase 8 used `@hello-pangea/dnd` for section reordering (vertical list) — do not assume the same library fits Gantt.
**How to avoid:** Use raw pointer events for Gantt bar drag/resize. Use `@hello-pangea/dnd` only if adding a "task list reorder" mode (which is not in scope).
**Warning signs:** Bars snap to the wrong positions, horizontal drag fails.

### Pitfall 3: Infinite Re-renders from JSONB Date Fields

**What goes wrong:** Supabase returns `deadline` as a string. If the mapper creates a `new Date()` on every load, React detects a new reference and re-renders unnecessarily.
**Why it happens:** Date object identity comparison.
**How to avoid:** Keep dates as ISO strings (`string`) everywhere in the store. Only convert to `Date` objects inside components for display/calculation. Follow the existing pattern for `Deliverable.dueDate` (optional Date, converted in mapper).

### Pitfall 4: Missing Supabase RLS Policy

**What goes wrong:** The `retroplanning` table is readable by unauthenticated users.
**Why it happens:** Forgetting to enable RLS or using `USING (true)` without `TO authenticated`.
**How to avoid:** Follow the exact RLS pattern in `20260218140000_create_projects.sql`: `TO authenticated USING (true)` on all policies.
**Warning signs:** TypeScript build passes but data is exposed publicly.

### Pitfall 5: Brief Content Overflows Claude's Context

**What goes wrong:** For clients with large web briefs (architecture + 10 pages of zoning), the serialized content can exceed 50,000 chars. Passing this raw will cause token limit errors or very slow responses.
**Why it happens:** `WebBriefData` contains full section content for every page.
**How to avoid:** Extract only the high-level parts: `architecture.site_type`, `architecture.primary_objective`, `architecture.target_visitor`, homepage section `role` + `intent` only (not `content`). Hard cap the string at 6000 chars. Use the existing truncation pattern from `web-section-rewrite/route.ts` (`substring(0, 2000)` per field).

### Pitfall 6: Task Color Not Mapped to Design Tokens

**What goes wrong:** AI outputs `"color": "cyan"` but the component renders a hardcoded hex instead of `var(--accent-cyan)`.
**Why it happens:** CSS variable usage requires the mapping to be explicit.
**How to avoid:** Define a color map in the component:
```typescript
const COLOR_MAP: Record<RetroplanningTaskColor, string> = {
  cyan: 'var(--accent-cyan)',
  lime: 'var(--accent-lime)',
  violet: 'var(--accent-violet)',
  coral: 'var(--accent-coral)',
  amber: 'var(--accent-amber)',
  magenta: 'var(--accent-magenta)',
};
```

---

## Code Examples

### AI Endpoint — Parsing Pattern

```typescript
// Source: adapted from src/app/api/web-section-rewrite/route.ts
function extractTasksFromResponse(text: string): RawTaskFromAI[] {
  const match = text.match(/<structured_output>([\s\S]*?)<\/structured_output>/i);
  const raw = match ? match[1].trim() : text;
  const firstBracket = raw.indexOf('[');
  const lastBracket = raw.lastIndexOf(']');
  if (firstBracket === -1 || lastBracket <= firstBracket) throw new Error('Array JSON not found');
  const jsonStr = raw.substring(firstBracket, lastBracket + 1);
  try {
    return JSON.parse(jsonStr) as RawTaskFromAI[];
  } catch {
    return JSON.parse(jsonrepair(jsonStr)) as RawTaskFromAI[];
  }
}
```

### Supabase Upsert

```typescript
// In data.slice.ts — save retroplanning
const supabase = createClient();
const { error } = await supabase
  .from('retroplanning')
  .upsert(
    {
      client_id: clientId,
      deadline: plan.deadline,
      tasks: plan.tasks,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'client_id' }
  );
if (error) throw new AppError(error.message, error);
```

### CSS Grid Gantt — Column Calculation

```typescript
// Total days span from earliest task start to deadline
const totalDays = differenceInDays(deadline, projectStart) + 1;

// For a task:
const colStart = differenceInDays(task.startDate, projectStart) + 1;
const colEnd = differenceInDays(task.endDate, projectStart) + 2; // exclusive end

// CSS:
// style={{ gridColumn: `${colStart} / ${colEnd}` }}
```

### ClientDetail Integration

The new `RetroplanningSection` will be added alongside existing sections in `ClientDetail.tsx`:

```tsx
// src/features/clients/components/ClientDetail.tsx
import { RetroplanningSection } from './sections';

// Inside the grid layout, as a new full-width row below the existing columns:
<section className="col-span-1 lg:col-span-3">
  <RetroplanningSection clientId={client.id} />
</section>
```

### Store Type Extension

```typescript
// src/lib/store/types.ts additions
import type { RetroplanningPlan } from '@/types';

// In AppState interface:
retroplanning: Map<string, RetroplanningPlan>; // clientId → plan

// New actions:
loadRetroplanning: (clientId: string) => Promise<void>;
saveRetroplanning: (clientId: string, plan: RetroplanningPlan) => Promise<void>;
deleteRetroplanning: (clientId: string) => Promise<void>;
getRetroplanningByClientId: (clientId: string) => RetroplanningPlan | undefined;
```

### Wiki Update Required

Per CLAUDE.md, after Phase 9:
1. Add new `FEATURE_SECTIONS` entry for "Retroplanning" in `src/features/wiki/wiki-data.ts`
2. Add a `RETROPLANNING_AGENTS` array (one AI agent: "Retroplanning Architect")
3. Add a pipeline step `{ emoji: '📅', label: 'Retroplanning', sub: 'Planning inversé IA', color: 'var(--accent-amber)' }` to `PIPELINE_STEPS`

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `gantt-task-react` (popular in 2021-2022) | Unmaintained since 2021 (v0.3.9) | 2021 | Do not use; forks exist but fragmented |
| Mouse events for drag | Pointer events + `setPointerCapture` | 2022 | Works on touch too; no `onMouseLeave` bugs |
| Separate INSERT/UPDATE for upsert | `supabase.upsert({ onConflict })` | 2023 | Single operation, handles both |
| `date-fns` for every date op | Native `Intl.DateTimeFormat` + arithmetic | 2024 | date-fns still valid but adds 13KB; pure math fine for simple ops |

**Deprecated/outdated:**
- `react-beautiful-dnd`: Archived. `@hello-pangea/dnd` is the maintained fork (already installed).
- `gantt-task-react` (original): Last publish 4 years ago. Do not use.

---

## Open Questions

1. **Date granularity: calendar days vs. business days**
   - What we know: The locked decisions say "durées en jours" without specifying. Business days are more meaningful for agency work.
   - What's unclear: Does the team want weekends to count? Does "5 days" mean 5 calendar days or Mon-Fri?
   - Recommendation: Default to calendar days for v1 (simpler). Add business day toggle as enhancement if requested.

2. **What if client has no documents (new prospect with no brief yet)?**
   - What we know: The AI reads brief documents. Some clients may have no documents at all.
   - What's unclear: Should the feature be disabled for clients without documents, or should there be a fallback prompt?
   - Recommendation: Show the generation button only if the client has at least one document of type `brief`, `web-brief`, `report`, or `creative-strategy`. Otherwise show a "Ajoutez un brief d'abord" empty state.

3. **One retroplanning per client or one per project?**
   - What we know: CONTEXT.md says "fiche client" (client level). Projects already exist as a separate entity.
   - What's unclear: Should each `Project` have its own retroplanning, or is it one global plan per client?
   - Recommendation: Start with one plan per client (simpler). The `UNIQUE (client_id)` constraint enforces this. Per-project plans are a natural future enhancement.

4. **Token budget for brief content**
   - What we know: Existing routes truncate to 2000 chars per field. A full web brief document can be 20,000+ chars.
   - Recommendation: Extract `site_type`, `primary_objective`, `target_visitor` from web brief JSON, and the `role` + `intent` from homepage sections (skip `content`). Build a summarized string ≤ 4000 chars. For non-web docs (brief, report), pass the first 4000 chars of raw text.

---

## Sources

### Primary (HIGH confidence)

- Codebase: `src/app/api/web-section-rewrite/route.ts` — AI endpoint pattern with `<structured_output>` parsing
- Codebase: `src/app/api/creative-board/route.ts` — Multi-agent streaming pattern, `jsonrepair` usage
- Codebase: `supabase/migrations/20260218140000_create_projects.sql` — Supabase migration + RLS pattern
- Codebase: `src/lib/store/slices/data.slice.ts` — Zustand slice pattern, Supabase upsert via `createClient()`
- Codebase: `src/lib/store/types.ts` — `AppState` interface extension pattern
- Codebase: `src/types/index.ts` — Existing type definitions
- Codebase: `src/features/clients/components/ClientDetail.tsx` — Integration point for new section
- Codebase: `package.json` — Confirmed available libraries (`@hello-pangea/dnd`, `jsonrepair`, `@anthropic-ai/sdk`)

### Secondary (MEDIUM confidence)

- WebSearch: gantt-task-react npm status — Confirmed inactive (4 years since last update). Multiple sources agree.
- WebSearch: `@hello-pangea/dnd` grid support — Confirmed "grid layouts not supported" per official README.
- WebSearch: SVAR React Gantt — MIT free tier confirmed, actively maintained.
- WebSearch: `setPointerCapture` for drag/resize — Standard pattern in 2025 React drag implementations.
- WebSearch: Supabase JSONB — Official Supabase docs confirm JSONB for flexible schema.

### Tertiary (LOW confidence)

- WebSearch: Business day calculation patterns — Multiple approaches exist, no single standard. Needs validation.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — All primary libraries already in project, patterns verified in existing code
- Architecture: HIGH — Follows established project patterns exactly
- Gantt library recommendation: MEDIUM — Custom CSS Grid is well-reasoned but involves more implementation work than a library
- AI prompt design: MEDIUM — Pattern established, specific prompt tuning will require iteration
- Pitfalls: HIGH — Derived from existing codebase analysis and verified library constraints

**Research date:** 2026-02-22
**Valid until:** 2026-03-22 (stable ecosystem; date-fns/library versions unlikely to change)

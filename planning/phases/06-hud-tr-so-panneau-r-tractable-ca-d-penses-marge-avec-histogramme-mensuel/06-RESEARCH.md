# Phase 6: Vue Comptabilité / Facturation - Research

**Researched:** 2026-02-15
**Domain:** Financial dashboard UI with data aggregation, filtering, and visualization
**Confidence:** HIGH

## Summary

Phase 6 adds a dedicated accounting/billing view at the navigation level (alongside Calendar and Clients) to provide financial oversight of the agency's revenue, expenses, and margin. The implementation centers on aggregating existing deliverable data (already containing `prixFacturé` and `coutSousTraitance` fields) with year-based filtering and grouped client displays.

The technical foundation already exists: Next.js 16.1.6 with React 19.2.3, Zustand 5.0.11 for state management, Tailwind CSS 4 for styling, and Supabase for data persistence. The existing ComptaView component provides a working baseline with KPI cards, expandable client tables, and mock monthly histograms.

**Primary recommendation:** Enhance the existing ComptaView by adding year selector state to Zustand store, implement fiscal year filtering logic using useMemo for performance, and replace mock monthly histogram with real data calculated from deliverable due dates. Avoid external charting libraries for the simple bar histogram (custom SVG/div approach already working). Use native Intl.NumberFormat for currency formatting (already implemented). Follow existing patterns for expandable rows and filter UI.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Horizon de temps:**
- Année fiscale complète (janvier → décembre)
- Sélecteur d'année avec flèches `< 2026 >`
- Permet de naviguer entre années (2024, 2025, 2026, etc.)
- Par défaut: année en cours
- Important pour totaliser les KPIs annuels (déclarations fiscales, compta officielle)

**Rentrées validées:**
- Facturé = rentré (peu importe si encaissé ou pas)
- Critère: deliverables avec `status = 'completed'`
- Montant: `prixFacturé` de chaque deliverable
- Présentation: Groupé par client
- Ex: "Forge: 8 000€ (Logo 3500€ + Charte 4500€)"
- Liste des clients avec sous-total + détail des deliverables

**CA potentiel (Prévisionnel):**
- Somme automatique des deliverables futurs/prospects
- Critère: deliverables avec `status = 'pending' | 'in-progress'`
- Inclut prospects (clients avec `status = 'prospect'`) ET projets futurs clients existants
- Présentation: Détail par client (comme rentrées)
- Ex: "Les 4 Nectarines (P): 5 000€ (Logo 3k + Carte visite 2k)"
- Indication visuelle prospect vs client existant

**Marge & Dépenses:**
- Marge = Rentrées - Coûts freelances/sous-traitance
- Coûts: `coutSousTraitance` de chaque deliverable
- Pas de coûts fixes mensuels (hors scope)
- Calcul automatique par client et global

### Claude's Discretion

- Layout exact (KPIs + listes, colonnes, ou onglets — choisir le plus clair)
- Design des cartes clients (expansion, collapse, icônes)
- Ordre de tri (alphabétique, montant DESC, ou date)
- Affichage marge par projet (si utile) ou juste marge globale
- Graphique/histogramme optionnel si ça aide la lisibilité

### Deferred Ideas (OUT OF SCOPE)

**Hors scope explicite (user a dit non):**
- Alertes paiements en retard
- Gestion coûts fixes mensuels
- Tracking statut paiement (facturé/encaissé/retard)
- Système de facturation complet
</user_constraints>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.2.3 | UI framework | Already in use, latest stable |
| Next.js | 16.1.6 | React framework | Already in use, App Router pattern |
| TypeScript | ^5 | Type safety | Already in use throughout codebase |
| Zustand | ^5.0.11 | State management | Already in use, lightweight, simple API |
| Tailwind CSS | ^4 | Styling | Already in use, utility-first CSS |
| Supabase | ^2.95.3 | Backend/DB | Already in use for persistence |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Intl.NumberFormat | Native | Currency formatting | Already used in ComptaView for EUR formatting |
| react-hook-form | ^7.71.1 | Form handling | Already in use, if adding config forms later |
| Zod | ^4.3.6 | Schema validation | Already in use, if adding validation |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom SVG histogram | Recharts/Chart.js | Existing approach works, adds no deps. Recharts would add 400KB+. Only consider if complex charts needed later. |
| Zustand selectors | Redux Toolkit | Zustand already in use, sufficient for derived state. RTK adds boilerplate. |
| Custom year selector | react-date-range | Simple arrows + year state don't need full date picker library. |

**Installation:**
No new packages required. All needed dependencies already installed.

## Architecture Patterns

### Recommended Project Structure
```
src/
├── features/
│   └── compta/
│       └── components/
│           ├── ComptaView.tsx       # Main view (exists)
│           ├── YearSelector.tsx     # NEW: Year navigation
│           ├── ClientRevenueTable.tsx  # EXTRACT: Client grouping
│           └── MonthlyHistogram.tsx # EXTRACT: Chart component
├── lib/
│   ├── store.ts                     # EXTEND: Add year filter state
│   └── date-utils.ts                # EXTEND: Add fiscal year helpers
└── types/
    └── index.ts                     # Types already defined
```

### Pattern 1: Fiscal Year Filtering with Zustand + useMemo

**What:** Add year filter state to Zustand store, use derived selectors with useMemo for year-filtered aggregations.

**When to use:** When filtering large datasets by date ranges without re-fetching from server.

**Example:**
```typescript
// Source: Existing Zustand patterns in store.ts + React useMemo best practices
// https://react.dev/reference/react/useMemo

// In store.ts - add year filter state
interface AppState {
  comptaYear: number;
  setComptaYear: (year: number) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  comptaYear: new Date().getFullYear(),
  setComptaYear: (year) => set({ comptaYear: year }),

  // Selector: get deliverables filtered by year
  getDeliverablesByYear: () => {
    const { deliverables, comptaYear } = get();
    return deliverables.filter(d => {
      if (!d.dueDate) return false;
      return new Date(d.dueDate).getFullYear() === comptaYear;
    });
  },
}));

// In ComptaView.tsx - use memoized aggregations
const { comptaYear, getDeliverablesByYear } = useAppStore();

const yearlyAggregates = useMemo(() => {
  const yearDeliverables = getDeliverablesByYear();
  // ... perform expensive calculations once per year change
  return { totalFacturé, totalDépensé, byClient };
}, [comptaYear, deliverables]); // Re-compute only when year or data changes
```

**Why this pattern:**
- Avoids prop drilling and local state synchronization issues
- useMemo prevents expensive filter/reduce operations on every render
- Zustand selectors keep computed values out of store (derive on read, not store)

### Pattern 2: Year Selector UI Component

**What:** Controlled component with previous/next arrows and current year display, updates Zustand state.

**When to use:** Simple sequential navigation (not date picker).

**Example:**
```typescript
// Source: Existing filter patterns in TimelineFilters.tsx
// https://github.com/gpbl/react-day-picker/discussions/2425 (avoid over-engineering)

export function YearSelector() {
  const { comptaYear, setComptaYear } = useAppStore();

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => setComptaYear(comptaYear - 1)}
        className="p-2 hover:bg-[var(--bg-tertiary)] rounded-lg"
        aria-label="Année précédente"
      >
        <ChevronLeft />
      </button>

      <span className="text-xl font-bold min-w-[5rem] text-center">
        {comptaYear}
      </span>

      <button
        onClick={() => setComptaYear(comptaYear + 1)}
        disabled={comptaYear >= new Date().getFullYear() + 5}
        className="p-2 hover:bg-[var(--bg-tertiary)] rounded-lg disabled:opacity-30"
        aria-label="Année suivante"
      >
        <ChevronRight />
      </button>
    </div>
  );
}
```

**Why this pattern:**
- Follows existing UI patterns (similar to Timeline filters)
- Keyboard accessible (buttons are focusable)
- Simpler than dropdown or date picker for sequential navigation

### Pattern 3: Expandable Client Revenue Table

**What:** Table rows that expand to show deliverable details, following existing ComptaView pattern.

**When to use:** Already implemented and working well. Maintain consistency.

**Example:**
```typescript
// Source: Existing implementation in ComptaView.tsx lines 215-267
// https://tanstack.com/table/v8/docs/guide/expanding (TanStack pattern, but manual toggle simpler)

const [expandedClientId, setExpandedClientId] = useState<string | null>(null);

// In table row:
<tr
  onClick={() => setExpandedClientId(isExpanded ? null : row.clientId)}
  className="cursor-pointer hover:bg-[var(--bg-tertiary)]/30"
>
  <td><ChevronDown open={isExpanded} /></td>
  <td>{row.clientName}</td>
  <td>{formatEur(row.totalFacturé)}</td>
</tr>

{isExpanded && (
  <tr>
    <td colSpan={5}>
      <div className="px-6 py-4 bg-[var(--bg-tertiary)]/20">
        {row.deliverables.map(d => (
          <div key={d.id} onClick={(e) => e.stopPropagation()}>
            {d.name} - {formatEur(d.prixFacturé)}
          </div>
        ))}
      </div>
    </td>
  </tr>
)}
```

**Why this pattern:**
- Already implemented and tested
- Single expanded row at a time (simpler UX than multi-expand)
- stopPropagation prevents row collapse when clicking nested items

### Pattern 4: Monthly Histogram from Deliverable Dates

**What:** Group deliverables by month using dueDate, render bars with CSS height based on totals.

**When to use:** Replace mock `comptaMonthly` data with real calculated data.

**Example:**
```typescript
// Source: Existing histogram in ComptaView.tsx lines 288-304 (structure)
// Data calculation inspired by: https://refine.dev/blog/recharts/

const monthlyData = useMemo(() => {
  const months = Array.from({ length: 12 }, (_, i) => ({
    month: new Date(comptaYear, i).toLocaleDateString('fr-FR', { month: 'short' }),
    entrées: 0,
    sorties: 0,
  }));

  yearDeliverables.forEach(d => {
    if (!d.dueDate) return;
    const monthIndex = new Date(d.dueDate).getMonth();
    if (d.status === 'completed') {
      months[monthIndex].entrées += d.prixFacturé ?? 0;
      months[monthIndex].sorties += d.coutSousTraitance ?? 0;
    }
  });

  return months;
}, [yearDeliverables]);

// Render (existing approach with real data)
<div className="h-48 flex items-end gap-2">
  {monthlyData.map((m, i) => (
    <div key={i} className="flex-1 flex flex-col-reverse gap-0.5">
      <div
        className="w-full rounded-t bg-[#22c55e]/80"
        style={{ height: `${(m.entrées / maxValue) * 100}%` }}
      />
      <div
        className="w-full rounded-t bg-[#ef4444]/80"
        style={{ height: `${(m.sorties / maxValue) * 100}%` }}
      />
      <span className="text-[10px] uppercase">{m.month}</span>
    </div>
  ))}
</div>
```

**Why this pattern:**
- No external dependencies (Recharts would add 400KB+)
- Existing CSS-based approach performs well for 12 bars
- Month grouping straightforward with Array(12) + reduce

### Anti-Patterns to Avoid

- **Storing derived data in Zustand:** Don't store `totalFacturé` in state. Calculate in useMemo from deliverables + year filter. Storing creates sync issues.
- **Filtering in render without memoization:** Don't filter deliverables array in JSX directly. For large datasets, wrap filter/reduce in useMemo.
- **useMemo on everything:** Don't memoize simple operations like `deliverables.length`. Overhead exceeds benefit. Profile first.
- **Creating new Date() in render loops:** Extract year filter boundaries once, reuse in filter predicates.
- **Over-abstracting chart library:** Don't add Recharts for 12 bars. Custom SVG/div is sufficient and already working.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Currency formatting | Custom €/$ symbol logic, locale handling | `Intl.NumberFormat` (already used) | Handles decimal separators, grouping, RTL, negatives. Edge cases are complex. |
| Date parsing/comparison | Manual string splitting, regex | `Date` constructor + getFullYear/getMonth | Built-in handles ISO strings, timezones, leap years. |
| State management | Custom context + reducers | Zustand (already in use) | Selectors, persistence, devtools built-in. |
| Form validation | Manual error state + if/else | Zod + react-hook-form (already in use) | Type-safe, reusable schemas, consistent errors. |

**Key insight:** Financial calculations are deceptively simple until edge cases (null values, missing dates, timezone shifts, floating point precision). Use proven libraries for parsing/formatting, focus custom logic on business rules (what counts as "completed", fiscal year boundaries).

## Common Pitfalls

### Pitfall 1: Filtering Expensive Arrays Without Memoization

**What goes wrong:** Filtering all deliverables on every render causes lag, especially with 100+ items. Example: filtering by year + client + grouping by month runs 3 iterations per render.

**Why it happens:** React re-renders components frequently (parent state changes, props updates). Without useMemo, filter/reduce/map chains re-execute even when inputs haven't changed.

**How to avoid:**
- Wrap expensive computations in useMemo with specific dependencies
- Profile with React DevTools: look for yellow/red render times in Profiler
- For arrays > 50 items with multiple transforms, consider single-pass reduce instead of chained filter+map

**Warning signs:**
- Typing in unrelated input feels sluggish
- Compta view takes >100ms to render on year change
- CPU usage spikes when switching to Compta tab

**Example:**
```typescript
// BAD: Runs 3 iterations on every render
return (
  <div>
    {deliverables
      .filter(d => new Date(d.dueDate).getFullYear() === year)
      .filter(d => d.status === 'completed')
      .reduce((acc, d) => {
        // group by client...
      }, {})}
  </div>
);

// GOOD: Runs once per year/deliverables change
const groupedByClient = useMemo(() => {
  return deliverables
    .filter(d => {
      if (!d.dueDate) return false;
      return new Date(d.dueDate).getFullYear() === year && d.status === 'completed';
    })
    .reduce((acc, d) => {
      // group by client...
      return acc;
    }, {});
}, [year, deliverables]);
```

### Pitfall 2: Year Filter Logic Ignoring Null/Undefined Dates

**What goes wrong:** Deliverables without `dueDate` (backlog items) cause crashes or appear in wrong year. Trying to call `.getFullYear()` on undefined throws error.

**Why it happens:** User can create deliverables without scheduling them yet. Filter logic assumes all deliverables have dates.

**How to avoid:**
- Always null-check date fields before comparing: `if (!d.dueDate) return false;`
- Explicitly decide: do backlog items count toward "potentiel" or are they excluded?
- Document assumption in filter logic comments

**Warning signs:**
- TypeError: Cannot read property 'getFullYear' of undefined
- Totals don't match sum of visible rows (some items silently excluded)
- Clicking "add deliverable without date" breaks view

**Example:**
```typescript
// BAD: Crashes on backlog items
const yearDeliverables = deliverables.filter(d =>
  new Date(d.dueDate).getFullYear() === year
);

// GOOD: Explicit null handling
const yearDeliverables = deliverables.filter(d => {
  if (!d.dueDate) return false; // Backlog excluded
  return new Date(d.dueDate).getFullYear() === year;
});
```

### Pitfall 3: Floating Point Precision in Financial Calculations

**What goes wrong:** Summing prices like `3.50 + 4.50` can yield `8.000000000001` due to floating point representation. Currency display shows "8,00 €" but comparisons fail, totals don't match.

**Why it happens:** JavaScript uses IEEE 754 double precision. Decimal values like 0.1 don't have exact binary representation.

**How to avoid:**
- Store monetary values as integers (cents) if building invoice system
- For simple totals (this phase), rely on `Intl.NumberFormat` rounding for display
- If comparing totals, use: `Math.abs(a - b) < 0.01` instead of `a === b`
- Don't implement custom rounding logic (half-up vs banker's rounding has tax implications)

**Warning signs:**
- Total shows "7,99 €" when summing "4,00 € + 4,00 €"
- Tests fail on exact equality of financial totals
- Sorting by amount puts 8.00 before 7.99

**Example:**
```typescript
// AWARE: Direct summation for display purposes
const total = deliverables.reduce((sum, d) => sum + (d.prixFacturé ?? 0), 0);
// Display with Intl handles rounding: formatEur(total) -> "8 000 €"

// For comparisons, use tolerance:
if (Math.abs(calculatedTotal - expectedTotal) < 0.01) {
  // Match within 1 cent
}
```

### Pitfall 4: Memory Leaks from Unclosed Modal States

**What goes wrong:** Opening deliverable modal from expanded client row, then deleting deliverable, leaves modal open but reference stale. Causes errors or shows deleted data.

**Why it happens:** Modal state (`activeModal`) isn't synchronized with data store. Deliverable deleted from store, but modal still holds deleted item reference.

**How to avoid:**
- Close modal when item deleted: `deleteDeliverable` action should call `closeModal()`
- Or: Check if item still exists before rendering modal content
- Use effect to close modal when selected item disappears from store

**Warning signs:**
- Modal shows "undefined" or blank fields after deletion
- Clicking deleted item in list opens empty modal
- Console errors: "Cannot read property 'name' of undefined"

**Example:**
```typescript
// In store.ts deleteDeliverable action:
deleteDeliverable: async (id) => {
  const supabase = createClient();
  const { error } = await supabase.from('deliverables').delete().eq('id', id);
  if (error) throw error;
  set((state) => ({
    deliverables: state.deliverables.filter((d) => d.id !== id),
    activeModal: state.activeModal?.type === 'deliverable' &&
                 state.activeModal?.deliverable?.id === id
                 ? null
                 : state.activeModal, // Close modal if viewing deleted item
  }));
},
```

### Pitfall 5: Hardcoded Locale in Currency/Date Formatting

**What goes wrong:** Code hardcodes `'fr-FR'` for formatting. If agency adds international clients or team members, amounts show in wrong format (dots vs commas, € position).

**Why it happens:** Current user is French, so hardcoding seems fine. But locale should be configurable for internationalization.

**How to avoid:**
- Extract locale to app config or user settings
- Use `navigator.language` as fallback, but allow override
- Don't need full i18n system yet, but isolate hardcoded locales in one place

**Warning signs:**
- Non-French users complain about date/currency format
- Feature request: "Can we change date format to DD/MM/YYYY?"
- Tests fail in CI/CD with different locale

**Example:**
```typescript
// CURRENT: Works but hardcoded
const formatEur = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);

// BETTER: Centralized locale config
// In lib/config.ts
export const APP_LOCALE = 'fr-FR';
export const APP_CURRENCY = 'EUR';

// In lib/formatters.ts
export const formatCurrency = (n: number) =>
  new Intl.NumberFormat(APP_LOCALE, {
    style: 'currency',
    currency: APP_CURRENCY,
    maximumFractionDigits: 0
  }).format(n);
```

## Code Examples

Verified patterns from official sources and existing codebase:

### Currency Formatting (Already Implemented)
```typescript
// Source: ComptaView.tsx line 9-10
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat

const formatEur = (n: number) =>
  new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0
  }).format(n);

// Usage:
formatEur(8000); // "8 000 €"
formatEur(8000.75); // "8 001 €" (rounds up)
```

### Data Aggregation with useMemo
```typescript
// Source: React docs + existing pattern in ComptaView.tsx lines 59-92
// https://react.dev/reference/react/useMemo

const byClient = useMemo(() => {
  const map = new Map<string, ClientCompta>();

  for (const d of deliverables) {
    if (!d.clientId || !d.dueDate) continue;

    // Year filter
    if (new Date(d.dueDate).getFullYear() !== comptaYear) continue;

    const existing = map.get(d.clientId);
    const client = getClientById(d.clientId);
    const prix = d.prixFacturé ?? 0;
    const sousTraitance = d.coutSousTraitance ?? 0;

    if (existing) {
      existing.totalFacturé += prix;
      existing.totalSousTraitance += sousTraitance;
      existing.marge = existing.totalFacturé - existing.totalSousTraitance;
      existing.deliverables.push(d);
    } else {
      map.set(d.clientId, {
        clientId: d.clientId,
        clientName: client?.name ?? 'Sans nom',
        totalFacturé: prix,
        totalSousTraitance: sousTraitance,
        marge: prix - sousTraitance,
        deliverables: [d],
      });
    }
  }

  return Array.from(map.values()).sort((a, b) => b.totalFacturé - a.totalFacturé);
}, [comptaYear, deliverables, getClientById]);
```

### Fiscal Year Helper Functions
```typescript
// NEW additions to date-utils.ts
// Source: Date API + fiscal year best practices

/**
 * Get start date of fiscal year (January 1st)
 */
export function getFiscalYearStart(year: number): Date {
  const date = new Date(year, 0, 1); // January 1st
  date.setHours(0, 0, 0, 0);
  return date;
}

/**
 * Get end date of fiscal year (December 31st)
 */
export function getFiscalYearEnd(year: number): Date {
  const date = new Date(year, 11, 31); // December 31st
  date.setHours(23, 59, 59, 999);
  return date;
}

/**
 * Check if date falls within fiscal year
 */
export function isInFiscalYear(date: Date, year: number): boolean {
  const dateYear = date.getFullYear();
  return dateYear === year;
}

/**
 * Get all months in fiscal year (for histogram)
 */
export function getFiscalYearMonths(year: number, locale = 'fr-FR'): string[] {
  return Array.from({ length: 12 }, (_, i) =>
    new Date(year, i).toLocaleDateString(locale, { month: 'short' })
  );
}
```

### Year Selector Component
```typescript
// NEW component: YearSelector.tsx
// Source: Existing filter patterns in TimelineFilters.tsx

'use client';

import { useAppStore } from '@/lib/store';

const ChevronLeft = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M15 18l-6-6 6-6" />
  </svg>
);

const ChevronRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 18l6-6-6-6" />
  </svg>
);

export function YearSelector() {
  const { comptaYear, setComptaYear } = useAppStore();
  const currentYear = new Date().getFullYear();

  return (
    <div className="flex items-center gap-3 bg-[var(--bg-secondary)] rounded-lg p-2">
      <button
        onClick={() => setComptaYear(comptaYear - 1)}
        disabled={comptaYear <= 2020} // Arbitrary min year
        className="p-1.5 hover:bg-[var(--bg-tertiary)] rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        aria-label="Année précédente"
      >
        <ChevronLeft />
      </button>

      <span className="text-xl font-bold text-[var(--text-primary)] min-w-[4rem] text-center">
        {comptaYear}
      </span>

      <button
        onClick={() => setComptaYear(comptaYear + 1)}
        disabled={comptaYear >= currentYear + 2} // Allow 2 years future planning
        className="p-1.5 hover:bg-[var(--bg-tertiary)] rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        aria-label="Année suivante"
      >
        <ChevronRight />
      </button>
    </div>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Redux for all state | Zustand for client state, React Query for server state | 2023-2024 | Less boilerplate, better performance. Zustand already adopted. |
| Chart.js with Canvas | Recharts with SVG or custom CSS | 2024-2025 | Better React integration. For simple charts (12 bars), custom CSS preferred (zero deps). |
| Manual currency formatting | Intl.NumberFormat API | Native API mature since 2015 | No libraries needed, handles all locales. |
| Class components + lifecycle | Function components + hooks | React 16.8+ (2019) | Simpler patterns, better composition. Project already using hooks. |
| Prop drilling filters | Zustand global state | 2023+ | Avoids intermediate components. Already adopted in this codebase. |

**Deprecated/outdated:**
- `componentDidMount` for data fetching: Use `useEffect` + `useAppStore.loadData()` (already in use)
- Redux Toolkit for simple client state: Overkill for this app size. Zustand sufficient.
- External date libraries (moment, date-fns): For simple year/month extraction, native `Date` API enough. Only add if complex operations needed.

## Open Questions

### 1. Should backlog deliverables (no dueDate) count toward "Potentiel"?

**What we know:** User wants "CA potentiel" from `pending` and `in-progress` deliverables. CONTEXT.md doesn't mention backlog explicitly.

**What's unclear:** If deliverable has status `pending` but no `dueDate` set, is it "potentiel" or ignored? Should potentiel KPI include only scheduled work, or all unfinished work?

**Recommendation:** Exclude backlog from year-filtered totals (no date = can't attribute to year), but include in separate "Backlog Potentiel" section if user wants full pipeline visibility. Clarify with user during planning.

### 2. How far back should year selector go? How far forward?

**What we know:** User wants to navigate previous years for fiscal records. Current year default.

**What's unclear:** Minimum year (2020? Company founding year? No limit?). Maximum year (current + 1? Current + 5 for long-term projects?).

**Recommendation:** Minimum = 2020 (arbitrary safe start), Maximum = current year + 2 (allows next fiscal year planning without encouraging far-future data that may never materialize). Make configurable constant.

### 3. Should monthly histogram show only completed deliverables or include forecast?

**What we know:** Histogram shows "entrées" (green) and "sorties" (red). Current mock uses `comptaMonthly` table.

**What's unclear:** Should bars show only completed deliverables (historical fact) or include pending/in-progress deliverables scheduled for that month (forecast)?

**Recommendation:** Show only completed (status='completed') for historical accuracy. If user wants forecast view, add toggle or separate "Prévisionnel" histogram. Default to factual completed data.

### 4. How to handle deliverables with clientId=null?

**What we know:** Deliverable type allows optional `clientId` (backlog items without client assignment yet).

**What's unclear:** Do these count toward totals? Show in separate "Sans client" row? Exclude entirely?

**Recommendation:** Exclude from client-grouped tables (can't attribute revenue to client). If amounts significant, show separate "Non attribué" summary row. Or only count deliverables with clientId (cleaner).

## Sources

### Primary (HIGH confidence)

**Official Documentation:**
- [React.dev - useMemo](https://react.dev/reference/react/useMemo) - Performance optimization guide
- [MDN - Intl.NumberFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat) - Currency formatting API
- [Zustand Documentation](https://zustand.docs.pmnd.rs/) - State management patterns
- [Next.js Documentation](https://nextjs.org/docs) - App Router patterns

**Codebase Analysis:**
- `src/lib/store.ts` - Existing Zustand patterns, filter state management
- `src/features/compta/components/ComptaView.tsx` - Current implementation baseline
- `src/features/timeline/components/TimelineFilters.tsx` - Filter UI patterns
- `src/types/index.ts` - Data model (Deliverable, Client types)
- `package.json` - Dependencies and versions

### Secondary (MEDIUM confidence)

**Technical Articles:**
- [Syncfusion: Top 5 React Chart Libraries 2026](https://www.syncfusion.com/blogs/post/top-5-react-chart-libraries) - Recharts evaluation
- [Material Tailwind: KPI Cards](https://www.material-tailwind.com/blocks/kpi-cards) - Dashboard design patterns
- [Dev.to: Currency Formatting in React with Intl API](https://dev.giuseppeciullo.it/simplify-currency-formatting-in-react-a-zero-dependency-solution-with-intl-api) - Best practices
- [TanStack Table: Expanding Guide](https://tanstack.com/table/v8/docs/guide/expanding) - Expandable rows patterns
- [GitHub: react-day-picker #2425](https://github.com/gpbl/react-day-picker/discussions/2425) - Year navigation UX discussion

**Performance & Best Practices:**
- [DebugBear: React useMemo and useCallback](https://www.debugbear.com/blog/react-usememo-usecallback) - When to optimize
- [Syncfusion: Render Large Datasets in React](https://www.syncfusion.com/blogs/post/render-large-datasets-in-react) - Array filtering performance
- [Building High-Performance Financial Dashboards with React](https://olivertriunfo.com/react-financial-dashboards/) - Common pitfalls

### Tertiary (LOW confidence - marked for validation)

**Community Insights:**
- [Medium: Building React Financial Dashboard](https://medium.com/@sundargautam2022/building-a-tick-like-filter-dropdown-in-react-with-date-fiscal-year-selection-5c99f46f7b7d) - Fiscal year patterns
- [GeeksforGeeks: Recharts Bar Chart Tutorial](https://www.geeksforgeeks.org/reactjs/create-a-bar-chart-using-recharts-in-reactjs/) - If considering Recharts later

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All dependencies already in package.json, versions verified
- Architecture: HIGH - Patterns extracted from existing working code (ComptaView, TimelineFilters, store.ts)
- Pitfalls: MEDIUM-HIGH - Based on React best practices articles + predictable issues (null dates, memoization). Some validation needed in practice.
- Code examples: HIGH - Adapted from existing codebase patterns + official docs
- Chart library recommendation: MEDIUM - Existing custom approach works, but Recharts evaluation based on web search (not tested in this codebase)

**Research date:** 2026-02-15

**Valid until:** 30 days (2026-03-17) - Stable dependencies (React 19, Zustand 5), slow-moving ecosystem for established patterns. Re-validate if major version bumps or new requirements.

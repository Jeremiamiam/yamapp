# Architecture Research

**Domain:** Client Management with Timeline Visualization
**Researched:** 2026-02-13
**Confidence:** MEDIUM

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        PRESENTATION LAYER                            │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │   Timeline    │  │ Client Cards │  │    Forms     │              │
│  │   Component   │  │  (Details)   │  │ (Add/Edit)   │              │
│  └───────┬───────┘  └───────┬──────┘  └───────┬──────┘              │
│          │                  │                  │                     │
├──────────┴──────────────────┴──────────────────┴─────────────────────┤
│                        STATE MANAGEMENT                               │
├─────────────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │              Global State (Clients, Deliverables)              │ │
│  │              + Virtual Scrolling State                         │ │
│  └────────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────┤
│                        DATA LAYER                                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                 │
│  │   Clients   │  │ Deliverables│  │   Users     │                 │
│  │    Store    │  │    Store    │  │   Store     │                 │
│  └─────────────┘  └─────────────┘  └─────────────┘                 │
└─────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| Timeline Canvas | Horizontal scrollable viewport showing multiple clients and their deliverables over time | React component with virtual scrolling, manages viewport state, delegates rendering to row components |
| Timeline Row | Represents one client's timeline track, shows deliverables as positioned items | Presentational component receiving client data and deliverables, uses absolute positioning for items |
| Client Card | Displays detailed client information in sidebar or modal | Controlled component with form state for edit mode, presentational for view mode |
| Timeline Item | Individual deliverable/event positioned on timeline | Pure component with date-to-position calculation, click handlers for interactions |
| Form Components | Input forms for adding/editing clients and deliverables | Controlled components with validation, submit handlers |
| Virtual Scroller | Manages rendering only visible timeline rows | Container component calculating visible range, maintains buffer for smooth scrolling |

## Recommended Project Structure

```
src/
├── features/              # Feature-based organization (recommended 2026 pattern)
│   ├── timeline/          # Timeline visualization feature
│   │   ├── components/    # Timeline-specific components
│   │   │   ├── TimelineCanvas.tsx
│   │   │   ├── TimelineRow.tsx
│   │   │   ├── TimelineItem.tsx
│   │   │   ├── TimelineAxis.tsx
│   │   │   └── VirtualScroller.tsx
│   │   ├── hooks/         # Timeline-specific hooks
│   │   │   ├── useVirtualScroll.ts
│   │   │   ├── useTimelineLayout.ts
│   │   │   └── useDateToPosition.ts
│   │   ├── utils/         # Timeline calculations
│   │   │   ├── dateUtils.ts
│   │   │   └── positionCalculator.ts
│   │   └── index.ts       # Public API
│   ├── clients/           # Client management feature
│   │   ├── components/    # Client-specific components
│   │   │   ├── ClientCard.tsx
│   │   │   ├── ClientList.tsx
│   │   │   └── ClientForm.tsx
│   │   ├── hooks/         # Client data hooks
│   │   │   └── useClient.ts
│   │   └── index.ts
│   ├── deliverables/      # Deliverables feature
│   │   ├── components/
│   │   │   ├── DeliverableForm.tsx
│   │   │   └── DeliverableDetails.tsx
│   │   ├── hooks/
│   │   │   └── useDeliverables.ts
│   │   └── index.ts
│   └── collaboration/     # Real-time collaboration (future)
│       ├── hooks/
│       │   └── useRealtimeSync.ts
│       └── index.ts
├── components/            # Shared/common components
│   ├── ui/                # Basic UI primitives (buttons, inputs)
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   └── Card.tsx
│   └── layout/            # Layout components
│       ├── Header.tsx
│       └── Sidebar.tsx
├── store/                 # Global state management
│   ├── clientsStore.ts    # Clients state slice
│   ├── deliverablesStore.ts
│   └── index.ts           # Combined store
├── services/              # API/data layer (future)
│   ├── mockData.ts        # Mock data service (v1)
│   └── api.ts             # API service (future)
├── hooks/                 # Shared hooks
│   └── useDebounce.ts
├── utils/                 # Shared utilities
│   ├── date.ts
│   └── validation.ts
├── types/                 # TypeScript types
│   ├── client.ts
│   ├── deliverable.ts
│   └── timeline.ts
└── App.tsx                # Root application
```

### Structure Rationale

- **features/**: Feature-based structure is the 2026 standard for scalable React applications, making it clear what functionality belongs together and enabling parallel team development
- **components/ separation**: Timeline logic isolated in its own feature prevents coupling between visualization and data management
- **hooks/**: Co-locating hooks with features keeps related logic together, while shared hooks prevent duplication
- **store/**: Centralized state management with separate slices per domain enables independent evolution
- **services/**: Mock data in v1, abstracted behind service interface for easy future transition to API

## Architectural Patterns

### Pattern 1: Container/Presentational Separation

**What:** Split components into "smart" containers handling state/logic and "dumb" presentational components handling UI only

**When to use:** For all complex components, especially timeline and client cards

**Trade-offs:**
- Pros: Clear separation of concerns, easier testing, reusable presentational components
- Cons: More files/boilerplate, overkill for simple components

**Example:**
```typescript
// Container - handles data and logic
export function TimelineContainer() {
  const clients = useClientsStore(state => state.clients);
  const deliverables = useDeliverablesStore(state => state.deliverables);
  const { visibleRange, handleScroll } = useVirtualScroll();

  return (
    <TimelinePresentation
      clients={clients}
      deliverables={deliverables}
      visibleRange={visibleRange}
      onScroll={handleScroll}
    />
  );
}

// Presentational - pure UI rendering
export function TimelinePresentation({ clients, deliverables, visibleRange, onScroll }) {
  return (
    <div className="timeline-canvas" onScroll={onScroll}>
      {clients.slice(visibleRange.start, visibleRange.end).map(client => (
        <TimelineRow key={client.id} client={client} deliverables={deliverables} />
      ))}
    </div>
  );
}
```

### Pattern 2: Virtual Scrolling for Timeline Performance

**What:** Render only visible timeline rows plus buffer, using padding to simulate non-rendered content

**When to use:** When displaying 10+ clients (YAM Dashboard's expected range), critical for responsive performance

**Trade-offs:**
- Pros: 40-60% faster initial load, 70-85% better scroll performance for 1000+ items
- Cons: Requires fixed-height rows, adds complexity, unnecessary for <10 items

**Example:**
```typescript
// Virtual scrolling hook
export function useVirtualScroll(
  itemCount: number,
  itemHeight: number,
  viewportHeight: number,
  tolerance: number = 2
) {
  const [scrollTop, setScrollTop] = useState(0);

  // Calculate which items are visible
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - tolerance);
  const endIndex = Math.min(
    itemCount,
    Math.ceil((scrollTop + viewportHeight) / itemHeight) + tolerance
  );

  const topPadding = startIndex * itemHeight;
  const bottomPadding = (itemCount - endIndex) * itemHeight;

  return {
    visibleRange: { start: startIndex, end: endIndex },
    topPadding,
    bottomPadding,
    handleScroll: (e) => setScrollTop(e.target.scrollTop)
  };
}

// Usage in Timeline component
function Timeline() {
  const clients = useClientsStore(state => state.clients);
  const { visibleRange, topPadding, bottomPadding, handleScroll } = useVirtualScroll(
    clients.length,
    ROW_HEIGHT,
    VIEWPORT_HEIGHT
  );

  return (
    <div className="timeline-viewport" onScroll={handleScroll}>
      <div style={{ height: topPadding }} />
      {clients.slice(visibleRange.start, visibleRange.end).map(client => (
        <TimelineRow key={client.id} client={client} />
      ))}
      <div style={{ height: bottomPadding }} />
    </div>
  );
}
```

### Pattern 3: Date-to-Position Calculator

**What:** Centralized utility for converting dates to pixel positions on timeline, with configurable scale

**When to use:** For all timeline item positioning, ensures consistency across components

**Trade-offs:**
- Pros: Single source of truth, easy to change time scales, consistent positioning
- Cons: Recalculation needed on zoom/scale changes

**Example:**
```typescript
// Position calculator utility
export class TimelineCalculator {
  constructor(
    private startDate: Date,
    private pixelsPerDay: number,
    private viewportStart: number
  ) {}

  dateToPosition(date: Date): number {
    const daysSinceStart = differenceInDays(date, this.startDate);
    return (daysSinceStart * this.pixelsPerDay) - this.viewportStart;
  }

  positionToDate(position: number): Date {
    const adjustedPosition = position + this.viewportStart;
    const days = Math.floor(adjustedPosition / this.pixelsPerDay);
    return addDays(this.startDate, days);
  }
}

// Usage in hook
export function useDateToPosition() {
  const { startDate, pixelsPerDay, viewportStart } = useTimelineConfig();

  return useMemo(
    () => new TimelineCalculator(startDate, pixelsPerDay, viewportStart),
    [startDate, pixelsPerDay, viewportStart]
  );
}
```

### Pattern 4: Lightweight State Management with Zustand

**What:** Use Zustand for global state instead of Redux or Context, minimal boilerplate and better performance

**When to use:** For clients, deliverables, and UI state in YAM Dashboard - the sweet spot for Zustand

**Trade-offs:**
- Pros: Minimal boilerplate, no providers, excellent TypeScript support, smaller bundle than Redux
- Cons: Less middleware ecosystem than Redux, not as feature-rich for complex async flows

**Example:**
```typescript
// Clients store with Zustand
import create from 'zustand';

interface ClientsStore {
  clients: Client[];
  addClient: (client: Client) => void;
  updateClient: (id: string, updates: Partial<Client>) => void;
  deleteClient: (id: string) => void;
}

export const useClientsStore = create<ClientsStore>((set) => ({
  clients: mockClients,

  addClient: (client) => set((state) => ({
    clients: [...state.clients, client]
  })),

  updateClient: (id, updates) => set((state) => ({
    clients: state.clients.map(c =>
      c.id === id ? { ...c, ...updates } : c
    )
  })),

  deleteClient: (id) => set((state) => ({
    clients: state.clients.filter(c => c.id !== id)
  }))
}));

// Usage in component (no providers needed)
function ClientCard({ clientId }) {
  const client = useClientsStore(state =>
    state.clients.find(c => c.id === clientId)
  );
  const updateClient = useClientsStore(state => state.updateClient);

  return <div>{client.name}</div>;
}
```

### Pattern 5: Compound Components for Timeline Flexibility

**What:** Break timeline into composable sub-components that share internal state but expose flexible API

**When to use:** For timeline features that need different layouts or configurations

**Trade-offs:**
- Pros: Highly flexible, consumers control layout, components stay cohesive
- Cons: More complex API, requires understanding of compound pattern

**Example:**
```typescript
// Compound Timeline components
const TimelineContext = createContext<TimelineState>();

export function Timeline({ children, startDate, endDate }) {
  const calculator = useDateToPosition(startDate, endDate);
  const [selectedItem, setSelectedItem] = useState(null);

  return (
    <TimelineContext.Provider value={{ calculator, selectedItem, setSelectedItem }}>
      <div className="timeline">{children}</div>
    </TimelineContext.Provider>
  );
}

Timeline.Header = function TimelineHeader() {
  const { calculator } = useContext(TimelineContext);
  return <div className="timeline-header">{/* Date markers */}</div>;
}

Timeline.Body = function TimelineBody({ children }) {
  return <div className="timeline-body">{children}</div>;
}

Timeline.Row = function TimelineRow({ client }) {
  const { calculator, setSelectedItem } = useContext(TimelineContext);
  return (
    <div className="timeline-row">
      {client.deliverables.map(d => (
        <TimelineItem key={d.id} deliverable={d} onClick={setSelectedItem} />
      ))}
    </div>
  );
}

// Flexible usage
<Timeline startDate={startDate} endDate={endDate}>
  <Timeline.Header />
  <Timeline.Body>
    {clients.map(client => (
      <Timeline.Row key={client.id} client={client} />
    ))}
  </Timeline.Body>
</Timeline>
```

## Data Flow

### Request Flow (Mock Data Phase)

```
[User Action: Add Client]
    ↓
[ClientForm] → validates input
    ↓
[useClientsStore.addClient()] → updates store
    ↓
[All subscribed components] ← re-render with new data
    ↓
[Timeline] ← shows new client row
[ClientList] ← shows new client card
```

### Request Flow (Future API Phase)

```
[User Action: Add Client]
    ↓
[ClientForm] → validates input
    ↓
[useClientsStore.addClient()] → optimistic update + API call
    ↓
[API Service] → POST /api/clients
    ↓ (success)
[Store] → confirm optimistic update
    ↓ (error)
[Store] → rollback optimistic update + show error
```

### State Management Flow

```
[Zustand Stores]
    ↓ (selective subscription)
[Components] ←→ [Actions] → [Store Updates] → [Zustand Stores]
    ↑
[Immutable Updates - No Reducers Needed]
```

### Timeline Rendering Flow

```
[Scroll Event]
    ↓
[useVirtualScroll] → calculates visible range
    ↓
[Timeline Component] → renders visible rows only
    ↓
[TimelineRow Components] → calculate item positions
    ↓
[useDateToPosition] → converts dates to pixels
    ↓
[TimelineItem Components] → render at absolute positions
```

### Key Data Flows

1. **Client/Deliverable Updates:** User action → form validation → Zustand action → store update → component re-render (via selective subscription)
2. **Timeline Scroll:** Scroll event → virtual scroll calculation → visible range update → partial re-render of visible rows only
3. **Date Positioning:** Date change → position calculator → layout update → all timeline items reposition
4. **Collaboration Sync (Future):** WebSocket event → store update → optimistic UI update → conflict resolution if needed

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 10-20 clients (MVP) | Simple Zustand stores, basic virtual scrolling, mock data, client-side only. No API needed yet. Monolithic feature structure is fine. |
| 50-100 clients | Virtual scrolling becomes critical, implement request debouncing for forms, consider lazy-loading client details, add pagination to client list. Still client-side, but may want IndexedDB for offline. |
| 100-500 clients | Must add backend API with pagination, implement search/filter on server side, add caching layer (TanStack Query), database with proper indexes. Consider separating timeline into separate route to avoid loading all data upfront. |
| 500+ clients / 10+ concurrent users | Real-time collaboration architecture needed (WebSocket/Liveblocks), backend state synchronization, conflict resolution, implement CQRS pattern (separate read/write models), add server-side rendering for initial load, consider splitting into microservices if different features have different scaling needs. |

### Scaling Priorities

1. **First bottleneck (20-50 clients):** Timeline rendering performance degrades without virtual scrolling. Solution: Implement virtual scrolling pattern immediately in MVP, even if not strictly needed yet.

2. **Second bottleneck (100+ clients):** Client-side data storage becomes unwieldy, initial load time suffers. Solution: Add backend API with pagination, lazy-load client details, implement TanStack Query for caching and background refetching.

3. **Third bottleneck (Multiple concurrent users):** State conflicts when multiple users edit same data. Solution: Add real-time collaboration layer (WebSocket with operational transforms or CRDT), implement optimistic updates with rollback, add presence indicators.

4. **Fourth bottleneck (Complex queries):** Filtering/searching across large datasets becomes slow. Solution: Move filtering to backend with proper database indexes, implement full-text search, add ElasticSearch if needed.

## Anti-Patterns

### Anti-Pattern 1: Prop Drilling Timeline Config Through All Components

**What people do:** Pass timeline configuration (startDate, endDate, pixelsPerDay) as props through every component layer

**Why it's wrong:** Creates tight coupling, makes components hard to reuse, adds boilerplate to every component

**Do this instead:** Use Context for timeline configuration (read-only shared state) or a custom hook that accesses a timeline config store

```typescript
// BAD: Prop drilling
<Timeline startDate={start} endDate={end}>
  <TimelineBody startDate={start} endDate={end}>
    <TimelineRow startDate={start} endDate={end}>
      <TimelineItem startDate={start} endDate={end} />
    </TimelineRow>
  </TimelineBody>
</Timeline>

// GOOD: Context or hook
const TimelineConfigContext = createContext();

function Timeline({ startDate, endDate, children }) {
  return (
    <TimelineConfigContext.Provider value={{ startDate, endDate }}>
      {children}
    </TimelineConfigContext.Provider>
  );
}

function TimelineItem() {
  const { startDate, endDate } = useTimelineConfig(); // accesses context
  // ...
}
```

### Anti-Pattern 2: Calculating Date Positions in Every Component

**What people do:** Each timeline item component independently calculates its position from date, duplicating logic

**Why it's wrong:** Inconsistent positioning if logic differs, performance overhead of repeated calculations, hard to change scale uniformly

**Do this instead:** Centralize date-to-position calculation in a shared hook or utility, memoize results

```typescript
// BAD: Calculation in component
function TimelineItem({ date }) {
  const position = (date - timelineStart) / (1000 * 60 * 60 * 24) * pixelsPerDay;
  return <div style={{ left: position }}>...</div>;
}

// GOOD: Centralized calculator
function TimelineItem({ date }) {
  const calculator = useDateToPosition();
  const position = calculator.dateToPosition(date);
  return <div style={{ left: position }}>...</div>;
}
```

### Anti-Pattern 3: Rendering All Timeline Rows Without Virtualization

**What people do:** Render all clients in DOM even if not visible, relying on CSS overflow scrolling

**Why it's wrong:** With 20+ clients, initial render becomes sluggish (1000+ DOM nodes), scroll performance degrades, memory usage increases unnecessarily

**Do this instead:** Implement virtual scrolling from the start even if current dataset is small - prevents needing to refactor later

```typescript
// BAD: Render everything
function Timeline({ clients }) {
  return (
    <div className="timeline-scroll">
      {clients.map(client => <TimelineRow key={client.id} client={client} />)}
    </div>
  );
}

// GOOD: Virtual scrolling
function Timeline({ clients }) {
  const { visibleRange, topPadding, bottomPadding, handleScroll } = useVirtualScroll(
    clients.length, ROW_HEIGHT, VIEWPORT_HEIGHT
  );

  return (
    <div className="timeline-scroll" onScroll={handleScroll}>
      <div style={{ height: topPadding }} />
      {clients.slice(visibleRange.start, visibleRange.end).map(client => (
        <TimelineRow key={client.id} client={client} />
      ))}
      <div style={{ height: bottomPadding }} />
    </div>
  );
}
```

### Anti-Pattern 4: Mixing Timeline Layout Logic with Data Management

**What people do:** Put timeline rendering calculations inside the same components that manage client/deliverable state

**Why it's wrong:** Violates single responsibility, makes components hard to test, prevents reusing timeline visualization for other data

**Do this instead:** Separate timeline visualization (features/timeline/) from data management (features/clients/, features/deliverables/)

```typescript
// BAD: Mixed concerns
function ClientTimeline() {
  const [clients, setClients] = useState([]);
  const [position, setPosition] = useState(0);

  const addClient = (client) => {
    setClients([...clients, client]);
  };

  const calculatePosition = (date) => {
    // timeline logic mixed with data management
  };

  return <div>...</div>;
}

// GOOD: Separated concerns
// In features/clients/
export const useClientsStore = create((set) => ({
  clients: [],
  addClient: (client) => set((state) => ({ clients: [...state.clients, client] }))
}));

// In features/timeline/
export function Timeline({ data }) {
  const { calculatePosition } = useDateToPosition();
  return <div>...</div>;
}

// In app
function ClientTimelineView() {
  const clients = useClientsStore(state => state.clients);
  return <Timeline data={clients} />;
}
```

### Anti-Pattern 5: Using Redux for Simple Mock Data State

**What people do:** Set up Redux with actions, reducers, middleware for managing mock data arrays

**Why it's wrong:** Massive boilerplate for simple use case, slower development velocity, harder onboarding, no actual benefit until adding API integration

**Do this instead:** Use Zustand for lightweight state management, add Redux/TanStack Query only when adding real backend integration

```typescript
// BAD: Redux overkill for mock data
// actions.ts
export const ADD_CLIENT = 'ADD_CLIENT';
export const addClient = (client) => ({ type: ADD_CLIENT, payload: client });

// reducer.ts
export function clientsReducer(state = initialState, action) {
  switch (action.type) {
    case ADD_CLIENT:
      return { ...state, clients: [...state.clients, action.payload] };
    default:
      return state;
  }
}

// store.ts
const store = createStore(rootReducer, applyMiddleware(thunk));

// component
const dispatch = useDispatch();
dispatch(addClient(newClient));

// GOOD: Zustand simplicity
const useClientsStore = create((set) => ({
  clients: mockClients,
  addClient: (client) => set((state) => ({ clients: [...state.clients, client] }))
}));

// component
const addClient = useClientsStore(state => state.addClient);
addClient(newClient);
```

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Backend API (future) | REST API via fetch/axios, wrapped in service layer, cached with TanStack Query | Abstract behind service interface even in mock phase for easy future swap |
| WebSocket (future collaboration) | Liveblocks or custom WebSocket client, integrate with Zustand stores via middleware | Consider Liveblocks for CRDT/OT out of the box, reduces complexity |
| Authentication (future) | OAuth2/JWT, integrate with API service layer, store tokens in httpOnly cookies | Don't build auth yourself - use Auth0, Clerk, or Supabase Auth |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Timeline ↔ Clients Store | Direct Zustand subscription, Timeline reads clients array | Timeline is pure consumer, never mutates clients |
| Forms ↔ Clients Store | Form calls store actions (addClient, updateClient) | Forms validate before calling store actions |
| Timeline ↔ Timeline Config | Context or shared hook | Config is read-only reference data, doesn't trigger re-renders of non-dependent components |
| Virtual Scroller ↔ Timeline Rows | Parent-child props, scroller passes visible range | Rows don't know about scrolling, receive filtered data |

## Build Order Implications

Based on component dependencies, suggested build order:

1. **Foundation (Phase 1)**
   - Type definitions (Client, Deliverable, TimelineConfig)
   - Mock data service
   - Basic Zustand stores (clients, deliverables)
   - Shared UI components (Button, Input, Card)

2. **Timeline Core (Phase 2)**
   - Date-to-position calculator utility
   - TimelineConfig context/hook
   - Basic Timeline canvas (without virtualization)
   - TimelineRow and TimelineItem presentational components
   - Timeline axis/header with date markers

3. **Client Management (Phase 3)**
   - ClientCard component
   - ClientList component
   - ClientForm component (add/edit)
   - Integration with store actions

4. **Deliverables (Phase 4)**
   - DeliverableForm component
   - Integration with timeline (items positioned on rows)
   - Deliverable detail views

5. **Performance Optimization (Phase 5)**
   - Virtual scrolling implementation
   - Memoization of expensive calculations
   - Debouncing of form inputs

6. **Future Enhancements (Phase 6+)**
   - Backend API integration
   - Real-time collaboration
   - Advanced filtering/search
   - Data export/reporting

**Key Dependencies:**
- Timeline requires date calculator before building positioning
- Virtual scrolling should wait until basic timeline works
- Forms need stores set up first
- Real-time sync needs API layer first

**Parallelization Opportunities:**
- Timeline visualization and client management can be built in parallel after shared foundation
- Forms can be built while timeline visualization is in progress
- Different developers can own timeline vs. client management features

## Sources

### Architecture Patterns (HIGH Confidence)
- [Modern Web Application Architecture in 2026](https://quokkalabs.com/blog/modern-web-application-architecture/) - Modular monolith patterns, layered architecture
- [React Stack Patterns 2026](https://www.patterns.dev/react/react-2026/) - Container/presentational, hooks patterns, state management strategy
- [Modern Application Development Trends 2026](https://tech-stack.com/blog/modern-application-development/) - Component structure, serverless patterns

### Timeline & Performance (MEDIUM Confidence)
- [Virtual Scrolling Core Principles in React](https://blog.logrocket.com/virtual-scrolling-core-principles-and-basic-implementation-in-react/) - Virtual scrolling implementation, performance metrics
- [React Timeline Component - Material UI](https://mui.com/material-ui/react-timeline/) - Timeline component patterns
- [Comparing Best React Timeline Libraries](https://blog.logrocket.com/comparing-best-react-timeline-libraries/) - Library comparison, feature analysis
- [Building Scroll Timeline Animation in React](https://zoer.ai/posts/zoer/react-scroll-timeline-animation-component) - Intersection Observer patterns

### State Management (HIGH Confidence)
- [Top 5 React Gantt Chart Libraries 2026](https://svar.dev/blog/top-react-gantt-charts/) - State management approaches for timeline components
- [DHTMLX Gantt for React](https://dhtmlx.com/docs/products/dhtmlxGantt-for-React/) - Integration with Redux, performance patterns

### Dashboard & Data Flow (MEDIUM Confidence)
- [Dashboard Design Patterns](https://dashboarddesignpatterns.github.io/patterns.html) - Layout composition, component organization
- [Next.js Architecture 2026](https://www.yogijs.tech/blog/nextjs-project-architecture-app-router) - Server-first patterns, client islands
- [Main Project Management Software Trends 2026](https://www.goodday.work/blog/project-management-software-trends/) - Real-time dashboards, AI-enhanced capabilities

### Data Models (MEDIUM Confidence)
- [CRM Database Schema Example](https://www.dragonflydb.io/databases/schema/crm) - CRM data model patterns
- [Calendar Data Model Design](https://medium.com/tomorrowapp/the-complex-world-of-calendars-database-design-fccb3a71a74b) - Calendar event modeling, recurring events

### Collaboration Architecture (MEDIUM Confidence)
- [Building Real-Time Data Sync Architecture](https://www.stacksync.com/blog/building-a-resilient-real-time-data-sync-architecture-implementation-guide-for-technical-leaders) - WebSocket patterns, conflict resolution
- [Liveblocks Collaboration Engine](https://liveblocks.io) - Ready-made CRDT/OT collaboration
- [20 Best Real-Time Collaboration Tools 2026](https://thedigitalprojectmanager.com/tools/real-time-collaboration-tools/) - Collaboration patterns overview

### Project Structure (HIGH Confidence)
- [React Folder Structure in 5 Steps](https://www.robinwieruch.de/react-folder-structure/) - Feature-based organization
- [How to Structure a React App in 2025](https://ramonprata.medium.com/how-to-structure-a-react-app-in-2025-spa-ssr-or-native-10d8de7a245a) - Production-ready structure
- [Guidelines to Improve React App Folder Structure](https://maxrozen.com/guidelines-improve-react-app-folder-structure) - Best practices, absolute imports

---
*Architecture research for: YAM Dashboard - Client Management with Timeline Visualization*
*Researched: 2026-02-13*
*Confidence: MEDIUM - Based on verified 2026 sources, industry patterns, and official documentation. Timeline-specific patterns adapted from Gantt/calendar implementations. Collaboration patterns are future-focused (lower confidence).*

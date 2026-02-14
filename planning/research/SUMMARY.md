# Project Research Summary

**Project:** YAM Dashboard
**Domain:** Client Management Web App with Timeline Visualization for Communication Agencies
**Researched:** 2026-02-13
**Confidence:** HIGH

## Executive Summary

YAM Dashboard is a minimalist client management tool for communication agencies (10-20 clients), designed as a dyslexia-friendly alternative to Notion. The research reveals a clear modern approach: build with **Next.js 16 + React 19 + TypeScript**, using a mock-data-first strategy that validates UX before database complexity. The horizontal timeline as primary interface is the key differentiator - most tools bury timelines in submenus, but making it the default view reduces cognitive load and serves the visual-first design philosophy.

The recommended approach is to start with static mock data and SQLite, implementing virtual scrolling from day one to prevent performance bottlenecks, then progressively enhance with backend features. Critical success factors are: (1) accessibility baked into foundation not retrofitted, (2) ruthless scope discipline to avoid Notion-like feature bloat, and (3) realistic mock data that exposes edge cases early. The biggest risk is timeline performance degradation at scale - testing with 20 clients and 100+ deliverables from the start prevents discovering performance issues too late.

The stack is highly validated (Next.js has 68% developer adoption, Tailwind is industry standard), features are well-researched from agency pain points, and architectural patterns are proven from Gantt/timeline implementations. Confidence is HIGH overall, with MEDIUM confidence on timeline library selection (vis-timeline vs custom) requiring early validation.

## Key Findings

### Recommended Stack

The 2026 standard for client management web apps centers on Next.js 16 (with React 19) as the full-stack framework, providing SSR/SSG, API routes, and Turbopack bundling in one package. For YAM Dashboard's mock-data-first approach with 10-20 clients, this stack enables rapid development with TypeScript safety and straightforward deployment.

**Core technologies:**
- **Next.js 16+** (with App Router): Full-stack React framework — industry standard with 68% adoption, handles SSR and API routes, Turbopack for fast builds
- **TypeScript 5.3+**: Type-safe JavaScript — now considered mandatory for professional projects, catches errors early
- **Tailwind CSS 3.4+**: Utility-first CSS — industry standard for rapid UI, tree-shakable, excellent for minimalist design
- **SQLite + Drizzle ORM**: Embedded database + TypeScript ORM — perfect for 10-20 clients, zero config, easy migration path to PostgreSQL when scaling
- **vis-timeline 7+** (with react-vis-timeline): Timeline component — mature, interactive, highly customizable horizontal timeline (alternative: custom CSS Grid if design is minimal)
- **Zustand 5+**: Client state management — 40% smaller than Redux, minimal boilerplate, perfect for UI state
- **React Hook Form 7.54+ + Zod 3.24+**: Form handling + validation — performance-focused, best TypeScript support
- **date-fns 4+**: Date manipulation — modular, tree-shakable, smallest bundle size

**Stack variants by phase:**
- **Phase 1 (Minimal Mock-First):** Next.js + TypeScript + Tailwind + Mock JSON — no database, focus on UX validation
- **Phase 2 (Database-Backed):** Add SQLite + Drizzle for persistence and CRUD operations
- **Phase 3 (Production-Ready):** Migrate to PostgreSQL, add NextAuth.js for authentication

**Accessibility considerations:** Next.js font optimization (next/font) supports dyslexia-friendly typefaces, Tailwind enables easy large text and high contrast, vis-timeline provides visual representation reducing text dependency.

### Expected Features

The feature research reveals a critical insight: small agencies need simplicity over flexibility. Notion's blank slate becomes overwhelming, while project management tools are task-focused not client-focused. YAM Dashboard's differentiation comes from visual-first design with horizontal timeline as primary interface.

**Must have (table stakes):**
- Client Contact Storage — foundation for all features, single source of truth
- Client/Project List View — standard in all PM tools, card/list view with filtering
- Timeline/Calendar View — industry standard for project schedules, but make it primary view
- Task/Deliverable Tracking — core PM function with status tracking and due dates
- Client Status Distinction — essential for agencies: prospect vs active vs completed
- Basic Search/Filter — with 10-20 clients, need quick information retrieval
- Mobile Access — responsive design for remote work (defer optimization to v1.x)

**Should have (competitive differentiators):**
- **Horizontal Timeline as Primary View** — unique positioning, visual-first reduces cognitive load
- **Ultra-Minimalist UI** — addresses "Notion fatigue": clean fonts, high contrast, icons over text, dyslexia-friendly
- **Client Cards with Text Files** — lightweight note-taking without database complexity
- **Mock Data Mode** — pre-populated demo for immediate UX testing and onboarding
- **Visual Pipeline Stages** — color-coded/icon-based status at a glance, no text-heavy labels
- **Zero Configuration Setup** — opinionated design that works out of box
- **Single-Screen Overview** — all critical info visible without navigation

**Explicitly defer (v2+):**
- Custom Fields/Databases — goes against minimalism, Notion-style flexibility adds complexity
- Advanced Permissions/Roles — overkill for 10-20 clients and small team
- Time Tracking — separate concern, would add scope creep
- Automated Workflows — adds complexity users want to avoid
- Real-time Collaboration — defer until multi-user need validated
- Reporting/Analytics — visual dashboard should make reports unnecessary
- Email Integration — feature bloat, keep focused on timeline/client management

**Feature dependencies:** Client Contact Storage is foundation → enables Client/Project List → enables Timeline View → enables Task/Deliverable Tracking. Timeline View + Client Cards + Visual Pipeline = Single-Screen Overview (the UX goal).

### Architecture Approach

The recommended architecture follows feature-based organization (2026 standard), separating timeline visualization from data management to enable independent evolution. Use container/presentational component separation for complex UI, with Zustand for lightweight global state (clients, deliverables) and TanStack Query added later for server state when API is introduced.

**Major components:**
1. **Timeline Canvas** — horizontal scrollable viewport with virtual scrolling, manages viewport state and delegates rendering to row components
2. **Client Management** — client cards, list views, and forms, integrated with Zustand store for CRUD operations
3. **Deliverable Tracking** — forms and detail views for tasks/deliverables, positioned as timeline items
4. **State Management Layer** — Zustand stores for clients and deliverables, replacing Redux boilerplate with 40% smaller bundle
5. **Virtual Scroller** — performance optimization rendering only visible timeline rows (critical at 10-20 clients with multiple deliverables)
6. **Date-to-Position Calculator** — centralized utility converting dates to pixel positions, ensuring consistency across timeline

**Critical patterns:**
- **Virtual scrolling from day one** — even if current dataset is small, prevents needing to refactor later when performance degrades
- **Date-to-position calculator** — single source of truth for positioning logic, memoized for performance
- **Feature-based structure** — separate features/timeline/, features/clients/, features/deliverables/ with clear boundaries
- **Container/presentational separation** — smart containers handle state/logic, dumb presentational components handle UI only

**Scaling considerations:** 10-20 clients can use client-side Zustand + mock data initially. At 50-100 clients, virtual scrolling becomes critical and consider IndexedDB for offline. At 100-500 clients, must add backend API with pagination and TanStack Query caching. At 500+ clients with concurrent users, need real-time collaboration (WebSocket/Liveblocks) and server-side rendering.

### Critical Pitfalls

1. **Timeline Performance Degradation with Scale** — Timeline rendering becomes unusably slow when displaying 10-20 clients with multiple deliverables. Test with realistic data volumes from day one (20 clients minimum, 100+ deliverables), implement virtualization early (render only visible viewport), benchmark initial render time targeting <2 seconds. Address in Phase 1 - architecture decisions made early are expensive to change.

2. **Mock Data Reality Gap** — Application works with clean mock data, then breaks with real client information (null values, text overflow, date edge cases). Generate mock data programmatically with realistic distributions (20% nulls where optional), include edge cases (50+ char names, overlapping dates, past-due items, French accented characters), use production schema from day one. Address in Phase 1 - data structure and validation patterns propagate through entire codebase.

3. **Accessibility as Afterthought** — Minimalist design becomes unusable for the dyslexic user it's meant to serve (low contrast, color-only status, no keyboard navigation). Run WCAG AAA contrast checks in design phase, never rely on color alone (combine with icons/text), implement full keyboard navigation, test with actual screen readers, provide dyslexia-friendly fonts (OpenDyslexic toggle). Address in Phase 1 - retrofitting accessibility is 3-5x more expensive than building accessibly from start.

4. **Scope Creep Through "Useful" Features** — Minimalist dashboard morphs into Notion clone with reporting, custom fields, file attachments, commenting, integrations. Define explicit anti-features upfront ("We will NOT build custom fields, file storage, or time tracking"), use time-based forcing function (8 weeks), every feature must answer "Does this support viewing client timelines?", test complexity with dyslexic user. Address in Phase 0 (Planning) - after features are built, removing them is organizationally difficult.

5. **Multi-User Conflict Chaos** — Two team members edit same deliverable simultaneously, last write wins, silently overwriting changes. Decide collaboration strategy early (full real-time OR optimistic locking with conflict detection), for MVP optimistic locking is simpler (track version/timestamp, show conflict dialog), show "User X is viewing" indicators, test with two browsers side-by-side. Address in Phase 2 (Collaboration) if multi-user validated - architectural decisions in Phase 1 must not preclude adding collaboration later.

**Additional pitfalls:** Hardcoded date ranges (never acceptable), client-side-only storage (prototype only), inline date calculations without timezone handling (use date-fns from start), fetching all data on timeline load (paginate by date range), N+1 queries (use JOIN), storing all state in single context (split by domain), client-side authorization only (enforce on server).

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Foundation & Timeline MVP
**Rationale:** Timeline performance and accessibility must be baked into foundation, not retrofitted. Mock-data-first approach validates UX before database complexity. Architectural decisions here (virtual scrolling, component structure, accessibility patterns) are expensive to change later.

**Delivers:** Working timeline visualization with 20 mock clients, basic client cards, visual status indicators, dyslexia-friendly UI, keyboard navigation, virtual scrolling implementation.

**Addresses features:**
- Client Contact Storage (foundation)
- Client Status Distinction (prospect/active/completed)
- Horizontal Timeline as Primary View (differentiator)
- Mock Data Mode (enables immediate testing)
- Visual Pipeline Stages (at-a-glance status)
- Ultra-Minimalist UI (dyslexia-friendly design)

**Avoids pitfalls:**
- Timeline performance degradation (virtual scrolling from day one)
- Mock data reality gap (generate realistic mock data with edge cases)
- Accessibility as afterthought (WCAG AAA contrast, keyboard navigation, screen reader support)
- Scope creep (define anti-features, time-boxed to establish foundation)

**Stack elements:** Next.js 16 + React 19 + TypeScript + Tailwind CSS + vis-timeline + Zustand + date-fns, Mock JSON (no database yet).

**Research flag:** SKIP research-phase — timeline visualization is well-documented with established patterns from Gantt/calendar implementations.

### Phase 2: Client & Deliverable Management
**Rationale:** Once timeline visualization proven, add CRUD functionality for clients and deliverables. Still using mock data to keep complexity low and focus on UX flows. Data persistence deferred until workflows validated.

**Delivers:** Client forms (add/edit), deliverable forms with date pickers, search/filter functionality, client list/card views, deliverable positioning on timeline, form validation with Zod.

**Addresses features:**
- Task/Deliverable Tracking (core PM function)
- Client/Project List View (with filtering)
- Client Cards with Text Files (lightweight notes)
- Basic Search/Filter (quick information retrieval)

**Implements architecture:**
- Client Management components (ClientCard, ClientList, ClientForm)
- Deliverable Tracking components (DeliverableForm, DeliverableDetails)
- Form handling with React Hook Form + Zod
- Integration with Zustand store actions

**Avoids pitfalls:**
- Form validation edge cases (test with special characters, long names)
- Date handling without timezones (use date-fns from start)
- Scope creep (focus on core CRUD, defer file attachments)

**Stack elements:** Add React Hook Form + Zod for forms, continue with mock JSON.

**Research flag:** SKIP research-phase — standard CRUD patterns, well-documented form handling.

### Phase 3: Database Persistence
**Rationale:** With UX validated using mock data, add real persistence. SQLite for simplicity (single file, zero config), Drizzle ORM for TypeScript-first approach. Easy migration path to PostgreSQL when scaling beyond prototype.

**Delivers:** SQLite database with Drizzle schema, migrations, seed scripts with mock data, API routes in Next.js for CRUD operations, data persistence replacing mock JSON.

**Addresses features:**
- File Attachments (now that real storage exists)
- Data backup and recovery (database persistence)

**Implements architecture:**
- Database schema (clients, deliverables, relationships)
- Service layer abstracting data access
- API routes replacing mock data service
- Migration from client-side state to server-side persistence

**Avoids pitfalls:**
- N+1 queries (use JOIN queries from start)
- Missing null checks (enforce schema constraints)
- Data model mistakes (schema review before implementation)

**Stack elements:** Add SQLite + Drizzle ORM + better-sqlite3.

**Research flag:** SKIP research-phase — database patterns well-documented, Drizzle has excellent TypeScript docs.

### Phase 4: Mobile & Polish
**Rationale:** With core functionality working, optimize for mobile access (remote work standard) and polish accessibility. Address responsive design, touch targets, and performance optimization.

**Delivers:** Mobile-responsive timeline, touch gesture support, performance optimization (memoization, debouncing), accessibility audit fixes, loading states, error handling.

**Addresses features:**
- Mobile Access (responsive design for remote work)
- Single-Screen Overview refinement (optimized for different screen sizes)

**Implements architecture:**
- Performance optimization patterns (memoization of expensive calculations)
- Debouncing of form inputs
- Loading indicators and skeleton screens

**Avoids pitfalls:**
- Horizontal scroll usability on mobile (test on actual phones)
- Precise click targets (44x44px minimum touch targets)
- Missing loading states (add throughout app)

**Stack elements:** No new dependencies, optimization of existing code.

**Research flag:** SKIP research-phase — responsive design and performance optimization are standard patterns.

### Phase 5: Collaboration (Future)
**Rationale:** Defer until multi-user need validated. Requires architectural decisions: full real-time (WebSocket + CRDT) vs optimistic locking with conflict detection. For MVP, optimistic locking simpler.

**Delivers:** Multi-user conflict detection OR real-time sync, "who's viewing/editing" indicators, optimistic updates with rollback, presence indicators.

**Addresses features:**
- Real-time Collaboration (if validated as needed)
- Team features (deferred from anti-features if demand exists)

**Implements architecture:**
- Optimistic locking (version/timestamp tracking) OR
- WebSocket infrastructure with Liveblocks/Yjs for CRDT
- Conflict resolution strategy

**Avoids pitfalls:**
- Multi-user conflict chaos (implement conflict detection early)
- Stale data (automatic refresh on external updates)

**Stack elements:** Add NextAuth.js for authentication, potentially Liveblocks or custom WebSocket.

**Research flag:** NEEDS research-phase — collaboration patterns require deeper investigation of Liveblocks vs custom WebSocket vs operational transforms.

### Phase 6: Production Scale (Future)
**Rationale:** When scaling beyond 100 clients or need concurrent users, migrate to PostgreSQL, add caching layer, implement server-side rendering for initial load.

**Delivers:** PostgreSQL migration, TanStack Query for caching, pagination/lazy loading, advanced filtering on server side, deployment to Vercel/Railway.

**Implements architecture:**
- Database migration from SQLite to PostgreSQL
- TanStack Query replacing direct Zustand calls
- Server-side pagination and filtering
- Backend API with proper indexes

**Avoids pitfalls:**
- Fetching all data on timeline load (implement pagination)
- Client-side filtering at scale (move to server)

**Stack elements:** PostgreSQL (replacing SQLite), TanStack Query, deployment platform (Vercel recommended).

**Research flag:** SKIP research-phase — PostgreSQL migration and deployment patterns well-documented.

### Phase Ordering Rationale

**Why this order:**
- **Mock-first approach** (Phases 1-2) validates UX before database complexity, enables faster iteration on design and interactions
- **Timeline visualization first** (Phase 1) because it's the core differentiator and architectural decisions (virtual scrolling, date calculations) must be correct from start
- **CRUD second** (Phase 2) builds on validated timeline, keeps complexity low with continued mock data
- **Database third** (Phase 3) only after workflows proven, avoids premature optimization
- **Mobile fourth** (Phase 4) because desktop UX must be solid first, responsive design is easier to add than to retrofit
- **Collaboration deferred** (Phase 5) until multi-user need validated — complex infrastructure not needed for 1-2 person agency
- **Production scale last** (Phase 6) because SQLite sufficient for 10-20 clients, premature scaling adds complexity

**Why this grouping:**
- **Foundation** (Phase 1) groups performance, accessibility, and architecture foundations that are expensive to change
- **Core features** (Phase 2) groups CRUD operations that share form handling patterns
- **Persistence** (Phase 3) isolated to minimize risk of database changes affecting UX
- **Polish** (Phase 4) groups non-functional improvements that enhance but don't change core UX
- **Scale** (Phases 5-6) groups advanced features requiring architectural shifts

**How this avoids pitfalls:**
- Timeline performance addressed in Phase 1 before building features on top
- Accessibility baked into Phase 1 foundation, not retrofitted in Phase 4
- Scope discipline enforced by phase boundaries and anti-features list
- Mock data validation happens in Phases 1-2 before database complexity
- Multi-user conflicts addressed only when needed (Phase 5), not prematurely

### Research Flags

**Phases needing deeper research during planning:**
- **Phase 5 (Collaboration):** Complex integration of real-time sync or conflict resolution patterns. Needs research on Liveblocks vs custom WebSocket vs operational transforms. Sparse documentation for specific use case (timeline collaboration).

**Phases with standard patterns (skip research-phase):**
- **Phase 1 (Foundation):** Timeline visualization well-documented from Gantt/calendar implementations, virtual scrolling is established pattern
- **Phase 2 (Client & Deliverable Management):** Standard CRUD patterns, React Hook Form + Zod integration heavily documented
- **Phase 3 (Database Persistence):** Drizzle ORM has excellent TypeScript docs, SQLite to PostgreSQL migration path well-established
- **Phase 4 (Mobile & Polish):** Responsive design and performance optimization are standard web development patterns
- **Phase 6 (Production Scale):** PostgreSQL migration, TanStack Query, and Vercel deployment all heavily documented

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Core stack (Next.js, React, TypeScript, Tailwind) is industry standard with massive adoption (68% for Next.js). Database choice (SQLite → PostgreSQL) and ORM (Drizzle) are pragmatic for project scale. Sources include official docs and Context7. |
| Features | HIGH | Feature research based on multiple credible sources analyzing client management tools, agency pain points, and Notion alternatives. Table stakes vs differentiators vs anti-features validated across 20+ sources. Clear consensus on what small agencies need. |
| Architecture | MEDIUM | Architecture patterns validated from Gantt/calendar implementations and React best practices. Virtual scrolling, state management, and component structure well-documented. Timeline-specific patterns adapted from similar domains. Lower confidence on timeline library choice (vis-timeline vs custom) - requires early validation. |
| Pitfalls | MEDIUM | Critical pitfalls based on official documentation (DHTMLX Gantt, Syncfusion) and community discussions. Performance patterns verified. UX/data pitfalls inferred from general web development best practices and GitHub issues. Medium confidence because some patterns adapted from adjacent domains. |

**Overall confidence:** HIGH

The core technology decisions are highly validated with official documentation and industry adoption stats. Feature priorities are well-researched from agency-specific sources. Architecture patterns proven in similar timeline/calendar applications. Main uncertainty is timeline library selection (vis-timeline maturity vs custom control) which can be resolved with early spike/prototype in Phase 1.

### Gaps to Address

**Timeline library validation:** vis-timeline is mature (7.7+) but react-vis-timeline wrapper has unknown maintenance status. Alternative is building custom timeline with CSS Grid/Flexbox for total control. **Resolution:** Spike in first week of Phase 1 - build simple prototype with both approaches, evaluate performance and DX before committing.

**Dyslexia-friendly font licensing:** OpenDyslexic font licensing and web delivery unclear from research. **Resolution:** Research font licensing during Phase 1 design, fallback to Comic Sans MS or Arial with generous spacing if licensing problematic.

**Real-time collaboration complexity:** Phase 5 collaboration approach (Liveblocks vs custom WebSocket vs operational transforms) needs deeper research if/when needed. **Resolution:** Defer until Phase 5 planning, run dedicated research-phase at that time if feature validated.

**Deployment platform costs:** Vercel recommended but can be expensive at scale. Railway and Cloudflare Pages as alternatives. **Resolution:** Validate Vercel free tier limits during Phase 3, evaluate alternatives if approaching limits during Phase 6 scaling.

**Date/timezone handling edge cases:** Research covered date-fns for manipulation but not comprehensive timezone handling for distributed teams. **Resolution:** Document timezone assumptions during Phase 1 (default to user's local timezone), revisit if international usage validated.

## Sources

### Primary (HIGH confidence)
- Next.js Official Docs — Version 16.1.6 confirmed, App Router recommended, React 19 support
- React Official Docs — React 19.2 stable release, Activity API
- Vercel React Best Practices — Modern patterns, server components
- DHTMLX Gantt Performance Guide — Virtual scrolling metrics, performance optimization
- Syncfusion Blazor Gantt Performance — Timeline rendering best practices
- ProjectManager.com Scope Creep Guide — Feature discipline, change control

### Secondary (MEDIUM confidence)
- 27 Best CRM Software Companies (2026) — Client management feature analysis
- 33 CRM Features Small Business Needs — Table stakes features
- 11 Best Project Timeline Software (2026) — Timeline visualization tools comparison
- 18 Best Notion Alternatives (2026) — Minimalist tools research, agency pain points
- Nuclino Notion Alternatives — Simplicity over flexibility insight
- Monday.com Client Management Software — 20 solutions compared
- Smart Interface Design Patterns: Dyslexia Design — Accessibility best practices, font choices, contrast
- Smashing Magazine: Dyslexia-Friendly Mode — Implementation patterns
- Prisma vs Drizzle ORM (2026) — ORM comparison for TypeScript projects
- Top 5 React State Management Tools (2026) — Zustand adoption and trends
- Best React Form Libraries (2026) — React Hook Form vs Formik analysis
- React Folder Structure (Robin Wieruch) — Feature-based organization
- Virtual Scrolling in React (LogRocket) — Implementation patterns, performance metrics
- Modern Web Application Architecture (2026) — Layered architecture, modular monolith
- React Stack Patterns (patterns.dev) — Container/presentational, hooks patterns

### Tertiary (LOW confidence)
- Database Testing Without Mocks (SimplyBlock) — Mock data reality gap patterns
- Beyond Database Mocks (Medium) — Realistic test data generation
- How to Build Multi-User Collaboration Web Apps (Medium) — Conflict resolution overview
- Real-Time Collaboration Implementation (PixelFreeStudio) — WebSocket patterns
- React Calendar Timeline GitHub Issues — Horizontal scroll problems, real-world bugs

---
*Research completed: 2026-02-13*
*Ready for roadmap: yes*

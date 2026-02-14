# Pitfalls Research

**Domain:** Client Management & Timeline Visualization Web Apps
**Researched:** 2026-02-13
**Confidence:** MEDIUM

## Critical Pitfalls

### Pitfall 1: Timeline Performance Degradation with Scale

**What goes wrong:**
Timeline rendering becomes unusably slow when displaying 10-20 clients with multiple deliverables each. Initial load times exceed 10+ seconds, scrolling becomes janky, and the UI freezes during interactions. The app that works smoothly with 5 clients and 20 tasks becomes unbearable at production scale.

**Why it happens:**
Developers test with minimal mock data (2-3 clients, handful of tasks) that doesn't expose performance bottlenecks. Timeline libraries render all items upfront without virtualization. DOM nodes multiply exponentially when displaying overlapping timeline elements.

**How to avoid:**
- Test with realistic data volumes from day one: 20 clients minimum, 100+ deliverables
- Implement virtualization for timeline rendering (only render visible viewport)
- Use canvas-based or WebGL rendering for timeline visualization instead of DOM manipulation
- Set explicit date ranges rather than rendering entire project history
- Enable dynamic loading: load tasks progressively as users scroll
- Benchmark initial render time: target <2 seconds for full timeline load

**Warning signs:**
- Initial development uses 3-5 sample items
- Timeline re-renders on every state change
- Browser DevTools Performance tab shows long tasks >50ms
- Scroll events trigger full component re-renders
- Timeline library doesn't mention "virtualization" in docs

**Phase to address:**
**Phase 1 (Foundation/MVP)** - Architecture decisions made early are expensive to change. Choose performant libraries and establish virtualization patterns before building features on top.

**Sources:**
- [DHTMLX Gantt Performance Guide](https://docs.dhtmlx.com/gantt/desktop__performance.html) (MEDIUM confidence)
- [Syncfusion Blazor Gantt Performance](https://blazor.syncfusion.com/documentation/gantt-chart/performance) (MEDIUM confidence)

---

### Pitfall 2: Mock Data Reality Gap

**What goes wrong:**
Application works perfectly in development with clean mock data, then breaks in production with real client information. Null values appear where none existed in mocks. Text overflows when client names exceed expected lengths. Date edge cases (overlapping deliverables, past due items, future dates beyond timeline view) cause layout breakage.

**Why it happens:**
Mock data is too clean and uniform. Developers create "happy path" data that lacks the messiness of production: optional fields left null, inconsistent naming, edge case dates, missing relationships, special characters in names. The database schema differs from mock structure because constraints weren't enforced in development.

**How to avoid:**
- Generate mock data programmatically using realistic distributions (20% nulls where optional)
- Include edge cases in mock data: very long names (50+ chars), overlapping dates, past-due items, items 2+ years in future
- Test with French accented characters and special characters (agency context: "Étude de cas", "Client & Partenaire")
- Use production schema for development database from day one
- Create "chaos mode" toggle that injects problematic data patterns for testing
- Document data assumptions explicitly: "Client name max 100 chars", "Description can be null"

**Warning signs:**
- Mock data created manually with 5-10 hardcoded entries
- All mock text fields have similar lengths
- No null values in mock data despite optional schema fields
- Testing only with ASCII character names
- Comments like "we'll handle edge cases later"

**Phase to address:**
**Phase 1 (Foundation)** - Data structure and validation patterns set here propagate through entire codebase. Fixing data handling after building features requires touching every component.

**Sources:**
- [Database Testing Without Mocks](https://www.simplyblock.io/blog/database-testing-without-mocks/) (MEDIUM confidence)
- [Beyond Database Mocks](https://medium.com/@carlotasotos/beyond-database-mocks-how-to-spin-up-real-postgres-testing-environments-in-seconds-7492eb3c8bd0) (LOW confidence)

---

### Pitfall 3: Accessibility as Afterthought

**What goes wrong:**
The "minimalist" design becomes unusable for the dyslexic user it's meant to serve. Low contrast text fails WCAG standards. Color-coded status indicators convey no meaning to colorblind users. Keyboard navigation skips timeline interactions. Screen readers announce timeline elements incomprehensibly. The minimalist aesthetic prioritizes visual appeal over functional accessibility.

**Why it happens:**
Accessibility treated as final polish rather than core requirement. Developers with typical vision don't experience the barriers. Color and spacing decisions made purely aesthetically. "Minimalist" interpreted as "less visible" rather than "less cluttered". No dyslexic users involved in testing.

**How to avoid:**
- Run WCAG AAA contrast checks in design phase (not AA - aim higher for dyslexic users)
- Use OpenDyslexic or similar fonts as toggle option
- Never rely on color alone: combine with icons, patterns, or text labels
- Implement full keyboard navigation: Tab through all interactive timeline elements
- Add generous line spacing (1.5-2x) and paragraph spacing
- Test with actual screen readers (NVDA/JAWS on Windows, VoiceOver on Mac)
- Provide text alternatives for all visual timeline representations
- Create "focus mode" that reduces cognitive load: show one client's timeline at a time

**Warning signs:**
- Color contrast ratios <7:1 (AAA standard)
- Status communicated only through color (red/yellow/green dots)
- Dense timeline with overlapping text
- No consideration of font choice for dyslexic readability
- Timeline interactions require precise mouse positioning
- "We'll make it accessible later" in planning docs

**Phase to address:**
**Phase 1 (Foundation)** - Retrofitting accessibility into existing UI components is 3-5x more expensive than building accessibly from the start. Core component library must be accessible from day one.

**Sources:**
- [Minimalist UI Design for Accessibility in 2026](https://www.anctech.in/blog/explore-how-minimalist-ui-design-in-2026-focuses-on-performance-accessibility-and-content-clarity-learn-how-clean-interfaces-subtle-interactions-and-data-driven-layouts-create-better-user-experie/) (MEDIUM confidence)
- [Leantime: Neurodiversity-Focused PM Tool](https://plane.so/blog/top-6-open-source-project-management-software-in-2026) (MEDIUM confidence)

---

### Pitfall 4: Multi-User Conflict Chaos

**What goes wrong:**
Two team members edit the same client's deliverable simultaneously. Last write wins, silently overwriting the other person's changes. Users see stale data until they refresh. Timeline displays inconsistent state across different users' browsers. Confusion leads to duplicated work or lost updates.

**Why it happens:**
Real-time collaboration treated as "nice to have" feature rather than architectural requirement. Simple REST API approach doesn't handle concurrent edits. No conflict resolution strategy defined upfront. Optimistic UI updates without proper rollback on conflict.

**How to avoid:**
- Decide collaboration strategy early: full real-time (WebSockets + CRDT) OR optimistic locking with conflict detection
- For MVP, optimistic locking is simpler: track version/timestamp, show conflict dialog on save collision
- If building real-time: use established libraries (Yjs, Liveblocks) - don't build CRDT from scratch
- Show "User X is viewing/editing this" indicators
- Implement automatic refresh on external updates (long polling minimum, WebSockets ideal)
- Add "last modified by" audit trail for debugging conflicts
- Test with two browsers open side-by-side editing same record

**Warning signs:**
- No discussion of concurrent edit handling in architecture docs
- REST API without version/timestamp fields
- No WebSocket or polling strategy for updates
- Comments like "users won't edit the same thing at the same time"
- Single-user testing only

**Phase to address:**
**Phase 2 (Collaboration Features)** - Can defer to Phase 2 if MVP is single-user or read-mostly, but architectural decisions in Phase 1 must not preclude adding collaboration later. Don't paint yourself into architectural corner.

**Sources:**
- [How to Build Multi-User Collaboration Web Apps](https://medium.com/@earlmillen7/how-to-build-a-web-application-that-supports-multi-user-collaboration-in-2025-337b5c0f6b85) (LOW confidence)
- [Real-Time Collaboration Implementation](https://blog.pixelfreestudio.com/how-to-implement-real-time-collaboration-features-in-web-apps/) (LOW confidence)

---

### Pitfall 5: Scope Creep Through "Useful" Features

**What goes wrong:**
The minimalist client dashboard morphs into a Notion clone with reporting, custom fields, file attachments, commenting, notifications, integrations, advanced filtering, export options, and client portal. Original goal of "simpler than Notion" is lost. Development timeline doubles. Complexity overwhelms the dyslexic user the tool was meant to help.

**Why it happens:**
Each feature seems reasonable in isolation: "clients will need to attach files", "we should track time spent", "reporting would be valuable". No forcing function to say no. Gold plating to "delight users" with unrequested features. Missing clear definition of what the product is NOT.

**How to avoid:**
- Define explicit anti-features upfront: "We will NOT build custom fields, file storage, or time tracking"
- Create "parking lot" for deferred features: acknowledge requests without committing
- Use time-based forcing function: "if it doesn't fit in 8 weeks, it's out of scope"
- Every new feature must answer: "Does this support viewing client timelines?" If no, defer
- Establish change control: new feature requests go into Phase 2/3 planning, not current sprint
- Test complexity with actual dyslexic user: if they're confused, remove features

**Warning signs:**
- Feature list growing beyond initial spec
- Phrases like "while we're at it, we could add..."
- Comparisons to feature-rich tools (Notion, Asana, Monday)
- Client stakeholders requesting "just one more thing"
- No written definition of what product will NOT do

**Phase to address:**
**Phase 0 (Planning)** - Scope discipline must be established before writing code. After features are built, removing them is organizationally difficult ("but we already have it!").

**Sources:**
- [What is Scope Creep and How to Avoid It](https://www.projectmanager.com/blog/5-ways-to-avoid-scope-creep) (HIGH confidence)
- [Gold Plating and Scope Creep](https://www.ppm.express/blog/scope-creep) (MEDIUM confidence)

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Hardcoded date ranges in timeline | Fast implementation, no UI for date picker | Timeline unusable for long-term planning, breaks when hardcoded dates pass | Never - dates must be dynamic from day one |
| Client-side only data storage (localStorage) | No backend needed, instant setup | No multi-user sync, data loss on browser clear, no backup | Only for prototype/demo, never for production |
| Inline date calculations without timezone handling | Simpler code, fewer dependencies | Breaks for distributed teams, daylight saving bugs, wrong dates displayed | Never - use date library (date-fns, Luxon) from start |
| Separate edit pages instead of inline editing | Easier form validation, simpler state management | Breaks timeline mental model, extra clicks frustrate users | Early MVP only if timeline remains read-only |
| Rendering entire timeline as single component | Simpler component hierarchy | Performance degrades with data growth, harder to optimize later | Never at expected scale (10-20 clients) |
| Using generic table/list instead of specialized timeline library | Avoid learning new library, faster initial dev | Rebuild timeline features from scratch, accessibility problems | Never - specialized libraries solve hard problems (virtualization, zoom, pan) |

## Integration Gotchas

Common mistakes when connecting to external services.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Calendar sync (Google/Outlook) | Assuming calendar events map 1:1 to deliverables | Handle recurring events, cancelled events, partial updates, time zone mismatches |
| Authentication | Building custom auth system | Use established OAuth provider (Auth0, Clerk, Supabase Auth) - security is hard |
| File attachments | Storing files in application database | Use object storage (S3, Cloudflare R2) with signed URLs, enforce size limits early |
| Email notifications | Sending directly from application server | Use transactional email service (SendGrid, Postmark) - deliverability matters |
| Data export | Generating CSV/Excel on request | Pre-generate exports asynchronously, provide download link - large exports block server |

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Fetching all clients + deliverables on timeline load | Initial load takes 10+ seconds, 5MB+ JSON payloads | Paginate or filter by date range, fetch visible data only | 15+ clients with 5+ deliverables each |
| N+1 queries for client deliverables | Timeline load triggers hundreds of database queries | Use JOIN queries or GraphQL with DataLoader | 10+ clients |
| Re-rendering entire timeline on single item update | UI freezes for 500ms+ on any change | Implement granular state updates, memoize components | 50+ timeline items visible |
| Storing entire app state in single React context | Every state change re-renders entire app | Split contexts by domain (clients, auth, UI), use state management library (Zustand, Jotai) | 10+ components consuming context |
| Polling API every second for updates | Backend overwhelmed, mobile data usage spikes | Increase poll interval to 30s minimum, or use WebSocket for real updates | 5+ concurrent users |
| Calculating date overlaps on every render | CPU spikes, battery drain on mobile | Memoize calculations, pre-compute during data fetch | 20+ overlapping deliverables |

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Client-side authorization checks only | Users can view other agencies' clients by manipulating URLs/API calls | Enforce authorization on server for every request, validate user owns/can access requested client |
| Storing sensitive client data without encryption | Data breach exposes confidential project information | Encrypt sensitive fields at rest, use HTTPS everywhere, implement audit logging |
| No rate limiting on API endpoints | Malicious users can scrape all client data | Implement rate limiting (100 req/min per user), add API authentication |
| Sharing timeline view URLs without access control | Public URLs expose confidential client schedules | Require authentication for all views, use short-lived signed tokens for sharing if needed |
| Logging sensitive client information | Logs inadvertently stored/shared reveal confidential data | Sanitize logs to exclude client names, project details; log only IDs |

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Horizontal-only timeline scroll | Users can't see all clients without scrolling, lose context | Vertical list of clients with horizontal timeline per client, or zoomable timeline with overview minimap |
| Color-only status indicators | Colorblind users can't distinguish status, dyslexic users need text labels | Combine color with icons and text labels, use patterns/shapes |
| Dense timeline with overlapping labels | Text collision makes deliverables unreadable | Implement intelligent label positioning, show on hover, or use grouped "expand" interaction |
| Requiring precise click targets on timeline | Frustrating on mobile, inaccessible for motor impairments | Large touch targets (44x44px minimum), allow clicking anywhere on timeline bar |
| Hidden timeline controls (zoom, pan, filters) | Users don't discover functionality | Visible, labeled controls; provide keyboard shortcuts with visible hints |
| No "today" indicator on timeline | Users lose sense of time, can't distinguish past/future quickly | Bold "today" line, past dates in muted colors, future in full color |
| Displaying all 20 clients simultaneously | Cognitive overload, especially for dyslexic user | Default to filtered view (active clients only), provide simple toggle to show all |
| Auto-refresh disrupting user interaction | User mid-edit when data refreshes, losing focus/changes | Pause auto-refresh during active editing, show "new updates available" banner |

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Timeline rendering:** Often missing empty states (no clients, no deliverables), timezone handling, daylight saving adjustments - verify with users in different timezones
- [ ] **Client creation:** Often missing duplicate name detection, input validation for special characters, undo functionality - verify with edge case names
- [ ] **Deliverable management:** Often missing conflict detection when dates overlap, past-due handling, completion workflows - verify with overlapping and overdue items
- [ ] **Search/filtering:** Often missing debouncing (API called on every keystroke), empty results messaging, filter persistence - verify performance with slow typing
- [ ] **Multi-user features:** Often missing "who's viewing/editing" indicators, stale data refresh, optimistic update rollback on failure - verify with two users simultaneously
- [ ] **Accessibility:** Often missing keyboard navigation for timeline interactions, screen reader announcements, focus management - verify with keyboard only and screen reader
- [ ] **Mobile responsive:** Often missing touch gesture support, readable text at mobile sizes, horizontal scroll on small screens - verify on actual phone, not just DevTools
- [ ] **Error handling:** Often missing network failure recovery, validation error messages, loading states - verify by throttling network in DevTools
- [ ] **Data export:** Often missing error handling for large exports, progress indication, filename generation - verify with 100+ deliverables export
- [ ] **Performance:** Often missing loading indicators, skeleton screens, virtualization - verify with realistic data volume (20 clients, 100+ deliverables)

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Timeline performance degradation | MEDIUM | Add virtualization library (react-window, react-virtual), implement pagination, add date range filters to limit visible data |
| Mock data reality gap | LOW-MEDIUM | Create chaos testing data, add null checks to all data access, implement validation at API boundaries |
| Accessibility failures | HIGH | Audit with aXe DevTools, hire accessibility consultant, rebuild core components with ARIA support |
| Multi-user conflicts | HIGH | Add version tracking to data model (requires migration), implement conflict detection, add WebSocket infrastructure |
| Scope creep bloat | MEDIUM-HIGH | Feature freeze, user testing to identify unused features, deprecate low-value features, extract features to "advanced" mode |
| Horizontal scroll usability problems | MEDIUM | Redesign timeline layout (vertical client list), add minimap overview, improve keyboard navigation |
| Data model mistakes | HIGH | Write database migrations carefully, plan data transformation, communicate schema changes to team |
| Calendar integration bugs | MEDIUM | Add comprehensive timezone tests, use established date library, implement retry logic for sync failures |

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Timeline performance degradation | Phase 1: Foundation | Load test with 20 clients, 200 deliverables - initial render <2s, scrolling 60fps |
| Mock data reality gap | Phase 1: Foundation | Generate 1000 realistic records with edge cases, all UI components handle gracefully |
| Accessibility failures | Phase 1: Foundation | Automated aXe tests pass, manual keyboard navigation test, screen reader announcement test |
| Multi-user conflicts | Phase 2: Collaboration | Two-browser concurrent edit test, verify conflict detection or real-time sync |
| Scope creep bloat | Phase 0: Planning | Documented anti-features list, change control process, feature freeze after Phase 1 |
| Horizontal scroll usability | Phase 1: Foundation | Usability test with 5 users, verify timeline navigation without confusion |
| Data model mistakes | Phase 1: Foundation | Schema review with database expert, document all relationships and constraints |
| Unclear stakeholder requirements | Phase 0: Planning | Written requirements doc signed off by agency team lead, dyslexic user interviewed |

## Sources

### High Confidence (Official Documentation)
- [DHTMLX Gantt Performance Guide](https://docs.dhtmlx.com/gantt/desktop__performance.html)
- [Syncfusion Blazor Gantt Performance Optimization](https://blazor.syncfusion.com/documentation/gantt-chart/performance)
- [What is Scope Creep and How to Avoid It - ProjectManager](https://www.projectmanager.com/blog/5-ways-to-avoid-scope-creep)

### Medium Confidence (Multiple Sources Agree)
- [Top 5 Dashboard Fails - Metabase](https://www.metabase.com/blog/top-5-dashboard-fails)
- [Client-Facing Dashboards Tools & Examples 2026](https://workahomie.com/client-facing-dashboards-tools/)
- [3 Dashboard Mistakes Diligence Teams Should Avoid](https://diligencevault.com/3-dashboard-mistakes-diligence-teams-should-avoid/)
- [Common Data Model Mistakes - Metabase Learn](https://www.metabase.com/learn/grow-your-data-skills/analytics/data-model-mistakes)
- [8 Data Modeling Mistakes to Avoid in 2025](https://www.owox.com/blog/articles/mistakes-in-data-modeling)
- [PPM Express: Scope Creep Explained](https://www.ppm.express/blog/scope-creep)
- [Minimalist UI Design for Accessibility in 2026](https://www.anctech.in/blog/explore-how-minimalist-ui-design-in-2026-focuses-on-performance-accessibility-and-content-clarity-learn-how-clean-interfaces-subtle-interactions-and-data-driven-layouts-create-better-user-experie/)
- [Top 6 Open Source Project Management Software 2026 - Plane](https://plane.so/blog/top-6-open-source-project-management-software-in-2026)
- [Best Realtime Collaboration SDKs - Ably](https://ably.com/blog/best-realtime-collaboration-sdks)

### Low Confidence (Single Source or Unverified)
- [Database Testing Without Mocks - SimplyBlock](https://www.simplyblock.io/blog/database-testing-without-mocks/)
- [Beyond Database Mocks - Medium](https://medium.com/@carlotasotos/beyond-database-mocks-how-to-spin-up-real-postgres-testing-environments-in-seconds-7492eb3c8bd0)
- [How to Build Multi-User Collaboration Web Apps - Medium](https://medium.com/@earlmillen7/how-to-build-a-web-application-that-supports-multi-user-collaboration-in-2025-337b5c0f6b85)
- [How to Implement Real-Time Collaboration Features](https://blog.pixelfreestudio.com/how-to-implement-real-time-collaboration-features-in-web-apps/)

### GitHub Issues (Real-World Problems)
- [React Calendar Timeline: Horizontal Scroll Issues](https://github.com/namespace-ee/react-calendar-timeline/issues/713)
- [React Calendar Timeline: Scroll Bug with Headers](https://github.com/namespace-ee/react-calendar-timeline/issues/809)

---

*Pitfalls research for: YAM Dashboard (Client Management & Timeline Visualization)*
*Researched: 2026-02-13*
*Confidence: MEDIUM - Based on official documentation for performance, community discussions for UX/data patterns, and general web development best practices*

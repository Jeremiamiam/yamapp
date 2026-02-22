# Requirements: YAM Dashboard

**Defined:** 2026-02-13
**Core Value:** Avoir une vue d'ensemble claire de tous les clients et deadlines en un coup d'œil, sans surcharge d'information.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Foundation

- [ ] **FOUND-01**: User can store client contact information (name, email, phone, notes)
- [ ] **FOUND-02**: User can distinguish between prospects and clients (status field)
- [ ] **FOUND-03**: App loads with mock data (5-10 sample clients) for immediate UX validation

### Timeline Visualization

- [ ] **TIME-01**: User sees horizontal timeline view as primary interface showing all clients
- [ ] **TIME-02**: User can view deliverables on timeline with their due dates
- [ ] **TIME-03**: User can view calls/meetings on timeline with their scheduled dates
- [ ] **TIME-04**: User sees visual status indicators (colors/icons) for prospect vs client vs completed

### Client Management

- [ ] **CLIENT-01**: User can view client cards showing essential info (name, status, next deliverable)
- [ ] **CLIENT-02**: User can click client card to open detailed view
- [ ] **CLIENT-03**: User can add text file notes to client (transcriptions PLAUD traitées)
- [ ] **CLIENT-04**: User can view and edit text notes attached to client
- [ ] **CLIENT-05**: User can add contacts to client card (name, role, email, phone)
- [ ] **CLIENT-06**: User can view list of all contacts for a client

### Client Links

- [ ] **LINK-01**: User can add external URLs to client cards (Figma, sites, prototypes)
- [ ] **LINK-02**: User can select from suggested labels (Figma, Prez Figma, Zoning, Site internet, Proto web, Maquette)
- [ ] **LINK-03**: User can delete client links

### Deliverables & Calls

- [ ] **DELIV-01**: User can create deliverable with name, due date, type, and status
- [ ] **DELIV-02**: User can edit deliverable details
- [ ] **DELIV-03**: User can mark deliverable as completed
- [ ] **DELIV-04**: User can create call/meeting with date and time
- [ ] **DELIV-05**: User can edit call/meeting details
- [ ] **DELIV-06**: User can view all deliverables and calls for a client in detail view
- [ ] **DELIV-07**: User can toggle deliverable status (pending → in-progress → completed)
- [ ] **DELIV-08**: User can assign deliverable to team member
- [ ] **CALL-01**: User can set call duration in minutes
- [ ] **CALL-02**: User can assign call to team member

### Team Management

- [ ] **TEAM-01**: User can view team members with roles (founder/employee/freelance)
- [ ] **TEAM-02**: Team members have avatar with initials and custom color
- [ ] **TEAM-03**: System loads team data with mock data

### Timeline Filters

- [ ] **FILTER-01**: User can filter timeline by client status (all/clients/prospects)
- [ ] **FILTER-02**: User can filter timeline by team member (show only their assignments)
- [ ] **FILTER-03**: User sees count of clients and prospects in filter badges
- [ ] **FILTER-04**: User can reset all active filters
- [ ] **FILTER-05**: User sees visual indication of active filters

### Structured Documents

- [ ] **DOC-01**: User can create structured brief documents using JSON template
- [ ] **DOC-02**: User can create structured PLAUD report documents using JSON template
- [ ] **DOC-03**: User can view documents in modal viewer
- [ ] **DOC-04**: User can edit structured document content
- [ ] **DOC-05**: System validates document structure against templates (brief/report)
- [ ] **DOC-06**: Brief template includes: title, objectives, target audience, deliverables, constraints, tone
- [ ] **DOC-07**: Report template includes: date, participants, summary, key points, action items

### Timeline Range

- [ ] **TIME-05**: User can configure timeline date range (default: -1 day to +90 days)

### Backlog / Unscheduled Items

- [ ] **BACKLOG-01**: User can view sidebar showing all unscheduled deliverables and calls
- [ ] **BACKLOG-02**: User can create deliverable without due date (goes to backlog automatically)
- [ ] **BACKLOG-03**: User can create call without scheduled date (goes to backlog automatically)
- [ ] **BACKLOG-04**: User can drag item from backlog to timeline to assign date
- [ ] **BACKLOG-05**: User sees item count in backlog header (e.g., "À planifier (5)")
- [ ] **BACKLOG-06**: User can collapse/expand backlog sidebar
- [ ] **BACKLOG-07**: Backlog shows client name for each item with visual indicator

### Mobile & Responsive

- [ ] **MOBILE-01**: Interface is responsive and usable on mobile devices
- [ ] **MOBILE-02**: Timeline view adapts to mobile screen (scrollable, readable)
- [ ] **MOBILE-03**: Touch targets are appropriately sized for mobile interaction
- [ ] **MOBILE-04**: Forms and client cards are mobile-friendly

### Web Brief Preview & Zoning

- [x] **WBPZ-01**: Sections have stable UUID identity (not array-index based)
- [x] **WBPZ-02**: Unknown layout roles show a visible fallback placeholder with option to generate
- [x] **WBPZ-03**: Intelligent layout matching maps similar roles to existing layouts before showing fallback
- [x] **WBPZ-04**: Navigation renders hierarchical submenus when children are present
- [x] **WBPZ-05**: User can delete a page (removes page + sections + nav entry)
- [x] **WBPZ-06**: User can reorder sections within a page via drag & drop
- [x] **WBPZ-07**: User can add and delete individual sections within a page
- [x] **WBPZ-08**: Section edit form dynamically adapts to all content keys (not hardcoded fields)
- [x] **WBPZ-09**: Single AI button for re-prompting (replaces separate Yam + Réécrire buttons)
- [x] **WBPZ-10**: AI rewrite agent re-reads full strategy context (brand platform, copywriter text, report) before rewriting

### Retroplanning IA

- [x] **RETRO-01**: AI reads existing brief content (web-brief, brief, report) to deduce project milestones
- [x] **RETRO-02**: AI adapts milestones to detected project type (no fixed template)
- [x] **RETRO-03**: Retroplanning computed backward from user-supplied deadline
- [x] **RETRO-04**: Retroplanning data persisted per client in Supabase (JSONB tasks)
- [x] **RETRO-05**: Store CRUD actions for retroplanning (load, save, delete)
- [x] **RETRO-06**: Gantt chart visualization with horizontal bars per task in client detail
- [x] **RETRO-07**: User can drag-move and resize Gantt bars to adjust dates
- [x] **RETRO-08**: User can edit task details via inline form (label, dates, color)

### Layout Gallery & Variants

- [ ] **LGAL-01**: Visual gallery displays all existing layouts (standard + custom) with scaled live preview cards
- [ ] **LGAL-02**: Gallery accessible from WikiView via dedicated button/section
- [ ] **LGAL-03**: Gallery accessible from LayoutPicker in SectionDrawer via gallery button
- [ ] **LGAL-04**: User can create layout variants from the gallery (calls existing generate-layout API)
- [ ] **LGAL-05**: Variants are distinct components (not overwriting base layouts), registered in custom-layouts.ts
- [ ] **LGAL-06**: User can select a variant from gallery and apply it to current section (onSelectRole callback)
- [ ] **LGAL-07**: AI prompt editing — user provides instruction, AI modifies existing layout code
- [ ] **LGAL-08**: Manual code editing — user can view and edit layout TSX code directly
- [ ] **LGAL-09**: Read-layout API endpoint to serve layout file content to the client
- [ ] **LGAL-10**: Wiki updated with Layout Gallery feature entry

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Attachments & Search

- **ATTACH-01**: User can attach files to client (briefs, assets, contracts)
- **SEARCH-01**: User can search clients by name
- **SEARCH-02**: User can filter clients by status (prospect/client)

### Advanced Timeline

- **TIME-06**: User can export timeline to iCal/Google Calendar
- **VIEW-01**: User can switch to alternative views (list, kanban)

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Custom Fields/Databases | Notion-style flexibility creates complexity. Fixed data model maintains simplicity. |
| Advanced Permissions/Roles | Team is small (10-20 clients). Simple shared access sufficient for v1. |
| Time Tracking | Separate concern. Focus on "what" and "when," not "how long." |
| Automated Workflows | Adds complexity. Users prefer manual control at this scale. |
| Real-time Collaboration | Not needed for MVP. Simple save/refresh model sufficient. |
| Reporting/Analytics | Visual timeline and status views show health at a glance. No separate reports needed. |
| Email Integration | Feature bloat. Keep focused on timeline and client management. |
| Extensive Customization | Contradicts minimalist goal. Opinionated defaults only. |
| Gantt Chart Dependencies | Overkill for small agency. Simple sequential arrangement sufficient. |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| FOUND-01 | Phase 1 | Pending |
| FOUND-02 | Phase 1 | Pending |
| FOUND-03 | Phase 1 | Pending |
| TIME-01 | Phase 1 | Pending |
| TIME-02 | Phase 1 | Pending |
| TIME-03 | Phase 1 | Pending |
| TIME-04 | Phase 1 | Pending |
| CLIENT-01 | Phase 2 | Pending |
| CLIENT-02 | Phase 2 | Pending |
| CLIENT-03 | Phase 4 | Pending |
| CLIENT-04 | Phase 4 | Pending |
| CLIENT-05 | Phase 2 | Pending |
| CLIENT-06 | Phase 2 | Pending |
| DELIV-01 | Phase 3 | Pending |
| DELIV-02 | Phase 3 | Pending |
| DELIV-03 | Phase 3 | Pending |
| DELIV-04 | Phase 3 | Pending |
| DELIV-05 | Phase 3 | Pending |
| DELIV-06 | Phase 3 | Pending |
| CLIENT-01 | Phase 2 | Pending |
| CLIENT-02 | Phase 2 | Pending |
| CLIENT-03 | Phase 4 | Pending |
| CLIENT-04 | Phase 4 | Pending |
| CLIENT-05 | Phase 2 | Pending |
| CLIENT-06 | Phase 2 | Pending |
| LINK-01 | Phase 2 | Pending |
| LINK-02 | Phase 2 | Pending |
| LINK-03 | Phase 2 | Pending |
| DELIV-01 | Phase 3 | Pending |
| DELIV-02 | Phase 3 | Pending |
| DELIV-03 | Phase 3 | Pending |
| DELIV-04 | Phase 3 | Pending |
| DELIV-05 | Phase 3 | Pending |
| DELIV-06 | Phase 3 | Pending |
| DELIV-07 | Phase 3 | Pending |
| DELIV-08 | Phase 3 | Pending |
| CALL-01 | Phase 3 | Pending |
| CALL-02 | Phase 3 | Pending |
| TEAM-01 | Phase 1 | Pending |
| TEAM-02 | Phase 1 | Pending |
| TEAM-03 | Phase 1 | Pending |
| FILTER-01 | Phase 1 | Pending |
| FILTER-02 | Phase 1 | Pending |
| FILTER-03 | Phase 1 | Pending |
| FILTER-04 | Phase 1 | Pending |
| FILTER-05 | Phase 1 | Pending |
| DOC-01 | Phase 4 | Pending |
| DOC-02 | Phase 4 | Pending |
| DOC-03 | Phase 4 | Pending |
| DOC-04 | Phase 4 | Pending |
| DOC-05 | Phase 4 | Pending |
| DOC-06 | Phase 4 | Pending |
| DOC-07 | Phase 4 | Pending |
| TIME-05 | Phase 1 | Pending |
| BACKLOG-01 | Phase 3 | Pending |
| BACKLOG-02 | Phase 3 | Pending |
| BACKLOG-03 | Phase 3 | Pending |
| BACKLOG-04 | Phase 3 | Pending |
| BACKLOG-05 | Phase 3 | Pending |
| BACKLOG-06 | Phase 3 | Pending |
| BACKLOG-07 | Phase 3 | Pending |
| MOBILE-01 | Phase 5 | Pending |
| MOBILE-02 | Phase 5 | Pending |
| MOBILE-03 | Phase 5 | Pending |
| MOBILE-04 | Phase 5 | Pending |

**Coverage:**
- v1 requirements: 50 total
- Mapped to phases: 50
- Unmapped: 0

---
*Requirements defined: 2026-02-13*
*Last updated: 2026-02-13 after code review and documentation sync*

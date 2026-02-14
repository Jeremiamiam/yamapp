# Feature Landscape

**Domain:** Client/Project Management System for Communication Agencies
**Researched:** 2026-02-13
**Confidence:** HIGH

## Table Stakes

Features users expect. Missing = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Client Contact Storage** | Core CRM function - names, emails, phones, notes | Low | Centralized database with easy retrieval. Single source of truth for client information. |
| **Client/Project List View** | Users need to see all clients at a glance | Low | Standard in all PM tools. List/card view with filtering. |
| **Timeline/Calendar View** | Industry standard for viewing project schedules | Medium | Horizontal timeline showing deliverables, calls, deadlines over time. Gantt-style or simplified timeline. |
| **Task/Deliverable Tracking** | Core PM function - what needs to be done and when | Medium | Status tracking (pending, in progress, completed). Due dates and assignments. |
| **File Attachments** | Clients expect to attach documents, images, briefs | Low | File storage associated with clients/projects. Common requirement in all client management tools. |
| **Basic Search/Filter** | With 10-20 clients, users need to find information quickly | Low | Search by client name, project, status. Filter by active/prospect. |
| **Mobile Access** | Remote work is standard - access from anywhere | Medium | Responsive design or mobile-friendly interface. Critical for on-the-go agencies. |
| **Client Status Distinction** | Separate prospects from active clients | Low | Pipeline stages or simple status field. Essential for sales/client lifecycle. |

## Differentiators

Features that set product apart. Not expected, but valued.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Ultra-Minimalist UI** | Addresses "Notion fatigue" - visual-first, text-light | Medium | Dyslexia-friendly: clean fonts (Arial, Verdana), high contrast, generous spacing, icons over text, no dense paragraphs. |
| **Horizontal Timeline as Primary View** | Visual-first approach - see entire client lifecycle at a glance | Medium | Makes timeline the main interface, not buried in menus. Reduces cognitive load. Unique positioning vs Notion/Asana. |
| **Client Cards with Text Files** | Lightweight note-taking without database complexity | Low-Medium | Simple text files attached to client cards. Avoids Notion's overwhelming database architecture. |
| **Mock Data Mode** | Start with sample data to validate UX before real data | Low | Pre-populated demo clients/projects. Allows immediate UX testing. Reduces onboarding friction. |
| **Visual Pipeline Stages** | Color-coded or icon-based status at a glance | Low-Medium | No text-heavy status labels. Visual indicators for prospect/client/paused/completed. |
| **Zero Configuration Setup** | No onboarding, customization, or training required | Medium | Opinionated design - works out of box. Opposite of Notion's blank slate problem. |
| **Single-Screen Overview** | All critical info visible without navigation | Medium | Dashboard shows timeline + client cards + upcoming deliverables in one view. Reduces context switching. |

## Anti-Features

Features to explicitly NOT build.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Custom Fields/Databases** | Notion-style flexibility = complexity. User is fleeing this. | Fixed, opinionated data model: clients have contacts, deliverables, calls, text notes. Period. |
| **Advanced Permissions/Roles** | 10-20 clients, small team. Overkill. | Single user or simple shared access. Defer complex permissions to v2+ if needed. |
| **Time Tracking** | Scope creep. Separate concern from client/timeline management. | Focus on "what" and "when," not "how long." Integrate with existing time tools if needed. |
| **Automated Workflows** | Adds complexity. User wants simple and visual. | Manual updates. Agencies this size prefer control over automation. |
| **Real-time Collaboration** | Small team, not needed for MVP. Complex infrastructure. | Simple save/refresh model. Avoid WebSocket complexity. |
| **Reporting/Analytics** | Dashboard should be visual enough to not need reports. | Visual timeline and status views show health at a glance. No separate reporting layer. |
| **Email Integration** | Feature bloat. Client wants focused tool, not email. | Keep focused on timeline/client management. Email stays in email apps. |
| **Extensive Customization** | Opposite of goal - minimize complexity. | Opinionated defaults. Maybe allow theme colors, but not restructuring. |
| **Gantt Chart Dependencies** | Overkill for small agency. Adds visual and conceptual complexity. | Simple timeline view without dependency arrows. Sequential arrangement is enough. |

## Feature Dependencies

```
Client Contact Storage (foundation)
    └──requires──> Client/Project List View
                       └──requires──> Timeline/Calendar View
                                          └──enables──> Task/Deliverable Tracking

Client Status Distinction ──enables──> Visual Pipeline Stages

File Attachments ──enhances──> Client Cards with Text Files

Mock Data Mode (independent, enables early UX validation)

Single-Screen Overview
    └──requires──> Horizontal Timeline as Primary View
    └──requires──> Client Cards with Text Files
    └──requires──> Visual Pipeline Stages
```

### Dependency Notes

- **Client Contact Storage is the foundation** - all other features build on having client entities in the system
- **Timeline View requires Client/Project data** - can't show timeline without entities to display
- **Single-Screen Overview is the UX goal** - requires multiple features working together to avoid navigation/context switching
- **Mock Data Mode is independent** - can exist from day one to enable UX testing before real data entry
- **Visual Pipeline Stages enhances Status Distinction** - takes basic status field and makes it visual/intuitive

## MVP Recommendation

### Launch With (v1)

Minimum viable product - what's needed to validate the concept.

- **Client Contact Storage** - Foundation. Name, email, phone, basic notes. No complex fields yet.
- **Client Status Distinction** - Prospect vs Client toggle/dropdown. Core to agency workflow.
- **Horizontal Timeline View** - Primary interface. Shows clients and key dates horizontally. This is the differentiator.
- **Client Cards** - Clickable cards showing client name, status, next deliverable. Opens detail view.
- **Text File Notes** - Simple text notes attached to each client (lightweight alternative to Notion databases).
- **Mock Data Mode** - 5-10 pre-populated sample clients to validate UX immediately.
- **Basic Task/Deliverable List** - What's due and when. Simple list per client with dates.
- **Visual Status Indicators** - Color or icon showing prospect/active/completed at a glance.

**Why this set**: Validates core hypothesis - can horizontal timeline + client cards + minimal text replace Notion for this use case? Keeps scope tight, enables quick build/test cycle.

### Add After Validation (v1.x)

Features to add once core is working and validated with real agency use.

- **File Attachments** - Add after text notes work. Briefs, assets, contracts per client. (Wait for: Real need validated)
- **Search/Filter** - Add when client list grows beyond 10-15. Not critical for initial test. (Wait for: User reports difficulty finding clients)
- **Calls/Meetings Tracking** - Currently just "deliverables." Expand to distinguish calls from deliverables. (Wait for: User feedback on what needs tracking)
- **Mobile Optimization** - After desktop UX validated. Responsive design refinement. (Wait for: Desktop version proven useful)
- **Calendar Export** - Export timeline to iCal/Google Calendar for external sync. (Wait for: Users request integration)
- **Multi-view Options** - Alternative views (list, kanban) beyond timeline. (Wait for: Timeline-first approach validated)

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- **Team Collaboration** - Multi-user access, comments, assignments. (Why defer: Solo/small team for now. Complex infrastructure.)
- **Email Notifications** - Reminders for upcoming deliverables. (Why defer: Avoid notification fatigue. Users check dashboard.)
- **Archiving System** - Move completed clients to archive. (Why defer: 10-20 clients manageable without archive for v1.)
- **Custom Fields** - Allow adding 1-2 custom fields per client if needed. (Why defer: Goes against minimalism. Only if users strongly request.)
- **Integration APIs** - Connect to other tools (time tracking, accounting). (Why defer: Adds scope. Focus on standalone value first.)
- **Advanced Timeline** - Zoom, multi-month views, year-over-year. (Why defer: Validate basic timeline first.)

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Client Contact Storage | HIGH | LOW | P1 |
| Horizontal Timeline View | HIGH | MEDIUM | P1 |
| Client Status Distinction | HIGH | LOW | P1 |
| Client Cards | HIGH | LOW | P1 |
| Mock Data Mode | HIGH | LOW | P1 |
| Text File Notes | HIGH | LOW | P1 |
| Basic Task/Deliverable List | HIGH | LOW | P1 |
| Visual Status Indicators | MEDIUM | LOW | P1 |
| File Attachments | MEDIUM | LOW | P2 |
| Search/Filter | MEDIUM | LOW | P2 |
| Mobile Optimization | MEDIUM | MEDIUM | P2 |
| Calls/Meetings Tracking | MEDIUM | LOW | P2 |
| Calendar Export | LOW | MEDIUM | P3 |
| Multi-view Options | LOW | MEDIUM | P3 |
| Team Collaboration | LOW | HIGH | P3 |
| Email Notifications | LOW | MEDIUM | P3 |
| Archiving System | LOW | LOW | P3 |
| Custom Fields | LOW | MEDIUM | P3 |

**Priority key:**
- P1: Must have for launch - validates core hypothesis
- P2: Should have, add when P1 validated - enhances core workflow
- P3: Nice to have, future consideration - expansion features

## Competitor Feature Analysis

| Feature | Notion | Asana/Monday.com | YAM Dashboard Approach |
|---------|--------|------------------|------------------------|
| **Data Model** | Flexible databases, infinite customization | Projects/tasks hierarchy, boards | Fixed, opinionated: clients → deliverables/calls/notes |
| **Primary View** | Blank page or database table | List/board/timeline views | Horizontal timeline (always visible) |
| **Complexity** | High - users must design structure | Medium - many views/options | Ultra-low - single-screen, minimal navigation |
| **Note-taking** | Rich blocks, databases, embeds | Comments on tasks | Simple text files per client |
| **Visual Design** | Text-heavy, nested pages | Icon-heavy, colorful | Visual-first, dyslexia-friendly (large fonts, high contrast) |
| **Setup Time** | Hours to days (blank slate problem) | 30-60 minutes (project setup) | Zero (mock data preloaded) |
| **Client Management** | Custom database required | Not primary focus (task-centric) | Primary focus - clients are first-class entities |
| **Pipeline Stages** | Custom status property | Board columns or custom fields | Built-in prospect/client distinction |
| **Timeline View** | Available but buried in views | Available, task-focused | Primary interface, client-focused |

## Key Insights from Research

### What Small Agencies Actually Need

Based on research into Notion alternatives and agency pain points:

1. **Simplicity over flexibility** - Small agencies (10-20 clients) don't need infinite customization. They need a tool that works immediately. (Source: [Notion Alternatives research](https://www.nuclino.com/alternatives/notion-alternatives))

2. **Visual-first interfaces reduce cognitive load** - Dyslexia-friendly design principles benefit all users: clear fonts, generous spacing, icons over text, high contrast. (Source: [Dyslexia Design Best Practices](https://smart-interface-design-patterns.com/articles/dyslexia-design/))

3. **Horizontal timelines are standard but underutilized as primary view** - Most tools have timeline views, but bury them. Making timeline the default view is differentiating. (Source: [Project Timeline Tools](https://www.projectmanager.com/blog/best-project-timeline-software))

4. **Prospect vs. client distinction is essential for agencies** - CRMs focus on sales pipeline, project tools focus on tasks. Agencies need both integrated. (Source: [Client Management vs CRM](https://monday.com/blog/crm-and-sales/client-management-software/))

### Common Mistakes to Avoid

From agency management research:

1. **Over-complicating communication tools** - Multiple tools = lost information. Single source of truth is critical. (Source: [Agency Mistakes](https://www.e2msolutions.com/blog/common-mistakes-agency-owners/))

2. **Lack of visual clarity** - Text-heavy systems increase cognitive load, especially for dyslexic users. (Source: [Dyslexia Design](https://www.smashingmagazine.com/2021/11/dyslexia-friendly-mode-website/))

3. **Feature bloat** - Tools like Notion grow to do everything, serving small agencies poorly. Focus beats flexibility for this market. (Source: [Notion Alternatives for Small Teams](https://monday.com/blog/project-management/notion-alternatives/))

## Sources

### Client Management Research
- [27 of the Best CRM Software Companies to Know About for 2026](https://solutionsreview.com/crm/2026/01/05/best-crm-companies-to-know-about/)
- [33 CRM Features Your Small Business Needs in 2026](https://www.onepagecrm.com/blog/crm-features/)
- [Client Management Software: 20 Best Solutions Compared For 2026](https://monday.com/blog/crm-and-sales/client-management-software/)
- [22 Best Client Management Software Reviewed in 2026](https://thedigitalprojectmanager.com/tools/client-management-software/)
- [Contact Management Strategies for Sales Success](https://mailchimp.com/resources/contact-management/)

### Project Timeline Research
- [11 Best Project Timeline Software of 2026 (Free + Paid)](https://www.projectmanager.com/blog/best-project-timeline-software)
- [30 Best Project Timeline Tools To Stay on Track In 2026](https://thedigitalprojectmanager.com/tools/best-project-timeline-management-software/)
- [Timeline Software for Teams: Top 12 Tools in 2026](https://monday.com/blog/project-management/free-timeline-software/)
- [Project timelines: A guide to PERT and Gantt Charts](https://business.adobe.com/blog/basics/project-timeline)

### Minimalist Tools & Alternatives
- [Notion alternatives: best tools for enterprise workflows in 2026](https://monday.com/blog/project-management/notion-alternatives/)
- [18 Best Notion Alternatives in 2026 (Free & Paid Competitors)](https://www.nuclino.com/alternatives/notion-alternatives)
- [Best Simple Project Management Software in 2026](https://www.nuclino.com/solutions/simple-project-management-software)
- [Visual and Simple Online Project Management Tool | Casual](https://casual.pm/)
- [P3.express -- The minimalist project management system](https://p3.express/)

### Agency-Specific Research
- [Agency Client Reporting: Best Dashboards Guide 2026](https://koanthic.com/en/agency-client-reporting-best-dashboards-guide-2026/)
- [Top 10 Client Dashboard Software for Agencies in 2026](https://www.fanruan.com/en/blog/top-client-dashboard-software-for-agencies)
- [Client Management Strategies for Agencies to Build Better Relationships](https://basecamp.com/articles/effective-client-management-strategies-for-agencies)
- [Agency Client Retention: Common Mistakes & Expert Tips](https://whatagraph.com/blog/articles/agency-client-retention)

### Dyslexia-Friendly Design
- [How To Design For Users With Dyslexia — Smart Interface Design Patterns](https://smart-interface-design-patterns.com/articles/dyslexia-design/)
- [Adding A Dyslexia-Friendly Mode To A Website — Smashing Magazine](https://www.smashingmagazine.com/2021/11/dyslexia-friendly-mode-website/)
- [Designing for Dyslexia - Medium](https://medium.com/branding101/designing-for-dyslexia-9e61945f82b0)
- [Designing for dyslexic users – SiteLint](https://www.sitelint.com/blog/designing-for-dyslexic-users)

### Visual Project Management
- [What is Visual Project Management? | Miro](https://miro.com/project-management/what-is-visual-project-management/)
- [A Step-by-Step Guide to Visual Project Management for Faster Project Delivery](https://creately.com/blog/diagrams/visual-project-management/)
- [Visual project management](https://www.pmi.org/learning/library/visual-project-management-visual-elements-9862)

### Prospect/Client Pipeline
- [Sales pipelines: A comprehensive walkthrough for sales leaders and reps](https://blog.hubspot.com/sales/sales-pipeline)
- [Sales Pipeline Management: The Complete Guide | Salesforce](https://www.salesforce.com/sales/pipeline/management/)
- [Understanding CRM and sales pipeline management](https://www.hellobonsai.com/blog/crm-and-pipeline-management)

---
*Feature research for: YAM Dashboard - Client/Project Management for Communication Agencies*
*Researched: 2026-02-13*
*Confidence: HIGH (multiple verified sources across all feature categories)*

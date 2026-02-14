# Technology Stack

**Project:** YAM Dashboard
**Domain:** Client Management Web App with Timeline Visualization
**Researched:** 2026-02-13
**Overall Confidence:** HIGH

## Executive Summary

The 2025/2026 standard for building a client management web app centers on **Next.js 16 with React 19**, providing a full-stack framework with built-in optimization, server components, and edge rendering. For a minimal, mock-data-first project like YAM Dashboard, this stack offers rapid development with TypeScript safety, built-in routing, and straightforward deployment.

**Key Decision:** Use Next.js App Router (not Pages Router) - it's the modern standard and enables server components that reduce JavaScript bundle size, critical for accessibility and performance.

## Recommended Stack

### Core Framework

| Technology | Version | Purpose | Why Recommended | Confidence |
|------------|---------|---------|-----------------|------------|
| **Next.js** | 16.1+ | Full-stack React framework | Industry standard (68% developer adoption), handles SSR/SSG/API routes in one framework. Turbopack now stable for faster builds. Best DX for React apps in 2026. | HIGH |
| **React** | 19.2+ | UI library | Stable release with Activity API, improved hydration. Next.js 16 uses React 19 by default. The foundation of modern web apps. | HIGH |
| **TypeScript** | 5.3+ | Type-safe JavaScript | Now considered standard (not optional) for professional projects. Catches errors early, improves refactoring safety. Next.js has excellent TS support. | HIGH |
| **Node.js** | 20 LTS | Runtime | LTS version, stable for Next.js development. | HIGH |

### Database & ORM

| Technology | Version | Purpose | Why Recommended | Confidence |
|------------|---------|---------|-----------------|------------|
| **SQLite** | Latest | Embedded database | Perfect for 10-20 clients, mock-data-first approach. Zero configuration, portable, single file. Move to PostgreSQL only when scaling beyond prototype. | HIGH |
| **Drizzle ORM** | Latest | TypeScript ORM | Code-first approach (no separate schema language), lightweight, SQL transparency. Faster than Prisma for serverless. Best for small-to-medium projects in 2026. | MEDIUM |

**Alternative for Production Scale:** PostgreSQL + Prisma (if scaling beyond 100+ clients with concurrent writes).

### Styling & UI

| Technology | Version | Purpose | Why Recommended | Confidence |
|------------|---------|---------|-----------------|------------|
| **Tailwind CSS** | 3.4+ | Utility-first CSS | Industry standard for rapid UI development. Excellent for minimalist design. Tree-shakable for small bundles. | HIGH |
| **CSS Modules** | Built-in | Scoped CSS | Next.js native support. Use for custom, component-specific styles where Tailwind is too verbose. | HIGH |

**Minimalist Alternative:** If Tailwind feels too heavy, consider Pure CSS or Skeleton, but Tailwind's popularity and ecosystem make it the safer choice.

### Timeline Visualization

| Technology | Version | Purpose | Why Recommended | Confidence |
|------------|---------|---------|-----------------|------------|
| **vis-timeline** | 7.7+ | Timeline component | Mature, interactive, highly customizable. Horizontal timeline perfect for client/deliverable visualization. Multiple React wrappers available. | MEDIUM |
| **react-vis-timeline** | Latest | React wrapper | Simplifies vis-timeline integration with React. Uses DataSet for efficient updates. | MEDIUM |

**Alternative:** Build custom timeline with CSS Grid/Flexbox if design requirements are minimal and you want total control.

### State Management

| Technology | Version | Purpose | When to Use | Confidence |
|------------|---------|---------|-------------|------------|
| **Zustand** | 5+ | Client state | Lightweight (40% smaller than Redux), minimal boilerplate. Perfect for UI state, user preferences, form state. 30%+ YoY growth. | HIGH |
| **TanStack Query** | 5+ | Server state | Replaces 80% of Redux boilerplate. Handles API caching, synchronization, invalidation. The default for server data in 2026. | HIGH |
| **React useState/useReducer** | Built-in | Local state | For component-level state that doesn't need to be shared. No library needed. | HIGH |

**Anti-pattern:** Don't use Redux for a 10-20 client app. It's overkill and adds complexity.

### Form Handling

| Technology | Version | Purpose | Why Recommended | Confidence |
|------------|---------|---------|-----------------|------------|
| **React Hook Form** | 7.54+ | Form management | Performance-focused (uncontrolled components), minimal re-renders. Best TypeScript support. More actively maintained than Formik. | HIGH |
| **Zod** | 3.24+ | Schema validation | TypeScript-first validation. Integrates seamlessly with React Hook Form. Replaces Yup for TS projects. | HIGH |

### Date/Time Handling

| Technology | Version | Purpose | Why Recommended | Confidence |
|------------|---------|---------|-----------------|------------|
| **date-fns** | 4+ | Date manipulation | Modular, tree-shakable (smallest bundle), 39M+ weekly downloads. Best for projects that don't need complex timezone handling. | HIGH |

**Alternatives:**
- **dayjs** if migrating from Moment.js
- **Luxon** if timezone/i18n are critical (but heavier)

### Development Tools

| Tool | Purpose | Why Recommended | Confidence |
|------|---------|-----------------|------------|
| **ESLint** | Linting | Catches bugs, enforces style. Next.js includes config. | HIGH |
| **Prettier** | Code formatting | Auto-format on save. Eliminates style debates. | HIGH |
| **Turbopack** | Bundler | Built into Next.js 16 by default. Faster than Webpack. | HIGH |

## Installation

```bash
# Create Next.js app with TypeScript
npx create-next-app@latest yam-dashboard --typescript --tailwind --app --no-src-dir

# Core dependencies
cd yam-dashboard
npm install zustand @tanstack/react-query date-fns react-hook-form zod
npm install drizzle-orm better-sqlite3
npm install react-vis-timeline vis-timeline

# Dev dependencies
npm install -D drizzle-kit @types/better-sqlite3
npm install -D eslint-config-prettier prettier

# Optional: Zod integration with React Hook Form
npm install @hookform/resolvers
```

## Alternatives Considered

| Category | Recommended | Alternative | When to Use Alternative | Confidence |
|----------|-------------|-------------|-------------------------|------------|
| **Framework** | Next.js | Remix, Astro | Remix for complex data mutations; Astro for content-heavy sites. Next.js is the standard for React apps. | HIGH |
| **Database** | SQLite | PostgreSQL | PostgreSQL when scaling beyond prototype (100+ concurrent users, complex queries). | HIGH |
| **ORM** | Drizzle | Prisma | Prisma for enterprise projects with large teams (better DX, slower performance). | MEDIUM |
| **State (Client)** | Zustand | Jotai, Redux Toolkit | Jotai for atomic state; RTK for legacy codebases. Zustand has best balance. | HIGH |
| **State (Server)** | TanStack Query | RTK Query, SWR | RTK Query if already using Redux; SWR for simpler needs. TanStack Query is most popular. | HIGH |
| **Forms** | React Hook Form | Formik, TanStack Form | Formik for massive enterprise forms (but less maintained); TanStack Form for newest features. | HIGH |
| **Styling** | Tailwind CSS | CSS Modules, Styled Components | CSS Modules for full control; Styled Components for CSS-in-JS preference. | HIGH |
| **Timeline** | vis-timeline | Custom CSS Grid | Custom for minimal requirements and total design control. vis-timeline for rich interactions. | MEDIUM |

## What NOT to Use

| Avoid | Why | Use Instead | Confidence |
|-------|-----|-------------|------------|
| **Create React App** | Deprecated, no longer maintained. Missing SSR, routing, optimization. | Next.js | HIGH |
| **Moment.js** | Deprecated, huge bundle size (67KB). | date-fns (11KB) | HIGH |
| **Redux (without RTK)** | Too much boilerplate for small apps. Overkill for client state. | Zustand + TanStack Query | HIGH |
| **Formik** | Less actively maintained (though renewed activity). Slower than RHF. | React Hook Form | MEDIUM |
| **Pages Router (Next.js)** | Legacy. App Router is the future. | App Router | HIGH |
| **Webpack** | Slower than Turbopack. Turbopack is default in Next.js 16. | Turbopack (built-in) | HIGH |

## Stack Patterns by Variant

### Minimal Mock-First (Recommended for Phase 1)
**For:** Prototype with static mock data, validate UX
```
Next.js + TypeScript + Tailwind + Mock JSON
- No database initially
- Static data in /data/clients.json
- Focus on timeline visualization and UX
```

### Database-Backed (Phase 2)
**For:** Real data persistence, CRUD operations
```
Next.js + TypeScript + Tailwind + SQLite + Drizzle
- Add Drizzle schema and migrations
- Seed with mock data
- Keep SQLite (single file, portable)
```

### Production-Ready (Phase 3+)
**For:** Multi-user, concurrent access, deployment
```
Next.js + TypeScript + Tailwind + PostgreSQL + Drizzle
- Migrate from SQLite to PostgreSQL
- Add authentication (NextAuth.js)
- Deploy to Vercel/Railway/Render
```

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| Next.js 16+ | React 19 | Next.js 16 requires React 19 (automatic) |
| React Hook Form 7.54+ | React 19 | Fully compatible |
| TanStack Query 5+ | React 19 | Official support |
| Drizzle ORM | SQLite, PostgreSQL | Database-agnostic, easy migration path |
| vis-timeline 7+ | React 19 | Use react-vis-timeline wrapper |

## Deployment Options

| Platform | Best For | Free Tier | Notes | Confidence |
|----------|----------|-----------|-------|------------|
| **Vercel** | Next.js (creators) | Yes (hobby use only) | Best DX, automatic preview deployments. Can be expensive at scale. | HIGH |
| **Railway** | Full-stack with DB | Yes (5 USD credit/month) | Simple database integration. Good for prototypes. | HIGH |
| **Cloudflare Pages** | Cost-conscious | Yes (unlimited) | Excellent free tier. Edge network. Commercial use allowed. | MEDIUM |
| **Render** | Traditional hosting | Yes (limited) | Heroku alternative. Good for PostgreSQL. | MEDIUM |

**Recommendation:** Start with Vercel for development (best Next.js integration). Evaluate Railway or Cloudflare Pages if costs become an issue.

## Accessibility Considerations (Dyslexia-Friendly)

Given the user's dyslexia requirement, these stack choices support accessibility:

- **Tailwind CSS:** Easy to implement larger text, high contrast, clear spacing
- **Next.js:** Built-in font optimization (next/font) for readable typefaces
- **vis-timeline:** Visual representation reduces text dependency
- **TypeScript:** Catches errors early, reducing cognitive load during debugging

**Recommended additions:**
- Use next/font with OpenDyslexic or Comic Sans MS as fallback
- Implement high-contrast color scheme
- Large clickable areas (Tailwind: `p-4`, `text-xl`)
- Minimal text, maximum visual clarity

## Sources

### High Confidence (Official Documentation & Context7)
- [Next.js Official Docs](https://nextjs.org/docs) - Version 16.1.6 confirmed, App Router recommended
- [React Official Docs](https://react.dev/blog/2025/10/01/react-19-2) - React 19.2 stable release
- [Next.js 15 Release Notes](https://nextjs.org/blog/next-15) - React 19 support, Turbopack stable
- [Vercel React Best Practices](https://vercel.com/blog/introducing-react-best-practices) - Modern patterns

### Medium Confidence (Multiple Credible Sources)
- [React & Next.js in 2025 - Modern Best Practices](https://strapi.io/blog/react-and-nextjs-in-2025-modern-best-practices) - Industry adoption stats
- [Prisma vs Drizzle ORM in 2026](https://medium.com/@thebelcoder/prisma-vs-drizzle-orm-in-2026-what-you-really-need-to-know-9598cf4eaa7c) - ORM comparison
- [Top 5 React State Management Tools 2026](https://www.syncfusion.com/blogs/post/react-state-management-libraries) - State management trends
- [Best React Form Libraries in 2026](https://www.latestly.in/post/best-react-form-libraries-in-2026) - Form handling comparison
- [date-fns vs dayjs vs luxon comparison](https://npm-compare.com/date-fns,dayjs,luxon,moment) - Download stats and features
- [PostgreSQL vs SQLite comparison](https://www.selecthub.com/relational-database-solutions/postgresql-vs-sqlite/) - Database decision factors
- [10 Vercel Alternatives 2026](https://www.digitalocean.com/resources/articles/vercel-alternatives) - Deployment options

### Timeline Visualization
- [vis-timeline official docs](https://visjs.github.io/vis-timeline/docs/timeline/) - Library features
- [react-vis-timeline GitHub](https://github.com/razbensimon/react-vis-timeline) - React integration

---

**Confidence Assessment:** HIGH overall. Core stack (Next.js, React, TypeScript, Tailwind) is industry standard with massive adoption. Database (SQLite → PostgreSQL) and ORM (Drizzle) are pragmatic choices for the project's scale. Timeline visualization is MEDIUM confidence as it depends on specific design requirements.

**Recommendation:** Start with this stack. It's proven, well-documented, and matches 2026 best practices for React web apps.

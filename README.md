# SurveyCraft

A full-stack survey and analytics platform that allows users to create dynamic forms, collect responses, and gain actionable insights through real-time analytics.

The application supports building customizable forms with multiple question types — text, number, boolean, date, and single/multi-choice — including **conditional logic** (questions can be shown or hidden based on previous answers, with AND/OR rule groups) and a **question-by-question** response mode alongside the classic all-at-once view.

The analytics module goes beyond simple aggregates: it tracks, per question, how many respondents actually *saw* it (`shownCount`), how many saw it but skipped it (`skippedCount`), and how many never saw it because a condition hid it (`hiddenCount`) — and visualizes the branching paths respondents took through the form.

This project demonstrates end-to-end ownership of a non-trivial feature (conditional logic) across a full stack: graph validation and cycle detection, server-side security invariants, cross-framework state management, and a genuine Module Federation micro-frontend — not just CRUD.

## Architecture

```
SurveyCraft/                      (pnpm workspace)
├── backend/                      Node.js + TypeScript + Express + Prisma + BullMQ
├── react-frontend/                React host: builder, viewer, dashboard, auth
├── vue-analytics/                 Vue 3 micro-frontend (Module Federation remote)
├── packages/
│   ├── condition-engine/          Pure conditional-logic engine (evaluate/validate)
│   └── shared-types/              DTOs shared across all three apps
└── docker-compose.yml             Postgres + Redis for local dev
```

**Tech stack**

| | |
|---|---|
| Backend | Node.js, TypeScript, Express, Prisma, PostgreSQL, BullMQ, Redis, JWT auth |
| React app | React 19, React Router, TanStack Query, Zustand, Tailwind, Vite |
| Vue remote | Vue 3, Composition API, Vite, `@originjs/vite-plugin-federation` |
| Shared | pnpm workspaces, Zod validation, Vitest |

## Getting started

```bash
git clone ...
cd SurveyCraft

pnpm install
pnpm approve-builds        # one-time: approve postinstall scripts for bcrypt/prisma/esbuild

cp .env.example .env
cp backend/.env.example backend/.env
pnpm docker:up              # Postgres + Redis via docker-compose

cd backend
npx prisma migrate dev
npx prisma generate

pnpm dev:backend            # terminal 1
pnpm dev:frontend           # terminal 2 - React app on :5173

# Optional: analytics micro-frontend (only needed to see the Vue-rendered
# Overview tab locally - vite-plugin-federation needs a real build, not
# just `vite dev`, to generate remoteEntry.js)
pnpm --filter vue-analytics build
pnpm --filter vue-analytics preview   # terminal 3 - serves remoteEntry.js on :5174
```

### Environment variables

Create a `.env` file inside `backend/` with the following variables:

```dotenv
DATABASE_URL="postgresql://surveycraft:surveycraft@localhost:5432/surveycraft"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="change-me-in-production"
```

`react-frontend/.env` (optional):

```dotenv
VITE_API_URL=http://localhost:5001/api
VITE_VUE_ANALYTICS_URL=http://localhost:5174   # defaults to this if unset
```

## Architecture decisions

A few choices in this codebase were deliberate trade-offs, not defaults — worth calling out explicitly rather than leaving them implicit.

**Why Module Federation, and why page-level (not embedded)?**
The analytics "Overview" tab is a Vue 3 remote consumed by the React host. Cross-framework federation means the Vue runtime is *not* shared with React — it ships as its own bundle inside the remote (~260KB gzipped for the Vue shared chunk), a real bundle-size cost in exchange for framework isolation. This was a deliberate scope decision: swap only the tab that needed the new branching data, not the whole page (the "Сирі відповіді" / raw-responses-and-export tab stays React, since porting export functionality wasn't part of the scope). Mounting happens once per tab-activation (`createApp(...).mount()` / `.unmount()` in `VueAnalyticsHost.tsx`) — no live JS bridge between the two frameworks after mount; the Vue app fetches its own data directly from the backend.

**Vite 8 / Rolldown compatibility**
This Vite version defaults to Rolldown rather than Rollup. `@originjs/vite-plugin-federation` is historically a Rollup-hooks plugin with no explicit Rolldown compatibility guarantee. This was verified empirically (not assumed) by running real `vite build`s on both the remote and the host and inspecting the generated `remoteEntry.js` — it works, including the plugin's automatic CSS-chunk injection (`dynamicLoadingCss`) with content-hashed filenames, so the host never needs to hardcode a CSS URL.

**Conditional logic: operator scope is honest about what the evaluator can do**
The condition editor only offers `gt`/`lt` for `NUMBER` targets, not `DATE` — because `evaluateCondition` compares `gt`/`lt` numerically, and an ISO date string doesn't satisfy that check. Rather than silently producing rules that never evaluate `true`, the UI simply doesn't offer the combination. Similarly, a question's `condition` can only reference an earlier question (enforced server-side via `validateConditionGraph`, using cycle detection over the rule graph, not just simple "earlier index" checks) — this is also what guarantees the *first* question in a form can never carry a condition, which the step-by-step viewer's navigation logic relies on.

**Server-side visibility recalculation is not just for UX**
`submitResponse` recomputes which questions were visible from the raw submitted answers, server-side, before validating requiredness — a client could otherwise submit answers for hidden required fields to bypass validation, or omit answers for a required field by claiming (client-side) that it was hidden. `Response.visibleQuestionIds` persists that server-computed truth, which the analytics module (`shownCount`/`skippedCount`/`hiddenCount`, the paths endpoint) depends on for correctness — not just what the client happened to render.

**The paths endpoint is not funnel analytics**
`GET /:formId/analytics/paths` shows how popular each branch was *among completed responses* — a `Response` row is only created on a fully valid submit, so mid-form abandonment is currently invisible to analytics. True funnel/drop-off tracking would need a separate "draft response" concept with incremental autosave, which is out of scope here.

## Testing

```bash
pnpm test              # all workspace packages
pnpm test:backend       # backend only (245 tests)
pnpm --filter @surveycraft/condition-engine test   # pure logic (16 tests)
```

## Screenshots

![dashboard](/assets/dashboardScreenshot.png)
![builder](/assets/builderScreenshot.png)
![public](/assets/publicScreenshot.png)
![dashboard2](/assets/dashboard2Screenshot.png)
![analytics](/assets/analyticsScreenshot.png)

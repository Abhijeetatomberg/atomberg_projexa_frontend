# Atomberg Projexa — Frontend

React rebuild of the original single-file Projexa HTML app (`Atomberg_Projexa_-_1_July_v31.html`),
built with **Vite + React 18 + axios + Tailwind CSS + shadcn/ui**, backed by the
Express/Drizzle API in `../atomberg_projexa_backend`.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173 (proxies /api → http://localhost:4000)
```

The backend must be running first (`npm run dev` in `atomberg_projexa_backend`).
For a production build: `npm run build` (set `VITE_API_BASE` if the API is not
served from the same origin under `/api`).

## Sign in

Login is backed by `POST /api/users/login`. **On an empty `users` table, the
first login bootstraps that account as admin** — so a fresh install is never
locked out. Admins manage further accounts in the User List module.

## Modules

| Route | Module | Notes |
|---|---|---|
| `/dashboard` | Dashboard | KPIs, NPD/POC portfolio bars, overdue risk list |
| `/rfq` | RFQ Tracking | Pipeline: Draft → R&D → Costing → BD → Won/Lost; winning creates an NPD project |
| `/poc` | POC Projects | KO → Alpha → Beta → Beta 2 → Customer approval, stage task plans, promote to NPD |
| `/npd` | NPD Projects | Charter → KO generates AB-0…AB-7 task plan, gate applicability by CAT 1–6, exit criteria & deliverables checklists |
| `/bom` | BOM Tracking | Parts, suppliers, tooling, FPA status |
| `/line` | Line Readiness | Process/machine/fixture readiness |
| `/samples` | Sample Submission | Request → assembly → inspection → submission |
| `/reviews` | Weekly Review | Meeting notes per project + MOM action items |
| `/pending` | Pending Tasks | Aggregates open NPD/POC tasks, actions, samples & PPAP |
| `/ppap` | PPAP Docs | One-click 18-element checklist per project |
| `/ai` | Ask AI | Chat over live data via `POST /api/ai/ask` (needs `ANTHROPIC_API_KEY` on the backend) |
| `/trials` | Trial Tracker | Request form, 6 HOD approvals, execution & closure |
| `/ecn` | ECN Tracker | Change notices with stock run-down dates |
| `/investment` `/budget` | Investment / Budget | Capex list, plan-vs-actual with variance |
| `/resources` | Resources | Team allocation & load |
| `/standards` | Standards Library | Controlled documents with revisions |
| `/users` | User List | Admin-only account management |

## Where things live

```
src/
  api/          axios client + one CRUD helper per backend resource
  lib/          constants.js (domain vocabularies), gates.json (AB-gate & POC
                templates extracted from the original HTML), npd.js / poc.js
                (ported plan/progress logic), utils.js
  components/
    ui/         shadcn/ui components (button, card, dialog, select, table, …)
    crud/       CrudPage — generic list/search/add/edit/delete used by the flat modules
    Layout.jsx  sidebar navigation (NAV is the single source of module metadata)
  pages/        one page per module
  context/      AuthContext (login state, persisted to localStorage)
```

The original HTML file is kept in the repo root as the design reference.

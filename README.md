# Distributed Energy Monitor

**Real-time operator UI for distributed energy assets** — solar PV, battery storage (Powerwall-class SoC), and EV charging — with an IoT-style telemetry publisher, Postgres + Realtime, and a Playwright suite built for live data.

[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?logo=typescript&logoColor=white)](./tsconfig.app.json)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Realtime-3FCF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![Playwright](https://img.shields.io/badge/E2E-Playwright-2EAD33?logo=playwright&logoColor=white)](./e2e)
[![CI](https://img.shields.io/badge/CI-GitHub_Actions-2088FF?logo=githubactions&logoColor=white)](./.github/workflows/e2e.yml)

Built by [Andrea López](https://github.com/andrea1u3) as a portfolio system for **Distributed Energy Systems / energy software / diagnostic UI** roles.

---

## Start here (this README is the technical intro)

If you open one portfolio repo today, this is what I want you to take away:

1. **I treat live telemetry as a product problem**, not a chart demo. Generation (kW), battery SoC (%), and EV load must update in seconds, survive connection loss, and never render `undefined` into an operator’s face.
2. **I separate the device layer from the UI layer.** A standalone Node simulator publishes like an edge gateway; the React app only reads — same privilege model you’d want in production.
3. **I design for the interview *and* the next engineer.** Schema indexes, RLS, failure states, Docker/Vercel paths, and E2E that don’t depend on a flaky live WebSocket in CI.

Telemetry is simulated (no hardware). Status rules are explicit heuristics, not a full EMS. That honesty is intentional: the architecture is meant to be extended, not oversold.

> **60-second code walk:** [`simulator/telemetrySimulator.ts`](./simulator/telemetrySimulator.ts) → [`supabase/schema.sql`](./supabase/schema.sql) → [`src/hooks/useEnergyReadings.ts`](./src/hooks/useEnergyReadings.ts) → [`e2e/fixtures/testFixtures.ts`](./e2e/fixtures/testFixtures.ts)

Deep-dive talking points: [`docs/INTERVIEW_GUIDE.md`](./docs/INTERVIEW_GUIDE.md)

---

## What it does

| Surface | Behavior |
|--------|----------|
| Power balance chart | Solar (kW) vs EV load (kW), last 24h, 5-minute buckets |
| Battery gauge | Live SoC with critical alert below **15%** |
| Site status | Generating / charging battery / exporting / importing / EV charging / idle |
| Connection UX | `connecting` → `connected` → `disconnected` / `error`, with retry |
| Edge simulator | Diurnal solar curve, EV sessions, SoC response to net power every 3–5s |

Stack: **React 19 · TypeScript · Vite · Tailwind · Recharts · Supabase (Postgres + Realtime) · Playwright · Docker**

---

## Architecture

```
┌──────────────────────────┐         INSERT 3–5s          ┌─────────────────────────┐
│  IoT telemetry simulator │ ───────────────────────────► │  PostgreSQL (Supabase)  │
│  /simulator              │   secret / service role      │  energy_readings        │
│  (edge / gateway role)   │                              │  + Realtime publication │
└──────────────────────────┘                              └────────────┬────────────┘
                                                                       │ WebSocket
                                                                       │ postgres_changes
                                                                       ▼
                                                          ┌─────────────────────────┐
                                                          │  React dashboard        │
                                                          │  anon key + RLS (read)  │
                                                          │  Recharts + status UI   │
                                                          └─────────────────────────┘
```

### Decisions I’d defend in a design review

| Decision | Why | Trade-off |
|----------|-----|-----------|
| **Realtime (WebSocket) over REST polling** | Operators need second-scale kW/SoC; push on `INSERT` avoids idle poll tax | Requires connection-state UX and reconnect story |
| **Simulator ≠ frontend** | Mirrors edge write / UI read; secrets never enter the Vite bundle | Two processes to run locally (realistic, not accidental) |
| **RLS: anon SELECT only** | Least privilege for a browser client | Writes need a privileged path (simulator / future device auth) |
| **Time-range indexes first** | Dashboard query shape is “last N hours by asset” | At thousands of assets you’d add `asset_id`, partitions, rollups |
| **E2E bridge (`?e2eMock=1`) instead of live Supabase in CI** | Deterministic, fast, no shared secrets; same idea as a simulated diagnostic bus | Deliberate test seam in the app — documented, not hidden |

### Data model (built to grow)

`energy_readings (id, asset_type, value, unit, timestamp)`

- `(timestamp DESC)` — site-wide “last 24h”
- `(asset_type, timestamp DESC)` — per-stream series
- Realtime publication + RLS in [`supabase/schema.sql`](./supabase/schema.sql)
- Documented scale path: `assets` table → `asset_id` FK → range partitioning → retention / rollups

### Frontend resilience (operator UI, not happy-path only)

- Hydrate 24h history over REST, then subscribe to `INSERT`s
- Connection badge + alert when the channel drops
- Last-known values stay on screen (no wipe to blank/NaN)
- Battery critical banner when SoC &lt; 15%

---

## End-to-end testing — the non-obvious part

Live diagnostic UIs fail CI for boring reasons: WebSockets flake, shared backends race, and “sometimes green” teaches nothing. This suite treats that as an engineering constraint.

**Approach:** open the app with `?e2eMock=1` → mount `window.__DES_E2E__` ([`src/lib/e2eBridge.ts`](./src/lib/e2eBridge.ts)) → Playwright drives connection + telemetry like a fake bus. Specs also **abort** `*.supabase.co` traffic to prove isolation.

```
e2e/
  pages/DashboardPage.ts     # Page Object Model
  fixtures/testFixtures.ts   # realtime mock + dashboard fixture
  specs/*.spec.ts            # smoke, connection, disconnect, realtime, battery, a11y
.github/workflows/e2e.yml    # Chromium on every push / PR to main
```

**Coverage:** smoke modules · connecting→connected · disconnect without crash · push reading without reload · SoC alert · ARIA + keyboard retry.

```bash
npx playwright install chromium
npm run test:e2e
npm run test:e2e:ui
```

**Why POM?** Selectors live in one place; specs read as intent (`expect(dashboard.batteryAlert).toBeVisible()`). UI refactors don’t rewrite every assertion.

---

## Repo map

```
src/components/   Operator UI (chart, gauge, metrics, status, alerts)
src/hooks/        Realtime subscription + derived site state
src/lib/          Supabase client, status rules, chart buckets, E2E bridge
simulator/        Edge-style publisher (not in the browser bundle)
supabase/         DDL, indexes, RLS, Realtime
e2e/              Playwright POM + feature specs
docs/             Interview guide + screenshot placeholder
docker/           nginx for static container hosting
```

---

## Quick start

**Prereqs:** Node 20+, a free [Supabase](https://supabase.com) project.

```bash
# 1) Schema — paste supabase/schema.sql into the Supabase SQL Editor

# 2) Env
cp .env.example .env
# VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY  → dashboard (read)
# SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY    → simulator only (write)

# 3) Two terminals
npm install
npm run dev          # http://localhost:5173
npm run simulate     # telemetry every 3–5s
```

No simulator ⇒ UI can stay connected but no new points arrive (offline site behavior).

### Docker (UI)

```bash
docker build \
  --build-arg VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co \
  --build-arg VITE_SUPABASE_ANON_KEY=your_anon_key \
  -t des-energy-monitor .

docker run --rm -p 8080:80 des-energy-monitor
```

### Vercel (UI)

Import the repo → Vite → set **only** `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.  
Run the simulator elsewhere (local / Railway / Fly). Vercel is not an IoT worker.

---

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Vite dashboard |
| `npm run build` | Production build |
| `npm run simulate` | Edge telemetry → Supabase |
| `npm run test:e2e` | Playwright suite |
| `npm run test:e2e:ui` | Playwright UI mode |
| `npm run lint` | Oxlint |

---

## What’s next (if this became a product)

- `asset_id` + multi-site tenancy; time partitions + rollup tables for the 24h chart  
- Device auth (JWT / mTLS) instead of long-lived service role on the edge  
- Stronger EMS state machine (replace heuristics in [`src/lib/energyStatus.ts`](./src/lib/energyStatus.ts))  
- Contract tests between simulator payloads and UI types  

---

## Security

- `.env` is gitignored; only [`.env.example`](./.env.example) is committed  
- Rotate any key that ever appeared in chat, email, or a public gist  
- Secret / service-role keys must never ship in the browser bundle or Vercel env for this UI  

See also [`SECURITY.md`](./SECURITY.md).

---

## License

MIT — [`LICENSE`](./LICENSE)

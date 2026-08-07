# Distributed Energy Monitor

**Real-time monitoring dashboard for distributed energy assets** — solar PV, battery (Powerwall-class storage), and EV charging — built as a portfolio project for Distributed Energy Systems / energy software roles.

[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Realtime-3FCF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)

> Designed to demonstrate the same mental model used in residential / commercial energy products: **edge telemetry → time-series store → live operator UI**, with clear separation between the device layer and the visualization layer.

---

## Why this project

Teams working on distributed energy (solar + storage + EV) need operators and homeowners to see **generation, state of charge, and load** update within seconds—not after a page refresh. This repo shows:

| Concern | Approach in this project |
|--------|---------------------------|
| Live telemetry | Supabase Realtime (WebSocket) over Postgres `INSERT`s |
| Device vs UI | Standalone IoT simulator process (not coupled to React) |
| Time-series queries | Indexed `energy_readings` table sized for range scans |
| Safety / UX | Battery SoC alerts, connection loss handling, derived site status |
| Least privilege | Browser uses anon key + RLS (read-only); simulator uses secret key |

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

### Realtime vs REST polling (interview-ready)

| | REST polling | Supabase Realtime |
|---|---|---|
| Latency | Bound to poll interval | Push on each `INSERT` |
| API / DB load | N clients × poll rate, even when idle | Traffic only when data changes |
| Fit for EMS / DES | Fine for slow dashboards | Better for live kW / SoC monitoring |

### Schema designed to grow

Table `energy_readings (id, asset_type, value, unit, timestamp)` with:

1. Index on `(timestamp DESC)` — “last 24h” site views  
2. Composite index on `(asset_type, timestamp DESC)` — per-asset series  
3. RLS: public/anon **SELECT** only; writes from privileged IoT credentials  
4. Documented scale path: `asset_id` + `assets` table, time partitioning, retention jobs  

Full DDL: [`supabase/schema.sql`](./supabase/schema.sql)

### Frontend resilience

- Loading state while hydrating 24h history  
- Connection badge: connecting / connected / disconnected / error  
- Manual refetch if the Realtime channel drops  
- Visual alert when battery SoC &lt; 15%

---

## Features

- **Line chart** — solar generation (kW) vs EV consumption (kW), last 24h  
- **Battery gauge** — live SoC (%)  
- **Status cards** — Generating, Charging battery, Exporting to grid, Importing, EV charging  
- **Alerts** — low battery + Realtime connectivity issues  
- **IoT simulator** — diurnal solar curve, EV charge sessions, battery SoC response to net power  

---

## Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, Recharts  
- **Backend / data:** Supabase (PostgreSQL + Realtime)  
- **Simulator:** Node (`tsx`) as a separate long-running process  

---

## Project layout

```
src/
  components/     Dashboard UI (chart, gauge, status, alerts)
  hooks/          Realtime subscription + derived site state
  lib/            Supabase client, chart bucketing, status rules
  types/          Domain types
simulator/        IoT-style telemetry publisher (not in the browser bundle)
supabase/         Schema, indexes, RLS, Realtime publication
docker/           nginx config for containerized static hosting
docs/             Interview talking points & screenshot placeholder
```

---

## Quick start

### Prerequisites

- Node.js 20+  
- A free [Supabase](https://supabase.com) project  

### 1. Database

In the Supabase **SQL Editor**, run the full contents of [`supabase/schema.sql`](./supabase/schema.sql).

### 2. Environment

```bash
cp .env.example .env
```

Fill in:

| Variable | Used by | Notes |
|----------|---------|--------|
| `VITE_SUPABASE_URL` | Dashboard | Project URL |
| `VITE_SUPABASE_ANON_KEY` | Dashboard | Publishable / anon key (read via RLS) |
| `SUPABASE_URL` | Simulator | Same project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Simulator only | **Never** put this in Vercel or the frontend |

### 3. Run (two terminals)

```bash
npm install
npm run dev          # http://localhost:5173
```

```bash
npm run simulate     # publishes solar / battery / EV every 3–5s
```

Without the simulator, the UI stays connected but no new telemetry arrives—same as an offline site.

---

## Docker

```bash
docker build \
  --build-arg VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co \
  --build-arg VITE_SUPABASE_ANON_KEY=your_anon_key \
  -t des-energy-monitor .

docker run --rm -p 8080:80 des-energy-monitor
```

Run `npm run simulate` separately (edge process is not inside the static image).

---

## Deploy on Vercel

1. Push this repo to GitHub and import it in [Vercel](https://vercel.com/new).  
2. Framework preset: **Vite**.  
3. Set env vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` only.  
4. Deploy.

Keep the simulator on a local machine or a small always-on worker (Railway, Fly.io, etc.). Vercel serves the UI; it does not run long-lived IoT publishers.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Vite dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run simulate` | IoT telemetry → Supabase |
| `npm run lint` | Oxlint |

---

## Interview notes

See [`docs/INTERVIEW_GUIDE.md`](./docs/INTERVIEW_GUIDE.md) for concise talking points (Realtime vs polling, RLS, scale path, failure modes)—useful when walking a recruiter or hiring manager through the repo.

---

## Security

- `.env` is gitignored. Only `.env.example` is committed.  
- Rotate any key that was ever pasted into chat, email, or a public gist.  
- Secret / service-role keys must never ship in the browser bundle or Vercel env for this UI.

---

## License

MIT — see [LICENSE](./LICENSE).

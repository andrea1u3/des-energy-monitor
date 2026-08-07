# Interview guide — Distributed Energy Monitor

Use this when presenting the repo to a recruiter or engineer (e.g. energy / DES / vehicle–grid software). Keep answers short; point at files.

---

## 30-second pitch

> “I built a real-time distributed energy dashboard: solar generation, battery state of charge, and EV charging load. An IoT-style simulator publishes telemetry into Postgres every few seconds; the React UI subscribes over WebSockets so operators see updates without polling or refreshing. I separated the device writer from the read-only dashboard and designed the schema for time-range queries at scale.”

---

## Architecture decisions (expect these questions)

### Why Realtime instead of polling?

- Operators care about **seconds**, not minute-old averages.  
- Polling wastes requests when nothing changed and still adds average latency of half the interval.  
- Realtime pushes on `INSERT` → lower load, lower latency.  
- Code: `src/hooks/useEnergyReadings.ts`

### Why is the simulator a separate process?

- Mirrors production: **edge / gateway writes**, **UI only reads**.  
- Secret credentials never enter the Vite bundle.  
- You can restart or replace the simulator without redeploying the UI.  
- Code: `simulator/telemetrySimulator.ts`

### How would this scale to thousands of assets?

Current demo uses `asset_type` for three logical streams. Growth path:

1. Add `assets(id, site_id, type, …)` and `asset_id` on readings.  
2. Keep composite indexes `(asset_id, timestamp DESC)`.  
3. Partition `energy_readings` by time; add retention (hot vs cold).  
4. Optionally pre-aggregate (5‑min rollups) for the 24h chart.  
- Code: comments in `supabase/schema.sql`

### What about security?

- RLS: anon can `SELECT` only.  
- Writes require secret / service role (simulator).  
- Browser never gets write privileges.  
- Realtime still respects SELECT policies for clients.

### What if the WebSocket drops?

- Connection badge shows disconnected / error.  
- User can refetch 24h history over REST.  
- Channel subscription is cleaned up on unmount.  
- Code: `ConnectionBadge`, `AlertBanner`, `useEnergyReadings`

### How do status cards work?

Simple, explainable rules on latest solar / battery / EV values (export vs import, charging, idle)—see `src/lib/energyStatus.ts`. Easy to replace later with a real EMS state machine.

---

## Demo script (2 minutes)

1. Open the dashboard → show **Realtime activo**.  
2. Point at live kW / SoC changing without refresh.  
3. Open the simulator terminal → show INSERT cadence.  
4. Open `schema.sql` → indexes + RLS + Realtime publication.  
5. Mention Docker + Vercel deploy path for the UI.

---

## Honest scope (good to say)

- Telemetry is **simulated**, not from hardware.  
- Status rules are **heuristics**, not a full EMS.  
- Chart aggregation is **client-side** 5‑minute buckets (fine for portfolio; production would use rollups or a TSDB).

Saying what you would harden next shows maturity.

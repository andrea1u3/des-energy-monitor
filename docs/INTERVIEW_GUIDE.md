# Interview guide — Distributed Energy Monitor

Companion to the root README. Use this when walking a recruiter or engineer through the repo. Keep answers short; **point at files**.

---

## 30-second pitch

> “I built a real-time distributed energy operator UI: solar generation, battery SoC, and EV load. An IoT-style simulator publishes into Postgres every few seconds; the React app subscribes over WebSockets so values update without polling or refresh. I separated edge write from UI read, designed the schema for time-range queries, and added Playwright E2E that mocks the live bus so CI stays deterministic.”

---

## If they only open five files

| File | What it proves |
|------|----------------|
| [`simulator/telemetrySimulator.ts`](../simulator/telemetrySimulator.ts) | Edge/device layer is not tangled with React |
| [`supabase/schema.sql`](../supabase/schema.sql) | Indexes, RLS, Realtime, scale notes |
| [`src/hooks/useEnergyReadings.ts`](../src/hooks/useEnergyReadings.ts) | History + subscribe + connection failure modes |
| [`src/lib/e2eBridge.ts`](../src/lib/e2eBridge.ts) | Deliberate test seam for live telemetry |
| [`e2e/pages/DashboardPage.ts`](../e2e/pages/DashboardPage.ts) | POM — maintainable E2E for a diagnostic UI |

---

## Expect these questions

### Why Realtime instead of polling?

- Operators care about **seconds**, not minute-old averages.  
- Polling wastes requests when nothing changed and adds ~½-interval average latency.  
- Realtime pushes on `INSERT` → lower load, lower latency.  
- Code: `src/hooks/useEnergyReadings.ts`

### Why is the simulator a separate process?

- Production shape: **edge writes**, **UI reads**.  
- Secret credentials never enter the Vite bundle.  
- Restart or replace the publisher without redeploying the UI.  
- Code: `simulator/telemetrySimulator.ts`

### How would this scale to thousands of assets?

Demo uses `asset_type` for three streams. Growth path:

1. `assets(id, site_id, type, …)` + `asset_id` on readings  
2. Composite indexes `(asset_id, timestamp DESC)`  
3. Partition by time; retention (hot vs cold)  
4. Pre-aggregate 5‑min rollups for the 24h chart  

Code: comments in `supabase/schema.sql`

### How do you E2E a Realtime UI without flaky CI?

- Don’t depend on a shared live WebSocket in GitHub Actions.  
- `?e2eMock=1` mounts `window.__DES_E2E__` — same idea as a simulated vehicle diagnostic feed.  
- Abort real Supabase traffic in fixtures; drive connect / disconnect / push reading.  
- POM keeps selectors out of assertions.  
- Code: `src/lib/e2eBridge.ts`, `e2e/fixtures/testFixtures.ts`, `.github/workflows/e2e.yml`

### What if the WebSocket drops?

- Badge → disconnected / error; alert + retry.  
- Last-known telemetry remains (no `undefined` wipe).  
- Channel cleaned up on unmount.  
- Code: `ConnectionBadge`, `AlertBanner`, `useEnergyReadings`

### Security model?

- RLS: anon **SELECT** only.  
- Writes: secret / service role (simulator).  
- Browser never gets write privileges.

---

## Demo script (2 minutes)

1. Dashboard → **Realtime activo**, live kW / SoC.  
2. Simulator terminal → INSERT cadence.  
3. `schema.sql` → indexes + RLS + publication.  
4. `npm run test:e2e` or open an `e2e/specs/*` file → bridge + POM.  
5. Mention Docker / Vercel for the UI only.

---

## Honest scope (say this)

- Telemetry is **simulated**, not from hardware.  
- Status rules are **heuristics**, not a full EMS.  
- Chart aggregation is **client-side** 5‑minute buckets (portfolio-correct; production → rollups / TSDB).

Naming the next hardening step reads as maturity, not weakness.

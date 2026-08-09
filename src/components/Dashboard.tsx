import { useMemo } from 'react'
import { buildChartSeries } from '../lib/chartData'
import { useDerivedEnergy } from '../hooks/useDerivedEnergy'
import { useEnergyReadings } from '../hooks/useEnergyReadings'
import { AlertBanner } from './AlertBanner'
import { BatteryGauge } from './BatteryGauge'
import { ConnectionBadge } from './ConnectionBadge'
import { MetricStrip } from './MetricStrip'
import { SolarConsumptionChart } from './SolarConsumptionChart'
import { StatusCards } from './StatusCards'

/**
 * Vista principal del dashboard.
 * Orquesta datos (hook Realtime) → derivados → componentes presentacionales.
 */
export function Dashboard() {
  const { readings, connection, loading, error, refetch } = useEnergyReadings()
  const { latest, statuses, batteryCritical } = useDerivedEnergy(readings)
  const chartData = useMemo(() => buildChartSeries(readings), [readings])

  return (
    <div className="min-h-screen text-[var(--color-ink)]" data-testid="dashboard-root">
      <header className="border-b border-[var(--color-line)] bg-[color-mix(in_srgb,var(--color-surface)_88%,transparent)] backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-5 px-4 py-5 sm:px-6">
          <div className="anim-fade-up min-w-0">
            <div className="mb-2 flex items-center gap-3">
              <span
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--color-ink)] text-[var(--color-surface)]"
                aria-hidden
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M13 2L4 14h7l-1 8 10-14h-7l0-6z"
                    fill="currentColor"
                  />
                </svg>
              </span>
              <p className="section-label !tracking-[0.2em] text-[var(--color-battery)]">
                Distributed Energy Systems
              </p>
            </div>
            <h1
              className="font-display text-3xl font-semibold tracking-tight text-[var(--color-ink)] sm:text-[2.15rem]"
              data-testid="dashboard-title"
            >
              Energy Monitor
            </h1>
            <p className="mt-1.5 max-w-lg text-sm leading-relaxed text-[var(--color-ink-muted)]">
              Site telemetry — solar generation, battery SoC, and EV load in
              real time.
            </p>
          </div>
          <div className="anim-fade-up anim-delay-1">
            <ConnectionBadge state={connection} />
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-6 sm:gap-6 sm:px-6 sm:py-8">
        <div className="anim-fade-up anim-delay-1">
          <AlertBanner
            batteryCritical={batteryCritical}
            connectionError={error}
            onRetry={() => void refetch()}
          />
        </div>

        {loading ? (
          <div
            data-testid="dashboard-loading"
            className="panel flex flex-col items-center justify-center gap-3 px-6 py-16 text-center"
          >
            <span className="h-2 w-2 rounded-full bg-[var(--color-solar)] live-dot" />
            <p className="text-sm text-[var(--color-ink-muted)]">
              Cargando historial de las últimas 24h…
            </p>
          </div>
        ) : (
          <>
            <div className="anim-fade-up anim-delay-2">
              <MetricStrip latest={latest} />
            </div>

            <div className="anim-fade-up anim-delay-3 grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
              <SolarConsumptionChart data={chartData} />
              <BatteryGauge
                percent={latest.battery?.value ?? null}
                critical={batteryCritical}
                updatedAt={latest.battery?.timestamp}
              />
            </div>

            <div className="anim-fade-up anim-delay-4">
              <StatusCards statuses={statuses} />
            </div>
          </>
        )}

        <footer className="border-t border-[var(--color-line)] pt-5 text-xs text-[var(--color-ink-muted)]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span>Edge simulator · 3–5s telemetry cadence</span>
            <span className="font-mono tracking-wide">DES / portfolio</span>
          </div>
        </footer>
      </main>
    </div>
  )
}

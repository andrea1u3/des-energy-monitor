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
    <div className="min-h-screen text-slate-900">
      <header className="border-b border-slate-200/80 bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-5 sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">
              Distributed Energy Systems
            </p>
            <h1 className="font-display text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              Energy Monitor
            </h1>
            <p className="mt-1 max-w-xl text-sm text-slate-600">
              Telemetría en tiempo real de solar, batería y carga EV vía Supabase
              Realtime.
            </p>
          </div>
          <ConnectionBadge state={connection} />
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6">
        <AlertBanner
          batteryCritical={batteryCritical}
          connectionError={error}
          onRetry={() => void refetch()}
        />

        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-white/80 p-10 text-center text-slate-600 shadow-sm">
            Cargando historial de las últimas 24h…
          </div>
        ) : (
          <>
            <MetricStrip latest={latest} />

            <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
              <SolarConsumptionChart data={chartData} />
              <BatteryGauge
                percent={latest.battery?.value ?? null}
                critical={batteryCritical}
                updatedAt={latest.battery?.timestamp}
              />
            </div>

            <StatusCards statuses={statuses} />
          </>
        )}

        <footer className="border-t border-slate-200/80 pt-4 text-xs text-slate-500">
          IoT simulator separated from the UI · telemetry every 3–5s · Distributed
          Energy Systems portfolio
        </footer>
      </main>
    </div>
  )
}

import { formatKw, formatPercent } from '../lib/energyStatus'
import type { LatestByAsset } from '../types/energy'

interface Props {
  latest: LatestByAsset
}

/** KPIs compactos de la última telemetría por asset. */
export function MetricStrip({ latest }: Props) {
  const items = [
    {
      label: 'Solar',
      value: latest.solar ? formatKw(latest.solar.value) : '—',
      accent: 'border-l-amber-500',
    },
    {
      label: 'Batería',
      value: latest.battery ? formatPercent(latest.battery.value) : '—',
      accent: 'border-l-teal-500',
    },
    {
      label: 'Carga EV',
      value: latest.ev_charger ? formatKw(latest.ev_charger.value) : '—',
      accent: 'border-l-blue-500',
    },
  ]

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {items.map((item) => (
        <div
          key={item.label}
          className={`rounded-lg border border-slate-200 border-l-4 ${item.accent} bg-white/80 px-4 py-3 shadow-sm`}
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {item.label}
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">
            {item.value}
          </p>
        </div>
      ))}
    </div>
  )
}

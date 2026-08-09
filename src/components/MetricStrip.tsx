import { formatKw, formatPercent } from '../lib/energyStatus'
import type { LatestByAsset } from '../types/energy'

interface Props {
  latest: LatestByAsset
}

/** KPIs compactos de la última telemetría por asset. */
export function MetricStrip({ latest }: Props) {
  const items = [
    {
      key: 'solar' as const,
      label: 'Solar generation',
      short: 'Solar',
      value: latest.solar ? formatKw(latest.solar.value) : '—',
      accent: 'var(--color-solar)',
      hint: 'PV output',
      testId: 'metric-solar',
    },
    {
      key: 'battery' as const,
      label: 'Battery SoC',
      short: 'Batería',
      value: latest.battery ? formatPercent(latest.battery.value) : '—',
      accent: 'var(--color-battery)',
      hint: 'Storage',
      testId: 'metric-battery',
    },
    {
      key: 'ev' as const,
      label: 'EV charge load',
      short: 'Carga EV',
      value: latest.ev_charger ? formatKw(latest.ev_charger.value) : '—',
      accent: 'var(--color-ev)',
      hint: 'Charger',
      testId: 'metric-ev',
    },
  ]

  return (
    <div
      className="grid gap-3 sm:grid-cols-3"
      data-testid="metric-strip"
      role="group"
      aria-label="Telemetría actual por asset"
    >
      {items.map((item) => (
        <div
          key={item.key}
          data-testid={item.testId}
          className="panel relative overflow-hidden px-4 py-4 transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5"
        >
          <span
            className="absolute inset-y-0 left-0 w-[3px]"
            style={{ background: item.accent }}
            aria-hidden
          />
          <div className="flex items-start justify-between gap-2 pl-1">
            <p className="section-label">{item.short}</p>
            <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--color-ink-muted)]">
              {item.hint}
            </span>
          </div>
          <p
            className="mt-2 pl-1 font-mono text-[1.65rem] font-semibold leading-none tracking-tight text-[var(--color-ink)] tabular-nums sm:text-3xl"
            data-testid={`${item.testId}-value`}
          >
            {item.value}
          </p>
          <p className="mt-2 pl-1 text-xs text-[var(--color-ink-muted)]">{item.label}</p>
        </div>
      ))}
    </div>
  )
}

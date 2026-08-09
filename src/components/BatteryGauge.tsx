import { BATTERY_LOW_THRESHOLD } from '../lib/energyStatus'

interface Props {
  percent: number | null
  critical: boolean
  updatedAt?: string | null
}

/**
 * Gauge circular SVG del SoC de la batería / Powerwall.
 */
export function BatteryGauge({ percent, critical, updatedAt }: Props) {
  const value = percent ?? 0
  const size = 200
  const stroke = 12
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const progress = Math.min(100, Math.max(0, value)) / 100
  const offset = circumference * (1 - progress)

  const strokeColor = critical
    ? '#b91c1c'
    : value < 40
      ? '#b45309'
      : '#0f766e'

  return (
    <section
      aria-label="Nivel de batería"
      data-testid="battery-gauge"
      data-battery-critical={critical ? 'true' : 'false'}
      className="panel flex h-full flex-col p-5 sm:p-6"
    >
      <div className="mb-4">
        <h2 className="section-label">Storage</h2>
        <p className="mt-1 font-display text-lg font-semibold tracking-tight text-[var(--color-ink)]">
          Batería / Powerwall
        </p>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center">
        <div className="relative" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="-rotate-90" aria-hidden>
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="#e4e9f0"
              strokeWidth={stroke}
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={strokeColor}
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className="transition-[stroke-dashoffset] duration-700 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              data-testid="battery-soc"
              className={`font-mono text-4xl font-semibold tracking-tight tabular-nums ${
                critical ? 'text-[var(--color-critical)]' : 'text-[var(--color-ink)]'
              }`}
            >
              {percent == null ? '—' : `${value.toFixed(1)}%`}
            </span>
            <span className="mt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--color-ink-muted)]">
              SoC
            </span>
          </div>
        </div>

        <p
          className={`mt-5 text-center text-sm ${
            critical ? 'font-medium text-[var(--color-critical)]' : 'text-[var(--color-ink-muted)]'
          }`}
        >
          {critical
            ? `Por debajo del umbral de alerta (${BATTERY_LOW_THRESHOLD}%)`
            : 'Rango operativo normal'}
        </p>
        {updatedAt && (
          <p className="mt-1 font-mono text-[11px] text-[var(--color-ink-muted)]">
            {new Date(updatedAt).toLocaleTimeString('es-MX', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })}
          </p>
        )}
      </div>
    </section>
  )
}

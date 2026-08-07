import { BATTERY_LOW_THRESHOLD } from '../lib/energyStatus'

interface Props {
  percent: number | null
  critical: boolean
  updatedAt?: string | null
}

/**
 * Gauge circular SVG del SoC de la batería / Powerwall.
 * Sin librería extra: path SVG + stroke-dasharray.
 */
export function BatteryGauge({ percent, critical, updatedAt }: Props) {
  const value = percent ?? 0
  const size = 180
  const stroke = 14
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const progress = Math.min(100, Math.max(0, value)) / 100
  const offset = circumference * (1 - progress)

  const strokeColor = critical
    ? '#e11d48'
    : value < 40
      ? '#d97706'
      : '#0d9488'

  return (
    <section
      aria-label="Nivel de batería"
      className="flex flex-col items-center rounded-xl border border-slate-200 bg-white/80 p-6 shadow-sm"
    >
      <h2 className="mb-4 self-start text-sm font-semibold uppercase tracking-wider text-slate-500">
        Batería / Powerwall
      </h2>

      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90" aria-hidden>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#e2e8f0"
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
            className={`text-3xl font-bold tabular-nums ${critical ? 'text-rose-600' : 'text-slate-900'}`}
          >
            {percent == null ? '—' : `${value.toFixed(1)}%`}
          </span>
          <span className="text-xs text-slate-500">SoC</span>
        </div>
      </div>

      <p className="mt-4 text-center text-sm text-slate-600">
        {critical
          ? `Por debajo del umbral de alerta (${BATTERY_LOW_THRESHOLD}%)`
          : 'Rango operativo normal'}
      </p>
      {updatedAt && (
        <p className="mt-1 text-xs text-slate-400">
          Actualizado{' '}
          {new Date(updatedAt).toLocaleTimeString('es-MX', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          })}
        </p>
      )}
    </section>
  )
}

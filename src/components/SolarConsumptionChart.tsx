import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { ChartPoint } from '../types/energy'

interface Props {
  data: ChartPoint[]
}

/** Gráfica generación solar vs consumo EV — últimas 24h (buckets ~5 min). */
export function SolarConsumptionChart({ data }: Props) {
  return (
    <section
      aria-label="Generación vs consumo"
      data-testid="solar-consumption-chart"
      className="panel flex flex-col p-5 sm:p-6"
    >
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="section-label">Power balance</h2>
          <p className="mt-1 font-display text-lg font-semibold tracking-tight text-[var(--color-ink)]">
            Generación vs consumo
          </p>
          <p className="mt-0.5 text-sm text-[var(--color-ink-muted)]">
            Últimas 24 h · agregación 5 min
          </p>
        </div>
        <div className="flex gap-4 font-mono text-[11px] text-[var(--color-ink-muted)]">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-sm bg-[var(--color-solar)]" />
            Solar
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-sm bg-[var(--color-ev)]" />
            EV load
          </span>
        </div>
      </div>

      <div className="h-72 w-full min-h-[18rem]">
        {data.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-[var(--color-line)] bg-[var(--color-surface-2)] text-sm text-[var(--color-ink-muted)]">
            <span>Sin serie temporal aún</span>
            <span className="font-mono text-xs">npm run simulate</span>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="2 6" stroke="#d8dee8" vertical={false} />
              <XAxis
                dataKey="time"
                tick={{ fill: '#5b657a', fontSize: 11, fontFamily: 'IBM Plex Mono' }}
                axisLine={{ stroke: '#d8dee8' }}
                tickLine={false}
                minTickGap={32}
              />
              <YAxis
                tick={{ fill: '#5b657a', fontSize: 11, fontFamily: 'IBM Plex Mono' }}
                unit=" kW"
                width={52}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 10,
                  border: '1px solid #d8dee8',
                  background: '#fff',
                  boxShadow: '0 8px 24px rgba(12, 18, 34, 0.08)',
                  fontSize: 12,
                  fontFamily: 'IBM Plex Sans',
                }}
                labelStyle={{ color: '#5b657a', marginBottom: 4 }}
                formatter={(value) => [`${Number(value).toFixed(2)} kW`, undefined]}
              />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="plainline"
                wrapperStyle={{ display: 'none' }}
              />
              <Line
                type="monotone"
                dataKey="solarKw"
                name="Solar"
                stroke="#c47a12"
                strokeWidth={2.25}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="consumptionKw"
                name="Consumo EV"
                stroke="#1d4f91"
                strokeWidth={2.25}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  )
}

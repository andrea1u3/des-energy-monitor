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
      className="rounded-xl border border-slate-200 bg-white/80 p-5 shadow-sm"
    >
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
            Generación vs consumo
          </h2>
          <p className="text-sm text-slate-600">Últimas 24 horas · buckets de 5 min</p>
        </div>
      </div>

      <div className="h-72 w-full">
        {data.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-slate-500">
            Sin datos aún. Ejecuta el simulador (`npm run simulate`).
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="time"
                tick={{ fill: '#64748b', fontSize: 11 }}
                minTickGap={28}
              />
              <YAxis
                tick={{ fill: '#64748b', fontSize: 11 }}
                unit=" kW"
                width={48}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 8,
                  borderColor: '#e2e8f0',
                  fontSize: 13,
                }}
                formatter={(value) => [`${Number(value).toFixed(2)} kW`, undefined]}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="solarKw"
                name="Solar"
                stroke="#d97706"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="consumptionKw"
                name="Consumo EV"
                stroke="#2563eb"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  )
}

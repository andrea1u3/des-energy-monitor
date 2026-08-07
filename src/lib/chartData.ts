import type { ChartPoint, EnergyReading } from '../types/energy'

const HOURS_24_MS = 24 * 60 * 60 * 1000

/**
 * Agrupa lecturas crudas en buckets de ~5 min para la gráfica de 24h.
 * Solar y EV se alinean por ventana de tiempo para comparar generación vs consumo.
 */
export function buildChartSeries(readings: EnergyReading[]): ChartPoint[] {
  const cutoff = Date.now() - HOURS_24_MS
  const bucketMs = 5 * 60 * 1000
  const buckets = new Map<number, { solar: number[]; ev: number[] }>()

  for (const r of readings) {
    const ts = new Date(r.timestamp).getTime()
    if (Number.isNaN(ts) || ts < cutoff) continue

    const key = Math.floor(ts / bucketMs) * bucketMs
    let bucket = buckets.get(key)
    if (!bucket) {
      bucket = { solar: [], ev: [] }
      buckets.set(key, bucket)
    }

    if (r.asset_type === 'solar') bucket.solar.push(r.value)
    if (r.asset_type === 'ev_charger') bucket.ev.push(r.value)
  }

  const avg = (arr: number[]) =>
    arr.length === 0 ? 0 : arr.reduce((a, b) => a + b, 0) / arr.length

  return [...buckets.entries()]
    .sort(([a], [b]) => a - b)
    .map(([timestamp, { solar, ev }]) => {
      const d = new Date(timestamp)
      const time = d.toLocaleTimeString('es-MX', {
        hour: '2-digit',
        minute: '2-digit',
      })
      return {
        time,
        timestamp,
        solarKw: Number(avg(solar).toFixed(2)),
        consumptionKw: Number(avg(ev).toFixed(2)),
      }
    })
}

/** Devuelve la lectura más reciente de una lista filtrada por asset. */
export function latestOf(
  readings: EnergyReading[],
  assetType: EnergyReading['asset_type'],
): EnergyReading | null {
  let best: EnergyReading | null = null
  for (const r of readings) {
    if (r.asset_type !== assetType) continue
    if (!best || r.timestamp > best.timestamp) best = r
  }
  return best
}

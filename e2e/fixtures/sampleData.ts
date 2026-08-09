import type { EnergyReading } from '../../src/types/energy'

/** Sample readings used across E2E fixtures (deterministic, interview-friendly). */
export const sampleReadings: EnergyReading[] = [
  {
    id: 1,
    asset_type: 'solar',
    value: 4.25,
    unit: 'kW',
    timestamp: new Date(Date.now() - 10 * 60_000).toISOString(),
  },
  {
    id: 2,
    asset_type: 'battery',
    value: 62.5,
    unit: '%',
    timestamp: new Date(Date.now() - 10 * 60_000).toISOString(),
  },
  {
    id: 3,
    asset_type: 'ev_charger',
    value: 1.8,
    unit: 'kW',
    timestamp: new Date(Date.now() - 10 * 60_000).toISOString(),
  },
]

export function reading(
  partial: Partial<EnergyReading> & Pick<EnergyReading, 'id' | 'asset_type' | 'value'>,
): EnergyReading {
  return {
    unit: partial.asset_type === 'battery' ? '%' : 'kW',
    timestamp: new Date().toISOString(),
    ...partial,
  }
}

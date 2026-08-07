import { useMemo } from 'react'
import { latestOf } from '../lib/chartData'
import {
  deriveSystemStatuses,
  isBatteryCritical,
} from '../lib/energyStatus'
import type { EnergyReading, LatestByAsset } from '../types/energy'

/** Deriva últimas lecturas, estados del sistema y alertas a partir del stream. */
export function useDerivedEnergy(readings: EnergyReading[]) {
  return useMemo(() => {
    const latest: LatestByAsset = {
      solar: latestOf(readings, 'solar'),
      battery: latestOf(readings, 'battery'),
      ev_charger: latestOf(readings, 'ev_charger'),
    }

    const statuses = deriveSystemStatuses(latest)
    const batteryCritical = isBatteryCritical(latest.battery?.value)

    return { latest, statuses, batteryCritical }
  }, [readings])
}

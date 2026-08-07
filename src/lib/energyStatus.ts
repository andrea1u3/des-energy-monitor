import type { DerivedStatus, LatestByAsset } from '../types/energy'

/** Umbral de alerta: batería por debajo de este % se considera crítica. */
export const BATTERY_LOW_THRESHOLD = 15

/** Umbral alto opcional (sobre-carga / saturación). */
export const BATTERY_HIGH_THRESHOLD = 95

/**
 * Deriva tarjetas de estado a partir de las últimas lecturas.
 * Reglas intencionalmente simples — fáciles de explicar en entrevista:
 *
 * - Generación > 0.1 kW → "Generando"
 * - Generación > consumo EV → "Exportando a red" (excedente)
 * - Generación < consumo EV → "Importando de red"
 * - Batería subiendo o generación > consumo con batería < 90% → "Cargando batería"
 * - Consumo EV > 0.5 kW → "Cargando EV"
 */
export function deriveSystemStatuses(latest: LatestByAsset): DerivedStatus[] {
  const solar = latest.solar?.value ?? 0
  const battery = latest.battery?.value ?? 0
  const ev = latest.ev_charger?.value ?? 0

  const net = solar - ev
  const isGenerating = solar > 0.1
  const isEvCharging = ev > 0.5
  const isExporting = net > 0.2
  const isImporting = net < -0.2
  // Heurística: si hay excedente y la batería no está casi llena, asumimos carga
  const isChargingBattery = isGenerating && battery < 90 && net > 0

  return [
    {
      id: 'generating',
      label: 'Generando',
      active: isGenerating,
      description: 'Paneles solares produciendo energía',
    },
    {
      id: 'charging_battery',
      label: 'Cargando batería',
      active: isChargingBattery,
      description: 'Excedente solar almacenándose en Powerwall',
    },
    {
      id: 'exporting_to_grid',
      label: 'Exportando a red',
      active: isExporting && !isChargingBattery,
      description: 'Generación mayor que consumo local',
    },
    {
      id: 'importing_from_grid',
      label: 'Importando de red',
      active: isImporting,
      description: 'Consumo supera la generación solar',
    },
    {
      id: 'ev_charging',
      label: 'Cargando EV',
      active: isEvCharging,
      description: 'Estación de carga activa',
    },
    {
      id: 'idle',
      label: 'En espera',
      active: !isGenerating && !isEvCharging,
      description: 'Sin generación ni carga significativa',
    },
  ]
}

export function isBatteryCritical(socPercent: number | null | undefined): boolean {
  if (socPercent == null) return false
  return socPercent < BATTERY_LOW_THRESHOLD
}

export function formatKw(value: number): string {
  return `${value.toFixed(2)} kW`
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`
}

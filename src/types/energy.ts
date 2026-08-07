/**
 * Tipos de dominio del dashboard de energía distribuida.
 * Separados del cliente Supabase para poder reutilizarlos en el simulador IoT.
 */

export type AssetType = 'solar' | 'battery' | 'ev_charger'

export type EnergyUnit = 'kW' | '%'

export interface EnergyReading {
  id: number
  asset_type: AssetType
  value: number
  unit: string
  timestamp: string
}

/** Punto agregado para la gráfica solar vs consumo (últimas 24h). */
export interface ChartPoint {
  time: string
  timestamp: number
  solarKw: number
  consumptionKw: number
}

/** Estados derivados de reglas simples de balance energético. */
export type SystemStatus =
  | 'generating'
  | 'charging_battery'
  | 'exporting_to_grid'
  | 'importing_from_grid'
  | 'ev_charging'
  | 'idle'

export interface DerivedStatus {
  id: SystemStatus
  label: string
  active: boolean
  description: string
}

export type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'error'

export interface LatestByAsset {
  solar: EnergyReading | null
  battery: EnergyReading | null
  ev_charger: EnergyReading | null
}

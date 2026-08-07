import { BATTERY_LOW_THRESHOLD } from '../lib/energyStatus'

interface Props {
  batteryCritical: boolean
  connectionError: string | null
  onRetry?: () => void
}

/**
 * Alertas visuales: batería baja y pérdida de Realtime.
 * Separadas del layout principal para no competir con las métricas.
 */
export function AlertBanner({ batteryCritical, connectionError, onRetry }: Props) {
  if (!batteryCritical && !connectionError) return null

  return (
    <div className="flex flex-col gap-2">
      {batteryCritical && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-lg border border-rose-300 bg-rose-50 px-4 py-3 text-rose-900"
        >
          <span className="mt-0.5 text-lg font-semibold" aria-hidden>
            !
          </span>
          <div>
            <p className="font-semibold">Alerta: batería crítica</p>
            <p className="text-sm text-rose-800/90">
              El estado de carga está por debajo de {BATTERY_LOW_THRESHOLD}%.
              Considera reducir carga EV o importar de la red.
            </p>
          </div>
        </div>
      )}

      {connectionError && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-amber-950"
        >
          <div>
            <p className="font-semibold">Problema de conexión Realtime</p>
            <p className="text-sm text-amber-900/90">{connectionError}</p>
          </div>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="rounded-md bg-amber-900 px-3 py-1.5 text-sm font-medium text-amber-50 hover:bg-amber-800"
            >
              Reintentar carga
            </button>
          )}
        </div>
      )}
    </div>
  )
}

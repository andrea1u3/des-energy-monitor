import { BATTERY_LOW_THRESHOLD } from '../lib/energyStatus'

interface Props {
  batteryCritical: boolean
  connectionError: string | null
  onRetry?: () => void
}

/**
 * Alertas visuales: batería baja y pérdida de Realtime.
 */
export function AlertBanner({ batteryCritical, connectionError, onRetry }: Props) {
  if (!batteryCritical && !connectionError) return null

  return (
    <div className="flex flex-col gap-3">
      {batteryCritical && (
        <div
          role="alert"
          data-testid="battery-alert"
          className="flex items-start gap-3 rounded-xl border border-[color-mix(in_srgb,var(--color-critical)_35%,transparent)] bg-[color-mix(in_srgb,var(--color-critical)_8%,white)] px-4 py-3.5 text-[var(--color-critical)]"
        >
          <span
            className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[var(--color-critical)] font-mono text-xs font-bold text-white"
            aria-hidden
          >
            !
          </span>
          <div>
            <p className="font-semibold tracking-tight">Alerta: batería crítica</p>
            <p className="mt-0.5 text-sm text-[color-mix(in_srgb,var(--color-critical)_85%,black)]">
              El estado de carga está por debajo de {BATTERY_LOW_THRESHOLD}%.
              Considera reducir carga EV o importar de la red.
            </p>
          </div>
        </div>
      )}

      {connectionError && (
        <div
          role="alert"
          data-testid="connection-alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[color-mix(in_srgb,var(--color-warn)_40%,transparent)] bg-[color-mix(in_srgb,var(--color-warn)_8%,white)] px-4 py-3.5 text-[var(--color-ink)]"
        >
          <div>
            <p className="font-semibold tracking-tight text-[var(--color-warn)]">
              Problema de conexión Realtime
            </p>
            <p className="mt-0.5 text-sm text-[var(--color-ink-muted)]">{connectionError}</p>
          </div>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              data-testid="retry-connection"
              className="rounded-lg bg-[var(--color-ink)] px-3.5 py-2 text-sm font-medium text-[var(--color-surface)] transition-colors hover:bg-[#1a2438]"
            >
              Reintentar carga
            </button>
          )}
        </div>
      )}
    </div>
  )
}

import type { ConnectionState } from '../types/energy'

const LABELS: Record<ConnectionState, string> = {
  connecting: 'Conectando…',
  connected: 'Realtime activo',
  disconnected: 'Desconectado',
  error: 'Error de conexión',
}

const DOT: Record<ConnectionState, string> = {
  connecting: 'bg-[var(--color-solar)] live-dot',
  connected: 'bg-[var(--color-ok)]',
  disconnected: 'bg-[var(--color-ink-muted)]',
  error: 'bg-[var(--color-critical)]',
}

interface Props {
  state: ConnectionState
}

/** Badge de estado del canal WebSocket Realtime. */
export function ConnectionBadge({ state }: Props) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={`Estado de conexión: ${LABELS[state]}`}
      data-testid="connection-badge"
      data-connection-state={state}
      className="inline-flex items-center gap-2.5 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-3.5 py-2 text-sm text-[var(--color-ink)]"
      title="Estado de la suscripción Supabase Realtime"
    >
      <span className={`h-2 w-2 rounded-full ${DOT[state]}`} aria-hidden />
      <span className="font-medium" data-testid="connection-label">
        {LABELS[state]}
      </span>
      <span className="hidden font-mono text-[10px] uppercase tracking-wider text-[var(--color-ink-muted)] sm:inline">
        WS
      </span>
    </div>
  )
}

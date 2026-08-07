import type { ConnectionState } from '../types/energy'

const LABELS: Record<ConnectionState, string> = {
  connecting: 'Conectando…',
  connected: 'Realtime activo',
  disconnected: 'Desconectado',
  error: 'Error de conexión',
}

const DOT: Record<ConnectionState, string> = {
  connecting: 'bg-amber-400 animate-pulse',
  connected: 'bg-emerald-400',
  disconnected: 'bg-slate-400',
  error: 'bg-rose-500',
}

interface Props {
  state: ConnectionState
}

/** Badge de estado del canal WebSocket Realtime. */
export function ConnectionBadge({ state }: Props) {
  return (
    <div
      className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white/80 px-3 py-1.5 text-sm text-slate-700 shadow-sm backdrop-blur"
      title="Estado de la suscripción Supabase Realtime"
    >
      <span className={`h-2 w-2 rounded-full ${DOT[state]}`} aria-hidden />
      <span>{LABELS[state]}</span>
    </div>
  )
}

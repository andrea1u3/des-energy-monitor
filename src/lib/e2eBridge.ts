import type { ConnectionState, EnergyReading } from '../types/energy'

/**
 * E2E bridge — test seam for Playwright.
 *
 * Why this exists (interview talking point):
 * Supabase Realtime uses the Phoenix WebSocket protocol. Fully replaying that
 * protocol in CI is brittle and slow. Instead, when `?e2eMock=1` is present,
 * the dashboard skips the real client and listens to this in-memory bus.
 * Tests drive connection state + telemetry deterministically — same idea as
 * injecting a fake diagnostic bus in a vehicle HMI test harness.
 */

export interface DesE2EBridge {
  setConnection: (state: ConnectionState) => void
  setLoading: (loading: boolean) => void
  setError: (message: string | null) => void
  setReadings: (readings: EnergyReading[]) => void
  pushReading: (reading: EnergyReading) => void
  /** Snapshot helpers for assertions from the page */
  getState: () => {
    connection: ConnectionState
    loading: boolean
    error: string | null
    readings: EnergyReading[]
  }
}

type Listener = (snapshot: ReturnType<DesE2EBridge['getState']>) => void

declare global {
  interface Window {
    __DES_E2E_ENABLED__?: boolean
    __DES_E2E__?: DesE2EBridge
  }
}

export function isE2EMockMode(): boolean {
  if (typeof window === 'undefined') return false
  if (window.__DES_E2E_ENABLED__) return true
  try {
    return new URLSearchParams(window.location.search).has('e2eMock')
  } catch {
    return false
  }
}

/** Creates the bridge and mounts it on `window.__DES_E2E__`. */
export function createE2EBridge(
  initial: {
    connection?: ConnectionState
    loading?: boolean
    error?: string | null
    readings?: EnergyReading[]
  } = {},
): { bridge: DesE2EBridge; subscribe: (listener: Listener) => () => void } {
  let connection: ConnectionState = initial.connection ?? 'connecting'
  let loading = initial.loading ?? true
  let error: string | null = initial.error ?? null
  let readings: EnergyReading[] = initial.readings ?? []
  const listeners = new Set<Listener>()

  const notify = () => {
    const snapshot = { connection, loading, error, readings }
    for (const listener of listeners) listener(snapshot)
  }

  const bridge: DesE2EBridge = {
    setConnection(state) {
      connection = state
      notify()
    },
    setLoading(next) {
      loading = next
      notify()
    },
    setError(message) {
      error = message
      notify()
    },
    setReadings(next) {
      readings = next
      notify()
    },
    pushReading(reading) {
      if (readings.some((r) => r.id === reading.id)) return
      readings = [...readings, reading]
      connection = 'connected'
      error = null
      notify()
    },
    getState() {
      return { connection, loading, error, readings }
    },
  }

  window.__DES_E2E__ = bridge

  return {
    bridge,
    subscribe(listener) {
      listeners.add(listener)
      listener(bridge.getState())
      return () => {
        listeners.delete(listener)
      }
    },
  }
}

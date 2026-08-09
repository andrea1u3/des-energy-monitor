import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createE2EBridge, isE2EMockMode } from '../lib/e2eBridge'
import { hasSupabaseConfig, supabase } from '../lib/supabase'
import type { ConnectionState, EnergyReading } from '../types/energy'

const HISTORY_LIMIT = 2000
const HOURS_24_ISO = () => new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

interface UseEnergyReadingsResult {
  readings: EnergyReading[]
  connection: ConnectionState
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

/**
 * Carga el historial de 24h y se suscribe a INSERT vía Supabase Realtime (WebSocket).
 * En modo E2E (`?e2eMock=1`) usa el bridge in-memory — ver `e2eBridge.ts`.
 */
export function useEnergyReadings(): UseEnergyReadingsResult {
  const e2eMode = isE2EMockMode()
  const [readings, setReadings] = useState<EnergyReading[]>([])
  const [connection, setConnection] = useState<ConnectionState>(
    e2eMode ? 'connecting' : 'connecting',
  )
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  const fetchHistory = useCallback(async () => {
    if (isE2EMockMode()) {
      setLoading(false)
      return
    }

    if (!hasSupabaseConfig) {
      setError(
        'Configura VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en tu archivo .env',
      )
      setLoading(false)
      setConnection('error')
      return
    }

    setLoading(true)
    setError(null)

    const { data, error: queryError } = await supabase
      .from('energy_readings')
      .select('id, asset_type, value, unit, timestamp')
      .gte('timestamp', HOURS_24_ISO())
      .order('timestamp', { ascending: true })
      .limit(HISTORY_LIMIT)

    if (queryError) {
      setError(queryError.message)
      setConnection('error')
      setLoading(false)
      return
    }

    setReadings((data as EnergyReading[]) ?? [])
    setLoading(false)
  }, [])

  // Mount the E2E bridge before paint so Playwright can find window.__DES_E2E__
  useLayoutEffect(() => {
    if (!isE2EMockMode()) return

    const { subscribe } = createE2EBridge({
      connection: 'connecting',
      loading: true,
      error: null,
      readings: [],
    })

    const unsubscribe = subscribe((snapshot) => {
      setConnection(snapshot.connection)
      setLoading(snapshot.loading)
      setError(snapshot.error)
      setReadings(snapshot.readings)
    })

    return () => {
      unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (isE2EMockMode()) return
    void fetchHistory()
  }, [fetchHistory])

  useEffect(() => {
    if (isE2EMockMode()) return
    if (!hasSupabaseConfig) return

    const channel = supabase
      .channel('energy_readings_live')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'energy_readings',
        },
        (payload) => {
          const row = payload.new as EnergyReading
          setReadings((prev) => {
            if (prev.some((r) => r.id === row.id)) return prev
            const next = [...prev, row]
            const cutoff = Date.now() - 24 * 60 * 60 * 1000
            return next.filter((r) => new Date(r.timestamp).getTime() >= cutoff)
          })
          setConnection('connected')
          setError(null)
        },
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          setConnection('connected')
          setError(null)
        } else if (status === 'CHANNEL_ERROR') {
          setConnection('error')
          setError(err?.message ?? 'Error en el canal Realtime')
        } else if (status === 'TIMED_OUT') {
          setConnection('disconnected')
          setError('Timeout de Realtime — reintentando…')
        } else if (status === 'CLOSED') {
          setConnection('disconnected')
        }
      })

    channelRef.current = channel

    return () => {
      void supabase.removeChannel(channel)
      channelRef.current = null
    }
  }, [])

  return {
    readings,
    connection,
    loading,
    error,
    refetch: fetchHistory,
  }
}

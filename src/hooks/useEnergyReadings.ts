import { useCallback, useEffect, useRef, useState } from 'react'
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
 * Maneja reconexión: si el canal cae, marca disconnected/error y permite refetch.
 */
export function useEnergyReadings(): UseEnergyReadingsResult {
  const [readings, setReadings] = useState<EnergyReading[]>([])
  const [connection, setConnection] = useState<ConnectionState>('connecting')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  const fetchHistory = useCallback(async () => {
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

  useEffect(() => {
    void fetchHistory()
  }, [fetchHistory])

  useEffect(() => {
    if (!hasSupabaseConfig) return

    // Canal Realtime: solo eventos INSERT en energy_readings
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
            // Evitar duplicados si el refetch y el evento llegan juntos
            if (prev.some((r) => r.id === row.id)) return prev
            const next = [...prev, row]
            // Mantener ventana ~24h en memoria
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

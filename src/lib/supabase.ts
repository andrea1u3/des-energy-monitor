import { createClient } from '@supabase/supabase-js'

/**
 * Cliente Supabase del frontend.
 * Usa la anon key + RLS: solo lectura de energy_readings.
 * El simulador IoT tiene su propio cliente con service_role (ver /simulator).
 */

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[supabase] Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY. ' +
      'Copia .env.example a .env y completa las credenciales.',
  )
}

export const supabase = createClient(
  supabaseUrl ?? '',
  supabaseAnonKey ?? '',
  {
    realtime: {
      // Reconexión automática si cae el WebSocket
      params: { eventsPerSecond: 10 },
    },
  },
)

export const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey)

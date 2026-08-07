/**
 * Simulador de telemetría IoT — proceso SEPARADO del frontend.
 *
 * Arquitectura (explicable en entrevista):
 * - Este script actúa como un gateway IoT / edge device que publica lecturas.
 * - Usa SUPABASE_SERVICE_ROLE_KEY (nunca se empaqueta en el bundle del browser).
 * - El dashboard solo se suscribe vía Realtime + anon key (lectura).
 *
 * Uso: npm run simulate
 */

import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

type AssetType = 'solar' | 'battery' | 'ev_charger'

const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  console.error(
    '[simulator] Faltan SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY en .env',
  )
  process.exit(1)
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

/** Estado mutable interno (como el firmware de un EMS real). */
let batterySoc = 55 + Math.random() * 20 // 55–75%
let evCharging = Math.random() > 0.4

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

/**
 * Curva solar simplificada: pico al mediodía, ~0 de noche.
 * hourFrac ∈ [0, 24)
 */
function solarKw(hourFrac: number): number {
  // Campana entre 6:00 y 18:00
  const peak = 12
  const width = 4.5
  const base = Math.exp(-((hourFrac - peak) ** 2) / (2 * width ** 2))
  const nightCut = hourFrac < 5.5 || hourFrac > 19 ? 0 : 1
  const noise = 1 + (Math.random() - 0.5) * 0.12
  return Number((base * nightCut * 8.5 * noise).toFixed(3)) // pico ~8.5 kW
}

function evKw(): number {
  if (!evCharging) return Number((Math.random() * 0.15).toFixed(3))
  // Nivel 2 típico ~3.3–7.2 kW con ruido
  return Number((3.5 + Math.random() * 3.5).toFixed(3))
}

function stepBattery(solar: number, ev: number): number {
  const netKw = solar - ev
  // ~0.4% SOC por kW neto cada tick (~4s) — escala demo, no física real
  const delta = netKw * 0.08
  batterySoc = clamp(batterySoc + delta + (Math.random() - 0.5) * 0.15, 5, 100)
  return Number(batterySoc.toFixed(2))
}

async function publishReading(
  asset_type: AssetType,
  value: number,
  unit: string,
) {
  const { error } = await supabase.from('energy_readings').insert({
    asset_type,
    value,
    unit,
    timestamp: new Date().toISOString(),
  })
  if (error) throw error
}

async function tick() {
  const now = new Date()
  const hourFrac = now.getHours() + now.getMinutes() / 60

  // Cada ~2 min hay chance de iniciar/detener carga EV
  if (Math.random() < 0.08) evCharging = !evCharging

  const solar = solarKw(hourFrac)
  const ev = evKw()
  const battery = stepBattery(solar, ev)

  await Promise.all([
    publishReading('solar', solar, 'kW'),
    publishReading('battery', battery, '%'),
    publishReading('ev_charger', ev, 'kW'),
  ])

  const stamp = now.toLocaleTimeString('es-MX')
  console.log(
    `[${stamp}] solar=${solar} kW | battery=${battery}% | ev=${ev} kW` +
      (evCharging ? ' (charging)' : ''),
  )
}

function nextIntervalMs() {
  // 3–5 segundos, como telemetría periódica de un edge device
  return 3000 + Math.floor(Math.random() * 2000)
}

async function loop() {
  console.log('[simulator] Iniciando telemetría IoT → Supabase')
  console.log('[simulator] Ctrl+C para detener\n')

  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      await tick()
    } catch (err) {
      console.error('[simulator] Error al insertar:', err)
    }
    await new Promise((r) => setTimeout(r, nextIntervalMs()))
  }
}

void loop()

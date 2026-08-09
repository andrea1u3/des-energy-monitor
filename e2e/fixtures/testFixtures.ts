import { test as base, expect } from '@playwright/test'
import type { ConnectionState, EnergyReading } from '../../src/types/energy'
import { sampleReadings } from './sampleData'
import { DashboardPage } from '../pages/DashboardPage'

/**
 * Controllable Realtime mock exposed to specs via the E2E bridge.
 * Simulates what a diagnostic bus / WebSocket feed would do in production tests.
 */
export type RealtimeMock = {
  setConnection: (state: ConnectionState) => Promise<void>
  setLoading: (loading: boolean) => Promise<void>
  setError: (message: string | null) => Promise<void>
  setReadings: (readings: EnergyReading[]) => Promise<void>
  pushReading: (reading: EnergyReading) => Promise<void>
  /** Hydrate a connected dashboard with baseline solar/battery/EV samples */
  hydrateConnected: (readings?: EnergyReading[]) => Promise<void>
  disconnect: (message?: string) => Promise<void>
}

type Fixtures = {
  dashboard: DashboardPage
  realtime: RealtimeMock
}

async function callBridge<T>(
  page: DashboardPage['page'],
  fn: string,
  arg?: unknown,
): Promise<T> {
  return page.evaluate(
    ({ fn, arg }) => {
      const bridge = window.__DES_E2E__
      if (!bridge) throw new Error('E2E bridge not mounted — open /?e2eMock=1 first')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (bridge as any)[fn](arg)
    },
    { fn, arg },
  )
}

export const test = base.extend<Fixtures>({
  dashboard: async ({ page }, use) => {
    // Block any accidental real Supabase traffic — proves isolation
    await page.route('**/*supabase.co/**', (route) => route.abort())
    const dashboard = new DashboardPage(page)
    await use(dashboard)
  },

  realtime: async ({ page, dashboard }, use) => {
    await dashboard.gotoMock()

    const realtime: RealtimeMock = {
      async setConnection(state) {
        await callBridge(page, 'setConnection', state)
      },
      async setLoading(loading) {
        await callBridge(page, 'setLoading', loading)
      },
      async setError(message) {
        await callBridge(page, 'setError', message)
      },
      async setReadings(readings) {
        await callBridge(page, 'setReadings', readings)
      },
      async pushReading(reading) {
        await callBridge(page, 'pushReading', reading)
      },
      async hydrateConnected(readings = sampleReadings) {
        await callBridge(page, 'setReadings', readings)
        await callBridge(page, 'setLoading', false)
        await callBridge(page, 'setError', null)
        await callBridge(page, 'setConnection', 'connected')
      },
      async disconnect(message = 'Realtime channel closed') {
        await callBridge(page, 'setConnection', 'disconnected')
        await callBridge(page, 'setError', message)
      },
    }

    await use(realtime)
  },
})

export { expect }

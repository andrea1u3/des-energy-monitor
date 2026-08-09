import { test, expect } from '../fixtures/testFixtures'
import { reading } from '../fixtures/sampleData'

test.describe('Realtime updates', () => {
  test('updates UI when a new telemetry reading is pushed without reload', async ({
    dashboard,
    realtime,
    page,
  }) => {
    await realtime.hydrateConnected()
    await expect(dashboard.metricSolarValue).toContainText('4.25')

    const urlBefore = page.url()

    // Simulate an IoT INSERT arriving over Realtime
    await realtime.pushReading(
      reading({ id: 100, asset_type: 'solar', value: 7.77 }),
    )

    await expect(dashboard.metricSolarValue).toContainText('7.77')
    await expect(dashboard.connectionBadge).toHaveAttribute(
      'data-connection-state',
      'connected',
    )

    // No full page navigation / reload
    expect(page.url()).toBe(urlBefore)
  })

  test('updates battery SoC when a battery reading arrives', async ({
    dashboard,
    realtime,
  }) => {
    await realtime.hydrateConnected()

    await realtime.pushReading(
      reading({ id: 101, asset_type: 'battery', value: 48.2 }),
    )

    await expect(dashboard.batterySoc).toContainText('48.2%')
    await expect(dashboard.metricBatteryValue).toContainText('48.2')
  })
})

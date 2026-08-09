import { test, expect } from '../fixtures/testFixtures'
import { reading, sampleReadings } from '../fixtures/sampleData'

test.describe('Battery low alert', () => {
  test('shows critical alert when SoC drops below 15%', async ({
    dashboard,
    realtime,
  }) => {
    await realtime.hydrateConnected()
    await expect(dashboard.batteryAlert).toHaveCount(0)

    await realtime.pushReading(
      reading({ id: 200, asset_type: 'battery', value: 12.4 }),
    )

    await expect(dashboard.batteryAlert).toBeVisible()
    await expect(dashboard.batteryAlert).toContainText('batería crítica')
    await expect(dashboard.batteryGauge).toHaveAttribute(
      'data-battery-critical',
      'true',
    )
    await expect(dashboard.batterySoc).toContainText('12.4%')
  })

  test('does not show alert when SoC is above the threshold', async ({
    dashboard,
    realtime,
  }) => {
    const healthy = sampleReadings.map((r) =>
      r.asset_type === 'battery' ? { ...r, value: 55 } : r,
    )
    await realtime.hydrateConnected(healthy)

    await expect(dashboard.batteryAlert).toHaveCount(0)
    await expect(dashboard.batteryGauge).toHaveAttribute(
      'data-battery-critical',
      'false',
    )
  })
})

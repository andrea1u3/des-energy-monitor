import { test, expect } from '../fixtures/testFixtures'

test.describe('Smoke — dashboard modules', () => {
  test('loads and shows solar, battery, and EV charging modules', async ({
    dashboard,
    realtime,
  }) => {
    await realtime.hydrateConnected()

    await expect(dashboard.title).toHaveText('Energy Monitor')
    await expect(dashboard.metricSolar).toBeVisible()
    await expect(dashboard.metricBattery).toBeVisible()
    await expect(dashboard.metricEv).toBeVisible()
    await expect(dashboard.chart).toBeVisible()
    await expect(dashboard.batteryGauge).toBeVisible()
    await expect(dashboard.statusCards).toBeVisible()

    await expect(dashboard.metricSolarValue).toContainText('kW')
    await expect(dashboard.metricBatteryValue).toContainText('%')
    await expect(dashboard.metricEvValue).toContainText('kW')
  })
})

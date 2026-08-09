import { test, expect } from '../fixtures/testFixtures'

test.describe('Disconnection handling', () => {
  test('survives a Realtime drop without crashing or showing undefined', async ({
    dashboard,
    realtime,
    page,
  }) => {
    await realtime.hydrateConnected()
    await expect(dashboard.metricSolarValue).toContainText('4.25')

    await realtime.disconnect('Realtime channel closed')

    await expect(dashboard.connectionBadge).toHaveAttribute(
      'data-connection-state',
      'disconnected',
    )
    await expect(dashboard.connectionLabel).toHaveText('Desconectado')
    await expect(dashboard.connectionAlert).toBeVisible()
    await expect(dashboard.retryButton).toBeVisible()

    // Last-known telemetry remains — UI does not wipe to undefined/NaN
    await expect(dashboard.metricSolarValue).toContainText('4.25')
    await expect(dashboard.metricBatteryValue).toContainText('62.5')
    await expect(dashboard.metricEvValue).toContainText('1.80')
    await expect(dashboard.batterySoc).toContainText('62.5%')

    // No visible "undefined" / "NaN" strings anywhere in the dashboard
    const bodyText = await page.locator('[data-testid="dashboard-root"]').innerText()
    expect(bodyText).not.toMatch(/\bundefined\b/i)
    expect(bodyText).not.toMatch(/\bNaN\b/)
  })
})

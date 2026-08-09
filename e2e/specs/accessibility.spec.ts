import { test, expect } from '../fixtures/testFixtures'

test.describe('Accessibility basics', () => {
  test('exposes ARIA roles for status, alerts, and landmark sections', async ({
    dashboard,
    realtime,
  }) => {
    await realtime.hydrateConnected()
    await realtime.disconnect('channel closed')

    await expect(dashboard.connectionBadge).toHaveAttribute('role', 'status')
    await expect(dashboard.connectionBadge).toHaveAttribute('aria-live', 'polite')

    await expect(dashboard.chart).toHaveAttribute('aria-label', 'Generación vs consumo')
    await expect(dashboard.batteryGauge).toHaveAttribute('aria-label', 'Nivel de batería')
    await expect(dashboard.statusCards).toHaveAttribute(
      'aria-label',
      'Estados del sistema',
    )

    await expect(dashboard.connectionAlert).toHaveAttribute('role', 'alert')
    await expect(dashboard.retryButton).toBeVisible()
  })

  test('retry control is keyboard-focusable and activatable', async ({
    dashboard,
    realtime,
    page,
  }) => {
    await realtime.hydrateConnected()
    await realtime.disconnect('channel closed')

    await dashboard.retryButton.focus()
    await expect(dashboard.retryButton).toBeFocused()

    // Enter activates the button (native button semantics)
    await page.keyboard.press('Enter')
    // Button remains in the accessibility tree as a real <button>
    await expect(dashboard.retryButton).toHaveRole('button')
  })
})

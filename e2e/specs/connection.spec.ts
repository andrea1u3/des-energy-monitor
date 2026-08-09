import { test, expect } from '../fixtures/testFixtures'

test.describe('Connection status', () => {
  test('transitions connecting → connected via mocked Realtime bus', async ({
    dashboard,
    realtime,
  }) => {
    // Initial bridge state is connecting + loading
    await expect(dashboard.connectionBadge).toHaveAttribute(
      'data-connection-state',
      'connecting',
    )
    await expect(dashboard.connectionLabel).toHaveText('Conectando…')

    await realtime.hydrateConnected()

    await expect(dashboard.connectionBadge).toHaveAttribute(
      'data-connection-state',
      'connected',
    )
    await expect(dashboard.connectionLabel).toHaveText('Realtime activo')
    await expect(dashboard.loading).toHaveCount(0)
  })

  test('shows error state when the channel reports a failure', async ({
    dashboard,
    realtime,
  }) => {
    await realtime.setLoading(false)
    await realtime.setConnection('error')
    await realtime.setError('Error en el canal Realtime')

    await expect(dashboard.connectionBadge).toHaveAttribute(
      'data-connection-state',
      'error',
    )
    await expect(dashboard.connectionLabel).toHaveText('Error de conexión')
    await expect(dashboard.connectionAlert).toBeVisible()
  })
})

import type { Locator, Page } from '@playwright/test'

/**
 * Page Object Model for the Energy Monitor dashboard.
 *
 * Interview note: POM keeps selectors + user actions in one place so specs
 * stay readable as intent ("expect battery alert") rather than CSS noise.
 * When the UI markup changes, you update the page object — not every test.
 */
export class DashboardPage {
  readonly page: Page
  readonly root: Locator
  readonly title: Locator
  readonly connectionBadge: Locator
  readonly connectionLabel: Locator
  readonly metricSolar: Locator
  readonly metricBattery: Locator
  readonly metricEv: Locator
  readonly metricSolarValue: Locator
  readonly metricBatteryValue: Locator
  readonly metricEvValue: Locator
  readonly chart: Locator
  readonly batteryGauge: Locator
  readonly batterySoc: Locator
  readonly batteryAlert: Locator
  readonly connectionAlert: Locator
  readonly retryButton: Locator
  readonly loading: Locator
  readonly statusCards: Locator

  constructor(page: Page) {
    this.page = page
    this.root = page.getByTestId('dashboard-root')
    this.title = page.getByTestId('dashboard-title')
    this.connectionBadge = page.getByTestId('connection-badge')
    this.connectionLabel = page.getByTestId('connection-label')
    this.metricSolar = page.getByTestId('metric-solar')
    this.metricBattery = page.getByTestId('metric-battery')
    this.metricEv = page.getByTestId('metric-ev')
    this.metricSolarValue = page.getByTestId('metric-solar-value')
    this.metricBatteryValue = page.getByTestId('metric-battery-value')
    this.metricEvValue = page.getByTestId('metric-ev-value')
    this.chart = page.getByTestId('solar-consumption-chart')
    this.batteryGauge = page.getByTestId('battery-gauge')
    this.batterySoc = page.getByTestId('battery-soc')
    this.batteryAlert = page.getByTestId('battery-alert')
    this.connectionAlert = page.getByTestId('connection-alert')
    this.retryButton = page.getByTestId('retry-connection')
    this.loading = page.getByTestId('dashboard-loading')
    this.statusCards = page.getByTestId('status-cards')
  }

  /** Opens the app in E2E mock mode (no real Supabase WebSocket). */
  async gotoMock() {
    // Avoid waitUntil: 'networkidle' — Vite HMR keeps a WebSocket open forever
    await this.page.goto('/?e2eMock=1', { waitUntil: 'domcontentloaded' })
    await this.root.waitFor({ state: 'visible' })
    await this.page.waitForFunction(() => Boolean(window.__DES_E2E__), null, {
      timeout: 15_000,
    })
  }

  async connectionState(): Promise<string | null> {
    return this.connectionBadge.getAttribute('data-connection-state')
  }
}

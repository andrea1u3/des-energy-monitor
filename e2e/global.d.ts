import type { DesE2EBridge } from '../src/lib/e2eBridge'

declare global {
  interface Window {
    __DES_E2E_ENABLED__?: boolean
    __DES_E2E__?: DesE2EBridge
  }
}

export {}

import type { TrackingConfig } from './config'

export type ConsentState = {
  necessary: boolean
  preferences: boolean
  statistics: boolean
  marketing: boolean
}

export type TrackingProvider =
  | 'klaviyo'
  | 'google_analytics'
  | 'google_tag_manager'
  | 'clarity'
  | 'hotjar'
  | 'chatgpt'

export type Lifecycle = 'added' | 'loaded' | 'error'
export type TrackingEventName =
  | `tracking.${TrackingProvider}.${Lifecycle}`
  | 'tracking.chatgpt.exists'

export type BonzerEventName =
  | 'events.initialized'
  | 'consent.initialized'
  | 'consent.updated'
  | TrackingEventName

export interface BonzerEvent<N extends BonzerEventName = BonzerEventName, P = unknown> {
  name: N
  timestamp: Date
  payload: P
  _id: string
}

export type BonzerEventInput =
  | { name: 'events.initialized'; payload: undefined }
  | { name: 'consent.initialized' | 'consent.updated'; payload: ConsentState }
  | { name: TrackingEventName; payload: { _ref: string } }

export interface BonzerHooks {
  emit(event: BonzerEventInput): void
  filter<N extends BonzerEventName>(
    names: readonly N[],
    buffer?: readonly BonzerEvent[],
  ): Array<BonzerEvent<N>>
  subscribe(
    callback: (event: BonzerEvent) => void,
    eventNames?: readonly BonzerEventName[],
  ): () => void
}

export interface BonzerDataLayer {
  buffer: BonzerEvent[]
  hooks: BonzerHooks
}

export interface Oaiq {
  (...args: unknown[]): void
  q?: unknown[][]
}

declare global {
  const __TRACKING_CONFIG__: TrackingConfig
  const __TRACKING_ENABLED_KLAVIYO__: boolean
  const __TRACKING_ENABLED_GOOGLE_ANALYTICS__: boolean
  const __TRACKING_ENABLED_GOOGLE_TAG_MANAGER__: boolean
  const __TRACKING_ENABLED_CLARITY__: boolean
  const __TRACKING_ENABLED_HOTJAR__: boolean
  const __TRACKING_ENABLED_CHATGPT__: boolean

  interface Window {
    bonzer?: BonzerDataLayer
    dataLayer?: unknown[]
    hj?: ((...args: unknown[]) => void) & { q?: unknown[][] }
    _hjSettings?: { hjid: number; hjsv: number }
    clarity?: ((...args: unknown[]) => void) & { q?: unknown[][] }
    oaiq?: Oaiq
  }
}

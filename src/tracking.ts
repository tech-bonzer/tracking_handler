import type { TrackingConfig, TrackingValue } from './config'
import type {
  BonzerDataLayer,
  ConsentState,
  Oaiq,
  TrackingEventName,
  TrackingProvider,
} from './types'

type QueueFunction = ((...args: unknown[]) => void) & { q?: unknown[][] }

interface TrackingContext {
  config: TrackingConfig
  consent: ConsentState
  events: BonzerDataLayer
}

const initialized = new Set<string>()
let gtagBootstrapped = false

function ids(value: TrackingValue | undefined): string[] {
  if (!value) return []
  return [...new Set((Array.isArray(value) ? value : [value]).filter(Boolean))]
}

function reference(provider: TrackingProvider, id: string): string {
  const prefixes: Record<TrackingProvider, string> = {
    klaviyo: 'tracking_klaviyo',
    google_analytics: 'tracking_ga',
    google_tag_manager: 'tracking_gtm',
    clarity: 'tracking_clarity',
    hotjar: 'tracking_hotjar',
    chatgpt: 'tracking_chatgpt',
  }
  return `${prefixes[provider]}_${id}`
}

function emit(
  events: BonzerDataLayer,
  provider: TrackingProvider,
  lifecycle: 'added' | 'loaded' | 'error' | 'exists',
  ref: string,
): void {
  events.hooks.emit({
    name: `tracking.${provider}.${lifecycle}` as TrackingEventName,
    payload: { _ref: ref },
  })
}

function loadScript(
  events: BonzerDataLayer,
  provider: TrackingProvider,
  id: string,
  source: string,
): HTMLScriptElement {
  const ref = reference(provider, id)
  const script = document.createElement('script')
  script.async = true
  script.src = source
  script.dataset.refItem = ref
  script.addEventListener('load', () => emit(events, provider, 'loaded', ref), {
    once: true,
  })
  script.addEventListener('error', () => emit(events, provider, 'error', ref), {
    once: true,
  })
  document.head.appendChild(script)
  emit(events, provider, 'added', ref)
  return script
}

function queueFunction(): QueueFunction {
  const queue: QueueFunction = (...args: unknown[]) => {
    queue.q?.push(args)
  }
  queue.q = []
  return queue
}

function startOnce(
  provider: TrackingProvider,
  id: string,
  start: () => void,
): void {
  const key = `${provider}:${id}`
  if (initialized.has(key)) return
  initialized.add(key)
  start()
}

function hasAnalyticsConsent(consent: ConsentState): boolean {
  return consent.statistics || consent.marketing
}

function initKlaviyo({ config, consent, events }: TrackingContext): void {
  if (!consent.marketing) return
  for (const id of ids(config.klaviyo)) {
    startOnce('klaviyo', id, () => {
      loadScript(
        events,
        'klaviyo',
        id,
        `https://static.klaviyo.com/onsite/js/${encodeURIComponent(id)}/klaviyo.js`,
      )
    })
  }
}

function initGoogleAnalytics({ config, consent, events }: TrackingContext): void {
  if (!hasAnalyticsConsent(consent)) return
  for (const id of ids(config.google_analytics)) {
    startOnce('google_analytics', id, () => {
      loadScript(
        events,
        'google_analytics',
        id,
        `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`,
      )
      window.dataLayer ??= []
      if (!gtagBootstrapped) {
        window.dataLayer.push(['js', new Date()])
        gtagBootstrapped = true
      }
      window.dataLayer.push(['config', id])
    })
  }
}

function appendGtmFallback(id: string): void {
  const append = (): void => {
    if (!document.body) return
    const noscript = document.createElement('noscript')
    const iframe = document.createElement('iframe')
    iframe.src = `https://www.googletagmanager.com/ns.html?id=${encodeURIComponent(id)}`
    iframe.height = '0'
    iframe.width = '0'
    iframe.style.cssText = 'display:none;visibility:hidden'
    noscript.appendChild(iframe)
    document.body.appendChild(noscript)
  }

  if (document.body) append()
  else document.addEventListener('DOMContentLoaded', append, { once: true })
}

function initGoogleTagManager({
  config,
  consent,
  events,
}: TrackingContext): void {
  if (!hasAnalyticsConsent(consent)) return
  for (const id of ids(config.google_tag_manager)) {
    startOnce('google_tag_manager', id, () => {
      window.dataLayer ??= []
      window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' })
      loadScript(
        events,
        'google_tag_manager',
        id,
        `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(id)}`,
      )
      appendGtmFallback(id)
    })
  }
}

function initHotjar({ config, consent, events }: TrackingContext): void {
  if (!hasAnalyticsConsent(consent)) return
  for (const id of ids(config.hotjar)) {
    startOnce('hotjar', id, () => {
      window.hj ??= queueFunction()
      window._hjSettings = { hjid: Number.parseInt(id, 10), hjsv: 6 }
      loadScript(
        events,
        'hotjar',
        id,
        `https://static.hotjar.com/c/hotjar-${encodeURIComponent(id)}.js?sv=6`,
      )
    })
  }
}

function initClarity({ config, consent, events }: TrackingContext): void {
  if (!hasAnalyticsConsent(consent)) return
  for (const id of ids(config.clarity)) {
    startOnce('clarity', id, () => {
      window.clarity ??= queueFunction()
      loadScript(
        events,
        'clarity',
        id,
        `https://www.clarity.ms/tag/${encodeURIComponent(id)}`,
      )
    })
  }
}

function initChatGPT({ config, consent, events }: TrackingContext): void {
  if (!hasAnalyticsConsent(consent)) return
  for (const id of ids(config.chatgpt)) {
    startOnce('chatgpt', id, () => {
      const ref = reference('chatgpt', id)
      if (window.oaiq) {
        emit(events, 'chatgpt', 'exists', ref)
        return
      }

      window.oaiq = queueFunction() as Oaiq
      window.oaiq('consent', consent.statistics && consent.marketing)
      window.oaiq('init', { pixelId: id })
      events.hooks.subscribe((event) => {
        if (event.name === 'consent.updated') {
          const state = event.payload as ConsentState
          window.oaiq?.('consent', state.statistics && state.marketing)
        }
      }, ['consent.updated'])
      loadScript(
        events,
        'chatgpt',
        id,
        'https://bzrcdn.openai.com/sdk/oaiq.min.js',
      )
    })
  }
}

const initializers = [
  initKlaviyo,
  initGoogleAnalytics,
  initGoogleTagManager,
  initHotjar,
  initClarity,
  initChatGPT,
]

export function updateTracking(context: TrackingContext): void {
  for (const initialize of initializers) initialize(context)
}

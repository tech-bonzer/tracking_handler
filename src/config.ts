export type TrackingValue = string | readonly string[] | null

export interface TrackingConfig {
  klaviyo?: TrackingValue
  google_analytics?: TrackingValue
  google_tag_manager?: TrackingValue
  clarity?: TrackingValue
  hotjar?: TrackingValue
  chatgpt?: TrackingValue
}

/**
 * Type-safe helper for tracking.config.ts. Configuration is validated again
 * by the build, so this function intentionally has no runtime behavior.
 */
export function defineConfig(config: TrackingConfig): TrackingConfig {
  return config
}

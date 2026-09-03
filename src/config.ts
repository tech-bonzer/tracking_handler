import type { TrackingProvider } from "@/providers";

export type TrackingValue = string | readonly string[] | null;

export type TrackingConfig = Partial<Record<TrackingProvider, TrackingValue>>;

/**
 * Type-safe helper for tracking.config.ts. Configuration is validated again
 * by the build, so this function intentionally has no runtime behavior.
 */
export function defineConfig(config: TrackingConfig): TrackingConfig {
	return config;
}

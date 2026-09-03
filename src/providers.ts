export const trackingProviders = {
	klaviyo: { referencePrefix: "tracking_klaviyo" },
	google_analytics: { referencePrefix: "tracking_ga" },
	google_tag_manager: { referencePrefix: "tracking_gtm" },
	clarity: { referencePrefix: "tracking_clarity" },
	hotjar: { referencePrefix: "tracking_hotjar" },
	chatgpt: { referencePrefix: "tracking_chatgpt" },
} as const;

export const trackingProviderNames = Object.keys(
	trackingProviders,
) as TrackingProvider[];

export type TrackingProvider = keyof typeof trackingProviders;

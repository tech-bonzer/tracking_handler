import type { TrackingConfig } from "@/config";
import type { BonzerDataLayer, ConsentState } from "@/types";

export type TrackingContext = {
	config: TrackingConfig;
	consent: ConsentState;
	events: BonzerDataLayer;
};

export type TrackingInitializer = (context: TrackingContext) => void;

export function hasAnalyticsConsent(consent: ConsentState): boolean {
	return consent.statistics || consent.marketing;
}

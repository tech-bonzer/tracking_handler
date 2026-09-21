import { initActivity } from "@/activity";
import type { TrackingConfig } from "@/config";
import { initConsent } from "@/consent";
import { initEvents } from "@/events";
import { initLargestContentfulPaint } from "@/performance";
import { updateTracking } from "@/tracking";

let started = false;

export function main(config: TrackingConfig): void {
	if (started) return;
	started = true;

	const events = initEvents();
	initActivity(events);
	initLargestContentfulPaint(events);
	events.hooks.subscribe(
		(event) => {
			updateTracking({
				config,
				consent: event.payload,
				events,
			});
		},
		["consent.initialized", "consent.updated"],
	);
	initConsent(events);
}

export { defineConfig } from "@/config";
export type { TrackingConfig, TrackingValue } from "@/config";
export type {
	BonzerDataLayer,
	BonzerEvent,
	BonzerEventInput,
	BonzerEventName,
	ConsentState,
	LargestContentfulPaintPayload,
	UserInteractionPayload,
} from "@/types";

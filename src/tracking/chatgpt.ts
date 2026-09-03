import { hasAnalyticsConsent, type TrackingContext } from "@/tracking/context";
import {
	emitTrackingEvent,
	ids,
	loadScript,
	queueFunction,
	startOnce,
	trackingReference,
} from "@/tracking/script";

export function initChatGPT({
	config,
	consent,
	events,
}: TrackingContext): void {
	if (!hasAnalyticsConsent(consent)) return;
	for (const id of ids(config.chatgpt)) {
		startOnce("chatgpt", id, () => {
			const ref = trackingReference("chatgpt", id);
			if (window.oaiq) {
				emitTrackingEvent(events, "chatgpt", "exists", ref);
				return;
			}

			window.oaiq = queueFunction();
			window.oaiq("init", { pixelId: id });
			window.oaiq("consent", consent.statistics && consent.marketing);
			events.hooks.subscribe(
				(event) => {
					const state = event.payload;
					window.oaiq?.(
						"consent",
						state.statistics && state.marketing,
					);
				},
				["consent.updated"],
			);
			loadScript(
				events,
				"chatgpt",
				id,
				"https://bzrcdn.openai.com/sdk/oaiq.min.js",
			);
		});
	}
}

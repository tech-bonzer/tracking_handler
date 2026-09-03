import { hasAnalyticsConsent, type TrackingContext } from "@/tracking/context";
import { ids, loadScript, queueFunction, startOnce } from "@/tracking/script";

export function initClarity({
	config,
	consent,
	events,
}: TrackingContext): void {
	if (!hasAnalyticsConsent(consent)) return;
	for (const id of ids(config.clarity)) {
		startOnce("clarity", id, () => {
			window.clarity ??= queueFunction();
			loadScript(
				events,
				"clarity",
				id,
				`https://www.clarity.ms/tag/${encodeURIComponent(id)}`,
			);
		});
	}
}

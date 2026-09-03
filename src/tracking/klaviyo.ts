import type { TrackingContext } from "@/tracking/context";
import { ids, loadScript, startOnce } from "@/tracking/script";

export function initKlaviyo({
	config,
	consent,
	events,
}: TrackingContext): void {
	if (!consent.marketing) return;
	for (const id of ids(config.klaviyo)) {
		startOnce("klaviyo", id, () => {
			loadScript(
				events,
				"klaviyo",
				id,
				`https://static.klaviyo.com/onsite/js/${encodeURIComponent(id)}/klaviyo.js`,
			);
		});
	}
}

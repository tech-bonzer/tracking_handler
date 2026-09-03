import { hasAnalyticsConsent, type TrackingContext } from "@/tracking/context";
import { ids, loadScript, queueFunction, startOnce } from "@/tracking/script";

export function initHotjar({ config, consent, events }: TrackingContext): void {
	if (!hasAnalyticsConsent(consent)) return;
	for (const id of ids(config.hotjar)) {
		startOnce("hotjar", id, () => {
			window.hj ??= queueFunction();
			window._hjSettings = { hjid: Number.parseInt(id, 10), hjsv: 6 };
			loadScript(
				events,
				"hotjar",
				id,
				`https://static.hotjar.com/c/hotjar-${encodeURIComponent(id)}.js?sv=6`,
			);
		});
	}
}

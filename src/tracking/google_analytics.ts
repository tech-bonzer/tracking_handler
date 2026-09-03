import { hasAnalyticsConsent, type TrackingContext } from "@/tracking/context";
import { ids, loadScript, startOnce } from "@/tracking/script";

let gtagBootstrapped = false;

export function initGoogleAnalytics({
	config,
	consent,
	events,
}: TrackingContext): void {
	if (!hasAnalyticsConsent(consent)) return;
	for (const id of ids(config.google_analytics)) {
		startOnce("google_analytics", id, () => {
			loadScript(
				events,
				"google_analytics",
				id,
				`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`,
			);
			window.dataLayer ??= [];
			if (!gtagBootstrapped) {
				window.dataLayer.push(["js", new Date()]);
				gtagBootstrapped = true;
			}
			window.dataLayer.push(["config", id]);
		});
	}
}

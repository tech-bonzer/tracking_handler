import { hasAnalyticsConsent, type TrackingContext } from "@/tracking/context";
import { ids, loadScript, startOnce } from "@/tracking/script";

function appendGtmFallback(id: string): void {
	const append = (): void => {
		if (!document.body) return;
		const noscript = document.createElement("noscript");
		const iframe = document.createElement("iframe");
		iframe.src = `https://www.googletagmanager.com/ns.html?id=${encodeURIComponent(id)}`;
		iframe.height = "0";
		iframe.width = "0";
		iframe.style.cssText = "display:none;visibility:hidden";
		noscript.appendChild(iframe);
		document.body.appendChild(noscript);
	};

	if (document.body) append();
	else document.addEventListener("DOMContentLoaded", append, { once: true });
}

export function initGoogleTagManager({
	config,
	consent,
	events,
}: TrackingContext): void {
	if (!hasAnalyticsConsent(consent)) return;
	for (const id of ids(config.google_tag_manager)) {
		startOnce("google_tag_manager", id, () => {
			window.dataLayer ??= [];
			window.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });
			loadScript(
				events,
				"google_tag_manager",
				id,
				`https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(id)}`,
			);
			appendGtmFallback(id);
		});
	}
}

import { initChatGPT } from "@/tracking/chatgpt";
import { initClarity } from "@/tracking/clarity";
import type { TrackingContext, TrackingInitializer } from "@/tracking/context";
import { initGoogleAnalytics } from "@/tracking/google_analytics";
import { initGoogleTagManager } from "@/tracking/google_tag_manager";
import { initHotjar } from "@/tracking/hotjar";
import { initKlaviyo } from "@/tracking/klaviyo";

const initializers: TrackingInitializer[] = [];
if (__TRACKING_ENABLED_KLAVIYO__) initializers.push(initKlaviyo);
if (__TRACKING_ENABLED_GOOGLE_ANALYTICS__) {
	initializers.push(initGoogleAnalytics);
}
if (__TRACKING_ENABLED_GOOGLE_TAG_MANAGER__) {
	initializers.push(initGoogleTagManager);
}
if (__TRACKING_ENABLED_HOTJAR__) initializers.push(initHotjar);
if (__TRACKING_ENABLED_CLARITY__) initializers.push(initClarity);
if (__TRACKING_ENABLED_CHATGPT__) initializers.push(initChatGPT);

export function updateTracking(context: TrackingContext): void {
	for (const initialize of initializers) initialize(context);
}

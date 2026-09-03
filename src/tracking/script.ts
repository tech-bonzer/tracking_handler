import type { TrackingValue } from "@/config";
import { trackingProviders } from "@/providers";
import type {
	BonzerDataLayer,
	TrackingEventName,
	TrackingProvider,
} from "@/types";

export type QueueFunction = ((...args: unknown[]) => void) & {
	q?: unknown[][];
};

const initialized = new Set<string>();

export function ids(value: TrackingValue | undefined): string[] {
	if (!value) return [];
	return [
		...new Set((Array.isArray(value) ? value : [value]).filter(Boolean)),
	];
}

function reference(provider: TrackingProvider, id: string): string {
	return `${trackingProviders[provider].referencePrefix}_${id}`;
}

export function emitTrackingEvent(
	events: BonzerDataLayer,
	provider: TrackingProvider,
	lifecycle: "added" | "loaded" | "error" | "exists",
	ref: string,
): void {
	events.hooks.emit({
		name: `tracking.${provider}.${lifecycle}` as TrackingEventName,
		payload: { _ref: ref },
	});
}

export function loadScript(
	events: BonzerDataLayer,
	provider: TrackingProvider,
	id: string,
	source: string,
): HTMLScriptElement {
	const ref = reference(provider, id);
	const script = document.createElement("script");
	script.async = true;
	script.src = source;
	script.dataset.refItem = ref;
	script.addEventListener(
		"load",
		() => emitTrackingEvent(events, provider, "loaded", ref),
		{ once: true },
	);
	script.addEventListener(
		"error",
		() => emitTrackingEvent(events, provider, "error", ref),
		{ once: true },
	);
	document.head.appendChild(script);
	emitTrackingEvent(events, provider, "added", ref);
	return script;
}

export function queueFunction(): QueueFunction {
	const queue: QueueFunction = (...args: unknown[]) => {
		queue.q?.push(args);
	};
	queue.q = [];
	return queue;
}

export function startOnce(
	provider: TrackingProvider,
	id: string,
	start: () => void,
): void {
	const key = `${provider}:${id}`;
	if (initialized.has(key)) return;
	initialized.add(key);
	start();
}

export function trackingReference(
	provider: TrackingProvider,
	id: string,
): string {
	return reference(provider, id);
}

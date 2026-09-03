import type { TrackingConfig } from "@/config";
import type { TrackingProvider } from "@/providers";

export type ConsentState = {
	necessary: boolean;
	preferences: boolean;
	statistics: boolean;
	marketing: boolean;
};

export type Lifecycle = "added" | "loaded" | "error";
export type TrackingEventName =
	`tracking.${TrackingProvider}.${Lifecycle}` | "tracking.chatgpt.exists";

export type BonzerEventName =
	| "events.initialized"
	| "consent.initialized"
	| "consent.updated"
	| TrackingEventName;

type BonzerEventPayload<N extends BonzerEventName> =
	N extends "events.initialized"
		? undefined
		: N extends "consent.initialized" | "consent.updated"
			? ConsentState
			: N extends TrackingEventName
				? { _ref: string }
				: never;

export type BonzerEvent<N extends BonzerEventName = BonzerEventName> =
	N extends BonzerEventName
		? {
				name: N;
				timestamp: Date;
				payload: BonzerEventPayload<N>;
				_id: string;
			}
		: never;

export type BonzerEventInput =
	| { name: "events.initialized"; payload: undefined }
	| { name: "consent.initialized" | "consent.updated"; payload: ConsentState }
	| { name: TrackingEventName; payload: { _ref: string } };

export type BonzerHooks = {
	emit(event: BonzerEventInput): void;
	filter<N extends BonzerEventName>(
		names: readonly N[],
		buffer?: readonly BonzerEvent[],
	): Array<BonzerEvent<N>>;
	subscribe<N extends BonzerEventName = BonzerEventName>(
		callback: (event: BonzerEvent<N>) => void,
		eventNames?: readonly N[],
	): () => void;
};

export type BonzerDataLayer = {
	buffer: BonzerEvent[];
	hooks: BonzerHooks;
};

export type Oaiq = ((...args: unknown[]) => void) & { q?: unknown[][] };

declare global {
	const __TRACKING_CONFIG__: TrackingConfig;
	const __TRACKING_ENABLED_KLAVIYO__: boolean;
	const __TRACKING_ENABLED_GOOGLE_ANALYTICS__: boolean;
	const __TRACKING_ENABLED_GOOGLE_TAG_MANAGER__: boolean;
	const __TRACKING_ENABLED_CLARITY__: boolean;
	const __TRACKING_ENABLED_HOTJAR__: boolean;
	const __TRACKING_ENABLED_CHATGPT__: boolean;

	interface Window {
		bonzer?: BonzerDataLayer;
		dataLayer?: unknown[];
		hj?: ((...args: unknown[]) => void) & { q?: unknown[][] };
		_hjSettings?: { hjid: number; hjsv: number };
		clarity?: ((...args: unknown[]) => void) & { q?: unknown[][] };
		oaiq?: Oaiq;
	}
}

export type { TrackingProvider } from "@/providers";

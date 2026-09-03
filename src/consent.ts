import type { BonzerDataLayer, ConsentState } from "@/types";

type ConsentStatus = "granted" | "denied";

type GoogleConsentSignals = {
	ad_storage?: ConsentStatus;
	ad_user_data?: ConsentStatus;
	ad_personalization?: ConsentStatus;
	analytics_storage?: ConsentStatus;
	functionality_storage?: ConsentStatus;
	personalization_storage?: ConsentStatus;
	security_storage?: ConsentStatus;
};

function argumentAt(entry: unknown, index: number): unknown {
	if (Array.isArray(entry)) return entry[index];
	if (entry && typeof entry === "object") {
		return (entry as Record<string, unknown>)[String(index)];
	}
	return undefined;
}

function sameConsent(left: ConsentState, right: ConsentState): boolean {
	return (
		left.necessary === right.necessary &&
		left.preferences === right.preferences &&
		left.statistics === right.statistics &&
		left.marketing === right.marketing
	);
}

export function readConsentState(dataLayer = window.dataLayer): ConsentState {
	const signals: GoogleConsentSignals = {};

	if (Array.isArray(dataLayer)) {
		for (const entry of dataLayer) {
			const action = argumentAt(entry, 1);
			if (
				argumentAt(entry, 0) !== "consent" ||
				(action !== "default" && action !== "update")
			) {
				continue;
			}

			const payload = argumentAt(entry, 2);
			if (payload && typeof payload === "object") {
				Object.assign(signals, payload);
			}
		}
	}

	const granted = (value?: ConsentStatus): boolean => value === "granted";
	return {
		necessary: true,
		preferences:
			granted(signals.functionality_storage) ||
			granted(signals.personalization_storage),
		statistics: granted(signals.analytics_storage),
		marketing:
			granted(signals.ad_storage) ||
			granted(signals.ad_user_data) ||
			granted(signals.ad_personalization),
	};
}

export function initConsent(events: BonzerDataLayer): () => void {
	window.dataLayer ??= [];
	let currentState = readConsentState();
	events.hooks.emit({ name: "consent.initialized", payload: currentState });

	const dataLayer = window.dataLayer;
	const originalPush = dataLayer.push.bind(dataLayer);

	dataLayer.push = (...entries: unknown[]): number => {
		const length = originalPush(...entries);
		const nextState = readConsentState(dataLayer);
		if (!sameConsent(currentState, nextState)) {
			currentState = nextState;
			events.hooks.emit({ name: "consent.updated", payload: nextState });
		}
		return length;
	};

	return () => {
		dataLayer.push = originalPush;
	};
}

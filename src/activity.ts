import type { BonzerDataLayer } from "@/types";

const activeSessionKey = "bonzer.userActiveAt";
const activeSessionDuration = 5 * 60 * 1000;
const interactionEvents = [
	"click",
	"keydown",
	"mousedown",
	"mousemove",
	"pointerdown",
	"pointermove",
	"scroll",
	"touchstart",
	"wheel",
] as const;
const listenerOptions = { capture: true, passive: true };

function readActiveAt(): number | undefined {
	try {
		const value = Number(window.sessionStorage.getItem(activeSessionKey));
		return Number.isFinite(value) && value > 0 ? value : undefined;
	} catch {
		return undefined;
	}
}

function markActive(now: number): void {
	try {
		window.sessionStorage.setItem(activeSessionKey, String(now));
	} catch {
		// Activity tracking still works when storage is unavailable.
	}
}

function hasSameOriginReferrer(): boolean {
	if (!document.referrer) return false;

	try {
		return new URL(document.referrer).origin === window.location.origin;
	} catch {
		return false;
	}
}

function hasActiveSession(now: number): boolean {
	const activeAt = readActiveAt();
	return (
		hasSameOriginReferrer() &&
		activeAt !== undefined &&
		now - activeAt <= activeSessionDuration
	);
}

export function initActivity(events: BonzerDataLayer): () => void {
	let emitted = false;

	const cleanup = (): void => {
		for (const eventName of interactionEvents) {
			window.removeEventListener(
				eventName,
				handleInteraction,
				listenerOptions,
			);
		}
	};

	const emit = (source: "interaction" | "session"): void => {
		if (emitted) return;
		emitted = true;
		markActive(Date.now());
		events.hooks.emit({ name: "user.interacted", payload: { source } });
		cleanup();
	};

	const handleInteraction = (): void => emit("interaction");

	if (hasActiveSession(Date.now())) {
		emit("session");
		return cleanup;
	}

	for (const eventName of interactionEvents) {
		window.addEventListener(eventName, handleInteraction, listenerOptions);
	}

	return cleanup;
}

import type { BonzerDataLayer } from "@/types";

export function initLargestContentfulPaint(
	events: BonzerDataLayer,
): () => void {
	if (!("PerformanceObserver" in window)) return () => undefined;

	let emitted = false;
	const observer = new PerformanceObserver((entryList) => {
		if (emitted) return;

		const entries = entryList.getEntries();
		const entry = entries.at(-1);
		if (!entry) return;

		emitted = true;
		events.hooks.emit({
			name: "performance.lcp",
			payload: { value: entry.startTime },
		});
		observer.disconnect();
	});

	try {
		observer.observe({ type: "largest-contentful-paint", buffered: true });
	} catch {
		observer.disconnect();
	}

	return () => observer.disconnect();
}

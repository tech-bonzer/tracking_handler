import assert from "node:assert/strict";
import test from "node:test";
import { browser, buildFixture } from "./helpers.mjs";

test("removes disabled integrations and reads serialized consent commands", async () => {
	const fixture = await buildFixture(`
		export default { google_analytics: "G-ONLY" }
	`);
	assert.doesNotMatch(fixture.code, /static\.klaviyo\.com/);
	assert.doesNotMatch(fixture.code, /clarity\.ms/);
	assert.doesNotMatch(fixture.code, /static\.hotjar\.com/);

	const page = browser();
	page.window.dataLayer = [
		{
			0: "consent",
			1: "default",
			2: { analytics_storage: "granted" },
		},
	];
	page.run(fixture.code);

	const scripts = Array.from(page.document.querySelectorAll("script")).filter(
		(script) => script.dataset.refItem === "tracking_ga_G-ONLY",
	);
	assert.equal(scripts.length, 1);
	assert.deepEqual(
		Array.from(
			page.window.bonzer.hooks.filter([
				"tracking.google_analytics.added",
			]),
			(event) => event.name,
		),
		["tracking.google_analytics.added"],
	);

	await fixture.cleanup();
});

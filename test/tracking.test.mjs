import assert from "node:assert/strict";
import test from "node:test";
import { browser, buildFixture } from "./helpers.mjs";

test("builds a consent-gated tracker and preserves the Bonzer event API", async () => {
	const fixture = await buildFixture(`
		export default {
			klaviyo: "KLAVIYO",
			google_analytics: ["G-FIRST", "G-FIRST", "G-SECOND"],
			google_tag_manager: "GTM-TEST",
			clarity: "CLARITY",
			hotjar: "12345",
			chatgpt: "CHATGPT"
		}
	`);
	const page = browser();
	const { window } = page;
	window.dataLayer = [
		[
			"consent",
			"default",
			{
				analytics_storage: "denied",
				ad_storage: "denied",
			},
		],
	];

	page.run(fixture.code);

	assert.ok(window.bonzer);
	assert.deepEqual(
		Array.from(window.bonzer.buffer.slice(0, 2), (event) => event.name),
		["events.initialized", "consent.initialized"],
	);
	assert.equal(
		window.document.querySelectorAll("script[data-ref-item]").length,
		0,
	);
	assert.equal(window.bonzer.hooks.filter(["consent.initialized"]).length, 1);

	const replayed = [];
	const unsubscribe = window.bonzer.hooks.subscribe(
		(event) => replayed.push(event.name),
		["consent.initialized", "consent.updated"],
	);
	assert.deepEqual(replayed, ["consent.initialized"]);

	window.dataLayer.push([
		"consent",
		"update",
		{
			analytics_storage: "granted",
			ad_storage: "granted",
		},
	]);

	const scripts = [
		...window.document.querySelectorAll("script[data-ref-item]"),
	];
	assert.equal(scripts.length, 7);
	assert.equal(
		new Set(scripts.map((script) => script.dataset.refItem)).size,
		7,
	);
	assert.equal(
		window.bonzer.hooks.filter([
			"tracking.klaviyo.added",
			"tracking.google_analytics.added",
			"tracking.google_tag_manager.added",
			"tracking.clarity.added",
			"tracking.hotjar.added",
			"tracking.chatgpt.added",
		]).length,
		7,
	);

	const chatGptQueue = window.oaiq.q;
	assert.equal(chatGptQueue[0][0], "init");
	assert.equal(chatGptQueue[0][1].pixelId, "CHATGPT");
	assert.deepEqual(Array.from(chatGptQueue[1]), ["consent", true]);

	window.dataLayer.push([
		"consent",
		"update",
		{
			analytics_storage: "denied",
			ad_storage: "denied",
		},
	]);
	assert.deepEqual(Array.from(chatGptQueue.at(-1)), ["consent", false]);
	assert.equal(
		window.document.querySelectorAll("script[data-ref-item]").length,
		7,
	);
	assert.deepEqual(replayed, [
		"consent.initialized",
		"consent.updated",
		"consent.updated",
	]);

	unsubscribe();
	window.dataLayer.push([
		"consent",
		"update",
		{ analytics_storage: "granted" },
	]);
	assert.equal(replayed.length, 3);

	const replacementBuffer = [];
	window.bonzer.buffer = replacementBuffer;
	window.bonzer.hooks.emit({
		name: "events.initialized",
		payload: undefined,
	});
	assert.equal(replacementBuffer.length, 1);

	await fixture.cleanup();
});

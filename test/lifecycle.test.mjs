import assert from "node:assert/strict";
import test from "node:test";
import { browser, buildFixture } from "./helpers.mjs";

test("buffers the first user interaction and LCP observation", async () => {
	const fixture = await buildFixture("export default {}");
	const page = browser();
	page.run(fixture.code);

	assert.equal(
		page.window.bonzer.hooks.filter(["user.interacted"]).length,
		0,
	);
	assert.equal(
		page.window.bonzer.hooks.filter(["performance.lcp"]).length,
		0,
	);

	page.window.dispatchEvent(new page.window.Event("mousemove"));
	page.window.dispatchEvent(new page.window.Event("click"));
	page.emitLcp(123.45);
	page.emitLcp(234.56);

	const interactions = page.window.bonzer.hooks.filter(["user.interacted"]);
	const lcpEvents = page.window.bonzer.hooks.filter(["performance.lcp"]);
	assert.equal(interactions.length, 1);
	assert.equal(interactions[0].payload.source, "interaction");
	assert.equal(lcpEvents.length, 1);
	assert.equal(lcpEvents[0].payload.value, 123.45);

	const replayed = [];
	page.window.bonzer.hooks.subscribe(
		(event) => replayed.push(event.name),
		["user.interacted", "performance.lcp"],
	);
	assert.deepEqual(replayed, ["user.interacted", "performance.lcp"]);

	await fixture.cleanup();
});

test("restores recent activity only after same-origin navigation", async () => {
	const fixture = await buildFixture("export default {}");
	const storage = new Map([["bonzer.userActiveAt", String(Date.now())]]);
	const sameOriginPage = browser(undefined, {
		referrer: "https://example.com/previous",
		storage,
		url: "https://example.com/current",
	});
	sameOriginPage.run(fixture.code);

	const interactions = sameOriginPage.window.bonzer.hooks.filter([
		"user.interacted",
	]);
	assert.equal(interactions.length, 1);
	assert.equal(interactions[0].payload.source, "session");

	const externalEntryPage = browser(undefined, {
		referrer: "https://other.example/previous",
		storage,
		url: "https://example.com/current",
	});
	externalEntryPage.run(fixture.code);
	assert.equal(
		externalEntryPage.window.bonzer.hooks.filter(["user.interacted"])
			.length,
		0,
	);

	storage.set("bonzer.userActiveAt", String(Date.now() - 5 * 60 * 1000 - 1));
	const expiredPage = browser(undefined, {
		referrer: "https://example.com/previous",
		storage,
		url: "https://example.com/current",
	});
	expiredPage.run(fixture.code);
	assert.equal(
		expiredPage.window.bonzer.hooks.filter(["user.interacted"]).length,
		0,
	);

	await fixture.cleanup();
});

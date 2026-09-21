import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import vm from "node:vm";
import { parseHTML } from "linkedom";

export const root = path.resolve(import.meta.dirname, "..");

export function browser(
	html = "<!doctype html><html><head></head><body></body></html>",
	options = {},
) {
	const parsed = parseHTML(html);
	const { document } = parsed;
	const storage = options.storage ?? new Map();
	const observers = [];
	const sessionStorage = {
		getItem: (key) => storage.get(key) ?? null,
		setItem: (key, value) => storage.set(key, value),
		removeItem: (key) => storage.delete(key),
		clear: () => storage.clear(),
	};
	class PerformanceObserver {
		constructor(callback) {
			this.callback = callback;
			observers.push(this);
		}

		observe() {}

		disconnect() {
			this.disconnected = true;
		}
	}

	Object.defineProperty(document, "referrer", {
		value: options.referrer ?? "",
	});
	const window = {
		document,
		location: new URL(options.url ?? "https://example.com/"),
		sessionStorage,
		PerformanceObserver,
		Event: parsed.window.Event,
		addEventListener: document.addEventListener.bind(document),
		removeEventListener: document.removeEventListener.bind(document),
		dispatchEvent: document.dispatchEvent.bind(document),
	};
	return {
		window,
		document,
		storage,
		emitLcp(value) {
			for (const observer of observers) {
				if (observer.disconnected) continue;
				observer.callback({
					getEntries: () => [{ startTime: value }],
				});
			}
		},
		run: (code) =>
			vm.runInNewContext(code, {
				window,
				document,
				PerformanceObserver,
				URL,
			}),
	};
}

export async function buildFixture(configSource) {
	const directory = await mkdtemp(path.join(tmpdir(), "tracking-handler-"));
	const configPath = path.join(directory, "tracking.config.ts");
	const outputPath = path.join(directory, "tracking.js");
	await writeFile(configPath, configSource);

	const result = spawnSync(
		process.execPath,
		["scripts/build.mjs", `--config=${configPath}`, `--out=${outputPath}`],
		{ cwd: root, encoding: "utf8" },
	);
	assert.equal(result.status, 0, result.stderr);
	return {
		code: await readFile(outputPath, "utf8"),
		cleanup: () => rm(directory, { recursive: true, force: true }),
	};
}

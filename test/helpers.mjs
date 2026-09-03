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
) {
	const { document } = parseHTML(html);
	const window = { document };
	return {
		window,
		document,
		run: (code) => vm.runInNewContext(code, { window, document }),
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

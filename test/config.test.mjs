import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { root } from "./helpers.mjs";

async function invalidConfig(source) {
	const directory = await mkdtemp(path.join(tmpdir(), "tracking-handler-"));
	const configPath = path.join(directory, "tracking.config.ts");
	await writeFile(configPath, source);

	const result = spawnSync(
		process.execPath,
		["scripts/build.mjs", `--config=${configPath}`],
		{ cwd: root, encoding: "utf8" },
	);
	await rm(directory, { recursive: true, force: true });
	return result;
}

test("rejects unknown configuration keys at build time", async () => {
	const result = await invalidConfig(
		`export default { unknown_tracker: "id" }`,
	);

	assert.notEqual(result.status, 0);
	assert.match(result.stderr, /Unknown tracking config key: unknown_tracker/);
});

test("rejects nonnumeric Hotjar IDs at build time", async () => {
	const result = await invalidConfig(
		`export default { hotjar: "not-a-number" }`,
	);

	assert.notEqual(result.status, 0);
	assert.match(result.stderr, /hotjar must contain only numeric IDs/);
});

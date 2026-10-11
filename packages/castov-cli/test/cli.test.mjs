import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const CLI = fileURLToPath(new URL("../dist/cli.js", import.meta.url));
const run = (args, input) => spawnSync(process.execPath, [CLI, ...args], { input, encoding: "utf8", env: { ...process.env, NO_COLOR: "1" } });

const UUID4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

test("castov uuid prints exactly one raw UUID", () => {
  const r = run(["uuid"]);
  assert.equal(r.status, 0);
  assert.match(r.stdout.trim(), UUID4);
  assert.equal(r.stdout.trim().split("\n").length, 1);
});

test("castov uuid -n 3 --v7 --upper", () => {
  const lines = run(["uuid", "-n", "3", "--v7", "--upper"]).stdout.trim().split("\n");
  assert.equal(lines.length, 3);
  for (const l of lines) assert.match(l, /^[0-9A-F]{8}-[0-9A-F]{4}-7/);
});

test("encode/decode and stdin", () => {
  assert.equal(run(["encode", "hello"]).stdout.trim(), "aGVsbG8=");
  assert.equal(run(["decode"], "aGVsbG8=").stdout.trim(), "hello");
});

test("hash from stdin", () => {
  assert.equal(run(["hash"], "abc").stdout.trim(), "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
});

test("unix conversion", () => {
  assert.equal(run(["unix", "0"]).stdout.trim(), "1970-01-01T00:00:00.000Z");
});

test("unknown command exits 2", () => {
  const r = run(["nope"]);
  assert.equal(r.status, 2);
  assert.match(r.stderr, /unknown command/);
});

test("--version", () => {
  assert.match(run(["--version"]).stdout.trim(), /^\d+\.\d+\.\d+$/);
});

import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const CLI = fileURLToPath(new URL("../dist/cli.js", import.meta.url));
const run = (args, input) =>
  spawnSync(process.execPath, [CLI, ...args], {
    input,
    encoding: "utf8",
    env: { ...process.env, NO_COLOR: "1" },
  });

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
  for (const l of lines) {
    assert.match(l, /^[0-9A-F]{8}-[0-9A-F]{4}-7/);
  }
});

test("castov nanoid", () => {
  const r = run(["nanoid", "32"]);
  assert.equal(r.status, 0);
  assert.equal(r.stdout.trim().length, 32);
});

test("encode/decode and stdin", () => {
  assert.equal(run(["encode", "hello"]).stdout.trim(), "aGVsbG8=");
  assert.equal(run(["decode"], "aGVsbG8=").stdout.trim(), "hello");
});

test("hash from stdin", () => {
  assert.equal(
    run(["hash"], "abc").stdout.trim(),
    "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"
  );
});

test("unix conversion", () => {
  assert.equal(run(["unix", "0"]).stdout.trim(), "1970-01-01T00:00:00.000Z");
  assert.equal(run(["unix", "1970-01-01T00:00:00.000Z"]).stdout.trim(), "0");
});

test("now prints timestamp and ISO", () => {
  const lines = run(["now"]).stdout.trim().split("\n");
  assert.equal(lines.length, 2);
  assert.match(lines[0], /^\d+$/);
  assert.match(lines[1], /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
});

test("jwt decode", () => {
  const token =
    "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkFsaWNlIn0.signature";
  const r = run(["jwt", token]);
  assert.equal(r.status, 0);
  assert.match(r.stdout, /Alice/);
  assert.match(r.stdout, /HS256/);
});

test("castov ts: auto-detects seconds and milliseconds", () => {
  // Seconds
  const rSec = run(["ts", "1700000000"]);
  assert.equal(rSec.status, 0);
  assert.match(rSec.stdout, /UTC:\s+Tue, 14 Nov 2023 22:13:20 GMT/);
  assert.match(rSec.stdout, /ISO 8601:\s+2023-11-14T22:13:20.000Z/);
  assert.match(rSec.stdout, /Local:\s+/);

  // Milliseconds
  const rMs = run(["ts", "1700000000123"]);
  assert.equal(rMs.status, 0);
  assert.match(rMs.stdout, /ISO 8601:\s+2023-11-14T22:13:20.123Z/);

  // Stdin pipe
  const rPipe = run(["ts"], "1700000000\n");
  assert.equal(rPipe.status, 0);
  assert.match(rPipe.stdout, /ISO 8601:\s+2023-11-14T22:13:20.000Z/);
});

test("castov detect: ObjectId, UUIDv7, ULID, Snowflake", () => {
  // MongoDB ObjectId
  const rOid = run(["detect", "507f1f77bcf86cd799439011"]);
  assert.equal(rOid.status, 0);
  assert.match(rOid.stdout, /MongoDB ObjectId/);
  assert.match(rOid.stdout, /2012-10-17T21:13:27.000Z/);

  // UUIDv7
  const rU7 = run(["detect", "018bcfe5-6800-7d90-bc4e-2895f32a762c"]);
  assert.equal(rU7.status, 0);
  assert.match(rU7.stdout, /UUIDv7/);
  assert.match(rU7.stdout, /2023-11-14T22:13:20.000Z/);

  // ULID
  const rUlid = run(["detect", "01ARZ3NDEKTSV4RRFFQ69G5FAV"]);
  assert.equal(rUlid.status, 0);
  assert.match(rUlid.stdout, /ULID/);
  assert.match(rUlid.stdout, /2016-07-30/);

  // Snowflake
  const rSnow = run(["detect", "841126781289193472"]);
  assert.equal(rSnow.status, 0);
  assert.match(rSnow.stdout, /Snowflake/);

  // Unrecognized input
  const rNone = run(["detect", "completely-invalid-id"]);
  assert.equal(rNone.status, 0);
  assert.match(rNone.stdout, /No recognized timestamp or ID format found/);
});

test("castov cron: explains expression and outputs next 5 runs", () => {
  const r = run(["cron", "0 9 * * 1-5", "America/New_York"]);
  assert.equal(r.status, 0);
  assert.match(r.stdout, /Schedule:\s+At 09:00, on Monday through Friday/);
  assert.match(r.stdout, /Timezone:\s+America\/New_York/);
  assert.match(r.stdout, /Next 5 runs:/);
  assert.match(r.stdout, /1\./);
  assert.match(r.stdout, /5\./);

  // Macro
  const rMacro = run(["cron", "@hourly"]);
  assert.equal(rMacro.status, 0);
  assert.match(rMacro.stdout, /At the start of every hour/);
});

test("castov tz: converts between zones and handles DST", () => {
  // Normal conversion
  const rNormal = run(["tz", "2026-10-11 14:00:00", "America/New_York", "Europe/Paris"]);
  assert.equal(rNormal.status, 0);
  assert.match(rNormal.stdout, /From:\s+2026-10-11 14:00:00 America\/New_York/);
  assert.match(rNormal.stdout, /To:\s+2026-10-11 20:00:00 Europe\/Paris/);

  // DST Gap (spring forward, nonexistent hour)
  const rGap = run(["tz", "2026-03-08 02:30:00", "America/New_York", "UTC"]);
  assert.equal(rGap.status, 0);
  assert.match(rGap.stdout, /Warning:/);
  assert.match(rGap.stdout, /spring-forward gap/);
  assert.match(rGap.stdout, /03:30:00/);

  // DST Overlap (fall back, ambiguous hour)
  const rOverlap = run(["tz", "2026-11-01 01:30:00", "America/New_York", "UTC"]);
  assert.equal(rOverlap.status, 0);
  assert.match(rOverlap.stdout, /Warning:/);
  assert.match(rOverlap.stdout, /fall-back overlap/);
});

test("per-command --help flags", () => {
  const commands = ["fix", "port", "secret", "cidr", "scan", "rules", "ts", "detect", "cron", "tz", "uuid", "encode", "decode", "hash", "jwt"];
  for (const cmd of commands) {
    const r = run([cmd, "--help"]);
    assert.equal(r.status, 0);
    assert.match(r.stdout, new RegExp(`castov ${cmd}`, "i"));
    assert.match(r.stdout, /Usage/i);
  }
});

test("castov port: inspects known port and outputs reference link", () => {
  const r = run(["port", "5432"]);
  assert.equal(r.status, 0);
  assert.match(r.stdout, /Port 5432/);
  assert.match(r.stdout, /PostgreSQL/);
  assert.match(r.stdout, /https:\/\/www\.castov\.com\/ports\/5432/);
});

test("castov secret: generates cryptographic secrets", () => {
  const r = run(["secret"]);
  assert.equal(r.status, 0);
  assert.match(r.stdout, /256-bit Entropy/);
  assert.match(r.stdout, /AUTH_SECRET=/);
  assert.match(r.stdout, /sk_live_/);
  assert.match(r.stdout, /https:\/\/www\.castov\.com\/env-vault/);
});

test("castov cidr: calculates IPv4 subnet mask and usable host range", () => {
  const r = run(["cidr", "192.168.1.0/24"]);
  assert.equal(r.status, 0);
  assert.match(r.stdout, /255\.255\.255\.0/);
  assert.match(r.stdout, /192\.168\.1\.1 - 192\.168\.1\.254/);
  assert.match(r.stdout, /254/);
  assert.match(r.stdout, /https:\/\/www\.castov\.com\/cidr\/24/);
});

test("castov scan: scans directory offline", () => {
  const r = run(["scan", "./test"]);
  assert.equal(r.status, 0);
  assert.match(r.stdout, /Castov Local Secret Scanner/);
  assert.match(r.stdout, /https:\/\/www\.castov\.com\/env-vault/);
});

test("castov fix & rules: diagnoses errors and generates AI rules", () => {
  const rFix = run(["fix", "EADDRINUSE: address already in use :::3000"]);
  assert.equal(rFix.status, 0);
  assert.match(rFix.stdout, /Port \/ Address Conflict/);

  const rRules = run(["rules", "rust"]);
  assert.equal(rRules.status, 0);
  assert.match(rRules.stdout, /Rust Systems/);
  assert.match(rRules.stdout, /https:\/\/www\.castov\.com\/cursorrules/);
});

test("global --help and --version", () => {
  const rHelp = run(["--help"]);
  assert.equal(rHelp.status, 0);
  assert.match(rHelp.stdout, /castov.*— zero-server developer utilities/);

  const rVer = run(["--version"]);
  assert.equal(rVer.status, 0);
  assert.match(rVer.stdout.trim(), /^\d+\.\d+\.\d+$/);
});

test("unknown command exits with code 2", () => {
  const r = run(["unknown-cmd"]);
  assert.equal(r.status, 2);
  assert.match(r.stderr, /unknown command/);
});

import { test } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { mkdtempSync, rmSync, existsSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import {
  isTelemetryDisabled,
  getAnonId,
  TelemetryClient,
} from "../dist/telemetry.js";

const DIST_CLI = fileURLToPath(new URL("../dist/cli.js", import.meta.url));

test("Telemetry: opt-out flags respect CASTOV_TELEMETRY=0, DO_NOT_TRACK=1, and CI=1", () => {
  const origEnv = { ...process.env };

  try {
    delete process.env.CASTOV_TELEMETRY;
    delete process.env.DO_NOT_TRACK;
    delete process.env.CI;
    assert.equal(isTelemetryDisabled(), false);

    process.env.CASTOV_TELEMETRY = "0";
    assert.equal(isTelemetryDisabled(), true);

    delete process.env.CASTOV_TELEMETRY;
    process.env.DO_NOT_TRACK = "1";
    assert.equal(isTelemetryDisabled(), true);

    delete process.env.DO_NOT_TRACK;
    process.env.CI = "true";
    assert.equal(isTelemetryDisabled(), true);
  } finally {
    process.env = origEnv;
  }
});

test("Telemetry: anon-id is generated once as UUID and persisted", () => {
  const tmp = mkdtempSync(join(tmpdir(), "castov-telem-"));
  const origDir = process.env.CASTOV_CONFIG_DIR;
  const origTelem = process.env.CASTOV_TELEMETRY;
  const origDnt = process.env.DO_NOT_TRACK;
  const origCi = process.env.CI;

  try {
    process.env.CASTOV_CONFIG_DIR = tmp;
    delete process.env.CASTOV_TELEMETRY;
    delete process.env.DO_NOT_TRACK;
    delete process.env.CI;

    const id1 = getAnonId();
    assert.match(id1, /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);

    const anonFile = join(tmp, "anon-id");
    assert.equal(existsSync(anonFile), true);
    assert.equal(readFileSync(anonFile, "utf8").trim(), id1);

    // Second call returns the exact same ID
    const id2 = getAnonId();
    assert.equal(id2, id1);
  } finally {
    if (origDir) process.env.CASTOV_CONFIG_DIR = origDir;
    else delete process.env.CASTOV_CONFIG_DIR;
    if (origTelem) process.env.CASTOV_TELEMETRY = origTelem;
    if (origDnt) process.env.DO_NOT_TRACK = origDnt;
    if (origCi) process.env.CI = origCi;
    rmSync(tmp, { recursive: true, force: true });
  }
});

test("Telemetry: tool usage in-memory aggregation batches multiple calls into one payload", async () => {
  const receivedPayloads = [];
  const server = http.createServer((req, res) => {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      receivedPayloads.push(JSON.parse(body));
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true }));
    });
  });

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = server.address().port;
  const testUrl = `http://127.0.0.1:${port}`;

  const origTelem = process.env.CASTOV_TELEMETRY;
  const origDnt = process.env.DO_NOT_TRACK;
  const origCi = process.env.CI;

  try {
    delete process.env.CASTOV_TELEMETRY;
    delete process.env.DO_NOT_TRACK;
    delete process.env.CI;

    const client = new TelemetryClient(testUrl);

    // Record 3 tool calls across 2 different tools
    client.recordToolCall("castov_timestamp", 12.5, true);
    client.recordToolCall("castov_timestamp", 8.2, true);
    client.recordToolCall("castov_port", 45.0, false);

    // Flush should combine them into a single tools_aggregate request
    await client.flushToolAggregates();

    assert.equal(receivedPayloads.length, 1);
    const p = receivedPayloads[0];
    assert.equal(p.event_type, "tools_aggregate");
    assert.equal(p.command_name, "mcp");
    assert.equal(Array.isArray(p.tools), true);
    assert.equal(p.tools.length, 2);

    const tsStats = p.tools.find((t) => t.tool_name === "castov_timestamp");
    assert.equal(tsStats.call_count, 2);
    assert.equal(tsStats.error_count, 0);
    assert.equal(tsStats.total_duration_ms, 21);

    const portStats = p.tools.find((t) => t.tool_name === "castov_port");
    assert.equal(portStats.call_count, 1);
    assert.equal(portStats.error_count, 1);
    assert.equal(portStats.total_duration_ms, 45);

    // Second flush with empty map does nothing
    await client.flushToolAggregates();
    assert.equal(receivedPayloads.length, 1);

    client.destroy();
  } finally {
    if (origTelem) process.env.CASTOV_TELEMETRY = origTelem;
    if (origDnt) process.env.DO_NOT_TRACK = origDnt;
    if (origCi) process.env.CI = origCi;
    server.close();
  }
});

test("CRITICAL GUARANTEE: 'castov audit' performs ZERO network requests and NEVER creates ~/.castov/anon-id", async () => {
  let serverRequests = 0;
  const server = http.createServer((req, res) => {
    serverRequests++;
    res.writeHead(200);
    res.end();
  });

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = server.address().port;
  const testUrl = `http://127.0.0.1:${port}`;

  const tmp = mkdtempSync(join(tmpdir(), "castov-audit-clean-"));

  try {
    // Run castov audit pointing telemetry to our local test server
    const r = spawnSync(process.execPath, [DIST_CLI, "audit", "--format", "json", "--fail-on", "none"], {
      encoding: "utf8",
      env: {
        ...process.env,
        CASTOV_CONFIG_DIR: tmp,
        CASTOV_TELEMETRY_URL: testUrl,
        // Ensure telemetry is NOT disabled via flags to test the code-path guarantee itself
        CASTOV_TELEMETRY: "1",
        DO_NOT_TRACK: "0",
        CI: "0",
      },
    });

    assert.equal(r.status, 0);

    // 1. Assert exactly 0 requests reached the network
    assert.equal(serverRequests, 0, "castov audit MUST NEVER perform network calls");

    // 2. Assert anon-id was NOT created by running audit alone
    assert.equal(
      existsSync(join(tmp, "anon-id")),
      false,
      "castov audit MUST NOT create ~/.castov/anon-id"
    );

    // 3. Contrast with a normal command (e.g. uuid) which DOES dispatch one ping
    const r2 = spawnSync(process.execPath, [DIST_CLI, "uuid"], {
      encoding: "utf8",
      env: {
        ...process.env,
        CASTOV_CONFIG_DIR: tmp,
        CASTOV_TELEMETRY_URL: testUrl,
        CASTOV_TELEMETRY: "1",
        DO_NOT_TRACK: "0",
        CI: "0",
      },
    });
    assert.equal(r2.status, 0);

    // Give fire-and-forget ping a moment
    await new Promise((resolve) => setTimeout(resolve, 200));
    assert.equal(serverRequests, 1, "non-audit commands dispatch normal telemetry ping");
    assert.equal(
      existsSync(join(tmp, "anon-id")),
      true,
      "non-audit commands create anon-id"
    );
  } finally {
    server.close();
    rmSync(tmp, { recursive: true, force: true });
  }
});

test("First-run telemetry notice: appears once on stderr for non-mcp commands, never in mcp or audit", () => {
  const tmp = mkdtempSync(join(tmpdir(), "castov-notice-"));

  try {
    // 1. Running 'uuid' for the first time outputs notice on stderr
    const r1 = spawnSync(process.execPath, [DIST_CLI, "uuid"], {
      encoding: "utf8",
      env: {
        ...process.env,
        CASTOV_CONFIG_DIR: tmp,
        CASTOV_TELEMETRY: "1",
        DO_NOT_TRACK: "0",
        CI: "0",
      },
    });
    assert.equal(r1.status, 0);
    assert.match(r1.stderr, /Anonymous usage stats enabled/i);
    assert.equal(existsSync(join(tmp, ".telemetry-notice-shown")), true);

    // 2. Running 'uuid' second time outputs NOTHING on stderr
    const r2 = spawnSync(process.execPath, [DIST_CLI, "uuid"], {
      encoding: "utf8",
      env: {
        ...process.env,
        CASTOV_CONFIG_DIR: tmp,
        CASTOV_TELEMETRY: "1",
        DO_NOT_TRACK: "0",
        CI: "0",
      },
    });
    assert.equal(r2.status, 0);
    assert.equal(r2.stderr.trim(), "");

    // 3. Brand new directory running 'audit' outputs NO notice on stderr
    const tmpAudit = mkdtempSync(join(tmpdir(), "castov-audit-notice-"));
    const rAudit = spawnSync(process.execPath, [DIST_CLI, "audit", "--format", "json", "--fail-on", "none"], {
      encoding: "utf8",
      env: {
        ...process.env,
        CASTOV_CONFIG_DIR: tmpAudit,
        CASTOV_TELEMETRY: "1",
        DO_NOT_TRACK: "0",
        CI: "0",
      },
    });
    assert.doesNotMatch(rAudit.stderr, /Anonymous usage stats enabled/i);
    assert.equal(existsSync(join(tmpAudit, ".telemetry-notice-shown")), false);
    rmSync(tmpAudit, { recursive: true, force: true });
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

test("castov audit code path NEVER imports telemetry module", () => {
  const cliCode = readFileSync(DIST_CLI, "utf8");
  // 1. Static import check: cli.ts/cli.js must NOT statically import telemetry
  assert.equal(
    /^import\s+.*from\s+['"].*telemetry.*['"]/m.test(cliCode),
    false,
    "cli.js MUST NOT statically import telemetry module at top level"
  );

  // 2. Dynamic import check: telemetry is only imported if command !== 'audit'
  assert.match(
    cliCode,
    /if\s*\(\s*command\s*!==\s*["']audit["']\s*\)/,
    "telemetry import MUST be guarded by command !== 'audit'"
  );
});

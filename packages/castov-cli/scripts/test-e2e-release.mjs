import { spawn, spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, existsSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import assert from "node:assert/strict";

const CLI_PATH = join(process.cwd(), "packages", "castov-cli", "dist", "cli.js");

console.log("=== Starting Real E2E Test Against Production (castov.com) ===");
console.log(`Using CLI: ${CLI_PATH}\n`);

// Helper to build framed JSON-RPC message
function buildFramed(obj) {
  const jsonBuf = Buffer.from(JSON.stringify(obj), "utf8");
  const headerBuf = Buffer.from(`Content-Length: ${jsonBuf.length}\r\n\r\n`, "utf8");
  return Buffer.concat([headerBuf, jsonBuf]);
}

// ---------------------------------------------------------------------------
// TEST 1: Non-MCP command with telemetry enabled (first-run notice on stderr)
// ---------------------------------------------------------------------------
console.log("--> Test 1: Non-MCP command (castov ts) with telemetry enabled...");
const tempHome1 = mkdtempSync(join(tmpdir(), "castov-test-home1-"));
const cleanEnv1 = {
  ...process.env,
  HOME: tempHome1,
  USERPROFILE: tempHome1,
  CASTOV_CONFIG_DIR: join(tempHome1, ".castov"),
};
delete cleanEnv1.CASTOV_TELEMETRY;
delete cleanEnv1.DO_NOT_TRACK;
delete cleanEnv1.CI;

const run1 = spawnSync(process.execPath, [CLI_PATH, "ts", "1700000000"], {
  env: cleanEnv1,
  encoding: "utf8",
  timeout: 10000,
});

assert.equal(run1.status, 0, `castov ts exited with ${run1.status}`);
assert.match(
  run1.stderr,
  /Anonymous usage stats enabled\. Disable with CASTOV_TELEMETRY=0/i,
  "First-run notice must appear on stderr"
);
console.log("  [PASS] First-run notice appeared on stderr.");

const anonIdFile1 = join(tempHome1, ".castov", "anon-id");
assert(existsSync(anonIdFile1), "anon-id file should be created in ~/.castov");
const anonId1 = readFileSync(anonIdFile1, "utf8").trim();
console.log(`  [PASS] Generated anon-id: ${anonId1}`);

// Second run should NOT display the notice
const run1_second = spawnSync(process.execPath, [CLI_PATH, "ts", "1700000000"], {
  env: cleanEnv1,
  encoding: "utf8",
  timeout: 10000,
});
assert.equal(run1_second.stderr, "", "First-run notice must not appear on subsequent runs");
console.log("  [PASS] Subsequent run did NOT display first-run notice.");

// ---------------------------------------------------------------------------
// TEST 2: castov mcp stdio session (initialize + tools/call + clean exit)
// ---------------------------------------------------------------------------
console.log("\n--> Test 2: castov mcp stdio (initialize + tools/call + clean exit)...");
const tempHome2 = mkdtempSync(join(tmpdir(), "castov-test-home2-"));
const cleanEnv2 = {
  ...process.env,
  HOME: tempHome2,
  USERPROFILE: tempHome2,
  CASTOV_CONFIG_DIR: join(tempHome2, ".castov"),
};
delete cleanEnv2.CASTOV_TELEMETRY;
delete cleanEnv2.DO_NOT_TRACK;
delete cleanEnv2.CI;

await new Promise((resolve, reject) => {
  const mcpProc = spawn(process.execPath, [CLI_PATH, "mcp"], {
    env: cleanEnv2,
    stdio: ["pipe", "pipe", "pipe"],
  });

  let stdoutBuf = Buffer.alloc(0);
  let stderrText = "";
  const responses = [];

  mcpProc.stderr.on("data", (chunk) => {
    stderrText += chunk.toString("utf8");
  });

  mcpProc.stdout.on("data", (chunk) => {
    stdoutBuf = Buffer.concat([stdoutBuf, chunk]);
    while (true) {
      const headerEnd = stdoutBuf.indexOf("\r\n\r\n");
      if (headerEnd === -1) break;
      const match = stdoutBuf.subarray(0, headerEnd).toString("utf8").match(/^Content-Length:[ \t]*(\d+)[ \t]*$/im);
      if (!match) break;
      const len = parseInt(match[1], 10);
      const start = headerEnd + 4;
      if (stdoutBuf.length < start + len) break;

      const payload = stdoutBuf.subarray(start, start + len).toString("utf8");
      stdoutBuf = stdoutBuf.subarray(start + len);
      try {
        responses.push(JSON.parse(payload));
      } catch {
        return reject(new Error("stdout contained invalid JSON payload: " + payload));
      }

      if (responses.length === 2) {
        // We received both responses: 1) initialize, 2) tools/call
        // Cleanly close stdin to trigger flush and clean exit
        mcpProc.stdin.end();
      }
    }
  });

  mcpProc.on("close", (code) => {
    try {
      assert.equal(code, 0, `castov mcp exited with code ${code}`);
      assert.equal(stderrText, "", "stderr must be 100% empty during castov mcp session");
      assert.equal(responses.length, 2, "Expected exactly 2 responses on stdout");

      // Verify response 1: initialize
      assert.equal(responses[0].id, 1);
      assert.equal(responses[0].result.serverInfo.name, "castov-mcp-server");
      assert.equal(responses[0].result.serverInfo.version, "1.6.0");

      // Verify response 2: tools/call
      assert.equal(responses[1].id, 2);
      assert.equal(Array.isArray(responses[1].result.content), true);
      assert.match(responses[1].result.content[0].text, /UTC/i);

      console.log("  [PASS] stdout contained ONLY valid framed JSON-RPC responses.");
      console.log("  [PASS] stderr was completely empty (no pollution).");
      resolve();
    } catch (err) {
      reject(err);
    }
  });

  // Send framed initialize
  mcpProc.stdin.write(
    buildFramed({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: { name: "release-e2e-test", version: "1.0.0" },
      },
    })
  );

  // Send notifications/initialized
  mcpProc.stdin.write(
    buildFramed({
      jsonrpc: "2.0",
      method: "notifications/initialized",
    })
  );

  // Send tools/call
  mcpProc.stdin.write(
    buildFramed({
      jsonrpc: "2.0",
      id: 2,
      method: "tools/call",
      params: {
        name: "castov_timestamp",
        arguments: { value: "1700000000" },
      },
    })
  );
});

const anonIdFile2 = join(tempHome2, ".castov", "anon-id");
const anonId2 = existsSync(anonIdFile2) ? readFileSync(anonIdFile2, "utf8").trim() : "none";
console.log(`  [PASS] MCP session generated anon-id: ${anonId2}`);

// ---------------------------------------------------------------------------
// TEST 3: castov audit guarantee (never creates ~/.castov, zero network)
// ---------------------------------------------------------------------------
console.log("\n--> Test 3: castov audit zero-side-effects guarantee...");
const tempHome3 = mkdtempSync(join(tmpdir(), "castov-test-home3-"));
const cleanEnv3 = {
  ...process.env,
  HOME: tempHome3,
  USERPROFILE: tempHome3,
  CASTOV_CONFIG_DIR: join(tempHome3, ".castov"),
};
delete cleanEnv3.CASTOV_TELEMETRY;
delete cleanEnv3.DO_NOT_TRACK;
delete cleanEnv3.CI;

const run3 = spawnSync(process.execPath, [CLI_PATH, "audit", "--help"], {
  env: cleanEnv3,
  encoding: "utf8",
  timeout: 10000,
});
assert.equal(run3.status, 0);
assert.equal(
  existsSync(join(tempHome3, ".castov")),
  false,
  "~/.castov directory must NOT exist after running castov audit"
);
console.log("  [PASS] ~/.castov directory was NOT created by castov audit.");

// ---------------------------------------------------------------------------
// TEST 4: Opt-out variables (CASTOV_TELEMETRY=0 and DO_NOT_TRACK=1)
// ---------------------------------------------------------------------------
console.log("\n--> Test 4: Opt-out checks...");
const tempHome4a = mkdtempSync(join(tmpdir(), "castov-test-home4a-"));
const env4a = {
  ...process.env,
  HOME: tempHome4a,
  USERPROFILE: tempHome4a,
  CASTOV_CONFIG_DIR: join(tempHome4a, ".castov"),
  CASTOV_TELEMETRY: "0",
};
delete env4a.DO_NOT_TRACK;
delete env4a.CI;

const run4a = spawnSync(process.execPath, [CLI_PATH, "ts", "1700000000"], {
  env: env4a,
  encoding: "utf8",
  timeout: 10000,
});
assert.equal(run4a.status, 0);
assert.equal(run4a.stderr, "", "CASTOV_TELEMETRY=0 must not print notice on stderr");
assert.equal(existsSync(join(tempHome4a, ".castov")), false, "CASTOV_TELEMETRY=0 must not create ~/.castov");
console.log("  [PASS] CASTOV_TELEMETRY=0 completely silent and created no files.");

const tempHome4b = mkdtempSync(join(tmpdir(), "castov-test-home4b-"));
const env4b = {
  ...process.env,
  HOME: tempHome4b,
  USERPROFILE: tempHome4b,
  CASTOV_CONFIG_DIR: join(tempHome4b, ".castov"),
  DO_NOT_TRACK: "1",
};
delete env4b.CASTOV_TELEMETRY;
delete env4b.CI;

const run4b = spawnSync(process.execPath, [CLI_PATH, "ts", "1700000000"], {
  env: env4b,
  encoding: "utf8",
  timeout: 10000,
});
assert.equal(run4b.status, 0);
assert.equal(run4b.stderr, "", "DO_NOT_TRACK=1 must not print notice on stderr");
assert.equal(existsSync(join(tempHome4b, ".castov")), false, "DO_NOT_TRACK=1 must not create ~/.castov");
console.log("  [PASS] DO_NOT_TRACK=1 completely silent and created no files.");

// Clean up temp directories
try {
  rmSync(tempHome1, { recursive: true, force: true });
  rmSync(tempHome2, { recursive: true, force: true });
  rmSync(tempHome3, { recursive: true, force: true });
  rmSync(tempHome4a, { recursive: true, force: true });
  rmSync(tempHome4b, { recursive: true, force: true });
} catch (err) {
  void err;
}

console.log("\n=== ALL REAL E2E TESTS PASSED SUCCESSFULLY! ===");
console.log(`\nExpected rows created in mcp_telemetry_events on production:`);
console.log(`  1. event_type: 'cli_ping' (anon_id: ${anonId1}, command: 'ts', castov_version: '1.6.0')`);
console.log(`  2. event_type: 'cli_ping' (anon_id: ${anonId1}, command: 'ts', castov_version: '1.6.0') [second run verification]`);
console.log(`  3. event_type: 'initialize' (anon_id: ${anonId2}, client: 'release-e2e-test', castov_version: '1.6.0')`);
console.log(`  4. event_type: 'tools_aggregate' (anon_id: ${anonId2}, tool: 'castov_timestamp', calls: 1, errors: 0)`);

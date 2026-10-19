import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const DIST_CLI = fileURLToPath(new URL("../dist/cli.js", import.meta.url));
const BIN_CLI = fileURLToPath(new URL("../../../bin/castov.js", import.meta.url));
const CLI = existsSync(DIST_CLI) ? DIST_CLI : BIN_CLI;
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

// ---------------------------------------------------------------------------
// Robust MCP Test Harness & Dual-Mode Stream Readers
// ---------------------------------------------------------------------------
function createMcpHarness(t, timeoutMs = 8000) {
  const client = spawn(process.execPath, [CLI, "mcp"], { stdio: ["pipe", "pipe", "pipe"] });
  const timers = new Set();
  const setTracked = (fn, d) => {
    const id = setTimeout(() => { timers.delete(id); fn(); }, d);
    timers.add(id);
    return id;
  };
  client.on("error", () => {});       // مستمع دائم لمنع unhandled error
  client.stderr.on("data", () => {}); // استهلاك stderr لمنع امتلاء الأنبوب
  let closed = false;
  let closeCode = null;
  const closePromise = new Promise((r) => client.once("close", (code) => {
    closed = true;
    closeCode = code;
    r(code);
  }));

  const cleanup = async () => {
    for (const id of timers) clearTimeout(id);
    timers.clear();
    if (!closed) {
      client.kill("SIGTERM");
      const killTimer = setTracked(() => { if (!closed) client.kill("SIGKILL"); }, 500);
      await Promise.race([closePromise, new Promise((r) => setTimeout(r, 2000).unref())]);
      clearTimeout(killTimer);
    }
    client.stdout.removeAllListeners("data");
  };
  t.after(cleanup);
  return { client, setTracked, timeoutMs, closePromise, getCloseCode: () => closeCode };
}

function readFramedResponses(client, count, timeoutMs, setTracked) {
  return new Promise((resolve, reject) => {
    let outBuf = Buffer.alloc(0);
    const responses = [];
    const timer = setTracked(() => {
      client.stdout.removeListener("data", onData);
      reject(new Error(`Timeout (${timeoutMs}ms) waiting for ${count} framed responses (got ${responses.length})`));
    }, timeoutMs);

    const onData = (chunk) => {
      outBuf = Buffer.concat([outBuf, chunk]);
      while (true) {
        const headerEnd = outBuf.indexOf("\r\n\r\n");
        if (headerEnd === -1) break;
        const match = outBuf.subarray(0, headerEnd).toString("utf8").match(/^Content-Length:[ \t]*(\d+)[ \t]*$/im);
        if (!match) break;
        const len = parseInt(match[1], 10);
        const start = headerEnd + 4;
        if (outBuf.length < start + len) break;

        const payload = outBuf.subarray(start, start + len).toString("utf8");
        outBuf = outBuf.subarray(start + len);
        responses.push(JSON.parse(payload));

        if (responses.length === count) {
          clearTimeout(timer);
          client.stdout.removeListener("data", onData);
          resolve(responses);
          return;
        }
      }
    };
    client.stdout.on("data", onData);
  });
}

function readNdjsonResponses(client, count, timeoutMs, setTracked) {
  return new Promise((resolve, reject) => {
    let outBuf = Buffer.alloc(0);
    const responses = [];
    const timer = setTracked(() => {
      client.stdout.removeListener("data", onData);
      reject(new Error(`Timeout (${timeoutMs}ms) waiting for ${count} ndjson responses (got ${responses.length})`));
    }, timeoutMs);

    const onData = (chunk) => {
      outBuf = Buffer.concat([outBuf, chunk]);
      while (true) {
        const newlineIdx = outBuf.indexOf(0x0a);
        if (newlineIdx === -1) break;
        const line = outBuf.subarray(0, newlineIdx).toString("utf8").trim();
        outBuf = outBuf.subarray(newlineIdx + 1);
        if (line) responses.push(JSON.parse(line));

        if (responses.length === count) {
          clearTimeout(timer);
          client.stdout.removeListener("data", onData);
          resolve(responses);
          return;
        }
      }
    };
    client.stdout.on("data", onData);
  });
}

const buildFramed = (obj) => {
  const jsonBuf = Buffer.from(JSON.stringify(obj), "utf8");
  const headerBuf = Buffer.from(`Content-Length: ${jsonBuf.length}\r\n\r\n`, "utf8");
  return Buffer.concat([headerBuf, jsonBuf]);
};

test("castov mcp: protocol handshake and tools/list in framed mode", async (t) => {
  const { client, setTracked, timeoutMs } = createMcpHarness(t, 5000);
  const promise = readFramedResponses(client, 2, timeoutMs, setTracked);

  client.stdin.write(buildFramed({ jsonrpc: "2.0", id: 1, method: "initialize" }));
  client.stdin.write(buildFramed({ jsonrpc: "2.0", id: 2, method: "tools/list" }));

  const [initRes, listRes] = await promise;
  assert.equal(initRes.id, 1);
  assert.equal(initRes.result.serverInfo.name, "castov-mcp-server");
  assert.equal(listRes.id, 2);
  const toolNames = listRes.result.tools.map((x) => x.name);
  assert.deepEqual(toolNames, [
    "castov_timestamp",
    "castov_detect_id",
    "castov_cidr",
    "castov_port",
    "castov_cron",
    "castov_timezone",
    "castov_secret",
    "castov_jwt_decode",
    "castov_hash",
    "castov_scan_secrets",
  ]);
});

test("castov mcp: handles ndjson mode and replies in ndjson", async (t) => {
  const { client, setTracked, timeoutMs } = createMcpHarness(t, 5000);
  const promise = readNdjsonResponses(client, 1, timeoutMs, setTracked);

  client.stdin.write(JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list" }) + "\n");
  const [res] = await promise;
  assert.equal(res.id, 1);
  assert.equal(res.result.tools.length, 10);
});

test("castov mcp: tools/call handles valid inputs correctly", async (t) => {
  const { client, setTracked, timeoutMs } = createMcpHarness(t, 5000);
  const promise = readFramedResponses(client, 3, timeoutMs, setTracked);

  client.stdin.write(buildFramed({
    jsonrpc: "2.0",
    id: 10,
    method: "tools/call",
    params: { name: "castov_timestamp", arguments: { value: "1700000000" } },
  }));
  client.stdin.write(buildFramed({
    jsonrpc: "2.0",
    id: 11,
    method: "tools/call",
    params: { name: "castov_cidr", arguments: { cidr: "192.168.1.0/24" } },
  }));
  client.stdin.write(buildFramed({
    jsonrpc: "2.0",
    id: 12,
    method: "tools/call",
    params: { name: "castov_port", arguments: { port: 5432 } },
  }));

  const [tsRes, cidrRes, portRes] = await promise;
  assert.equal(tsRes.id, 10);
  assert.equal(tsRes.result.isError, undefined);
  assert.match(tsRes.result.content[0].text, /2023-11-14T22:13:20.000Z/);

  assert.equal(cidrRes.id, 11);
  assert.equal(cidrRes.result.isError, undefined);
  assert.match(cidrRes.result.content[0].text, /Subnet Mask: 255\.255\.255\.0/);

  assert.equal(portRes.id, 12);
  assert.equal(portRes.result.isError, undefined);
  assert.match(portRes.result.content[0].text, /PostgreSQL/);
});

test("castov mcp: regression - invalid inputs return clear error and never hang", async (t) => {
  const { client, setTracked, timeoutMs } = createMcpHarness(t, 5000);
  const promise = readFramedResponses(client, 5, timeoutMs, setTracked);

  client.stdin.write(buildFramed({
    jsonrpc: "2.0",
    id: 20,
    method: "tools/call",
    params: { name: "castov_timestamp", arguments: { value: "not-a-timestamp" } },
  }));
  client.stdin.write(buildFramed({
    jsonrpc: "2.0",
    id: 21,
    method: "tools/call",
    params: { name: "castov_timestamp", arguments: {} },
  }));
  client.stdin.write(buildFramed({
    jsonrpc: "2.0",
    id: 22,
    method: "tools/call",
    params: { name: "castov_cidr", arguments: { cidr: "999.999/99" } },
  }));
  client.stdin.write(buildFramed({
    jsonrpc: "2.0",
    id: 23,
    method: "tools/call",
    params: { name: "castov_port", arguments: { port: 999999 } },
  }));
  client.stdin.write(buildFramed({
    jsonrpc: "2.0",
    id: 24,
    method: "tools/call",
    params: { name: "nonexistent_tool", arguments: {} },
  }));

  const [r20, r21, r22, r23, r24] = await promise;
  assert.equal(r20.id, 20);
  assert.equal(r20.result.isError, true);
  assert.match(r20.result.content[0].text, /invalid numeric timestamp/i);

  assert.equal(r21.id, 21);
  assert.equal(r21.result.isError, true);
  assert.match(r21.result.content[0].text, /missing or invalid 'value'/i);

  assert.equal(r22.id, 22);
  assert.equal(r22.result.isError, true);
  assert.match(r22.result.content[0].text, /between 0 and 32/i);

  assert.equal(r23.id, 23);
  assert.equal(r23.result.isError, true);
  assert.match(r23.result.content[0].text, /between 1 and 65535/i);

  assert.equal(r24.id, 24);
  assert.equal(r24.result.isError, true);
  assert.match(r24.result.content[0].text, /unknown tool/i);
});

test("castov mcp: handles header sent byte-by-byte", async (t) => {
  const { client, setTracked, timeoutMs } = createMcpHarness(t, 5000);
  const promise = readFramedResponses(client, 1, timeoutMs, setTracked);

  const msg = buildFramed({ jsonrpc: "2.0", id: 801, method: "tools/list" });
  const headerEnd = msg.indexOf("\r\n\r\n") + 4;

  for (let i = 0; i < headerEnd; i++) {
    client.stdin.write(msg.subarray(i, i + 1));
  }
  client.stdin.write(msg.subarray(headerEnd));

  const [res] = await promise;
  assert.equal(res.id, 801);
  assert.equal(res.result.tools.length, 10);
});

test("castov mcp: splits multi-byte UTF-8 emoji across chunk boundaries", async (t) => {
  const { client, setTracked, timeoutMs } = createMcpHarness(t, 5000);
  const promise = readFramedResponses(client, 1, timeoutMs, setTracked);

  const msg = buildFramed({
    jsonrpc: "2.0",
    id: 901,
    method: "tools/call",
    params: { name: "castov_timestamp", arguments: { value: "ساعة_1700000000_🚀" } },
  });

  const emojiIdx = msg.indexOf(Buffer.from("🚀", "utf8"));
  const splitPoint = emojiIdx + 2; // يقطع بين بايت 2 و 3 في الإيموجي

  client.stdin.write(msg.subarray(0, splitPoint));
  setTracked(() => client.stdin.write(msg.subarray(splitPoint)), 60);

  const [res] = await promise;
  assert.equal(res.id, 901);
  assert.equal(res.result.isError, true);
  const text = res.result.content[0].text;
  assert.ok(!text.includes("\uFFFD"), "Response must not contain replacement character U+FFFD");
  assert.ok(text.includes("🚀"), "Response must contain intact rocket emoji");
});

test("castov mcp: handles fragmented header and fragmented body", async (t) => {
  const { client, setTracked, timeoutMs } = createMcpHarness(t, 5000);
  const promise = readFramedResponses(client, 2, timeoutMs, setTracked);

  const msg1 = buildFramed({ jsonrpc: "2.0", id: 501, method: "tools/list" });
  const splitHeader = 12;
  client.stdin.write(msg1.subarray(0, splitHeader));
  setTracked(() => client.stdin.write(msg1.subarray(splitHeader)), 60);

  setTracked(() => {
    const msg2 = buildFramed({
      jsonrpc: "2.0",
      id: 502,
      method: "tools/call",
      params: { name: "castov_port", arguments: { port: 5432 } },
    });
    const headerEnd = msg2.indexOf("\r\n\r\n") + 4;
    const splitBody = headerEnd + 15;
    client.stdin.write(msg2.subarray(0, splitBody));
    setTracked(() => client.stdin.write(msg2.subarray(splitBody)), 60);
  }, 180);

  const [r1, r2] = await promise;
  assert.equal(r1.id, 501);
  assert.equal(r2.id, 502);
  assert.match(r2.result.content[0].text, /PostgreSQL/);
});

test("castov mcp: handles 3 messages in single chunk with FIFO order and error recovery", async (t) => {
  const { client, setTracked, timeoutMs } = createMcpHarness(t, 5000);
  const promise = readFramedResponses(client, 3, timeoutMs, setTracked);

  const msg1 = buildFramed({ jsonrpc: "2.0", id: 101, method: "tools/call", params: { name: "castov_cidr", arguments: { cidr: "192.168.1.0/" } } });
  const msg2 = buildFramed({ jsonrpc: "2.0", id: 102, method: "tools/call", params: { name: "castov_cidr", arguments: { cidr: "192.168.1.0/24" } } });
  const msg3 = buildFramed({ jsonrpc: "2.0", id: 103, method: "tools/call", params: { name: "castov_port", arguments: { port: 5432 } } });

  client.stdin.write(Buffer.concat([msg1, msg2, msg3]));

  const [r1, r2, r3] = await promise;
  assert.equal(r1.id, 101);
  assert.equal(r1.result.isError, true);
  assert.match(r1.result.content[0].text, /Missing prefix after '\/'/);

  assert.equal(r2.id, 102);
  assert.equal(r2.result.isError, undefined);
  assert.match(r2.result.content[0].text, /Subnet Mask: 255\.255\.255\.0/);

  assert.equal(r3.id, 103);
  assert.equal(r3.result.isError, undefined);
  assert.match(r3.result.content[0].text, /PostgreSQL/);
});

test("castov mcp: invalid Content-Length emits framing error and exits with code 1", async (t) => {
  const { client, closePromise } = createMcpHarness(t, 5000);
  let outData = "";
  client.stdout.on("data", (chunk) => { outData += chunk.toString("utf8"); });

  client.stdin.write("Content-Length: abc\r\n\r\n{}");
  const code = await closePromise;
  assert.equal(code, 1);
  assert.match(outData, /-32700/);
  assert.match(outData, /Framing error/);
});

test("castov mcp: X-Content-Length header rejected with framing error and exits with code 1", async (t) => {
  const { client, closePromise } = createMcpHarness(t, 5000);
  let outData = "";
  client.stdout.on("data", (chunk) => { outData += chunk.toString("utf8"); });

  client.stdin.write("X-Content-Length: 100\r\n\r\n{}");
  const code = await closePromise;
  assert.equal(code, 1);
  assert.match(outData, /-32700/);
  assert.match(outData, /missing or invalid Content-Length/);
});

test("castov mcp: body exceeding MAX_BODY_SIZE triggers fatal exit", async (t) => {
  const { client, closePromise } = createMcpHarness(t, 5000);
  let outData = "";
  client.stdout.on("data", (chunk) => { outData += chunk.toString("utf8"); });

  client.stdin.write("Content-Length: 5000000\r\n\r\n");
  const code = await closePromise;
  assert.equal(code, 1);
  assert.match(outData, /-32700/);
  assert.match(outData, /Message body exceeds maximum size of 4MB/);
});

test("castov mcp: ndjson line exceeding MAX_BODY_SIZE triggers fatal exit", async (t) => {
  const { client, closePromise } = createMcpHarness(t, 5000);
  let outData = "";
  client.stdout.on("data", (chunk) => { outData += chunk.toString("utf8"); });

  const bigLine = Buffer.alloc(4 * 1024 * 1024 + 1024, 0x20);
  bigLine[0] = 0x7b; // '{'
  client.stdin.write(bigLine);

  const code = await closePromise;
  assert.equal(code, 1);
  assert.match(outData, /-32700/);
  assert.match(outData, /Message line exceeds maximum size of 4MB/);
});

test("castov mcp: negotiates supported protocolVersion or falls back to 2024-11-05", async (t) => {
  const { client, setTracked, timeoutMs } = createMcpHarness(t, 5000);
  const promise = readNdjsonResponses(client, 1, timeoutMs, setTracked);

  client.stdin.write(JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: { protocolVersion: "2099-01-01" },
  }) + "\n");

  const [res] = await promise;
  assert.equal(res.result.protocolVersion, "2024-11-05");
});

test("castov mcp: non-object request (null, array, primitive) returns -32600 Invalid Request", async (t) => {
  const { client, setTracked, timeoutMs } = createMcpHarness(t, 5000);
  const promise = readNdjsonResponses(client, 3, timeoutMs, setTracked);

  client.stdin.write("null\n");
  client.stdin.write("123\n");
  client.stdin.write("[1, 2, 3]\n");

  const [r1, r2, r3] = await promise;
  assert.equal(r1.error?.code, -32600);
  assert.equal(r1.error?.message, "Invalid Request");
  assert.equal(r2.error?.code, -32600);
  assert.equal(r3.error?.code, -32600);
});

test("castov mcp: primitive JSON strings containing colon (\"a:b\", \"-5:x\", \"123:4\") return -32600 Invalid Request immediately in ndjson mode", async (t) => {
  const { client, setTracked, timeoutMs } = createMcpHarness(t, 5000);
  const promise = readNdjsonResponses(client, 3, timeoutMs, setTracked);

  client.stdin.write('"a:b"\n');
  client.stdin.write('"-5:x"\n');
  client.stdin.write('"123:4"\n');

  const [r1, r2, r3] = await promise;
  assert.equal(r1.error?.code, -32600);
  assert.equal(r1.error?.message, "Invalid Request");
  assert.equal(r2.error?.code, -32600);
  assert.equal(r2.error?.message, "Invalid Request");
  assert.equal(r3.error?.code, -32600);
  assert.equal(r3.error?.message, "Invalid Request");
});

test("castov mcp: ndjson line exceeding MAX_BODY_SIZE with trailing newline in same chunk triggers fatal exit", async (t) => {
  const { client, closePromise } = createMcpHarness(t, 5000);
  let outData = "";
  client.stdout.on("data", (chunk) => { outData += chunk.toString("utf8"); });

  const bigLine = Buffer.alloc(4 * 1024 * 1024 + 1024, 0x20);
  bigLine[0] = 0x7b; // '{'
  bigLine[bigLine.length - 1] = 0x0a; // '\n'
  client.stdin.write(bigLine);

  const code = await closePromise;
  assert.equal(code, 1);
  assert.match(outData, /-32700/);
  assert.match(outData, /Message line exceeds maximum size of 4MB/);
});

test("castov cidr CLI: handles /16, /30, /31, /32, /0, non-zero base IP, and empty prefix error", () => {
  // 1. /16
  const r16 = run(["cidr", "172.16.0.0/16"]);
  assert.equal(r16.status, 0);
  assert.match(r16.stdout, /Subnet Mask:\s+255\.255\.0\.0/);
  assert.match(r16.stdout, /Network Address:\s+172\.16\.0\.0/);
  assert.match(r16.stdout, /Broadcast Addr:\s+172\.16\.255\.255/);
  assert.match(r16.stdout, /Usable Range:\s+172\.16\.0\.1 - 172\.16\.255\.254/);
  assert.match(r16.stdout, /Total IPs:\s+65,536/);
  assert.match(r16.stdout, /Usable Hosts:\s+65,534/);

  // 2. /30
  const r30 = run(["cidr", "10.0.0.0/30"]);
  assert.equal(r30.status, 0);
  assert.match(r30.stdout, /Subnet Mask:\s+255\.255\.255\.252/);
  assert.match(r30.stdout, /Broadcast Addr:\s+10\.0\.0\.3/);
  assert.match(r30.stdout, /Usable Range:\s+10\.0\.0\.1 - 10\.0\.0\.2/);
  assert.match(r30.stdout, /Total IPs:\s+4/);
  assert.match(r30.stdout, /Usable Hosts:\s+2/);

  // 3. /31 (RFC 3021)
  const r31 = run(["cidr", "10.0.0.0/31"]);
  assert.equal(r31.status, 0);
  assert.match(r31.stdout, /Subnet Mask:\s+255\.255\.255\.254/);
  assert.match(r31.stdout, /Broadcast Addr:\s+None \(RFC 3021 Point-to-Point\)/);
  assert.match(r31.stdout, /Usable Range:\s+10\.0\.0\.0 - 10\.0\.0\.1/);
  assert.match(r31.stdout, /Total IPs:\s+2/);
  assert.match(r31.stdout, /Usable Hosts:\s+2/);

  // 4. /32 (Single Host)
  const r32 = run(["cidr", "10.0.0.5/32"]);
  assert.equal(r32.status, 0);
  assert.match(r32.stdout, /Subnet Mask:\s+255\.255\.255\.255/);
  assert.match(r32.stdout, /Network Address:\s+10\.0\.0\.5/);
  assert.match(r32.stdout, /Broadcast Addr:\s+None \(\/32 Single Host\)/);
  assert.match(r32.stdout, /Usable Range:\s+10\.0\.0\.5 - 10\.0\.0\.5/);
  assert.match(r32.stdout, /Total IPs:\s+1/);
  assert.match(r32.stdout, /Usable Hosts:\s+1/);

  // 5. /0
  const r0 = run(["cidr", "0.0.0.0/0"]);
  assert.equal(r0.status, 0);
  assert.match(r0.stdout, /Subnet Mask:\s+0\.0\.0\.0/);
  assert.match(r0.stdout, /Wildcard Mask:\s+255\.255\.255\.255/);
  assert.match(r0.stdout, /Broadcast Addr:\s+255\.255\.255\.255/);
  assert.match(r0.stdout, /Usable Range:\s+0\.0\.0\.1 - 255\.255\.255\.254/);
  assert.match(r0.stdout, /Total IPs:\s+4,294,967,296/);
  assert.match(r0.stdout, /Usable Hosts:\s+4,294,967,294/);

  // 6. Non-zero base IP: 10.1.2.77/24
  const rNonZero = run(["cidr", "10.1.2.77/24"]);
  assert.equal(rNonZero.status, 0);
  assert.match(rNonZero.stdout, /Network Address:\s+10\.1\.2\.0/);
  assert.match(rNonZero.stdout, /Broadcast Addr:\s+10\.1\.2\.255/);
  assert.match(rNonZero.stdout, /Usable Range:\s+10\.1\.2\.1 - 10\.1\.2\.254/);
  assert.match(rNonZero.stdout, /Total IPs:\s+256/);
  assert.match(rNonZero.stdout, /Usable Hosts:\s+254/);

  // 7. Empty prefix error: 192.168.1.0/
  const rEmpty = run(["cidr", "192.168.1.0/"]);
  assert.notEqual(rEmpty.status, 0);
  assert.match(rEmpty.stderr, /Missing prefix after '\/'/);
});

test("castov mcp: castov_cidr returns all fields and handles /31, /32, /0, non-zero base IP", async (t) => {
  const { client, setTracked, timeoutMs } = createMcpHarness(t, 5000);
  const promise = readNdjsonResponses(client, 4, timeoutMs, setTracked);

  client.stdin.write(JSON.stringify({ jsonrpc: "2.0", id: 201, method: "tools/call", params: { name: "castov_cidr", arguments: { cidr: "10.1.2.77/24" } } }) + "\n");
  client.stdin.write(JSON.stringify({ jsonrpc: "2.0", id: 202, method: "tools/call", params: { name: "castov_cidr", arguments: { cidr: "10.0.0.0/31" } } }) + "\n");
  client.stdin.write(JSON.stringify({ jsonrpc: "2.0", id: 203, method: "tools/call", params: { name: "castov_cidr", arguments: { cidr: "10.0.0.5/32" } } }) + "\n");
  client.stdin.write(JSON.stringify({ jsonrpc: "2.0", id: 204, method: "tools/call", params: { name: "castov_cidr", arguments: { cidr: "0.0.0.0/0" } } }) + "\n");

  const [r201, r202, r203, r204] = await promise;

  // /24 non-zero base
  assert.equal(r201.id, 201);
  const t201 = r201.result.content[0].text;
  assert.match(t201, /Network Address: 10\.1\.2\.0/);
  assert.match(t201, /Subnet Mask: 255\.255\.255\.0/);
  assert.match(t201, /Wildcard: 0\.0\.0\.255/);
  assert.match(t201, /Broadcast Address: 10\.1\.2\.255/);
  assert.match(t201, /First Usable: 10\.1\.2\.1/);
  assert.match(t201, /Last Usable: 10\.1\.2\.254/);
  assert.match(t201, /Usable Hosts: 254/);

  // /31
  assert.equal(r202.id, 202);
  const t202 = r202.result.content[0].text;
  assert.match(t202, /Network Address: 10\.0\.0\.0/);
  assert.match(t202, /Subnet Mask: 255\.255\.255\.254/);
  assert.match(t202, /Broadcast Address: None \(RFC 3021 Point-to-Point\)/);
  assert.match(t202, /First Usable: 10\.0\.0\.0/);
  assert.match(t202, /Last Usable: 10\.0\.0\.1/);
  assert.match(t202, /Usable Hosts: 2/);

  // /32
  assert.equal(r203.id, 203);
  const t203 = r203.result.content[0].text;
  assert.match(t203, /Network Address: 10\.0\.0\.5/);
  assert.match(t203, /Subnet Mask: 255\.255\.255\.255/);
  assert.match(t203, /Broadcast Address: None \(\/32 Single Host\)/);
  assert.match(t203, /First Usable: 10\.0\.0\.5/);
  assert.match(t203, /Last Usable: 10\.0\.0\.5/);
  assert.match(t203, /Usable Hosts: 1/);

  // /0
  assert.equal(r204.id, 204);
  const t204 = r204.result.content[0].text;
  assert.match(t204, /Network Address: 0\.0\.0\.0/);
  assert.match(t204, /Subnet Mask: 0\.0\.0\.0/);
  assert.match(t204, /Wildcard: 255\.255\.255\.255/);
  assert.match(t204, /Broadcast Address: 255\.255\.255\.255/);
  assert.match(t204, /First Usable: 0\.0\.0\.1/);
  assert.match(t204, /Last Usable: 255\.255\.255\.254/);
  assert.match(t204, /Usable Hosts: 4294967294/);
});

test("castov mcp: extended suite (cron, timezone, secret, jwt_decode, hash, scan_secrets, ping)", async (t) => {
  const { client, setTracked, timeoutMs } = createMcpHarness(t, 5000);
  const promise = readNdjsonResponses(client, 8, timeoutMs, setTracked);

  const sampleJwt = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkNhc3RvdiIsImV4cCI6MTkwMDAwMDAwMH0.signature";

  client.stdin.write(JSON.stringify({ jsonrpc: "2.0", id: 301, method: "ping" }) + "\n");
  client.stdin.write(JSON.stringify({ jsonrpc: "2.0", id: 302, method: "prompts/list" }) + "\n");
  client.stdin.write(JSON.stringify({ jsonrpc: "2.0", id: 303, method: "tools/call", params: { name: "castov_cron", arguments: { expression: "*/15 * * * *", timezone: "UTC" } } }) + "\n");
  client.stdin.write(JSON.stringify({ jsonrpc: "2.0", id: 304, method: "tools/call", params: { name: "castov_timezone", arguments: { dateTime: "2026-06-15 12:00", fromZone: "UTC", toZone: "America/New_York" } } }) + "\n");
  client.stdin.write(JSON.stringify({ jsonrpc: "2.0", id: 305, method: "tools/call", params: { name: "castov_secret", arguments: { bytes: 32 } } }) + "\n");
  client.stdin.write(JSON.stringify({ jsonrpc: "2.0", id: 306, method: "tools/call", params: { name: "castov_jwt_decode", arguments: { token: sampleJwt } } }) + "\n");
  client.stdin.write(JSON.stringify({ jsonrpc: "2.0", id: 307, method: "tools/call", params: { name: "castov_hash", arguments: { text: "castov", algorithm: "sha256" } } }) + "\n");
  const mockAwsKey = ["AK", "IA", "IOSFODNN7EXAMPLE"].join("");
  client.stdin.write(JSON.stringify({ jsonrpc: "2.0", id: 308, method: "tools/call", params: { name: "castov_scan_secrets", arguments: { content: `AWS_KEY=${mockAwsKey}\nSAFE=123` } } }) + "\n");

  const [rPing, rPrompts, rCron, rTz, rSec, rJwt, rHash, rScan] = await promise;

  assert.deepEqual(rPing.result, {});
  assert.deepEqual(rPrompts.result, { prompts: [] });

  const cronObj = JSON.parse(rCron.result.content[0].text);
  assert.equal(cronObj.timezone, "UTC");
  assert.equal(cronObj.nextRuns.length, 5);

  const tzObj = JSON.parse(rTz.result.content[0].text);
  assert.equal(tzObj.toZone, "America/New_York");
  assert.match(tzObj.toFormatted, /08:00/);

  const secObj = JSON.parse(rSec.result.content[0].text);
  assert.equal(secObj.entropyBits, 256);
  assert.equal(secObj.hex.length, 64);

  const jwtObj = JSON.parse(rJwt.result.content[0].text);
  assert.equal(jwtObj.payload.name, "Castov");
  assert.equal(typeof jwtObj.expired, "boolean");

  const hashObj = JSON.parse(rHash.result.content[0].text);
  assert.equal(hashObj.algorithm, "sha256");
  assert.equal(hashObj.hashHex.length, 64);

  const scanObj = JSON.parse(rScan.result.content[0].text);
  assert.equal(scanObj.clean, false);
  assert.equal(scanObj.findingCount, 1);
  assert.equal(scanObj.findings[0].type, "AWS Access Key ID");
});

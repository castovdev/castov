import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import {
  castov,
  uuid,
  uuidv7,
  isUuid,
  nanoid,
  base64Encode,
  base64Decode,
  unixToIso,
  isoToUnix,
  hash,
  jwtDecode,
  ts,
  detect,
  cron,
  tz,
  chmod,
  jwtInspect,
  diff,
  duration,
  color,
} from "../dist/esm/index.js";

test("uuid v4 format and uniqueness", () => {
  const ids = new Set(Array.from({ length: 10_000 }, () => castov.uuid()));
  assert.equal(ids.size, 10_000);
  for (const id of ids) {
    assert.match(id, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  }
  assert.ok(isUuid(uuid()));
});

test("uuid v7 is versioned and time-sortable", () => {
  const a = uuidv7(1_700_000_000_000);
  const b = uuidv7(1_700_000_000_001);
  assert.equal(a[14], "7");
  assert.ok(isUuid(a));
  assert.ok(a < b);
  assert.equal(a.slice(0, 13), "018bcfe5-6800");
});

test("isUuid rejects garbage", () => {
  assert.equal(isUuid("not-a-uuid"), false);
  assert.equal(isUuid(42), false);
});

test("nanoid", () => {
  assert.equal(nanoid().length, 21);
  assert.match(nanoid(64), /^[A-Za-z0-9_-]{64}$/);
  assert.throws(() => nanoid(0));
});

test("base64 round-trips UTF-8 (incl. Arabic + emoji)", () => {
  const s = "مرحبا Castov 🚀";
  assert.equal(base64Decode(base64Encode(s)), s);
  assert.equal(base64Decode(base64Encode(s, { url: true })), s);
  assert.equal(base64Encode("hello"), "aGVsbG8=");
});

test("time helpers", () => {
  assert.equal(unixToIso(0), "1970-01-01T00:00:00.000Z");
  assert.equal(unixToIso(1_700_000_000_000), "2023-11-14T22:13:20.000Z");
  assert.equal(isoToUnix("2023-11-14T22:13:20Z"), 1_700_000_000);
  assert.ok(Math.abs(castov.unix() - Date.now() / 1000) < 2);
});

test("hash sha256", async () => {
  assert.equal(
    await hash("abc"),
    "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"
  );
});

test("jwtDecode", () => {
  const t = `${base64Encode('{"alg":"HS256"}', { url: true })}.${base64Encode('{"sub":"42"}', { url: true })}.sig`;
  assert.deepEqual(jwtDecode(t).payload, { sub: "42" });
  assert.throws(() => jwtDecode("a.b"));
});

test("ts: auto-detects seconds and milliseconds", () => {
  // Seconds
  const sec = ts(1700000000);
  assert.equal(sec.unit, "seconds");
  assert.equal(sec.seconds, 1700000000);
  assert.equal(sec.milliseconds, 1700000000000);
  assert.equal(sec.iso, "2023-11-14T22:13:20.000Z");
  assert.equal(sec.utc, "Tue, 14 Nov 2023 22:13:20 GMT");

  // String seconds
  const secStr = ts("1700000000");
  assert.equal(secStr.unit, "seconds");
  assert.equal(secStr.iso, "2023-11-14T22:13:20.000Z");

  // Milliseconds
  const ms = ts("1700000000123");
  assert.equal(ms.unit, "milliseconds");
  assert.equal(ms.seconds, 1700000000);
  assert.equal(ms.milliseconds, 1700000000123);
  assert.equal(ms.iso, "2023-11-14T22:13:20.123Z");

  // Invalid input rejection
  assert.throws(() => ts("not-a-number"));
  assert.throws(() => ts(Infinity));
});

test("detect: identifies ObjectId, UUIDv7, ULID, Snowflake, Unix timestamps", () => {
  // MongoDB ObjectId
  const oid = detect("507f1f77bcf86cd799439011");
  assert.equal(oid.length, 1);
  assert.equal(oid[0].type, "mongodb-objectid");
  assert.equal(oid[0].iso, "2012-10-17T21:13:27.000Z");

  // UUIDv7
  const u7 = detect("018bcfe5-6800-7d90-bc4e-2895f32a762c");
  assert.equal(u7.length, 1);
  assert.equal(u7[0].type, "uuidv7");
  assert.equal(u7[0].iso, "2023-11-14T22:13:20.000Z");

  // ULID
  const ulidMatch = detect("01ARZ3NDEKTSV4RRFFQ69G5FAV");
  assert.equal(ulidMatch.length, 1);
  assert.equal(ulidMatch[0].type, "ulid");
  assert.equal(ulidMatch[0].iso, "2016-07-30T23:54:10.259Z");

  // Unix seconds
  const unixSec = detect("1700000000");
  assert.equal(unixSec.length, 1);
  assert.equal(unixSec[0].type, "unix-seconds");
  assert.equal(unixSec[0].iso, "2023-11-14T22:13:20.000Z");

  // Snowflake ID
  const snow = detect("841126781289193472");
  assert.ok(snow.some((m) => m.type === "snowflake-discord"));
  assert.ok(snow.some((m) => m.type === "snowflake-twitter"));

  // Non-matching garbage
  assert.deepEqual(detect("hello-world-not-an-id"), []);
});

test("cron: explains schedule and computes next 5 runs", () => {
  const res = cron("0 9 * * 1-5", "America/New_York");
  assert.equal(res.description, "At 09:00, on Monday through Friday");
  assert.equal(res.timezone, "America/New_York");
  assert.equal(res.nextRuns.length, 5);
  for (const run of res.nextRuns) {
    assert.ok(run.timestampMs > Date.now());
    assert.match(run.iso, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  }

  // Macro
  const hourly = cron("@hourly", "UTC");
  assert.equal(hourly.description, "At the start of every hour");
  assert.equal(hourly.nextRuns.length, 5);

  // Errors
  assert.throws(() => cron("invalid cron"));
  assert.throws(() => cron("0 0 0 0 0 0 0"));
  assert.throws(() => cron("0 9 * * *", "Fake/Timezone"));
});

test("tz: converts between IANA zones and detects DST gaps/overlaps", () => {
  // Standard conversion
  const normal = tz("2026-10-11 14:00:00", "America/New_York", "Europe/Paris");
  assert.equal(normal.fromFormatted, "2026-10-11 14:00:00");
  assert.equal(normal.toFormatted, "2026-10-11 20:00:00");
  assert.equal(normal.hasDstWarning, false);

  // DST Spring Forward Gap (nonexistent hour in America/New_York on 2026-03-08)
  const gap = tz("2026-03-08 02:30:00", "America/New_York", "UTC");
  assert.equal(gap.hasDstWarning, true);
  assert.equal(gap.dstWarningType, "gap");
  assert.ok(gap.warning?.includes("does not exist"));
  assert.equal(gap.fromFormatted, "2026-03-08 03:30:00"); // adjusted forward

  // DST Fall Back Overlap (ambiguous hour in America/New_York on 2026-11-01)
  const overlap = tz("2026-11-01 01:30:00", "America/New_York", "UTC");
  assert.equal(overlap.hasDstWarning, true);
  assert.equal(overlap.dstWarningType, "overlap");
  assert.ok(overlap.warning?.includes("ambiguous"));

  // Invalid inputs
  assert.throws(() => tz("not-a-date", "UTC", "UTC"));
  assert.throws(() => tz("2026-01-01 12:00:00", "InvalidZone", "UTC"));
});

test("chmod: octal to symbolic, reverse, and warnings", () => {
  const c755 = chmod(755);
  assert.equal(c755.octal, "755");
  assert.equal(c755.symbolic, "rwxr-xr-x");
  assert.equal(c755.owner.description, "Read, Write, Execute");
  assert.equal(c755.group.description, "Read, Execute");
  assert.equal(c755.others.description, "Read, Execute");
  assert.equal(c755.command, "chmod 755 <file>");

  // Symbolic to octal
  const cSym = chmod("rwxr-xr-x");
  assert.equal(cSym.octal, "755");
  assert.equal(cSym.octal4, "0755");

  // 777 security warning
  const c777 = chmod("777");
  assert.ok(c777.warning?.includes("Highly insecure"));

  // Invalids
  assert.throws(() => chmod("999"));
  assert.throws(() => chmod("invalid"));
});

test("jwtInspect: inspects payload and calculates expiration status", () => {
  // Token with exp in future
  const futureSec = Math.floor(Date.now() / 1000) + 3600;
  const headerB64 = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const payloadB64 = Buffer.from(JSON.stringify({ sub: "user123", exp: futureSec })).toString("base64url");
  const validToken = `${headerB64}.${payloadB64}.fake-sig`;

  const inspected = jwtInspect(validToken);
  assert.equal(inspected.header.alg, "HS256");
  assert.equal(inspected.payload.sub, "user123");
  assert.equal(inspected.status, "active");
  assert.equal(inspected.isExpired, false);
  assert.ok(inspected.expiresAt?.relative.includes("in"));

  // Expired token
  const pastSec = Math.floor(Date.now() / 1000) - 7200;
  const expiredPayloadB64 = Buffer.from(JSON.stringify({ sub: "user123", exp: pastSec })).toString("base64url");
  const expiredToken = `${headerB64}.${expiredPayloadB64}.fake-sig`;

  const expiredRes = jwtInspect(expiredToken);
  assert.equal(expiredRes.status, "expired");
  assert.equal(expiredRes.isExpired, true);
  assert.ok(expiredRes.expiresAt?.relative.includes("ago"));

  // Malformed
  assert.throws(() => jwtInspect("not-a-jwt"));
});

test("diff & duration: computes difference between dates and formats durations", () => {
  const d = diff("2026-01-01T00:00:00Z", "2026-01-03T12:30:00Z");
  assert.equal(d.days, 2);
  assert.equal(d.hours, 60);
  assert.equal(d.isNegative, false);
  assert.equal(d.human, "2 days, 12 hours, 30 minutes");

  // Negative diff
  const neg = diff("2026-01-03T00:00:00Z", "2026-01-01T00:00:00Z");
  assert.equal(neg.isNegative, true);
  assert.equal(neg.days, -2);
  assert.ok(neg.human.startsWith("-2 days"));

  // Duration helper
  assert.equal(duration(3661000), "1h 1m 1s");
  assert.equal(duration(90000), "1m 30s");
  assert.equal(duration(86400000 + 3600000), "1d 1h");
  assert.equal(duration(0), "0s");
});

test("color: converts formats and calculates WCAG contrast", () => {
  const blue = color("#2563eb");
  assert.equal(blue.hex, "#2563eb");
  assert.equal(blue.rgb, "rgb(37, 99, 235)");
  assert.ok(blue.hsl.startsWith("hsl(221,"));
  assert.ok(blue.contrast.white > 1);
  assert.ok(blue.contrast.black > 1);
  assert.equal(blue.contrast.bestTextColor, "#ffffff");

  // RGB input
  const rgbCol = color("rgb(255, 255, 255)");
  assert.equal(rgbCol.hex, "#ffffff");
  assert.equal(rgbCol.contrast.black, 21);
  assert.equal(rgbCol.contrast.white, 1);
  assert.equal(rgbCol.contrast.wcagOnBlack.aaaNormal, true);

  // Invalids
  assert.throws(() => color("not-a-color"));
});

test("CommonJS build works via require()", () => {
  const require = createRequire(import.meta.url);
  const cjs = require("../dist/cjs/index.js");
  assert.ok(cjs.isUuid(cjs.castov.uuid()));
  assert.equal(cjs.ts(1700000000).iso, "2023-11-14T22:13:20.000Z");
  assert.equal(cjs.detect("507f1f77bcf86cd799439011")[0].type, "mongodb-objectid");
  assert.equal(cjs.cron("@daily", "UTC").nextRuns.length, 5);
  assert.equal(cjs.tz("2026-01-01 12:00:00", "UTC", "UTC").toFormatted, "2026-01-01 12:00:00");
  assert.equal(cjs.chmod(755).symbolic, "rwxr-xr-x");
  assert.equal(cjs.duration(3600000), "1h");
  assert.equal(cjs.color("#ffffff").hex, "#ffffff");
});


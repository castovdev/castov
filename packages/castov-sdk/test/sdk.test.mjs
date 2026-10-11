import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { castov, uuid, uuidv7, isUuid, nanoid, base64Encode, base64Decode, unixToIso, isoToUnix, hash, jwtDecode } from "../dist/esm/index.js";

test("uuid v4 format and uniqueness", () => {
  const ids = new Set(Array.from({ length: 10_000 }, () => castov.uuid()));
  assert.equal(ids.size, 10_000);
  for (const id of ids) assert.match(id, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
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
  assert.equal(await hash("abc"), "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
});

test("jwtDecode", () => {
  const t = `${base64Encode('{"alg":"HS256"}', { url: true })}.${base64Encode('{"sub":"42"}', { url: true })}.sig`;
  assert.deepEqual(jwtDecode(t).payload, { sub: "42" });
  assert.throws(() => jwtDecode("a.b"));
});

test("CommonJS build works via require()", () => {
  const require = createRequire(import.meta.url);
  const cjs = require("../dist/cjs/index.js");
  assert.ok(cjs.isUuid(cjs.castov.uuid()));
});

import type { DetectionMatch } from "./types.js";

const CROCKFORD_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

function toDateStrings(date: Date) {
  let local: string;
  try {
    local = date.toLocaleString("en-US", {
      dateStyle: "full",
      timeStyle: "long",
    });
  } catch {
    local = date.toString();
  }
  return {
    iso: date.toISOString(),
    utc: date.toUTCString(),
    local,
  };
}

/**
 * Identifies timestamp or ID formats contained in `value`, including:
 * - Unix timestamp (seconds)
 * - Unix timestamp (milliseconds)
 * - MongoDB ObjectId
 * - Snowflake (Discord and Twitter epochs)
 * - UUIDv7 (RFC 9562)
 * - ULID (Universally Unique Lexicographically Sortable Identifier)
 *
 * Returns an array of all valid matches along with their decoded dates.
 */
export function detect(rawInput: string): DetectionMatch[] {
  const input = String(rawInput ?? "").trim();
  if (!input) return [];

  const matches: DetectionMatch[] = [];

  // 1. UUIDv7
  // Format: 8-4-4-4-12 hex, version 7 at index 14
  const uuid7Regex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-7[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;
  if (uuid7Regex.test(input)) {
    const hex = input.slice(0, 8) + input.slice(9, 13);
    const ms = parseInt(hex, 16);
    if (!Number.isNaN(ms) && ms >= 0 && ms <= 4102444800000) {
      const date = new Date(ms);
      matches.push({
        type: "uuidv7",
        label: "UUIDv7",
        timestampMs: ms,
        date,
        ...toDateStrings(date),
        details: "RFC 9562 time-sortable UUID (48-bit Unix millisecond timestamp)",
      });
    }
  }

  // 2. ULID
  // Exactly 26 Crockford Base32 characters
  const ulidRegex = /^[0123456789ABCDEFGHJKMNPQRSTVWXYZabcdefghjkmnpqrstvwxyz]{26}$/;
  if (ulidRegex.test(input)) {
    let ms = 0;
    let validUlid = true;
    for (let i = 0; i < 10; i++) {
      const char = input[i].toUpperCase();
      const val = CROCKFORD_ALPHABET.indexOf(char);
      if (val === -1) {
        validUlid = false;
        break;
      }
      ms = ms * 32 + val;
    }
    if (validUlid && ms >= 0 && ms <= 4102444800000) {
      const date = new Date(ms);
      matches.push({
        type: "ulid",
        label: "ULID",
        timestampMs: ms,
        date,
        ...toDateStrings(date),
        details: "Universally Unique Lexicographically Sortable Identifier (48-bit timestamp)",
      });
    }
  }

  // 3. MongoDB ObjectId
  // 24 hexadecimal characters, first 8 hex characters is 32-bit big-endian unix seconds
  const objectIdRegex = /^[0-9a-fA-F]{24}$/;
  if (objectIdRegex.test(input)) {
    const seconds = parseInt(input.slice(0, 8), 16);
    // MongoDB was released in 2009 (approx 1230768000). Allow plausible values up to year 2100.
    if (!Number.isNaN(seconds) && seconds >= 0 && seconds <= 4102444800) {
      const ms = seconds * 1000;
      const date = new Date(ms);
      matches.push({
        type: "mongodb-objectid",
        label: "MongoDB ObjectId",
        timestampMs: ms,
        date,
        ...toDateStrings(date),
        details: "12-byte BSON identifier (first 4 bytes encode Unix seconds)",
      });
    }
  }

  // 4. Numeric formats (Unix seconds, Unix milliseconds, Snowflake)
  if (/^-?\d+$/.test(input)) {
    const isNegative = input.startsWith("-");
    const digitsOnly = isNegative ? input.slice(1) : input;
    const len = digitsOnly.length;

    // Unix seconds: 1 to 10 digits
    if (len <= 10) {
      const sec = Number(input);
      // Valid range: year 0001 (-62167219200) to year 2100 (4102444800)
      if (sec >= -62167219200 && sec <= 4102444800) {
        const ms = sec * 1000;
        const date = new Date(ms);
        matches.push({
          type: "unix-seconds",
          label: "Unix Timestamp (seconds)",
          timestampMs: ms,
          date,
          ...toDateStrings(date),
          details: "Standard 32-bit/integer Unix epoch timestamp in seconds",
        });
      }
    }

    // Unix milliseconds: 11 to 14 digits
    if (len >= 11 && len <= 14) {
      const ms = Number(input);
      if (ms >= -62167219200000 && ms <= 4102444800000) {
        const date = new Date(ms);
        matches.push({
          type: "unix-milliseconds",
          label: "Unix Timestamp (milliseconds)",
          timestampMs: ms,
          date,
          ...toDateStrings(date),
          details: "Standard Unix timestamp in milliseconds",
        });
      }
    }

    // Snowflake ID: positive 64-bit integer, typically 16 to 20 digits
    if (!isNegative && len >= 15 && len <= 20) {
      try {
        const bigVal = BigInt(input);
        const shifted = bigVal >> 22n;

        // Discord Snowflake: epoch Jan 1, 2015 (1420070400000 ms)
        const discordMs = Number(shifted + 1420070400000n);
        if (discordMs >= 1420070400000 && discordMs <= 4102444800000) {
          const date = new Date(discordMs);
          matches.push({
            type: "snowflake-discord",
            label: "Snowflake (Discord epoch)",
            timestampMs: discordMs,
            date,
            ...toDateStrings(date),
            details: "Discord 64-bit Snowflake ID (custom epoch Jan 1, 2015)",
          });
        }

        // Twitter Snowflake: epoch Nov 4, 2010 (1288834974657 ms)
        const twitterMs = Number(shifted + 1288834974657n);
        if (twitterMs >= 1288834974657 && twitterMs <= 4102444800000) {
          const date = new Date(twitterMs);
          matches.push({
            type: "snowflake-twitter",
            label: "Snowflake (Twitter epoch)",
            timestampMs: twitterMs,
            date,
            ...toDateStrings(date),
            details: "Twitter/X 64-bit Snowflake ID (custom epoch Nov 4, 2010)",
          });
        }
      } catch {
        // Ignore BigInt parse errors
      }
    }
  }

  return matches;
}

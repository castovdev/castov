export type HashAlgorithm = "sha1" | "sha256" | "sha384" | "sha512";

export interface Base64Options {
  /** Use the URL-safe alphabet (`-`/`_`) without padding. */
  url?: boolean;
}

export interface DecodedJwt {
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
  signature: string;
}

export interface TimestampResult {
  unit: "seconds" | "milliseconds";
  seconds: number;
  milliseconds: number;
  iso: string;
  utc: string;
  local: string;
  date: Date;
}

export type DetectedType =
  | "unix-seconds"
  | "unix-milliseconds"
  | "mongodb-objectid"
  | "snowflake-discord"
  | "snowflake-twitter"
  | "uuidv7"
  | "ulid";

export interface DetectionMatch {
  type: DetectedType;
  label: string;
  timestampMs: number;
  date: Date;
  iso: string;
  utc: string;
  local: string;
  details?: string;
}

export interface CronRun {
  timestampMs: number;
  iso: string;
  utc: string;
  local: string;
}

export interface CronResult {
  expression: string;
  description: string;
  timezone: string;
  nextRuns: CronRun[];
}

export interface TimeZoneConversionResult {
  originalInput: string;
  fromZone: string;
  toZone: string;
  timestampMs: number;
  iso: string;
  fromFormatted: string;
  fromAbbreviation: string;
  fromOffset: string;
  toFormatted: string;
  toAbbreviation: string;
  toOffset: string;
  hasDstWarning: boolean;
  dstWarningType?: "gap" | "overlap";
  warning?: string;
}

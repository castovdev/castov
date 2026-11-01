/**
 * Castov Secret Shield - Normalized Findings Specification (V2 Architecture)
 *
 * Provides a unified, extensible data model across all detection tiers (V1 Secrets, PII, Custom Rules)
 * with strict privacy invariants and type-safe internationalization keys.
 */

import type { SecretFinding, SecretType } from "../detector/types";

export type FindingCategory = "SECRET" | "PII" | "CUSTOM_RULE";

export type FindingSeverity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export interface FindingWeightConfig {
  baseWeight: number;
  severity: FindingSeverity;
}

/**
 * Standard weight and severity configuration for legacy V1 developer secrets.
 * Severity brackets:
 * - CRITICAL: 85+
 * - HIGH:     65 - 84
 * - MEDIUM:   40 - 64
 * - LOW:      0 - 39
 */
export const V1_SECRETS_WEIGHT_MAP: Record<SecretType, FindingWeightConfig> = {
  // CRITICAL (85+)
  PRIVATE_KEY:    { baseWeight: 90, severity: "CRITICAL" },
  DATABASE_URI:   { baseWeight: 85, severity: "CRITICAL" },

  // HIGH (65 - 84)
  AWS_KEY:        { baseWeight: 80, severity: "HIGH" },
  ANTHROPIC_KEY:  { baseWeight: 75, severity: "HIGH" },
  OPENAI_KEY:     { baseWeight: 75, severity: "HIGH" },
  STRIPE_KEY:     { baseWeight: 75, severity: "HIGH" },
  GOOGLE_KEY:     { baseWeight: 75, severity: "HIGH" },
  GITHUB_TOKEN:   { baseWeight: 65, severity: "HIGH" },
  SLACK_TOKEN:    { baseWeight: 65, severity: "HIGH" },
  BEARER_TOKEN:   { baseWeight: 65, severity: "HIGH" },
  JWT:            { baseWeight: 65, severity: "HIGH" },

  // MEDIUM (40 - 64)
  ENV_SECRET:     { baseWeight: 60, severity: "MEDIUM" },
};

/**
 * Safe default weight and severity for unrecognized, third-party, or future secret types.
 */
export const V1_DEFAULT_FINDING_WEIGHT: FindingWeightConfig = {
  baseWeight: 70,
  severity: "HIGH",
};

/**
 * Unified finding contract across all detection engines.
 */
export interface NormalizedFinding {
  /** Unique finding identifier (e.g. v1_<type>_<startIndex> or UUID) */
  id: string;

  /** Detection classification tier */
  category: FindingCategory;

  /** Detector type identifier (standard ASCII alphanumeric and underscore) */
  type: string;

  /** Human-readable default label */
  label: string;

  /** Zero-based inclusive start character index in the source text [startIndex */
  startIndex: number;

  /** Zero-based exclusive end character index in the source text endIndex) */
  endIndex: number;

  /**
   * @security EPHEMERAL ONLY
   * Must only exist in volatile page memory during the active modal lifecycle.
   * Strictly FORBIDDEN to persist to chrome.storage, write to disk, log to console,
   * record in Security History, or transmit outside the extension sandbox.
   */
  raw: string;

  /**
   * @security Masked representation safe for UI display ONLY when produced
   * by the certified maskSecret() policy. Never expose unmasked portions.
   */
  masked: string;

  /** Base static risk weight (1 - 100) */
  baseWeight: number;

  /** Calculated or assigned severity tier */
  severity: FindingSeverity;

  /**
   * @security Non-sensitive structural metadata ONLY.
   * Strictly FORBIDDEN to store raw values, tokens, or credential fragments.
   */
  metadata?: Record<string, unknown>;
}

/**
 * Converts a legacy V1 SecretFinding into a NormalizedFinding without mutating the original.
 * Uses Object.hasOwn() to strictly verify type registration in the weight map.
 */
export function normalizeV1Finding(v1: SecretFinding): NormalizedFinding {
  const isRegisteredType =
    typeof v1.type === "string" && Object.hasOwn(V1_SECRETS_WEIGHT_MAP, v1.type);

  const config = isRegisteredType
    ? V1_SECRETS_WEIGHT_MAP[v1.type as SecretType]
    : V1_DEFAULT_FINDING_WEIGHT;

  return {
    id: `v1_${v1.type}_${v1.startIndex}`,
    category: "SECRET",
    type: v1.type,
    label: v1.label,
    startIndex: v1.startIndex,
    endIndex: v1.endIndex,
    raw: v1.raw,
    masked: v1.masked,
    baseWeight: config.baseWeight,
    severity: config.severity,
  };
}

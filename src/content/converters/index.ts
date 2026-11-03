import type { ConverterMeta } from "@/lib/converters/types";
import { jsonToZodMeta } from "./json-to-zod";
import { jsonToTypescriptMeta } from "./json-to-typescript";
import { curlToFetchMeta } from "./curl-to-fetch";
import { yamlToJsonMeta } from "./yaml-to-json";
import { sqlToPrismaMeta } from "./sql-to-prisma";
import { envToZodMeta } from "./env-to-zod";
import { sqlToDrizzleMeta } from "./sql-to-drizzle";
import { webhookHmacDebuggerMeta } from "./webhook-hmac-debugger";
import { curlToN8nMeta } from "./curl-to-n8n";
import { harSanitizerMeta } from "./har-sanitizer";

export const MODULAR_CONVERTERS: ConverterMeta[] = [
  jsonToZodMeta,
  jsonToTypescriptMeta,
  curlToFetchMeta,
  yamlToJsonMeta,
  sqlToPrismaMeta,
  envToZodMeta,
  sqlToDrizzleMeta,
  webhookHmacDebuggerMeta,
  curlToN8nMeta,
  harSanitizerMeta,
];

export function getModularConverter(slug: string): ConverterMeta | undefined {
  return MODULAR_CONVERTERS.find((c) => c.slug === slug);
}

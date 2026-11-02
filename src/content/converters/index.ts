import type { ConverterMeta } from "@/lib/converters/types";
import { jsonToZodMeta } from "./json-to-zod";
import { jsonToTypescriptMeta } from "./json-to-typescript";
import { curlToFetchMeta } from "./curl-to-fetch";

export const MODULAR_CONVERTERS: ConverterMeta[] = [
  jsonToZodMeta,
  jsonToTypescriptMeta,
  curlToFetchMeta,
];

export function getModularConverter(slug: string): ConverterMeta | undefined {
  return MODULAR_CONVERTERS.find((c) => c.slug === slug);
}

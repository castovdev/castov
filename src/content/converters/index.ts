import type { ConverterMeta } from "@/lib/converters/types";
import { jsonToZodMeta } from "./json-to-zod";

export const MODULAR_CONVERTERS: ConverterMeta[] = [
  jsonToZodMeta,
];

export function getModularConverter(slug: string): ConverterMeta | undefined {
  return MODULAR_CONVERTERS.find((c) => c.slug === slug);
}

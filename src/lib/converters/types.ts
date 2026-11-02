/**
 * Pure serializable metadata types for Code Converters.
 * NO executable functions are included here to prevent Next.js Server-to-Client serialization errors.
 */

export interface ConverterOptionConfig {
  id: string;
  label: string;
  type: "boolean" | "select" | "text";
  defaultValue: boolean | string;
  options?: { label: string; value: string }[];
  description?: string;
}

export interface ConverterEdgeCase {
  title: string;
  scenario: string;
  inputSnippet: string;
  outputSnippet: string;
  explanation: string;
}

export interface ConverterFaq {
  question: string;
  answer: string;
}

export interface ConverterPitfall {
  pitfall: string;
  solution: string;
}

export interface ConverterDeepDive {
  overview: string;
  whyDevelopersUseThis: string[];
  commonPitfalls: ConverterPitfall[];
}

export interface ConverterMeta {
  slug: string;
  name: string;
  title: string;
  metaDescription: string;
  category:
    | "JSON & Schemas"
    | "Database & ORM"
    | "API & Network"
    | "DevOps & Network"
    | "SQL & Database"
    | "Data Formats";
  inputLanguage: string;
  outputLanguage: string;
  outputExtension: string;
  defaultSample: string;
  initialOutput?: string;
  isQualityApproved: boolean;
  isIndexed: boolean;
  deepDive: ConverterDeepDive;
  edgeCases: ConverterEdgeCase[];
  faqs: ConverterFaq[];
  relatedSlugs: string[];
  optionsConfig?: ConverterOptionConfig[];
}

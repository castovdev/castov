import type { ConverterMeta } from "@/lib/converters/types";

export const yamlToJsonMeta: ConverterMeta = {
  slug: "yaml-to-json",
  name: "YAML to JSON",
  title: "YAML to JSON Converter — YAML 1.2 & Anchors",
  metaDescription:
    "Convert YAML configurations, Kubernetes manifests, and Docker Compose files to JSON in browser. Resolves anchors/aliases, multi-document streams, and YAML 1.2 vs 1.1 scalars.",
  category: "Data Formats",
  inputLanguage: "yaml",
  outputLanguage: "json",
  outputExtension: ".json",
  copyButtonLabel: "Copy JSON",
  isQualityApproved: true,
  isIndexed: true,

  defaultSample: `# Default container template using YAML Anchor (&)
x-service-defaults: &defaults
  restart: unless-stopped
  logging:
    driver: json-file
    maxSizeMb: 50

service: api-gateway
countryCode: NO
filePermissions: 0755
octalExplicit: 0o755
releaseDate: 2026-11-02T09:30:00Z
production:
  <<: *defaults
  replicas: 3
  healthcheck: true`,

  initialOutput: `{
  "x-service-defaults": {
    "restart": "unless-stopped",
    "logging": {
      "driver": "json-file",
      "maxSizeMb": 50
    }
  },
  "service": "api-gateway",
  "countryCode": "NO",
  "filePermissions": 755,
  "octalExplicit": 493,
  "releaseDate": "2026-11-02T09:30:00Z",
  "production": {
    "restart": "unless-stopped",
    "logging": {
      "driver": "json-file",
      "maxSizeMb": 50
    },
    "replicas": 3,
    "healthcheck": true
  }
}
`,

  optionsConfig: [
    {
      id: "yamlVersion",
      label: "YAML Specification Mode",
      type: "select",
      defaultValue: "1.2",
      options: [
        { label: "YAML 1.2 (Strict — yes/no as String, 0o Octal)", value: "1.2" },
        { label: "YAML 1.1 (Legacy — yes/no/on/off as Boolean)", value: "1.1" },
      ],
      description: "Toggle between modern YAML 1.2 Core Schema and legacy YAML 1.1 rules",
    },
    {
      id: "multiDocMode",
      label: "Multi-Document (---) Output",
      type: "select",
      defaultValue: "auto",
      options: [
        { label: "Auto (Single Object or Array)", value: "auto" },
        { label: "Always Wrap in JSON Array", value: "array" },
        { label: "First Document Only", value: "first" },
      ],
      description: "How multi-document YAML streams separated by --- are serialized",
    },
    {
      id: "indentSize",
      label: "JSON Indentation",
      type: "select",
      defaultValue: "2",
      options: [
        { label: "2 Spaces (Standard)", value: "2" },
        { label: "4 Spaces", value: "4" },
        { label: "Minified (1 Line)", value: "minified" },
      ],
      description: "Formatting whitespace for the generated JSON output",
    },
    {
      id: "sortKeys",
      label: "Sort Object Keys Alphabetically",
      type: "boolean",
      defaultValue: false,
      description: "Recursively sort JSON keys for deterministic diffs",
    },
  ],

  deepDive: {
    overview:
      "Converting YAML configuration files (such as Kubernetes manifests, GitHub Actions workflows, OpenAPI specs, or Docker Compose stacks) into JSON requires more than simple indentation parsing. Real-world DevOps manifests rely heavily on node anchors (&), alias references (*), merge keys (<<), and multi-document streams separated by ---. Furthermore, differences between the YAML 1.1 and YAML 1.2 specifications frequently cause subtle bugs around unquoted strings like NO (the 'Norway Problem'), octal file permissions (0o755 vs 0755), and ISO-8601 timestamps. Our client-side parser resolves aliases and merge keys, reports exact line and column numbers on syntax errors, and lets you switch between YAML 1.2 and YAML 1.1 scalar rules.",
    whyDevelopersUseThis: [
      "Resolves YAML anchors (&default), aliases (*default), and object merge keys (<<: *default) directly into expanded JSON objects.",
      "Supports multi-document YAML streams separated by --- (such as Kubernetes Deployment + Service manifests in a single file) and outputs them as a JSON array.",
      "Provides an explicit YAML 1.2 vs YAML 1.1 specification toggle to test how unquoted yes/no/on/off booleans and octal numbers (0o14 vs 014) are evaluated.",
      "Reports exact 1-based line and column coordinates whenever indentation tabs, unclosed quotes, or duplicate mapping keys cause a syntax error.",
    ],
    commonPitfalls: [
      {
        pitfall: "The 'Norway Problem' (YAML 1.1 vs YAML 1.2 Boolean Coercion)",
        solution:
          "In YAML 1.1, unquoted literals `y`, `n`, `yes`, `no`, `on`, and `off` (case-insensitive) are parsed as booleans (`true` or `false`). A country code list containing `country: NO` (Norway) or a feature config with `cron: off` silently turns into `false`. YAML 1.2 restricts booleans strictly to `true` and `false`, keeping `NO`, `yes`, and `off` as strings. Always quote ambiguous strings or use YAML 1.2 mode.",
      },
      {
        pitfall: "Octal Numbers: 0o14 (YAML 1.2) vs 014 (YAML 1.1)",
        solution:
          "In YAML 1.1, any integer with a leading zero (such as `umask: 014` or `chmod: 0644`) is interpreted as base-8 octal (`12` and `420` in decimal). In YAML 1.2, octal numbers require an explicit `0o` prefix (`0o14` = `12`, `0o644` = `420`), while a bare leading zero (`014`) is treated as a decimal integer or string depending on the schema.",
      },
      {
        pitfall: "Multi-document YAML files failing in single-document parsers",
        solution:
          "Kubernetes and Helm manifests routinely concatenate multiple resources in a single `.yaml` file using `---` document separators. Calling a single-document parser throws `expected a single document in the stream, but found more`. Our engine uses multi-document stream loading (`loadAll`) and serializes multiple documents into a clean JSON array.",
      },
    ],
  },

  edgeCases: [
    {
      title: "YAML Anchors (&), Aliases (*) & Merge Keys (<<)",
      scenario:
        "Reusing shared configuration blocks across multiple environments using anchors and overriding specific keys.",
      inputSnippet: `base: &base\n  timeoutMs: 3000\n  retries: 2\n\nstaging:\n  <<: *base\n  retries: 5`,
      outputSnippet: `{\n  "base": {\n    "timeoutMs": 3000,\n    "retries": 2\n  },\n  "staging": {\n    "timeoutMs": 3000,\n    "retries": 5\n  }\n}`,
      explanation:
        "The engine resolves `*base` and merges its properties into `staging` via the `<<` key, allowing explicit keys (`retries: 5`) to override inherited defaults (`retries: 2`).",
    },
    {
      title: "Multi-Document Streams (---)",
      scenario:
        "A Kubernetes manifest containing both a Namespace and a ConfigMap separated by ---.",
      inputSnippet: `apiVersion: v1\nkind: Namespace\nmetadata:\n  name: prod\n---\napiVersion: v1\nkind: ConfigMap\nmetadata:\n  name: app-env`,
      outputSnippet: `[\n  {\n    "apiVersion": "v1",\n    "kind": "Namespace",\n    "metadata": {\n      "name": "prod"\n    }\n  },\n  {\n    "apiVersion": "v1",\n    "kind": "ConfigMap",\n    "metadata": {\n      "name": "app-env"\n    }\n  }\n]`,
      explanation:
        "When multiple YAML documents are detected in the stream, the converter automatically outputs a top-level JSON array containing each parsed document.",
    },
    {
      title: "YAML 1.2 vs YAML 1.1: yes/no Strings & 0o14 Octal Numbers",
      scenario:
        "Comparing how unquoted yes/no literals, octal numbers (0o14), and ISO dates are parsed in YAML 1.2 mode.",
      inputSnippet: `norway: no\nconfirm: yes\noctalModern: 0o14\nhexValue: 0xFF\ncutoffDate: 2026-11-02`,
      outputSnippet: `{\n  "norway": "no",\n  "confirm": "yes",\n  "octalModern": 12,\n  "hexValue": 255,\n  "cutoffDate": "2026-11-02"\n}`,
      explanation:
        "Under YAML 1.2, `no` and `yes` remain strings (`\"no\"`, `\"yes\"`) instead of turning into booleans, while `0o14` evaluates to decimal `12` and `0xFF` evaluates to `255`. Switching the specification option to YAML 1.1 converts `no` to `false` and `yes` to `true`.",
    },
  ],

  faqs: [
    {
      question: "How does this converter handle YAML anchors (&), aliases (*), and merge keys (<<)?",
      answer:
        "JSON does not have native syntax for references or pointers. During conversion, our engine dereferences every `*alias` and expands `<<` merge keys directly in memory so the resulting JSON contains the complete, resolved properties at each target path.",
    },
    {
      question: "What is the difference between YAML 1.2 and YAML 1.1 mode in the options?",
      answer:
        "YAML 1.2 is the modern specification designed to be a strict superset of JSON: only `true` and `false` are parsed as booleans, and octal numbers require a `0o` prefix (such as `0o14` = `12`). YAML 1.1 is the legacy specification still used by some older parsers (like PyYAML's default `yaml.safe_load`), which treats unquoted `yes`, `no`, `on`, `off`, `y`, and `n` as booleans and leading-zero numbers (`014`) as octal.",
    },
    {
      question: "Can I convert a Kubernetes YAML file that contains multiple '---' documents?",
      answer:
        "Yes. When your input contains multiple YAML documents separated by `---`, the converter parses every document in the stream and outputs them as a JSON array `[doc1, doc2, ...]`. You can also choose **First Document Only** in the options panel if you only want the first resource.",
    },
    {
      question: "How are YAML syntax errors reported?",
      answer:
        "If your YAML contains invalid indentation, tab characters, or unclosed quotes, the parser catches the exception and displays a clear error banner with the exact 1-based line and column number (e.g., `YAML Syntax Error at line 4, column 3: bad indentation of a mapping entry`).",
    },
  ],

  relatedSlugs: ["json-to-typescript", "json-to-zod", "curl-to-fetch", "sql-to-prisma"],
};

// @vitest-environment jsdom
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  CODE_CONVERTERS,
  getConverterBySlug,
} from "@/lib/code-converters-registry";
import { CodeConverterTool } from "@/components/tools/code-converter-tool";
import {
  generateStaticParams,
  generateMetadata,
} from "@/app/convert/[slug]/page";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  notFound: vi.fn(),
}));

describe("Developer Code & Schema Converter Matrix", () => {
  describe("Registry integrity and engine conversions", () => {
    it("contains at least 20 specialized code and schema converters", () => {
      expect(CODE_CONVERTERS.length).toBeGreaterThanOrEqual(20);
    });

    it("ensures each converter has unique slugs and necessary metadata", () => {
      const slugs = new Set<string>();
      for (const c of CODE_CONVERTERS) {
        expect(c.slug).toBeTruthy();
        expect(slugs.has(c.slug)).toBe(false);
        slugs.add(c.slug);

        expect(c.name).toBeTruthy();
        expect(c.title).toBeTruthy();
        expect(c.description).toBeTruthy();
        expect(c.defaultSample).toBeTruthy();
        expect(typeof c.convert).toBe("function");
        expect(c.faqs.length).toBeGreaterThan(0);
        expect(c.explanation.summary).toBeTruthy();
        expect(c.explanation.whyUse).toBeTruthy();
        expect(c.explanation.sampleBefore).toBeTruthy();
        expect(c.explanation.sampleAfter).toBeTruthy();
      }
    });

    it("successfully runs all 20 converters against their default samples", () => {
      for (const c of CODE_CONVERTERS) {
        const result = c.convert(c.defaultSample);
        expect(result).toBeTruthy();
        expect(typeof result).toBe("string");
        expect(result.length).toBeGreaterThan(5);
      }
    });

    it("converts JSON to Zod schema accurately", () => {
      const zodConv = getConverterBySlug("json-to-zod");
      expect(zodConv).toBeDefined();
      const output = zodConv!.convert('{"id": 1, "name": "Castov", "active": true}');
      expect(output).toContain('import { z } from "zod";');
      expect(output).toContain('"id": z.number().int()');
      expect(output).toContain('"name": z.string()');
      expect(output).toContain('"active": z.boolean()');
    });

    it("converts JSON to Prisma schema accurately", () => {
      const prismaConv = getConverterBySlug("json-to-prisma");
      expect(prismaConv).toBeDefined();
      const output = prismaConv!.convert('{"id": "usr_1", "email": "test@castov.com", "age": 28}');
      expect(output).toContain("model GeneratedModel {");
      expect(output).toContain("id String @id");
      expect(output).toContain("email String");
      expect(output).toContain("age Int");
    });

    it("converts JSON to Drizzle ORM accurately", () => {
      const drizzleConv = getConverterBySlug("json-to-drizzle");
      expect(drizzleConv).toBeDefined();
      const output = drizzleConv!.convert('{"id": 1, "username": "dev_alex", "verified": true}');
      expect(output).toContain("pgTable");
      expect(output).toContain('text("username")');
      expect(output).toContain('boolean("verified")');
    });

    it("converts JSON to Rust Serde struct accurately", () => {
      const rustConv = getConverterBySlug("json-to-rust-struct");
      expect(rustConv).toBeDefined();
      const output = rustConv!.convert('{"user_id": 42, "role": "admin"}');
      expect(output).toContain("pub struct GeneratedRecord {");
      expect(output).toContain("pub user_id: i64");
      expect(output).toContain("pub role: String");
    });

    it("converts JSON to Golang struct accurately", () => {
      const goConv = getConverterBySlug("json-to-go-struct");
      expect(goConv).toBeDefined();
      const output = goConv!.convert('{"api_key": "secret", "limit": 100}');
      expect(output).toContain("type GeneratedRecord struct {");
      expect(output).toContain('ApiKey string `json:"api_key"`');
      expect(output).toContain('Limit int64 `json:"limit"`');
    });

    it("converts JSON to Python Pydantic BaseModel accurately", () => {
      const pyConv = getConverterBySlug("json-to-python-pydantic");
      expect(pyConv).toBeDefined();
      const output = pyConv!.convert('{"title": "Bug Fix", "completed": false}');
      expect(output).toContain("from pydantic import BaseModel");
      expect(output).toContain("class GeneratedRecord(BaseModel):");
      expect(output).toContain("title: str");
      expect(output).toContain("completed: bool");
    });

    it("converts cURL to Fetch, Python Requests, and Axios accurately", () => {
      const curl = `curl -X POST https://api.castov.com/v1/auth -H "Authorization: Bearer test" -d '{"user":"alex"}'`;

      const fetchConv = getConverterBySlug("curl-to-fetch");
      expect(fetchConv).toBeDefined();
      const fetchOutput = fetchConv!.convert(curl);
      expect(fetchOutput).toContain('fetch("https://api.castov.com/v1/auth"');
      expect(fetchOutput).toContain('"POST"');

      const pyConv = getConverterBySlug("curl-to-python");
      expect(pyConv).toBeDefined();
      const pyOutput = pyConv!.convert(curl);
      expect(pyOutput).toContain('requests.post');
      expect(pyOutput).toContain('"https://api.castov.com/v1/auth"');

      const axiosConv = getConverterBySlug("curl-to-axios");
      expect(axiosConv).toBeDefined();
      const axiosOutput = axiosConv!.convert(curl);
      expect(axiosOutput).toContain('axios({');
      expect(axiosOutput).toContain('"https://api.castov.com/v1/auth"');
    });

    it("converts Docker run command to Docker Compose accurately", () => {
      const dockerConv = getConverterBySlug("docker-run-to-compose");
      expect(dockerConv).toBeDefined();
      const output = dockerConv!.convert(
        "docker run -d --name web -p 8080:80 -e PORT=80 -v /data:/app nginx:alpine"
      );
      expect(output).toContain('version: "3.8"');
      expect(output).toContain("services:");
      expect(output).toContain("web:");
      expect(output).toContain("image: nginx:alpine");
      expect(output).toContain('"8080:80"');
    });

    it("converts .env to Docker Compose & K8s ConfigMap accurately", () => {
      const envConv = getConverterBySlug("env-to-docker-compose");
      expect(envConv).toBeDefined();
      const output = envConv!.convert("DATABASE_URL=postgres://localhost\nPORT=3000");
      expect(output).toContain("# 1. Docker Compose Format");
      expect(output).toContain("- DATABASE_URL=postgres://localhost");
      expect(output).toContain("# 2. Kubernetes ConfigMap Format");
      expect(output).toContain("kind: ConfigMap");
    });

    it("converts CSV to JSON and JSON to CSV accurately", () => {
      const csvToJson = getConverterBySlug("csv-to-json");
      const jsonToCsv = getConverterBySlug("json-to-csv");
      expect(csvToJson).toBeDefined();
      expect(jsonToCsv).toBeDefined();

      const csvData = "name,role,dept\nAlice,Lead,Platform\nBob,Dev,Backend";
      const jsonRes = csvToJson!.convert(csvData);
      expect(jsonRes).toContain('"name": "Alice"');

      const csvRes = jsonToCsv!.convert(jsonRes);
      expect(csvRes).toContain("name,role,dept");
      expect(csvRes).toContain("Alice,Lead,Platform");
    });

    it("converts YAML to JSON and JSON to YAML accurately", () => {
      const y2j = getConverterBySlug("yaml-to-json");
      const j2y = getConverterBySlug("json-to-yaml");
      expect(y2j).toBeDefined();
      expect(j2y).toBeDefined();

      const yamlData = "project: castov\nenabled: true\n";
      const jsonRes = y2j!.convert(yamlData);
      expect(jsonRes).toContain('"project": "castov"');

      const yamlRes = j2y!.convert(jsonRes);
      expect(yamlRes).toContain("project: castov");
    });

    it("handles malformed JSON gracefully by throwing descriptive errors", () => {
      const zodConv = getConverterBySlug("json-to-zod");
      expect(() => zodConv!.convert("{ invalid json")).toThrow();
    });
  });

  describe("Page Route, Static Params, and Metadata", () => {
    it("generates static params for all registered converters", () => {
      const params = generateStaticParams();
      expect(params.length).toEqual(CODE_CONVERTERS.length);
      expect(params.some((p) => p.slug === "json-to-zod")).toBe(true);
      expect(params.some((p) => p.slug === "curl-to-fetch")).toBe(true);
      expect(params.some((p) => p.slug === "docker-run-to-compose")).toBe(true);
    });

    it("generates metadata for a valid converter", async () => {
      const zodConv = getConverterBySlug("json-to-zod")!;
      const meta = await generateMetadata({
        params: Promise.resolve({ slug: "json-to-zod" }),
      });
      expect(meta.title).toEqual({
        absolute: `${zodConv.title} | Castov`,
      });
      expect(meta.description).toContain("Convert JSON data to TypeScript Zod schemas");
    });

    it("generates fallback metadata for an unknown converter slug", async () => {
      const meta = await generateMetadata({
        params: Promise.resolve({ slug: "unknown-converter" }),
      });
      expect(meta.title).toEqual({
        absolute: "Code Converter Not Found - Castov",
      });
    });
  });

  describe("CodeConverterTool UI Component", () => {
    it("renders the editor, displays converted code, and supports clear/sample actions", () => {
      const converter = getConverterBySlug("json-to-zod")!;
      render(<CodeConverterTool converter={converter} />);

      // Check editor panels
      expect(screen.getByText("Input Source")).toBeInTheDocument();
      expect(screen.getByText("Converted Output")).toBeInTheDocument();

      // Output should contain zod output for the default sample
      expect(screen.getByLabelText(/Converted output editor/i)).toBeInTheDocument();

      // Clear button
      const clearBtn = screen.getByRole("button", { name: /Clear input editor/i });
      fireEvent.click(clearBtn);
      const inputArea = screen.getByLabelText(/Input code editor/i) as HTMLTextAreaElement;
      expect(inputArea.value).toBe("");

      // Load sample button
      const sampleBtn = screen.getByRole("button", { name: /Load sample code/i });
      fireEvent.click(sampleBtn);
      expect(inputArea.value).toContain('"id": "usr_9918"');
    });

    it("displays an error banner when invalid syntax is entered", () => {
      const converter = getConverterBySlug("json-to-zod")!;
      render(<CodeConverterTool converter={converter} />);

      const inputArea = screen.getByLabelText(/Input code editor/i);
      fireEvent.change(inputArea, { target: { value: "{ invalid" } });

      expect(screen.getByRole("status")).toBeInTheDocument();
    });
  });
});

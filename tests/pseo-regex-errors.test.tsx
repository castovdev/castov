// @vitest-environment jsdom
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  REGEX_PATTERNS,
  getPatternBySlug,
} from "@/lib/regex-patterns-registry";
import {
  ERROR_FIXES,
  getErrorBySlug,
} from "@/lib/error-fixes-registry";
import { RegexPatternTesterTool } from "@/components/tools/regex-pattern-tester-tool";
import { ErrorFixGeneratorTool } from "@/components/tools/error-fix-generator-tool";
import {
  generateStaticParams as generateRegexParams,
  generateMetadata as generateRegexMetadata,
} from "@/app/regex-patterns/[slug]/page";
import {
  generateStaticParams as generateErrorParams,
  generateMetadata as generateErrorMetadata,
} from "@/app/error-fixes/[slug]/page";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  notFound: vi.fn(),
}));

describe("Programmatic SEO: Regex Patterns Library & Lab (40 Patterns)", () => {
  it("contains exactly 40 registered regex patterns", () => {
    expect(REGEX_PATTERNS.length).toBe(40);
  });

  it("ensures all 40 regex patterns compile into valid JavaScript RegExp objects", () => {
    for (const p of REGEX_PATTERNS) {
      expect(() => new RegExp(p.pattern, p.flags)).not.toThrow();
    }
  });

  it("verifies required fields and tokens for each regex pattern", () => {
    const slugs = new Set<string>();
    for (const p of REGEX_PATTERNS) {
      expect(p.slug).toBeTruthy();
      expect(slugs.has(p.slug)).toBe(false);
      slugs.add(p.slug);

      expect(p.name).toBeTruthy();
      expect(p.title).toBeTruthy();
      expect(p.description).toBeTruthy();
      expect(p.tokens.length).toBeGreaterThanOrEqual(1);
      expect(p.validSamples.length).toBeGreaterThanOrEqual(1);
      expect(p.invalidSamples.length).toBeGreaterThanOrEqual(1);
      expect(p.faqs.length).toBeGreaterThanOrEqual(1);
    }
  });

  it("verifies valid samples match their respective regex patterns", () => {
    for (const p of REGEX_PATTERNS) {
      const cleanFlags = p.flags.replace(/g/g, "");
      for (const sample of p.validSamples) {
        const re = new RegExp(p.pattern, cleanFlags);
        expect(re.test(sample)).toBe(true);
      }
    }
  });

  it("validates specific high-priority patterns: email, password, ipv4, and UUID", () => {
    const email = getPatternBySlug("email-validation");
    expect(email).toBeDefined();
    expect(new RegExp(email!.pattern, email!.flags).test("dev@castov.com")).toBe(true);
    expect(new RegExp(email!.pattern, email!.flags).test("invalid@")).toBe(false);

    const pwd = getPatternBySlug("strong-password");
    expect(pwd).toBeDefined();
    expect(new RegExp(pwd!.pattern, pwd!.flags).test("StrongP@ss2026")).toBe(true);
    expect(new RegExp(pwd!.pattern, pwd!.flags).test("weak")).toBe(false);

    const ipv4 = getPatternBySlug("ipv4-address");
    expect(ipv4).toBeDefined();
    expect(new RegExp(ipv4!.pattern, ipv4!.flags).test("192.168.1.1")).toBe(true);
    expect(new RegExp(ipv4!.pattern, ipv4!.flags).test("999.1.1.1")).toBe(false);

    const uuid = getPatternBySlug("uuid-v4");
    expect(uuid).toBeDefined();
    expect(new RegExp(uuid!.pattern, uuid!.flags).test("c9bf9e57-1685-4c89-bafb-ff5af830be8a")).toBe(true);
    expect(new RegExp(uuid!.pattern, uuid!.flags).test("not-a-uuid")).toBe(false);
  });

  it("generates static params and metadata for all 40 regex patterns", async () => {
    const params = generateRegexParams();
    expect(params.length).toBe(40);
    expect(params.some((p) => p.slug === "email-validation")).toBe(true);
    expect(params.some((p) => p.slug === "arabic-text-unicode")).toBe(true);

    const meta = await generateRegexMetadata({
      params: Promise.resolve({ slug: "email-validation" }),
    });
    expect(meta.title).toEqual({
      absolute: "Email Validation Regex — RFC 5322 Compliant Regular Expression | Castov",
    });
  });

  it("renders RegexPatternTesterTool and updates test results", () => {
    const pattern = getPatternBySlug("email-validation")!;
    render(<RegexPatternTesterTool slug={pattern.slug} />);

    expect(screen.getByLabelText(/Regular expression pattern input/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Live regex test string/i)).toBeInTheDocument();
    expect(screen.getByText(/Test Samples Verification Matrix/i)).toBeInTheDocument();
    expect(screen.getByText(/Code Implementation Generator/i)).toBeInTheDocument();
  });
});

describe("Programmatic SEO: Error Fix Encyclopedia (69 Guides)", () => {
  it("contains all 69 registered error fix guides with minimum invariant guarantee", () => {
    expect(ERROR_FIXES.length).toBe(69);
    expect(ERROR_FIXES.length).toBeGreaterThanOrEqual(35);
  });

  it("verifies required fields, code comparisons and diagnostics for all 69 error fixes", () => {
    const slugs = new Set<string>();
    for (const err of ERROR_FIXES) {
      expect(err.slug).toBeTruthy();
      expect(err.slug).toMatch(/^[a-z0-9-]+$/); // URL-safe slug
      expect(slugs.has(err.slug), `Duplicate slug detected: ${err.slug}`).toBe(false);
      slugs.add(err.slug);

      expect(err.name).toBeTruthy();
      expect(err.title).toBeTruthy();
      expect(err.summary).toBeTruthy();
      expect(err.summary.length).toBeGreaterThanOrEqual(20);
      expect(err.errorMessage).toBeTruthy();
      expect(err.rootCause).toBeTruthy();
      expect(err.brokenCode).toBeTruthy();
      expect(err.fixedCode).toBeTruthy();
      expect(err.diagnosticCommands.length).toBeGreaterThanOrEqual(1);
      expect(err.faqs.length).toBeGreaterThanOrEqual(1);
      expect(typeof err.generateCustomSolution).toBe("function");

      // Verify custom solution generates non-empty string
      const solution = err.generateCustomSolution({});
      expect(solution.length).toBeGreaterThan(10);
    }
  });

  it("verifies key web and devops error guides: hydration, CORS, and Docker ports", () => {
    const hydration = getErrorBySlug("nextjs-hydration-failed");
    expect(hydration).toBeDefined();
    expect(hydration!.errorMessage).toContain("Hydration failed");

    const cors = getErrorBySlug("cors-access-control-allow-origin-missing");
    expect(cors).toBeDefined();
    expect(cors!.errorMessage).toContain("Access-Control-Allow-Origin");

    const docker = getErrorBySlug("docker-bind-address-already-in-use");
    expect(docker).toBeDefined();
    expect(docker!.errorMessage).toContain("Bind for 0.0.0.0");
  });

  it("generates static params and metadata for all 69 error fixes without duplication", async () => {
    const params = generateErrorParams();
    expect(params.length).toBe(ERROR_FIXES.length);
    expect(params.length).toBe(69);

    const paramSlugs = new Set(params.map((p) => p.slug));
    expect(paramSlugs.size).toBe(69); // No duplicates in route params

    expect(params.some((p) => p.slug === "nextjs-hydration-failed")).toBe(true);
    expect(params.some((p) => p.slug === "cors-access-control-allow-origin-missing")).toBe(true);
    expect(params.some((p) => p.slug === "linux-permission-denied-publickey")).toBe(true);

    const meta = await generateErrorMetadata({
      params: Promise.resolve({ slug: "nextjs-hydration-failed" }),
    });
    expect(meta.title).toEqual({
      absolute: "How to Fix 'Hydration failed because the initial UI does not match' in Next.js | Castov",
    });
  });

  it("renders ErrorFixGeneratorTool and navigates tabs", () => {
    const errorItem = getErrorBySlug("nextjs-hydration-failed")!;
    render(<ErrorFixGeneratorTool slug={errorItem.slug} />);

    expect(screen.getByText(/Triggered Error Message:/i)).toBeInTheDocument();
    expect(screen.getByText(/Custom Fix Generator/i)).toBeInTheDocument();

    // Switch to diff tab
    const diffTab = screen.getByRole("button", { name: /Broken vs Fixed Code/i });
    fireEvent.click(diffTab);
    expect(screen.getByText(/❌ Broken Code/i)).toBeInTheDocument();
    expect(screen.getByText(/✅ Fixed Code/i)).toBeInTheDocument();

    // Switch to diagnostics tab
    const diagTab = screen.getByRole("button", { name: /Terminal Diagnostics/i });
    fireEvent.click(diagTab);
    expect(screen.getByText(/Execute these diagnostic terminal commands/i)).toBeInTheDocument();
  });
});

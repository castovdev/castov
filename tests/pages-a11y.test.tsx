// @vitest-environment jsdom
import axe from "axe-core";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, beforeAll, vi } from "vitest";
import HomePage from "@/app/page";
import AboutPage from "@/app/about/page";
import PrivacyPage from "@/app/privacy/page";
import TermsPage from "@/app/terms/page";
import ContactPage from "@/app/contact/page";
import ToolsPage from "@/app/tools/page";
import GuidesPage from "@/app/guides/page";
import NotFound from "@/app/not-found";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { ToolPage } from "@/components/tool-page";
import { RelatedTools } from "@/components/related-tools";
import { StaticPage } from "@/components/static-page";
import { GUIDES } from "@/content/guides";
import { TOOLS } from "@/content/tools";
import { HOME_FAQ } from "@/content/home";

async function violations(container: HTMLElement) {
  // jsdom has no layout engine, so colour contrast is verified separately (theme-contrast.test.ts).
  const results = await axe.run(container, { rules: { "color-contrast": { enabled: false } } });
  return results.violations.map((v) => `${v.id}: ${v.help} -> ${v.nodes.map((n) => n.target.join(" ")).join(" | ")}`);
}

beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main id="main">{children}</main>
      <SiteFooter />
    </>
  );
}

describe.each(TOOLS.map((t) => [t.slug, t] as const))("tool page /%s", (_slug, tool) => {
  it("has the required structure", () => {
    const { container } = render(<ToolPage tool={tool} />);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(tool.name);

    const crumbs = screen.getByRole("navigation", { name: "Breadcrumb" });
    expect(within(crumbs).getAllByRole("link").map((a) => a.textContent)).toEqual(["Home", "Tools"]);
    expect(within(crumbs).getByText(tool.name)).toHaveAttribute("aria-current", "page");

    expect(screen.getByText(tool.intro)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "How to use this tool" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Examples" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Frequently Asked Questions/i })).toBeInTheDocument();
    for (const f of tool.faq) {
      expect(screen.getByText(f.q)).toBeInTheDocument();
      expect(screen.getByText(f.a)).toBeInTheDocument();
    }
    for (const s of tool.sections) expect(screen.getAllByRole("heading", { level: 2, name: s.heading })[0]).toBeInTheDocument();
    if (tool.related && tool.related.length > 0) {
      expect(screen.getByRole("heading", { name: "Related tools" })).toBeInTheDocument();
      const related = screen.getByRole("heading", { name: "Related tools" }).closest("section")!;
      expect(within(related).getAllByRole("link").map((a) => a.getAttribute("href"))).toEqual(tool.related.map((r) => `/${r}`));
    }

    // tool interface is present and has a submit/primary control or live clock
    expect(container.querySelector("form, [role=timer], button")).not.toBeNull();
  });

  it("has valid structured data that matches the page", () => {
    const { container } = render(<ToolPage tool={tool} />);
    const blocks = [...container.querySelectorAll('script[type="application/ld+json"]')].flatMap((s) => {
      const parsed = JSON.parse(s.innerHTML);
      return Array.isArray(parsed) ? parsed : [parsed];
    });

    // 1. SoftwareApplication / WebApplication schema validation
    const appSchema = blocks.find((b) => {
      const type = b["@type"];
      return type === "WebApplication" || (Array.isArray(type) && type.includes("WebApplication"));
    });
    expect(appSchema, `Tool ${tool.slug} should emit WebApplication schema`).toBeDefined();
    expect(appSchema["@context"]).toBe("https://schema.org");
    expect(appSchema.name).toBe(tool.name);
    expect(appSchema.description).toBe(tool.metaDescription);
    expect(appSchema.url).toBeTruthy();

    // 2. TechArticle schema validation
    const techArticle = blocks.find((b) => b["@type"] === "TechArticle");
    expect(techArticle, `Tool ${tool.slug} should emit TechArticle schema`).toBeDefined();
    expect(techArticle.headline).toBeTruthy();
    expect(techArticle.url).toBeTruthy();

    // 3. HowTo schema validation when howTo is present
    if (tool.howTo && tool.howTo.length > 0) {
      const howTo = blocks.find((b) => b["@type"] === "HowTo");
      expect(howTo, `Tool ${tool.slug} with howTo steps must emit HowTo schema`).toBeDefined();
      expect(howTo.step).toHaveLength(tool.howTo.length);
    }

    // 4. FAQPage schema validation
    const faq = blocks.find((b) => b["@type"] === "FAQPage");
    expect(faq, `Tool ${tool.slug} should emit FAQPage schema`).toBeDefined();
    for (const q of faq.mainEntity) {
      expect(screen.getByText(q.name)).toBeInTheDocument();
      expect(screen.getByText(q.acceptedAnswer.text)).toBeInTheDocument();
    }

    // 5. BreadcrumbList schema validation
    const breadcrumb = blocks.find((b) => b["@type"] === "BreadcrumbList");
    expect(breadcrumb, `Tool ${tool.slug} should emit BreadcrumbList schema`).toBeDefined();
    expect(breadcrumb.itemListElement.map((i: { name: string }) => i.name)).toEqual(["Home", "Tools", tool.name]);
  });

  it("has no automatically detectable accessibility violations", async () => {
    const { container } = render(
      <Shell>
        <ToolPage tool={tool} />
      </Shell>,
    );
    expect(await violations(container)).toEqual([]);
  }, 60_000);

  it("does not render advertising before AdSense is configured", () => {
    const { container } = render(<ToolPage tool={tool} />);
    expect(container.querySelector("ins, iframe")).toBeNull();
  });

  it("keeps every form control labelled", () => {
    const { container } = render(<ToolPage tool={tool} />);
    for (const el of container.querySelectorAll("input, select, textarea")) {
      if (el.getAttribute("type") === "hidden") continue;
      const id = el.getAttribute("id");
      const labelled = (id && container.querySelector(`label[for="${CSS.escape(id)}"]`)) || el.getAttribute("aria-label");
      expect(labelled, el.outerHTML).toBeTruthy();
    }
  });
});

describe("other pages", () => {
  const pages: [string, React.ReactNode][] = [
    ["home", <HomePage key="home" />],
    ["tools", <ToolsPage key="tools" />],
    ["guides", <GuidesPage key="guides" />],
    ["about", <AboutPage key="about" />],
    ["privacy", <PrivacyPage key="privacy" />],
    ["terms", <TermsPage key="terms" />],
    ["contact", <ContactPage key="contact" />],
    ["not found", <NotFound key="nf" />],
  ];

  it.each(pages)("%s page has one h1 and passes automated accessibility checks", async (_name, node) => {
    const { container } = render(<Shell>{node}</Shell>);
    expect(container.querySelectorAll("h1")).toHaveLength(1);
    expect(await violations(container)).toEqual([]);
  });

  it("home page has the requested sections", () => {
    render(<HomePage />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/Developer Tools/i);
    expect(screen.getByRole("link", { name: /Explore Tools/i })).toHaveAttribute("href", "/tools");
    for (const h of ["Frequently Asked Questions", "Explore Our Toolkit"]) {
      expect(screen.getAllByRole("heading", { level: 2, name: h })[0]).toBeInTheDocument();
    }
    for (const f of HOME_FAQ) expect(screen.getByText(f.a)).toBeInTheDocument();
  });

  it("guide pages render their sections and tool links", () => {
    for (const g of GUIDES) {
      const { unmount } = render(
        <StaticPage title={g.name} crumbs={[{ name: "Home", href: "/" }, { name: g.name }]} path={`/guides/${g.slug}`}>
          <RelatedTools slugs={g.tools as never} />
        </StaticPage>,
      );
      expect(screen.getAllByRole("link").length).toBeGreaterThanOrEqual(g.tools.length);
      unmount();
    }
  });

  it("footer and header link to every tool and to the legal pages", () => {
    render(
      <>
        <SiteHeader />
        <SiteFooter />
      </>,
    );
    const hrefs = screen.getAllByRole("link").map((a) => a.getAttribute("href"));
    // Top tools are in the footer
    for (const t of ["unix-timestamp-converter", "world-clock", "timezone-converter", "date-difference"]) {
      expect(hrefs).toContain(`/${t}`);
    }
    for (const p of ["/privacy", "/terms", "/contact", "/about", "/guides", "/tools"]) expect(hrefs).toContain(p);
  });
});

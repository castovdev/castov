// @vitest-environment jsdom
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { TechTrendsTool } from "@/components/tools/tech-trends-tool";
import {
  extractTopKeywords,
  FALLBACK_GITHUB_REPOS,
  FALLBACK_HACKER_NEWS,
  FALLBACK_DEVTO_ARTICLES,
} from "@/lib/tech-trends-fallback";
import TechTrendsPage, { metadata } from "@/app/tech-trends/page";

describe("Tech Pulse Radar Tool & Engine", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe("Keyword Extraction Engine", () => {
    it("extracts and ranks tech keywords accurately while excluding stopwords", () => {
      const keywords = extractTopKeywords(
        FALLBACK_GITHUB_REPOS,
        FALLBACK_HACKER_NEWS,
        FALLBACK_DEVTO_ARTICLES,
        10
      );

      expect(keywords.length).toBeGreaterThan(0);
      expect(keywords.length).toBeLessThanOrEqual(10);
      expect(keywords[0].count).toBeGreaterThanOrEqual(keywords[keywords.length - 1].count);

      // Verify no common stopwords are returned as keywords
      const words = keywords.map((k) => k.keyword.toLowerCase());
      expect(words).not.toContain("the");
      expect(words).not.toContain("and");
      expect(words).not.toContain("with");
    });
  });

  describe("TechTrendsTool Component", () => {
    it("renders initial streams, keyword badges, and navigation tabs", async () => {
      // Mock global fetch to return fallback data instantly
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          github: FALLBACK_GITHUB_REPOS,
          hackernews: FALLBACK_HACKER_NEWS,
          devto: FALLBACK_DEVTO_ARTICLES,
          keywords: extractTopKeywords(
            FALLBACK_GITHUB_REPOS,
            FALLBACK_HACKER_NEWS,
            FALLBACK_DEVTO_ARTICLES
          ),
          updatedAt: new Date().toISOString(),
        }),
      } as any);

      render(<TechTrendsTool />);

      // Verify Header & Badge
      expect(screen.getByRole("heading", { name: /Tech Pulse Radar/i })).toBeInTheDocument();
      expect(screen.getByText(/Live Stream/i)).toBeInTheDocument();

      // Verify Tabs
      expect(screen.getByRole("button", { name: /All Streams/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /GitHub/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Hacker News/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Dev.to/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Saved/i })).toBeInTheDocument();

      // Verify Stream Items Rendered
      await waitFor(() => {
        expect(screen.getByText("agent-zero")).toBeInTheDocument();
        expect(screen.getByText(/Castov – High-velocity/i)).toBeInTheDocument();
      });
    });

    it("filters streams when clicking a keyword badge and resets correctly", async () => {
      render(<TechTrendsTool />);

      // Find any keyword button
      const keywordBadges = screen.getAllByRole("button").filter((btn) =>
        btn.textContent?.startsWith("#")
      );
      expect(keywordBadges.length).toBeGreaterThan(0);

      // Click first keyword
      const targetBadge = keywordBadges[0];
      fireEvent.click(targetBadge);

      // "Clear keyword filter" button appears
      expect(screen.getByRole("button", { name: /Clear keyword filter/i })).toBeInTheDocument();

      // Click clear filter
      fireEvent.click(screen.getByRole("button", { name: /Clear keyword filter/i }));
      expect(screen.queryByRole("button", { name: /Clear keyword filter/i })).not.toBeInTheDocument();
    });

    it("filters GitHub repositories by programming language", async () => {
      render(<TechTrendsTool />);

      // Switch to GitHub tab
      const ghTab = screen.getByRole("button", { name: /GitHub/i });
      fireEvent.click(ghTab);

      // Click 'Rust' filter
      const rustFilter = screen.getByRole("button", { name: /^Rust$/i });
      fireEvent.click(rustFilter);

      // Verify Rust repo is shown and Python repo is hidden
      expect(screen.getByText("turbosql-wasm")).toBeInTheDocument();
      expect(screen.queryByText("agent-zero")).not.toBeInTheDocument();

      // Switch back to 'All'
      const allLangs = screen.getByRole("button", { name: /^All$/i });
      fireEvent.click(allLangs);
      expect(screen.getByText("agent-zero")).toBeInTheDocument();
    });

    it("supports search filtering across titles and descriptions", async () => {
      render(<TechTrendsTool />);

      const searchInput = screen.getByLabelText(/Filter trends/i);
      fireEvent.change(searchInput, { target: { value: "turbosql" } });

      expect(screen.getByText("turbosql-wasm")).toBeInTheDocument();
      expect(screen.queryByText("agent-zero")).not.toBeInTheDocument();

      fireEvent.change(searchInput, { target: { value: "" } });
      expect(screen.getByText("agent-zero")).toBeInTheDocument();
    });

    it("saves and removes bookmarks using localStorage (local-first)", async () => {
      render(<TechTrendsTool />);

      // Bookmark first repo
      const bookmarkButtons = screen.getAllByRole("button", { name: /Bookmark repository/i });
      expect(bookmarkButtons.length).toBeGreaterThan(0);
      fireEvent.click(bookmarkButtons[0]);

      // Check localStorage
      const stored = localStorage.getItem("castov_tech_trends_bookmarks");
      expect(stored).not.toBeNull();
      const parsed = JSON.parse(stored!);
      expect(Object.keys(parsed).length).toBe(1);

      // Navigate to Saved tab
      const savedTab = screen.getByRole("button", { name: /Saved/i });
      fireEvent.click(savedTab);

      expect(screen.getByRole("heading", { name: /Your Saved Bookmarks/i })).toBeInTheDocument();
      expect(screen.getByText("agent-zero")).toBeInTheDocument();

      // Remove bookmark from Saved tab
      const removeBtn = screen.getByRole("button", { name: /Remove bookmark/i });
      fireEvent.click(removeBtn);

      expect(screen.queryByText("agent-zero")).not.toBeInTheDocument();
      expect(screen.getByText(/No matching trends found/i)).toBeInTheDocument();
    });
  });

  describe("TechTrendsPage Route", () => {
    it("renders page title, breadcrumb, and structured SEO schemas", () => {
      const { container } = render(<TechTrendsPage />);

      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Tech Pulse Radar");

      // Verify breadcrumb
      const breadcrumb = screen.getByRole("navigation", { name: "Breadcrumb" });
      expect(breadcrumb).toBeInTheDocument();

      // Verify JSON-LD schemas
      const scripts = container.querySelectorAll('script[type="application/ld+json"]');
      expect(scripts.length).toBe(3); // WebApplication, BreadcrumbList, FAQPage

      const types = Array.from(scripts).map((s) => JSON.parse(s.innerHTML)["@type"]);
      expect(types).toContain("WebApplication");
      expect(types).toContain("BreadcrumbList");
      expect(types).toContain("FAQPage");
    });

    it("exports valid metadata configuration", () => {
      expect(metadata.title).toBeDefined();
      expect(metadata.description).toBeDefined();
    });
  });
});

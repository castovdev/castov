import { describe, it, expect } from "vitest";
import { BLOG_POSTS, getBlogPost, getBlogCategories, getBlogTags } from "@/content/blog";
import { BLOG_LEGACY_REDIRECTS, BLOG_PILLAR_SLUGS, TOTAL_LEGACY_REDIRECTS_COUNT } from "@/lib/blog-redirects";
import sitemap from "@/app/sitemap";

describe("Castov Engineering Blog — 5 Cornerstone Pillars & 301 Redirect Architecture", () => {
  it("contains exactly 5 cornerstone pillar articles", () => {
    expect(BLOG_POSTS).toHaveLength(5);
  });

  it("ensures all 5 pillar slugs match the canonical pillar list", () => {
    const slugs = BLOG_POSTS.map((p) => p.slug);
    for (const pillar of BLOG_PILLAR_SLUGS) {
      expect(slugs).toContain(pillar);
    }
  });

  it("ensures all slugs are unique and valid kebab-case", () => {
    const slugs = new Set<string>();
    for (const post of BLOG_POSTS) {
      expect(post.slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
      expect(slugs.has(post.slug), `Duplicate slug: ${post.slug}`).toBe(false);
      slugs.add(post.slug);
    }
  });

  it("ensures every pillar article has deep, authoritative content with code snippets", () => {
    for (const post of BLOG_POSTS) {
      expect(post.title.length).toBeGreaterThan(20);
      expect(post.summary.length).toBeGreaterThan(50);
      expect(post.category).toBeTruthy();
      expect(post.readingMinutes).toBeGreaterThanOrEqual(15);
      expect(post.sections.length).toBeGreaterThanOrEqual(5);

      // Verify each article contains runnable code examples
      const hasCodeSnippet = post.sections.some((s) => s.code && s.code.length > 50);
      expect(hasCodeSnippet, `Post ${post.slug} must include at least one code snippet`).toBe(true);

      for (const section of post.sections) {
        expect(section.heading).toBeTruthy();
        expect(section.paragraphs.length).toBeGreaterThan(0);
      }

      // Verify structured FAQs
      expect(post.faqs).toBeDefined();
      expect(post.faqs!.length).toBeGreaterThanOrEqual(3);
    }
  });

  it("retrieves individual blog posts by slug", () => {
    for (const post of BLOG_POSTS) {
      const retrieved = getBlogPost(post.slug);
      expect(retrieved).toBeDefined();
      expect(retrieved?.title).toBe(post.title);
    }
  });

  it("has valid categories and tags", () => {
    const categories = getBlogCategories();
    expect(categories.length).toBeGreaterThanOrEqual(3);
    const tags = getBlogTags();
    expect(tags.length).toBeGreaterThanOrEqual(5);
  });

  it("includes /blog and all 5 pillar articles in the sitemap", () => {
    const entries = sitemap();
    const urls = new Set(entries.map((e) => e.url));

    expect(urls.has("https://castov.com/blog")).toBe(true);

    for (const post of BLOG_POSTS) {
      expect(
        urls.has(`https://castov.com/blog/${post.slug}`),
        `Missing from sitemap: ${post.slug}`
      ).toBe(true);
    }
  });

  it("verifies all 95 retired legacy slugs map to valid pillar targets via 301 redirects", () => {
    expect(Object.keys(BLOG_LEGACY_REDIRECTS)).toHaveLength(TOTAL_LEGACY_REDIRECTS_COUNT);
    expect(TOTAL_LEGACY_REDIRECTS_COUNT).toBe(95);

    const validPillarSet = new Set<string>(BLOG_PILLAR_SLUGS);

    for (const [legacySlug, targetPillar] of Object.entries(BLOG_LEGACY_REDIRECTS)) {
      // Must not redirect a pillar to itself
      expect(validPillarSet.has(legacySlug)).toBe(false);

      // Must point to a valid canonical pillar
      expect(
        validPillarSet.has(targetPillar),
        `Legacy slug "${legacySlug}" points to invalid pillar "${targetPillar}"`
      ).toBe(true);
    }
  });
});

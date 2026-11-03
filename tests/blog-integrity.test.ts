import { describe, it, expect } from "vitest";
import { BLOG_POSTS, getBlogPost, getBlogCategories, getBlogTags } from "@/content/blog";
import sitemap from "@/app/sitemap";

describe("Blog Architecture & 100 Articles Integrity", () => {
  it("contains exactly 100 articles", () => {
    expect(BLOG_POSTS).toHaveLength(100);
  });

  it("ensures all slugs are unique and valid kebab-case", () => {
    const slugs = new Set<string>();
    for (const post of BLOG_POSTS) {
      expect(post.slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
      expect(slugs.has(post.slug), `Duplicate slug: ${post.slug}`).toBe(false);
      slugs.add(post.slug);
    }
  });

  it("ensures every article has complete metadata and content", () => {
    for (const post of BLOG_POSTS) {
      expect(post.title.length).toBeGreaterThan(10);
      expect(post.summary.length).toBeGreaterThan(20);
      expect(post.category).toBeTruthy();
      expect(post.readingMinutes).toBeGreaterThanOrEqual(5);
      expect(post.sections.length).toBeGreaterThanOrEqual(1);
      for (const section of post.sections) {
        expect(section.heading).toBeTruthy();
        expect(section.paragraphs.length).toBeGreaterThan(0);
      }
    }
  });

  it("retrieves individual blog posts by slug", () => {
    const firstPost = BLOG_POSTS[0];
    const retrieved = getBlogPost(firstPost.slug);
    expect(retrieved).toBeDefined();
    expect(retrieved?.title).toBe(firstPost.title);
  });

  it("has valid categories and tags", () => {
    const categories = getBlogCategories();
    expect(categories.length).toBeGreaterThanOrEqual(5);
    const tags = getBlogTags();
    expect(tags.length).toBeGreaterThanOrEqual(10);
  });

  it("includes /blog and all 100 articles in the sitemap", () => {
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
});

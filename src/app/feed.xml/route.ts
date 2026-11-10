import { NextResponse } from "next/server";
import { BLOG_POSTS } from "@/content/blog";
import { SITE } from "@/lib/site";

export async function GET() {
  const baseUrl = SITE.url || "https://castov.com";

  const itemsXml = BLOG_POSTS.map((post) => {
    const postUrl = `${baseUrl}/blog/${post.slug}`;
    const pubDate = new Date(post.publishedAt).toUTCString();
    const categoriesXml = (post.tags || [])
      .map((t) => `<category>${escapeXml(t)}</category>`)
      .join("\n      ");

    return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${postUrl}</link>
      <guid isPermaLink="true">${postUrl}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${escapeXml(post.summary)}</description>
      <author>${escapeXml(post.author.name)}</author>
      ${categoriesXml}
    </item>`;
  }).join("\n");

  const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Castov Engineering Blog</title>
    <link>${baseUrl}/blog</link>
    <description>In-depth, local-first engineering guides on Model Context Protocol (MCP), DevSecOps, secret scanning, and deterministic systems.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${baseUrl}/feed.xml" rel="self" type="application/rss+xml"/>
${itemsXml}
  </channel>
</rss>`;

  return new NextResponse(rssXml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

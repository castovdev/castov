import { POPULAR_NPM_PACKAGES } from "@/lib/npm-data";
import { SITE } from "@/lib/site";

export const dynamic = "force-static";
export const revalidate = 86400;

function xmlEscape(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const baseUrl = SITE.url;
  const today = new Date().toISOString().split("T")[0];

  const entries: string[] = [
    `  <url>
    <loc>${baseUrl}/npm</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>`,
  ];

  // Deduplicate, sanitize, and limit to Sitemaps Protocol 0.9 cap (50,000 URLs)
  const uniquePackages = Array.from(
    new Set(POPULAR_NPM_PACKAGES.map((pkg) => pkg.trim()))
  )
    .filter(Boolean)
    .slice(0, 50000);

  for (const pkg of uniquePackages) {
    entries.push(`  <url>
    <loc>${baseUrl}/npm/${xmlEscape(pkg)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`);
  }

  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join("\n")}
</urlset>`;

  return new Response(sitemapXml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=43200",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

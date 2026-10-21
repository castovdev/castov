import { POPULAR_NPM_PACKAGES } from "@/lib/npm-data";

export const dynamic = "force-static";

export async function GET() {
  const baseUrl = "https://castov.com";

  const urls = [
    `${baseUrl}/npm`,
    ...POPULAR_NPM_PACKAGES.map((pkg) => `${baseUrl}/npm/${pkg}`),
  ];

  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (url) => `  <url>
    <loc>${url}</loc>
    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`
  )
  .join("\n")}
</urlset>`;

  return new Response(sitemapXml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
}

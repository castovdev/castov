import { HTTP_STATUS_CODES } from '@/lib/http-statuses';
import { SITE } from '@/lib/site';

export async function GET() {
  const date = new Date().toISOString().split("T")[0];
  const baseUrl = SITE.url;
  const entries: string[] = [
    `  <url>
    <loc>${baseUrl}/http-status</loc>
    <lastmod>${date}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`,
  ];

  for (const code of Object.keys(HTTP_STATUS_CODES)) {
    entries.push(`  <url>
    <loc>${baseUrl}/http-status/${code}</loc>
    <lastmod>${date}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`);
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
}

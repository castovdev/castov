import { SITE } from "@/lib/site";

export async function GET() {
  const baseUrl = SITE.url;
  // Generate a list of significant Unix timestamps to seed Google
  // E.g., start of every month from 2020 to 2030
  const urls: string[] = [];
  const startYear = 2020;
  const endYear = 2030;

  for (let year = startYear; year <= endYear; year++) {
    for (let month = 0; month < 12; month++) {
      const date = new Date(Date.UTC(year, month, 1));
      const ts = Math.floor(date.getTime() / 1000);
      
      urls.push(`
  <url>
    <loc>${baseUrl}/unix/${ts}</loc>
    <changefreq>yearly</changefreq>
    <priority>0.6</priority>
  </url>`);
      
      // Also add the millisecond version
      const ms = date.getTime();
      urls.push(`
  <url>
    <loc>${baseUrl}/unix/${ms}</loc>
    <changefreq>yearly</changefreq>
    <priority>0.5</priority>
  </url>`);
    }
  }

  // Add some highly searched specific timestamps
  const popular = [
    0, // Epoch
    1000000000, // Sep 2001
    1500000000, // Jul 2017
    1600000000, // Sep 2020
    1700000000, // Nov 2023
    1800000000, // Jan 2027
    2000000000, // May 2033
    2147483647, // Y2038 Problem
  ];

  for (const ts of popular) {
    urls.push(`
  <url>
    <loc>${baseUrl}/unix/${ts}</loc>
    <changefreq>yearly</changefreq>
    <priority>0.9</priority>
  </url>`);
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("")}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
}

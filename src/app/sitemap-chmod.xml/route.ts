import { absoluteUrl } from "@/lib/site";

/** All 512 possible chmod octal codes, 000 to 777. */
export async function GET() {
  const date = new Date().toISOString().split("T")[0];
  const entries: string[] = [];

  for (let a = 0; a <= 7; a++) {
    for (let b = 0; b <= 7; b++) {
      for (let c = 0; c <= 7; c++) {
        entries.push(`  <url>
    <loc>${absoluteUrl(`/chmod/${a}${b}${c}`)}</loc>
    <lastmod>${date}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.5</priority>
  </url>`);
      }
    }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml" },
  });
}

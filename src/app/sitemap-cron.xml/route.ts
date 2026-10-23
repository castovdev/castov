import { SITE } from "@/lib/site";

export async function GET() {
  const commonCrons: string[] = [];
  const minutes = ["0", "15", "30", "45", "*"];
  const hours = ["0", "12", "*"];
  const doms = ["1", "15", "*"];
  const months = ["1", "6", "*"];
  const dows = ["0", "1", "5", "*"];
  
  for (const m of minutes) {
    for (const h of hours) {
      for (const dom of doms) {
        for (const mo of months) {
          for (const dow of dows) {
            commonCrons.push(`${m}_${h}_${dom}_${mo}_${dow}`);
          }
        }
      }
    }
  }

  const date = new Date().toISOString().split("T")[0];
  const baseUrl = SITE.url;

  const urls = commonCrons.map((cron) => `  <url>
    <loc>${baseUrl}/cron/${cron}</loc>
    <lastmod>${date}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>`);

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml" },
  });
}

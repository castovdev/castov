import { MetadataRoute } from 'next';
import { AI_TOOLS, AI_CATEGORIES } from '@/lib/ai-tools';
import { TOOLS } from '@/content/tools';
import { GUIDES } from '@/content/guides';
import { AI_HUB_LIVE } from '@/lib/flags';

/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
function getLastMod(_filePath: string) {
  // Using explicit dates or fallback to build time rather than dynamic filesystem access
  return new Date();
}

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://castov.com';

  const sitemapEntries: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: getLastMod('src/app/page.tsx'), changeFrequency: 'daily', priority: 1.0 },
    { url: `${baseUrl}/tools`, lastModified: getLastMod('src/app/tools/page.tsx'), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/guides`, lastModified: getLastMod('src/app/guides/page.tsx'), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/developer`, lastModified: getLastMod('src/app/developer/page.tsx'), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/cli`, lastModified: getLastMod('src/app/cli/page.tsx'), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/extension`, lastModified: getLastMod('src/app/extension/page.tsx'), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/cheatsheets`, lastModified: getLastMod('src/app/cheatsheets/page.tsx'), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/http-status`, lastModified: getLastMod('src/app/http-status/page.tsx'), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/cron`, lastModified: getLastMod('src/app/cron/page.tsx'), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/timezones`, lastModified: getLastMod('src/app/timezones/page.tsx'), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/timestamps`, lastModified: getLastMod('src/app/timestamps/page.tsx'), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/resources`, lastModified: getLastMod('src/app/resources/page.tsx'), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/code`, lastModified: getLastMod('src/app/code/page.tsx'), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/convert`, lastModified: getLastMod('src/app/convert/page.tsx'), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/chrono-db`, lastModified: getLastMod('src/app/chrono-db/page.tsx'), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/webhook-tester`, lastModified: getLastMod('src/app/webhook-tester/page.tsx'), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/nexus-grid`, lastModified: getLastMod('src/app/nexus-grid/page.tsx'), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/env-vault`, lastModified: getLastMod('src/app/env-vault/page.tsx'), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/sonic-gap`, lastModified: getLastMod('src/app/sonic-gap/page.tsx'), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/quantum`, lastModified: getLastMod('src/app/quantum/page.tsx'), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/sponsor`, lastModified: getLastMod('src/app/sponsor/page.tsx'), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/about`, lastModified: getLastMod('src/app/about/page.tsx'), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/contact`, lastModified: getLastMod('src/app/contact/page.tsx'), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/privacy`, lastModified: getLastMod('src/app/privacy/page.tsx'), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${baseUrl}/terms`, lastModified: getLastMod('src/app/terms/page.tsx'), changeFrequency: 'monthly', priority: 0.3 },
  ];

  TOOLS.forEach((tool) => {
    sitemapEntries.push({
      url: `${baseUrl}/${tool.slug}`,
      lastModified: getLastMod('src/content/tools.ts'),
      changeFrequency: 'weekly',
      priority: 0.8,
    });
  });

  GUIDES.forEach((guide) => {
    sitemapEntries.push({
      url: `${baseUrl}/guides/${guide.slug}`,
      lastModified: getLastMod('src/content/guides.ts'),
      changeFrequency: 'monthly',
      priority: 0.7,
    });
  });

  if (AI_HUB_LIVE) {
    sitemapEntries.push({ url: `${baseUrl}/ai`, lastModified: getLastMod('src/app/ai/page.tsx'), changeFrequency: 'daily', priority: 0.9 });

    AI_CATEGORIES.forEach((category) => {
      sitemapEntries.push({
        url: `${baseUrl}/ai/${category}`,
        lastModified: getLastMod('src/lib/ai-tools.ts'),
        changeFrequency: 'weekly',
        priority: 0.7,
      });
    });

    AI_TOOLS.forEach((tool) => {
      sitemapEntries.push({
        url: `${baseUrl}/ai/${tool.slug}`,
        lastModified: getLastMod('src/lib/ai-tools.ts'),
        changeFrequency: 'weekly',
        priority: 0.6,
      });
    });
  }

  const seen = new Set<string>();
  return sitemapEntries.filter((entry) => {
    if (seen.has(entry.url)) return false;
    seen.add(entry.url);
    return true;
  });
}

import { MetadataRoute } from 'next';
import { AI_TOOLS, AI_CATEGORIES } from '@/lib/ai-tools';
import { TOOLS } from '@/content/tools';
import { GUIDES } from '@/content/guides';
import { AI_HUB_LIVE } from '@/lib/flags';
import { CODE_CONVERTERS } from '@/lib/code-converters-registry';
import { REGEX_PATTERNS } from '@/lib/regex-patterns-registry';
import { ERROR_FIXES } from '@/lib/error-fixes-registry';
import { TIMEZONE_PAIRS } from '@/lib/timezone-pairs-registry';
import { NETWORK_PORTS, CIDR_BLOCKS } from '@/lib/network-ports-registry';
import { TECH_TREND_TOPICS } from '@/lib/tech-trends-registry';
import { CLOUD_SERVICES } from '@/lib/cloud-status-registry';
import { LLM_MODELS } from '@/lib/llm-specs-registry';
import { HTTP_STATUS_CODES } from '@/lib/http-statuses';

function getLastMod(_filePath: string) {
  // Using explicit dates or fallback to build time rather than dynamic filesystem access
  return new Date();
}

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://castov.com';

  const sitemapEntries: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: getLastMod('src/app/page.tsx'), changeFrequency: 'daily', priority: 1.0 },
    { url: `${baseUrl}/mcp`, lastModified: getLastMod('src/app/mcp/page.tsx'), changeFrequency: 'daily', priority: 1.0 },
    { url: `${baseUrl}/llms.txt`, lastModified: getLastMod('public/llms.txt'), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/llms-full.txt`, lastModified: getLastMod('public/llms-full.txt'), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/tools`, lastModified: getLastMod('src/app/tools/page.tsx'), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/developer`, lastModified: getLastMod('src/app/developer/page.tsx'), changeFrequency: 'weekly', priority: 0.95 },
    { url: `${baseUrl}/cli`, lastModified: getLastMod('src/app/cli/page.tsx'), changeFrequency: 'weekly', priority: 0.95 },
    { url: `${baseUrl}/extension`, lastModified: getLastMod('src/app/extension/page.tsx'), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/guides`, lastModified: getLastMod('src/app/guides/page.tsx'), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/cheatsheets`, lastModified: getLastMod('src/app/cheatsheets/page.tsx'), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/http-status`, lastModified: getLastMod('src/app/http-status/page.tsx'), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/chmod`, lastModified: getLastMod('src/app/chmod/page.tsx'), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/cron`, lastModified: getLastMod('src/app/cron/page.tsx'), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/timezones`, lastModified: getLastMod('src/app/timezones/page.tsx'), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/timestamps`, lastModified: getLastMod('src/app/timestamps/page.tsx'), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/resources`, lastModified: getLastMod('src/app/resources/page.tsx'), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/code`, lastModified: getLastMod('src/app/code/page.tsx'), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/convert`, lastModified: getLastMod('src/app/convert/page.tsx'), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/chrono-db`, lastModified: getLastMod('src/app/chrono-db/page.tsx'), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/webhook-tester`, lastModified: getLastMod('src/app/webhook-tester/page.tsx'), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/tech-trends`, lastModified: getLastMod('src/app/tech-trends/page.tsx'), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/cursorrules`, lastModified: getLastMod('src/app/cursorrules/page.tsx'), changeFrequency: 'weekly', priority: 0.9 },
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

  CODE_CONVERTERS.forEach((converter) => {
    sitemapEntries.push({
      url: `${baseUrl}/convert/${converter.slug}`,
      lastModified: getLastMod('src/lib/code-converters-registry.ts'),
      changeFrequency: 'weekly',
      priority: 0.8,
    });
  });

  sitemapEntries.push({
    url: `${baseUrl}/regex-patterns`,
    lastModified: getLastMod('src/app/regex-patterns/page.tsx'),
    changeFrequency: 'weekly',
    priority: 0.9,
  });

  REGEX_PATTERNS.forEach((pattern) => {
    sitemapEntries.push({
      url: `${baseUrl}/regex-patterns/${pattern.slug}`,
      lastModified: getLastMod('src/lib/regex-patterns-registry.ts'),
      changeFrequency: 'weekly',
      priority: 0.8,
    });
  });

  sitemapEntries.push({
    url: `${baseUrl}/error-fixes`,
    lastModified: getLastMod('src/app/error-fixes/page.tsx'),
    changeFrequency: 'weekly',
    priority: 0.9,
  });

  ERROR_FIXES.forEach((err) => {
    sitemapEntries.push({
      url: `${baseUrl}/error-fixes/${err.slug}`,
      lastModified: getLastMod('src/lib/error-fixes-registry.ts'),
      changeFrequency: 'weekly',
      priority: 0.8,
    });
  });

  sitemapEntries.push(
    { url: `${baseUrl}/directory`, lastModified: getLastMod('src/app/directory/page.tsx'), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/time`, lastModified: getLastMod('src/app/time/page.tsx'), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/ports`, lastModified: getLastMod('src/app/ports/page.tsx'), changeFrequency: 'weekly', priority: 0.9 }
  );

  TIMEZONE_PAIRS.forEach((pair) => {
    sitemapEntries.push({
      url: `${baseUrl}/time/${pair.slug}`,
      lastModified: getLastMod('src/lib/timezone-pairs-registry.ts'),
      changeFrequency: 'weekly',
      priority: 0.8,
    });
  });

  NETWORK_PORTS.forEach((p) => {
    sitemapEntries.push({
      url: `${baseUrl}/ports/${p.port}`,
      lastModified: getLastMod('src/lib/network-ports-registry.ts'),
      changeFrequency: 'monthly',
      priority: 0.8,
    });
  });

  CIDR_BLOCKS.forEach((c) => {
    sitemapEntries.push({
      url: `${baseUrl}/cidr/${c.prefix}`,
      lastModified: getLastMod('src/lib/network-ports-registry.ts'),
      changeFrequency: 'monthly',
      priority: 0.8,
    });
  });

  TECH_TREND_TOPICS.forEach((topic) => {
    sitemapEntries.push({
      url: `${baseUrl}/tech-trends/${topic.slug}`,
      lastModified: getLastMod('src/lib/tech-trends-registry.ts'),
      changeFrequency: 'hourly',
      priority: 0.8,
    });
  });

  sitemapEntries.push(
    { url: `${baseUrl}/status`, lastModified: getLastMod('src/app/status/page.tsx'), changeFrequency: 'hourly', priority: 0.9 },
    { url: `${baseUrl}/curl-converter`, lastModified: getLastMod('src/app/curl-converter/page.tsx'), changeFrequency: 'monthly', priority: 0.8 }
  );

  CLOUD_SERVICES.forEach((cs) => {
    sitemapEntries.push({
      url: `${baseUrl}/status/${cs.slug}`,
      lastModified: getLastMod('src/lib/cloud-status-registry.ts'),
      changeFrequency: 'hourly',
      priority: 0.9,
    });
  });

  LLM_MODELS.forEach((model) => {
    sitemapEntries.push({
      url: `${baseUrl}/llm/${model.slug}`,
      lastModified: getLastMod('src/lib/llm-specs-registry.ts'),
      changeFrequency: 'weekly',
      priority: 0.8,
    });
  });

  Object.keys(HTTP_STATUS_CODES).forEach((code) => {
    sitemapEntries.push({
      url: `${baseUrl}/http-status/${code}`,
      lastModified: getLastMod('src/app/http-status/[code]/page.tsx'),
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

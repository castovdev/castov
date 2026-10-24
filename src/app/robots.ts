import { MetadataRoute } from 'next';
import { SITE } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = SITE.url;
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/admin/', '/account', '/dashboard'],
    },
    sitemap: [
      `${baseUrl}/sitemap.xml`,
      `${baseUrl}/sitemap-unix.xml`,
      `${baseUrl}/sitemap-cron.xml`,
      `${baseUrl}/sitemap-chmod.xml`,
      `${baseUrl}/sitemap-http-status.xml`,
      `${baseUrl}/sitemap-npm.xml`,
      `${baseUrl}/sitemap-compare.xml`,
    ],
    host: baseUrl,
  };
}

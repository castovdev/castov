import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/admin/'],
    },
    sitemap: [
      'https://castov.com/sitemap.xml',
      'https://castov.com/sitemap-unix.xml',
      'https://castov.com/sitemap-cron.xml',
      'https://castov.com/sitemap-chmod.xml',
    ],
    host: 'https://castov.com',
  };
}

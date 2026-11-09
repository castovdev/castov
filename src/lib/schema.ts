// lib/schema.ts
import { SITE } from '@/lib/site'

export const siteGraph = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${SITE.url}/#organization`,
      name: 'Castov',
      alternateName: 'CastovDEV',
      url: `${SITE.url}/`,
      logo: {
        '@type': 'ImageObject',
        '@id': `${SITE.url}/#logo`,
        url: SITE.logo,
        width: 512,
        height: 512,
      },
      image: { '@id': `${SITE.url}/#logo` },
      description: 'Castov builds local-first developer tools: a web toolkit, a CLI and an MCP server for AI editors.',
      sameAs: SITE.sameAs,
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE.url}/#website`,
      url: `${SITE.url}/`,
      name: 'Castov',
      description: 'Free developer tools for your browser, terminal and AI editors.',
      inLanguage: 'en',
      publisher: { '@id': `${SITE.url}/#organization` },
    },
    {
      '@type': 'SoftwareApplication',
      '@id': `${SITE.url}/#software`,
      name: 'Castov',
      url: `${SITE.url}/`,
      applicationCategory: 'DeveloperApplication',
      operatingSystem: 'Web, Windows, macOS, Linux',
      description: 'A local-first developer toolkit with a web app, a CLI (npx castov) and an MCP server for Cursor and Claude.',
      downloadUrl: 'https://www.npmjs.com/package/castov',
      isAccessibleForFree: true,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      publisher: { '@id': `${SITE.url}/#organization` },
    },
  ],
}
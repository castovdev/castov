import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { AdSenseScript } from "@/components/adsense-script";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { CommandPalette } from "@/components/command-palette";
import { PwaRegister } from "@/components/pwa-register";
import { Analytics } from "@vercel/analytics/next";
import { SITE } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: `${SITE.name} – ${SITE.tagline}`, template: `%s | ${SITE.name}` },
  description: SITE.description,
  applicationName: SITE.name,
  authors: [{ name: SITE.name }],
  formatDetection: { telephone: false, email: false, address: false },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: SITE.themeColor,
};

const THEME_SCRIPT = `try{var t=localStorage.getItem("castov-theme");if(t==="dark"){document.documentElement.dataset.theme="dark"}else{document.documentElement.dataset.theme="light"}}catch(e){document.documentElement.dataset.theme="light"}`;

const SCHEMA_JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE.url}/#website`,
      "url": SITE.url,
      "name": SITE.name
    },
    {
      "@type": "SiteNavigationElement",
      "@id": `${SITE.url}/#navigation`,
      "name": "Primary Navigation",
      "hasPart": [
        { "@type": "WebPage", "name": "Canvas", "url": `${SITE.url}/canvas` },
        { "@type": "WebPage", "name": "WebGPU NexusGrid", "url": `${SITE.url}/nexus-grid` },
        { "@type": "WebPage", "name": "Env Steganography Vault", "url": `${SITE.url}/env-vault` },
        { "@type": "WebPage", "name": "3D JSON Galaxy", "url": `${SITE.url}/json-viewer` },
        { "@type": "WebPage", "name": "Sonic-Gap Bridge", "url": `${SITE.url}/sonic-gap` },
        { "@type": "WebPage", "name": "Extension", "url": `${SITE.url}/extension` }
      ]
    }
  ]
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(SCHEMA_JSON_LD) }} />
      </head>
      <body className="flex min-h-screen flex-col font-sans antialiased">
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-primary focus:text-white dark:text-[#050505] focus:px-4 focus:py-2 focus:rounded-md focus:font-bold">
          Skip to main content
        </a>
        <SiteHeader />
        <main id="main" className="flex-1">
          {children}
        </main>
        <SiteFooter />
        <CommandPalette />
        <AdSenseScript />
        <PwaRegister />
        <Analytics />
      </body>
    </html>
  );
}

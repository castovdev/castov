import type { Metadata, Vimport type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { AdSenseScript } from "@/components/adsense-script";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { ResumeSessionPill } from "@/components/resume-session-pill";
import { CommandPalette } from "@/components/command-palette";
import { KeyboardShortcutsModal } from "@/components/keyboard-shortcuts-modal";
import { PwaRegister } from "@/components/pwa-register";
import { Analytics } from "@vercel/analytics/next";
import { SITE } from "@/lib/site";
import { siteGraph } from "@/lib/schema"; // استيراد الهيكلة الشاملة الجديدة
import { JsonLd } from "@/components/JsonLd"; // مكون حقن الـ JSON-LD الآمن
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: 'Castov – Developer Tools, CLI & MCP Server',
    template: `%s | ${SITE.name}`,
  },
  description: 'Free developer tools for your browser, terminal and AI editors: JSON, JWT, cron and timestamp utilities, plus a CLI and MCP server for Cursor and Claude.',
  applicationName: SITE.name,
  authors: [{ name: SITE.name, url: SITE.url }],
  formatDetection: { telephone: false, email: false, address: false },
  manifest: "/manifest.json",
  openGraph: {
    type: 'website',
    siteName: SITE.name,
    url: SITE.url,
    title: 'Castov – Developer Tools, CLI & MCP Server',
    description: 'Free developer tools for your browser, terminal and AI editors.',
    images: [{ url: '/opengraph_image.jpg', width: 1200, height: 630, alt: 'Castov – local-first developer tools, CLI and MCP server' }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: SITE.themeColor || "#ffffff",
};

const THEME_SCRIPT = `try{var t=localStorage.getItem("castov-theme");if(t==="dark"){document.documentElement.dataset.theme="dark"}else{document.documentElement.dataset.theme="light"}}catch(e){document.documentElement.dataset.theme="light"}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        {/* حقن الهيكلة الشاملة (Organization & SoftwareApplication & SiteNavigation) */}
        <JsonLd data={siteGraph} />
      </head>
      <body className="flex min-h-screen flex-col font-sans antialiased">
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-primary focus:text-white dark:text-[#050505] focus:px-4 focus:py-2 focus:rounded-md focus:font-bold">
          Skip to main content
        </a>
        <SiteHeader />
        <ResumeSessionPill />
        <main id="main" className="flex-1">
          {children}
        </main>
        <SiteFooter />
        <CommandPalette />
        <KeyboardShortcutsModal />
        <AdSenseScript />
        <PwaRegister />
        <Analytics />
      </body>
    </html>
  );
}
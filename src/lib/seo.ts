import type { Metadata } from "next";
import { OG_ALT, OG_SIZE } from "./og-constants";
import { SITE, absoluteUrl } from "./site";
import { AI_HUB_LIVE, isAiHubPath } from "./flags";

export interface PageSeo {
  /** Full <title>. Used as-is (no template) so every page can have its own exact title. */
  title: string;
  description: string;
  /** Path such as "/epoch-converter". */
  path: string;
}

export function buildMetadata({ title, description, path }: PageSeo): Metadata {
  const url = absoluteUrl(path);
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    robots: !AI_HUB_LIVE && isAiHubPath(path) ? { index: false, follow: false } : { index: true, follow: true },
    openGraph: {
      type: "website",
      url,
      title,
      description,
      siteName: SITE.name,
      locale: SITE.locale,
      images: [{ url: absoluteUrl("/opengraph_image.jpg"), width: OG_SIZE.width, height: OG_SIZE.height, alt: OG_ALT }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [{ url: absoluteUrl("/twitter_image.jpg"), width: OG_SIZE.width, height: OG_SIZE.height, alt: OG_ALT }],
    },
  };
}

export interface Crumb {
  name: string;
  /** Omit for the current page. */
  href?: string;
}

export function breadcrumbJsonLd(crumbs: Crumb[], currentPath: string) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: absoluteUrl(c.href ?? currentPath),
    })),
  };
}

export interface FaqItem {
  q: string;
  a: string;
}

/** Only use this when the same questions and answers are visible on the page. */
export function faqJsonLd(items: FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}

export function webApplicationJsonLd(input: { name: string; description: string; path: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: input.name,
    url: absoluteUrl(input.path),
    description: input.description,
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Any",
    browserRequirements: "Requires JavaScript",
    inLanguage: "en",
    isAccessibleForFree: true,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    publisher: { "@type": "Organization", name: SITE.name, url: SITE.url },
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE.name,
    alternateName: SITE.tagline,
    url: SITE.url,
    inLanguage: "en",
  };
}


export function softwareAppJsonLd(input: { name: string; description: string; url: string; category: string }) {
  return {
    "@context": "https://schema.org",
    "@type": ["SoftwareApplication", "WebApplication"],
    name: input.name,
    url: absoluteUrl(input.url),
    description: input.description,
    applicationCategory: input.category,
    operatingSystem: "Any",
    browserRequirements: "Requires JavaScript",
    isAccessibleForFree: true,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    publisher: { "@type": "Organization", name: SITE.name, url: SITE.url },
  };
}

export function howToJsonLd(input: {
  name: string;
  description: string;
  totalTime?: string;
  toolName?: string;
  steps: { name: string; text: string }[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: input.name,
    description: input.description,
    totalTime: input.totalTime ?? "PT2M",
    tool: input.toolName
      ? [{ "@type": "HowToTool", name: input.toolName }]
      : [{ "@type": "HowToTool", name: "Castov CLI (npx castov)" }],
    step: input.steps.map((s, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: s.name,
      text: s.text,
    })),
  };
}

export function techArticleJsonLd(input: {
  headline: string;
  description: string;
  path: string;
  proficiencyLevel?: "Beginner" | "Intermediate" | "Expert";
  dependencies?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: input.headline,
    description: input.description,
    url: absoluteUrl(input.path),
    proficiencyLevel: input.proficiencyLevel ?? "Intermediate",
    dependencies: input.dependencies ?? "Node.js >= 18, npx castov",
    author: { "@type": "Organization", name: SITE.name, url: SITE.url },
    publisher: { "@type": "Organization", name: SITE.name, url: SITE.url },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": absoluteUrl(input.path),
    },
  };
}

export function webPageJsonLd({ name, description, path }: { name: string; description: string; path: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name,
    description,
    url: absoluteUrl(path),
  };
}


import type { Metadata } from "next";
import Link from "next/link";
import { buildMetadata } from "@/lib/seo";
import { HOME_FAQ, WHY_ITEMS } from "@/content/home";
import { TOOLS } from "@/content/tools";
import { GUIDES } from "@/content/guides";
import { FaqSection } from "@/components/faq-section";
import { Breadcrumb } from "@/components/breadcrumb";
import { AdSlot } from "@/components/ad-slot";
import { ToolHost } from "@/components/pseo/tool-host";
import { formatOffset } from "@/lib/time";

export const metadata: Metadata = buildMetadata({
  title: "Time Zone Converter & World Time Zones | Castov",
  description:
    "Convert between 400+ IANA time zones. Browse popular city converters, check current offsets for major world cities, and use our free online converter tool.",
  path: "/timezones",
});


const POPULAR_ZONE_PAIRS: { from: string; fromLabel: string; to: string; toLabel: string }[] = [
  { from: "America/New_York", fromLabel: "New York", to: "Europe/London", toLabel: "London" },
  { from: "America/New_York", fromLabel: "New York", to: "America/Los_Angeles", toLabel: "Los Angeles" },
  { from: "America/New_York", fromLabel: "New York", to: "Europe/Paris", toLabel: "Paris" },
  { from: "America/New_York", fromLabel: "New York", to: "Asia/Tokyo", toLabel: "Tokyo" },
  { from: "Europe/London", fromLabel: "London", to: "Europe/Paris", toLabel: "Paris" },
  { from: "Europe/London", fromLabel: "London", to: "Asia/Dubai", toLabel: "Dubai" },
  { from: "Europe/London", fromLabel: "London", to: "Asia/Tokyo", toLabel: "Tokyo" },
  { from: "Europe/Paris", fromLabel: "Paris", to: "Europe/Berlin", toLabel: "Berlin" },
  { from: "America/Chicago", fromLabel: "Chicago", to: "America/New_York", toLabel: "New York" },
  { from: "Asia/Dubai", fromLabel: "Dubai", to: "Asia/Kolkata", toLabel: "Mumbai" },
  { from: "Asia/Shanghai", fromLabel: "Shanghai", to: "Asia/Tokyo", toLabel: "Tokyo" },
  { from: "UTC", fromLabel: "UTC", to: "America/New_York", toLabel: "New York" },
];

const HUB_CITIES: {
  slug: string;
  name: string;
  country: string;
  iana: string;
  population: number;
  notes?: string[];
}[] = [
  { slug: "new-york", name: "New York", country: "United States", iana: "America/New_York", population: 19426449, notes: ["EST/EDT — observes DST"] },
  { slug: "los-angeles", name: "Los Angeles", country: "United States", iana: "America/Los_Angeles", population: 12872321, notes: ["PST/PDT — observes DST"] },
  { slug: "chicago", name: "Chicago", country: "United States", iana: "America/Chicago", population: 8937259, notes: ["CST/CDT — observes DST"] },
  { slug: "london", name: "London", country: "United Kingdom", iana: "Europe/London", population: 9425622, notes: ["GMT/BST — observes DST"] },
  { slug: "paris", name: "Paris", country: "France", iana: "Europe/Paris", population: 11020000, notes: ["CET/CEST — observes DST"] },
  { slug: "berlin", name: "Berlin", country: "Germany", iana: "Europe/Berlin", population: 6144600, notes: ["CET/CEST — observes DST"] },
  { slug: "dubai", name: "Dubai", country: "United Arab Emirates", iana: "Asia/Dubai", population: 3558000, notes: ["GST — UTC+04:00, no DST"] },
  { slug: "mumbai", name: "Mumbai", country: "India", iana: "Asia/Kolkata", population: 20411000, notes: ["IST — UTC+05:30, no DST"] },
  { slug: "shanghai", name: "Shanghai", country: "China", iana: "Asia/Shanghai", population: 27058400, notes: ["CST — UTC+08:00, no DST"] },
  { slug: "tokyo", name: "Tokyo", country: "Japan", iana: "Asia/Tokyo", population: 37194000, notes: ["JST — UTC+09:00, no DST"] },
  { slug: "sydney", name: "Sydney", country: "Australia", iana: "Australia/Sydney", population: 5361466, notes: ["AEST/AEDT — observes DST (Southern Hemisphere)"] },
  { slug: "sao-paulo", name: "São Paulo", country: "Brazil", iana: "America/Sao_Paulo", population: 22430000, notes: ["BRT — UTC-03:00, no DST since 2019"] },
  { slug: "cairo", name: "Cairo", country: "Egypt", iana: "Africa/Cairo", population: 22183000, notes: ["EET — UTC+02:00, reintroduced DST in 2023"] },
  { slug: "lagos", name: "Lagos", country: "Nigeria", iana: "Africa/Lagos", population: 15946000, notes: ["WAT — UTC+01:00, no DST"] },
];

function offsetFor(iana: string, ms: number): string {
  try {
    const dtf = new Intl.DateTimeFormat("en-US", {
      timeZone: iana,
      timeZoneName: "shortOffset",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const parts = dtf.formatToParts(new Date(ms));
    const tzPart = parts.find((p) => p.type === "timeZoneName");
    if (tzPart?.value) return tzPart.value;
  } catch {
    /* fall through */
  }
  try {
    const utcStr = new Date(ms).toLocaleString("en-US", { timeZone: "UTC" });
    const utcDate = new Date(utcStr);
    const locStr = new Date(ms).toLocaleString("en-US", { timeZone: iana });
    const locDate = new Date(locStr);
    const diffMs = locDate.getTime() - utcDate.getTime();
    return formatOffset(diffMs);
  } catch {
    return "—";
  }
}

function currentOffset(iana: string): string {
  return offsetFor(iana, Date.now());
}

export default function TimezonesHubPage() {
  const timezoneTools = TOOLS.filter(
    (t) =>
      t.category === "Time Zones" ||
      ["world-clock", "timezone-offset", "utc-converter", "current-unix-timestamp"].includes(t.slug),
  );

  const relatedGuides = GUIDES.filter((g) =>
    ["time-zones-and-dst-for-developers", "utc-vs-gmt", "what-is-unix-time"].includes(g.slug),
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Breadcrumb
        path="/timezones"
        crumbs={[{ name: "Home", href: "/" }, { name: "Time Zones" }]}
      />

      <div className="hero-section -mx-4 px-4 py-12 md:py-16">
        <div className="mb-6">
          <span className="hero-badge">
            <span className="hero-badge-dot" aria-hidden="true" />
            400+ IANA zones — DST-aware, free, no sign-up
          </span>
        </div>

        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl text-fg">
          Time Zone Converter &amp; World Time Zones
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
          Convert any moment between hundreds of IANA time zones with up-to-date daylight
          saving rules. Check the most popular city pairs, browse current offsets for major
          cities, or try the embedded converter below.
        </p>
      </div>

      <AdSlot placement="tool-top" />

      <section aria-labelledby="popular-pairs" className="mt-10">
        <h2 id="popular-pairs" className="section-heading mb-6">
          Popular Conversions
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 list-none p-0">
          {POPULAR_ZONE_PAIRS.map((pair, i) => (
            <li key={`${pair.from}-${pair.to}-${i}`}>
              <Link
                href="/timezone-converter"
                className="card block h-full p-4 no-underline hover:border-accent transition-colors"
                aria-label={`Convert ${pair.fromLabel} to ${pair.toLabel}`}
              >
                <span className="block font-semibold text-fg">
                  {pair.fromLabel} → {pair.toLabel}
                </span>
                <span className="mt-1 block text-xs text-muted font-mono">
                  {pair.from} → {pair.to}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <AdSlot placement="content-middle" />

      <section aria-labelledby="hub-cities" className="mt-10">
        <h2 id="hub-cities" className="section-heading mb-6">
          Major Cities &amp; Current Offsets
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {HUB_CITIES.map((city) => (
            <div
              key={city.slug}
              className="card block p-5"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <span className="block font-bold text-fg">{city.name}</span>
                  <span className="block text-xs text-muted">{city.country}</span>
                </div>
                <span className="rounded-md bg-hover/60 px-2 py-0.5 text-[11px] font-mono text-accent whitespace-nowrap">
                  {currentOffset(city.iana)}
                </span>
              </div>
              <div className="text-xs font-mono text-muted">
                {city.iana}
              </div>
              {city.notes?.map((n, ni) => (
                <p key={ni} className="mt-2 text-xs text-muted">
                  {n}
                </p>
              ))}
              <div className="mt-3 text-xs text-muted">
                {city.population.toLocaleString("en-US")} metro
              </div>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="tz-converter" className="mt-12">
        <h2 id="tz-converter" className="section-heading mb-6">
          Time Zone Converter
        </h2>
        <div className="card p-4 sm:p-6">
          <ToolHost config={{ component: "timezone-converter" }} />
        </div>
      </section>

      <section aria-labelledby="all-tools" className="mt-12">
        <h2 id="all-tools" className="section-heading mb-6">
          All Time Zone Tools
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 list-none p-0">
          {timezoneTools.map((t) => (
            <li key={t.slug}>
              <Link
                href={`/${t.slug}`}
                className="card block h-full p-4 no-underline hover:border-accent transition-colors"
              >
                <span className="block font-semibold text-fg">{t.name}</span>
                <span className="mt-1 block text-sm text-muted">
                  {t.cardDescription}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <AdSlot placement="content-bottom" />

      <section aria-labelledby="related-guides" className="mt-12">
        <h2 id="related-guides" className="section-heading mb-6">
          Guides
        </h2>
        <ul className="grid gap-4 sm:grid-cols-2 list-none p-0">
          {relatedGuides.map((g) => (
            <li key={g.slug}>
              <Link
                href={`/guides/${g.slug}`}
                className="guide-card card block h-full p-5 no-underline"
              >
                <span className="block font-bold text-fg">{g.name}</span>
                <span className="mt-2 block text-sm leading-relaxed text-muted">
                  {g.summary}
                </span>
                <span className="mt-3 block text-xs text-muted">
                  {g.readingMinutes} min read
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12" aria-labelledby="why-section">
        <h2 id="why-section" className="section-heading mb-6">
          Why Use Castov?
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {WHY_ITEMS.slice(0, 3).map((item) => (
            <div key={item.title} className="card p-5">
              <h3 className="font-bold text-lg">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {item.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-12">
        <FaqSection items={HOME_FAQ} headingId="faq" />
      </div>

      <section className="cta-band mt-12 p-10 text-center" aria-labelledby="cta-heading">
        <h2 id="cta-heading" className="text-3xl font-extrabold tracking-tight">
          Need to compare multiple zones?
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-muted">
          Use the World Clock tool to see the same instant across up to eight time
          zones at once, including DST.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/world-clock" className="btn btn-primary">
            Open World Clock
          </Link>
          <Link href="/timezone-converter" className="btn btn-secondary">
            Time Zone Converter
          </Link>
        </div>
      </section>
    </div>
  );
}

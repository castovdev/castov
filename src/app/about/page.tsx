import type { Metadata } from "next";
import Link from "next/link";
import { StaticPage } from "@/components/static-page";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "About Castov – Free Time & Timestamp Tools | Castov",
  description:
    "Castov builds free, fast and private tools for Unix timestamps, epoch time, ISO 8601 and time zones. Learn how the tools work and what we stand for.",
  path: "/about",
});

export default function AboutPage() {
  return (
    <StaticPage
      title="About Castov"
      intro="Castov is a small set of free tools for one job: understanding and converting time."
      crumbs={[{ name: "Home", href: "/" }, { name: "About" }]}
      path="/about"
    >
      <h2>What Castov is</h2>
      <p>
        Developers, analysts and support teams constantly meet times written as long numbers or unfamiliar strings. Castov
        turns them into something readable, and back again, without a login or a wall of options. Every tool has its own page
        with a short explanation, worked examples and answers to common questions.
      </p>

      <h2>How the tools work</h2>
      <p>
        All conversions run in your browser using JavaScript and the built-in Intl time zone support. The time zone rules come
        from the IANA time zone database that ships with your browser, so daylight saving time follows the rules for the exact
        date you enter. Nothing you type is sent to a server.
      </p>


      <h2>Who builds Castov?</h2>
      <p>
        Castov is maintained by <strong>Abdelmalik Benidir</strong> and the Castov Engineering team. We are passionate about creating privacy-first, blazing fast developer tools.
      </p>
      <p>
        If you have feedback, feature requests, or need support, reach out to us directly at: 
        <a href="mailto:support@castov.com" className="font-semibold text-link ml-1 hover:underline">support@castov.com</a>
      </p>

      <h2>What we focus on</h2>
      <ul>
        <li>Correct results, including negative timestamps, leap years and daylight saving gaps.</li>
        <li>Clear, readable error messages instead of cryptic browser errors.</li>
        <li>Pages that load quickly and work well on a phone.</li>
        <li>Explanations written to be useful, not to fill space.</li>
      </ul>

      <h2>Accuracy and limits</h2>
      <p>
        Results depend on your browser&apos;s date support, so dates are limited to the years 1 to 9999. Unix time ignores leap
        seconds, as most software does. For legal, financial or safety-critical timing, verify results against an authoritative
        source.
      </p>

      <h2>Keep in touch</h2>
      <p>
        Found a bug or want a tool added? See the <Link href="/contact">contact page</Link>. New tools are added based on what
        people actually search for and use.
      </p>
    </StaticPage>
  );
}

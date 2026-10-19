import type { Metadata } from "next";
import { StaticPage } from "@/components/static-page";
import { buildMetadata } from "@/lib/seo";
import { SITE } from "@/lib/site";

export const metadata: Metadata = buildMetadata({
  title: "Contact Castov | Castov",
  description: "Get in touch with Castov to report a bug, suggest a new tool, or ask a question.",
  path: "/contact",
});

export default function ContactPage() {
  return (
    <StaticPage
      title="Contact"
      intro="Report a bug, suggest a tool or ask a question."
      crumbs={[{ name: "Home", href: "/" }, { name: "Contact" }]}
      path="/contact"
    >
      <p>
        Castov is actively maintained by <strong>Abdelmalik Benidir</strong> and the Castov Engineering team. We are always open to feedback, feature requests, or bug reports.
      </p>

      <h2>Email</h2>
      {SITE.contactEmail ? (
        <p>
          Write to <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a>. We read every message, and replies may take a few days.
        </p>
      ) : (
        <p role="note" className="rounded-lg border border-line p-3">
          Development notice: set NEXT_PUBLIC_CONTACT_EMAIL. Production builds fail without it.
        </p>
      )}

      <h2>Social & Source</h2>
      <ul>
        <li><strong>GitHub:</strong> <a href="https://github.com/castovdev/castov">github.com/castovdev/castov</a></li>
      </ul>

      <h2>What helps most</h2>
      <ul>
        <li>For a bug: the tool name, the exact value you entered, the result you expected and the result you saw.</li>
        <li>Please include your browser and device.</li>
        <li>For a new tool: what you are trying to do and what you searched for.</li>
      </ul>
    </StaticPage>
  );
}

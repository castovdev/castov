import type { Metadata } from "next";
import { Breadcrumb } from "@/components/breadcrumb";
import { buildMetadata } from "@/lib/seo";
import { WebhookTesterClient } from "./webhook-tester-client";

export const metadata: Metadata = buildMetadata({
  title: "Local Webhook Tester & Payload Inspector | Castov",
  description: "Test and inspect incoming webhooks in real-time. Catch payloads from Stripe, GitHub, or any external API locally.",
  path: "/webhook-tester",
});

export default function WebhookTesterPage() {
  return (
    <div className="layout-content max-w-5xl py-8 sm:py-12">
      <Breadcrumb
        path="/webhook-tester"
        crumbs={[{ name: "Home", href: "/" }, { name: "Tools", href: "/tools" }, { name: "Webhook Tester" }]}
      />
      <WebhookTesterClient />
    </div>
  );
}

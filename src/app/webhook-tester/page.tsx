import type { Metadata } from "next";
import { Breadcrumb } from "@/components/breadcrumb";
import { buildMetadata } from "@/lib/seo";
import { WebhookTesterClient } from "./webhook-tester-client";

export const metadata: Metadata = buildMetadata({
  title: "Webhook Simulator & Payload Inspector | Castov",
  description: "Inspect and simulate webhooks locally in your browser. Debug HMAC signatures and payloads from Stripe, GitHub, and external APIs in memory.",
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

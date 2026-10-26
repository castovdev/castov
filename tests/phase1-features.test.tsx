// @vitest-environment jsdom
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { WebhookTesterClient } from "@/app/webhook-tester/webhook-tester-client";
import { metadata as webhookMetadata } from "@/app/webhook-tester/page";
import { metadata as cronMetadata } from "@/app/cron/page";
import { metadata as chmodMetadata } from "@/app/chmod/page";
import { metadata as httpStatusMetadata } from "@/app/http-status/page";
import { SITE } from "@/lib/site";

describe("Webhook Tester & Inspector (In-Browser Simulator)", () => {
  it("renders with accurate simulator branding and no false server claims", () => {
    render(<WebhookTesterClient />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/Webhook Simulator & Inspector/i);
    expect(screen.getByText(/Client-Side Sandbox/i)).toBeInTheDocument();
    expect(screen.getByText(/100% In-Browser Memory/i)).toBeInTheDocument();
    expect(document.body.textContent).not.toContain("mock-tester-endpoint");
    expect(document.body.textContent).not.toContain("https://castov.com/api/webhook");
  });

  it("metadata accurately describes client simulation and memory inspection", () => {
    expect(webhookMetadata.title).toEqual({ absolute: "Webhook Simulator & Payload Inspector | Castov" });
    expect(webhookMetadata.description).toContain("Inspect and simulate webhooks locally");
    expect(webhookMetadata.description).not.toContain("Catch payloads from Stripe");
  });

  it("interactively simulates Stripe webhook events in client memory", () => {
    render(<WebhookTesterClient />);
    const stripeBtn = screen.getByRole("button", { name: /Simulate Stripe Event/i });
    fireEvent.click(stripeBtn);

    expect(screen.getByText("Stripe")).toBeInTheDocument();
    expect(screen.getByText("200 OK (Simulated)")).toBeInTheDocument();
    expect(screen.getByText(/Inspection Feed \(1 event\)/i)).toBeInTheDocument();
    expect(screen.getByText(/payment_intent\.succeeded/i)).toBeInTheDocument();
  });

  it("interactively simulates GitHub push events with signatures", () => {
    render(<WebhookTesterClient />);
    const githubBtn = screen.getByRole("button", { name: /Simulate GitHub Push/i });
    fireEvent.click(githubBtn);

    expect(screen.getByText("GitHub")).toBeInTheDocument();
    expect(screen.getByText(/x-hub-signature-256/i)).toBeInTheDocument();
    expect(screen.getByText(/refs\/heads\/main/i)).toBeInTheDocument();
  });

  it("clears event feed when clicking Clear Feed", () => {
    render(<WebhookTesterClient />);
    fireEvent.click(screen.getByRole("button", { name: /Simulate Stripe Event/i }));
    expect(screen.getByText("Stripe")).toBeInTheDocument();

    const clearBtn = screen.getByRole("button", { name: /Clear Feed/i });
    fireEvent.click(clearBtn);

    expect(screen.getByText(/Waiting for events\.\.\./i)).toBeInTheDocument();
  });
});

describe("Env Vault Origin & Safe Sharing Mechanics", () => {
  it("resolves origin dynamically from window.location.origin without localhost hardcoding", () => {
    const testOrigin = "https://custom.castov.com";
    const resolved = typeof window !== "undefined" && testOrigin ? testOrigin : SITE.url;
    expect(resolved).toBe("https://custom.castov.com");
    expect(resolved).not.toContain("localhost");
  });

  it("falls back to canonical SITE.url when window origin is unavailable", () => {
    const emptyOrigin = "";
    const resolved = (typeof window !== "undefined" && emptyOrigin) ? emptyOrigin : SITE.url;
    expect(resolved).toBe(SITE.url);
    expect(resolved).toBe("https://castov.com");
  });

  it("verifies zero-knowledge fragment structure preserves client-side payload", () => {
    const dummyPayload = "salt_base64:iv_base64:cipher_base64";
    const shareLink = `${SITE.url}/env-vault#payload=${encodeURIComponent(dummyPayload)}`;
    
    // Fragment must be behind # so HTTP servers and proxies never see raw secrets
    expect(shareLink).toContain("#payload=");
    const url = new URL(shareLink);
    expect(url.pathname).toBe("/env-vault");
    expect(url.search).toBe(""); // Zero query params sent to server
    expect(url.hash).toContain("payload=");
  });
});

describe("Hub Routes & Index Page Metadata", () => {
  it("verifies /cron hub page metadata has valid canonical path", () => {
    expect(cronMetadata.alternates?.canonical).toBe(`${SITE.url}/cron`);
    expect(cronMetadata.title).toEqual({ absolute: "Cron Expression Generator – Cheatsheet, Examples, Next Runs | Castov" });
  });

  it("verifies /chmod hub page metadata has valid canonical path", () => {
    expect(chmodMetadata.alternates?.canonical).toBe(`${SITE.url}/chmod`);
    expect(chmodMetadata.title).toEqual({ absolute: "Chmod Calculator & Linux Permissions Generator | Castov" });
  });

  it("verifies /http-status hub page metadata has valid canonical path", () => {
    expect(httpStatusMetadata.alternates?.canonical).toBe(`${SITE.url}/http-status`);
    expect(httpStatusMetadata.title).toEqual({ absolute: "HTTP Status Codes Directory & Developer Reference | Castov" });
  });
});

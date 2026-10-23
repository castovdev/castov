"use client";

import { useState } from "react";
import { Webhook, Activity, Copy, Check, RefreshCw, ShieldCheck, ExternalLink } from "lucide-react";

export function WebhookTesterClient() {
  const [copied, setCopied] = useState(false);
  const [requests, setRequests] = useState<any[]>([]);
  const sandboxId = "client-sandbox-" + (typeof window !== "undefined" ? window.location.hostname : "castov");

  const copySandboxInfo = () => {
    navigator.clipboard.writeText("In-Browser Webhook Sandbox: " + sandboxId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const simulateStripeEvent = () => {
    const payload = {
      id: "evt_" + Math.random().toString(36).substring(2, 11),
      type: "payment_intent.succeeded",
      created: Math.floor(Date.now() / 1000),
      data: {
        object: {
          id: "pi_" + Math.random().toString(36).substring(2, 11),
          amount: 4900,
          currency: "usd",
          status: "succeeded",
          customer: "cus_" + Math.random().toString(36).substring(2, 9),
        },
      },
    };

    setRequests((prev) => [
      {
        provider: "Stripe",
        timestamp: new Date().toISOString(),
        method: "POST",
        headers: {
          "content-type": "application/json",
          "user-agent": "Stripe/1.0 (+https://stripe.com/docs/webhooks)",
          "stripe-signature": "t=" + Math.floor(Date.now() / 1000) + ",v1=" + Array.from(crypto.getRandomValues(new Uint8Array(16))).map(b => b.toString(16).padStart(2, '0')).join(''),
        },
        body: payload,
      },
      ...prev,
    ]);
  };

  const simulateGitHubEvent = () => {
    const payload = {
      ref: "refs/heads/main",
      before: "a1b2c3d4e5f6",
      after: "f6e5d4c3b2a1",
      repository: {
        name: "castov",
        full_name: "castovdev/castov",
        private: false,
      },
      pusher: {
        name: "developer",
        email: "dev@castov.com",
      },
      commits: [
        {
          id: "f6e5d4c3b2a1",
          message: "fix(security): sanitize webhook receiver headers and payload",
          timestamp: new Date().toISOString(),
        },
      ],
    };

    setRequests((prev) => [
      {
        provider: "GitHub",
        timestamp: new Date().toISOString(),
        method: "POST",
        headers: {
          "content-type": "application/json",
          "user-agent": "GitHub-Hookshot/1a2b3c4",
          "x-github-event": "push",
          "x-hub-signature-256": "sha256=" + Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b => b.toString(16).padStart(2, '0')).join(''),
        },
        body: payload,
      },
      ...prev,
    ]);
  };

  const clearAll = () => setRequests([]);

  return (
    <div>
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight text-fg mb-4">
          Webhook Simulator & Inspector{" "}
          <span className="text-accent text-sm align-middle ml-2 bg-accent/10 border border-accent/20 px-2.5 py-1 rounded-full font-mono font-medium">
            Client-Side Sandbox
          </span>
        </h1>
        <p className="text-lg text-muted max-w-2xl mx-auto mb-6">
          Interactive client-side webhook emulator. Inspect headers, HMAC signatures, and payloads
          in memory with zero server storage and complete privacy.
        </p>

        <div className="max-w-2xl mx-auto mb-6 bg-card border border-line rounded-xl p-4 shadow-sm text-left">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-muted">
              <ShieldCheck className="w-4 h-4 text-success shrink-0" />
              <span>Sandbox Mode: <strong className="text-fg font-mono">100% In-Browser Memory</strong></span>
            </div>
            <button
              onClick={copySandboxInfo}
              className="btn btn-secondary btn-sm flex items-center gap-1.5 text-xs"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copied" : "Copy Status"}
            </button>
          </div>
          <p className="text-xs text-muted mt-2">
            Need to catch live external webhooks on your localhost? Use our official{" "}
            <a
              href="https://marketplace.visualstudio.com/items?itemName=Castov.webhook-catcher-castov"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline inline-flex items-center gap-0.5"
            >
              Webhook Catcher VS Code Extension <ExternalLink className="w-3 h-3" />
            </a>.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          <button
            onClick={simulateStripeEvent}
            className="btn btn-primary btn-sm flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Simulate Stripe Event
          </button>
          <button
            onClick={simulateGitHubEvent}
            className="btn btn-secondary btn-sm flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Simulate GitHub Push
          </button>
          {requests.length > 0 && (
            <button
              onClick={clearAll}
              className="btn btn-secondary btn-sm text-muted hover:text-fg"
            >
              Clear Feed
            </button>
          )}
        </div>
      </div>

      <div className="border border-line rounded-xl bg-card overflow-hidden shadow-sm">
        <div className="p-4 border-b border-line flex items-center justify-between bg-field">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Activity className="w-4 h-4 text-accent" />
            Inspection Feed ({requests.length} {requests.length === 1 ? "event" : "events"})
          </div>
          <span className="text-xs text-muted font-mono">
            {requests.length > 0 ? "Real-time client log" : "Awaiting events"}
          </span>
        </div>

        {requests.length === 0 ? (
          <div className="p-12 text-center text-muted">
            <Webhook className="w-12 h-12 mx-auto mb-4 opacity-40 animate-pulse" />
            <p className="font-semibold text-fg">Waiting for events...</p>
            <p className="text-sm mt-1">
              Click &quot;Simulate Stripe Event&quot; or &quot;Simulate GitHub Push&quot; above to inspect sample signatures and JSON payloads.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-line">
            {requests.map((req, i) => (
              <div key={i} className="p-4 hover:bg-hover transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold text-success bg-success/10 px-2 py-0.5 rounded">
                      {req.method}
                    </span>
                    <span className="text-xs font-medium text-fg bg-line px-2 py-0.5 rounded">
                      {req.provider}
                    </span>
                    <span className="font-mono text-xs text-muted">
                      {req.timestamp}
                    </span>
                  </div>
                  <span className="text-xs bg-line px-2 py-0.5 rounded text-fg font-mono">
                    200 OK (Simulated)
                  </span>
                </div>

                <div className="mt-3 grid md:grid-cols-2 gap-4 text-xs font-mono">
                  <div className="bg-field p-3 rounded-lg border border-line">
                    <span className="text-muted block mb-1 font-sans font-bold">Headers & Signatures:</span>
                    <pre className="overflow-x-auto text-fg">
                      {JSON.stringify(req.headers, null, 2)}
                    </pre>
                  </div>
                  <div className="bg-field p-3 rounded-lg border border-line">
                    <span className="text-muted block mb-1 font-sans font-bold">Payload Body:</span>
                    <pre className="overflow-x-auto text-fg">
                      {JSON.stringify(req.body, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

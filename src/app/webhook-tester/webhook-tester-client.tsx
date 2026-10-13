"use client";

import { useState } from "react";
import { Webhook, Activity, Copy, Check, RefreshCw } from "lucide-react";

export function WebhookTesterClient() {
  const [copied, setCopied] = useState(false);
  const [requests, setRequests] = useState<any[]>([]);
  const url = "https://castov.com/api/webhook/mock-tester-endpoint";

  const copyUrl = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const simulateWebhook = () => {
    const payload = {
      id: "evt_" + Math.random().toString(36).substring(2, 11),
      type: "payment_intent.succeeded",
      created: Math.floor(Date.now() / 1000),
      data: {
        object: {
          id: "pi_" + Math.random().toString(36).substring(2, 11),
          amount: 2000,
          currency: "usd",
          status: "succeeded"
        }
      }
    };

    setRequests(prev => [{
      timestamp: new Date().toISOString(),
      method: "POST",
      headers: {
        "content-type": "application/json",
        "user-agent": "Stripe/1.0 (+https://stripe.com/docs/webhooks)",
        "stripe-signature": "t=" + Math.floor(Date.now() / 1000) + ",v1=mock_signature"
      },
      body: payload
    }, ...prev]);
  };

  const clearAll = () => setRequests([]);

  return (
    <div>
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight text-fg mb-4">
          Local Webhook Tester <span className="text-accent text-lg align-top ml-2 bg-accent/10 px-2 py-0.5 rounded-full">Interactive Demo</span>
        </h1>
        <p className="text-lg text-muted max-w-2xl mx-auto mb-8">
          Generate a temporary endpoint to catch and inspect incoming webhooks in real-time. 
          Perfect for testing Stripe, GitHub, or any external API.
        </p>
        
        <div className="max-w-2xl mx-auto flex items-center bg-card border border-line rounded-xl p-2 pl-4 shadow-sm">
          <input 
            type="text" 
            readOnly 
            aria-label="Webhook Test Endpoint URL"
            value={url} 
            className="flex-1 bg-transparent font-mono text-sm text-fg outline-none"
          />
          <button 
            onClick={copyUrl} 
            className="btn btn-secondary btn-sm flex items-center gap-2 ml-2"
          >
            {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
            {copied ? "Copied" : "Copy URL"}
          </button>
        </div>

        <div className="mt-4 flex justify-center gap-4">
          <button 
            onClick={simulateWebhook}
            className="btn btn-primary btn-sm flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Simulate Test Event
          </button>
          {requests.length > 0 && (
            <button 
              onClick={clearAll}
              className="btn btn-secondary btn-sm text-muted hover:text-fg"
            >
              Clear Logs
            </button>
          )}
        </div>
      </div>

      <div className="border border-line rounded-xl bg-card overflow-hidden shadow-sm">
        <div className="p-4 border-b border-line flex items-center justify-between bg-field">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Activity className="w-4 h-4 text-accent" />
            Live Requests Feed
          </div>
          <span className="text-xs text-muted font-mono">
            {requests.length} events logged
          </span>
        </div>

        {requests.length === 0 ? (
          <div className="p-12 text-center text-muted">
            <Webhook className="w-12 h-12 mx-auto mb-4 opacity-40 animate-pulse" />
            <p className="font-semibold text-fg">Waiting for events...</p>
            <p className="text-sm mt-1">Send a POST request to the URL above, or click Simulate Test Event.</p>
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
                    <span className="font-mono text-xs text-muted">
                      {req.timestamp}
                    </span>
                  </div>
                  <span className="text-xs bg-line px-2 py-0.5 rounded text-fg font-mono">
                    200 OK
                  </span>
                </div>

                <div className="mt-3 grid md:grid-cols-2 gap-4 text-xs font-mono">
                  <div className="bg-field p-3 rounded-lg border border-line">
                    <span className="text-muted block mb-1 font-sans font-bold">Headers:</span>
                    <pre className="overflow-x-auto text-fg">
                      {JSON.stringify(req.headers, null, 2)}
                    </pre>
                  </div>
                  <div className="bg-field p-3 rounded-lg border border-line">
                    <span className="text-muted block mb-1 font-sans font-bold">Payload:</span>
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

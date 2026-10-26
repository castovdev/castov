"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ShieldCheck,
  Flame,
  Copy,
  Check,
  Terminal,
  Lock,
  ArrowRight,
  AlertTriangle,
  Key,
} from "lucide-react";
import { decryptSharedSecret } from "@/lib/secret-crypto";

export default function SharedSecretPage() {
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : "";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [decryptedText, setDecryptedText] = useState<string | null>(null);
  const [isBurned, setIsBurned] = useState(false);
  const [copied, setCopied] = useState(false);
  const [manualKey, setManualKey] = useState("");
  const [needsManualKey, setNeedsManualKey] = useState(false);

  useEffect(() => {
    if (!id) return;

    let hashKey = "";
    if (typeof window !== "undefined") {
      const hash = window.location.hash.replace(/^#/, "");
      const searchParams = new URLSearchParams(hash);
      hashKey = searchParams.get("key") || hash;
    }

    if (!hashKey) {
      setNeedsManualKey(true);
      setLoading(false);
      return;
    }

    fetchAndDecrypt(hashKey);
  }, [id]);

  async function fetchAndDecrypt(key: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/share-secret?id=${encodeURIComponent(id)}`);
      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Secret not found or expired.");
      }

      setIsBurned(Boolean(data.isBurned));

      // Decrypt locally in browser using WebCrypto AES-GCM
      const plain = await decryptSharedSecret(data.ciphertext, data.iv, key);
      setDecryptedText(plain);
    } catch (err: any) {
      setError(err?.message || "Failed to retrieve or decrypt secret.");
    } finally {
      setLoading(false);
    }
  }

  const handleManualDecrypt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualKey.trim()) return;
    fetchAndDecrypt(manualKey.trim());
  };

  const handleCopy = async () => {
    if (!decryptedText) return;
    await navigator.clipboard.writeText(decryptedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="layout-content max-w-3xl py-12 sm:py-20 min-h-[75vh] flex flex-col justify-center">
      {/* Brand Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-xs font-mono text-accent mb-4 shadow-xs">
          <Lock className="w-3.5 h-3.5" />
          <span>Castov Zero-Knowledge Secret Share</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-fg">
          End-to-End Encrypted Secret
        </h1>
        <p className="text-sm text-muted mt-2 max-w-lg mx-auto">
          Decrypted 100% locally in your browser. The decryption key was retrieved from the URL hash and never touched our servers.
        </p>
      </div>

      {/* Main Secret Card */}
      <div className="rounded-3xl border border-line bg-card p-6 sm:p-8 shadow-xl relative overflow-hidden">
        {loading && (
          <div className="py-16 text-center space-y-3">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
            <p className="text-xs font-mono text-muted">Retrieving &amp; decrypting payload locally...</p>
          </div>
        )}

        {error && (
          <div className="py-12 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-fg">Secret Unavailable</h2>
              <p className="text-xs text-muted mt-1 max-w-md mx-auto">{error}</p>
            </div>
            <Link
              href="/env-vault"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-field border border-line text-xs font-semibold text-fg hover:bg-hover transition-colors shadow-xs"
            >
              <span>Create a New Encrypted Secret</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {needsManualKey && !decryptedText && !loading && !error && (
          <form onSubmit={handleManualDecrypt} className="space-y-4 py-6 max-w-md mx-auto">
            <div className="text-center space-y-1 mb-4">
              <Key className="w-8 h-8 text-accent mx-auto" />
              <h2 className="text-sm font-bold text-fg">Decryption Key Required</h2>
              <p className="text-xs text-muted">
                The URL did not contain the decryption key in the hash fragment. Please enter the key provided by the sender:
              </p>
            </div>
            <input
              type="text"
              placeholder="Paste Base64URL Decryption Key..."
              value={manualKey}
              onChange={(e) => setManualKey(e.target.value)}
              className="w-full font-mono text-xs px-3.5 py-2.5 rounded-xl bg-field border border-line text-fg focus:border-accent focus:outline-none"
              required
            />
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-accent text-accent-fg text-xs font-bold hover:bg-accent-hover transition-colors shadow-xs flex items-center justify-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Decrypt Secret</span>
            </button>
          </form>
        )}

        {decryptedText && !loading && (
          <div className="space-y-5 animate-in fade-in">
            {/* Status pill */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-line">
              <div className="flex items-center gap-2">
                {isBurned ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-mono font-semibold">
                    <Flame className="w-3.5 h-3.5" />
                    <span>Burned After Reading (Purged from Server)</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Decrypted Securely</span>
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent text-accent-fg text-xs font-bold hover:bg-accent-hover transition-colors shadow-sm cursor-pointer ml-auto"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Secret Copied!" : "Copy Secret"}</span>
              </button>
            </div>

            {/* Secret Content Output */}
            <div className="relative">
              <pre className="p-4 sm:p-5 rounded-2xl bg-field border border-line font-mono text-xs sm:text-sm text-fg overflow-x-auto select-all leading-relaxed max-h-96 whitespace-pre">
                {decryptedText}
              </pre>
            </div>

            {isBurned && (
              <p className="text-[11px] font-mono text-muted flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>Notice: If you refresh this page or close this tab, this secret cannot be viewed again.</span>
              </p>
            )}
          </div>
        )}
      </div>

      {/* VIRAL LOOP CARD: Powered by Castov */}
      <div className="mt-8 rounded-2xl border border-line bg-card/60 backdrop-blur-md p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <p className="text-xs font-bold text-fg">
                Zero-Knowledge Developer Tooling by Castov
              </p>
            </div>
            <p className="text-xs text-muted leading-relaxed">
              Share encrypted environment variables, tokens, and secrets with your team without leaving plaintext traces in Slack, Teams, or email.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <Link
              href="/env-vault"
              className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-accent text-accent-fg text-xs font-bold hover:bg-accent-hover transition-colors shadow-xs"
            >
              <span>Create Secret Link</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
            <Link
              href="/cli"
              className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-field border border-line text-xs font-mono font-medium text-fg hover:bg-hover transition-colors"
            >
              <Terminal className="w-3 h-3 text-emerald-400" />
              <span>npx castov</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

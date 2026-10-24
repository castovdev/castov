"use client";

import React, { useState, useEffect } from "react";
import {
  Lock,
  Unlock,
  Key,
  ShieldCheck,
  Plus,
  Trash2,
  Copy,
  Check,
  Terminal,
  Eye,
  EyeOff,
  AlertCircle,
} from "lucide-react";
import { encryptEnvVault, decryptEnvVault, type EncryptedVaultPayload } from "@/lib/vault-crypto";

interface VaultItem {
  id: string;
  slug: string;
  name: string;
  ciphertext: string;
  iv: string;
  salt: string;
  createdAt: number;
  updatedAt: number;
}

export function DashboardEnvVault() {
  const [vaults, setVaults] = useState<VaultItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New Vault form
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [plaintext, setPlaintext] = useState("");
  const [passphrase, setPassphrase] = useState("");
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [encrypting, setEncrypting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Decryption modal / state
  const [decryptingSlug, setDecryptingSlug] = useState<string | null>(null);
  const [decryptPassphrase, setDecryptPassphrase] = useState("");
  const [decryptedContent, setDecryptedContent] = useState<string | null>(null);
  const [decryptError, setDecryptError] = useState<string | null>(null);
  const [isDecryptingLocal, setIsDecryptingLocal] = useState(false);

  // Copy states
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchVaults();
  }, []);

  async function fetchVaults() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/vault");
      const data = await res.json();
      if (data.ok && Array.isArray(data.vaults)) {
        setVaults(data.vaults);
      } else {
        setVaults([]);
      }
    } catch {
      setError("Failed to load environment vaults.");
    } finally {
      setLoading(false);
    }
  }

  const handleNameChange = (val: string) => {
    setName(val);
    if (!slug || slug === name.toLowerCase().replace(/[^a-z0-9_-]/g, "-")) {
      setSlug(
        val
          .toLowerCase()
          .replace(/[^a-z0-9_-]/g, "-")
          .replace(/^-+|-+$/g, "")
      );
    }
  };

  const handleCreateVault = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanSlug = slug.trim().toLowerCase();
    if (!cleanSlug) {
      setFormError("Vault slug is required (e.g. 'prod-api' or 'staging').");
      return;
    }
    if (!plaintext.trim()) {
      setFormError("Environment variables content cannot be empty.");
      return;
    }
    if (!passphrase || passphrase.length < 6) {
      setFormError("Passphrase must be at least 6 characters for strong encryption.");
      return;
    }

    setEncrypting(true);
    try {
      // 1. 100% Client-side WebCrypto encryption (zero plain secrets sent over network)
      const encrypted = await encryptEnvVault(plaintext, passphrase);

      // 2. Transmit only ciphertext, iv, and salt
      const res = await fetch("/api/vault", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: cleanSlug,
          name: name.trim() || cleanSlug,
          ciphertext: encrypted.ciphertext,
          iv: encrypted.iv,
          salt: encrypted.salt,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to save encrypted vault.");
      }

      // Reset form
      setName("");
      setSlug("");
      setPlaintext("");
      setPassphrase("");
      setIsCreating(false);
      await fetchVaults();
    } catch (err: any) {
      setFormError(err.message || "Encryption error occurred.");
    } finally {
      setEncrypting(false);
    }
  };

  const handleDecrypt = async (vault: VaultItem) => {
    setDecryptError(null);
    setIsDecryptingLocal(true);
    try {
      const payload: EncryptedVaultPayload = {
        ciphertext: vault.ciphertext,
        iv: vault.iv,
        salt: vault.salt,
      };
      const plain = await decryptEnvVault(payload, decryptPassphrase);
      setDecryptedContent(plain);
    } catch (err: any) {
      setDecryptError(err.message || "Decryption failed. Incorrect passphrase.");
    } finally {
      setIsDecryptingLocal(false);
    }
  };

  const handleDelete = async (vaultSlug: string) => {
    if (!confirm(`Are you sure you want to delete vault "${vaultSlug}"? This cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/vault?slug=${encodeURIComponent(vaultSlug)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setVaults((prev) => prev.filter((v) => v.slug !== vaultSlug));
        if (decryptingSlug === vaultSlug) {
          setDecryptingSlug(null);
          setDecryptedContent(null);
        }
      }
    } catch {
      alert("Failed to delete vault.");
    }
  };

  const copyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="rounded-2xl border border-line bg-card p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 shrink-0">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-fg">Zero-Knowledge Env Vault</h2>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-mono font-semibold text-emerald-400">
                  <ShieldCheck className="w-3 h-3" />
                  <span>100% Client-Side E2EE</span>
                </span>
              </div>
              <p className="text-xs sm:text-sm text-muted mt-1 leading-relaxed">
                All .env files are encrypted with <span className="font-mono text-fg">AES-256-GCM</span> directly in your browser.
                Plaintext and passphrases are never transmitted or stored on Castov servers.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setIsCreating(!isCreating);
              setFormError(null);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-accent text-accent-fg text-xs font-bold hover:bg-accent-hover transition-colors shadow-sm shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{isCreating ? "Cancel" : "New Env Vault"}</span>
          </button>
        </div>
      </div>

      {/* Creation Modal / Inline Form */}
      {isCreating && (
        <form
          onSubmit={handleCreateVault}
          className="rounded-2xl border border-accent/40 bg-card p-6 shadow-md space-y-5 animate-in fade-in slide-in-from-top-2"
        >
          <div className="flex items-center justify-between border-b border-line pb-3">
            <h3 className="font-bold text-fg text-base flex items-center gap-2">
              <Key className="w-4 h-4 text-accent" />
              <span>Encrypt &amp; Store New Environment Vault</span>
            </h3>
            <span className="text-xs font-mono text-muted">Zero-Knowledge Payload</span>
          </div>

          {formError && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1.5">
                Vault Name
              </label>
              <input
                type="text"
                placeholder="e.g. Production API"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-field border border-line text-sm text-fg focus:border-accent focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1.5">
                CLI Slug (Identifier)
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. prod-api"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "-"))}
                  className="w-full font-mono px-3.5 py-2.5 rounded-xl bg-field border border-line text-sm text-fg focus:border-accent focus:outline-none"
                  required
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1.5">
              Environment Variables (.env content)
            </label>
            <textarea
              rows={5}
              placeholder="DATABASE_URL=postgres://...&#10;API_SECRET=cst_...&#10;STRIPE_KEY=sk_live_..."
              value={plaintext}
              onChange={(e) => setPlaintext(e.target.value)}
              className="w-full font-mono text-xs sm:text-sm px-3.5 py-2.5 rounded-xl bg-field border border-line text-fg focus:border-accent focus:outline-none resize-y"
              required
            />
            <p className="text-[11px] font-mono text-muted mt-1">
              Plaintext remains in client memory only. Encrypted via WebCrypto AES-256-GCM before dispatch.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1.5">
              Vault Passphrase (Secret Key)
            </label>
            <div className="relative">
              <input
                type={showPassphrase ? "text" : "password"}
                placeholder="Enter a strong passphrase to encrypt this vault..."
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                className="w-full font-mono px-3.5 py-2.5 pr-10 rounded-xl bg-field border border-line text-sm text-fg focus:border-accent focus:outline-none"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassphrase(!showPassphrase)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-fg"
              >
                {showPassphrase ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-amber-400 mt-1 flex items-center gap-1 font-mono">
              <AlertCircle className="w-3 h-3 shrink-0" />
              <span>Remember this passphrase! If lost, neither Castov nor anyone else can recover your secrets.</span>
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-4 py-2 rounded-xl bg-field border border-line text-xs font-semibold text-muted hover:text-fg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={encrypting}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition-colors shadow-sm disabled:opacity-50"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{encrypting ? "Encrypting Locally..." : "Encrypt & Sync to Cloud"}</span>
            </button>
          </div>
        </form>
      )}

      {/* Vaults List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-accent" />
            <span>Encrypted Vaults ({vaults.length})</span>
          </h3>
          <span className="text-xs font-mono text-muted">CLI: castov vault pull &lt;slug&gt;</span>
        </div>

        {loading ? (
          <div className="p-8 text-center rounded-2xl border border-line bg-card/50">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
            <p className="mt-2 text-xs font-mono text-muted">Loading encrypted vaults...</p>
          </div>
        ) : error ? (
          <div className="p-4 rounded-2xl border border-red-500/30 bg-red-500/10 text-xs text-red-400">
            {error}
          </div>
        ) : vaults.length === 0 ? (
          <div className="p-8 text-center rounded-2xl border border-dashed border-line bg-card/30">
            <Lock className="w-8 h-8 text-muted mx-auto mb-2 opacity-50" />
            <p className="text-sm font-semibold text-fg">No encrypted vaults yet</p>
            <p className="text-xs text-muted mt-1 max-w-sm mx-auto">
              Store your sensitive environment variables securely with zero-knowledge encryption and pull them straight into your local directory with Castov CLI.
            </p>
            <button
              type="button"
              onClick={() => setIsCreating(true)}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent text-accent-fg text-xs font-bold hover:bg-accent-hover transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create First Vault</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {vaults.map((vault) => {
              const isSelected = decryptingSlug === vault.slug;
              const cliPullCmd = `castov vault pull ${vault.slug}`;

              return (
                <div
                  key={vault.id || vault.slug}
                  className="rounded-2xl border border-line bg-card p-5 shadow-xs transition-all hover:border-line-focus space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 font-mono text-xs font-bold shrink-0">
                        .env
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-fg text-sm">{vault.name}</h4>
                          <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-field border border-line text-accent">
                            {vault.slug}
                          </span>
                        </div>
                        <p className="text-[11px] font-mono text-muted mt-0.5">
                          Updated {new Date(vault.updatedAt || vault.createdAt).toLocaleDateString()} • Ciphertext: {vault.ciphertext.slice(0, 16)}...
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setDecryptingSlug(null);
                            setDecryptedContent(null);
                          } else {
                            setDecryptingSlug(vault.slug);
                            setDecryptedContent(null);
                            setDecryptPassphrase("");
                            setDecryptError(null);
                          }
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-field border border-line text-xs font-semibold text-fg hover:bg-hover transition-colors"
                      >
                        {isSelected ? <EyeOff className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5 text-accent" />}
                        <span>{isSelected ? "Hide" : "Decrypt in Browser"}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => copyText(`cli-${vault.slug}`, cliPullCmd)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-field border border-line text-xs font-mono font-medium text-muted hover:text-fg hover:bg-hover transition-colors"
                        title="Copy CLI Pull Command"
                      >
                        {copiedId === `cli-${vault.slug}` ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Terminal className="w-3.5 h-3.5 text-accent" />
                        )}
                        <span>{copiedId === `cli-${vault.slug}` ? "Copied!" : cliPullCmd}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(vault.slug)}
                        className="p-1.5 rounded-lg text-muted hover:text-danger hover:bg-field transition-colors"
                        title="Delete Vault"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Inline Decryption Panel */}
                  {isSelected && (
                    <div className="pt-3 border-t border-line/50 space-y-3 animate-in fade-in">
                      {!decryptedContent ? (
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                          <input
                            type="password"
                            placeholder="Enter your vault passphrase..."
                            value={decryptPassphrase}
                            onChange={(e) => setDecryptPassphrase(e.target.value)}
                            className="flex-1 font-mono text-xs px-3.5 py-2 rounded-xl bg-field border border-line text-fg focus:border-accent focus:outline-none"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleDecrypt(vault);
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => handleDecrypt(vault)}
                            disabled={isDecryptingLocal || !decryptPassphrase}
                            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-accent text-accent-fg text-xs font-bold hover:bg-accent-hover transition-colors disabled:opacity-50"
                          >
                            <Unlock className="w-3.5 h-3.5" />
                            <span>{isDecryptingLocal ? "Decrypting..." : "Decrypt"}</span>
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-mono font-semibold text-emerald-400 flex items-center gap-1">
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>Decrypted Successfully (Local WebCrypto)</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => copyText(`plain-${vault.slug}`, decryptedContent)}
                              className="inline-flex items-center gap-1 text-xs font-mono text-muted hover:text-fg"
                            >
                              {copiedId === `plain-${vault.slug}` ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                              <span>Copy Plaintext</span>
                            </button>
                          </div>
                          <pre className="p-3.5 rounded-xl bg-field border border-line font-mono text-xs text-fg overflow-x-auto select-all max-h-48">
                            {decryptedContent}
                          </pre>
                        </div>
                      )}

                      {decryptError && (
                        <p className="text-xs text-red-400 font-mono">{decryptError}</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

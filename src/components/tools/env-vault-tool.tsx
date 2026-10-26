"use client";

import { useState } from "react";
import { LockIcon, UnlockIcon, CopyIcon, LinkIcon } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { SITE } from "@/lib/site";

// WebCrypto AES-GCM Helpers
const generateKey = async (password: string, salt: Uint8Array) => {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey("raw", enc.encode(password), { name: "PBKDF2" }, false, ["deriveBits", "deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: salt as any, iterations: 100000, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
};

const arrayBufferToBase64 = (buffer: ArrayBuffer) => btoa(String.fromCharCode(...new Uint8Array(buffer)));
const base64ToArrayBuffer = (base64: string) => Uint8Array.from(atob(base64), c => c.charCodeAt(0));

export function EnvVaultTool() {
  const [tab, setTab] = useState<"personal" | "team">("personal");
  const [mode, setMode] = useState<"encrypt" | "decrypt">("encrypt");
  
  // Encrypt State
  const [rawEnv, setRawEnv] = useState("DB_PASS=supersecret\nAPI_KEY=xyz");
  const [encPassword, setEncPassword] = useState("");
  const [encryptedLink, setEncryptedLink] = useState("");
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [encryptError, setEncryptError] = useState("");

  // Decrypt State
  const [vaultId, setVaultId] = useState("");
  const [decPassword, setDecPassword] = useState("");
  const [decryptedEnv, setDecryptedEnv] = useState("");
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [decryptError, setDecryptError] = useState("");

  // Auto-detect payload from URL on mount
  useState(() => {
    if (typeof window === "undefined") return;
    try {
      const url = new URL(window.location.href);
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const p = hashParams.get("payload") || url.searchParams.get("payload") || url.searchParams.get("id");
      if (p) {
        setMode("decrypt");
        setVaultId(p);
      }
    } catch {
      // ignore
    }
  });

  const MAX_ENV_SIZE_BYTES = 64 * 1024; // 64 KB

  const handleEncrypt = async () => {
    if (!encPassword || !rawEnv) return;
    setEncryptError("");
    setEncryptedLink("");

    if (new TextEncoder().encode(rawEnv).length > MAX_ENV_SIZE_BYTES) {
      setEncryptError("Payload exceeds the maximum allowed size (64 KB). Please reduce your environment content.");
      return;
    }

    setIsEncrypting(true);
    try {
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const key = await generateKey(encPassword, salt);
      
      const enc = new TextEncoder();
      const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, enc.encode(rawEnv));
      
      const payloadBase64 = arrayBufferToBase64(salt.buffer as ArrayBuffer) + ":" + arrayBufferToBase64(iv.buffer as ArrayBuffer) + ":" + arrayBufferToBase64(ciphertext);
      const origin = typeof window !== "undefined" && window.location.origin ? window.location.origin : SITE.url;
      
      // Zero-Knowledge client hash link (100% serverless, zero storage risk)
      const zeroKnowledgeLink = `${origin}/env-vault#payload=${encodeURIComponent(payloadBase64)}`;
      
      // Also try saving to Supabase if configured for short links
      try {
        const clientVaultId = crypto.randomUUID();
        const supabase = createClient();
        let insertErr: unknown = null;
        const { error: sharedErr } = await supabase.from('shared_env_vaults').insert([{ id: clientVaultId, encrypted_payload: payloadBase64 }]);
        if (sharedErr) {
          const { error: legacyErr } = await supabase.from('env_vaults').insert([{ id: clientVaultId, encrypted_payload: payloadBase64 }]);
          insertErr = legacyErr;
        }
        if (!insertErr) {
          setEncryptedLink(`${origin}/env-vault?id=${clientVaultId}`);
        } else {
          setEncryptedLink(zeroKnowledgeLink);
        }
      } catch {
        setEncryptedLink(zeroKnowledgeLink);
      }
    } catch (e: any) {
      console.error(e);
      setEncryptError(e?.message || "Encryption failed. Please check your inputs.");
    }
    setIsEncrypting(false);
  };

  const handleDecrypt = async () => {
    if (!decPassword || !vaultId) return;
    setIsDecrypting(true);
    setDecryptError("");
    setDecryptedEnv("");
    try {
      let payloadBase64 = vaultId.trim();

      // If user pasted a URL, extract parameter, hash, or ID
      if (payloadBase64.includes("http://") || payloadBase64.includes("https://")) {
        try {
          const parsed = new URL(payloadBase64);
          const hashP = new URLSearchParams(parsed.hash.replace(/^#/, "")).get("payload");
          const p = parsed.searchParams.get("payload");
          const id = parsed.searchParams.get("id");
          if (hashP) payloadBase64 = hashP;
          else if (p) payloadBase64 = p;
          else if (id) payloadBase64 = id;
        } catch {
          // ignore URL parse failure
        }
      }

      // Check if input is a UUID (vault ID in Supabase)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(payloadBase64)) {
        const supabase = createClient();
        let data: string | null = null;
        let error: unknown = null;
        const { data: sharedData, error: sharedErr } = await supabase.rpc('get_shared_env_vault_payload', { target_id: payloadBase64 });
        if (!sharedErr && sharedData) {
          data = sharedData;
        } else {
          const { data: legacyData, error: legacyErr } = await supabase.rpc('get_env_vault_payload', { target_id: payloadBase64 });
          data = legacyData;
          error = legacyErr;
        }
        if (error || !data) {
          throw new Error("Vault not found or expired.");
        }
        payloadBase64 = data;
      }
      
      const parts = payloadBase64.split(":");
      if (parts.length !== 3) throw new Error("Invalid payload format");
      
      const salt = base64ToArrayBuffer(parts[0]);
      const iv = base64ToArrayBuffer(parts[1]);
      const ciphertext = base64ToArrayBuffer(parts[2]);
      
      const key = await generateKey(decPassword, salt);
      const decryptedBuffer = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
      
      const dec = new TextDecoder();
      setDecryptedEnv(dec.decode(decryptedBuffer));
    } catch (e: any) {
      setDecryptError(e?.message === "Vault not found or expired." ? e.message : "Decryption failed. Wrong password or corrupted payload.");
    }
    setIsDecrypting(false);
  };

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-8">
      {/* High-End Tab Switcher */}
      <div className="flex bg-card p-1.5 rounded-xl w-fit mx-auto border border-line shadow-sm">
        <button 
          className={`px-8 py-2.5 rounded-lg text-sm font-bold tracking-wide transition-all ${tab === "personal" ? "bg-primary text-white dark:text-[#050505] shadow-md" : "text-muted hover:text-fg"}`} 
          onClick={() => setTab("personal")}
        >
          Personal Vault
        </button>
        <button 
          className={`px-8 py-2.5 rounded-lg text-sm font-bold tracking-wide transition-all ${tab === "team" ? "bg-primary text-white dark:text-[#050505] shadow-md" : "text-muted hover:text-fg"}`} 
          onClick={() => setTab("team")}
        >
          Team Vaults <span className="ml-2 bg-indigo-500/10 text-indigo-500 px-1.5 py-0.5 rounded text-[10px] uppercase">Beta</span>
        </button>
      </div>

      {tab === "personal" && (
        <div className="flex flex-col gap-6">
          <div className="flex bg-card p-1 rounded-lg w-fit border border-line mx-auto shadow-sm">
            <button className={`px-6 py-2 rounded-md text-xs font-semibold transition-colors uppercase tracking-wider ${mode === "encrypt" ? "bg-field text-fg border border-line" : "text-muted hover:text-fg"}`} onClick={() => setMode("encrypt")}>
              <LockIcon size={14} className="inline mr-2" /> Encrypt
            </button>
            <button className={`px-6 py-2 rounded-md text-xs font-semibold transition-colors uppercase tracking-wider ${mode === "decrypt" ? "bg-success/10 text-success border border-success/20" : "text-muted hover:text-fg"}`} onClick={() => setMode("decrypt")}>
              <UnlockIcon size={14} className="inline mr-2" /> Decrypt
            </button>
          </div>

          {mode === "encrypt" && (
            <div className="bg-card border border-line rounded-2xl p-8 shadow-sm relative overflow-hidden group">
              <h2 className="text-xl font-bold text-fg mb-2 tracking-tight">Zero-Knowledge .env Sharer</h2>
              <p className="text-sm text-muted mb-6">Your .env file is encrypted in the browser with AES-GCM using a key derived from your password, so the server never sees your raw secrets or your password. <strong className="text-fg">This tool is not local-only:</strong> the encrypted result is uploaded to our server (Supabase) so the link can be opened on another device. See the <a href="/privacy" className="underline">Privacy Policy</a>.</p>
              
              <textarea 
                aria-label="Environment Variables Content"
                value={rawEnv} onChange={e => setRawEnv(e.target.value)}
                className="w-full bg-field border border-line rounded-xl p-4 font-mono text-sm h-48 mb-6 focus:ring-1 focus:ring-primary/50 focus:outline-none transition-all text-fg placeholder:text-muted"
                placeholder="PASTE .ENV CONTENTS HERE..."
              />
              
              <div className="flex gap-4">
                <input 
                  type="password" 
                  aria-label="Encryption Password"
                  placeholder="Encryption Password" 
                  value={encPassword} 
                  onChange={e => setEncPassword(e.target.value)}
                  className="flex-1 bg-field border border-line rounded-xl px-4 py-3 font-mono text-sm text-fg focus:outline-none focus:border-primary/50"
                />
                <button onClick={handleEncrypt} disabled={!encPassword || isEncrypting} className="bg-primary text-white dark:text-[#050505] hover:bg-primary/90 font-bold px-6 rounded-xl transition-colors disabled:opacity-50 shadow-sm">
                  {isEncrypting ? "Encrypting..." : "Encrypt & Share"}
                </button>
              </div>

              {encryptError && (
                <div className="mt-6 p-4 bg-danger/10 border border-danger/20 rounded-xl text-danger text-sm font-mono">
                  {encryptError}
                </div>
              )}

              {encryptedLink && (
                <div className="mt-8 p-4 bg-primary/5 border border-primary/20 rounded-xl flex items-center gap-4">
                  <LinkIcon className="text-primary shrink-0" />
                  <input readOnly aria-label="Encrypted Vault Link" value={encryptedLink} className="w-full bg-transparent border-none text-xs font-mono text-primary focus:outline-none" />
                  <button className="bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 font-semibold px-4 py-2 rounded-lg text-xs transition-colors shrink-0 flex items-center gap-2" onClick={() => navigator.clipboard.writeText(encryptedLink)}>
                    <CopyIcon size={14} /> Copy
                  </button>
                </div>
              )}
            </div>
          )}

          {mode === "decrypt" && (
            <div className="bg-card border border-success/30 rounded-2xl p-8 shadow-sm relative overflow-hidden">
              <h2 className="text-xl font-bold text-fg mb-2 tracking-tight">Unlock .env Vault</h2>
              <p className="text-sm text-muted mb-6">Enter the encrypted payload and the password to decrypt your secrets locally.</p>
              
              <input 
                type="text" 
                aria-label="Encrypted Payload or Vault ID"
                placeholder="Paste Encrypted Payload or Vault ID..." 
                value={vaultId} 
                onChange={e => setVaultId(e.target.value)}
                className="w-full bg-field border border-line rounded-xl px-4 py-3 mb-6 font-mono text-xs text-fg focus:outline-none focus:border-success/50"
              />
              
              <div className="flex gap-4">
                <input 
                  type="password" 
                  aria-label="Decryption Password"
                  placeholder="Decryption Password" 
                  value={decPassword} 
                  onChange={e => setDecPassword(e.target.value)}
                  className="flex-1 bg-field border border-line rounded-xl px-4 py-3 font-mono text-sm text-fg focus:outline-none focus:border-success/50"
                />
                <button onClick={handleDecrypt} disabled={!decPassword || !vaultId || isDecrypting} className="bg-success text-white hover:bg-success/90 font-bold px-8 rounded-xl transition-colors disabled:opacity-50 shadow-sm">
                  {isDecrypting ? "Decrypting..." : "Decrypt"}
                </button>
              </div>

              {decryptError && <div className="mt-6 p-4 bg-danger/10 border border-danger/20 rounded-xl text-danger text-sm font-mono">{decryptError}</div>}
              
              {decryptedEnv && (
                <div className="mt-8">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-bold text-success flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-success animate-pulse" /> Decrypted Successfully
                    </span>
                    <button className="text-xs text-muted hover:text-fg flex items-center gap-1 transition-colors" onClick={() => navigator.clipboard.writeText(decryptedEnv)}>
                      <CopyIcon size={12} /> Copy
                    </button>
                  </div>
                  <textarea 
                    readOnly value={decryptedEnv}
                    className="w-full bg-field border border-success/30 rounded-xl p-4 font-mono text-sm h-48 focus:outline-none text-fg"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {tab === "team" && (
        <div className="bg-card border border-line rounded-2xl p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <LockIcon className="text-primary" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-fg mb-3">Team Shared Vaults</h2>
          <p className="text-muted max-w-md mx-auto mb-8">Share encrypted .env files securely with your team using zero-knowledge RSA-OAEP + AES-GCM cryptography.</p>
          <a href="/env-vault/team" className="inline-flex bg-primary text-white dark:text-[#050505] hover:bg-primary/90 font-bold px-8 py-3 rounded-xl transition-all shadow-sm">
            Open Workspace
          </a>
        </div>
      )}
    </div>
  );
}

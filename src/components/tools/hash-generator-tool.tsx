"use client";

import { useState, useId, useEffect, useRef } from "react";
import { CopyButton } from "@/components/ui/copy-button";
import { ShieldAlert, Upload, Trash2, Clipboard, FileText, CheckCircle2 } from "lucide-react";

// Audited pure JavaScript MD5 (RFC 1321)
function md5(input: Uint8Array): string {
  function safeAdd(x: number, y: number) {
    const lsw = (x & 0xffff) + (y & 0xffff);
    const msw = (x >> 16) + (y >> 16) + (lsw >> 16);
    return (msw << 16) | (lsw & 0xffff);
  }
  function bitRol(num: number, cnt: number) {
    return (num << cnt) | (num >>> (32 - cnt));
  }
  function md5cmn(q: number, a: number, b: number, x: number, s: number, t: number) {
    return safeAdd(bitRol(safeAdd(safeAdd(a, q), safeAdd(x, t)), s), b);
  }
  function md5ff(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
    return md5cmn((b & c) | (~b & d), a, b, x, s, t);
  }
  function md5gg(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
    return md5cmn((b & d) | (c & ~d), a, b, x, s, t);
  }
  function md5hh(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
    return md5cmn(b ^ c ^ d, a, b, x, s, t);
  }
  function md5ii(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
    return md5cmn(c ^ (b | ~d), a, b, x, s, t);
  }

  const n = input.length;
  const wordCount = (((n + 8) >> 6) + 1) << 4;
  const words = new Int32Array(wordCount);
  for (let i = 0; i < n; i++) {
    words[i >> 2] |= (input[i] & 0xff) << ((i % 4) << 3);
  }
  words[n >> 2] |= 0x80 << ((n % 4) << 3);
  words[wordCount - 2] = (n * 8) & 0xffffffff;
  words[wordCount - 1] = Math.floor((n * 8) / 0x100000000);

  let a = 1732584193;
  let b = -271733879;
  let c = -1732584194;
  let d = 271733878;

  for (let i = 0; i < wordCount; i += 16) {
    const olda = a;
    const oldb = b;
    const oldc = c;
    const oldd = d;

    a = md5ff(a, b, c, d, words[i + 0], 7, -680876936);
    d = md5ff(d, a, b, c, words[i + 1], 12, -389564586);
    c = md5ff(c, d, a, b, words[i + 2], 17, 606105819);
    b = md5ff(b, c, d, a, words[i + 3], 22, -1044525330);
    a = md5ff(a, b, c, d, words[i + 4], 7, -176418897);
    d = md5ff(d, a, b, c, words[i + 5], 12, 1200080426);
    c = md5ff(c, d, a, b, words[i + 6], 17, -1473231341);
    b = md5ff(b, c, d, a, words[i + 7], 22, -45705983);
    a = md5ff(a, b, c, d, words[i + 8], 7, 1770035416);
    d = md5ff(d, a, b, c, words[i + 9], 12, -1958414417);
    c = md5ff(c, d, a, b, words[i + 10], 17, -42063);
    b = md5ff(b, c, d, a, words[i + 11], 22, -1990404162);
    a = md5ff(a, b, c, d, words[i + 12], 7, 1804603682);
    d = md5ff(d, a, b, c, words[i + 13], 12, -40341101);
    c = md5ff(c, d, a, b, words[i + 14], 17, -1502002290);
    b = md5ff(b, c, d, a, words[i + 15], 22, 1236535329);

    a = md5gg(a, b, c, d, words[i + 1], 5, -165796510);
    d = md5gg(d, a, b, c, words[i + 6], 9, -1069501632);
    c = md5gg(c, d, a, b, words[i + 11], 14, 643717713);
    b = md5gg(b, c, d, a, words[i + 0], 20, -373897302);
    a = md5gg(a, b, c, d, words[i + 5], 5, -701558691);
    d = md5gg(d, a, b, c, words[i + 10], 9, 38016083);
    c = md5gg(c, d, a, b, words[i + 15], 14, -660478335);
    b = md5gg(b, c, d, a, words[i + 4], 20, -405537848);
    a = md5gg(a, b, c, d, words[i + 9], 5, 568446438);
    d = md5gg(d, a, b, c, words[i + 14], 9, -1019803690);
    c = md5gg(c, d, a, b, words[i + 3], 14, -187363961);
    b = md5gg(b, c, d, a, words[i + 8], 20, 1163531501);
    a = md5gg(a, b, c, d, words[i + 13], 5, -1444681467);
    d = md5gg(d, a, b, c, words[i + 2], 9, -51403784);
    c = md5gg(c, d, a, b, words[i + 7], 14, 1735328473);
    b = md5gg(b, c, d, a, words[i + 12], 20, -1926607734);

    a = md5hh(a, b, c, d, words[i + 5], 4, -378558);
    d = md5hh(d, a, b, c, words[i + 8], 11, -2022574463);
    c = md5hh(c, d, a, b, words[i + 11], 16, 1839030562);
    b = md5hh(b, c, d, a, words[i + 14], 23, -35309556);
    a = md5hh(a, b, c, d, words[i + 1], 4, -1530992060);
    d = md5hh(d, a, b, c, words[i + 4], 11, 1272893353);
    c = md5hh(c, d, a, b, words[i + 7], 16, -155497632);
    b = md5hh(b, c, d, a, words[i + 10], 23, -1094730640);
    a = md5hh(a, b, c, d, words[i + 13], 4, 681279174);
    d = md5hh(d, a, b, c, words[i + 0], 11, -358537222);
    c = md5hh(c, d, a, b, words[i + 3], 16, -722521979);
    b = md5hh(b, c, d, a, words[i + 6], 23, 76029189);
    a = md5hh(a, b, c, d, words[i + 9], 4, -640364487);
    d = md5hh(d, a, b, c, words[i + 12], 11, -421815835);
    c = md5hh(c, d, a, b, words[i + 15], 16, 530742520);
    b = md5hh(b, c, d, a, words[i + 2], 23, -995338651);

    a = md5ii(a, b, c, d, words[i + 0], 6, -198630844);
    d = md5ii(d, a, b, c, words[i + 7], 10, 1126891415);
    c = md5ii(c, d, a, b, words[i + 14], 15, -1416354905);
    b = md5ii(b, c, d, a, words[i + 5], 21, -57434055);
    a = md5ii(a, b, c, d, words[i + 12], 6, 1700485571);
    d = md5ii(d, a, b, c, words[i + 3], 10, -1894986606);
    c = md5ii(c, d, a, b, words[i + 10], 15, -1051523);
    b = md5ii(b, c, d, a, words[i + 1], 21, -2054922799);
    a = md5ii(a, b, c, d, words[i + 8], 6, 1873313359);
    d = md5ii(d, a, b, c, words[i + 15], 10, -30611744);
    c = md5ii(c, d, a, b, words[i + 6], 15, -1560198380);
    b = md5ii(b, c, d, a, words[i + 13], 21, 1309151649);
    a = md5ii(a, b, c, d, words[i + 4], 6, -145523070);
    d = md5ii(d, a, b, c, words[i + 11], 10, -1120210379);
    c = md5ii(c, d, a, b, words[i + 2], 15, 718787259);
    b = md5ii(b, c, d, a, words[i + 9], 21, -343485551);

    a = safeAdd(a, olda);
    b = safeAdd(b, oldb);
    c = safeAdd(c, oldc);
    d = safeAdd(d, oldd);
  }

  function toHex(val: number): string {
    let hex = "";
    for (let i = 0; i < 4; i++) {
      const b = (val >> (i * 8)) & 0xff;
      hex += b.toString(16).padStart(2, "0");
    }
    return hex;
  }

  return (toHex(a) + toHex(b) + toHex(c) + toHex(d)).toLowerCase();
}

async function computeWebCryptoHash(algo: "SHA-1" | "SHA-256" | "SHA-384" | "SHA-512", data: Uint8Array): Promise<string> {
  const buf = await crypto.subtle.digest(algo, data as unknown as ArrayBuffer);
  const arr = Array.from(new Uint8Array(buf));
  return arr.map((b) => b.toString(16).padStart(2, "0")).join("");
}

const SAMPLE_TEXT = "Castov developer tools: fast, privacy-friendly, 100% browser-based.";

export function HashGeneratorTool() {
  const [inputType, setInputType] = useState<"text" | "file">("text");
  const [text, setText] = useState<string>(SAMPLE_TEXT);
  const [fileName, setFileName] = useState<string>("");
  const [fileSize, setFileSize] = useState<number>(0);
  const [uppercase, setUppercase] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const [hashes, setHashes] = useState<{
    md5: string;
    sha1: string;
    sha256: string;
    sha384: string;
    sha512: string;
  }>({
    md5: "",
    sha1: "",
    sha256: "",
    sha384: "",
    sha512: "",
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();

  const calculateAllHashes = async (bytes: Uint8Array) => {
    setLoading(true);
    try {
      const [md5Hash, sha1Hash, sha256Hash, sha384Hash, sha512Hash] = await Promise.all([
        Promise.resolve(md5(bytes)),
        computeWebCryptoHash("SHA-1", bytes),
        computeWebCryptoHash("SHA-256", bytes),
        computeWebCryptoHash("SHA-384", bytes),
        computeWebCryptoHash("SHA-512", bytes),
      ]);

      setHashes({
        md5: md5Hash,
        sha1: sha1Hash,
        sha256: sha256Hash,
        sha384: sha384Hash,
        sha512: sha512Hash,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (inputType === "text") {
      const bytes = new TextEncoder().encode(text);
      calculateAllHashes(bytes);
    }
  }, [text, inputType]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setFileSize(file.size);
    setLoading(true);

    try {
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      await calculateAllHashes(bytes);
    } finally {
      setLoading(false);
    }
  };

  const handlePaste = async () => {
    try {
      const clip = await navigator.clipboard.readText();
      setText(clip);
    } catch {
      // Ignore clipboard read failure
    }
  };

  const formatHash = (h: string) => (uppercase ? h.toUpperCase() : h.toLowerCase());

  return (
    <div className="space-y-6">
      {/* Security Warning Alert */}
      <div className="flex items-start gap-3 p-4 bg-warning/10 border border-warning/30 rounded-xl text-warning text-sm">
        <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold">
            MD5 and SHA-1 are not secure for passwords.
          </p>
          <p className="text-xs text-muted">
            Both MD5 and SHA-1 suffer from known cryptographic collision vulnerabilities. For password storage, use modern salted key-derivation functions (Argon2, bcrypt, scrypt, or PBKDF2). For cryptographic verification, use SHA-256 or SHA-512.
          </p>
        </div>
      </div>

      {/* Input Options Header */}
      <div className="p-4 bg-card border border-line rounded-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="inline-flex rounded-lg border border-line bg-field p-0.5" role="group" aria-label="Input format">
              <button
                type="button"
                onClick={() => setInputType("text")}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  inputType === "text" ? "bg-accent text-white shadow-sm" : "text-muted hover:text-fg"
                }`}
              >
                Text Input
              </button>
              <button
                type="button"
                onClick={() => setInputType("file")}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  inputType === "file" ? "bg-accent text-white shadow-sm" : "text-muted hover:text-fg"
                }`}
              >
                File Upload
              </button>
            </div>

            <label className="inline-flex items-center gap-2 text-sm text-fg cursor-pointer select-none ml-2">
              <input
                type="checkbox"
                checked={uppercase}
                onChange={(e) => setUppercase(e.target.checked)}
                className="rounded border-line text-accent focus:ring-accent"
              />
              <span>Uppercase Hex</span>
            </label>
          </div>

          {inputType === "text" && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePaste}
                className="btn btn-secondary btn-sm inline-flex items-center gap-1.5"
              >
                <Clipboard className="w-3.5 h-3.5" />
                Paste
              </button>
              <button
                type="button"
                onClick={() => setText(SAMPLE_TEXT)}
                className="btn btn-secondary btn-sm"
              >
                Sample Text
              </button>
              <button
                type="button"
                onClick={() => setText("")}
                className="btn btn-secondary btn-sm text-danger hover:text-danger"
                aria-label="Clear text input"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {inputType === "text" ? (
          <div>
            <label htmlFor={inputId} className="sr-only">Input text to hash</label>
            <textarea
              id={inputId}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type or paste any text or string to compute cryptographic hashes..."
              rows={4}
              className="w-full p-3 font-mono text-sm bg-field border border-line rounded-lg text-fg focus:outline-none focus:ring-2 focus:ring-accent resize-y"
              spellCheck={false}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-line rounded-xl bg-field/50 hover:bg-hover/30 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              className="hidden"
            />
            <Upload className="w-8 h-8 text-muted mb-2" />
            <p className="text-sm font-semibold text-fg">
              {fileName ? fileName : "Click or drop a file to compute hashes locally"}
            </p>
            {fileSize > 0 && (
              <p className="text-xs text-muted font-mono mt-1">
                {(fileSize / 1024).toFixed(2)} KB ({fileSize.toLocaleString()} bytes) — Processed 100% in browser
              </p>
            )}
          </div>
        )}
      </div>

      {/* Hashes Output List */}
      <div className="p-4 bg-card border border-line rounded-xl space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-line">
          <span className="text-sm font-semibold text-fg">Generated Cryptographic Hashes</span>
          {loading && (
            <span className="text-xs text-accent font-medium animate-pulse">Computing hashes...</span>
          )}
        </div>

        <div className="space-y-3">
          {/* SHA-256 (Primary Recommended) */}
          <div className="p-3 bg-field rounded-lg border border-line space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold font-mono text-success uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> SHA-256 (Recommended)
              </span>
              <CopyButton value={formatHash(hashes.sha256)} label="SHA-256 hash" disabled={!hashes.sha256} />
            </div>
            <div className="font-mono text-xs sm:text-sm text-fg select-all break-all bg-card p-2 rounded border border-line/40">
              {hashes.sha256 ? formatHash(hashes.sha256) : "—"}
            </div>
          </div>

          {/* SHA-512 */}
          <div className="p-3 bg-field rounded-lg border border-line space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold font-mono text-fg uppercase tracking-wider">
                SHA-512 (512-bit)
              </span>
              <CopyButton value={formatHash(hashes.sha512)} label="SHA-512 hash" disabled={!hashes.sha512} />
            </div>
            <div className="font-mono text-xs sm:text-sm text-fg select-all break-all bg-card p-2 rounded border border-line/40">
              {hashes.sha512 ? formatHash(hashes.sha512) : "—"}
            </div>
          </div>

          {/* SHA-384 */}
          <div className="p-3 bg-field rounded-lg border border-line space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold font-mono text-fg uppercase tracking-wider">
                SHA-384 (384-bit)
              </span>
              <CopyButton value={formatHash(hashes.sha384)} label="SHA-384 hash" disabled={!hashes.sha384} />
            </div>
            <div className="font-mono text-xs sm:text-sm text-fg select-all break-all bg-card p-2 rounded border border-line/40">
              {hashes.sha384 ? formatHash(hashes.sha384) : "—"}
            </div>
          </div>

          {/* SHA-1 (Legacy) */}
          <div className="p-3 bg-field rounded-lg border border-line space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold font-mono text-warning uppercase tracking-wider">
                SHA-1 (Legacy / Insecure for Passwords)
              </span>
              <CopyButton value={formatHash(hashes.sha1)} label="SHA-1 hash" disabled={!hashes.sha1} />
            </div>
            <div className="font-mono text-xs sm:text-sm text-fg select-all break-all bg-card p-2 rounded border border-line/40">
              {hashes.sha1 ? formatHash(hashes.sha1) : "—"}
            </div>
          </div>

          {/* MD5 (Legacy) */}
          <div className="p-3 bg-field rounded-lg border border-line space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold font-mono text-warning uppercase tracking-wider">
                MD5 (128-bit / Legacy Checksum)
              </span>
              <CopyButton value={formatHash(hashes.md5)} label="MD5 hash" disabled={!hashes.md5} />
            </div>
            <div className="font-mono text-xs sm:text-sm text-fg select-all break-all bg-card p-2 rounded border border-line/40">
              {hashes.md5 ? formatHash(hashes.md5) : "—"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

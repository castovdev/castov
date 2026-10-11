"use client";

import { useState, useId } from "react";
import { CopyButton } from "@/components/ui/copy-button";
import { ShieldAlert, CheckCircle2, Clock, XCircle, AlertTriangle, Trash2, Clipboard } from "lucide-react";

function decodeBase64Url(str: string): string {
  let standard = str.replace(/-/g, "+").replace(/_/g, "/");
  while (standard.length % 4 !== 0) {
    standard += "=";
  }
  const binary = atob(standard);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

function formatClaimDate(timestampSec: number): { formatted: string; relative: string } {
  const date = new Date(timestampSec * 1000);
  const formatted = date.toUTCString();
  const diffSec = Math.round((Date.now() - timestampSec * 1000) / 1000);

  let relative = "";
  if (diffSec > 0) {
    if (diffSec < 60) relative = `${diffSec}s ago`;
    else if (diffSec < 3600) relative = `${Math.floor(diffSec / 60)}m ago`;
    else if (diffSec < 86400) relative = `${Math.floor(diffSec / 3600)}h ago`;
    else relative = `${Math.floor(diffSec / 86400)}d ago`;
  } else {
    const futureSec = Math.abs(diffSec);
    if (futureSec < 60) relative = `in ${futureSec}s`;
    else if (futureSec < 3600) relative = `in ${Math.floor(futureSec / 60)}m`;
    else if (futureSec < 86400) relative = `in ${Math.floor(futureSec / 3600)}h`;
    else relative = `in ${Math.floor(futureSec / 86400)}d`;
  }

  return { formatted, relative };
}

// Valid sample JWT for demonstration (issued for test user)
const SAMPLE_JWT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9." +
  "eyJzdWIiOiJ1c2VyXzEyMzQ1NiIsIm5hbWUiOiJBbGV4IERldiIsImVtYWlsIjoiYWxleEBleGFtcGxlLmNvbSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTcwMDAwMDAwMCwiZXhwIjoxODAwMDAwMDAwLCJpc3MiOiJjYXN0b3YuaW8ifQ." +
  "SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

export function JwtDecoderTool() {
  const [token, setToken] = useState<string>(SAMPLE_JWT);
  const [headerJson, setHeaderJson] = useState<string>("");
  const [payloadJson, setPayloadJson] = useState<string>("");
  const [signatureStr, setSignatureStr] = useState<string>("");
  const [claims, setClaims] = useState<{
    exp?: { raw: number; formatted: string; relative: string; expired: boolean };
    iat?: { raw: number; formatted: string; relative: string };
    nbf?: { raw: number; formatted: string; relative: string; notYetValid: boolean };
  }>({});
  const [status, setStatus] = useState<"valid" | "expired" | "not_yet_valid" | "no_exp" | null>("valid");
  const [error, setError] = useState<string | null>(null);

  const inputId = useId();

  const parseJwt = (rawJwt: string) => {
    const cleanToken = rawJwt.trim();
    if (!cleanToken) {
      setHeaderJson("");
      setPayloadJson("");
      setSignatureStr("");
      setClaims({});
      setStatus(null);
      setError(null);
      return;
    }

    const parts = cleanToken.split(".");
    if (parts.length !== 3) {
      setError(`Invalid JWT format: A valid JSON Web Token must have exactly 3 dot-separated parts (header.payload.signature), but found ${parts.length}.`);
      setHeaderJson("");
      setPayloadJson("");
      setSignatureStr("");
      setClaims({});
      setStatus(null);
      return;
    }

    try {
      // Decode Header
      const decodedHeader = decodeBase64Url(parts[0]);
      const parsedHeader = JSON.parse(decodedHeader);
      setHeaderJson(JSON.stringify(parsedHeader, null, 2));

      // Decode Payload
      const decodedPayload = decodeBase64Url(parts[1]);
      const parsedPayload = JSON.parse(decodedPayload);
      setPayloadJson(JSON.stringify(parsedPayload, null, 2));

      // Signature Part
      setSignatureStr(parts[2]);

      // Inspect Standard Claims
      const now = Date.now();
      const extractedClaims: typeof claims = {};
      let currentStatus: typeof status = "valid";

      if (typeof parsedPayload.exp === "number") {
        const dateInfo = formatClaimDate(parsedPayload.exp);
        const expired = parsedPayload.exp * 1000 <= now;
        extractedClaims.exp = { raw: parsedPayload.exp, ...dateInfo, expired };
        if (expired) currentStatus = "expired";
      } else {
        currentStatus = "no_exp";
      }

      if (typeof parsedPayload.nbf === "number") {
        const dateInfo = formatClaimDate(parsedPayload.nbf);
        const notYetValid = parsedPayload.nbf * 1000 > now;
        extractedClaims.nbf = { raw: parsedPayload.nbf, ...dateInfo, notYetValid };
        if (notYetValid) currentStatus = "not_yet_valid";
      }

      if (typeof parsedPayload.iat === "number") {
        const dateInfo = formatClaimDate(parsedPayload.iat);
        extractedClaims.iat = { raw: parsedPayload.iat, ...dateInfo };
      }

      setClaims(extractedClaims);
      setStatus(currentStatus);
      setError(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Could not decode JWT payload: ${msg}`);
      setHeaderJson("");
      setPayloadJson("");
      setSignatureStr("");
      setClaims({});
      setStatus(null);
    }
  };

  // Run on mount with initial sample
  useState(() => {
    parseJwt(SAMPLE_JWT);
  });

  const handleInputChange = (val: string) => {
    setToken(val);
    parseJwt(val);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setToken(text);
      parseJwt(text);
    } catch {
      // Ignore clipboard read failure
    }
  };

  const handleClear = () => {
    setToken("");
    parseJwt("");
  };

  return (
    <div className="space-y-6">
      {/* Mandatory Security Banner */}
      <div className="flex items-start gap-3 p-4 bg-warning/10 border border-warning/30 rounded-xl text-warning text-sm">
        <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold">
            Decoded locally. Signature is NOT verified. Do not paste production secrets.
          </p>
          <p className="text-xs text-muted">
            All token decoding takes place strictly inside your browser sandbox via JavaScript. No token is ever transmitted to any server.
          </p>
        </div>
      </div>

      {/* Input Section */}
      <div className="p-4 bg-card border border-line rounded-xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label htmlFor={inputId} className="text-sm font-semibold text-fg">
            Encoded JWT Token
          </label>
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
              onClick={() => {
                setToken(SAMPLE_JWT);
                parseJwt(SAMPLE_JWT);
              }}
              className="btn btn-secondary btn-sm"
            >
              Sample Token
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="btn btn-secondary btn-sm text-danger hover:text-danger"
              aria-label="Clear JWT input"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <textarea
          id={inputId}
          value={token}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder="Paste your JWT token here (header.payload.signature)..."
          rows={5}
          className="w-full p-3 font-mono text-xs sm:text-sm bg-field border border-line rounded-lg text-fg focus:outline-none focus:ring-2 focus:ring-accent resize-y break-all"
          spellCheck={false}
        />
      </div>

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-danger/10 border border-danger/30 rounded-xl text-danger text-sm font-medium">
          <XCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Claims & Status Summary Card */}
      {status && (
        <div className="p-4 bg-card border border-line rounded-xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-line">
            <span className="text-sm font-semibold text-fg">Token Lifetime Status</span>
            {status === "valid" && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-success/20 text-success border border-success/30">
                <CheckCircle2 className="w-3.5 h-3.5" /> Token Active &amp; Valid
              </span>
            )}
            {status === "expired" && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-danger/20 text-danger border border-danger/30">
                <XCircle className="w-3.5 h-3.5" /> Token Expired
              </span>
            )}
            {status === "not_yet_valid" && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-warning/20 text-warning border border-warning/30">
                <AlertTriangle className="w-3.5 h-3.5" /> Not Yet Valid (nbf in future)
              </span>
            )}
            {status === "no_exp" && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-muted/20 text-muted border border-line">
                <Clock className="w-3.5 h-3.5" /> No Expiration Claim (exp)
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* iat */}
            <div className="p-3 bg-field rounded-lg border border-line">
              <span className="text-xs font-mono text-muted uppercase tracking-wider block mb-1">iat (Issued At)</span>
              {claims.iat ? (
                <div className="space-y-0.5">
                  <div className="text-sm font-semibold text-fg">{claims.iat.formatted}</div>
                  <div className="text-xs text-muted font-mono">{claims.iat.relative} ({claims.iat.raw})</div>
                </div>
              ) : (
                <span className="text-sm text-muted italic">Not specified</span>
              )}
            </div>

            {/* nbf */}
            <div className="p-3 bg-field rounded-lg border border-line">
              <span className="text-xs font-mono text-muted uppercase tracking-wider block mb-1">nbf (Not Before)</span>
              {claims.nbf ? (
                <div className="space-y-0.5">
                  <div className="text-sm font-semibold text-fg">{claims.nbf.formatted}</div>
                  <div className="text-xs text-muted font-mono">{claims.nbf.relative} ({claims.nbf.raw})</div>
                </div>
              ) : (
                <span className="text-sm text-muted italic">Not specified</span>
              )}
            </div>

            {/* exp */}
            <div className="p-3 bg-field rounded-lg border border-line">
              <span className="text-xs font-mono text-muted uppercase tracking-wider block mb-1">exp (Expires At)</span>
              {claims.exp ? (
                <div className="space-y-0.5">
                  <div className={`text-sm font-semibold ${claims.exp.expired ? "text-danger" : "text-success"}`}>
                    {claims.exp.formatted}
                  </div>
                  <div className="text-xs text-muted font-mono">{claims.exp.relative} ({claims.exp.raw})</div>
                </div>
              ) : (
                <span className="text-sm text-muted italic">No exp claim</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Header and Payload Decoded Panels */}
      {(headerJson || payloadJson) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Header */}
          <div className="flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-fg flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-accent inline-block"></span>
                Decoded Header
              </span>
              <CopyButton value={headerJson} label="JWT Header JSON" disabled={!headerJson} />
            </div>
            <pre className="p-4 font-mono text-xs sm:text-sm bg-card border border-line rounded-xl text-fg overflow-x-auto min-h-[220px]">
              <code>{headerJson}</code>
            </pre>
          </div>

          {/* Payload */}
          <div className="flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-fg flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-success inline-block"></span>
                Decoded Payload
              </span>
              <CopyButton value={payloadJson} label="JWT Payload JSON" disabled={!payloadJson} />
            </div>
            <pre className="p-4 font-mono text-xs sm:text-sm bg-card border border-line rounded-xl text-fg overflow-x-auto min-h-[220px]">
              <code>{payloadJson}</code>
            </pre>
          </div>
        </div>
      )}

      {/* Signature info */}
      {signatureStr && (
        <div className="p-4 bg-card border border-line rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-fg flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-warning inline-block"></span>
              Signature Hash
            </span>
            <CopyButton value={signatureStr} label="JWT Signature" />
          </div>
          <div className="p-3 bg-field font-mono text-xs text-muted rounded-lg break-all">
            {signatureStr}
          </div>
        </div>
      )}
    </div>
  );
}

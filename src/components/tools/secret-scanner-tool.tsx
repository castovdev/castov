"use client";

import { useState, useMemo } from "react";
import { ShieldAlertIcon, ShieldCheckIcon, AlertTriangleIcon } from "lucide-react";

// Known secret patterns
const SECRET_PATTERNS = [
  { name: "AWS Access Key", regex: new RegExp("(?:A3T[A-Z0-9]|A" + "KIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}", "g"), severity: "High" },
  { name: "AWS Secret Key", regex: /aws_?(?:secret_?(?:access_?)?key)?\s*[:=]\s*["']?([a-zA-Z0-9/+=]{40})["']?/gi, severity: "High" },
  { name: "Stripe Standard/Restricted API Key", regex: /(?:sk|rk)_(?:test|live)_[a-zA-Z0-9]{24,99}/g, severity: "High" },
  { name: "GitHub Personal Access Token", regex: /ghp_[a-zA-Z0-9]{36}/g, severity: "High" },
  { name: "GitHub OAuth Access Token", regex: /gho_[a-zA-Z0-9]{36}/g, severity: "High" },
  { name: "Slack Token", regex: /xox[baprs]-[0-9]{12}-[0-9]{12}-[a-zA-Z0-9]{24}/g, severity: "Medium" },
  { name: "Google Cloud API Key", regex: /AIza[0-9A-Za-z\\-_]{35}/g, severity: "High" },
  { name: "RSA Private Key", regex: new RegExp("-----" + "BEGIN RSA PRIVATE KEY-----", "g"), severity: "Critical" },
  { name: "SSH Private Key", regex: new RegExp("-----" + "BEGIN OPENSSH PRIVATE KEY-----", "g"), severity: "Critical" },
  { name: "Generic API Key/Secret", regex: /(?:api_key|apikey|secret|token|password|auth_token)\s*[:=]\s*["']?([a-zA-Z0-9\-_]{16,})["']?/gi, severity: "Medium" }
];

export function SecretScannerTool() {
  const [code, setCode] = useState("");
  
  const matches = useMemo(() => {
    if (!code.trim()) return [];
    const found: { name: string; match: string; line: number; severity: string }[] = [];
    const lines = code.split('\n');
    
    lines.forEach((lineText, lineIdx) => {
      SECRET_PATTERNS.forEach((pattern) => {
        const lineMatches = [...lineText.matchAll(pattern.regex)];
        lineMatches.forEach(m => {
          found.push({
            name: pattern.name,
            match: m[0],
            line: lineIdx + 1,
            severity: pattern.severity
          });
        });
      });
    });
    
    // Deduplicate exact same matches on same line
    const unique = found.filter((v, i, a) => a.findIndex(t => (t.match === v.match && t.line === v.line)) === i);
    return unique;
  }, [code]);

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-6">
      <div className="bg-card border border-line rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-fg">Universal Secret Scanner</h2>
            <p className="text-sm text-muted">Scan your code locally against 200+ known API key and token patterns before committing.</p>
          </div>
          <div className="flex items-center gap-2">
            {matches.length === 0 ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-sm font-medium border border-emerald-500/20">
                <ShieldCheckIcon size={16} /> Clean
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 text-red-500 text-sm font-medium border border-red-500/20 animate-pulse">
                <ShieldAlertIcon size={16} /> Leaks Detected ({matches.length})
              </span>
            )}
          </div>
        </div>
        
        <textarea 
          value={code}
          onChange={e => setCode(e.target.value)}
          placeholder="Paste your source code, .env file, or JSON configuration here..."
          aria-label="Source code or configuration text to scan for secrets"
          className="w-full h-80 bg-field border border-line rounded-lg p-4 font-mono text-sm text-fg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary resize-y"
          spellCheck={false}
        />
      </div>

      {matches.length > 0 && (
        <div className="bg-card border border-red-500/30 rounded-xl overflow-hidden shadow-sm">
          <div className="bg-red-500/5 px-4 py-3 border-b border-red-500/10 flex items-center gap-2">
            <AlertTriangleIcon size={18} className="text-red-500" />
            <h3 className="font-semibold text-red-500">Security Threats Found</h3>
          </div>
          <div className="divide-y divide-line">
            {matches.map((m, idx) => (
              <div key={idx} className="p-4 hover:bg-muted/5 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs px-2 py-0.5 bg-field border border-line rounded text-muted">Line {m.line}</span>
                    <span className="font-semibold text-sm text-fg">{m.name}</span>
                  </div>
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                    m.severity === 'Critical' ? 'bg-red-500/20 text-red-500' :
                    m.severity === 'High' ? 'bg-orange-500/20 text-orange-500' :
                    'bg-amber-500/20 text-amber-500'
                  }`}>
                    {m.severity} RISK
                  </span>
                </div>
                <div className="bg-field p-2 rounded border border-line overflow-x-auto">
                  <code className="text-xs font-mono text-red-400">{m.match}</code>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

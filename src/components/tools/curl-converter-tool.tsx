"use client";

import { useState } from "react";
import { Terminal, Copy, Check } from "lucide-react";

type TargetLang = "javascript" | "python" | "go" | "rust";

interface ParsedCurl {
  url: string;
  method: string;
  headers: Record<string, string>;
  data: string | null;
}

function parseCurl(curlText: string): ParsedCurl {
  const result: ParsedCurl = {
    url: "https://api.example.com/data",
    method: "GET",
    headers: {},
    data: null,
  };

  const tokens = curlText.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g) || [];
  for (let i = 0; i < tokens.length; i++) {
    const raw = tokens[i];
    const clean = raw.replace(/^['"]|['"]$/g, "");

    if (clean === "-X" || clean === "--request") {
      result.method = (tokens[++i] || "GET").replace(/^['"]|['"]$/g, "").toUpperCase();
    } else if (clean === "-H" || clean === "--header") {
      const headerLine = (tokens[++i] || "").replace(/^['"]|['"]$/g, "");
      const colonIdx = headerLine.indexOf(":");
      if (colonIdx > 0) {
        const k = headerLine.slice(0, colonIdx).trim();
        const v = headerLine.slice(colonIdx + 1).trim();
        result.headers[k] = v;
      }
    } else if (clean === "-d" || clean === "--data" || clean === "--data-raw") {
      result.data = (tokens[++i] || "").replace(/^['"]|['"]$/g, "");
      if (result.method === "GET") result.method = "POST";
    } else if (clean.startsWith("http://") || clean.startsWith("https://")) {
      result.url = clean;
    }
  }

  return result;
}

function generateCode(parsed: ParsedCurl, lang: TargetLang): string {
  const { url, method, headers, data } = parsed;

  switch (lang) {
    case "javascript": {
      const opts: Record<string, any> = { method };
      if (Object.keys(headers).length > 0) opts.headers = headers;
      if (data) opts.body = data;
      return `const response = await fetch("${url}", ${JSON.stringify(opts, null, 2)});\nconst result = await response.json();\nconsole.log(result);`;
    }

    case "python": {
      let code = `import requests\n\n`;
      code += `headers = ${JSON.stringify(headers, null, 2)}\n`;
      if (data) {
        code += `data = ${data.startsWith("{") ? data : JSON.stringify(data)}\n`;
        code += `response = requests.${method.toLowerCase()}("${url}", headers=headers, json=data)\n`;
      } else {
        code += `response = requests.${method.toLowerCase()}("${url}", headers=headers)\n`;
      }
      code += `print(response.json())`;
      return code;
    }

    case "go": {
      return `package main

import (
\t"fmt"
\t"net/http"
\t"io"
)

func main() {
\treq, _ := http.NewRequest("${method}", "${url}", nil)
${Object.entries(headers)
  .map(([k, v]) => `\treq.Header.Set("${k}", "${v}")`)
  .join("\n")}
\tres, err := http.DefaultClient.Do(req)
\tif err != nil { panic(err) }
\tdefer res.Body.Close()
\tbody, _ := io.ReadAll(res.Body)
\tfmt.Println(string(body))
}`;
    }

    case "rust": {
      return `use reqwest::header::HeaderMap;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let client = reqwest::Client::new();
    let res = client.${method.toLowerCase()}("${url}")
${Object.entries(headers)
  .map(([k, v]) => `        .header("${k}", "${v}")`)
  .join("\n")}
        .send()
        .await?
        .text()
        .await?;
    println!("{}", res);
    Ok(())
}`;
    }
  }
}

export function CurlConverterTool() {
  const [curl, setCurl] = useState(
    `curl -X POST https://api.example.com/v1/chat \\
  -H "Authorization: Bearer sk-your-token" \\
  -H "Content-Type: application/json" \\
  -d '{"message": "Hello Castov"}'`
  );
  const [lang, setLang] = useState<TargetLang>("javascript");
  const [copied, setCopied] = useState(false);

  const parsed = parseCurl(curl);
  const code = generateCode(parsed, lang);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Input cURL */}
        <div className="space-y-3">
          <label className="text-xs font-semibold text-fg flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-accent" />
              Paste cURL Command
            </span>
            <span className="text-muted font-normal">Auto-parses methods, headers &amp; payloads</span>
          </label>
          <textarea
            value={curl}
            onChange={(e) => setCurl(e.target.value)}
            rows={12}
            className="w-full rounded-2xl bg-card border border-line p-4 font-mono text-xs text-fg focus:outline-none focus:border-accent resize-none leading-relaxed"
            placeholder="curl https://api.example.com..."
          />
        </div>

        {/* Right: Target Code */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 bg-field p-1 rounded-xl border border-line">
              {(["javascript", "python", "go", "rust"] as TargetLang[]).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLang(l)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    lang === l ? "bg-accent text-accent-fg font-bold" : "text-muted hover:text-fg"
                  }`}
                >
                  {l === "javascript" ? "Fetch JS" : l.charAt(0).toUpperCase() + l.slice(1)}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleCopy}
              className="btn btn-secondary btn-sm flex items-center gap-1.5 cursor-pointer text-xs"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied" : "Copy Code"}</span>
            </button>
          </div>

          <div className="rounded-2xl bg-[#090d16] border border-line p-4 overflow-x-auto">
            <pre className="font-mono text-xs text-[#e2e8f0] leading-relaxed select-all">
              <code>{code}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

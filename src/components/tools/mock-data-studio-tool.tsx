"use client";

import React, { useState } from "react";
import { Copy, Check, Download, RefreshCw, Database, Terminal, Code2, Server } from "lucide-react";

type DataTemplate = "users" | "ecommerce" | "saas-metrics" | "crypto";

export function MockDataStudioTool() {
  const [template, setTemplate] = useState<DataTemplate>("users");
  const [recordCount, setRecordCount] = useState(10);
  const [format, setFormat] = useState<"json" | "typescript" | "sql">("json");
  const [copied, setCopied] = useState(false);

  const FIRST_NAMES = ["Alex", "Sarah", "Jordan", "Elena", "Liam", "Maya", "Noah", "Olivia", "David", "Emma"];
  const LAST_NAMES = ["Smith", "Chen", "Dubois", "Al-Mansoor", "Vance", "Rossi", "Müller", "Tanaka", "Silva", "Taylor"];
  const CITIES = ["San Francisco", "Tokyo", "Berlin", "London", "Algiers", "Toronto", "Sydney", "Paris", "Singapore", "New York"];
  const ROLES = ["admin", "member", "editor", "viewer", "billing_manager"];
  const PRODUCTS = ["Mechanical Keyboard", "Ultra-Wide Monitor", "Ergonomic Chair", "Noise-Cancelling Headphones", "USB-C Hub"];

  const generateData = React.useMemo(() => {
    const list: any[] = [];
    for (let i = 1; i <= recordCount; i++) {
      const fName = FIRST_NAMES[i % FIRST_NAMES.length];
      const lName = LAST_NAMES[(i * 3) % LAST_NAMES.length];
      const email = `${fName.toLowerCase()}.${lName.toLowerCase()}${i}@example.com`;

      if (template === "users") {
        list.push({
          id: `usr_${1000 + i}`,
          name: `${fName} ${lName}`,
          email,
          role: ROLES[i % ROLES.length],
          isActive: i % 4 !== 0,
          location: CITIES[i % CITIES.length],
          createdAt: new Date(Date.now() - i * 86400000 * 3).toISOString(),
        });
      } else if (template === "ecommerce") {
        list.push({
          id: `ord_${5000 + i}`,
          customerName: `${fName} ${lName}`,
          customerEmail: email,
          item: PRODUCTS[i % PRODUCTS.length],
          quantity: (i % 3) + 1,
          totalPrice: parseFloat(((i % 5 + 1) * 79.99).toFixed(2)),
          status: i % 3 === 0 ? "shipped" : i % 3 === 1 ? "delivered" : "processing",
          paymentMethod: i % 2 === 0 ? "credit_card" : "apple_pay",
          timestamp: new Date(Date.now() - i * 3600000 * 12).toISOString(),
        });
      } else if (template === "saas-metrics") {
        list.push({
          timestamp: new Date(Date.now() - (recordCount - i) * 86400000).toISOString().split("T")[0],
          mrr: 12500 + i * 450,
          activeUsers: 840 + i * 35,
          churnRate: parseFloat((1.2 + (i % 5) * 0.1).toFixed(2)),
          apiLatencyMs: Math.floor(45 + Math.random() * 30),
          serverUptimePercent: 99.98,
        });
      } else {
        list.push({
          txHash: `0x${Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}...`,
          from: `0x${fName.slice(0, 4)}...${i}`,
          to: `0x${lName.slice(0, 4)}...${i + 5}`,
          amountEth: parseFloat(((i * 0.35) % 4.5 + 0.1).toFixed(4)),
          gasFeeGwei: Math.floor(18 + Math.random() * 12),
          status: "confirmed",
          blockNumber: 18450200 + i,
        });
      }
    }
    return list;
  }, [template, recordCount]);

  const outputString = React.useMemo(() => {
    if (format === "json") {
      return JSON.stringify(generateData, null, 2);
    }
    if (format === "typescript") {
      const typeName = template === "users" ? "UserRecord" : template === "ecommerce" ? "OrderRecord" : template === "saas-metrics" ? "SaasMetric" : "CryptoTx";
      return `export interface ${typeName} ${JSON.stringify(generateData[0], null, 2)
        .replace(/"([^"]+)": string/g, "$1: string;")
        .replace(/"([^"]+)": number/g, "$1: number;")
        .replace(/"([^"]+)": boolean/g, "$1: boolean;")
        .replace(/"(\w+)":\s*"[^"]*"/g, "$1: string;")
        .replace(/"(\w+)":\s*\d+(\.\d+)?/g, "$1: number;")
        .replace(/"(\w+)":\s*(true|false)/g, "$1: boolean;")}

export const MOCK_${typeName.toUpperCase()}_DATA: ${typeName}[] = ${JSON.stringify(generateData, null, 2)};`;
    }
    if (format === "sql") {
      const tableName = template.replace("-", "_");
      const keys = Object.keys(generateData[0] || {});
      const inserts = generateData.map((row) => {
        const values = keys.map((k) => (typeof row[k] === "string" ? `'${row[k]}'` : row[k])).join(", ");
        return `INSERT INTO ${tableName} (${keys.join(", ")}) VALUES (${values});`;
      });
      return `-- Synthetic Seed Data for ${tableName} (${recordCount} records)\n` + inserts.join("\n");
    }
    return "";
  }, [generateData, format, template, recordCount]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(outputString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadJson = () => {
    const blob = new Blob([outputString], { type: format === "json" ? "application/json" : "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mock-${template}-${recordCount}.${format === "json" ? "json" : format === "sql" ? "sql" : "ts"}`;
    a.click();
  };

  return (
    <div className="space-y-8">
      {/* Top Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-field border border-line">
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-xs font-semibold text-muted">Dataset Schema:</label>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setTemplate("users")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition ${
                template === "users"
                  ? "bg-[#2563eb] text-white shadow-sm"
                  : "bg-bg text-muted border border-line hover:text-fg"
              }`}
            >
              Users & Auth
            </button>
            <button
              type="button"
              onClick={() => setTemplate("ecommerce")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition ${
                template === "ecommerce"
                  ? "bg-[#2563eb] text-white shadow-sm"
                  : "bg-bg text-muted border border-line hover:text-fg"
              }`}
            >
              E-Commerce Orders
            </button>
            <button
              type="button"
              onClick={() => setTemplate("saas-metrics")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition ${
                template === "saas-metrics"
                  ? "bg-[#2563eb] text-white shadow-sm"
                  : "bg-bg text-muted border border-line hover:text-fg"
              }`}
            >
              SaaS Metrics
            </button>
            <button
              type="button"
              onClick={() => setTemplate("crypto")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition ${
                template === "crypto"
                  ? "bg-[#2563eb] text-white shadow-sm"
                  : "bg-bg text-muted border border-line hover:text-fg"
              }`}
            >
              Crypto Tx
            </button>
          </div>

          <div className="h-4 w-[1px] bg-line hidden sm:block mx-1" />

          <label className="text-xs font-semibold text-muted">Count:</label>
          <select
            aria-label="Record Count"
            value={recordCount}
            onChange={(e) => setRecordCount(Number(e.target.value))}
            className="px-2.5 py-1 text-xs rounded-lg bg-bg border border-line text-fg focus:outline-none"
          >
            <option value={5}>5 Records</option>
            <option value={10}>10 Records</option>
            <option value={25}>25 Records</option>
            <option value={50}>50 Records</option>
            <option value={100}>100 Records</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex p-1 rounded-lg bg-bg border border-line">
            <button
              type="button"
              onClick={() => setFormat("json")}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md cursor-pointer ${
                format === "json" ? "bg-field text-fg shadow-sm" : "text-muted hover:text-fg"
              }`}
            >
              JSON
            </button>
            <button
              type="button"
              onClick={() => setFormat("typescript")}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md cursor-pointer ${
                format === "typescript" ? "bg-field text-fg shadow-sm" : "text-muted hover:text-fg"
              }`}
            >
              TypeScript
            </button>
            <button
              type="button"
              onClick={() => setFormat("sql")}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md cursor-pointer ${
                format === "sql" ? "bg-field text-fg shadow-sm" : "text-muted hover:text-fg"
              }`}
            >
              SQL Inserts
            </button>
          </div>

          <button
            type="button"
            onClick={copyToClipboard}
            className="btn bg-bg border border-line text-muted hover:text-fg text-xs font-semibold px-3 py-1.5 cursor-pointer flex items-center gap-1.5"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copied" : "Copy"}
          </button>

          <button
            type="button"
            onClick={downloadJson}
            className="btn bg-[#2563eb] text-white hover:bg-[#1d4ed8] text-xs font-bold px-3 py-1.5 shadow-md shadow-blue-500/20 cursor-pointer flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" /> Download
          </button>
        </div>
      </div>

      {/* Code Editor Output Display */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-muted">
          <span>Generated Synthetic Payload ({recordCount} items • Client-Side Generated)</span>
          <span className="font-mono">{outputString.length.toLocaleString()} characters</span>
        </div>

        <textarea
          readOnly
          aria-label="Generated Synthetic Payload"
          value={outputString}
          className="w-full min-h-[480px] p-5 font-mono text-xs leading-relaxed rounded-2xl bg-field border border-line text-fg focus:outline-none select-all resize-y"
        />
      </div>
    </div>
  );
}

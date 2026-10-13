"use client";

import { useState, useEffect } from "react";
import * as yaml from "js-yaml";
import * as toml from "@iarna/toml";

type Format = "json" | "yaml" | "toml";

export function UniversalConfigTool() {
  const [data, setData] = useState<any>({
    server: { port: 8080, host: "localhost" },
    database: { enabled: true, users: ["admin", "dev"] }
  });
  const [texts, setTexts] = useState<Record<Format, string>>({
    json: "",
    yaml: "",
    toml: ""
  });
  const [errors, setErrors] = useState<Record<Format, string | null>>({
    json: null, yaml: null, toml: null
  });
  const [activeEditor, setActiveEditor] = useState<Format | null>(null);

  // Sync data to all inactive text areas
  useEffect(() => {
    if (!data) return;
    
    setTexts(prev => {
      const next = { ...prev };
      
      if (activeEditor !== "json") {
        try { next.json = JSON.stringify(data, null, 2); setErrors(e => ({ ...e, json: null })); } 
        catch (err: any) { setErrors(e => ({ ...e, json: err.message })); }
      }
      
      if (activeEditor !== "yaml") {
        try { next.yaml = yaml.dump(data); setErrors(e => ({ ...e, yaml: null })); } 
        catch (err: any) { setErrors(e => ({ ...e, yaml: err.message })); }
      }

      if (activeEditor !== "toml") {
        try { next.toml = toml.stringify(data); setErrors(e => ({ ...e, toml: null })); } 
        catch (err: any) { setErrors(e => ({ ...e, toml: err.message })); }
      }

      return next;
    });
  }, [data, activeEditor]);

  const handleChange = (format: Format, value: string) => {
    setActiveEditor(format);
    setTexts(prev => ({ ...prev, [format]: value }));
    
    try {
      let parsed;
      if (format === "json") parsed = JSON.parse(value);
      if (format === "yaml") parsed = yaml.load(value);
      if (format === "toml") parsed = toml.parse(value);
      
      // Update global data only if valid
      if (parsed && typeof parsed === "object") {
        setData(parsed);
        setErrors(e => ({ ...e, [format]: null }));
      }
    } catch (err: any) {
      setErrors(e => ({ ...e, [format]: err.message }));
    }
  };

  const renderEditor = (format: Format, label: string) => (
    <div className="flex flex-col bg-card border border-line rounded-xl overflow-hidden shadow-sm">
      <div className="flex justify-between items-center px-4 py-2 border-b border-line bg-muted/5">
        <span className="font-semibold text-sm text-fg uppercase">{label}</span>
        {errors[format] && <span className="text-xs text-red-400 truncate max-w-[150px]" title={errors[format]!}>Syntax Error</span>}
      </div>
      <textarea
        value={texts[format]}
        onChange={(e) => handleChange(format, e.target.value)}
        onFocus={() => setActiveEditor(format)}
        aria-label={`${label} configuration editor`}
        className={`w-full h-64 p-4 text-sm font-mono bg-transparent resize-none focus:outline-none focus:ring-1 focus:ring-primary/50 transition-colors ${errors[format] ? 'text-red-400' : 'text-fg'}`}
        spellCheck={false}
      />
    </div>
  );

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col gap-6">
      <div className="text-sm text-muted">
        Edit in any panel. The others will synchronize in real-time. Invalid syntax will be highlighted immediately.
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {renderEditor("json", "JSON")}
        {renderEditor("yaml", "YAML")}
        {renderEditor("toml", "TOML")}
      </div>
    </div>
  );
}

"use client";

import { useState, useCallback } from "react";
import { FileJsonIcon, UploadCloudIcon, ChevronRightIcon, ChevronDownIcon, BoxIcon } from "lucide-react";
import { ThreeJsonGalaxyTool } from "./3d-json-galaxy-tool";
// Simple recursive JSON Node viewer
const JsonNode = ({ data, name }: { data: any, name?: string }) => {
  const [expanded, setExpanded] = useState(true);
  
  if (data === null) return <span className="text-muted font-mono"><span className="text-fg opacity-50">{name ? `"${name}": ` : ""}</span>null</span>;
  if (typeof data === "boolean") return <span className="text-warning font-mono"><span className="text-fg opacity-50">{name ? `"${name}": ` : ""}</span>{data.toString()}</span>;
  if (typeof data === "number") return <span className="text-success font-mono"><span className="text-fg opacity-50">{name ? `"${name}": ` : ""}</span>{data}</span>;
  if (typeof data === "string") return <span className="text-accent font-mono"><span className="text-fg opacity-50">{name ? `"${name}": ` : ""}</span>"{data}"</span>;

  const isArray = Array.isArray(data);
  const keys = Object.keys(data);
  const isEmpty = keys.length === 0;

  if (isEmpty) {
    return <span className="text-fg font-mono">{name ? `"${name}": ` : ""}{isArray ? "[]" : "{}"}</span>;
  }

  return (
    <div className="font-mono text-sm leading-6">
      <div 
        className="flex items-center gap-1 cursor-pointer hover:bg-hover/50 rounded px-1 -ml-1 w-max"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? <ChevronDownIcon className="w-3 h-3 text-muted" /> : <ChevronRightIcon className="w-3 h-3 text-muted" />}
        <span className="text-fg opacity-50">{name ? `"${name}": ` : ""}</span>
        <span className="text-fg">{isArray ? "[" : "{"}</span>
        {!expanded && <span className="text-muted mx-2">... {keys.length} items ...</span>}
        {!expanded && <span className="text-fg">{isArray ? "]" : "}"}</span>}
      </div>
      
      {expanded && (
        <div className="pl-4 border-l border-line/50 ml-1.5 my-1">
          {keys.map((key, i) => (
            <div key={key}>
              <JsonNode data={data[key as keyof typeof data]} name={isArray ? undefined : key} />
              {i < keys.length - 1 && <span className="text-fg opacity-50">,</span>}
            </div>
          ))}
        </div>
      )}
      {expanded && <div className="text-fg ml-1">{isArray ? "]" : "}"}</div>}
    </div>
  );
};


export function JsonViewerTool() {
  const [jsonText, setJsonText] = useState("");
  const [parsed, setParsed] = useState<any>(null);
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [is3DMode, setIs3DMode] = useState(false);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setJsonText(text);
      tryParse(text);
    } catch (e) {
      console.error(e);
    }
  };

  const tryParse = (text: string) => {
    if (!text.trim()) {
      setParsed(null);
      setError("");
      return;
    }
    try {
      const obj = JSON.parse(text);
      setParsed(obj);
      setError("");
    } catch (e: any) {
      setError(e.message);
      setParsed(null);
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    
    setLoading(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setJsonText(text);
      tryParse(text);
      setLoading(false);
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-fg">Input JSON</label>
            <button onClick={handlePaste} className="btn btn-secondary btn-sm">Paste from Clipboard</button>
          </div>
          
          <div 
            className={`relative w-full h-[600px] border-2 border-dashed rounded-xl overflow-hidden transition-colors ${isDragging ? 'border-accent bg-accent/5' : 'border-line bg-card'}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleFileDrop}
          >
            {jsonText ? (
              <textarea
                aria-label="Input JSON"
                value={jsonText}
                onChange={(e) => { setJsonText(e.target.value); tryParse(e.target.value); }}
                className="absolute inset-0 w-full h-full p-4 bg-transparent resize-none font-mono text-xs outline-none focus:ring-2 focus:ring-accent/50"
                spellCheck={false}
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-muted pointer-events-none">
                <UploadCloudIcon className="w-12 h-12 mb-4 opacity-50" />
                <p className="font-semibold text-fg mb-1">Drag & Drop a JSON file here</p>
                <div className="pointer-events-auto mt-2">
                  <label className="cursor-pointer btn btn-primary btn-sm rounded-full px-6 shadow-md hover:scale-105 transition-transform">
                    Select JSON File
                    <input type="file" aria-label="Select JSON File" accept=".json,application/json" className="hidden" onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setLoading(true);
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        const text = ev.target?.result as string;
                        setJsonText(text);
                        tryParse(text);
                        setLoading(false);
                      };
                      reader.readAsText(file);
                    }} />
                  </label>
                </div>
                <p className="text-sm mt-4">or click Paste from Clipboard</p>
                <p className="text-xs mt-4 opacity-50 max-w-xs text-center">
                  Parsing happens entirely locally. Massive files up to 50MB are supported without crashing your browser.
                </p>
              </div>
            )}
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <label className="text-sm font-semibold text-fg">Interactive Viewer</label>
              {parsed && (
                <button onClick={() => setIs3DMode(!is3DMode)} className={`text-xs px-3 py-1 rounded-full font-medium transition-colors flex items-center gap-1 ${is3DMode ? "bg-accent text-white dark:text-[#050505]" : "bg-bg border border-line text-muted hover:text-fg"}`}>
                  <BoxIcon className="w-3 h-3" />
                  {is3DMode ? "Exit 3D Galaxy" : "تفعيل وضع مجرة 3D 🌌"}
                </button>
              )}
            </div>
            {parsed && !is3DMode && (
              <span className="text-xs bg-success/10 text-success px-2 py-1 rounded-full font-medium">Valid JSON</span>
            )}
          </div>
          {is3DMode && parsed !== null ? (
            <div className="border border-line rounded-xl overflow-hidden shadow-2xl">
              <ThreeJsonGalaxyTool providedJson={parsed} />
            </div>
          ) : (
            <div className="h-[600px] overflow-auto border border-line rounded-xl bg-bg p-4 shadow-inner">
              {loading ? (
                <div className="h-full flex items-center justify-center text-muted">
                  <div className="animate-pulse flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                    Parsing file...
                  </div>
                </div>
              ) : error ? (
                <div className="text-danger text-sm font-mono p-4 bg-danger/10 rounded-lg border border-danger/20">
                  <p className="font-bold mb-2">Syntax Error</p>
                  {error}
                </div>
              ) : parsed !== null ? (
                <JsonNode data={parsed} />
              ) : (
              <div className="h-full flex items-center justify-center text-muted flex-col gap-3">
                <FileJsonIcon className="w-8 h-8 opacity-20" />
                <p className="text-sm opacity-50">Output will appear here</p>
              </div>
            )}
          </div>
          )}
        </div>
      </div>
    </div>
  );
}

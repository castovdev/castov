"use client";

import { useMemo } from "react";
import { useUrlState } from "@/hooks/use-url-state";
import { useDeveloperPreferences } from "@/hooks/use-developer-preferences";
import { CodeEditor } from "@/components/ui/code-editor";

function generateTsInterfaces(jsonString: string, indent = "  "): string {
  try {
    const obj = JSON.parse(jsonString);
    let output = "";

    const parseObject = (name: string, itemObj: unknown): string => {
      if (typeof itemObj !== "object" || itemObj === null) {
        return "export type " + name + " = " + typeof itemObj + ";\n";
      }

      let ts = "export interface " + name + " {\n";
      for (const [key, value] of Object.entries(itemObj)) {
        if (value === null) {
          ts += indent + key + ": any;\n";
        } else if (Array.isArray(value)) {
          if (value.length > 0) {
            const first = value[0];
            if (typeof first === "object" && first !== null) {
              const typeName = key.charAt(0).toUpperCase() + key.slice(1) + "Item";
              output += parseObject(typeName, first) + "\n";
              ts += indent + key + ": " + typeName + "[];\n";
            } else {
              ts += indent + key + ": " + typeof first + "[];\n";
            }
          } else {
            ts += indent + key + ": any[];\n";
          }
        } else if (typeof value === "object") {
          const typeName = key.charAt(0).toUpperCase() + key.slice(1);
          output += parseObject(typeName, value) + "\n";
          ts += indent + key + ": " + typeName + ";\n";
        } else {
          ts += indent + key + ": " + typeof value + ";\n";
        }
      }
      ts += "}\n";
      return ts;
    };

    return parseObject("Root", obj) + "\n" + output;
  } catch (e) {
    return "// Error parsing JSON\n// " + (e as Error).message;
  }
}

export function JsonToTsTool() {
  const prefs = useDeveloperPreferences();
  const indent = prefs.indentStyle === "4" ? "    " : prefs.indentStyle === "tab" ? "\t" : "  ";
  const [json, setJson, shareJson] = useUrlState("json", "{\n  \"name\": \"John\",\n  \"age\": 30\n}");

  const ts = useMemo(() => generateTsInterfaces(json, indent), [json, indent]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">JSON to TypeScript</h2>
          <p className="text-muted text-sm mt-1">Convert JSON structures into TypeScript interfaces automatically.</p>
        </div>
        <button 
          onClick={shareJson}
          className="px-4 py-2 bg-primary text-primary-fg text-sm font-medium rounded hover:bg-primary/90 transition-colors"
        >
          Copy Share Link
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <h3 className="font-medium text-foreground">JSON Input</h3>
          </div>
          <CodeEditor 
            value={json} 
            onChange={(val) => setJson(val || "")} 
            language="json" 
            height="500px"
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <h3 className="font-medium text-foreground">TypeScript Output</h3>
          </div>
          <CodeEditor 
            value={ts} 
            language="typescript" 
            readOnly 
            height="500px"
          />
        </div>
      </div>
    </div>
  );
}
